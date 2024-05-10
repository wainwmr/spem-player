export const config = {
  "choirs": 8,
  "parts": ["Soprano", "Alto", "Tenor", "Baritone", "Bass"],
  "scores": ["modern", "early"],
  "audio_prefix": "/audio/",
  "tempo": 4 * 60 / 62,  // (minim = 62) === (tempo = 4 * 0.9677)
  "svg_prefix": "/svg/",
  "lilypond": "/lilypond/spem notes.ly"
}

export type PartType = "all" | number;

export interface Position {
  choir: number;
  part: PartType;
  bar: number;
}

export type Brightness = "dark" | "light";
export type ScoreType = "early" | "modern";
export type Status = "playing" | "paused" | "loading";

export type State = {
  viewmode: Brightness;
  period: ScoreType;
  choir: number;
  part: PartType;
  bar: number;
  status: Status;
}

export interface Colors {
  background: string;
  highlight: string;
  scoreHighlight: string;
  choir: number[]; // Choir color hues
}

export type Config = {
  choirs: number,
  parts: string[],
  scores: string[],
  audio_prefix: string,
  svg_prefix: string,
  lilypond: string
}

// All the colors are defined in the style sheet
// export var colors = loadColors();
const defaultColors: Colors = {
  background: "hsl(210, 65%, 100%);",
  highlight: "hsl(210, 65%, 90%);",
  scoreHighlight: "hsl(210, 65%, 90%);",
  choir: [360]
};
var loadedColors: Colors;


export function colors(reload = false): Colors {
  if (!reload && loadedColors) return loadedColors;  // no need to reload if we already have the colors
  var style = getComputedStyle(document.body);
  if (!style || style.getPropertyValue('--color-background').length == 0) {
    console.log("ARGH");
    return defaultColors;
  }
  loadedColors = {
    background: style.getPropertyValue('--color-background'),
    highlight: style.getPropertyValue('--color-highlight'),
    scoreHighlight: style.getPropertyValue('--color-score-highlight'),
    // TODO: Need to use config to load the hues for each choir
    choir: [
      Number(style.getPropertyValue('--color-c1')),
      Number(style.getPropertyValue('--color-c2')),
      Number(style.getPropertyValue('--color-c3')),
      Number(style.getPropertyValue('--color-c4')),
      Number(style.getPropertyValue('--color-c5')),
      Number(style.getPropertyValue('--color-c6')),
      Number(style.getPropertyValue('--color-c7')),
      Number(style.getPropertyValue('--color-c8'))
    ]
  };
  return loadedColors;
}

export const HDSQTIME = 0.05; // HACK: needs to be time of a 64th note

export function toNum(s: string | number, integer: boolean = true, max?: number) {
  var nums: number = Number(s);
  if (max) nums = Math.min(Math.max(0, nums), max);
  return integer ? Math.floor(nums + HDSQTIME) : nums;
}

export class MusicElement extends HTMLDivElement {
  static mirroredProps: string[];

  // state
  choir: number = 0;
  voicePart: PartType = "all";
  bar: number = 0;
  playing: boolean = false;

  constructor() {
    super();
  }

  async connectedCallback() {
    console.log(this.constructor.name + ": added to page");
  }

  disconnectedCallback() {
    console.log(this.constructor.name + ": removed from page");
  }

  adoptedCallback() {
    console.log(this.constructor.name + ": moved to a new page");
  }

  async attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue == newValue) return;

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
        console.log("AudioControls: bad attribute: " + newValue);
        break;
    }
  }

  setChoir(c: string | number) {
    this.choir = toNum(c, true, config.choirs - 1);
  }

  setPart(p: string | number) {
    this.voicePart = typeof p == 'string' && p == 'all' ? 'all' : toNum(p, true, config.parts.length - 1);
  }

  setBar(b: string | number) {
    this.bar = toNum(b, false, 139); // HACK: 139
  }

  setPlaying(playing: string | boolean) {
    this.playing = typeof playing == 'string' && playing == 'true' || playing == true;
  }


  isPlaying(): boolean {
    return this.playing;
  }

  fireEvent(type: string, pos?: Position) {
    var position: Position = pos ? pos : {
      choir: this.choir,
      part: this.voicePart,
      bar: this.bar
    }
    const myEvent = new CustomEvent(type, {
      detail: { position: position },
      bubbles: true,
      cancelable: true,
      composed: false
    });
    this.dispatchEvent(myEvent);
  }

  static define(tag: string) {
    try {
      window.customElements.define(tag, this, { extends: "div" });
    } catch (err) {
      console.log(`Unable to (re)define ${tag}`);
    }
  }

}
