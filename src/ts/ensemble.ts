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



// export class Ensemble {
//   choirs: number[];
//   parts: number[];
//   _partNames: string[];
//   scoreTypes: string[] = [ "" ];

//   constructor(choirs: number, partNames: string[], scoreTypes?: string[]) {
//     this.choirs = [...Array(choirs).keys()];
//     this.parts = [...partNames.keys()];
//     this._partNames = partNames;
//     if (scoreTypes != undefined) {
//       this.scoreTypes = scoreTypes;
//     }
//   }
//   getChoirName(c: number): string {
//     return "Choir " + (c + 1);
//   }
//   getPartName(p: number): string {
//     return this._partNames[p];
//   }
//   getStyle(style?: string) {
//     if (style != undefined && this.scoreTypes.indexOf(style) >= 0) {
//       return style;
//     }
//     return this.scoreTypes[0];
//   }
//   getMP3filename(choir: number, part: PartType, prefix?: string) {
//     if (prefix == undefined) prefix = "";
//     if (prefix == undefined) prefix = "";
//     var newfile = "default";
//     if (choir >= 0 && choir < this.choirs.length && part != 'all') {
//       newfile = this.getChoirName(choir) + "-" + this.getPartName(part);
//     }
//     return prefix + newfile + ".mp3";
//   }
//   getSVGfilename(choir: number, prefix?: string, style?: string) {
//     if (prefix == undefined) prefix = "";
//     var newfile = "default";
//     if (choir >= 0 && choir < this.choirs.length) {
//       newfile = this.getChoirName(choir);
//     }
//     var styleString = this.getStyle(style);
//     return prefix + styleString + (styleString.length != 0 ? "/" : "") + newfile + ".svg";
//   }

// }