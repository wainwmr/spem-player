# VERA-318 Final Synthesis (cycle 2)

Mode: redo-pr (Vera re-ran after PR rework, before re-publish)
Cycle: 2
Generated: 2026-05-29 23:50
Last run:  2026-05-29 23:50

See also: [Original Report (cycle 2)](https://github.com/wainwmr/spem-player/issues/318#issuecomment-4580400014)
(Earlier cycles: [Synthesis (cycle 1)](https://github.com/wainwmr/spem-player/issues/318#issuecomment-4564550629))

## Summary

[To be finalised at close-out.]

## Findings

### 318-cycle2-01 — critical CI `test` job will fail with no LilyPond

> silent-failure-hunter [A]. CI test job runs `npm run build`, which triggers `prebuild` → `node build/buildScores.mjs --skip-if-missing`. New probe requires `src/scores/Hugh Keyte/modern/Choir I A.svg` on disk; CI has neither LilyPond nor SVGs → exit 1 → CI fail.

**Bob's triage:** real defect, caused by diff. CI is broken on every PR. Must fix before merge. Cleanest fix: mirror Netlify pattern — `bash build/install-lilypond.sh` + PATH export before `npm run build` in the test job.

**Resolution:** addressed.

### 318-cycle2-02 — critical Integration `skips gracefully` test will break

> silent-failure-hunter [B]. Test at `src/test/integration/buildScores.test.ts:407-426` expects exit 0 + "skipping" output. Post-probe, exit 1 + "no pre-built SVGs". Both assertions fail.

**Bob's triage:** real defect, caused by diff. Test was a guard for the OLD contract; the new contract is "skip only if probe SVG exists". Either pre-create probe SVG in the test or rewrite assertion. Pre-create is cleaner — exercises the actual "skip path with SVGs present" branch.

**Resolution:** addressed.

### 318-cycle2-03 — important Probe hard-codes "Hugh Keyte" edition

> silent-failure-hunter [C]. `buildScores.mjs:76` probes `src/scores/Hugh Keyte/modern/Choir I A.svg`. Running `--version OUP --skip-if-missing` with Hugh-Keyte SVGs but no OUP SVGs → exit 0 → silent wrong-edition build.

**Bob's triage:** real edge-case defect. Cheap fix: parameterise probe path by `options.version`.

**Resolution:** addressed.

### 318-cycle2-04 — important Probe single-canary scope under-documented

> silent-failure-hunter [D] + comment-analyzer [B]. The single-canary probe doesn't catch partial-build state; the comment overstates the protection ("requires existing SVGs to skip safely").

**Bob's triage:** comment hygiene. Accepting the canary scope as documented is fine; rewrite the comment to be honest about it (canary-not-inventory, sufficient for the PR #271 regression mode).

**Resolution:** addressed (comment honest).

### 318-cycle2-05 — important Netlify probe doesn't enforce version + comment overclaims

> silent-failure-hunter [E]. `netlify.toml:15` runs `lilypond --version` (presence probe only). Comment claims "fail-loud probe to catch silent install regression"; probe is weaker than that.

**Bob's triage:** comment hygiene. The buildScores.mjs version check is the real version gate. Weaken the netlify.toml comment to "presence probe; version is enforced by buildScores.mjs".

**Resolution:** addressed (comment tightened).

### 318-cycle2-06 — low install-lilypond.sh partial-extract handling

> silent-failure-hunter [F]. `tar xzf` failure leaves partial extract; subsequent runs print "Using cached" misleadingly. Execution probe still catches it.

**Bob's triage:** defensive nit. Adding `rm -rf` before extract or atomic-rename is straightforward. Out of scope for the immediate CI-unblock; file for follow-up.

**Resolution:** deferred to [Item #298](https://github.com/wainwright1000/spem-tools/issues/298).

### 318-cycle2-07 — important `globalThis` test-loader channel typed as `any`

> type-design [#1+#2]. `(globalThis as any).__SPEM_TEST_SVG_LOADER` defeats the loader signature. A fixture returning `undefined` instead of `null` passes the `svg !== null` check and propagates non-string into DOM.

**Bob's triage:** real silent-failure surface in the test seam. Cheap fix: ambient `global.d.ts` declaration with typed signature, drop the `as any`, change check to `typeof svg === "string"`.

**Resolution:** addressed.

### 318-cycle2-08 — important Loader type duplicated in 3 places

> type-design [#3]. Extract `type TestSvgLoader = ...` so static field, JSDoc, and setup.ts share one source of truth.

**Bob's triage:** bundles cleanly with 318-cycle2-07.

**Resolution:** addressed (bundled with 07).

### 318-cycle2-09 — important fixtureScore.ts permissive `Record<string, number>` fallback

> type-design [#7]. `VIEWBOX_WIDTHS: Record<string, number>` + `?? VIEWBOX_WIDTHS.modern` silently masks typos. Tighten to `keyof typeof VIEWBOX_WIDTHS`.

**Bob's triage:** test-only seam, but the principle (fail loud on unknown inputs) applies more strongly in test code than production.

**Resolution:** addressed.

### 318-cycle2-10 — important `testSvgLoader` JSDoc overstates tree-shaking

> comment-analyzer [A]. JSDoc says "production bundles never carry the hook" — the runtime checks are tree-shaken; the slot declaration is not.

**Bob's triage:** tighten to "production bundles never invoke the hook".

**Resolution:** addressed (bundled with 318-cycle2-07's JSDoc).

### 318-cycle2-11 — low `waitingForLoaded` variable name stale

> comment-analyzer [C]. Variable name doesn't match the `music-score-ready` event it now awaits.

**Bob's triage:** rename to `waitingForReady`. One identifier, one site.

**Resolution:** addressed.

### Out of scope (refactors that pull #318 beyond its purpose)

- type-design #4 — `ScoreType = "modern" | "early"` union from domain. Spans many files.
- type-design #5 — `MusicScoreEventType` discriminated union for `fireEvent`. Cross-cutting refactor.
- type-design #6 — Event-lifecycle JSDoc on the class. Refactor, no current defect.
- type-design #8 — `barCount = 137` magic-number coupling. Cross-file refactor.

These are real type-design improvements but each requires non-trivial cross-file work that doesn't belong in a "untrack SVGs" PR. Noted; not filed (no immediate defect; would be candidates for a focused type-design pass).

## Suggestions (no resolution required)

- code-reviewer: clean — fixture comments load-bearing and accurate, fixture-vs-malformed-href test boundaries clean.
- pr-test-analyzer: clean — both behaviours exercised correctly in merged `postprocessSvg.test.ts`.

- Claude
