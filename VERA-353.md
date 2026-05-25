# VERA-353 Review Checklist

Mode: work
Generated: 2026-05-25 14:45
Last run:  2026-05-25 15:28

## Findings

### 353-01 — [critical] Empty glob silently skips rebuild

Agent: silent-failure-hunter
File: build/buildScores.mjs:88-94
Status: addressed
Notes: `maxLyMtimeFor` now uses `Math.max(...lyFiles.map(...))` rather
than `reduce(..., 0)`, and throws if `lyFiles.length === 0`. The empty
case becomes a loud error instead of a silent skip.

### 353-02 — [critical] statSync throws abort the build with no context

Agent: silent-failure-hunter
File: build/buildScores.mjs:90
Status: deferred
Notes: Deferred to a follow-up Workbench item. The new code stats more
files than the old code, so the broken-symlink / TOCTOU / permission
surface grows slightly. In practice these don't happen on this repo,
but the defensive gap is real. Out of scope for this PR — the existing
rebuild path has the same gap; a follow-up should wrap statSync
uniformly across buildScores.mjs.

### 353-03 — [critical] Missing rationale comment for glob-MAX strategy

Agent: comment-analyzer
File: build/buildScores.mjs:83-94
Status: addressed
Notes: 13-line comment block added above `maxLyMtimeFor` documenting
the over-approximation strategy, what triggers what, and the
notation-isolation property.

### 353-04 — [important] dirname(dirname(lyPath)) layout invariant is brittle

Agent: silent-failure-hunter, type-design-analyzer, comment-analyzer
File: build/buildScores.mjs:87
Status: addressed
Notes: `dirname` is no longer used. `versionDir` is computed at the
call site directly as `src/lilypond/${version}` (the same template the
notation directory uses), so the layout invariant is explicit and
local.

### 353-05 — [important] needsRebuild's lyPath param is now misleadingly named

Agent: type-design-analyzer
File: build/buildScores.mjs:83
Status: addressed
Notes: `needsRebuild(maxLyMtime, svgPath)` — the function now reflects
its actual responsibility (compare a precomputed mtime against an SVG
mtime). The mtime computation is in `maxLyMtimeFor`.

### 353-06 — [important] Per-call redundant glob and stat

Agent: type-design-analyzer, code-reviewer
File: build/buildScores.mjs:88-94 (called from line 154 inner loop)
Status: addressed
Notes: `maxLyMtimeFor` is called once per notation (in the outer
loop), then passed into each `buildScore` call. Drops ~160 redundant
stats per build.

### 353-07 — [important] Cross-notation rebuild scope is broader than the ticket implies

Agent: code-reviewer, test-analyzer
File: build/buildScores.mjs:89
Status: addressed
Notes: Glob tightened from `${versionDir}/**/*.ly` (recursive across
both notations) to `${lyDir}/*.ly` + `${versionDir}/*.ly` (notation
siblings + edition-root includes only). Touching `modern/Choir I A.ly`
no longer rebuilds `early/*` SVGs. Verified by new test.

### 353-08 — [important] Glob pattern depth is flavour-dependent

Agent: silent-failure-hunter
File: build/buildScores.mjs:89
Status: addressed
Notes: Explicit two-glob form (`${lyDir}/*.ly` + `${versionDir}/*.ly`)
removes the `**` ambiguity. Each glob is one level deep.

### 353-09 — [important] New test's toBeGreaterThan assertion is weak

Agent: pr-test-analyzer
File: src/test/buildScores.test.ts
Status: addressed
Notes: Tightened to `toBe(afterFirst + 16)` for the version-root
include test (all 16 scores rebuild), `toBe(afterFirst + 8)` for the
sibling-notation isolation test (only modern's 8 rebuild).

### 353-10 — [important] Missing test for sibling-notation rebuild

Agent: pr-test-analyzer
File: src/test/buildScores.test.ts
Status: rejected
Notes: 353-07's fix means sibling notations are no longer coupled.
The test 353-10 proposed (touch modern, assert early rebuilds) would
now fail by design. Replaced by the new sibling-notation
*isolation* test added for 353-07.

### 353-11 — [important] Missing test for self-rebuild path

Agent: pr-test-analyzer
File: src/test/buildScores.test.ts
Status: addressed
Notes: New test "rebuilds the touched choir's notation when its own
.ly is newer" added. Touches `early/Choir I A.ly` and asserts the
build's invocation count grows (over-approximation: all early scores
rebuild because of the notation-level glob).

### 353-12 — [suggestion] Test mtime flake risk on coarse filesystems

Agent: type-design-analyzer, code-reviewer
File: src/test/buildScores.test.ts:280
Status: addressed
Notes: All three new tests use `new Date(Date.now() + 2000)` rather
than `new Date()` for `utimesSync`. Two-second margin survives 2s
mtime resolution (FAT/exFAT).

### 353-13 — [suggestion] reduce seed 0 is semantically meaningless

Agent: type-design-analyzer
File: build/buildScores.mjs:91-94
Status: addressed
Notes: Replaced `reduce((max, f) => Math.max(...), 0)` with
`Math.max(...lyFiles.map(...))`. The empty-glob case is handled by
the length check in 353-01 rather than relying on `0` as a sentinel.

### 353-14 — [suggestion] No log of which include triggered the rebuild

Agent: silent-failure-hunter
File: build/buildScores.mjs
Status: rejected
Notes: Minor convenience for debugging spurious rebuilds — no
functional impact. Not worth tracking as an item; can be added later
if debugging proves painful.

### 353-15 — [suggestion] No test for include-file deletion

Agent: pr-test-analyzer
File: src/test/buildScores.test.ts
Status: rejected
Notes: Low value; the behaviour ("globSync omits missing files") is
trivially correct and the test would be a single line of negative
verification. Not worth scope creep.

### 353-16 — [suggestion] No test for multiple include files

Agent: pr-test-analyzer
File: src/test/buildScores.test.ts
Status: rejected
Notes: `Math.max(...)` semantics are obvious enough that pinning each
file independently adds noise. The version-root-include test already
exercises the maxing.

### 353-17 — [suggestion] Test path encodes the same layout invariant as production

Agent: type-design-analyzer
File: src/test/buildScores.test.ts
Status: rejected
Notes: Extracting a `versionDirOf(ws)` helper for one shared invariant
in two locations is premature. Reconsider if a third use appears.

### 353-18 — [suggestion] Pre-existing — two imports from "fs"

Agent: code-reviewer
File: build/buildScores.mjs:7-8
Status: addressed
Notes: Consolidated to a single `import { existsSync, globSync, rmSync,
statSync } from "fs";`. Pre-existing nit, fixed opportunistically as
the import block was edited anyway.

### 353-19 — [important] Self-rebuild test still uses loose toBeGreaterThan

Agent: code-reviewer, pr-test-analyzer
File: src/test/buildScores.test.ts:339
Status: addressed
Notes: Tightened to `toBe(afterFirst + 8)`. The test now pins both
sides of the over-approximation: touching `early/Choir I A.ly` must
rebuild all 8 early scores (the notation-level glob) and must not
touch any of the 8 modern scores (sibling-notation isolation). A
future refactor that narrows the glob to just the touched choir, or
broadens it back to cross-notation, would fail this test.

### 353-20 — [important] needsRebuild signature trusts caller for scoping

Agent: type-design-analyzer
File: build/buildScores.mjs:108
Status: addressed
Notes: JSDoc added to `needsRebuild` documenting that `maxLyMtime`
must come from `maxLyMtimeFor(lyDir, versionDir)` matching the SVG's
notation, and that passing an out-of-scope mtime silently violates
the over-approximation strategy. The loop structure currently
enforces correct pairing; the JSDoc surfaces the contract for any
future caller.

### 353-21 — [important] maxLyMtimeFor throws inconsistent with other error paths

Agent: type-design-analyzer
File: build/buildScores.mjs:179 (call site)
Status: addressed
Notes: Wrapped the `maxLyMtimeFor` call in `try/catch` with
`console.error + process.exit(1)`, matching the existing error paths
for `lilypond` invocation, post-processing, and empty pattern globs.
The empty-glob case now produces a tidy one-line error rather than a
raw Node stack trace.
