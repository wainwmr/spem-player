// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import lyGrammar, {
  type LilypondSemantics,
} from "./ly-grammar.ohm-bundle";
import * as ohm from "ohm-js";
import { Duration, BarLine, Note, Rest, Component } from "./music-classes";
import { choirNames, parts } from "./structure";

// The plain-data shape of a parsed note and its duration. `LilypondData` carries
// these structural types, not the `Note`/`Duration` classes: the parse-time
// builders (music-classes.ts) are structurally assignable to them, and the
// runtime loads plain JSON that satisfies them without reviving any class (#693).
export type DurationData = {
  duration: string;
  dotted: string;
  multiplier: number;
  sfths: number;
};

export type NoteData = {
  duration: DurationData | null;
  notename: string;
  accidental: string | null;
  octave: string | null;
  slur: string | null;
};

// A single note entry at a quantised bar position.
export type NoteEntry = {
  c: number;
  p: number;
  n: NoteData;
};

export type ActiveNote = { c: number; p: number; n: NoteData };

export type FRlocation = {
  c: number;
  p: number;
  notename: string;
  accidental: string | null;
  from: number;
  to: number;
};

// a dictionary to hold the muic in the lilypond input file
export var scores: { [id: string]: Component[] } = {};

// -----------------------------------------------------
// Set up Lilypond parser
// -----------------------------------------------------

type ParseValue =
  Component[] | Component | Duration | number | string | undefined;

interface LilypondOperations {
  parse(): ParseValue;
}

var semantics: LilypondSemantics = setupLilypondParser();

function parseMatch(match: ohm.MatchResult): ParseValue {
  return (semantics(match) as unknown as LilypondOperations).parse();
}

export function detectFalseRelations(
  activeNotes: Map<number, ActiveNote[]>
): FRlocation[] {
  const frLocations: FRlocation[] = [];
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
  return frLocations;
}

function setupLilypondParser(): LilypondSemantics {
  var s: LilypondSemantics = lyGrammar.createSemantics();

  // If lilypond input has no duration, use lastDuration; use lastNote if note name is missing
  var lastNote: Note, lastDuration: Duration;

  function getDuration(duration: ohm.Node) {
    var d = (duration.parse() as Duration[])[0];
    if (d == undefined) {
      d = lastDuration;
    } else {
      lastDuration = d;
    }
    return d;
  }

  s.addOperation<ParseValue>("parse", {
    Version(_, _2, _v, _3) {},
    Include(_, _2, _filename, _3) {},
    RelativeClause(variable, _, _2, _3, _4, music, _6) {
      const v = variable.parse() as string[];
      const components = music.parse() as Component[];
      if (v[0] != undefined) {
        scores[v[0]] = components;
      }
      return scores[v[0]];
    },
    Component(comp) {
      const c = comp.parse();
      return c;
    },
    command(_, _2) {},
    BarCheck(_, _2, _3) {},
    barline(_) {
      return new BarLine();
    },
    repeatedNote(duration, slur) {
      const d = duration.parse() as Duration;
      const s = slur.sourceString.length == 0 ? null : slur.sourceString;

      const note = new Note({
        notename: lastNote.notename,
        accidental: lastNote.accidental,
        octave: "",
        duration: d,
        slur: s,
      });
      return note;
    },
    note(notename, accidental, octave, _, duration, _2, slur) {
      const n = notename.sourceString;
      const a =
        accidental.sourceString.length == 0 ? null : accidental.sourceString;
      const o = octave.sourceString.length == 0 ? null : octave.sourceString;
      var d = getDuration(duration);
      const s = slur.sourceString.length == 0 ? null : slur.sourceString;

      lastNote = new Note({
        notename: n,
        accidental: a,
        octave: o,
        duration: d,
        slur: s,
      });
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
      const x = duration.parse() as Duration;
      const m = (multiplier.parse() as number[])[0];

      return new Duration(x.duration, x.dotted, m);
    },
    fraction(_a, _b, _c) {
      const text = this.sourceString;
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
      // Ohm's default iteration action returns an array of child results. The
      // operation's return type is the scalar ParseValue union, so we cast the
      // array back at the boundary; callers that need an array narrow explicitly.
      return children.map((c) => c.parse()) as unknown as ParseValue;
    },
  });
  return s;
}

// A continuous singing interval for one part: bar positions from start to end.
export type Range = {
  readonly from: number;
  readonly to: number;
};

// Quantised bar position -> all notes/rests starting at that position. Readonly
// to the array level (#652): the Map and its arrays are immutable to consumers.
// The `NoteEntry` leaf objects are NOT readonly (their fields are mutable), so
// consumers must treat the entries themselves as immutable by convention.
export type NotesByQuant = ReadonlyMap<number, readonly NoteEntry[]>;

// "choir-part" key -> the singing ranges for that part. Deeply readonly (#652):
// the Map, its arrays, and the Range leaves are all immutable to consumers at the
// type level; at runtime only the arrays are frozen (Object.freeze on a Map does
// not block Map.set).
export type SingingRanges = ReadonlyMap<string, readonly Range[]>;

// The full parse output. `ranges` is deeply readonly (its `Range` leaves carry
// `readonly` fields since #551); `notesByQuant` and `frLocations` are readonly
// only to the array level -- their element objects (`NoteEntry`, `FRlocation`)
// have mutable fields. At runtime the `notesByQuant` and `ranges` arrays are
// frozen; the `frLocations` array is compile-time readonly only.
export type LilypondData = {
  readonly notesByQuant: NotesByQuant;
  readonly ranges: SingingRanges;
  readonly barCount: number;
  readonly frLocations: readonly FRlocation[];
};

// -----------------------------------------------------
// Process the lilypond input file and return a LilypondData object:
//   notesByQuant.get(position) = [ {choir, part, note}, ... ]
//   ranges.get("choir-part") = [ {from, to}, ... ]
//   barCount — index of the last bar
//   frLocations — false-relation positions for rendering
//
// `source` is the raw text of `spem.ly`. This runs once at build time
// (packages/scores/build/buildLilyData.ts); the runtime loads the emitted
// lilyData.json instead of parsing (#693), so no module-level cache is needed.
// -----------------------------------------------------
export function processLilypond(source: string): LilypondData {
  // Parse lilypond from the ohm grammar
  const result = lyGrammar.match(source);
  if (result.failed()) {
    throw new Error("Lilypond parse failed: " + result.message);
  }

  parseMatch(result);

  const notesByQuant = new Map<number, NoteEntry[]>();
  const ranges = new Map<string, Range[]>();
  const activeNotes = new Map<number, ActiveNote[]>();
  let localBarCount = 0;
  for (let c = 0; c < choirNames.length; c++) {
    const choir = choirNames[c];
    for (let p = 0; p < parts.length; p++) {
      const part = parts[p];
      ranges.set(`${c}-${p}`, []);
      var key = "notes" + choir.replace(/ /g, "") + part;

      // get the lilypond for this choir and part
      var lilypond = scores[key];

      var from = undefined;

      var pos = 1; // fractional bar position (sfths / barsize)
      const barsize = 128; // sfths (64th notes) per bar
      const step = 0.0625; // 1/16 bar
      for (var comp of lilypond) {
        if (comp instanceof Note) {
          const noteStart = pos;
          if (from == undefined) {
            from = pos;
          }

          const entry = notesByQuant.get(pos);
          if (entry) {
            entry.push({ c, p, n: comp });
          } else {
            notesByQuant.set(pos, [{ c, p, n: comp }]);
          }

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
            ranges.get(`${c}-${p}`)!.push({ from, to: pos });
            from = undefined;
          }

          if (comp.duration != null) pos += comp.duration.sfths / barsize;
        }
      }

      if (from != undefined) {
        ranges.get(`${c}-${p}`)!.push({ from, to: pos });
      }

      if (pos > localBarCount) {
        localBarCount = pos;
      }
    }
  }
  localBarCount = Math.floor(localBarCount);

  const frLocations = detectFalseRelations(activeNotes);

  // Freeze each singing-range and note array so the returned LilypondData cannot
  // be mutated at the array level by a consumer (the Maps and arrays are also
  // compiler-enforced readonly via SingingRanges / NotesByQuant). #652.
  for (const arr of ranges.values()) Object.freeze(arr);
  for (const arr of notesByQuant.values()) Object.freeze(arr);

  return {
    notesByQuant,
    ranges,
    barCount: localBarCount,
    frLocations,
  };
}

export const exportedForTesting = {
  semantics,
  parseMatch,
  setupLilypondParser,
  detectFalseRelations,
};
