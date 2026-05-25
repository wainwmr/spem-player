// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

export default {
  parts: ["Soprano", "Alto", "Tenor", "Baritone", "Bass"],
  scores: ["modern", "early"],
  audio_prefix: "/audio/",
  svg_prefix: "/svg/",

  recording: ["ALC", "CotE"],
  recording_label: ["Andrew Leslie Cooper", "Choir of the Earth"],
  choirs: [
    ["I A", "I B", "II A", "II B", "III A", "III B", "IV A", "IV B"],
    ["1", "2", "3", "4", "5", "6", "7", "8"],
  ],
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
