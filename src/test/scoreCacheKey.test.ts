// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { execFileSync } from "child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  computeScoreCacheKey,
  SCORE_CACHE_INPUTS,
} from "../../build/scoreCacheKey.mjs";

// A minimal fixture mirroring the real input layout. Each entry represents one
// "input class" the cache key must be sensitive to (#421): a choir .ly, a shared
// include, the generation script, the post-processing script, and the LilyPond
// version pin. Keying on anything less ships a stale cache — wrong scores,
// silently — which is the whole reason this ticket has a Vera gate.
const FIXTURE_FILES: Record<string, string> = {
  "src/lilypond/Hugh Keyte/modern/Choir I A.ly": "% choir I A\n",
  "src/lilypond/Hugh Keyte/spem.ly": "% shared include\n",
  "build/buildScores.mjs": "// generation logic\n",
  "build/postprocessSvg.mjs": "// post-processing logic\n",
  "build/install-lilypond.sh": 'LILYPOND_VERSION="2.26.0"\n',
};

function writeFixture(root: string, files: Record<string, string>): void {
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
}

describe("computeScoreCacheKey", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "score-cache-"));
    writeFixture(root, FIXTURE_FILES);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("is deterministic for identical inputs", () => {
    expect(computeScoreCacheKey({ root })).toBe(computeScoreCacheKey({ root }));
  });

  it("produces a 64-char hex digest (sha256)", () => {
    expect(computeScoreCacheKey({ root })).toMatch(/^[0-9a-f]{64}$/);
  });

  // The load-bearing property: changing ANY single input class must change the
  // key. If one class is missing from the hash, mutating it would leave the key
  // unchanged and the cache would serve stale scores.
  it.each(Object.keys(FIXTURE_FILES))(
    "changes the key when %s changes in isolation",
    (changedFile) => {
      const before = computeScoreCacheKey({ root });
      writeFileSync(join(root, changedFile), "MUTATED\n");
      expect(computeScoreCacheKey({ root })).not.toBe(before);
    }
  );

  it("changes the key when a new .ly file is added", () => {
    const before = computeScoreCacheKey({ root });
    writeFixture(root, {
      "src/lilypond/Hugh Keyte/modern/Choir IX A.ly": "% new choir\n",
    });
    expect(computeScoreCacheKey({ root })).not.toBe(before);
  });

  it("changes the key when an input file is removed", () => {
    const before = computeScoreCacheKey({ root });
    rmSync(join(root, "src/lilypond/Hugh Keyte/spem.ly"));
    expect(computeScoreCacheKey({ root })).not.toBe(before);
  });

  it("declares every input class in SCORE_CACHE_INPUTS", () => {
    expect(SCORE_CACHE_INPUTS).toEqual(
      expect.arrayContaining([
        "src/lilypond/**/*.ly",
        "build/buildScores.mjs",
        "build/postprocessSvg.mjs",
        "build/install-lilypond.sh",
      ])
    );
  });

  // The workflows consume the key via the CLI (`node build/scoreCacheKey.mjs`);
  // the tests validate the exported function. This guards that the two agree, so
  // the key the cache is keyed on is the key the tests prove correct.
  it("CLI output matches the exported function over the real repo", () => {
    const script = join(process.cwd(), "build", "scoreCacheKey.mjs");
    const cliKey = execFileSync("node", [script], { encoding: "utf-8" }).trim();
    expect(cliKey).toBe(computeScoreCacheKey());
  });
});
