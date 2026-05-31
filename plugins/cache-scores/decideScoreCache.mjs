/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Decide whether the Netlify SVG cache is a hit or a miss (#423).
 *
 * A HIT (skip the LilyPond install + regeneration and use the restored SVGs) is
 * permitted ONLY when the restored key marker EXACTLY equals the current input
 * key AND the canary SVG is present. Exact-match-only is the same no-stale-ship
 * discipline as #421 — no fuzzy/prefix matching. An empty or absent `currentKey`
 * is a defined defensive MISS: a key should always be computable, so this guards
 * a broken input set rather than being a normal input.
 *
 * The canary presence check guards a TOTAL payload wipe (the restored tree is
 * missing the canary's edition entirely). It does NOT detect a sub-tree partial
 * restore that happens to include the canary; that residual is hardened in the
 * build-side canary work (#424). Any non-hit state is a MISS → full install +
 * regenerate.
 *
 * @param {{restoredKey?: string | null, currentKey?: string, canaryPresent: boolean}} state
 * @returns {"hit" | "miss"}
 */
export function decideScoreCache({ restoredKey, currentKey, canaryPresent }) {
  if (!currentKey) return "miss";
  if (canaryPresent && restoredKey === currentKey) return "hit";
  return "miss";
}
