/* eslint-disable no-unused-vars */

export class Duration {
  duration: string;
  dotted: string;
  multiplier: number;
  sfths = 0; // sixtyfourth note

  constructor(duration = '', dotted = '', multiplier = 1) {
    this.duration = duration;
    this.dotted = dotted;
    this.multiplier = multiplier;
    switch (this.duration) {
      case "\\longa":
        this.sfths = 256;
        break;
      case "\\breve":
        this.sfths = 128;
        break;
      case "1":
        this.sfths = 64;
        break;
      case "2":
        this.sfths = 32;
        break;
      case "4":
        this.sfths = 16;
        break;
      case "8":
        this.sfths = 8;
        break;
      case "16":
        this.sfths = 4;
        break;
      case "32":
        this.sfths = 2;
        break;
      case "64":
        this.sfths = 1;
        break;
      default:
        this.sfths = 0;  // How did you get here??
        break;
    }
    if (dotted != undefined) {
      this.sfths = this.sfths * (1.5 ** this.dotted.length);
    }
    if (multiplier != undefined) {
      this.sfths *= multiplier;
    }
  }
  toString() {
    var str = "";
    str += this.duration;
    str += this.dotted;
    if (this.multiplier != 1) str += "*" + this.multiplier;
    return str; // + "(" + this.sfths + ")";
  }

  // static getDValue(s, include = undefined) {
  //   const ds= [];

  //   if (include != undefined) {
  //     ds.push(...Duration.getDValue(include));
  //     s -= include;
  //   }
  //   // Convert to binary with high end bit first
  //   const bin = (s >>> 0).toString(2).split("").reverse();
  //   for (var i = 0; i < bin.length; i++) {
  //     if (bin[i] == '1') {
  //       ds.push(2 ** (6 - i));  // convert to d-value
  //     }
  //   }
  //   return ds.map(x => x.toString()); // convert to strings
  // }

  // Given a multibar duration total, return the D-values for the remainder
  // of the bar (first), the number of bars, and the D-Values for the start
  // of the remaining bar
  // static split(total, first) {
  //   const x = total - first;
  //   return [ Duration.getDValue(first), Math.floor(x / 128), Duration.getDValue(x % 128) ];
  // }
}

export class Component {
  duration: Duration | null; 
  constructor(duration: Duration | null) {
    this.duration = duration; // 0 length
  }
  toString() {
    return "huh";
  }
}

export class BarLine extends Component {
  constructor() {
    super(null);
  }
  toString() {
    return "|";
  }
}

export class Note extends Component {
  notename: string;
  accidental: string | null;
  octave: string | null;
  // length: number; // in sixtyfourth notes (hemidemisemiquavers)
  // duration;
  slur: string | null;

  constructor(notename: string, accidental: string | null, octave: string | null, duration: Duration, slur: string | null) {
    super(duration);
    this.notename = notename;
    this.accidental = accidental;
    this.octave = octave;
    this.duration = duration;
    this.slur = slur;
  }

  toString(showDuration = true) {
    var str = "";
    str += this.notename;
    if (this.accidental != undefined) str += this.accidental;
    if (this.octave != undefined) str += this.octave;
    if (showDuration) str += this.duration;
    if (this.slur != undefined) str += this.slur;
    return (str);
  }
}

export class Rest extends Component {
  restname: string;
  // duration;
  constructor(restname: string, duration: Duration) {
    super(duration);
    this.restname = restname;
    this.duration = duration;
  }

  toString(showDuration = true) {
    var str = "";
    str += this.restname;
    if (showDuration && this.duration != null) str += this.duration.toString();
    return (str);
  }
}

export class Command extends Component {
  constructor() {
    super(null);
  }
  toString() {
    return "Command";
  }
}
