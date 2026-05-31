// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";

import { decideScoreCache } from "../../plugins/cache-scores/decideScoreCache.mjs";

// The load-bearing rule for the Netlify SVG cache (#423): a HIT (skip the
// LilyPond install + regeneration, use the restored SVGs) is allowed ONLY when
// the restored key marker EXACTLY matches the current input key AND the canary
// SVG is present. Anything else is a MISS → full install + regenerate. This is
// the same no-stale-ship guarantee as #421's exact-key-only cache.
describe("decideScoreCache", () => {
  const KEY = "a".repeat(64);

  it("hits when the restored key matches and the canary is present", () => {
    expect(
      decideScoreCache({
        restoredKey: KEY,
        currentKey: KEY,
        canaryPresent: true,
      })
    ).toBe("hit");
  });

  it("misses when the restored key differs from the current key (stale)", () => {
    expect(
      decideScoreCache({
        restoredKey: "b".repeat(64),
        currentKey: KEY,
        canaryPresent: true,
      })
    ).toBe("miss");
  });

  it("misses when there is no restored key marker", () => {
    expect(
      decideScoreCache({
        restoredKey: undefined,
        currentKey: KEY,
        canaryPresent: true,
      })
    ).toBe("miss");
  });

  it("misses when the key matches but the canary SVG is absent", () => {
    // A partially-restored cache: the marker is there but the payload isn't.
    expect(
      decideScoreCache({
        restoredKey: KEY,
        currentKey: KEY,
        canaryPresent: false,
      })
    ).toBe("miss");
  });

  it("misses when the current key is empty (defensive)", () => {
    expect(
      decideScoreCache({
        restoredKey: "",
        currentKey: "",
        canaryPresent: true,
      })
    ).toBe("miss");
  });

  it("misses on a near-match key — exact-match-only, no fuzzy/prefix (#421 discipline)", () => {
    // Pins the `===` against any future fuzzy/startsWith/prefix drift: a stale
    // tree must never ship. Covers all three prefix/length relations so no
    // single-direction prefix mutant survives — a same-length last-character
    // difference, a strict prefix of the current key (restored shorter), and a
    // superset (restored = current key + suffix). The plain mismatch case above
    // differs in every character and so exercises none of these.
    expect(
      decideScoreCache({
        restoredKey: "a".repeat(63) + "z",
        currentKey: KEY,
        canaryPresent: true,
      })
    ).toBe("miss");
    expect(
      decideScoreCache({
        restoredKey: "a".repeat(32),
        currentKey: KEY,
        canaryPresent: true,
      })
    ).toBe("miss");
    expect(
      decideScoreCache({
        restoredKey: KEY + "z",
        currentKey: KEY,
        canaryPresent: true,
      })
    ).toBe("miss");
  });

  it("misses when the restored key is null (no marker restored)", () => {
    // A restore that yields nothing is naturally a nullable "no key"; the
    // contract tolerates null (see the string | null param type) as a miss.
    expect(
      decideScoreCache({
        restoredKey: null,
        currentKey: KEY,
        canaryPresent: true,
      })
    ).toBe("miss");
  });
});
