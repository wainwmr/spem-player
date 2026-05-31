/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

// Netlify build plugin: cache the generated SVGs across production deploys so an
// unchanged-input build skips the LilyPond install + regeneration (#423). It
// reuses #421's content-hash key and is FAIL-SAFE — any cache error degrades to
// a full install + build, never a broken or stale deploy. The build command in
// netlify.toml branches on the `.netlify-scores-hit` flag this plugin writes on
// a hit; on a miss it clears the restored payload so the build regenerates.
//
// This runs only in Netlify's build environment — utils.cache is a no-op
// elsewhere, so local `npm run build` and CI never hit this plugin and always
// do a full render. That local-vs-deploy difference is expected, not a bug.

import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";

import { computeScoreCacheKey } from "../../build/scoreCacheKey.mjs";
import { decideScoreCache } from "./decideScoreCache.mjs";

const SCORES_DIR = "src/scores";
const KEY_MARKER = ".scores-cache-key";
const HIT_FLAG = ".netlify-scores-hit";
// Mirror buildScores.mjs's --skip-if-missing canary (default "Hugh Keyte" edition).
// A present canary guards a TOTAL payload wipe; a sub-tree partial restore that
// includes the canary is hardened build-side in #424.
const CANARY = "src/scores/Hugh Keyte/modern/Choir I A.svg";

/**
 * The slice of Netlify's injected build utilities this plugin uses. A local type
 * so a typo in the cache API is caught rather than silently swallowed by the
 * fail-safe catch — which would otherwise mask a permanently-dead cache.
 *
 * @typedef {{ cache: { restore(path: string): Promise<boolean>, save(path: string): Promise<boolean> } }} NetlifyCacheUtils
 */

/** @param {{ utils: NetlifyCacheUtils }} arg */
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
        "cache-scores: HIT — build will skip the LilyPond install + regeneration.",
      );
    } else {
      // Stale, or a partial restore the canary caught: clear the payload +
      // marker so the build regenerates from clean, and ensure no hit flag is
      // left set.
      rmSync(SCORES_DIR, { recursive: true, force: true });
      rmSync(KEY_MARKER, { force: true });
      rmSync(HIT_FLAG, { force: true });
      console.log(
        "cache-scores: MISS — build will install LilyPond and regenerate.",
      );
    }
  } catch (err) {
    // Fail-safe: any cache problem falls through to the full install + build.
    // Warn (not log) so a permanently-failing cache path is visible in deploy
    // log triage rather than buried among routine HIT/MISS lines.
    rmSync(HIT_FLAG, { force: true });
    console.warn(
      `cache-scores: pre-build cache skipped (${err?.message ?? err}); running a full build.`,
    );
  }
}

/** @param {{ utils: NetlifyCacheUtils }} arg */
export async function onPostBuild({ utils }) {
  try {
    const currentKey = computeScoreCacheKey();
    writeFileSync(KEY_MARKER, currentKey);
    // Order matters: save the payload BEFORE the marker. The marker is the
    // commit-point the next build validates against, so saving it last means a
    // half-completed save can never leave a valid marker pointing at absent or
    // partial scores. Do not reorder these two calls.
    await utils.cache.save(SCORES_DIR);
    await utils.cache.save(KEY_MARKER);
    console.log("cache-scores: saved src/scores for the next build.");
  } catch (err) {
    // Fail-safe: a save failure must NOT fail an otherwise-good deploy — the
    // scores that shipped are correct; the next build is simply a miss. Warn so
    // a recurring save failure is visible in deploy log triage.
    console.warn(
      `cache-scores: cache save skipped (${err?.message ?? err}); next build will be a miss.`,
    );
  }
}
