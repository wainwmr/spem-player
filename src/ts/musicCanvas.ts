import { Position, colors, config } from "./common";

// TODO: don't need setupLilypondParse to be exported, do we?
import { setupLilypondParser, processLilypond, dict, ranges } from "./lily";

import { Dictionary, Range } from "./lily";

export class MusicCanvas extends HTMLCanvasElement {
  // static observedAttributes = [ "config" ];

  // ens: Ensemble;
  // config: Config | null = null;
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
    this.addEventListener('click', this.canvasClicked.bind(this));
    this.addEventListener('mousemove', this.canvasHovered.bind(this), false);
    this.addEventListener("touchstart", this.touchStarted, { passive: false });
  };

  async connectedCallback() {
    console.log("MusicCanvas added to page.");
    await this.init();
  }

  disconnectedCallback() {
    console.log("MusicCanvas removed from page.");
  }

  adoptedCallback() {
    console.log("MusicCanvas moved to new page.");
  }

  async attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    console.log(`MusicCanvas: Attribute ${name} has changed from ${oldValue} to ${newValue}.`);
    switch (name) {
      // case "config":
      //   const response = await fetch(newValue);
      //   const names = await response.json();
      //   this.config = names;
      //   console.log("MusicCanvas: config: ", this.config);
      //   this.init();
      //   break;
      default:
        break;
    }
  }

  async init() {
    if (dict.length != 0) {
      console.log("MusicCanvas: Already initialise. Nothing to do.");
      return;
    }
    // if (!this.config) {
    //   console.log(`MusicCanvas: must setAttribute config="xxx" before use`);
    //   return;
    // }

    this.calculateCanvasSize();
    this.showLoadingOnCanvas();

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

    this.draw({ choir: 0, part: 0, bar: 0 });
  }

  calculateCanvasSize() {
    if (config == null) return;

    this.width = this.clientWidth * 20;
    this.height = 300 * 4;

    this.barWidth = (this.width - (2 * this.canvasPadding)) / 140;
    this.choirHeight = (this.height - (2 * this.canvasPadding)) / config.choirs;
    this.partHeight = this.choirHeight / config.parts.length;
    console.log("MusicCanvas: calculated bar choir and part sizes:", this.barWidth, this.choirHeight, this.partHeight);
  };

  showLoadingOnCanvas() {
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

  easeOutCubic(t: number, b: number, c: number, d: number) {
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


  draw(current: Position, fps?: number) {
    // if (!this.config) return;

    if (ranges.length === 0 || dict.length === 0) {
      console.log("MusicCanvas: not ready to draw!");
      return;
    }
    if (fps == undefined) {
      fps = 0;
    }

    // find who has a note that starts in this current quaver (16th of a bar)
    const quant = Math.floor(current.bar * 16) / 16;
    const notes = this.dict[quant];

    // 
    if (notes != undefined && notes.length > 0) {
      for (var n of notes) {
        if (n.n.duration != null) {
          this.pulses[n.c][n.p] = this.easeOutCubic(current.bar % quant, 1.4, -0.4, n.n.duration.sfths / 128);
        }
      }
    }

    // Blank out the whole canvas
    const ctx = this.getContext("2d");
    if (ctx == null) return;

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw FPS number to the screen
    if (!isNaN(fps)) {
      ctx.font = '25px Arial';
      ctx.fillStyle = '#CCC';
      ctx.fillText("FPS: " + fps, 10, this.height - 30);
    }

    // Draw bar highlight
    if (current.bar > 0 && current.bar <= 139) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.canvasPadding + (current.bar * this.barWidth), this.canvasPadding);
      ctx.lineTo(this.canvasPadding + (current.bar * this.barWidth), this.height - this.canvasPadding);
      ctx.lineWidth = this.barWidth * 1.4;
      ctx.strokeStyle = colors.highlight;
      ctx.lineCap = "square";
      ctx.stroke();
      ctx.restore();
    }

    // Draw highlight line for the selected choir or choir and part
    var startY: number, width: number;
    if (current.part != "all") {
      startY = this.canvasPadding + (current.choir * this.choirHeight) + (current.part * this.partHeight);
      width = this.partHeight * 1.4;
    }
    else {
      // center the highlight on the middle tenor line
      startY = this.canvasPadding + (current.choir * this.choirHeight) + (2 * this.partHeight);
      width = (this.partHeight * 5.8);
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.canvasPadding + this.barWidth, startY + (this.partHeight / 2));
    ctx.lineTo(this.canvasPadding + (140 * this.barWidth) - this.barWidth, startY + (this.partHeight / 2));
    ctx.lineWidth = width;
    ctx.strokeStyle = colors.highlight;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // Draw each of the 40 voice parts
    ctx.lineWidth = 0.9 * this.partHeight;
    ctx.lineCap = "round";
    for (var c  = 0; c < config.choirs; c++) {
      for (var p  = 0; p < config.parts.length; p++) {
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
          if (current.bar >= from && current.bar < to) {
            saturation = 80;
            lightness = (67 - (3 * p)) * this.pulses[c][p];
            transparency = 1; // pulses[c][p];
          }
          // if current choir/part is highlighted
          else if (c == current.choir && (current.part == "all" || p == current.part)) {
            saturation = 80;
            lightness = 67 - (3 * p);
            transparency = 1;
          }
          // else if (c == currentChoir && p == currentPart) {
          //   lightness = 67 - (3 * p);
          //   saturation = 80;
          //   transparency = 1;
          // }
          else if (current.bar === 0 || current.bar > 138) {
            saturation = 50;
            lightness = 67 - (3 * p);
            transparency = 1;
          }
          else {
            saturation = 50;
            lightness = 67 - (3 * p);
            transparency = 0.5;
          }

          ctx.strokeStyle = `hsla(${colors.choir[c]}, ${saturation}%, ${lightness}%, ${transparency})`;
          ctx.stroke();
        });
      }
    }
  }

  // BUG: what happens if you click in the canvas padding?
  getMousePos(evt: MouseEvent): Position {
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
  canvasClicked(e: MouseEvent) {
    const pos: Position = this.getMousePos(e);
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

  canvasHovered(e: MouseEvent) {
    const pos: Position = this.getMousePos(e);
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

  // TODO: Not convinced the Maths for getTouchPos() is right...
  getTouchPos(evt: TouchEvent): Position {
    // if (!this.config) return { choir: 0, part: 0, bar: 0 };

    var rect = this.getBoundingClientRect();
    var choir = Math.ceil(config.choirs * ((evt.targetTouches[0].clientY - rect.top - (this.canvasPadding)) /
      (this.clientHeight - (2 * this.canvasPadding))));
    choir = Math.min(Math.max(1, choir), config.choirs);
    var bar = Math.round(140 * ((evt.targetTouches[0].clientX - rect.left - (this.canvasPadding)) /
      (this.clientWidth - (2 * this.canvasPadding))));
    bar = Math.min(Math.max(0, bar), 139); // must be from 0 to 139
    return { choir: choir, part: "all", bar: bar };
  }

  // BUG: on mobile, touch to move bar to half-way and play
  // and it starts from bar 0.
  touchStarted(evt: TouchEvent) {
    const pos: Position = this.getTouchPos(evt);

    console.log("Touch started at", pos);

    this.addEventListener("touchmove", (evt) => {
      const pos = this.getTouchPos(evt);

      console.log("Touch moved at", pos);
    });
    this.addEventListener("touchend", () => {
      const pos = this.getTouchPos(evt);

      console.log("Touch ended at", pos);
    });
  }
}

customElements.define("music-canvas", MusicCanvas, { extends: "canvas" });