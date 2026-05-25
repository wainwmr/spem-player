# VERA-353 Review Checklist

Mode: work
Generated: 2026-05-25 14:45
Last run:  2026-05-25 14:45

## Findings

### 353-01 — [critical] Empty glob silently skips rebuild
Agent: silent-failure-hunter
File: build/buildScores.mjs:88-94
Status: open
Notes: If `globSync` returns `[]`, `reduce(..., 0)` yields `maxMtime = 0`,
and `0 > svgStat.mtimeMs` is always false — `needsRebuild` returns `false`
and the SVG is silently treated as up-to-date even though no source files
were found. This is a logical contradiction (the caller's own `lyPath` is
in `versionDir`) and should fail loudly. Fix: assert `lyFiles.length > 0`
or throw with a descriptive error.

### 353-02 — [critical] statSync throws abort the build with no context
Agent: silent-failure-hunter
File: build/buildScores.mjs:90
Status: open
Notes: `statSync(file)` inside `reduce` will throw on broken symlinks,
TOCTOU races (file deleted between glob and stat), permission errors, or
network-drive hiccups. The exception propagates with a raw Node stack
trace — no offending file name, no indication it came from the include
scan. The pre-change code only `stat`ed two known files; the new code
stats an unbounded set. Fix: wrap each `statSync` with try/catch that
either skips with a warning or fails loudly with the file path.

### 353-03 — [critical] Missing rationale comment for glob-MAX strategy
Agent: comment-analyzer
File: build/buildScores.mjs:83-94
Status: open
Notes: The new logic makes three non-obvious decisions that a cold
reader cannot recover from the code alone: (a) why glob rather than
parse `\include` directives, (b) why MAX across all files rather than
just the transitive includers, (c) why `dirname(dirname(...))` — what
directory-layout invariant does this encode. Fix: 3-4 line block above
`needsRebuild` explaining the over-approximation strategy and the
assumed `version/notation/file.ly` layout.

### 353-04 — [important] dirname(dirname(lyPath)) layout invariant is brittle
Agent: silent-failure-hunter, type-design-analyzer, comment-analyzer
File: build/buildScores.mjs:87
Status: open
Notes: `dirname(dirname(lyPath))` only works because every `.ly` lives
two levels deep under the version root. If a future caller passes a
flat-layout `.ly`, or if `--choir` accepts a path the user typed,
`versionDir` silently points at the wrong place and the glob scans the
wrong tree. No assertion, no warning. Fix: compute `versionDir` from
`options.version` explicitly at the call site, or assert the path
shape.

### 353-05 — [important] needsRebuild's lyPath param is now misleadingly named
Agent: type-design-analyzer
File: build/buildScores.mjs:83
Status: open
Notes: `lyPath` no longer determines the rebuild — it is only a seed
used to derive `versionDir`. The signature lies about the contract.
Fix: rename to `representativeLyPath` with a comment, or — better —
pass `versionDir` directly from the call site and drop the indirection
(see 353-04 fix).

### 353-06 — [important] Per-call redundant glob and stat
Agent: type-design-analyzer, code-reviewer
File: build/buildScores.mjs:88-94 (called from line 154 inner loop)
Status: open
Notes: `needsRebuild` is invoked once per choir `.ly` file inside the
per-notation loop, and each call re-runs `globSync` plus `statSync` for
every match. ~8 choirs × 2 notations × ~10 `.ly` files = ~160 redundant
stats per build, all returning the same value within one build.
Beyond the wasted I/O, this couples the invariant "all `.ly` under
versionDir affect every SVG" to the inner loop. Fix: hoist max-mtime
computation to the outer loop (around line 141) and pass the result
into `needsRebuild`.

### 353-07 — [important] Cross-notation rebuild scope is broader than the ticket implies
Agent: code-reviewer, test-analyzer
File: build/buildScores.mjs:89
Status: open
Notes: `versionDir` is the edition root, so the glob picks up both
`early/*.ly` and `modern/*.ly`. Touching `early/Choir I A.ly` forces a
rebuild of every `modern/` score and vice versa. If this is the
intended semantics ("any change in the edition rebuilds everything"),
it works but should be documented; a tighter rule would glob just
`${lyDir}/*.ly` plus `${versionDir}/*.ly` (notation siblings + edition
includes only).

### 353-08 — [important] Glob pattern depth is flavour-dependent
Agent: silent-failure-hunter
File: build/buildScores.mjs:89
Status: open
Notes: `${versionDir}/**/*.ly` may or may not include `.ly` files
directly in `versionDir` depending on glob implementation. The test
passes because `fs.globSync` does include the base, but this is
undocumented at the call site. Fix: explicit pattern (e.g.
`${versionDir}/*.ly` + `${versionDir}/*/*.ly`) or a comment pinning the
assumption.

### 353-09 — [important] New test's >= assertion is weak
Agent: pr-test-analyzer
File: src/test/buildScores.test.ts:294
Status: open
Notes: `expect(afterSecond).toBeGreaterThan(afterFirst)` passes when
*any* score rebuilds, not when *all* expected scores rebuild. Fix:
assert `afterSecond >= afterFirst + 8` (or `=== afterFirst * 2` for
the all-rebuild case) to pin the intended behaviour.

### 353-10 — [important] Missing test for sibling-notation rebuild
Agent: pr-test-analyzer
File: src/test/buildScores.test.ts (new test)
Status: open
Notes: The cross-notation coupling (353-07) is now load-bearing
behaviour. A test that touches `modern/Choir I A.ly` and asserts
`early/*.svg` rebuilds would pin this design choice. Without it, a
future tightening of the glob silently breaks the current behaviour.

### 353-11 — [important] Missing test for self-rebuild path
Agent: pr-test-analyzer
File: src/test/buildScores.test.ts
Status: open
Notes: The original pre-PR behaviour — rebuild when the choir's own
`.ly` is newer than the SVG — must still work. The existing tests
cover the "no change" path but not the self-touch path. Fix: add a
test that touches the choir's own `.ly` and asserts rebuild.

### 353-12 — [suggestion] Test mtime flake risk on coarse filesystems
Agent: type-design-analyzer, code-reviewer
File: src/test/buildScores.test.ts:280
Status: open
Notes: `utimesSync(includePath, new Date(), new Date())` may produce
an mtime equal to (not greater than) the SVG written milliseconds
earlier on FAT/exFAT (2s resolution) or some network filesystems.
Fix: `new Date(Date.now() + 2000)` to make "include is newer" robust.

### 353-13 — [suggestion] reduce seed 0 is semantically meaningless
Agent: type-design-analyzer
File: build/buildScores.mjs:91-94
Status: open
Notes: `reduce((max, file) => Math.max(max, statSync(file).mtimeMs), 0)`
uses `0` as a sentinel. `Math.max(...lyFiles.map(f => statSync(f).mtimeMs))`
is clearer, and naturally surfaces the empty-glob case (`Math.max()` is
`-Infinity`, which never exceeds an SVG mtime — same bug as 353-01 but
the empty-glob signal becomes explicit).

### 353-14 — [suggestion] No log of which include triggered the rebuild
Agent: silent-failure-hunter
File: build/buildScores.mjs
Status: open
Notes: When `maxMtime > svgStat.mtimeMs`, the user sees "Building ..."
with no indication of which `.ly` was newer. Debugging spurious
rebuilds requires manual stat-ing. Suggestion to log the freshest file.

### 353-15 — [suggestion] No test for include-file deletion
Agent: pr-test-analyzer
File: src/test/buildScores.test.ts
Status: open
Notes: If a `.ly` is removed, `globSync` simply omits it. Low-risk
but worth a sentence-long test.

### 353-16 — [suggestion] No test for multiple include files
Agent: pr-test-analyzer
File: src/test/buildScores.test.ts
Status: open
Notes: Only `spem.ly` is touched in the new test. Touching the
*oldest* of multiple includes would confirm `reduce(Math.max)`
semantics.

### 353-17 — [suggestion] Test path encodes the same layout invariant as production
Agent: type-design-analyzer
File: src/test/buildScores.test.ts:278
Status: open
Notes: `join(ws, "src", "lilypond", "Hugh Keyte", "spem.ly")`
hard-codes the version-root assumption. Extract `versionDirOf(ws)` and
share with production (or just comment).

### 353-18 — [suggestion] Pre-existing — two imports from "fs"
Agent: code-reviewer
File: build/buildScores.mjs:7-8
Status: open (pre-existing)
Notes: `import { existsSync, statSync, rmSync } from "fs";` and
`import { globSync } from "fs";` could be consolidated. Not caused by
this diff but pre-existing nit.
