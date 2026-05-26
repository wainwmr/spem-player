# VERA-377 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-26 23:25
Last run:  2026-05-26 23:25

See also: [Original Report (cycle 1)](https://github.com/wainwmr/spem-player/issues/377#issuecomment-4549556184)

## Summary

[Placeholder — finalised at close-out.]

## Findings

### 377-01 — critical — `if:` expression uses double-quoted string literal

> **code-reviewer, pr-test-analyzer, silent-failure-hunter, type-design-analyzer, comment-analyzer — `.github/workflows/ci.yml`:**
> The new `paths-filter` step uses `if: github.event_name == "pull_request"`. GitHub Actions expression syntax requires single-quoted string literals. Double quotes here cause the evaluator to treat `"pull_request"` as an identifier reference, evaluating to null. The condition is always false, so `dorny/paths-filter` never runs on any event including pull requests. `steps.filter.outputs.build-related` is therefore always empty, the bash `should-run` step falls through to `run=false` on PRs, and integration tests **never run on PRs touching build paths** — the opposite of the ticket intent. Compare to the other `if:` on the same step block which correctly uses single quotes (`== 'true'`).

**Bob's triage:** [open]

**Resolution:** [open]

### 377-02 — critical — Job rename `test` → `unit` silently bypasses branch-protection ruleset

> **silent-failure-hunter, type-design-analyzer, code-reviewer, comment-analyzer — `.github/workflows/ci.yml` job rename + `doc/CI.md:68` + `.github/workflows/dependabot-auto-merge.yml:57`:**
> Ruleset 15878992 ("Main should be golden") on wainwmr/spem-player requires status check context `test` (verified via `gh api repos/wainwmr/spem-player/rulesets/15878992`). After this PR merges the `test` job no longer exists; the required check will never report, branch protection is effectively neutralised, and `dependabot-auto-merge.yml` (which gates on the same name per doc/CI.md) loses its gate too. Fix options: (a) keep the job named `test`, or (b) update the ruleset BEFORE merging to require `unit` (and `integration` if intended) and refresh doc/CI.md + dependabot-auto-merge references.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-03 — critical — Integration job reports success when fully skipped

> **silent-failure-hunter — `.github/workflows/ci.yml`:**
> When `should-run=false`, every remaining step in the integration job is `if:`-gated and skipped. There is no terminal unconditional step, so the job concludes "success" with zero tests executed. Combined with 377-01 (paths-filter never works on PRs), every PR gets a false-green from this job. If a future ruleset adds `integration` as a required check (as 377-02 remediation might), this becomes a silent gate failure on every PR that doesn't touch build paths. Fix: add a terminal `if: steps.should-run.outputs.run != 'true'` step that prints "Integration tests skipped (no build-related changes)" so the no-op is visibly recorded; or switch to job-level `if:` so GitHub reports a cleaner "skipped" state.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-04 — important — `paths-filter` glob misses `src/test/integration/**` and `.github/workflows/ci.yml`

> **silent-failure-hunter — `.github/workflows/ci.yml:28-34`:**
> Filter covers `build/**`, `src/lilypond/**`, `src/scores/**`, `package.json`, `package-lock.json`. A PR that edits `src/test/integration/buildScores.test.ts` (e.g. fixing a flaky assertion or adding a new integration test) will not trigger the integration job. The test author gets a green PR without ever running the test they changed. A PR that edits `ci.yml` itself has the same problem — changes to the workflow don't trigger the integration job that the workflow defines. Fix: add `- "src/test/integration/**"` and `- ".github/workflows/ci.yml"` to the filter list.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-05 — important — `npm run ci` semantics silently narrowed; AGENTS-LOCAL, BUILD, CI docs stale

> **code-reviewer, silent-failure-hunter, type-design-analyzer — `package.json:56`, `AGENTS-LOCAL.md` (`npm run ci` references), `doc/BUILD.md:116`, `doc/CI.md:25`:**
> `ci` previously called `npm run test` (which ran everything). It now calls `npm run test:unit`. `AGENTS-LOCAL.md` documents `npm run ci` as the one-shot local gate inside `work` and `redo-pr`, so the local pre-PR check no longer catches integration regressions. `doc/BUILD.md` and `doc/CI.md` describe `npm run ci` as covering unit and integration tests. Fix: either re-point `ci` at `test:all` (or a new `ci:full`) so the local gate stays comprehensive, or update the three docs to reflect that `ci` is now a fast unit-only gate. Touches `AGENTS-LOCAL.md` — wording change requires Clive per the architecture design principle.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-06 — important — `doc/CI.md` is stale in multiple places

> **silent-failure-hunter, comment-analyzer — `doc/CI.md` lines 12-27, 25, 27, 57, 68:**
> Describes a single `ci.yml` job with a step table listing `npx vitest run` as "Unit and integration test suite"; references the required check by the old name `test`; states "The `test` job from `ci.yml` must pass before merge". After this PR: two jobs (`unit`, `integration`), the unit job runs `npm run ci` which is now unit-only, integration is conditional on build paths, the required check is no longer `test`. Reader following CI.md would believe integration tests gate every PR; they do not. Fix: rewrite the ci.yml section to describe both jobs and the path-filter behaviour, refresh job-name references.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-07 — important — `doc/BUILD.md` and `doc/CONTRIBUTING.md` recommend `npm test` as the pre-PR check

> **code-reviewer, comment-analyzer — `doc/BUILD.md:85-90`, `doc/CONTRIBUTING.md:162-168`:**
> Both docs still tell contributors "run `npm test`" as the pre-PR check. After this change, `npm test` (still `vitest run`) runs the slow integration suite locally — surprising to anyone used to a fast pre-push check — while CI's commit gate now runs only unit tests. The doc and the gate have diverged. Fix: recommend `npm run test:unit` (or `npm run ci` if 377-05 is fixed by re-pointing) as the fast pre-commit check, with `npm test` / `npm run test:integration` documented as the fuller check.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-08 — important — `npm test` and `npm run test:all` are duplicates

> **code-reviewer J, type-design-analyzer Finding 3, comment-analyzer 8 — `package.json:44, 60`:**
> `"test": "vitest run"` (existing) and `"test:all": "vitest run"` (new) are identical. Two ways to spell "run everything" — one will eventually drift, or `knip` (`check:unused`) will flag it. Fix: either drop `test:all` and keep `npm test` as the all-tests alias, or redirect `"test": "npm run test:unit"` so the fast path is the default and `test:all` is the explicit "everything" spelling. Pick one.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-09 — important — `doc/TESTING.md` lacks CI-split coverage and `src/test/` ambiguity

> **pr-test-analyzer H, comment-analyzer 5 — `doc/TESTING.md:26-37, 46`:**
> The doc explains the three new npm scripts but says nothing about the CI side (unit always runs, integration only on build-path PRs + nightly), and the line "Unit tests live in `src/test/`" is technically true but ambiguous now that `src/test/integration/` is a subdirectory. A reader could drop a unit test into the integration subdir by accident. Fix: add a one-paragraph CI section and one extra sentence clarifying that unit tests live everywhere under `src/test/` *except* `integration/`.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-10 — important — `README.md:73` source-layout line stale

> **silent-failure-hunter, comment-analyzer 6 — `README.md:73`:**
> Source-layout block says "`src/test/` — unit and integration tests (Vitest)" without signalling the integration split. Fix: "`src/test/` — unit tests; `src/test/integration/` — integration tests (Vitest)".

**Bob's triage:** [open]

**Resolution:** [open]

### 377-11 — important — `dependabot-auto-merge.yml` references stale check name

> **silent-failure-hunter 7 — `.github/workflows/dependabot-auto-merge.yml:57` (per `doc/CI.md`):**
> The doc claims auto-merge waits for the `test` status check. Cascade from 377-02: with the rename, dependabot auto-merge will gate on whatever the ruleset now requires; with 377-02 unresolved, patch PRs may auto-merge with no CI gate at all. Fix follows from 377-02 resolution — update both file and doc together.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-12 — important — Verify `test:unit` exclude pattern resolves as expected

> **code-reviewer C, pr-test-analyzer D — `package.json:59-60`:**
> `vitest run --exclude "src/test/integration/**"` appends to vitest's default exclude list. Pattern looks correct and uses forward slashes (vitest normalises on Windows). No agent could run it from sandbox. Sanity check: `npm run test:unit -- --reporter=verbose | grep buildScores` should return zero matches; `npm run test:integration -- --reporter=verbose | grep buildScores` should run only that test. Local verification needed before merge; if the exclude doesn't take effect (e.g. because `vite.config.ts` has a stronger `include`), switch to `vitest run "src/test/!(integration)/**/*.test.ts"` or add `test.exclude` in `vite.config.ts`.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-13 — suggestion — Integration job has no `timeout-minutes` safeguard

> **pr-test-analyzer F — `.github/workflows/ci.yml` integration job:**
> The step has no `timeout-minutes`, so a hang would consume the default 360 min. PR #380 added a 30s test-level timeout inside `buildScores.test.ts`; a job-level cap is independent of that. Suggestion: `timeout-minutes: 15` on the `npm run test:integration` step (or on the job).

**Bob's triage:** [open]

**Resolution:** [open]

### 377-14 — suggestion — Nightly cron has no failure notification

> **pr-test-analyzer G, silent-failure-hunter 6 — `.github/workflows/ci.yml:8-9`:**
> Daily cron at `0 0 * * *`. If it silently stops (Actions disables schedules on inactive repos after 60 days; secret rotation; quota), no signal. Existing `e2e.yml` cron has the same gap but at least uploads artefacts on failure. Suggestion: add an `if: failure()` step that opens or comments on a tracking issue, or wire to existing alerting.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-15 — suggestion — Cron line lacks explanatory comment

> **code-reviewer H, comment-analyzer 10 — `.github/workflows/ci.yml:8-9`:**
> `schedule: - cron: "0 0 * * *"` has no comment explaining why integration also runs nightly (presumably to catch drift even when PRs don't touch build paths). One-line `# Daily at 00:00 UTC` (and note that GitHub may delay by ~15 min during peak) would save future maintainers a `git blame`.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-16 — suggestion — Inconsistent `.nvmrc` quoting in same file

> **code-reviewer I — `.github/workflows/ci.yml:17, 41`:**
> The diff flips `'.nvmrc'` → `".nvmrc"` in one job for no functional reason. Both are valid YAML. Suggestion: pick one and stick to it across the file.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-17 — suggestion — `ci.yml` steps lack `name:` fields

> **comment-analyzer 9 — `.github/workflows/ci.yml`:**
> Diffed steps `- run: npm ci` and `- run: npm run test:integration` have no `name:` field, so the GitHub UI shows the raw command. Compare with the named "Check if integration tests should run" step. Adding `name:` improves log skim.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-18 — suggestion — Co-locate test scripts in `package.json`

> **comment-analyzer 7 — `package.json:60-62`:**
> `test:unit`, `test:integration`, `test:all` are appended at the bottom of the scripts block, separated from the existing `test` / `test:watch` / `test:coverage` cluster at lines 44-46. Co-locating aids discoverability via `npm run`. Subsumed by the 377-08 cleanup once that's resolved.

**Bob's triage:** [open]

**Resolution:** [open]

### 377-19 — suggestion — POSIX-vs-bashism `==` in shell test

> **type-design-analyzer Finding 6 — `.github/workflows/ci.yml` `should-run` step bash heredoc:**
> Uses `[ ... == ... ]` which is a bashism (POSIX `[ ]` is `=`). Step declares `shell: bash` so it works; flagged only for future portability if anyone ever runs this in `sh`.

**Bob's triage:** [open]

**Resolution:** [open]
