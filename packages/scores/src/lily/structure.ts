// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

// The structural shape of `spem.ly`: the choir and part names whose combination
// forms the `notes<Choir><Part>` variable names the parser extracts (e.g.
// "I A" + "Soprano" -> "notesIASoprano"). This lives in @spem/scores because it
// describes the score source, which this package owns. `packages/pwa/src/ts/config.ts`
// imports these so the single source of truth is here, not duplicated in the app.

// The eight Hugh Keyte choir names, in choir-index order (0..7). Mirrors the
// first row of the pwa Config's `choirs`; the second row (the "1".."8" display
// numbering used for the CotE recording) stays in the app, a display concern.
// Typed as string[] (not `as const`) so it drops straight into the app Config's
// existing `choirs: string[][]` / `parts: string[]` shape.
export const choirNames: string[] = [
  "I A",
  "I B",
  "II A",
  "II B",
  "III A",
  "III B",
  "IV A",
  "IV B",
];

// The five part names, in part-index order (0..4).
export const parts: string[] = ["Soprano", "Alto", "Tenor", "Baritone", "Bass"];
