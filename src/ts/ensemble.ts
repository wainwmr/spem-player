
export class Ensemble {
  choirs: number[];
  parts: number[];
  _partNames: string[];
  constructor(choirs: number, partNames: string[]) {
      this.choirs= [...Array(choirs).keys()];
      this.parts = [...partNames.keys()];
      this._partNames = partNames;
  }
  getChoirName(c: number): string {
      return "Choir " + c;
  }
  getPartName(p: number): string {
      return this._partNames[p];
  }
}

// const ens: Ensemble = new Ensemble(8, [ "Soprano", "Alto", "Tenor", "Baritone", "Bass"]);
