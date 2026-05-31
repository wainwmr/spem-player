/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { createHash } from "crypto";
import { globSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

/**
 * Single source of truth for the SVG-cache key inputs (#421).
 *
 * Every input that affects the rendered + post-processed SVGs MUST appear here.
 * Miss one and a stale cache ships wrong scores silently. The set:
 *  - `src/lilypond/**\/*.ly` — choir files AND shared includes (spem.ly,
 *    `spem words.ly`, the per-notation layout.ly, basic.ly).
 *  - `build/buildScores.mjs` — the generation logic (LilyPond invocation,
 *    rebuild scoping, CLI parsing).
 *  - `build/postprocessSvg.mjs` — the post-processing logic (part annotation,
 *    dimension stripping, dedup).
 *  - `build/install-lilypond.sh` — pins LILYPOND_VERSION, so a LilyPond version
 *    bump busts the cache.
 *
 * Known residual (deliberately NOT keyed on): postprocessSvg.mjs serialises via
 * `@xmldom/xmldom`. A serialization-changing xmldom bump could in theory stale
 * the cache. We do not key on package-lock.json because it churns on every
 * unrelated dependency bump (a vitest patch has nothing to do with SVG bytes),
 * which would defeat the cache. If an xmldom upgrade ever changes output, add
 * the resolved `@xmldom/xmldom` version to this list. See #421.
 */
export const SCORE_CACHE_INPUTS = [
  "src/lilypond/**/*.ly",
  "build/buildScores.mjs",
  "build/postprocessSvg.mjs",
  "build/install-lilypond.sh",
];

// Repo root, resolved from this file's location (`build/` is one level down).
const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");

/**
 * Compute a deterministic cache key over all {@link SCORE_CACHE_INPUTS}.
 *
 * Hashes both the (separator-normalised) relative path and the content of every
 * matching file, in sorted order, so the key changes when any file's content
 * changes, or a file is added, removed, or renamed. Path separators are
 * normalised to `/` so the key is identical on Windows (local) and Linux (CI).
 *
 * @param {{root?: string}} [opts] - root directory to resolve inputs against;
 *   defaults to the repository root. Tests pass a fixture root.
 * @returns {string} 64-character hex sha256 digest.
 */
export function computeScoreCacheKey({ root = REPO_ROOT } = {}) {
  const files = SCORE_CACHE_INPUTS.flatMap((pattern) =>
    globSync(pattern, { cwd: root }),
  )
    .map((p) => p.replace(/\\/g, "/"))
    .sort();

  const hash = createHash("sha256");
  for (const rel of files) {
    // Hash the path (so add/remove/rename changes the key) then the content (so
    // an edit changes it). NUL separators prevent path/content boundary
    // ambiguity (e.g. "a" + "bc" colliding with "ab" + "c").
    hash.update(rel);
    hash.update("\0");
    hash.update(readFileSync(join(root, rel)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

// CLI: print the key so a workflow step can capture it into an actions/cache key.
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  process.stdout.write(computeScoreCacheKey() + "\n");
}
