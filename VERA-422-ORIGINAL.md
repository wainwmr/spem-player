# VERA-422 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-06-01 00:?? GMTST

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

Five `pr-review-toolkit` agents reviewed `git diff origin/main...andrew/422-ci-budget-svg-breakout`:
`.github/workflows/ci.yml` (the four-phase split), `build/ciDurationReport.mjs` (+ `.d.mts`),
`src/test/ciDurationReport.test.ts`. No criticals. The headline (3 reviewers): `doc/CI.md` is stale
and the new `ci.yml` comment cites it as the policy authority.

### code-reviewer

> No critical, no important except one. All three scrutiny points verified CLEAN: (1) the `npx vite build`
> Bundle phase — version/branch/year injection is done by the vite plugin `html-version`
> (`transformIndexHtml` in vite.config.ts), runs on ANY vite build, NOT a dropped prebuild step;
> `npx vite build` does not fire the npm `prebuild` hook; ohm is built by Check (`check` starts with
> `build:ohm`), SVGs by Render; no double render; `npm run build` is literally `vite build` so the bundle
> is identical. (2) Phase ordering + exit-status capture — a phase failure fails the job; Check failing
> short-circuits later phases while if:always() Report still runs. (3) `buildDurationReport` correct
> (render excluded; strict `>`; toInt rejects non-int/negative/NaN/float-strings). No lint/knip risk
> (eslint ignores build/, knip lists build/**/*.mjs as entry).
>
> **Important — doc/CI.md is stale and contradicts the behaviour it is cited as the authority for**
> (`doc/CI.md:20,85,87-88,90,92`, unchanged by this branch). Both the ci.yml Report comment
> (`See doc/CI.md "Duration Budget"`) and the `ciDurationReport.mjs` header point here, but the doc still
> says "`npm run check` ... and `npm run build` as one timed phase" / "**Measured phases combined**
> (check + build + unit tests)" and never mentions the Bundle phase or — the whole point of #422 — that
> the render is EXCLUDED from the budget. Fix: update the "Duration Budget" section to the four-phase
> model + the render exclusion.
>
> Suggestion: the Render phase hard-codes `lilypond-2.26.0` in PATH (pre-existing, same as the old single
> step) — a latent single-source-of-truth smell (this is #424's other half).

### pr-test-analyzer

> The 8-test suite nails the load-bearing property (render excluded from the budget — `budgetedTotal`
> asserted to 33 with render=570; a test would FAIL if render were added in). But coverage is incomplete
> on the warning boundaries and shallow on toInt. All gaps confirmed by running the branch code.
>
> **Finding 1 [sev 7]** — no `budgetedTotal` boundary test. The breach test uses 400 vs 360 (well past
> the edge). A `>`→`>=` flip passes every test. Add `==totalBudget` (no warning) and `==totalBudget+1`
> (warning).
> **Finding 2 [sev 7]** — same for the unit budget (only 150 vs 120 tested). Add `unit==unitBudget` (no
> warning) and `==unitBudget+1` (warning).
> **Finding 3 [sev 6]** — toInt under-covered: only NaN/undefined tested. Missing numeric string `"5"`→5
> (the ONLY non-zero branch, most valuable), `"5.5"`→0, negative→0, `"abc"`→0. Catches a "simplify to
> `Number(value)||0`" regression.
> **Finding 4 [sev 5]** — render-only asymmetric case (render>0, others 0): the "unavailable" note must
> NOT fire (render IS in the all-zero guard though excluded from the budget). Untested.
> **Finding 5 [sev 3]** — test at :64 overlaps :28; reads as boundary coverage but isn't (informational).
> **Finding 6 [sev 2]** — CLI block untested; acceptable, don't add.

### silent-failure-hunter

> Gate pass/fail integrity is SOUND. The concerns are all in the telemetry layer, not the gate.
>
> **F1 [PASS]** — phase failures genuinely fail the job; none of the four commands is a pipeline, so
> `|| status=$?` captures the real status; duration emitted AND failure propagated via `exit "$status"`.
> **F2 [PASS]** — if:always() Report is a separate step; cannot turn a red job green; never calls exit 1.
> **F3 [MEDIUM — genuine silent hole]** — `toInt(...)→0` coerces a broken/missing/garbage duration to
> "0s = free", contributing 0 to the budget. A real regression behind a broken stopwatch reads 0s and
> never trips the budget. There is NO signal distinguishing "measurement broke / phase skipped" from
> "genuinely ~0s"; the all-zero "unavailable" note fires only when ALL four are 0. Recommend a
> missing-vs-zero distinction (sentinel / "n/a (not captured)").
> **F4 [LOW]** — a skipped downstream phase (after an earlier failure) renders as a misleading "0s" on an
> already-red run. Same root/fix as F3.
> **F5 [PASS policy / LOW doc]** — SOFT budget (warn-not-fail) is deliberate and documented; the diff does
> not worsen it. BUT doc/CI.md is stale (same as code-reviewer) and its integration paths-filter lists
> `src/scores/**` which isn't in the actual filter (pre-existing).
> **F6 [LOW]** — `npx vite build` skips prebuild: no current silent skip (ohm via check, version via vite
> plugin), but a latent implicit-ordering coupling — if someone removes `build:ohm` from `check`, Bundle
> would consume a stale/absent ohm bundle while passing locally. Recommend a note or an
> ohm-bundle-exists assertion before vite build.
> **F7 [PASS]** — no empty catches introduced.
>
> Bottom line: gate honest; F3 is the one to consider before merge (telemetry can't tell broken from 0s);
> F5 doc drift should be fixed since ci.yml points at it.

### type-design-analyzer

> The type is sound and well-matched. Ratings (phases input): Encapsulation 8/10; Invariant expression
> 5/10 (the non-negative-int total, render-excluded, total=check+bundle+unit invariants live in the body,
> not the type); Usefulness 8/10; Enforcement 9/10 (single `toInt` choke-point normalises every field).
>
> **Finding 1 [low]** — `Duration = number | string | undefined` omits `null`. Runtime `toInt(null)`→0;
> the CLI never passes null (env is string|undefined), but the stated test intent is "deliberately-bad
> values", and the type would REJECT `{ check: null }` at compile time though the runtime handles it. The
> `.mjs` JSDoc is even narrower (`number|string` only, omitting undefined AND null). Widen to
> `number|string|null|undefined` and align the JSDoc, or document that the type models the env contract.
> **Findings 2-5 [info/low]** — .d.mts↔.mjs otherwise faithful; return `number` under-expresses
> non-negative-int (don't change — over-engineering); `budgetedTotal` duplicated in summaryLines but
> justified (optionally a test asserting the summary contains `String(budgetedTotal)`); a discriminated
> available/unavailable return is NOT warranted. canaryPresent... (n/a). The flat shape is correctly
> scoped.

### comment-analyzer

> Every comment IN the diff is accurate (verified): the Bundle-phase claim (all four clauses true — npx
> vite build skips prebuild; ohm by check; SVGs by render; no double render); the Render "~0s on a cache
> hit" claim; the timed-step pattern; the render-excluded-from-budget rationale + "alarm fatigue"; the
> `_Excludes per-job overhead..._` line; budgets 120/360 consistent; LilyPond 2.26.0 path matches
> install-lilypond.sh; the `.d.mts` "keep in sync" note matches the exports. No value drift in touched
> files.
>
> **[A] improvement — doc/CI.md "Duration Budget" is stale** (`doc/CI.md:20,83-94`, not touched by this
> PR). The new ci.yml comment cites it as the policy source, but it still describes the two-phase model
> and omits the render exclusion. Update to the four-phase model. NOTE: per the "wiki source not mirror"
> convention, if doc/CI.md has a tests-local/ source, fix the source — but doc/CI.md is a repo doc in
> doc/, so it IS the source.
> **[B] out of scope** — pre-existing doc/CI.md integration paths-filter mismatch (`src/scores/**` listed,
> not in the actual filter); present on origin/main too.
