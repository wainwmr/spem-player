// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import config from "./config";

export type PartType = "all" | number;

export interface Position {
  choir: number;
  part: PartType;
  bar: number;
}

export type Brightness = "dark" | "light";
export type ScoreType = "early" | "modern";
export type Status = "playing" | "paused" | "loading";

export type State = {
  recording: number; // 0 = ALC, 1 = CotE
  viewmode: Brightness;
  period: ScoreType;
  choir: number;
  part: PartType;
  bar: number;
  status: Status;
};

export interface Colors {
  background: string;
  highlight: string;
  scoreHighlight: string;
  choir: number[]; // Choir color hues
}

export type Config = {
  choirs: number;
  parts: string[];
  scores: string[];
  audio_prefix: string;
  svg_prefix: string;
  lilypond: string;
};

// Fallback colour set used only when the stylesheet's CSS custom
// properties are absent (typically in unit tests or before the
// stylesheet has loaded). The hues here are copied from config so
// callers cannot mutate the canonical config array through
// `colors().choir`. NOTE: in production the CSS-present branch below
// is taken — `config.choirHues` is the source of truth for the
// fallback only, not for the live render path. See the TODO above the
// live branch.
const defaultColors: Colors = {
  background: "hsl(210, 65%, 100%);",
  highlight: "hsl(210, 65%, 90%);",
  scoreHighlight: "hsl(210, 65%, 90%);",
  choir: [...config.choirHues],
};
var loadedColors: Colors;

export function colors(reload = false): Colors {
  if (!reload && loadedColors) return loadedColors; // no need to reload if we already have the colors
  var style = getComputedStyle(document.body);
  if (!style || style.getPropertyValue("--color-background").length == 0) {
    // Build a fresh choir array on every fallback call so a caller
    // mutating the returned array cannot corrupt later callers' views.
    return { ...defaultColors, choir: [...defaultColors.choir] };
  }
  loadedColors = {
    background: style.getPropertyValue("--color-background"),
    highlight: style.getPropertyValue("--color-highlight"),
    scoreHighlight: style.getPropertyValue("--color-score-highlight"),
    // TODO: hues here are still read from --color-c1..c8 in style.scss,
    // not from config.choirHues. The two must stay in sync by hand
    // until the CSS branch is also driven from config.
    choir: [
      Number(style.getPropertyValue("--color-c1")),
      Number(style.getPropertyValue("--color-c2")),
      Number(style.getPropertyValue("--color-c3")),
      Number(style.getPropertyValue("--color-c4")),
      Number(style.getPropertyValue("--color-c5")),
      Number(style.getPropertyValue("--color-c6")),
      Number(style.getPropertyValue("--color-c7")),
      Number(style.getPropertyValue("--color-c8")),
    ],
  };
  return loadedColors;
}

// the time of a hemidemisemiquaver (64th note) in seconds, derived from the default recording tempo
export const HDSQTIME =
  config.bartime[0][config.bartime[0].length - 1] /
  config.barno[0][config.barno[0].length - 1] /
  64;

export function toNum(
  s: string | number,
  integer: boolean = true,
  max?: number
) {
  var nums: number = Number(s);
  if (max) nums = Math.min(Math.max(0, nums), max);
  return integer ? Math.floor(nums + HDSQTIME) : nums;
}

// Fail fast at import time: mismatched lengths would silently corrupt
// getBarFromTime/getTimeFromBar interval lookups. Throwing at module scope
// breaks the whole app on bad config — intentional, since the alternative
// is a hard-to-trace runtime divergence. See refactor-common.ts.md for the
// related untracked-debt discussion.
for (let v = 0; v < config.bartime.length; v++) {
  if (config.bartime[v].length !== config.barno[v].length) {
    throw new Error(
      `config.bartime[${v}] and config.barno[${v}] must have equal length`
    );
  }
}

export function getBarFromTime(t: number, v: number = 0) {
  const lastIdx = config.bartime[v].length - 1;
  if (t <= config.bartime[v][0]) return config.barno[v][0];
  if (t >= config.bartime[v][lastIdx]) return config.barno[v][lastIdx];
  for (let index = 0; index < lastIdx; index++) {
    if (t >= config.bartime[v][index] && t < config.bartime[v][index + 1]) {
      // calculate tempo (bars per second)
      const currenttempo =
        (config.barno[v][index + 1] - config.barno[v][index]) /
        (config.bartime[v][index + 1] - config.bartime[v][index]);
      const b =
        config.barno[v][index] + currenttempo * (t - config.bartime[v][index]);
      return b;
    }
  }
  // Unreachable: the two clamp guards above (t <= bartime[0] and t >= bartime[last])
  // cover every input, and the loop covers every interior interval [bartime[i], bartime[i+1]).
  throw new Error("getBarFromTime: unreachable");
}

export function getTimeFromBar(b: number, v: number = 0) {
  const lastIdx = config.barno[v].length - 1;
  if (b <= config.barno[v][0]) return config.bartime[v][0];
  if (b >= config.barno[v][lastIdx]) return config.bartime[v][lastIdx];
  for (let index = 0; index < lastIdx; index++) {
    if (b >= config.barno[v][index] && b < config.barno[v][index + 1]) {
      // calculate tempo (bars per second)
      const currenttempo =
        (config.barno[v][index + 1] - config.barno[v][index]) /
        (config.bartime[v][index + 1] - config.bartime[v][index]);

      return (
        config.bartime[v][index] + (b - config.barno[v][index]) / currenttempo
      );
    }
  }
  // Unreachable: clamp guards above cover every input and the loop covers every interior interval.
  throw new Error("getTimeFromBar: unreachable");
}
