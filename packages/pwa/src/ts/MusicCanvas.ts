// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import config from "./config";
import { PartType, Position, colors } from "./common";
import { MusicElement } from "./MusicElement";

import { LilypondData, processLilypond } from "./lily";

export class MusicCanvas extends MusicElement {
  static observedAttributes = ["choir", "part", "bar", "playing"];

  canvas: HTMLCanvasElement | null = null;

  canvasPadding: number = 5; // padding in px of the canvas
  barWidth: number = 0;
  choirHeight: number = 0;
  partHeight: number = 0;
  pulses: number[][] = [];
  lastNoteStart: number[][] = [];
  lastNoteDuration: number[][] = [];
  falseRelationPulses: number[] = [];
  shimmerPhases: number[] = [];
  // All parsed score data arrives together from one processLilypond() call, so
  // it is held as one nullable object: null until #init populates it, never
  // partially filled (#652). The entry points draw(), #startShimmerLoop(), and
  // the public seek() guard on null; the post-init draw helpers and pointer
  // handlers read `lilyData!`. (#updatePulses also guards defensively but is
  // reached only via the already-guarded draw().)
  lilyData: LilypondData | null = null;
  source: string | null = null;

  isOnDevBranch =
    document.body.dataset.branch !== undefined &&
    document.body.dataset.branch !== ""; // "" means we're on main branch (production)
  fpsFrameCount = 0;
  fpsLastTime = 0;
  fpsValue = 0;
  shimmerLoopId: number = 0;
  playLoopId: number = 0;

  // Base lightness for unselected parts in light mode.
  static readonly DULL_BASE_LIGHTNESS_LIGHT = 80;
  // Base lightness for unselected parts in dark mode.
  static readonly DULL_BASE_LIGHTNESS_DARK = 38;
  // Base lightness for selected parts before part-index offset.
  static readonly SELECTED_BASE_LIGHTNESS = 45;

  // --- False-relation visual tuning constants ---

  // Playback pulse: how long the flash lasts after the FR starts (bars).
  static readonly FR_PULSE_FADE_BARS = 0.4;
  // Playback pulse: radius as a multiple of partHeight.
  static readonly FR_PULSE_RADIUS_MULTIPLIER = 2.5;
  // Playback pulse: HSL saturation (%).
  static readonly FR_PULSE_SATURATION = 100;
  // Playback pulse: peak lightness in dark mode (%).
  static readonly FR_PULSE_LIGHTNESS_DARK = 90;
  // Playback pulse: peak lightness in light mode (%).
  static readonly FR_PULSE_LIGHTNESS_LIGHT = 50;
  // Playback pulse: maximum opacity (0-1).
  static readonly FR_PULSE_MAX_ALPHA = 1.0;
  // Playback pulse: opacity multiplier applied to pulse strength.
  static readonly FR_PULSE_ALPHA_FACTOR = 1;
  // Playback pulse: gradient mid-stop position (0 = centre, 1 = edge).
  static readonly FR_PULSE_GRADIENT_MID_STOP = 0.5;
  // Playback pulse: opacity at mid-stop as a fraction of centre alpha.
  static readonly FR_PULSE_GRADIENT_MID_ALPHA_FACTOR = 0.7;

  // Hotspot shimmer: speed of the breathing sine wave (radians per second).
  static readonly FR_HOTSPOT_SHIMMER_SPEED = 6;
  // Hotspot shimmer: midpoint opacity around which the sine wave oscillates.
  static readonly FR_HOTSPOT_BASE_ALPHA = 0.8;
  // Hotspot shimmer: amplitude of the opacity oscillation.
  static readonly FR_HOTSPOT_ALPHA_RANGE = 0.2;
  // Hotspot: radius as a fraction of partHeight.
  static readonly FR_HOTSPOT_RADIUS_MULTIPLIER = 0.6;
  // Hotspot: HSL saturation (%).
  static readonly FR_HOTSPOT_SATURATION = 100;
  // Hotspot: gradient mid-stop position (0 = centre, 1 = edge).
  static readonly FR_HOTSPOT_GRADIENT_MID_STOP = 0.25;
  // Hotspot: opacity at mid-stop as a fraction of centre alpha.
  static readonly FR_HOTSPOT_GRADIENT_MID_ALPHA_FACTOR = 0.4;

  // Paused idle redraw: minimum gap between shimmer-loop redraws while paused.
  // ~10fps is enough for the breathing hotspot; the static grid never changes
  // while paused, so redrawing it every rAF tick is wasted CPU/battery (#649).
  static readonly SHIMMER_IDLE_INTERVAL_MS = 100;
  // rAF timestamp of the last paused shimmer redraw, for the idle throttle.
  #lastShimmerDraw = 0;

  #boundCanvasClicked = this.#canvasClicked.bind(this);
  #boundCanvasHovered = this.#canvasHovered.bind(this);
  #boundTouchStarted = this.#touchStarted.bind(this);
  #boundTouchMoved = this.#touchMoved.bind(this);
  #boundTouchEnded = this.#touchEnded.bind(this);

  constructor() {
    super();
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.#init();
    if (!this.playing && this.shimmerLoopId === 0) {
      this.#startShimmerLoop();
    }
    // disconnectedCallback cancels the play loop but leaves `playing` true,
    // so a reconnect during playback must restart it — without this the
    // canvas freezes silently (setBar skips its draw while playing, #554).
    if (this.playing && this.playLoopId === 0) {
      this.play();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.canvas) {
      this.canvas.removeEventListener("click", this.#boundCanvasClicked);
      this.canvas.removeEventListener(
        "mousemove",
        this.#boundCanvasHovered,
        false
      );
      this.canvas.removeEventListener("touchstart", this.#boundTouchStarted);
    }
    this.removeEventListener("touchmove", this.#boundTouchMoved);
    this.removeEventListener("touchend", this.#boundTouchEnded);
    this.removeEventListener("wheel", this.#preventVerticalScroll);
    cancelAnimationFrame(this.shimmerLoopId);
    cancelAnimationFrame(this.playLoopId);
    this.shimmerLoopId = 0;
    this.playLoopId = 0;
  }

  #startShimmerLoop() {
    // Nothing animates while paused unless there are false-relation hotspots
    // to breathe, so skip the loop entirely when there are none (#649).
    if (this.lilyData == null || this.lilyData.frLocations.length === 0) return;
    const loop = (timestamp: number) => {
      if (!this.playing) {
        // Throttle to the idle interval: the breathing hotspot does not need
        // display-refresh-rate redraws, and the rest of the scene is static
        // while paused (#649). Use the rAF timestamp, not Date.now(), so the
        // throttle is tied to the animation-frame clock.
        if (
          timestamp - this.#lastShimmerDraw >=
          MusicCanvas.SHIMMER_IDLE_INTERVAL_MS
        ) {
          this.draw();
          this.#lastShimmerDraw = timestamp;
        }
      }
      this.shimmerLoopId = requestAnimationFrame(loop);
    };
    this.shimmerLoopId = requestAnimationFrame(loop);
  }

  #preventVerticalScroll = (e: WheelEvent) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
    }
  };

  // setChoir/setPart draw unconditionally: the controls loop fires
  // music-controls-changed every tick during playback, but index.ts only
  // writes the canvas's choir/part attributes when the value actually
  // changed (and MusicElement.attributeChangedCallback drops any same-value
  // write), so these setters run at interaction rate. bar changes every
  // tick, hence setBar's guard below.
  setChoir(c: string | number) {
    super.setChoir(c);
    this.draw();
  }

  setPart(p: string | PartType) {
    super.setPart(p);
    this.draw();
  }

  setBar(b: string | number) {
    super.setBar(b);
    // During playback the play loop renders every rAF tick, and the controls
    // loop drives setBar at the same rate — drawing here too would double
    // the render rate (#554). When paused, the shimmer loop still redraws
    // every rAF tick; this synchronous draw just renders a bar change
    // immediately rather than on the next shimmer frame.
    if (!this.playing) {
      this.draw();
    }
  }

  setPlaying(playing: string | boolean) {
    super.setPlaying(playing);
    if (this.playing) {
      this.play();
    } else {
      cancelAnimationFrame(this.playLoopId);
      this.playLoopId = 0;
    }
  }

  async #init() {
    const existing = this.canvas;
    if (existing != null) {
      // Reconnect: re-attach listeners only; the first-init work below already
      // ran on first connect and must not repeat (#651).
      this.#attachListeners(existing);
      return;
    }

    const canvas = document.createElement("canvas");
    this.canvas = canvas;
    this.append(canvas);
    this.#attachListeners(canvas);

    this.#calculateCanvasSize();
    this.#showLoadingOnCanvas();

    this.lilyData = processLilypond();

    // define array pulses[choir][part] to be min transparency which
    // will be pulsed when the choir is singing a note.
    for (var c = 0; c < config.choirs[0].length; c++) {
      this.pulses[c] = [];
      this.lastNoteStart[c] = [];
      this.lastNoteDuration[c] = [];
      for (var p = 0; p < config.parts.length; p++) {
        this.pulses[c][p] = 1;
        this.lastNoteStart[c][p] = 0;
        this.lastNoteDuration[c][p] = 0;
      }
    }

    const { frLocations } = this.lilyData;
    this.falseRelationPulses = new Array(frLocations.length).fill(0);
    this.shimmerPhases = frLocations.map(() => Math.random() * Math.PI * 2);

    this.draw();
    this.#startShimmerLoop();
  }

  // Registers the canvas/element listeners, shared by both #init paths (first
  // connect and reconnect) so the registration lives in one place. The matching
  // removals are in disconnectedCallback — change both together.
  #attachListeners(canvas: HTMLCanvasElement) {
    canvas.addEventListener("click", this.#boundCanvasClicked);
    canvas.addEventListener("mousemove", this.#boundCanvasHovered, false);
    canvas.addEventListener("touchstart", this.#boundTouchStarted, {
      passive: false,
    });
    this.addEventListener("touchmove", this.#boundTouchMoved, {
      passive: false,
    });
    this.addEventListener("touchend", this.#boundTouchEnded, {
      passive: false,
    });
    this.addEventListener("wheel", this.#preventVerticalScroll, {
      passive: false,
    });
  }

  #calculateCanvasSize() {
    if (this.canvas == null) return;

    this.canvas.width = 4000;
    this.canvas.height = 1000;

    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";

    this.barWidth = (this.canvas.width - 2 * this.canvasPadding) / 140;
    this.choirHeight =
      (this.canvas.height - 2 * this.canvasPadding) / config.choirs[0].length;
    this.partHeight = this.choirHeight / config.parts.length;
  }

  #showLoadingOnCanvas() {
    if (this.canvas == null) return;

    const ctx = this.canvas.getContext("2d");
    if (ctx != null) {
      ctx.save();
      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.scale(this.canvas.width / this.canvas.height, 1);
      ctx.fillText(`Loading...`, 0, this.canvas.height / 2);
      ctx.restore();
    }
  }

  #easeOutCubic(t: number, b: number, c: number, d: number) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
  }

  seek(pos: Position, direction: 1 | -1): number {
    // A choir is "singing" wherever ANY of its parts has a range covering the
    // bar, so its state changes at the edges of those ranges. Those edges can
    // fall on fractional bars; `notesByQuant` is keyed by fractional quant
    // positions, so the old integer scan stepped right over them (#598). `ranges`
    // is the boundary-bearing source, and walking its edges is O(sections), not
    // O(bars).
    // seek is public on the custom element; tolerate a call before #init.
    if (this.lilyData == null) return pos.bar;
    const { ranges, barCount } = this.lilyData;
    const singingAt = (bar: number): boolean => {
      for (let p = 0; p < config.parts.length; p++) {
        const list = ranges.get(`${pos.choir}-${p}`);
        if (list?.some((r) => bar >= r.from && bar < r.to)) return true;
      }
      return false;
    };

    // Every part-range edge for this choir, de-duplicated and sorted.
    const edges = new Set<number>();
    for (let p = 0; p < config.parts.length; p++) {
      for (const r of ranges.get(`${pos.choir}-${p}`) ?? []) {
        edges.add(r.from);
        edges.add(r.to);
      }
    }
    const sorted = [...edges].sort((a, b) => a - b);

    // Keep only edges where the COLLECTIVE "any part singing" state actually
    // flips — contiguous or overlapping parts can leave inner edges that do not
    // change it. Sample `singingAt` at the MIDPOINT between consecutive edges,
    // not on an edge itself: ranges are half-open ([from, to)), so a sample
    // exactly on an edge is ambiguous, whereas the midpoint reads the settled
    // state of the whole interval below `b`. The first edge is compared against
    // `false` (i === 0), encoding that a choir is silent before its first edge.
    const flips = sorted.filter((b, i) => {
      const below = i === 0 ? false : singingAt((sorted[i - 1] + b) / 2);
      return singingAt(b) !== below;
    });

    // Strict `>` / `<`: a seek already sitting exactly on a flip edge advances
    // PAST it, so repeated key-presses keep moving rather than sticking on the
    // current bar.
    if (direction > 0) {
      const next = flips.find((b) => b > pos.bar);
      return next === undefined ? barCount : Math.min(next, barCount);
    }
    const prev = [...flips].reverse().find((b) => b < pos.bar);
    return prev === undefined ? 0 : Math.max(prev, 0);
  }

  play() {
    if (this.playLoopId) {
      cancelAnimationFrame(this.playLoopId);
    }
    const self = this;
    function loop() {
      self.draw();

      if (self.playing) {
        self.playLoopId = window.requestAnimationFrame(loop);
      } else {
        self.playLoopId = 0;
      }
    }
    this.playLoopId = window.requestAnimationFrame(loop);
  }

  draw() {
    if (!this.canvas) return;
    if (this.lilyData == null) return;
    // A non-null lilyData is fully populated, but a degenerate parse can yield
    // zero notes; preserve the pre-#652 short-circuit so an empty score renders
    // nothing rather than an empty grid.
    if (this.lilyData.notesByQuant.size === 0) return;

    this.#updatePulses();

    const ctx = this.canvas.getContext("2d");
    if (ctx == null) return;

    this.#clearCanvas(ctx);
    this.#drawBarHighlight(ctx);
    this.#drawSelectionHighlight(ctx);
    this.#drawVoiceParts(ctx);
    this.#drawDev(ctx);
    this.#drawFalseRelationHotspot(ctx);
    this.#drawFalseRelationPulses(ctx);
  }

  #updatePulses() {
    if (this.lilyData == null) return;
    const { notesByQuant, frLocations } = this.lilyData;
    const isLight = this.#isLightMode();

    // If there are notes starting now, record their onset and duration
    const quant = Math.floor(this.bar * 128) / 128;
    const notes = notesByQuant.get(quant);
    if (notes != undefined && notes.length > 0) {
      for (var n of notes) {
        if (n.n.duration != null) {
          this.lastNoteStart[n.c][n.p] = quant;
          this.lastNoteDuration[n.c][n.p] = n.n.duration.sfths / 128;
        }
      }
    }

    // Update pulses for all parts based on elapsed time since last note onset
    for (var c = 0; c < config.choirs[0].length; c++) {
      for (var p = 0; p < config.parts.length; p++) {
        const elapsed = this.bar - this.lastNoteStart[c][p];
        if (elapsed >= 0 && elapsed < this.lastNoteDuration[c][p]) {
          this.pulses[c][p] = this.#easeOutCubic(
            elapsed,
            isLight ? 0.4 : 1.6,
            isLight ? 0.6 : -0.6,
            this.lastNoteDuration[c][p]
          );
        } else {
          this.pulses[c][p] = 1;
        }
      }
    }

    // Pulse false relations
    for (let i = 0; i < frLocations.length; i++) {
      const loc = frLocations[i];
      if (
        this.bar >= loc.from &&
        this.bar < loc.from + MusicCanvas.FR_PULSE_FADE_BARS
      ) {
        const elapsed = this.bar - loc.from;
        const t = Math.min(1, elapsed / MusicCanvas.FR_PULSE_FADE_BARS);
        this.falseRelationPulses[i] = Math.sqrt(1 - t);
      } else {
        this.falseRelationPulses[i] = 0;
      }
    }
  }

  #clearCanvas(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = colors().background;
    ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
  }

  #drawBarHighlight(ctx: CanvasRenderingContext2D) {
    if (this.bar <= 0 || this.bar > this.lilyData!.barCount) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(
      this.canvasPadding + (this.bar + 0.5) * this.barWidth,
      this.canvasPadding
    );
    ctx.lineTo(
      this.canvasPadding + (this.bar + 0.5) * this.barWidth,
      this.canvas!.height - this.canvasPadding
    );
    ctx.lineWidth = this.barWidth * 1.4;
    ctx.strokeStyle = colors().highlight;
    ctx.lineCap = "square";
    ctx.stroke();
    ctx.restore();
  }

  #drawSelectionHighlight(ctx: CanvasRenderingContext2D) {
    var startY: number, width: number;
    if (this.voicePart != "all") {
      startY =
        this.canvasPadding +
        this.choir * this.choirHeight +
        this.voicePart * this.partHeight;
      width = this.partHeight * 1.4;
    } else {
      startY =
        this.canvasPadding +
        this.choir * this.choirHeight +
        2 * this.partHeight;
      width = this.partHeight * 5.8;
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(
      this.canvasPadding + this.barWidth,
      startY + this.partHeight / 2
    );
    ctx.lineTo(
      this.canvasPadding + 140 * this.barWidth - this.barWidth,
      startY + this.partHeight / 2
    );
    ctx.lineWidth = width;
    ctx.strokeStyle = colors().highlight;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }

  #drawVoiceParts(ctx: CanvasRenderingContext2D) {
    const dullBaseLightness = this.#isLightMode()
      ? MusicCanvas.DULL_BASE_LIGHTNESS_LIGHT
      : MusicCanvas.DULL_BASE_LIGHTNESS_DARK;

    const { ranges, barCount } = this.lilyData!;
    ctx.lineWidth = 0.9 * this.partHeight;
    ctx.lineCap = "round";
    for (var c = 0; c < config.choirs[0].length; c++) {
      for (var p = 0; p < config.parts.length; p++) {
        const Y = this.#partRowCenterY(c, p);

        // processLilypond seeds every `${c}-${p}` key, so this lookup is total
        // here (unlike seek's tolerant `?? []`). #652.
        const list = ranges.get(`${c}-${p}`)!;
        list.forEach((r) => {
          const from = r.from;
          const to = r.to;

          ctx.beginPath();
          const startX = this.canvasPadding + (from + 0.3) * this.barWidth;
          const endX = this.canvasPadding + (to - 0.3) * this.barWidth;
          ctx.moveTo(startX, Y);
          ctx.lineTo(endX, Y);

          var lightness: number, saturation: number, transparency: number;

          if (this.bar >= from && this.bar < to) {
            saturation = 80;
            lightness =
              (MusicCanvas.SELECTED_BASE_LIGHTNESS - 3 * p) * this.pulses[c][p];
            transparency = 1;
          } else if (
            c == this.choir &&
            (this.voicePart == "all" || p == this.voicePart)
          ) {
            saturation = 80;
            lightness = MusicCanvas.SELECTED_BASE_LIGHTNESS - 3 * p;
            transparency = 1;
          } else if (this.bar === 0 || this.bar > barCount) {
            saturation = 50;
            lightness = MusicCanvas.SELECTED_BASE_LIGHTNESS - 3 * p;
            transparency = 1;
          } else {
            saturation = 50;
            lightness = dullBaseLightness - 3 * p;
            transparency = 1;
          }

          ctx.strokeStyle = `hsla(${colors().choir[c]}, ${saturation}%, ${lightness}%, ${transparency})`;
          ctx.stroke();
        });
      }
    }
  }

  #drawDev(ctx: CanvasRenderingContext2D) {
    if (!this.isOnDevBranch) return;
    const now = Date.now();
    this.fpsFrameCount++;
    if (now - this.fpsLastTime >= 1000) {
      this.fpsValue = Math.round(
        (this.fpsFrameCount * 1000) / (now - this.fpsLastTime)
      );
      this.fpsFrameCount = 0;
      this.fpsLastTime = now;
    }
    ctx.fillStyle = this.#isLightMode() ? "black" : "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Bar: ${this.bar.toFixed(3)}`, 10, this.canvas!.height - 32);
    ctx.fillText(`FPS: ${this.fpsValue}`, 10, this.canvas!.height - 10);
  }

  #partRowCenterY(c: number, p: number): number {
    return (
      this.canvasPadding +
      c * this.choirHeight +
      p * this.partHeight +
      this.partHeight / 2
    );
  }

  #drawFalseRelationGlow(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    hue: number,
    lightness: number,
    centerAlpha: number,
    midStop: number,
    midAlphaFactor: number
  ) {
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(
      0,
      `hsla(${hue}, ${MusicCanvas.FR_HOTSPOT_SATURATION}%, ${lightness}%, ${centerAlpha})`
    );
    gradient.addColorStop(
      midStop,
      `hsla(${hue}, ${MusicCanvas.FR_HOTSPOT_SATURATION}%, ${lightness}%, ${
        centerAlpha * midAlphaFactor
      })`
    );
    gradient.addColorStop(
      1,
      `hsla(${hue}, ${MusicCanvas.FR_HOTSPOT_SATURATION}%, ${lightness}%, 0)`
    );
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  #drawFalseRelationHotspot(ctx: CanvasRenderingContext2D) {
    const { frLocations } = this.lilyData!;
    const shimmerTime = Date.now() / 1000;
    for (let i = 0; i < frLocations.length; i++) {
      const loc = frLocations[i];
      const cx = this.canvasPadding + ((loc.from + loc.to) / 2) * this.barWidth;
      const phase = this.shimmerPhases[i];
      const alpha =
        MusicCanvas.FR_HOTSPOT_BASE_ALPHA +
        MusicCanvas.FR_HOTSPOT_ALPHA_RANGE *
          Math.sin(shimmerTime * MusicCanvas.FR_HOTSPOT_SHIMMER_SPEED + phase);

      const cy = this.#partRowCenterY(loc.c, loc.p);
      const hue = colors().choir[loc.c];
      const lightness = this.#getHotspotLightness(loc.c, loc.p);

      const radius = this.partHeight * MusicCanvas.FR_HOTSPOT_RADIUS_MULTIPLIER;
      this.#drawFalseRelationGlow(
        ctx,
        cx,
        cy,
        radius,
        hue,
        lightness,
        alpha,
        MusicCanvas.FR_HOTSPOT_GRADIENT_MID_STOP,
        MusicCanvas.FR_HOTSPOT_GRADIENT_MID_ALPHA_FACTOR
      );
    }
  }

  #drawFalseRelationPulses(ctx: CanvasRenderingContext2D) {
    const { frLocations } = this.lilyData!;
    for (let i = 0; i < frLocations.length; i++) {
      const pulse = this.falseRelationPulses[i];
      if (pulse <= 0) continue;

      const loc = frLocations[i];
      const cx = this.canvasPadding + ((loc.from + loc.to) / 2) * this.barWidth;

      const cy = this.#partRowCenterY(loc.c, loc.p);

      const radius =
        this.partHeight * MusicCanvas.FR_PULSE_RADIUS_MULTIPLIER * pulse;
      const hue = colors().choir[loc.c];
      const lightness = MusicCanvas.SELECTED_BASE_LIGHTNESS;
      const centerAlpha = Math.min(
        MusicCanvas.FR_PULSE_MAX_ALPHA,
        pulse * MusicCanvas.FR_PULSE_ALPHA_FACTOR
      );
      this.#drawFalseRelationGlow(
        ctx,
        cx,
        cy,
        radius,
        hue,
        lightness,
        centerAlpha,
        MusicCanvas.FR_PULSE_GRADIENT_MID_STOP,
        MusicCanvas.FR_PULSE_GRADIENT_MID_ALPHA_FACTOR
      );
    }
  }

  #isLightMode(): boolean {
    return document.body.classList.contains("light-theme");
  }

  #getHotspotLightness(c: number, p: number): number {
    const isLight = this.#isLightMode();
    const isSelected =
      c == this.choir && (this.voicePart == "all" || p == this.voicePart);
    const dullBase = isLight
      ? MusicCanvas.DULL_BASE_LIGHTNESS_LIGHT
      : MusicCanvas.DULL_BASE_LIGHTNESS_DARK;
    const baseLight = isSelected
      ? MusicCanvas.SELECTED_BASE_LIGHTNESS - 3 * p
      : dullBase - 3 * p;
    return (baseLight + 50) % 100;
  }

  // Shared mouse/touch projection. `x`/`y` are element-local CSS pixels. The
  // canvas is drawn at 4000x1000 internal pixels with a fixed `canvasPadding`,
  // then scaled to fit its CSS box, so the padding must be scaled into CSS
  // pixels on BOTH axes to invert the drawing faithfully. Scaling only X (the
  // #204 fix) left the Y mapping inconsistent on short viewports — a tap toward
  // the top or bottom of a short viewport could resolve to the wrong row (the
  // two mappings coincide at the exact centre and diverge toward the edges);
  // scaling Y as well is the Y-twin of that fix (refactor item 12).
  #projectToPosition(
    x: number,
    y: number,
    partResolver: (rowFraction: number) => PartType
  ): Position {
    const rect = this.getBoundingClientRect();
    const cssPaddingX = this.canvasPadding * (rect.width / this.canvas!.width);
    const cssPaddingY =
      this.canvasPadding * (rect.height / this.canvas!.height);
    const drawableWidth = rect.width - 2 * cssPaddingX;
    const drawableHeight = rect.height - 2 * cssPaddingY;
    // A zero-area or unmeasured canvas has no meaningful position: the
    // divisions below would yield NaN, which would flow into the public
    // position event and silently corrupt state. Production CSS min-height
    // keeps this unreachable; the guard returns the origin rather than NaN.
    if (drawableWidth <= 0 || drawableHeight <= 0) {
      return { choir: 0, part: partResolver(0), bar: 0 };
    }
    const clampedX = Math.max(
      cssPaddingX,
      Math.min(x, rect.width - cssPaddingX)
    );
    const clampedY = Math.max(
      cssPaddingY,
      Math.min(y, rect.height - cssPaddingY)
    );
    const rowFraction =
      ((clampedY - cssPaddingY) * config.choirs[0].length) / drawableHeight;
    return {
      choir: Math.min(
        config.choirs[0].length - 1,
        Math.max(0, Math.floor(rowFraction))
      ),
      part: partResolver(rowFraction),
      bar: Math.floor(
        ((clampedX - cssPaddingX) * this.lilyData!.barCount) / drawableWidth
      ),
    };
  }

  #getMousePos(e: MouseEvent): Position {
    return this.#projectToPosition(e.offsetX, e.offsetY, (rowFraction) =>
      Math.floor((rowFraction % 1) * config.parts.length)
    );
  }

  #moveToPosition(pos: Position) {
    this.choir = pos.choir;
    this.voicePart = pos.part;
    this.bar = pos.bar;
  }

  #canvasClicked(e: MouseEvent) {
    this.#moveToPosition(this.#getMousePos(e));
    this.fireEvent("music-canvas-click");
  }

  #canvasHovered(e: MouseEvent) {
    const pos: Position = this.#getMousePos(e);
    this.fireEvent("music-canvas-hover", pos);
  }

  #getTouchPos(e: TouchEvent): Position {
    const rect = this.getBoundingClientRect();
    // changedTouches, not targetTouches: targetTouches is filtered to
    // touches still on the target element, so it is empty once the
    // finger drags off the canvas — which used to crash this getter.
    // changedTouches contains the touch that triggered the event
    // regardless of whether it remains within the target's bounds,
    // and is guaranteed non-empty for touchstart/move/end/cancel.
    // The clamp in #projectToPosition pins out-of-bounds drags to the edge.
    const touchX = e.changedTouches[0].clientX - rect.left;
    const touchY = e.changedTouches[0].clientY - rect.top;
    // Touch deliberately resolves to the whole choir (`part: "all"`, see #327).
    return this.#projectToPosition(touchX, touchY, () => "all");
  }

  #touchStarted(e: TouchEvent) {
    e.preventDefault();
    this.#moveToPosition(this.#getTouchPos(e));
    this.fireEvent("music-canvas-touchstart");
    this.draw();
  }

  #touchMoved(evt: TouchEvent) {
    evt.preventDefault();
    // Intentionally does NOT commit position — see #317/#326. Per-touchmove
    // commits caused 60+/s state churn during drag, silently switching to
    // `voicePart: "all"` (since `#getTouchPos` hard-codes "all", see #327).
    // `#touchStarted` is the commit point; `#touchEnded` fires a separate
    // event that `index.ts` routes through `handleCanvasClick`.
    this.fireEvent("music-canvas-touchmove");
    this.draw();
  }

  #touchEnded(evt: TouchEvent) {
    evt.preventDefault();
    this.fireEvent("music-canvas-touchend");
    this.draw();
  }
}
