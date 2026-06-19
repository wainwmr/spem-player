// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import config from "./config";

export type PartType = "all" | number;

export interface Position {
  choir: number;
  part: PartType;
  bar: number;
}

/** The detail payload carried by every `music-*` CustomEvent (#646). */
export type MusicEventDetail = { position: Position };

/** Every custom event name dispatched by `MusicElement.fireEvent` (#646). */
export type MusicEventType =
  | "music-controls-changed"
  | "music-controls-loading"
  | "music-controls-playing"
  | "music-controls-paused"
  | "music-canvas-click"
  | "music-canvas-hover"
  | "music-canvas-touchstart"
  | "music-canvas-touchmove"
  | "music-canvas-touchend"
  | "music-score-click"
  | "music-score-loaded"
  | "music-score-ready";

export type Brightness = "dark" | "light";
export type ScoreType = "early" | "modern";

// Test-only seam: production reads of `MusicScore.testSvgLoader` and
// `globalThis.__SPEM_TEST_SVG_LOADER` are gated by `import.meta.env.MODE`,
// so the runtime checks tree-shake out of production bundles even though
// the type lives here. Keeping the alias near the other domain types
// (rather than in src/test/) lets production sites import it instead of
// re-declaring the signature.
export type TestSvgLoader = (
  scoreType: string,
  choir: number,
  recording: number
) => string | null;

declare global {
  var __SPEM_TEST_SVG_LOADER: TestSvgLoader | undefined;
  // Narrows `addEventListener` and `e.detail` for every music-* event so consumers
  // get a typed `CustomEvent<MusicEventDetail>` without a cast (#646). Keep these
  // keys in lockstep with the `MusicEventType` union above; the eslint
  // `no-empty-object-type` rule rules out the DRYer `extends Record<MusicEventType,
  // ...>` form, so the two lists are deliberately explicit.
  interface HTMLElementEventMap {
    "music-controls-changed": CustomEvent<MusicEventDetail>;
    "music-controls-loading": CustomEvent<MusicEventDetail>;
    "music-controls-playing": CustomEvent<MusicEventDetail>;
    "music-controls-paused": CustomEvent<MusicEventDetail>;
    "music-canvas-click": CustomEvent<MusicEventDetail>;
    "music-canvas-hover": CustomEvent<MusicEventDetail>;
    "music-canvas-touchstart": CustomEvent<MusicEventDetail>;
    "music-canvas-touchmove": CustomEvent<MusicEventDetail>;
    "music-canvas-touchend": CustomEvent<MusicEventDetail>;
    "music-score-click": CustomEvent<MusicEventDetail>;
    "music-score-loaded": CustomEvent<MusicEventDetail>;
    "music-score-ready": CustomEvent<MusicEventDetail>;
  }
}

export type Status = "playing" | "paused" | "loading";
export type RecordingIndex = 0 | 1;

export type State = {
  recording: RecordingIndex; // 0 = ALC, 1 = CotE
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

export function toRecordingIndex(v: string | number): RecordingIndex {
  // Construct-don't-cast: `Number(non-numeric)` yields NaN, so a bare
  // `as RecordingIndex` cast would silently launder NaN past the type
  // system and surface as `undefined.length` deep in async callbacks.
  // Returning by cases keeps the runtime guarantee aligned with the
  // declared `0 | 1` type. Anything `>= 1` (including non-integer and
  // far-over-max) maps to 1; NaN, negative, and `[0, 1)` all map to 0.
  const n = Number(v);
  return n >= 1 ? 1 : 0;
}

// Fail fast at import time: `RecordingIndex` is hard-coded to `0 | 1` and
// `toRecordingIndex` clamps with the literal `1`; both assume
// `config.recording.length === 2`. If a third recording is ever added the
// type and clamp drift silently from the data — assert they stay in step
// at module load.
if (config.recording.length !== 2) {
  throw new Error(
    `RecordingIndex assumes config.recording.length === 2, got ${config.recording.length}`
  );
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

/**
 * Convert an audio time (seconds) to a bar number, linearly interpolated
 * between the tempo-mapping anchor points in `config.bartime[v]` /
 * `config.barno[v]`.
 *
 * Clamps out-of-range inputs: `t <= bartime[0]` returns `barno[0]`;
 * `t >= bartime[last]` returns `barno[last]`. Internal boundaries
 * (exact `t === bartime[i]` for any internal `i`) return `barno[i]` via
 * the half-open `[bartime[i], bartime[i+1])` loop interval; the final
 * boundary is returned by the upper clamp.
 *
 * Non-finite `t` (NaN, ±Infinity) is treated as out-of-range and
 * clamped to `barno[0]`. This matters because `HTMLMediaElement.currentTime`
 * can be NaN before audio metadata loads; without the guard the
 * function would fall through to the unreachable throw and terminate
 * the requestAnimationFrame loop in `MusicControls.ts`. The wider
 * semantic question (clamp / throw / log) is tracked in
 * [#368](https://github.com/wainwmr/spem-player/issues/368).
 *
 * @param t Audio time in seconds.
 * @param v Recording index: 0 = ALC, 1 = CotE. Matches `State.recording`.
 * @returns Bar number in `[barno[0], barno[last]]`. Never returns 0 as
 *   an out-of-range sentinel.
 */
export function getBarFromTime(t: number, v: RecordingIndex = 0) {
  const lastIdx = config.bartime[v].length - 1;
  if (!Number.isFinite(t)) return config.barno[v][0];
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
  // Unreachable for any valid `v` in [0, config.bartime.length): the
  // non-finite guard handles NaN/±Infinity, the two clamp guards
  // (t <= bartime[0], t >= bartime[last]) cover every other finite t,
  // and the loop covers every interior interval [bartime[i], bartime[i+1]).
  // An out-of-range `v` cannot occur: the parameter is `RecordingIndex`
  // (`0 | 1`), narrowed at the boundary by `toRecordingIndex`.
  throw new Error("getBarFromTime: unreachable");
}

/**
 * Convert a bar number to an audio time (seconds), the inverse of
 * `getBarFromTime`. Clamps out-of-range inputs to the first/last anchor
 * time. Internal boundaries return the exact `bartime[i]` via the
 * half-open `[barno[i], barno[i+1])` loop interval; the final boundary
 * is returned by the upper clamp.
 *
 * Non-finite `b` (NaN, ±Infinity) is clamped to `bartime[0]`, matching
 * `getBarFromTime`'s contract. Reachable from `MusicControls.setBar`
 * when a user types a non-numeric value into the bar input.
 *
 * @param b Bar number.
 * @param v Recording index: 0 = ALC, 1 = CotE. Matches `State.recording`.
 * @returns Time in seconds, in `[bartime[0], bartime[last]]`. Never
 *   returns 0 as an out-of-range sentinel.
 */
export function getTimeFromBar(b: number, v: RecordingIndex = 0) {
  const lastIdx = config.barno[v].length - 1;
  if (!Number.isFinite(b)) return config.bartime[v][0];
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
  // Unreachable for any valid `v` (see `getBarFromTime` for full
  // rationale; same coverage applies symmetrically).
  throw new Error("getTimeFromBar: unreachable");
}
