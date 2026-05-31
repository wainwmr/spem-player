# VERA-421 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-31 21:30
Last run:  2026-05-31 21:30

See also: [Original Report (cycle 1)](LINK_TO_BE_FILLED_AFTER_ORIGINAL_POSTED)

## Summary

[Placeholder — finalised at close-out.]

## Findings

### 421-01 — [critical] Workflow key step swallows a script crash → self-poisoning constant cache key

> **code-reviewer + silent-failure-hunter, ci.yml:32 / netlify-preview.yml:34:**
> `echo "key=$(node build/scoreCacheKey.mjs)" >> "$GITHUB_OUTPUT"` — under GitHub's `bash -eo pipefail`, a command-substitution failure as an `echo` argument does NOT trip `set -e` (both reviewers reproduced it). A failed/empty key → cache key collapses to the constant `scores-v1-` → first run saves under it, every later run hits it and ships stale SVGs silently. Defeats the no-restore-keys discipline.

**Bob's triage:** Real defect — directly defeats the core no-stale-cache invariant, reproduced empirically by two independent agents, cheap to fix. Address now (both workflows): capture into a var so `set -e` fires, assert `^[0-9a-f]{64}$`, then write.

**Resolution:** [pending]

### 421-02 — [critical] `computeScoreCacheKey` emits a valid key over zero matched files

> **pr-test-analyzer + silent-failure-hunter, scoreCacheKey.mjs:55-70:**
> `globSync` returns `[]` on no match (no throw); `hash.digest("hex")` over empty sha256 = `e3b0c442…b855`, a valid 64-hex digest that passes the shape test and is deterministic. Silently aliases every "no inputs found" state (layout shift, REPO_ROOT/cwd drift, glob miss) to one constant key. `buildScores.mjs` guards this class; the key path does not.

**Bob's triage:** Real defect — second door to the same poisoning, and the empty-sha256 constant even passes the workflow's `^[0-9a-f]{64}$` assertion, so the in-script guard is needed as defence-in-depth with 421-01. Address now: throw when `files.length === 0`, with a test.

**Resolution:** [pending]

### 421-03 — [important] `--skip-if-missing` canary checks 1 SVG of N → partial-cache restore slips through

> **silent-failure-hunter, buildScores.mjs:73-86:**
> On a hit the workflow skips LilyPond and `--skip-if-missing` carries the build, checking one file (`Choir I A.svg`, modern). actions/cache restore is not transactional; a partial restore leaves the canary green while other SVGs are missing/stale, and the build exits 0.

**Bob's triage:** Pre-existing — the canary lives in `buildScores.mjs` (from #318, on `main`); this diff does not touch it. Exposed, not introduced. Per the gate's out-of-scope rule it belongs in its own change, not bundled into #421's cache PR. Defer: file a follow-up ticket to strengthen the canary (count expected vs present SVGs; probe both notations).

**Resolution:** [pending — defer to follow-up ticket]

### 421-04 — [important] Test gaps: NUL-boundary, rename, separator-normalisation, arrayContaining

> **pr-test-analyzer, scoreCacheKey.test.ts:**
> Deleting `hash.update("\0")` fails no test (no boundary-collision pair); rename-with-identical-content not directly asserted; the `.replace(/\\/g,"/")` normalisation has no coverage; `expect.arrayContaining` permits silent input-list growth.

**Bob's triage:** Address the cheap, real ones — a NUL-boundary-collision test, a rename test, and `toEqual` exact (forces a fixture when an input class is added). The cross-OS normalisation assertion is defensive only: the key is computed per-environment, so a Windows key never feeds CI's cache and a false cross-OS match cannot occur — note it, don't chase.

**Resolution:** [pending]

### 421-05 — [suggestion] `SCORE_CACHE_INPUTS: string[]` → `readonly string[]`

> **type-design-analyzer, scoreCacheKey.d.mts:5:** tightens the source-of-truth invariant at zero consumer cost (compile-time-only, since the `.mjs` array isn't frozen).

**Bob's triage:** Cheap, expresses intent, no breakage; editing the file anyway. Apply.

**Resolution:** [pending]

### 421-06 — [suggestion] Comment polish

> **comment-analyzer:** document *when* the cache is saved (post-job step on a key miss — the one load-bearing behaviour with no comment); "could in theory stale" → "could silently stale".

**Bob's triage:** The cache-save-timing clause is genuinely useful for a future maintainer; the wording tweak is fair. Apply both.

**Resolution:** [pending]

### 421-07 — [suggestion] Hard-coded `lilypond-2.26.0` PATH vs the version pin (pre-existing)

> **silent-failure-hunter:** the workflows hard-code `lilypond-2.26.0` in the PATH export while the version pin lives in `install-lilypond.sh`; a missed manual bump points PATH at a nonexistent dir on the miss path.

**Bob's triage:** Pre-existing coupling (#318), surfaced not introduced. Fold into the 421-03 follow-up ticket.

**Resolution:** [pending — defer with 421-03]

### 421-08 — [suggestion] `build/` files fail `prettier --check`

> **code-reviewer:** `build/scoreCacheKey.mjs` / `.d.mts` fail `prettier --check`, but `build/` is outside CI's enforced scope.

**Bob's triage:** The existing `build/*.mjs` are equally unformatted; `build/` is deliberately outside `check:format`. Mine matches house style. Reject — formatting these would make the new files inconsistent with their siblings.

**Resolution:** rejected — `build/` is outside the enforced format scope by house convention; the new files match the existing `build/*.mjs`.
