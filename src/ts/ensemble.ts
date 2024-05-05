export type PartType = "all" | number;


export class Ensemble {
  choirs: number[];
  parts: number[];
  _partNames: string[];
  scoreTypes: string[] = [ "" ];

  constructor(choirs: number, partNames: string[], scoreTypes?: string[]) {
    this.choirs = [...Array(choirs).keys()];
    this.parts = [...partNames.keys()];
    this._partNames = partNames;
    if (scoreTypes != undefined) {
      this.scoreTypes = scoreTypes;
    }
  }
  getChoirName(c: number): string {
    return "Choir " + (c + 1);
  }
  getPartName(p: number): string {
    return this._partNames[p];
  }
  getStyle(style?: string) {
    if (style != undefined && this.scoreTypes.indexOf(style) >= 0) {
      return style;
    }
    return this.scoreTypes[0];
  }
  getMP3filename(choir: number, part: PartType, prefix?: string) {
    if (prefix == undefined) prefix = "";
    if (prefix == undefined) prefix = "";
    var newfile = "default";
    if (choir >= 0 && choir < this.choirs.length && part != 'all') {
      newfile = this.getChoirName(choir) + "-" + this.getPartName(part);
    }
    return prefix + newfile + ".mp3";
  }
  getSVGfilename(choir: number, prefix?: string, style?: string) {
    if (prefix == undefined) prefix = "";
    var newfile = "default";
    if (choir >= 0 && choir < this.choirs.length) {
      newfile = this.getChoirName(choir);
    }
    var styleString = this.getStyle(style);
    return prefix + styleString + "/" + newfile + ".svg";
  }

}