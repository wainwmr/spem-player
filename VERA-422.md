# VERA-422 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-06-01 00:?? GMTST
Last run:  2026-06-01 00:?? GMTST

See also: [Original Report (cycle 1)](LINK_TO_BE_FILLED_AFTER_ORIGINAL_POSTED)

## Summary

[Placeholder — finalised at close-out.]

## Findings

### 422-01 — [important] doc/CI.md is stale and is cited as the policy authority

> **code-reviewer + silent-failure-hunter + comment-analyzer, doc/CI.md:20,83-94 (untouched by this PR):**
> The new ci.yml Report comment and the ciDurationReport.mjs header point readers to doc/CI.md "Duration
> Budget", but it still describes the two-phase "check + build" model and never mentions the Bundle phase
> or that the render is EXCLUDED from the budget (the whole point of #422). Update to the four-phase model.

**Bob's triage:** [pending]

**Resolution:** [pending]

### 422-02 — [important] decideReport tests: missing soft-budget boundary cases

> **pr-test-analyzer, src/test/ciDurationReport.test.ts:**
> No test pins the `budgetedTotal > totalBudget` boundary (breach test uses 400 vs 360) nor the
> `unit > unitBudget` boundary (150 vs 120). A `>`→`>=` flip on either threshold passes the whole suite.
> Add `==budget` (no warning) and `==budget+1` (warning) for both, independently.

**Bob's triage:** [pending]

**Resolution:** [pending]

### 422-03 — [important] ciDurationReport tests: toInt coercion under-covered

> **pr-test-analyzer, src/test/ciDurationReport.test.ts:**
> Only NaN/undefined exercised. Missing numeric string `"5"`→5 (the only non-zero branch), `"5.5"`→0,
> negative→0, `"abc"`→0. Catches a "simplify toInt to `Number(value)||0`" regression that would break the
> integer/non-negative contract.

**Bob's triage:** [pending]

**Resolution:** [pending]

### 422-04 — [important] Duration type omits null; .mjs JSDoc narrower than the runtime

> **type-design-analyzer, build/ciDurationReport.d.mts:7 + ciDurationReport.mjs @param:**
> `Duration = number | string | undefined` omits `null`, which `toInt` handles at runtime; a test passing
> `null` would be rejected by the type. The `.mjs` JSDoc is even narrower (`number|string`). Widen to
> `number | string | null | undefined` and align the JSDoc.

**Bob's triage:** [pending]

**Resolution:** [pending]

### 422-05 — [medium] toInt(...)→0 silently treats a broken/missing measurement as "0s = free"

> **silent-failure-hunter (F3/F4), build/ciDurationReport.mjs:21-24 + ci.yml Report:**
> A broken/garbage/empty duration (or a phase skipped after an earlier failure) coerces to 0s and
> contributes 0 to the budget — a regression behind a broken stopwatch never trips the budget, with no
> "missing vs zero" signal (the all-zero "unavailable" note fires only when ALL four are 0). Recommend a
> sentinel / "n/a (not captured)" distinction.

**Bob's triage:** [pending]

**Resolution:** [pending]

## Suggestions (noted, non-blocking)

- **silent-failure-hunter F6:** `npx vite build` skips prebuild — no current silent skip (ohm via check,
  version via vite plugin) but a latent implicit-ordering coupling; consider a one-line note in `check`
  or an ohm-bundle-exists assertion before Bundle.
- **pr-test-analyzer:** render-only asymmetric "unavailable" note (Finding 4); redundant test at :64
  (Finding 5); CLI block untested (Finding 6, don't add).
- **type-design-analyzer:** return `number` under-expresses non-negative-int (don't change); a test
  asserting the summary contains `String(budgetedTotal)` (Finding 4); discriminated return not warranted.
- **comment-analyzer [B] / code-reviewer:** pre-existing doc/CI.md paths-filter mismatch (`src/scores/**`);
  the hard-coded `lilypond-2.26.0` PATH (LILYPOND_VERSION centralisation is #424's other half). Both
  pre-existing, out of #422 scope.
- **silent-failure-hunter F1/F2/F7, code-reviewer scrutiny points:** gate integrity, exit-status capture,
  no double render, and version-injection-under-vite-build all affirmed correct.
