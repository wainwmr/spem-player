// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import type {
  LilypondData,
  NoteData,
  NoteEntry,
  FRlocation,
  Range,
} from "./lily";

// The on-disk shape of the precomputed parse (`lilyData.json`, #693). It is the
// plain-JSON projection of `LilypondData`: the two `Map`s become arrays of
// `[key, value]` pairs (JSON has no Map), and every leaf is a plain field object
// (no `Note`/`Duration` class instances). `serialise` writes it at build time;
// `loadLilyData` rebuilds the `Map`s from it at runtime. The two are inverses,
// pinned by the golden-equivalence test.
export type PlainLilypondData = {
  notesByQuant: [number, NoteEntry[]][];
  ranges: [string, Range[]][];
  barCount: number;
  frLocations: FRlocation[];
};

/** Copy a parsed note into a plain field object, dropping any class identity. */
function plainNote(n: NoteData): NoteData {
  return {
    duration:
      n.duration == null
        ? null
        : {
            duration: n.duration.duration,
            dotted: n.duration.dotted,
            multiplier: n.duration.multiplier,
            sfths: n.duration.sfths,
          },
    notename: n.notename,
    accidental: n.accidental,
    octave: n.octave,
    slur: n.slur,
  };
}

/**
 * Serialise a `LilypondData` to its plain-JSON projection. The `Map`s become
 * `[key, value]` arrays and each note is flattened to a plain field object, so
 * `JSON.stringify` of the result carries no class methods or prototypes.
 */
export function serialise(data: LilypondData): PlainLilypondData {
  return {
    notesByQuant: Array.from(data.notesByQuant.entries()).map(([pos, entries]) => [
      pos,
      entries.map((e) => ({ c: e.c, p: e.p, n: plainNote(e.n) })),
    ]),
    ranges: Array.from(data.ranges.entries()).map(([key, intervals]) => [
      key,
      intervals.map((r) => ({ from: r.from, to: r.to })),
    ]),
    barCount: data.barCount,
    frLocations: data.frLocations.map((f) => ({ ...f })),
  };
}

/**
 * Rebuild a `LilypondData` from its plain-JSON projection. Reconstructs the two
 * `Map`s and freezes their arrays so the loaded data honours the same
 * array-level immutability contract as the build-time parse (#652). The note
 * leaves stay plain objects -- the runtime reads only their fields (#693).
 *
 * Validates the top-level shape first: the pwa load site imports the JSON with an
 * `as unknown as PlainLilypondData` cast (the compiler cannot check a resolved
 * JSON literal against the tuple types), so a malformed lilyData.json would
 * otherwise surface as a deep `undefined` read in a consumer. Failing here makes
 * it a loud error at load instead (Vera 693-01). This is a shape assertion, not a
 * validator -- the data is build-emitted and CI-regen-guarded.
 */
export function loadLilyData(plain: PlainLilypondData): LilypondData {
  if (
    !plain ||
    !Array.isArray(plain.notesByQuant) ||
    !Array.isArray(plain.ranges) ||
    !Array.isArray(plain.frLocations) ||
    typeof plain.barCount !== "number"
  ) {
    throw new Error(
      "loadLilyData: malformed lilyData (expected { notesByQuant[], ranges[], frLocations[], barCount: number })"
    );
  }
  const notesByQuant = new Map(plain.notesByQuant);
  const ranges = new Map(plain.ranges);
  for (const arr of notesByQuant.values()) Object.freeze(arr);
  for (const arr of ranges.values()) Object.freeze(arr);
  return {
    notesByQuant,
    ranges,
    barCount: plain.barCount,
    frLocations: plain.frLocations,
  };
}
