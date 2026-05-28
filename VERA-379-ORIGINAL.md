# VERA-379 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-28 22:25 UTC

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

### code-reviewer

> Scope reviewed: `.github/workflows/ci.yml` (+39/-3), `doc/CI.md` (+11/-0), plus corroborating files `package.json`, `.github/workflows/e2e.yml`, `doc/BUILD.md`.
>
> 1. **Critical — `doc/CI.md` line 73-75: duplicate `## Branch Protection` heading creates an empty section and disorders the page.** The diff inserts a new `## Duration Budget` block but places it *after* a freshly-orphaned `## Branch Protection` line that has no body. The rendered TOC will show two "Branch Protection" entries, and the first one is empty. Fix: delete the empty `## Branch Protection` on line 73 (and the blank line above it that the diff added), so the order becomes `Node.js Version` → `Duration Budget` → `Branch Protection`.
>
> 2. **Critical — `doc/CI.md` line 20: pre-existing description now contradicts the workflow.** This line reads: *"Executes `npm run ci`, which runs `npm run check` ... `npm run build`, and `npm run test:unit`"*. The workflow no longer calls `npm run ci`; it now calls the three sub-scripts directly across two named steps. Since this PR introduced the drift, the doc edit should have updated this line in the same commit.
>
> 3. **Important — `.github/workflows/ci.yml` lines 47-48: GitHub Actions expression interpolation into a bash script is technically safe here, but violates the standard hardening pattern used elsewhere in this file.** The convention elsewhere in this same file is to wrap `${{ ... }}` interpolations in double quotes or pass values via `env:`. Two cheap fixes: quote the substitutions, or pass via `env:` and read inside the script.
>
> 4. **Important — `.github/workflows/ci.yml` lines 21 and 97: prettier-style quote tweak applied inconsistently across the repo.** This PR rewrites `'.nvmrc'` to `".nvmrc"` in both occurrences in `ci.yml`, but `e2e.yml` line 15 still has `node-version-file: '.nvmrc'`. Either apply consistently, or revert as out-of-scope.
>
> 5. **Important — `.github/workflows/ci.yml` line 29: `set -e` semantics are now lost between `check` and `build`.** If `npm run check && npm run build` fails, `bash -e` aborts before `end=$(date +%s)`, so no `duration` output is written, and the *next* step then tries to do `$((check_build + unit))` with `check_build=""` producing `bash: 0 +: syntax error`. Fix: gate the report step with `if: always()` AND guard the arithmetic with `${VAR:-0}` defaults; alternatively emit duration via a `trap` on EXIT.
>
> 6. **Important — `.github/workflows/ci.yml` line 49: `total` excludes `npm ci` install time, but the docs imply it's the full job duration.** `doc/CI.md` line 80 says the 360s budget is for the "Full `test` job". The workflow only sums *check+build* and *unit*, omitting checkout (~20s), setup-node (~5s), and `npm ci` (~30-60s on cold cache).
>
> 7. **Suggestion — step naming is consistent with `integration:` but "Run checks and build" is slightly awkward English.** Consider `Run quality checks and build` or split into two named steps so each phase has its own duration in the GitHub UI.
>
> 8. **Suggestion — budgets 120s and 360s inlined in three places with no single source of truth.** Hoist them to step-level `env:` (`UNIT_BUDGET_SEC: 120`, `TOTAL_BUDGET_SEC: 360`) so at least the workflow has one place to change.
>
> 9. **Suggestion — `.github/workflows/ci.yml` line 45: the Report step has no `id:` and emits no `GITHUB_STEP_SUMMARY` entry.** Compare with the `integration:` job's "Report skip" step which writes to `$GITHUB_STEP_SUMMARY`. The duration report is exactly the kind of information that benefits from being on the summary page.
>
> 10. **Suggestion — `doc/CI.md` line 82: "monitored manually" is a process claim with no owner.** Either name a responsible agent/workflow or soften to e.g. "Andrew reviews budget warnings ad-hoc when they appear in CI logs."
>
> 11. **Pre-existing — `.github/workflows/ci.yml` line 60: `integration` job has `timeout-minutes: 15` but `test` job has none.** A test job that runs away will burn the default 6-hour runner timeout. Consider adding `timeout-minutes: 10` to the `test` job as a hard backstop.
>
> 12. **Pre-existing — doc/CI.md line 16: framing could mislead a future reader into thinking the duration budget covers e2e.** The budget explicitly does not.

### pr-test-analyzer

> Summary: This PR adds no vitest/jest tests, and none are required: the change is pure CI workflow plumbing plus documentation. My usual unit-test gap analysis doesn't apply, so I've adapted the review to the question that actually matters for a CI-config change: **does this PR achieve what the ticket says it will, and can its claims be verified?** Largely yes, but with a few real defects and several "evidence-free" choices.
>
> **[A] Critical — `doc/CI.md` lines 73-84: duplicate `## Branch Protection` heading.** Same finding as code-reviewer's #1. This will render as an empty section in any TOC and looks broken. Fix: delete the line-73 heading.
>
> **[B] Important — `ci.yml` lines 45-57: "total" is mislabelled and under-counted.** The reporting step computes `total = check_build + unit` and compares against a "Full `test` job" budget of 360s. But the job's wall-clock time also includes checkout (~20s), `setup-node` (~5s), and `npm ci` (~5s) — roughly 30s of overhead per run that the "total" omits.
>
> **[C] Important — `ci.yml`: integration job duration is not measured, contradicting the ticket's test plan.** Ticket #379's test plan says "Verify CI logs show duration **for each job**" (emphasis mine). The integration job (lines 59-113) is untouched.
>
> **[D] Important — soft-budget thresholds (120s unit, 360s total) appear to be unevidenced.** Recent successful Linux runs on `main` (e.g. run 26605522696) complete the entire `npm run ci` step in **~57s** end-to-end on a GitHub-hosted runner. The "5+ minutes" figure in the ticket body is the Windows-local measurement, not the GH Actions Linux measurement these budgets gate. So 120s is 2.1× current actual; 360s is 6.3× current actual. The budgets won't catch creep until it's already doubled.
>
> **[E] Suggestion — `ci.yml` line 29: `npm run check && npm run build` masks which sub-phase regressed.** Could time them separately for the same plumbing cost.
>
> **[F] Suggestion — `ci.yml` lines 28, 38: `date +%s` has 1-second resolution and excludes step setup.** GH Actions also reports per-step duration in the run UI to sub-second accuracy.
>
> **[G] Suggestion — no portability concern for `$((...))` here.** `runs-on: ubuntu-latest` plus `run: |` defaults to `bash -e`, so POSIX arithmetic is fine.
>
> **[H] Suggestion — collision check is clean.** No open PR in `wainwmr/spem-player` touches `.github/workflows/ci.yml`.
>
> **[I] Suggestion — the `'.nvmrc'` → `".nvmrc"` quote-style changes (lines 21 and 97) are unrelated to the ticket.** Harmless but widen the diff.
>
> Bottom line: One real defect to fix before merge ([A]). Two design decisions worth a conscious call ([B], [C]). The rest are suggestions.

### silent-failure-hunter

> **1. CRITICAL — `.github/workflows/ci.yml:45-57` — The "Report CI duration budget" step has no `if:` guard, so it does not run when an earlier step fails.** GitHub Actions' default step condition is `success()`. If `Run checks and build` fails, both `Run unit tests` AND `Report CI duration budget` are skipped. The user never sees a duration report for the work that *did* run before failure — neither a partial check+build duration nor a "we couldn't measure" notice. The duration data is precisely lost in the case where it would be most wanted. Fix: `if: always()` plus tolerate missing inputs (see finding 2).
>
> **2. CRITICAL — `.github/workflows/ci.yml:47-49` — Empty step outputs are interpolated literally into bash, producing a syntax error rather than a graceful default.** The substitutions happen at YAML render time. If the producing step failed before `echo "duration=..." >> "$GITHUB_OUTPUT"` ran, the rendered bash is `check_build=` / `unit=` / `total=$(( + ))` — a bash arithmetic syntax error. Even with `if: always()`, the report step itself fails when there is no data. Fix: default the inputs explicitly (`check_build="${check_build:-0}"`) and guard the arithmetic; emit warnings when data is missing.
>
> **3. CRITICAL — `.github/workflows/ci.yml:28-33, 38-43` — Duration is only written on success, conflating measurement-of-elapsed-time with success-of-the-thing-measured.** Because `set -e` is on, a non-zero exit from `npm run check` skips the duration write. The duration is therefore only ever reported for successful runs — opposite of what telemetry should do. A more honest pattern uses `trap` or explicit status capture:
>
> ```bash
> start=$(date +%s)
> status=0
> npm run check && npm run build || status=$?
> end=$(date +%s)
> duration=$((end - start))
> echo "duration=${duration}" >> "$GITHUB_OUTPUT"
> echo "Check + build took ${duration}s (exit ${status})"
> exit "$status"
> ```
>
> **4. IMPORTANT — `.github/workflows/ci.yml:45-57` — `::warning::` annotations have no follow-through and no summary surface.** Warning is emitted into the step log of a step that is otherwise a no-op success. Nothing pins it to the workflow summary, nothing accumulates a history. `doc/CI.md:82` says budgets are "monitored manually; if consistently exceeded, the cause is investigated" — but there is no mechanism to detect "consistently exceeded." A budget that depends on a human noticing a yellow annotation in a passing run will be ignored within a sprint.
>
> **5. IMPORTANT — `.github/workflows/ci.yml:47-48` — YAML-level interpolation of step outputs into shell arithmetic is a code-injection-shaped foot-gun even though the data is currently trusted.** The robust pattern is to read into env (not YAML interpolation) and validate.
>
> **6. IMPORTANT — `.github/workflows/ci.yml:25` — The split from `npm run ci` into three steps loses the contract enforced by `package.json:58`.** Today they're equivalent; tomorrow someone adds a step to `npm run ci` and forgets the workflow, or vice versa. Local `npm run ci` no longer reproduces what CI does.
>
> **7. SUGGESTION — `.github/workflows/ci.yml:15-16` — The `test` job has no `timeout-minutes`, while `integration` does.** Without it, the soft budget of 6 minutes is being enforced against a hard ceiling 60× larger.
>
> **8. SUGGESTION — `.github/workflows/ci.yml:32, 42` — `$GITHUB_OUTPUT` is assumed set with no fallback.** Defensible inside a GitHub-hosted runner but a small risk for local `act` use.
>
> **9. SUGGESTION — `doc/CI.md:73-84` — Duplicate `## Branch Protection` heading.** Same finding as code-reviewer's #1.
>
> **10. SUGGESTION — `doc/CI.md:78-80` — Budgets are stated only in the doc, not as constants in the workflow.** When one is changed and not the other, the doc lies.
>
> Summary: Findings 1, 2, 3 are CRITICAL because they cause the feature to malfunction precisely in the cases where it would be most valuable. The feature works on the happy path and degrades silently on the unhappy paths — the textbook silent-failure shape this audit is supposed to catch.

### type-design-analyzer

> Preface: Much of what I'd normally bring doesn't apply to a YAML/bash diff. GitHub Actions step outputs are stringly-typed by spec. That said, there ARE implicit types and contracts in this diff.
>
> 1. **[Important]** `.github/workflows/ci.yml:43, 50-51, 53, 56` and `doc/CI.md:79-80` — **Threshold magic numbers duplicated across five-to-seven sites with no single source of truth.** A future contributor who relaxes the budget to 150s/420s has to find and update all of them; nothing forces consistency. Standard YAML remedy: `env:` at job or step level.
>
> 2. **[Important]** `.github/workflows/ci.yml:45-57` — **The "Report CI duration budget" step has no declared contract with its upstream inputs.** It silently assumes step outputs exist, are non-empty, and are integer-shaped. A defensive `if: always()` plus explicit defaulting would make the contract self-documenting.
>
> 3. **[Suggestion]** `.github/workflows/ci.yml:31, 41, 49` — **The "duration ≥ 0" invariant is not encoded.** Theoretical, near-zero practical risk on hosted runners. A one-line guard makes the invariant explicit and cheap.
>
> 4. **[Suggestion]** `.github/workflows/ci.yml:49` — **The invariant "unit-test duration ≤ total duration" is not encoded, but the total is reconstructed by addition rather than measured.** The design choice is "total is derived, not measured" — means the report does NOT include the install/checkout time. Rename to `Total measured duration` / `check+build+unit-test duration`, or measure wall-clock from job start. The current name overpromises slightly.
>
> 5. **[Suggestion]** `.github/workflows/ci.yml:43` — **The unit-tests step echoes its own soft budget inline, but the check+build step does not.** Asymmetry in the implicit "step report" type.
>
> 6. **[Suggestion]** `doc/CI.md:75, 84` — **Two `## Branch Protection` headings.** Same finding as code-reviewer's #1.
>
> 7. **[Suggestion]** `.github/workflows/ci.yml:25-57` — **The three new steps form an implicit "instrumented step" pattern that isn't named.** Worth a one-line comment at the top of the first measured step.
>
> Ratings on the implicit "DurationReport" record:
>
> - Encapsulation: 5/10. Step outputs are public-by-default within the job; platform constraint.
> - Invariant expression: 3/10. Nothing communicates "this is a non-negative integer in seconds". A key like `duration_seconds` would help.
> - Invariant usefulness: 6/10. The duration field is genuinely useful; thresholds are well-chosen for the stated goal.
> - Invariant enforcement: 2/10. Nothing is enforced. The fact that this never happens in practice is because `$(date +%s)` is well-behaved, not because the design defends against misuse.
>
> For an infrastructure-as-config PR, the strong recommendation is finding #1 (collapse the threshold to one source of truth). Findings #2 and #6 also worth addressing before merge.

### comment-analyzer

> Summary: The CI yaml has no inline `#` comments — it relies on `name:` fields plus `echo` runtime output. The doc adds a "Duration Budget" section. One structural defect, a few WHY-comment opportunities the author chose to skip, and several minor accuracy/rot risks in the echo output.
>
> 1. **[CRITICAL — doc structure] `doc/CI.md:73` and `doc/CI.md:84` — duplicate `## Branch Protection` heading.** Same finding as cross-agent. Fix: delete line 73.
>
> 2. **[MEDIUM — WHY missing] `.github/workflows/ci.yml:43, 51, 52, 55` — the 120s / 360s magic numbers appear four times with no rationale comment.** A future maintainer reading `[ "$unit" -gt 120 ]` cannot tell whether 120 is a measured baseline + headroom, intuition, p95, or a flake margin. A single `#` comment above the report step explaining the provenance would survive a refactor and earn its keep.
>
> 3. **[MEDIUM — WHY missing] `.github/workflows/ci.yml:53, 56` — `::warning::` rather than `::error::` is a deliberate policy choice with no inline justification.** A one-line `# soft budget — warn, do not fail; see doc/CI.md "Duration Budget"` would prevent someone reflexively "fixing" the warning to a hard failure.
>
> 4. **[LOW — duplication risk] `.github/workflows/ci.yml:43, 50-51` — three occurrences of literal `120` and two of `360` across the file.** Amplifies finding 2.
>
> 5. **[LOW — comment-by-output accuracy] `.github/workflows/ci.yml:50` "Total CI duration: ${total}s".** The label overstates what is measured. Either rename to "Total measured-step duration" / "Build + test duration", or extend the measurement.
>
> 6. **[LOW — comment-by-output accuracy] `.github/workflows/ci.yml:43` echoes the soft budget only for unit tests, not for check+build.** Asymmetric — a reader infers the other step has no budget. Either echo no budget on per-step lines and surface budgets only in the summary, or echo a per-step budget for check+build too.
>
> 7. **[LOW — rot risk]** Pre-existing `~15 min` GitHub delay comment, out of scope.
>
> 8. **[NIL] step names are sufficient as WHAT-documentation.** No inline `#` WHAT-comment warranted. The gaps are WHY (findings 2, 3).
>
> 9. **[NIL] `doc/CI.md:77-82` prose follows the rules well.** Explains WHY budgets are soft. One weakness: doesn't justify the specific numbers 120 and 360.
>
> 10. **[NIL] path-filter doc already at `doc/CI.md:24-39` from a prior PR.** Ticket's "document the budget and path-filter rules" satisfied modulo finding 1.
