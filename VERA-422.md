# VERA-422 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-06-01 00:00 GMTST
Last run:  2026-06-01 00:12 GMTST

See also: [Original Report (cycle 1)](LINK_TO_BE_FILLED_AFTER_ORIGINAL_POSTED)

## Summary

Pass 1 raised no criticals and five findings. Three reviewers converged on one
root — `doc/CI.md` is stale and is cited by the new code as the policy authority.
Bob's split: address three in #422 (boundary + coercion tests, and the `Duration`
type widening), defer two. The doc update (422-01) goes to the #422 post-merge doc
item, per the publish workflow and the user's standing doc-deferral (doc/CI.md is
only correct on `main` once #422 merges). The telemetry missing-vs-zero gap
(422-05) is pre-existing — `origin/main`'s shell report did the same `||0`
coercion — so it is out of #422's scope and was filed as board ticket #427. Gate
integrity itself was affirmed clean by three reviewers (phase failures fail the
job; `if:always()` can't turn red green; `npx vite build` keeps version injection
via the vite plugin, drops nothing). [Pass-2 outcome noted at close-out.]

## Findings

### 422-01 — [important] doc/CI.md is stale and is cited as the policy authority

> **code-reviewer + silent-failure-hunter + comment-analyzer, doc/CI.md:20,83-94 (untouched by this PR):**
> The new ci.yml Report comment and the ciDurationReport.mjs header point readers to doc/CI.md "Duration
> Budget", but it still describes the two-phase "check + build" model and never mentions the Bundle phase
> or that the render is EXCLUDED from the budget (the whole point of #422). Update to the four-phase model.

**Bob's triage:** Real (3 reviewers), but its disposition under our workflow is the post-merge doc item, not
this PR: publish step 5 routes doc updates there, the user has a standing doc-deferral, and a doc describing
the four-phase model is only correct on `main` once #422 merges. Defer.

**Resolution:** deferred to the #422 post-merge doc item (created in publish step 5), which captures the
four-phase + render-exclusion update to doc/CI.md "Duration Budget" (and the pre-existing `src/scores/**`
paths-filter mismatch). Confirmed with the user.

### 422-02 — [important] ciDurationReport tests: missing soft-budget boundary cases

> **pr-test-analyzer, src/test/ciDurationReport.test.ts:**
> No test pins the `budgetedTotal > totalBudget` boundary (breach test uses 400 vs 360) nor the
> `unit > unitBudget` boundary (150 vs 120). A `>`→`>=` flip on either threshold passes the whole suite.
> Add `==budget` (no warning) and `==budget+1` (warning) for both, independently.

**Bob's triage:** Real test-quality gap (the off-by-one the budget logic hinges on is unpinned). Address now.

**Resolution:** addressed (commit 9f2d819) — added total `==360`/`==361` and unit `==120`/`==121` boundary
tests, each asserting no-warning at the budget and a warning one second over.

### 422-03 — [important] ciDurationReport tests: toInt coercion under-covered

> **pr-test-analyzer, src/test/ciDurationReport.test.ts:**
> Only NaN/undefined exercised. Missing numeric string `"5"`→5 (the only non-zero branch), `"5.5"`→0,
> negative→0, `"abc"`→0. Catches a "simplify toInt to `Number(value)||0`" regression that would break the
> integer/non-negative contract.

**Bob's triage:** Real; the `"5"`→5 case (the only non-zero branch) is the load-bearing one. Address now.

**Resolution:** addressed (commit 9f2d819) — added a numeric-string test (`"5"`/`"3"`/`"20"` parsed, not
dropped) and a coercion test (`"5.5"`, negative, `null`, `"abc"` → 0).

### 422-04 — [important] Duration type omits null; .mjs JSDoc narrower than the runtime

> **type-design-analyzer, build/ciDurationReport.d.mts:7 + ciDurationReport.mjs @param:**
> `Duration = number | string | undefined` omits `null`, which `toInt` handles at runtime; a test passing
> `null` would be rejected by the type. The `.mjs` JSDoc is even narrower (`number|string`). Widen to
> `number | string | null | undefined` and align the JSDoc.

**Bob's triage:** Real `.d.mts`↔runtime drift; the `.mjs` JSDoc was the narrowest of the three. Cheap. Address now.

**Resolution:** addressed (commit 37c6df9) — widened `Duration` to `number | string | null | undefined` in the
`.d.mts` and aligned the `.mjs` `@param`; the `null` coercion test (422-03 commit) locks it. `tsc --noEmit` clean.

### 422-05 — [medium] toInt(...)→0 silently treats a broken/missing measurement as "0s = free"

> **silent-failure-hunter (F3/F4), build/ciDurationReport.mjs:21-24 + ci.yml Report:**
> A broken/garbage/empty duration (or a phase skipped after an earlier failure) coerces to 0s and
> contributes 0 to the budget — a regression behind a broken stopwatch never trips the budget, with no
> "missing vs zero" signal (the all-zero "unavailable" note fires only when ALL four are 0). Recommend a
> sentinel / "n/a (not captured)" distinction.

**Bob's triage:** Real, but pre-existing — `origin/main`'s shell report did the identical `||0` coercion and
the same all-zero-only "unavailable" note. #422 ports it to four phases; it does not introduce or materially
worsen the gap. Per the gate's caused-vs-exposed rule, out of #422 scope. Defer + file.

**Resolution:** deferred — filed as board ticket #427 (tech debt, Tooling): distinguish a missing/broken phase
measurement from a genuine 0s (sentinel / "n/a (not captured)" + unit test).

## Suggestions (noted, non-blocking)

- **pr-test-analyzer Finding 4 (render-only "unavailable"):** addressed opportunistically (commit 9f2d819) —
  added a test that a render-only run (others 0) is NOT "data unavailable" and does not warn.
- **silent-failure-hunter F6:** `npx vite build` skips prebuild — no current silent skip (ohm via check,
  version via vite plugin); the Bundle comment already documents the ohm-via-check dependency, so left as a
  note (an ohm-bundle-exists assertion would be scope creep).
- **type-design-analyzer:** return `number` under-expresses non-negative-int (don't change); a
  summary-contains-`budgetedTotal` test (the value is already asserted numerically — not added); discriminated
  return not warranted. The redundant test at :64 and the untested CLI block (don't add) left as-is.
- **comment-analyzer [B] / code-reviewer:** pre-existing doc/CI.md paths-filter mismatch (`src/scores/**`,
  folded into the post-merge doc item); the hard-coded `lilypond-2.26.0` PATH (LILYPOND_VERSION centralisation
  is #424's other half). Both pre-existing, out of #422 scope.
- **silent-failure-hunter F1/F2/F7, code-reviewer scrutiny points:** gate integrity, exit-status capture, no
  double render, and version-injection-under-vite-build all affirmed correct.
