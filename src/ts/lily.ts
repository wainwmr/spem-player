// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import config from "./config";
import lyGrammar from "../ohmjs/ly-grammar.ohm-bundle";
import * as ohm from "ohm-js";
import { Duration, BarLine, Note, Rest, Component } from "./music-classes";
import spem from "../lilypond/Hugh Keyte/spem.ly?raw";

// Make an dictionary of music positions (hemidemisemiquavers/128) to array of notes {choir, part, note}
export type Dictionary = {
  c: number;
  p: number;
  n: Note;
};
export const dict: Dictionary[][] = [];

export type ActiveNote = { c: number; p: number; n: Note };

export type FRlocation = {
  c: number;
  p: number;
  notename: string;
  accidental: string | null;
  from: number;
  to: number;
};
export const frLocations: FRlocation[] = [];

// a dictionary to hold the muic in the lilypond input file
export var scores: { [id: string]: Component[] } = {};

// -----------------------------------------------------
// Set up Lilypond parser
// -----------------------------------------------------

var semantics: ohm.Semantics = setupLilypondParser();

function romanise(num: number) {
  var lookup: { [index: string]: number } = {
      M: 1000,
      CM: 900,
      D: 500,
      CD: 400,
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1,
    },
    roman = "",
    i;
  for (i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
}

export function noteToPitchClass(note: Note): number {
  const base: Record<string, number> = {
    c: 0,
    d: 2,
    e: 4,
    f: 5,
    g: 7,
    a: 9,
    b: 11,
  };
  let pc = base[note.notename] ?? 0;

  if (note.accidental) {
    if (note.accidental.includes("isis")) pc += 2;
    else if (note.accidental.includes("eses")) pc -= 2;
    else if (note.accidental.includes("is")) pc += 1;
    else if (note.accidental.includes("es")) pc -= 1;
  }

  return ((pc % 12) + 12) % 12;
}

export function detectFalseRelations(activeNotes: Map<number, ActiveNote[]>) {
  frLocations.length = 0;
  const activeLocs = new Map<string, FRlocation>();

  const positions = Array.from(activeNotes.keys()).sort((a, b) => a - b);

  for (const pos of positions) {
    const notes = activeNotes.get(pos) ?? [];
    const involved = new Set<string>();

    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const a = notes[i];
        const b = notes[j];
        if (a.c === b.c && a.p === b.p) continue;
        if (
          a.n.notename === b.n.notename &&
          a.n.accidental !== b.n.accidental
        ) {
          involved.add(`${a.c}-${a.p}`);
          involved.add(`${b.c}-${b.p}`);
        }
      }
    }

    for (const note of notes) {
      const key = `${note.c}-${note.p}`;
      const existing = activeLocs.get(key);

      if (involved.has(key)) {
        if (existing) {
          if (
            existing.notename !== note.n.notename ||
            existing.accidental !== note.n.accidental
          ) {
            frLocations.push(existing);
            activeLocs.set(key, {
              c: note.c,
              p: note.p,
              notename: note.n.notename,
              accidental: note.n.accidental,
              from: pos,
              to: pos + 0.0625,
            });
          } else {
            existing.to = pos + 0.0625;
          }
        } else {
          activeLocs.set(key, {
            c: note.c,
            p: note.p,
            notename: note.n.notename,
            accidental: note.n.accidental,
            from: pos,
            to: pos + 0.0625,
          });
        }
      } else if (existing) {
        frLocations.push(existing);
        activeLocs.delete(key);
      }
    }

    for (const [key, loc] of Array.from(activeLocs.entries())) {
      const present = notes.some((n) => n.c === loc.c && n.p === loc.p);
      if (!present) {
        frLocations.push(loc);
        activeLocs.delete(key);
      }
    }
  }

  for (const loc of activeLocs.values()) {
    frLocations.push(loc);
  }
}

function setupLilypondParser(): ohm.Semantics {
  var s = lyGrammar.createSemantics();

  // If lilypond input has no duration, use lastDuration; use lastNote if note name is missing
  var lastNote: Note, lastDuration: Duration;

  function getDuration(duration: ohm.Node) {
    var d = duration.parse()[0];
    if (d == undefined) {
      d = lastDuration;
    } else {
      lastDuration = d;
    }
    return d;
  }

  s.addOperation("parse", {
    Version(_, _2, _v, _3) {},
    Include(_, _2, _filename, _3) {},
    RelativeClause(variable, _, _2, _3, _4, music, _6) {
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
    command(_, _2) {
      // const command = _2.sourceString;
    },
    BarCheck(_, _2, _3) {
      // console.log("Bar check: " + _3.sourceString);
    },
    barline(_) {
      return new BarLine();
    },
    repeatedNote(duration, slur) {
      const d = duration.parse();
      const s = slur.sourceString.length == 0 ? null : slur.sourceString;

      const note = new Note(lastNote.notename, lastNote.accidental, "", d, s);
      return note;
    },
    note(notename, accidental, octave, _, duration, _2, slur) {
      const n = notename.sourceString;
      const a =
        accidental.sourceString.length == 0 ? null : accidental.sourceString;
      const o = octave.sourceString.length == 0 ? null : octave.sourceString;
      var d = getDuration(duration);
      const s = slur.sourceString.length == 0 ? null : slur.sourceString;

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
    fraction(_a, _b, _c) {
      const text = (this as unknown as ohm.Node).sourceString;
      if (text.includes("/")) {
        const [numStr, denStr] = text.split("/");
        return parseInt(numStr) / parseInt(denStr);
      }
      return parseInt(text);
    },
    variable(v) {
      return v.sourceString;
    },
    _iter(...children) {
      return children.map((c) => c.parse());
    },
  });
  return s;
}

// Array of choir, part and
export type Range = {
  from: number;
  to: number;
};
export var ranges: Range[][][] = [];
export var barCount: number = 0;

async function getFile(filename: string): Promise<string> {
  const promise = await fetch(filename);
  const text = await promise.text();
  return text;
}

// -----------------------------------------------------
// Process the lilypond input file, creating two data structures:
// dict[position] = [ {choir, part, note}, ... ]
// ranges[choir (0 to 7)][part (0 to 4)] = [ {from, to}, ... ]
// -----------------------------------------------------
export function processLilypond() {
  if (!semantics) {
    semantics = setupLilypondParser();
  }

  // Parse lilypond from the ohm grammar
  const result = lyGrammar.match(spem);
  if (result.failed()) {
    console.error("Bad Lilypond " + result.message);
  }

  semantics(result).parse();

  const activeNotes = new Map<number, ActiveNote[]>();
  barCount = 0;
  for (let c = 0; c < config.choirs[0].length; c++) {
    const choir = config.choirs[0][c];
    ranges[c] = [];
    for (let p = 0; p < config.parts.length; p++) {
      const part = config.parts[p];
      ranges[c][p] = [];
      var key = "notes" + choir.replace(/ /g, "") + part;

      // get the lilypond for this choir and part
      var lilypond = scores[key];

      // console.log(lilypond.map(x => (typeof x == "undefined") ? "?" : x.toString()).join(" "));

      var from = undefined;

      var pos = 1; // in hemidemisemiquavers (64ths)
      const barsize = 128; // hemidemisemiquavers in a bar
      const step = 0.0625; // 1/16 bar
      for (var comp of lilypond) {
        if (comp instanceof Note) {
          const noteStart = pos;
          if (from == undefined) {
            from = pos;
          }

          if (dict[pos] == undefined) {
            dict[pos] = [];
          }
          dict[pos].push({ c: c, p: p, n: comp });

          if (comp.duration != null) pos += comp.duration.sfths / barsize;

          // Add to activeNotes for each 1/16 position in [noteStart, pos)
          const noteEnd = pos;
          const startIdx = Math.ceil(noteStart / step);
          const endIdx = Math.ceil(noteEnd / step);
          for (let i = startIdx; i < endIdx; i++) {
            const p16 = i * step;
            const entry = activeNotes.get(p16);
            if (entry) {
              entry.push({ c, p, n: comp });
            } else {
              activeNotes.set(p16, [{ c, p, n: comp }]);
            }
          }
        } else if (comp instanceof Rest) {
          if (from != undefined) {
            ranges[c][p].push({ from: from, to: pos });
            from = undefined;
          }

          if (comp.duration != null) pos += comp.duration.sfths / barsize;
        }
      }

      if (from != undefined) {
        ranges[c][p].push({ from: from, to: pos });
      }

      if (pos > barCount) {
        barCount = pos;
      }
    }
  }
  barCount = Math.floor(barCount) - 1;

  detectFalseRelations(activeNotes);
}

export const exportedForTesting = {
  semantics,
  romanise,
  setupLilypondParser,
  getFile,
  noteToPitchClass,
  detectFalseRelations,
};
