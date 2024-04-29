/* eslint-disable no-unused-vars */

import * as ohm from 'ohm-js';
import { Duration, BarLine, Note, Rest, Component } from "./music-classes";

import grammarString from '../ohmjs/ly-grammar.ohm?raw';

// Make an dictionary of music positions (hemidemisemiquavers/128) to array of notes {choir, part, note}

export const dict: {"c": number, "p": number, "n": Note}[][] = [];


// var persons: { [id: string]: IPerson; } = {
//   "p1": { firstName: "F1", lastName: "L1" },
//   "p2": { firstName: "F2" }
// };

// a dictionary to hold the muic in the lilypond input file
export var scores: { [id: string]: Component[]} = {};

// -----------------------------------------------------
// Set up Lilypond parser
// -----------------------------------------------------

var lyGrammar: ohm.Grammar, semantics: ohm.Semantics;

export var lilypondVersion: string;

export async function setupLilypondParser() {

  // Load the OHM grammar for Lilypond 
  // console.log(lyURL);
  // const promise = await fetch(lyURL);
  // const grammarString = await promise.text();
  // console.log(grammarString);
  lyGrammar = ohm.grammar(grammarString);

  // Create a parse for Lilypond
  semantics = lyGrammar.createSemantics();

  // If lilypond input has no duration, use lastDuration; use lastNote if note name is missing
  var lastNote: Note, lastDuration: Duration;

  function getDuration(duration: ohm.Node) {
    var d = duration.parse()[0];
    if (d == undefined) {
      d = lastDuration;
    }
    else {
      lastDuration = d;
    }
    return d;
  }


  semantics.addOperation('parse', {
    Version(_, _2, v, _3) {
      lilypondVersion = v.sourceString;
    },
    RelativeClause(variable, _, _2, _3, _4, music, _5) {
      const v = variable.parse();
      // const n = note.parse();
      if (v[0] != undefined) {
        scores[v[0]] = music.parse();
      }
      return scores[v];
    },
    Component(comp) {
      const c = comp.parse();
      return c;
    },
    command(_, _2, _3) {
      // const command = _2.sourceString;
    },
    barline(_) {
      return new BarLine();
    },
    repeatedNote(duration, slur) {
      const d = duration.parse();
      const s = slur.sourceString.length == 0 ? null : slur.sourceString

      const note = new Note(lastNote.notename, lastNote.accidental, '', d, s);
      return note;
    },
    note(notename, accidental, octave, duration, _, slur) {
      const n = notename.sourceString;
      const a = accidental.sourceString.length == 0 ? null : accidental.sourceString;
      const o = octave.sourceString.length == 0 ? null : octave.sourceString;
      var d = getDuration(duration);
      const s = slur.sourceString.length == 0 ? null : slur.sourceString

      lastNote = new Note(n, a, o, d, s);
      return lastNote;
    },
    rest(restname, duration) {
      const r = restname.sourceString;
      var d = getDuration(duration);
      const rest = new Rest(r, d);
      return rest;
    },
    duration(duration, dotted) {
      const d = duration.sourceString;
      const dot = dotted.sourceString;
      const ret = new Duration(d, dot, 1);
      return ret;
    },
    durationScaled(duration, _, multiplier) {
      const x = duration.parse();
      const m = multiplier.parse()[0];

      return new Duration(x.duration, x.dotted, m);
    },
    fraction(a, _, _2) {
      // HACK: we're ignoring the denominator altogether.  Let's hope it's not there
      return parseInt(a.sourceString);
    },
    variable(v) {
      return v.sourceString;
    },
    _iter(...children) {
      return children.map(c => c.parse());
    }
  });

}

// Array of choir, part and 
export var ranges: {from: number, to: number}[][][] = [];

export async function processLilypond(lilypondfile: string) {

  // Load the Spem lilypond file
  // const promise = await fetch(lilypondfile);
  // const spemly = await promise.text();

  // const spemly  = "choirVBaritone = \\relative { f2 f f}";
  // Parse it
  const result = lyGrammar.match(lilypondfile);
  if (!result.succeeded()) {
    console.error('Bad Lilypond ' + result.message);
  }

  semantics(result).parse();

  const choirs = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const parts = ["Soprano", "Alto", "Tenor", "Baritone", "Bass"];

  // Read lilypond input into dict{ position -> [ {choir, part, note}], ... }
  // Read lilypond into ranges[choir][part] = [ {from, to}, ... ]
  for (var choir = 0; choir < 8; choir++) {
    ranges[choir] = [];
    for (var part = 0; part < 5; part++) {
      ranges[choir][part] = [];
      var key = "notes" + choirs[choir] + parts[part];
      var lilypond = scores[key];

      // console.log(lilypond.map(x => (typeof x == "undefined") ? "?" : x.toString()).join(" "));

      // Pretty print where we don't show repeated durations
      // TODO: Move this functionality inside classes/Component
      // var str = [];
      // var lastlen;
      // for (var c of lilypond) {
      //   // console.log(lastlen, c.duration.sfths);
      //   str.push(c.toString(lastlen !== c.duration.sfths));
      //   lastlen = c.duration.sfths;
      // }
      // console.log(str.join(" "));

      var from = undefined;

      var pos = 1; // in hemidemisemiquavers (64ths)
      const barsize = 128; // hemidemisemiquavers in a bar
      for (var comp of lilypond) {
        if (comp instanceof Note) {
          if (from == undefined) {
            from = pos;
          }

          if (dict[pos] == undefined) {
            dict[pos] = [];
          }
          dict[pos].push({ "c": choir, "p": part, "n": comp });

          if (comp.duration != null) pos += comp.duration.sfths / barsize;
        }
        else if (comp instanceof Rest) {
          if (from != undefined) {
            ranges[choir][part].push({ "from": from, "to": pos });
            from = undefined;
          }

          if (comp.duration != null) pos += comp.duration.sfths / barsize;
        }
      }

      if (from != undefined) {
        ranges[choir][part].push({ "from": from, "to": pos });
        from = undefined;
      }
    }
  }
}