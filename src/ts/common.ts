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

