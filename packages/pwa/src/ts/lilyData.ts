// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { loadLilyData } from "@scores/lily/serialise";
import type { PlainLilypondData } from "@scores/lily/serialise";
import raw from "@scores/lily/lilyData.json";

// The precomputed LilyPond note data (#693). The Ohm parse now runs at build
// time in @spem/scores and ships as lilyData.json; here we load it once at
// module init -- a ~15 ms JSON parse in place of the ~500 ms main-thread Ohm
// parse it replaces (the cold-load stall #693 removes).
export const lilyData = loadLilyData(raw as unknown as PlainLilypondData);

// barCount as a plain const sourced from the loaded data, replacing the old
// module-level side-effect export from lily.ts (the #107/#170 barCount HACK).
export const barCount = lilyData.barCount;
