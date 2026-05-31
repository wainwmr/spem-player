/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

// Netlify build plugin: cache the generated SVGs across production deploys so an
// unchanged-input build skips the LilyPond install + regeneration (#423). It
// reuses #421's content-hash key and is FAIL-SAFE — any cache error degrades to
// a full install + build, never a broken or stale deploy. The build command in
// netlify.toml branches on the `.netlify-scores-hit` flag this plugin writes on
// a hit; on a miss it clears the restored payload so the build regenerates.

import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";

import { computeScoreCacheKey } from "../../build/scoreCacheKey.mjs";
import { decideScoreCache } from "./decideScoreCache.mjs";

const SCORES_DIR = "src/scores";
const KEY_MARKER = ".scores-cache-key";
const HIT_FLAG = ".netlify-scores-hit";
// Mirror buildScores.mjs's --skip-if-missing canary (default "Hugh Keyte" edition).
const CANARY = "src/scores/Hugh Keyte/modern/Choir I A.svg";

export async function onPreBuild({ utils }) {
  try {
    const currentKey = computeScoreCacheKey();
    await utils.cache.restore(SCORES_DIR);
    await utils.cache.restore(KEY_MARKER);

    const restoredKey = existsSync(KEY_MARKER)
      ? readFileSync(KEY_MARKER, "utf-8").trim()
      : undefined;

    const decision = decideScoreCache({
      restoredKey,
      currentKey,
      canaryPresent: existsSync(CANARY),
    });

    if (decision === "hit") {
      writeFileSync(HIT_FLAG, currentKey);
      console.log(
        "cache-scores: HIT — build will skip the LilyPond install + render.",
      );
    } else {
      // Stale or partial restore: clear the payload + marker so the build
      // regenerates from clean, and ensure no hit flag is left set.
      rmSync(SCORES_DIR, { recursive: true, force: true });
      rmSync(KEY_MARKER, { force: true });
      rmSync(HIT_FLAG, { force: true });
      console.log(
        "cache-scores: MISS — build will install LilyPond and regenerate.",
      );
    }
  } catch (err) {
    // Fail-safe: any cache problem falls through to the full install + build.
    rmSync(HIT_FLAG, { force: true });
    console.log(
      `cache-scores: pre-build cache skipped (${err?.message ?? err}); running a full build.`,
    );
  }
}

export async function onPostBuild({ utils }) {
  try {
    const currentKey = computeScoreCacheKey();
    writeFileSync(KEY_MARKER, currentKey);
    await utils.cache.save(SCORES_DIR);
    await utils.cache.save(KEY_MARKER);
    console.log("cache-scores: saved src/scores for the next build.");
  } catch (err) {
    // Fail-safe: a save failure must NOT fail an otherwise-good deploy — the
    // scores that shipped are correct; the next build is simply a miss.
    console.log(
      `cache-scores: cache save skipped (${err?.message ?? err}); next build will be a miss.`,
    );
  }
}
