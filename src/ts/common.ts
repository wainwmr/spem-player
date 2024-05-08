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
export var colors: Colors = loadColors();
export function loadColors(): Colors {
  var style = getComputedStyle(document.body);
  colors = {
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
  return colors;
}