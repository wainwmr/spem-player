/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Decide whether the Netlify SVG cache is a hit or a miss (#423).
 *
 * A HIT (skip the LilyPond install + regeneration and use the restored SVGs) is
 * permitted ONLY when the restored key marker EXACTLY equals the current input
 * key AND the canary SVG is present (guarding a partial restore). Any other
 * state is a MISS → full install + regenerate. Exact-match-only is the same
 * no-stale-ship discipline as #421 — no fuzzy/prefix matching.
 *
 * @param {{restoredKey?: string, currentKey?: string, canaryPresent: boolean}} state
 * @returns {"hit" | "miss"}
 */
export function decideScoreCache({ restoredKey, currentKey, canaryPresent }) {
  if (!currentKey) return "miss";
  if (canaryPresent && restoredKey === currentKey) return "hit";
  return "miss";
}
