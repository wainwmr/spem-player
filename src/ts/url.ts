// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import config from "./config";
import { PartType } from "./common";

export interface ParsedURL {
  recording: number;
  choir: number;
  part: PartType;
  bar: number;
  dark: boolean;
  early: boolean;
}

export function parseURLSearch(search: string): ParsedURL {
  const url = search.substring(1);
  const parms = url.split("&");

  var choir = 0; // choir 1 because it is zero indexed
  var part: PartType = "all";
  var barParam: number | undefined; // explicit ?bar= override, if any
  var dark = true; // dark mode by default
  var early = false;
  var r = 0; // ALC

  for (let i = 0; i < parms.length; i++) {
    const eq = parms[i].indexOf("=");
    const key = eq === -1 ? parms[i] : parms[i].slice(0, eq);
    const val = eq === -1 ? undefined : parms[i].slice(eq + 1);
    if (key == "choir") {
      const n = Number(val);
      if (!Number.isNaN(n)) choir = n;
    } else if (key == "part") {
      const n: number = Number(val);
      if (n >= 0 && n < config.parts.length) part = n;
    } else if (key == "bar") {
      const n = Number(val);
      if (!Number.isNaN(n)) barParam = n;
    } else if (key == "dark") {
      dark = val !== "false" && val !== "0";
    } else if (key == "recording") {
      if (val == "alc") r = 0;
      else r = 1;
    } else if (key == "score") {
      early = val == "early";
    }
  }

  // The default initial bar is keyed off the *parsed* recording (#241): the
  // intro spans intro_beats/4 of a bar, so playback starts at
  // 1 - intro_beats[r] / 4. An explicit ?bar= overrides it.
  const bar = barParam ?? 1 - config.intro_beats[r] / 4;

  return { recording: r, choir, part, bar, dark, early };
}
