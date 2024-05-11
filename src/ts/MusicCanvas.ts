import { PartType, Position, colors, config } from "./common";
import { MusicElement } from "./MusicElement";

import { Dictionary, Range, processLilypond, dict, ranges } from "./lily";

export class MusicCanvas extends MusicElement {
  static observedAttributes = ["choir", "part", "bar", "playing"];

  canvas: HTMLCanvasElement | null = null;

  canvasPadding: number = 5;  // padding in px of the canvas
  barWidth: number = 0;
  choirHeight: number = 0;
  partHeight: number = 0;
  pulses: number[][] = [];
  dict: Dictionary[][] = [];  // HACK: bad name and data type
  ranges: Range[][][] = []; // HACK: bad data type
  source: string | null = null;

  constructor() {
    super();
  };

  async connectedCallback() {
    super.connectedCallback();
    await this.#init();
  }

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
      console.log("MusicCanvas: Already initialised. Nothing to do.");
      return;
    }

    this.canvas = document.createElement("canvas");
    this.append(this.canvas);

    this.canvas.addEventListener('click', this.#canvasClicked.bind(this));
    this.canvas.addEventListener('mousemove', this.#canvasHovered.bind(this), false);
    this.canvas.addEventListener('touchstart', this.#touchStarted.bind(this), { passive: false });

    this.#calculateCanvasSize();
    this.#showLoadingOnCanvas();

    await processLilypond(config.lilypond);

    // HACK: can't these just be returned from processLilypond()?
    this.dict = dict;
    this.ranges = ranges;

    // define array pulses[choir][part] to be min transparency which
    // will be pulsed when the choir is singing a note.
    for (var c = 0; c < config.choirs; c++) {
      this.pulses[c] = [];
      for (var p = 0; p < config.parts.length; p++) {
        this.pulses[c][p] = 1;
      }
    }

    this.draw();
  }

  #calculateCanvasSize() {
    if (this.canvas == null) return;

    // this.canvas.width = this.clientWidth;
    // this.canvas.height = 300 * 2;
    this.canvas.width = 4000;
    this.canvas.height = 1000;

    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";

    this.barWidth = (this.canvas.width - (2 * this.canvasPadding)) / 140;
    this.choirHeight = (this.canvas.height - (2 * this.canvasPadding)) / config.choirs;
    this.partHeight = this.choirHeight / config.parts.length;
    // console.log("MusicCanvas: calculated bar choir and part sizes:", this.barWidth, this.choirHeight, this.partHeight);
  };

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
    const choirnotes = this.dict[intbar].filter(x => x.c == pos.choir);
    const singing = choirnotes.length != 0;

    // loop until we find a bar where choir is not doing what it's doing in currentBar
    var changed = false;
    do {
      intbar = intbar + direction;
      const newsinging = (this.dict[intbar].filter(x => x.c == pos.choir).length != 0);
      changed = (singing != newsinging)
    } while (!changed && intbar > 0 && intbar < 139);
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

  oldTimeStamp: number = 0;
  draw() {
    if (!this.canvas) return;

    if (ranges.length === 0 || dict.length === 0) {
      console.log("MusicCanvas: not ready to draw!");
      return;
    }

    // Calculate frames per second
    var fps = 0;
    if (this.playing) {
      const now: number = Date.now();
      const secondsPassed = (now - this.oldTimeStamp) / 1000;
      if (secondsPassed < 0.01) return; // HACK: throttle
      this.oldTimeStamp = now;
      fps = secondsPassed === 0 ? 0 : Math.round(1 / secondsPassed);
    }


    // If there are notes playing, pulse the color's lightness for that voice part
    const quant = Math.floor(this.bar * 16) / 16;
    const notes = this.dict[quant];
    if (notes != undefined && notes.length > 0) {
      for (var n of notes) {
        if (n.n.duration != null) {
          this.pulses[n.c][n.p] = this.#easeOutCubic(this.bar % quant, 1.4, -0.4, n.n.duration.sfths / 128);
        }
      }
    }

    // Blank out the whole canvas
    const ctx = this.canvas.getContext("2d");
    if (ctx == null) return;

    ctx.fillStyle = colors().background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw FPS number to the screen
    if (fps) {
      ctx.font = '25px Arial';
      ctx.fillStyle = '#CCC';
      ctx.fillText("FPS: " + fps, 10, this.canvas.height - 30);
    }

    // Draw bar highlight
    if (this.bar > 0 && this.bar <= 139) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.canvasPadding + (this.bar * this.barWidth), this.canvasPadding);
      ctx.lineTo(this.canvasPadding + (this.bar * this.barWidth), this.canvas.height - this.canvasPadding);
      ctx.lineWidth = this.barWidth * 1.4;
      ctx.strokeStyle = colors().highlight;
      ctx.lineCap = "square";
      ctx.stroke();
      ctx.restore();
    }

    // Draw highlight line for the selected choir or choir and part
    var startY: number, width: number;
    if (this.voicePart != "all") {
      startY = this.canvasPadding + (this.choir * this.choirHeight) + (this.voicePart * this.partHeight);
      width = this.partHeight * 1.4;
    }
    else {
      // center the highlight on the middle tenor line
      startY = this.canvasPadding + (this.choir * this.choirHeight) + (2 * this.partHeight);
      width = (this.partHeight * 5.8);
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.canvasPadding + this.barWidth, startY + (this.partHeight / 2));
    ctx.lineTo(this.canvasPadding + (140 * this.barWidth) - this.barWidth, startY + (this.partHeight / 2));
    ctx.lineWidth = width;
    ctx.strokeStyle = colors().highlight;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // Draw each of the 40 voice parts
    ctx.lineWidth = 0.9 * this.partHeight;
    ctx.lineCap = "round";
    for (var c = 0; c < config.choirs; c++) {
      for (var p = 0; p < config.parts.length; p++) {
        const startY = this.canvasPadding + (c * this.choirHeight) + (p * this.partHeight);

        const list: { "from": number, "to": number }[] = this.ranges[c][p];
        list.forEach(r => {
          const from = r.from;
          const to = r.to;

          ctx.beginPath();
          // The weird 0.3 is because we're using rounded lines
          const startX = this.canvasPadding + ((from + 0.3) * this.barWidth);
          const endX = this.canvasPadding + ((to - 0.3) * this.barWidth);
          const Y = startY + (this.partHeight / 2);
          ctx.moveTo(startX, Y);
          ctx.lineTo(endX, Y);

          var lightness: number, saturation: number, transparency: number;

          // If current bar is highlighted
          if (this.bar >= from && this.bar < to) {
            saturation = 80;
            lightness = (67 - (3 * p)) * this.pulses[c][p];
            transparency = 1; // pulses[c][p];
          }
          // if current choir/part is highlighted
          else if (c == this.choir && (this.voicePart == "all" || p == this.voicePart)) {
            saturation = 80;
            lightness = 67 - (3 * p);
            transparency = 1;
          }
          // else if (c == currentChoir && p == currentPart) {
          //   lightness = 67 - (3 * p);
          //   saturation = 80;
          //   transparency = 1;
          // }
          else if (this.bar === 0 || this.bar > 138) {
            saturation = 50;
            lightness = 67 - (3 * p);
            transparency = 1;
          }
          else {
            saturation = 50;
            lightness = 67 - (3 * p);
            transparency = 0.5;
          }

          ctx.strokeStyle = `hsla(${colors().choir[c]}, ${saturation}%, ${lightness}%, ${transparency})`;
          ctx.stroke();
        });
      }
    }
  }

  // BUG: what happens if you click in the canvas padding?
  #getMousePos(e: MouseEvent): Position {
    // if (!this.config) return { choir: 0, part: 0, bar: 0 };

    const rect = this.getBoundingClientRect();
    const y = ((e.offsetY - this.canvasPadding) * config.choirs) / (rect.height - (2 * this.canvasPadding));
    return {
      choir: Math.min(config.choirs - 1, Math.max(0, Math.floor(y))),
      part: Math.floor((y % 1) * config.parts.length),
      bar: Math.floor((e.offsetX * 140) / rect.width)
    };
  }

  #moveToPosition(pos: Position) {
    this.choir = pos.choir;
    this.voicePart = pos.part;
    this.bar = pos.bar;
  }

  // TODO: combine canvasClicked and Hovered?
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

    const y = ((e.targetTouches[0].clientY - rect.top - this.canvasPadding) * config.choirs) / (rect.height - (2 * this.canvasPadding));
    return {
      choir: Math.min(config.choirs - 1, Math.max(0, Math.floor(y))),
      part: "all",
      bar: Math.floor((e.targetTouches[0].clientX - rect.left - this.canvasPadding) * 140 / rect.width)
    };
  }

  #touchStarted(e: TouchEvent) {
    e.preventDefault();
    this.#moveToPosition(this.#getTouchPos(e));
    this.fireEvent("music-canvas-touchstart");
    this.draw();

    this.addEventListener("touchmove", (evt: TouchEvent) => {
      evt.preventDefault();
      this.#moveToPosition(this.#getTouchPos(evt));
      this.fireEvent("music-canvas-touchmove");
      this.draw();
    });
    this.addEventListener("touchend", (evt: TouchEvent) => {
      evt.preventDefault();
      this.fireEvent("music-canvas-touchend");
      this.draw();
    });
  }
}