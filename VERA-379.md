# VERA-379 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-28 22:25 UTC
Last run:  2026-05-28 22:25 UTC

See also: [Original Report (cycle 1)](https://github.com/wainwmr/spem-player/issues/379#issuecomment-4568868300)

## Summary

[Placeholder — finalised at close-out.]

## Findings

### 379-01 — critical — Duplicate `## Branch Protection` heading in doc/CI.md

> **all 5 agents (CRV F1, PRA [A], SFH F9, TDA F6, CMT F1), `doc/CI.md:73-84`:**
>
> The diff inserts `## Duration Budget` between the existing `## Branch Protection` heading (line 73) and its body. The result is two h2s with the same name, the first one orphaned (empty section), the second carrying the real prose. Renders as a broken TOC.
>
> Fix: delete the orphan heading at line 73 so the order becomes `Node Version` → `Duration Budget` → `Branch Protection`.

**Bob's triage:** Real defect, unambiguous. Cross-agent convergence. Address now.

**Resolution:** [placeholder — to be filled after fix]

### 379-02 — critical — Report step lacks `if: always()` guard

> **silent-failure-hunter F1, `.github/workflows/ci.yml:45-57`:**
>
> GitHub Actions' default step condition is `success()`. If "Run checks and build" fails, both "Run unit tests" AND "Report CI duration budget" are skipped. The user never sees any duration report for the failing run — exactly when the telemetry would be most useful. The feature works on the happy path and goes silent on the unhappy path. Pairs structurally with 379-03 and 379-04.

**Bob's triage:** Real defect. The feature exists to provide signal on CI-duration regression; making it conditional on success means it can't catch the regression it's named for. Address now, combined with 379-03 (defaults) and 379-04 (trap-pattern duration capture).

**Resolution:** [placeholder]

### 379-03 — critical — Empty step outputs produce bash arithmetic syntax error

> **silent-failure-hunter F2 + code-reviewer F5 (important), `.github/workflows/ci.yml:47-49`:**
>
> YAML-level interpolation of `${{ steps.X.outputs.duration }}` happens before bash runs. When upstream steps fail to emit `duration` (today's behaviour), the rendered bash becomes `check_build=` / `unit=` / `total=$(( + ))` — a bash arithmetic syntax error. So adding `if: always()` (379-02) alone makes the report step itself fail noisily.
>
> Fix: default the inputs explicitly (`check_build="${check_build:-0}"`), guard the arithmetic, and emit a warning when data is missing rather than aborting.

**Bob's triage:** Real defect. Pairs with 379-02 — both are required to make the telemetry useful under failure. Address now in the same commit as 379-02.

**Resolution:** [placeholder]

### 379-04 — critical — Duration only written on success

> **silent-failure-hunter F3, `.github/workflows/ci.yml:28-33, 38-43`:**
>
> Because `set -e` is on, a non-zero exit from `npm run check && npm run build` skips `end=$(date +%s)` and the `echo "duration=..."` line. So duration is only recorded for successful runs — opposite of telemetry intent. A `trap` or explicit status capture preserves the duration emission while still propagating the failure status:
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

**Bob's triage:** Real defect, same family as 379-02 and 379-03. Address now in the same fix commit so the telemetry is robust top-to-bottom.

**Resolution:** [placeholder]

### 379-05 — important — `Total CI duration` overstates what is measured

> **code-reviewer F6 + pr-test-analyzer [B] + type-design-analyzer F4 + comment-analyzer F5, `.github/workflows/ci.yml:49-50` and `doc/CI.md:80`:**
>
> The label claims "Total CI duration" / "Full `test` job" but the value sums only check+build and unit. Excludes `actions/checkout` (~20s), `actions/setup-node` (~5s), `npm ci` (~30-60s on cold cache). The report can show ~3m20s while the GitHub UI shows ~4m30s — confusing future maintainers.
>
> Fix: rename to honest label (e.g. "Total measured-step duration (check+build + unit tests)") OR measure wall-clock from job start. Cheapest correct fix is the rename + a one-line note in doc/CI.md.

**Bob's triage:** Real defect at the doc level. Cheapest correct fix is the rename; measuring wall-clock would be a scope expansion. Address now.

**Resolution:** [placeholder]

### 379-06 — important — Threshold magic numbers duplicated across 5-7 sites

> **type-design-analyzer F1 + code-reviewer F8 + comment-analyzer F4, `.github/workflows/ci.yml:43, 50-56` + `doc/CI.md:79-80`:**
>
> `120` appears 3 times in ci.yml, `360` twice. Both numbers also live in doc/CI.md. A future contributor retuning the budget must update them in lockstep across two files. The doc can drift silently.
>
> Fix: hoist to step-level `env:` (`UNIT_BUDGET_SEC: 120`, `TOTAL_BUDGET_SEC: 360`). Workflow has one source of truth; doc cites it.

**Bob's triage:** Real maintainability concern. The `env:` hoist is the standard YAML remedy and costs little. Address now.

**Resolution:** [placeholder]

### 379-07 — important — `${{ steps.X.outputs.Y }}` not hardened per file convention

> **code-reviewer F3 + silent-failure-hunter F5, `.github/workflows/ci.yml:47-48`:**
>
> The rest of `ci.yml` quotes `${{ ... }}` substitutions (lines 87, 111). The new report step bare-interpolates them. Not exploitable today (producers emit `$((end - start))`) but inconsistent with the file's own pattern and one refactor away from breaking. Standard hardening: pass via `env:` and read inside script. Also subsumes 379-03's defaulting cleanly.

**Bob's triage:** Real defect at the consistency level; the `env:` pattern is cleaner than YAML-time interpolation and the file already establishes the convention. Address now, naturally combined with 379-06's env-hoist.

**Resolution:** [placeholder]

### 379-08 — important — Out-of-scope `.nvmrc` quote tweak applied inconsistently

> **code-reviewer F4 + pr-test-analyzer [I], `.github/workflows/ci.yml:21, 97`:**
>
> The PR rewrites `'.nvmrc'` to `".nvmrc"` in two places in ci.yml — likely a prettier-on-save artefact unrelated to the ticket. `e2e.yml` line 15 still has the original single-quote form. Either apply consistently across all yaml files (in a separate commit), or revert here as out-of-scope.

**Bob's triage:** Scope-creep cosmetic change. Revert is cleanest for #379 — keeps the diff focused on what the ticket asks for. Address now.

**Resolution:** [placeholder]

### 379-09 — important — Stale `npm run ci` description in doc/CI.md

> **code-reviewer F2, `doc/CI.md:20`:**
>
> Pre-existing prose reads *"Executes `npm run ci`, which runs npm run check ... npm run build, and npm run test:unit"*. The workflow no longer calls `npm run ci`; it inlines the three sub-scripts across two named steps. The PR introduced the drift but did not update the prose. Suggested wording: *"Runs `npm run check` (lint, format, type check, unused, deps), then `npm run build`, then `npm run test:unit`, with each phase timed against a soft duration budget — see Duration Budget below."*

**Bob's triage:** Real defect at the comment-rot level — the PR is the proximate cause. Cheap to fix; pair with 379-01 in the doc commit.

**Resolution:** [placeholder]

### 379-10 — important — 120s / 360s budgets are unevidenced

> **pr-test-analyzer [D] + comment-analyzer F2, `doc/CI.md:79-82` + `.github/workflows/ci.yml:43, 51-56`:**
>
> Recent successful Linux runs on `main` complete the entire `npm run ci` step in ~57s. The 120s unit budget is 2× current; the 360s total is 6× current. The "5+ minutes" figure in the ticket body is the *Windows-local* measurement, not the GH Actions Linux measurement these budgets gate. Without a recorded baseline in the docs, future investigators can't tell whether a warning means real regression or always-was-slow.
>
> Fix: add a "(current Linux baseline: ~60s for the test job; budget set at ~2× to flag regression, not normal variance)" line to the Duration Budget section.

**Bob's triage:** Real concern — without provenance the budgets are arbitrary. Cheap to fix as a one-line doc addition. Address now alongside 379-09 in the doc commit. This subsumes CMT F2.

**Resolution:** [placeholder]

### 379-11 — important — Integration job duration not measured

> **pr-test-analyzer [C], `.github/workflows/ci.yml:59-113`:**
>
> Ticket #379's test plan says "Verify CI logs show duration **for each job**". The integration job is untouched — no `date +%s`, no budget. Given the integration suite is the genuinely slow one (subprocess Lilypond/build tasks, 15-minute timeout), the omission is the most surprising scope decision in the PR.

**Bob's triage:** Real scope shortfall but expanding now would balloon the PR. Defer to a Workbench item with a clear "extend the same pattern to the integration job" brief. Document the scope decision in doc/CI.md.

**Resolution:** [placeholder — defer to Workbench item]

### 379-12 — important — `npm run ci` split loses single-source-of-truth with package.json

> **silent-failure-hunter F6, `.github/workflows/ci.yml:25-57` vs `package.json:58`:**
>
> `package.json` defines `"ci": "npm run check && npm run build && npm run test:unit"`. The workflow now inlines that pipeline as separate steps. Local `npm run ci` no longer reproduces what CI does. Today equivalent; tomorrow can drift silently. Suggested fix: split `npm run ci` *in package.json* into `ci:check-build` and `ci:test` so both CI and humans invoke the same definitions.

**Bob's triage:** Real concern but the cleanest fix touches package.json which is wider than this PR's scope. Defer to a Workbench item.

**Resolution:** [placeholder — defer to Workbench item]

### 379-13 — important — `::warning::` annotations have no follow-through

> **silent-failure-hunter F4, `.github/workflows/ci.yml:53, 56` + `doc/CI.md:82`:**
>
> Warnings emit into step logs of an otherwise no-op success step. No `$GITHUB_STEP_SUMMARY` entry, no aggregation, no history. doc claims "monitored manually; if consistently exceeded, investigated" but no mechanism detects "consistently exceeded". A budget that depends on a human noticing a yellow annotation in a passing run will be ignored.
>
> Cheapest improvement (in-PR): mirror integration job pattern by writing the report to `$GITHUB_STEP_SUMMARY` (cheap). Larger: history + aggregation. Honest: own the "aspirational" framing in the doc.

**Bob's triage:** Real concern but the team has no workflow today to act on aggregated telemetry (same family as #356's observability defer). The cheap step-summary improvement is worth adding now — it makes warnings visible on the workflow run page without burying them. Address the step-summary piece now; defer the aggregation/history piece to a Workbench item with `[#356/#379 observability follow-up]` framing.

**Resolution:** [placeholder]

## Suggestions (noted; do not block the gate)

- **379-14** — CRV F7: Step naming "Run checks and build" is slightly awkward English. Pedantic.
- **379-15** — CRV F9: Report step has no `id:` and emits no `GITHUB_STEP_SUMMARY` entry. Partially addressed by 379-13.
- **379-16** — CRV F10: "monitored manually" is process claim with no owner. Wording choice.
- **379-17** — CRV F11 / SFH F7: pre-existing — `test` job has no `timeout-minutes`. Out of scope for #379; defer to Workbench item alongside 379-11.
- **379-18** — CRV F12: pre-existing — doc framing could mislead future reader on e2e budget coverage.
- **379-19** — PRA [E]: split `check` and `build` into separate timed steps for finer-grained budget. Over-engineering for "log total duration".
- **379-20** — PRA [F]: `date +%s` resolution vs GH UI durations. Alternative implementation choice.
- **379-21** — PRA [G]: portability of `$((...))` — fine for ubuntu-latest. Positive.
- **379-22** — TDA F3: "duration ≥ 0" invariant not encoded. Theoretical risk on hosted runners.
- **379-23** — TDA F5: per-step budget echo asymmetry. Addressed incidentally by 379-05's rename + restructure.
- **379-24** — TDA F7: implicit "instrumented step" pattern unnamed. Subsumed by the WHY-comment in 379-04 trap fix.
- **379-25** — SFH F8: `$GITHUB_OUTPUT` assumed set with no fallback. Acceptable on hosted runners.
- **379-26** — CMT F3: `::warning::` policy lacks inline WHY-comment. Addressed by 379-13 / 379-04 commits' WHY-comments.
- **379-27** — CMT F6: per-step inline budget echo asymmetric. Same as 379-23.

## Positive notes

- The "soft budget, warning only" design is correct for this use case; the ticket explicitly forbids hard gating ("incentivises gaming"). The PR honours that.
- `$GITHUB_OUTPUT` is used correctly (`echo "duration=..." >> "$GITHUB_OUTPUT"`) and the consumer step reads it via the canonical `steps.<id>.outputs.duration` form (when it has data).
- The doc clearly documents the "monitored manually; if consistently exceeded, investigated and optimised" loop. Operational intent is clear (modulo follow-through gap in 379-13).
- No PR conflicts with the five open Review PRs (#395, #396, #399, #400, #401) — no other open PR touches `.github/workflows/ci.yml` (PRA [H] confirmation).
- Step naming pattern is consistent with the existing `integration:` job style.
- Path-filter documentation is already at `doc/CI.md:24-39` from prior PR — ticket's "document path-filter rules" satisfied modulo 379-01.
