import { PartType, Position, colors, config, toNum } from "./common";

// TODO: don't need setupLilypondParse to be exported, do we?
import { Dictionary, Range, setupLilypondParser, processLilypond, dict, ranges } from "./lily";

export class MusicCanvas extends HTMLCanvasElement {
  // TODO: MusicCanvas should have its own playloop, not use index.ts to control it.
  // TODO: MusicCanvas needs state for { choir, part, bar, playing? }

  static observedAttributes = [ "choir", "part", "bar", "playing" ];

  choir: number = 0;
  voicePart: PartType = "all";
  bar: number = 0;
  playing: boolean = false;

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
    this.addEventListener('click', this.#canvasClicked.bind(this));
    this.addEventListener('mousemove', this.#canvasHovered.bind(this), false);
    this.addEventListener('touchstart', this.#touchStarted.bind(this), { passive: false });
  };

  async connectedCallback() {
    console.log("MusicCanvas added to page.");
    await this.#init();
  }

  disconnectedCallback() {
    console.log("MusicCanvas removed from page.");
  }

  adoptedCallback() {
    console.log("MusicCanvas moved to new page.");
  }
  
  async attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    switch (name) {
      case "choir":
        this.setChoir(newValue);
        break;
      case "part":
        this.setPart(newValue);
        break;
      case "bar":
        this.setBar(newValue);
        break;
      case "playing":
        this.setPlaying(newValue);
        break;
      default:
        break;
    }
  }

  setChoir(c: string | number) {
    this.choir = toNum(c, true, config.choirs - 1);
    this.draw();
  }

  setPart(p: string | PartType) {
    if (typeof p == 'string' && p == 'all') {
      this.voicePart = "all";
    }
    else {
      this.voicePart = toNum(p, true, config.parts.length - 1);
    }
    this.draw();
  }

  setBar(b: string | number) {
    this.bar = toNum(b, false, 139); // HACK: 139
    this.draw();
  }

  setPlaying(playing: string | boolean) {
    if ((typeof playing == "string" && playing == "true") || playing == true) {
      this.playing = true;
      this.play();
    }
    else {
      this.playing = false;
    }
  }

  async #init() {
    if (dict.length != 0) {
      console.log("MusicCanvas: Already initialised. Nothing to do.");
      return;
    }
    this.#calculateCanvasSize();
    this.#showLoadingOnCanvas();

    await setupLilypondParser();
    await processLilypond(config.lilypond);

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
    if (config == null) return;

    this.width = this.clientWidth * 4;
    this.height = 300 * 2;

    this.barWidth = (this.width - (2 * this.canvasPadding)) / 140;
    this.choirHeight = (this.height - (2 * this.canvasPadding)) / config.choirs;
    this.partHeight = this.choirHeight / config.parts.length;
    // console.log("MusicCanvas: calculated bar choir and part sizes:", this.barWidth, this.choirHeight, this.partHeight);
  };

  #showLoadingOnCanvas() {
    const ctx = this.getContext("2d");
    if (ctx != null) {
      ctx.save();
      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.scale(this.width / this.height, 1);
      ctx.fillText(`Loading...`, 0, this.height / 2);
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

  oldTimeStamp: number = 0;
  fps: number = 0;

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
    const ctx = this.getContext("2d");
    if (ctx == null) return;

    ctx.fillStyle = colors().background;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw FPS number to the screen
    if (fps) {
      ctx.font = '25px Arial';
      ctx.fillStyle = '#CCC';
      ctx.fillText("FPS: " + fps, 10, this.height - 30);
    }

    // Draw bar highlight
    if (this.bar > 0 && this.bar <= 139) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.canvasPadding + (this.bar * this.barWidth), this.canvasPadding);
      ctx.lineTo(this.canvasPadding + (this.bar * this.barWidth), this.height - this.canvasPadding);
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
  #getMousePos(evt: MouseEvent): Position {
    // if (!this.config) return { choir: 0, part: 0, bar: 0 };

    const rect = this.getBoundingClientRect();
    const y = ((evt.offsetY - this.canvasPadding) * config.choirs) / (rect.height - (2 * this.canvasPadding));
    return {
      choir: Math.min(config.choirs - 1, Math.max(0, Math.floor(y))),
      part: Math.floor((y % 1) * config.parts.length),
      bar: Math.floor((evt.offsetX * 140) / rect.width)
    };
  }

  // TODO: combine canvasClicked and Hovered?
  #canvasClicked(e: MouseEvent) {
    const pos: Position = this.#getMousePos(e);
    const myEvent = new CustomEvent("music-canvas-click", {
      detail: {
        position: pos
      },
      bubbles: true,
      cancelable: true,
      composed: false,
    });
    this.dispatchEvent(myEvent);
  }

  #canvasHovered(e: MouseEvent) {
    const pos: Position = this.#getMousePos(e);
    const myEvent = new CustomEvent("music-canvas-hover", {
      detail: {
        position: pos
      },
      bubbles: true,
      cancelable: true,
      composed: false,
    });
    this.dispatchEvent(myEvent);
  }

  #getTouchPos(evt: TouchEvent): Position {
    var rect = this.getBoundingClientRect();

    const y = ((evt.targetTouches[0].clientY - rect.top - this.canvasPadding) * config.choirs) / (rect.height - (2 * this.canvasPadding));
    return {
      choir: Math.min(config.choirs - 1, Math.max(0, Math.floor(y))),
      part: "all",
      bar: Math.floor((evt.targetTouches[0].clientX - rect.left - this.canvasPadding) * 140 / rect.width)
    };
  }

  #touchStarted(evt: TouchEvent) {
    evt.preventDefault();
    const pos: Position = this.#getTouchPos(evt);

    console.log("Touch started at", pos);
    this.choir = pos.choir;
    this.voicePart = "all";
    this.bar = pos.bar;
    this.draw();

    this.addEventListener("touchmove", (evt) => {
      const pos = this.#getTouchPos(evt);

      console.log("Touch moved at", pos);
      this.choir = pos.choir;
      this.voicePart = "all";
      this.bar = pos.bar;
      this.draw();
      });
    this.addEventListener("touchend", () => {
      const pos = this.#getTouchPos(evt);

      console.log("Touch ended at", pos);
      this.setAttribute("choir", String(pos.choir));
      this.setAttribute("part", "all");
      this.setAttribute("bar", String(pos.bar));
      this.draw();
      });
  }
}

window.customElements.define("music-canvas", MusicCanvas, { extends: "canvas" });