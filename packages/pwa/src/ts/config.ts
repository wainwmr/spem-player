// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import pkg from "../../package.json";
// choir/part names live in @spem/scores (they describe spem.ly's structure, which
// that package owns) since #693 moved the LilyPond parse there. Single source of
// truth; the CotE "1".."8" display numbering below stays here, an app concern.
import { choirNames, parts } from "@scores/lily/structure";

export default {
  version: pkg.version,
  parts,
  scores: ["modern", "early"],
  audio_prefix: "/audio/",
  svg_prefix: "/svg/",

  recording: ["ALC", "CotE"],
  recording_label: ["Andrew Leslie Cooper", "Choir of the Earth"],
  choirs: [choirNames, ["1", "2", "3", "4", "5", "6", "7", "8"]],
  /**
   * HSL hue (0-360) for each choir, one per `choirs[*]` entry.
   * Index matches choir number; length must equal `choirs[0].length`.
   * Mirrors `--color-c1`...`--color-c8` in `src/scss/style.scss`,
   * which currently has to be kept in sync by hand.
   */
  choirHues: [360, 320, 30, 50, 110, 150, 190, 220],
  intro_beats: [2, 4],
  barno: [
    [0, 1, 65, 75, 78, 86, 94, 107, 120, 121, 122, 137, 138, 139], // ALC
    [0, 1, 138, 139], // CotE has regular tempo throughout
  ],
  bartime: [
    [
      0, 2.2, 234.3, 273.8, 284.2, 312.5, 342.2, 387.9, 437.1, 441.2, 445.8,
      500.7, 505, 512,
    ], // ALC
    [0, 3.9, 534.2, 540], // CotE has regular tempo throughout
  ],
};
