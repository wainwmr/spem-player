export type PartType = "all" | number;


export class Ensemble {
  choirs: number[];
  parts: number[];
  _partNames: string[];
  constructor(choirs: number, partNames: string[]) {
    this.choirs = [...Array(choirs).keys()];
    this.parts = [...partNames.keys()];
    this._partNames = partNames;
  }
  getChoirName(c: number): string {
    return "Choir " + (c + 1);
  }
  getPartName(p: number): string {
    return this._partNames[p];
  }
  getMP3filename(choir: number, part: PartType, prefix?: string) {
    if (prefix == undefined) prefix = "";
    let newfile = "default";
    if (choir >= 0 && choir < this.choirs.length && part != 'all') {
      newfile = this.getChoirName(choir) + "-" + this.getPartName(part);
    }
    return prefix + newfile + ".mp3";
  }

}