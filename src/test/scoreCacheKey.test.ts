// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { execFileSync } from "child_process";
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "fs";
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

  it("changes the key when a file is renamed but its content is unchanged", () => {
    const before = computeScoreCacheKey({ root });
    renameSync(
      join(root, "src/lilypond/Hugh Keyte/modern/Choir I A.ly"),
      join(root, "src/lilypond/Hugh Keyte/modern/Choir I Z.ly")
    );
    expect(computeScoreCacheKey({ root })).not.toBe(before);
  });

  // Each content is hashed bound to its path (path, then NUL, then content),
  // so swapping two files' contents must change the key. A regression that
  // hashed contents without binding them to paths would leave this unchanged.
  it("binds content to its path: swapping two files' contents changes the key", () => {
    const before = computeScoreCacheKey({ root });
    writeFileSync(
      join(root, "build/buildScores.mjs"),
      "// post-processing logic\n"
    );
    writeFileSync(
      join(root, "build/postprocessSvg.mjs"),
      "// generation logic\n"
    );
    expect(computeScoreCacheKey({ root })).not.toBe(before);
  });

  // A key over zero matched inputs (a renamed/moved tree, a mis-resolved root,
  // a glob that matches nothing) would be the constant empty-sha256 digest —
  // valid-looking and stable, so it would silently alias every "no inputs"
  // state to one cache entry. The function must refuse to emit such a key.
  it("throws rather than emit a key when no inputs match", () => {
    const emptyRoot = mkdtempSync(join(tmpdir(), "score-cache-empty-"));
    try {
      expect(() => computeScoreCacheKey({ root: emptyRoot })).toThrow();
    } finally {
      rmSync(emptyRoot, { recursive: true, force: true });
    }
  });

  // Exact (not arrayContaining) so adding a new input class forces this test to
  // be updated — a prompt to add a matching fixture and mutation case above.
  it("declares exactly the input classes in SCORE_CACHE_INPUTS", () => {
    expect(SCORE_CACHE_INPUTS).toEqual([
      "src/lilypond/**/*.ly",
      "build/buildScores.mjs",
      "build/postprocessSvg.mjs",
      "build/install-lilypond.sh",
    ]);
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
