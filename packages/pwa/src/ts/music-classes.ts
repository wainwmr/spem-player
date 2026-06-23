// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

export class Duration {
  duration: string;
  dotted: string;
  multiplier: number;
  sfths = 0; // sixtyfourth note

  constructor(duration: string, dotted = "", multiplier = 1) {
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
        // Unreachable via the parser: the Ohm `duration` rule limits parsed
        // strings to the cases above (grammar-consistency.test.ts enforces the
        // parity). Only a direct call with an unknown string reaches here.
        // Throw rather than silently set sfths = 0, which would stall
        // bar-position advance in lily.ts and corrupt timing without error
        // (#170).
        throw new Error(`Unknown duration: ${this.duration}`);
    }
    if (dotted != undefined && this.dotted.length > 0) {
      this.sfths = this.sfths * (2 - 0.5 ** this.dotted.length);
    }
    if (multiplier != undefined && multiplier !== 1) {
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
  slur: string | null;

  // Named params, not positional: notename/accidental/octave/slur are adjacent
  // string|null fields that positional args could silently transpose with no
  // type error. Keep this keyed by name (#705).
  constructor(params: {
    notename: string;
    accidental: string | null;
    octave: string | null;
    duration: Duration;
    slur: string | null;
  }) {
    super(params.duration);
    this.notename = params.notename;
    this.accidental = params.accidental;
    this.octave = params.octave;
    this.slur = params.slur;
  }

  toString(showDuration = true) {
    var str = "";
    str += this.notename;
    if (this.accidental != undefined) str += this.accidental;
    if (this.octave != undefined) str += this.octave;
    if (showDuration) str += this.duration;
    if (this.slur != undefined) str += this.slur;
    return str;
  }
}

export class Rest extends Component {
  restname: string;
  constructor(restname: string, duration: Duration) {
    super(duration);
    this.restname = restname;
    this.duration = duration;
  }

  toString(showDuration = true) {
    var str = "";
    str += this.restname;
    if (showDuration && this.duration != null) str += this.duration.toString();
    return str;
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
