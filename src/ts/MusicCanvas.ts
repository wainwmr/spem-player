// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import config from "./config";
import { PartType, Position, colors } from "./common";
import { MusicElement } from "./MusicElement";

import {
  Dictionary,
  Range,
  processLilypond,
  dict,
  ranges,
  barCount,
  frLocations,
} from "./lily";

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
  dict: Dictionary[][] = []; // HACK: bad name and data type
  ranges: Range[][][] = []; // HACK: bad data type
  source: string | null = null;

  isOnDevBranch =
    document.body.dataset.branch !== undefined &&
    document.body.dataset.branch !== ""; // "" means we're on main branch (production)
  fpsFrameCount = 0;
  fpsLastTime = 0;
  fpsValue = 0;
  shimmerLoopId: number = 0;
  oldTimeStamp: number = 0;

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

  constructor() {
    super();
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.#init();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("wheel", this.#preventVerticalScroll);
    cancelAnimationFrame(this.shimmerLoopId);
  }

  #startShimmerLoop() {
    const loop = () => {
      if (!this.playing) {
        this.draw();
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
    this.draw();
  }

  setPlaying(playing: string | boolean) {
    super.setPlaying(playing);
    if (this.playing) this.play();
  }

  async #init() {
    if (this.canvas != null) {
      return;
    }

    this.canvas = document.createElement("canvas");
    this.append(this.canvas);

    this.canvas.addEventListener("click", this.#canvasClicked.bind(this));
    this.canvas.addEventListener(
      "mousemove",
      this.#canvasHovered.bind(this),
      false
    );
    this.canvas.addEventListener("touchstart", this.#touchStarted.bind(this), {
      passive: false,
    });
    this.addEventListener("touchmove", this.#touchMoved.bind(this), {
      passive: false,
    });
    this.addEventListener("touchend", this.#touchEnded.bind(this), {
      passive: false,
    });
    this.addEventListener("wheel", this.#preventVerticalScroll, {
      passive: false,
    });

    this.#calculateCanvasSize();
    this.#showLoadingOnCanvas();

    processLilypond();

    // HACK: can't these just be returned from processLilypond()?
    this.dict = dict;
    this.ranges = ranges;

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

    this.falseRelationPulses = new Array(frLocations.length).fill(0);
    this.shimmerPhases = frLocations.map(() => Math.random() * Math.PI * 2);

    this.draw();
    this.#startShimmerLoop();
  }

  #calculateCanvasSize() {
    if (this.canvas == null) return;

    // this.canvas.width = this.clientWidth;
    // this.canvas.height = 300 * 2;
    this.canvas.width = 4000;
    this.canvas.height = 1000;

    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";

    this.barWidth = (this.canvas.width - 2 * this.canvasPadding) / 140;
    this.choirHeight =
      (this.canvas.height - 2 * this.canvasPadding) / config.choirs[0].length;
    this.partHeight = this.choirHeight / config.parts.length;
    // console.log("MusicCanvas: calculated bar choir and part sizes:", this.barWidth, this.choirHeight, this.partHeight);
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

  seek(pos: Position, direction: 1 | -1) {
    var intbar = Math.floor(pos.bar);
    const choirnotes = (this.dict[intbar] ?? []).filter(
      (x) => x.c == pos.choir
    );
    const singing = choirnotes.length != 0;

    // loop until we find a bar where choir is not doing what it's doing in currentBar
    while (intbar + direction >= 0 && intbar + direction <= barCount) {
      intbar = intbar + direction;
      const newsinging =
        this.dict[intbar].filter((x) => x.c == pos.choir).length != 0;
      if (singing !== newsinging) break;
    }
    return intbar;
  }

  play() {
    const self = this;
    function loop() {
      self.draw();

      if (self.playing) {
        window.requestAnimationFrame(loop);
        // setTimeout(frame, config.tempo / 10);
      }
    }
    window.requestAnimationFrame(loop);
    // setTimeout(frame, config.tempo / 10);
  }

  draw() {
    if (!this.canvas) return;
    if (ranges.length === 0 || dict.length === 0) return;
    if (!this.#shouldDraw()) return;

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

  #shouldDraw(): boolean {
    if (!this.playing) return true;
    const now = Date.now();
    const secondsPassed = (now - this.oldTimeStamp) / 1000;
    if (secondsPassed < 0.01) return false;
    this.oldTimeStamp = now;
    return true;
  }

  #updatePulses() {
    const isLight = this.#isLightMode();

    // If there are notes starting now, record their onset and duration
    const quant = Math.floor(this.bar * 16) / 16;
    const notes = this.dict[quant];
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
    if (this.bar <= 0 || this.bar > barCount) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(
      this.canvasPadding + this.bar * this.barWidth,
      this.canvasPadding
    );
    ctx.lineTo(
      this.canvasPadding + this.bar * this.barWidth,
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

    ctx.lineWidth = 0.9 * this.partHeight;
    ctx.lineCap = "round";
    for (var c = 0; c < config.choirs[0].length; c++) {
      for (var p = 0; p < config.parts.length; p++) {
        const startY =
          this.canvasPadding + c * this.choirHeight + p * this.partHeight;

        const list: { from: number; to: number }[] = this.ranges[c][p];
        list.forEach((r) => {
          const from = r.from;
          const to = r.to;

          ctx.beginPath();
          const startX = this.canvasPadding + (from + 0.3) * this.barWidth;
          const endX = this.canvasPadding + (to - 0.3) * this.barWidth;
          const Y = startY + this.partHeight / 2;
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

  #drawFalseRelationHotspot(ctx: CanvasRenderingContext2D) {
    const shimmerTime = Date.now() / 1000;
    for (let i = 0; i < frLocations.length; i++) {
      const loc = frLocations[i];
      const cx = this.canvasPadding + ((loc.from + loc.to) / 2) * this.barWidth;
      const phase = this.shimmerPhases[i];
      const alpha =
        MusicCanvas.FR_HOTSPOT_BASE_ALPHA +
        MusicCanvas.FR_HOTSPOT_ALPHA_RANGE *
          Math.sin(shimmerTime * MusicCanvas.FR_HOTSPOT_SHIMMER_SPEED + phase);

      const startY =
        this.canvasPadding + loc.c * this.choirHeight + loc.p * this.partHeight;
      const cy = startY + this.partHeight / 2;
      const hue = colors().choir[loc.c];
      const lightness = this.#getHotspotLightness(loc.c, loc.p);

      const radius = this.partHeight * MusicCanvas.FR_HOTSPOT_RADIUS_MULTIPLIER;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(
        0,
        `hsla(${hue}, ${MusicCanvas.FR_HOTSPOT_SATURATION}%, ${lightness}%, ${alpha})`
      );
      gradient.addColorStop(
        MusicCanvas.FR_HOTSPOT_GRADIENT_MID_STOP,
        `hsla(${hue}, ${MusicCanvas.FR_HOTSPOT_SATURATION}%, ${lightness}%, ${
          alpha * MusicCanvas.FR_HOTSPOT_GRADIENT_MID_ALPHA_FACTOR
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
  }

  #drawFalseRelationPulses(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < frLocations.length; i++) {
      const pulse = this.falseRelationPulses[i];
      if (pulse <= 0) continue;

      const loc = frLocations[i];
      const cx = this.canvasPadding + ((loc.from + loc.to) / 2) * this.barWidth;

      const startY =
        this.canvasPadding + loc.c * this.choirHeight + loc.p * this.partHeight;
      const cy = startY + this.partHeight / 2;

      const radius =
        this.partHeight * MusicCanvas.FR_PULSE_RADIUS_MULTIPLIER * pulse;
      const hue = colors().choir[loc.c];
      const lightness = MusicCanvas.SELECTED_BASE_LIGHTNESS;
      const centerAlpha = Math.min(
        MusicCanvas.FR_PULSE_MAX_ALPHA,
        pulse * MusicCanvas.FR_PULSE_ALPHA_FACTOR
      );
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(
        0,
        `hsla(${hue}, ${MusicCanvas.FR_HOTSPOT_SATURATION}%, ${lightness}%, ${centerAlpha})`
      );
      gradient.addColorStop(
        MusicCanvas.FR_PULSE_GRADIENT_MID_STOP,
        `hsla(${hue}, ${MusicCanvas.FR_HOTSPOT_SATURATION}%, ${lightness}%, ${
          centerAlpha * MusicCanvas.FR_PULSE_GRADIENT_MID_ALPHA_FACTOR
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

  #getMousePos(e: MouseEvent): Position {
    const rect = this.getBoundingClientRect();
    const clampedX = Math.max(
      this.canvasPadding,
      Math.min(e.offsetX, rect.width - this.canvasPadding)
    );
    const clampedY = Math.max(
      this.canvasPadding,
      Math.min(e.offsetY, rect.height - this.canvasPadding)
    );
    const y =
      ((clampedY - this.canvasPadding) * config.choirs[0].length) /
      (rect.height - 2 * this.canvasPadding);
    return {
      choir: Math.min(config.choirs[0].length - 1, Math.max(0, Math.floor(y))),
      part: Math.floor((y % 1) * config.parts.length),
      bar: Math.floor((clampedX * 140) / rect.width),
    };
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
    var rect = this.getBoundingClientRect();
    const touchX = e.targetTouches[0].clientX - rect.left;
    const touchY = e.targetTouches[0].clientY - rect.top;
    const clampedX = Math.max(
      this.canvasPadding,
      Math.min(touchX, rect.width - this.canvasPadding)
    );
    const clampedY = Math.max(
      this.canvasPadding,
      Math.min(touchY, rect.height - this.canvasPadding)
    );

    const y =
      ((clampedY - this.canvasPadding) * config.choirs[0].length) /
      (rect.height - 2 * this.canvasPadding);
    return {
      choir: Math.min(config.choirs[0].length - 1, Math.max(0, Math.floor(y))),
      part: "all",
      bar: Math.floor(((clampedX - this.canvasPadding) * 140) / rect.width),
    };
  }

  #touchStarted(e: TouchEvent) {
    e.preventDefault();
    this.#moveToPosition(this.#getTouchPos(e));
    this.fireEvent("music-canvas-touchstart");
    this.draw();
  }

  #touchMoved(evt: TouchEvent) {
    evt.preventDefault();
    this.#moveToPosition(this.#getTouchPos(evt));
    this.fireEvent("music-canvas-touchmove");
    this.draw();
  }

  #touchEnded(evt: TouchEvent) {
    evt.preventDefault();
    this.fireEvent("music-canvas-touchend");
    this.draw();
  }
}
