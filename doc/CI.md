# Continuous Integration

The repository uses GitHub Actions for automated testing, dependency updates, deploy previews, and production deploys. All workflows run on Ubuntu latest and read the Node.js version from `.nvmrc`.

## Philosophy

- **Fast PR gate:** Only unit tests, lint, and type checks block merges. The full browser-based end-to-end suite runs separately.
- **Nightly regression:** Playwright e2e tests run on a schedule to catch browser-level regressions without adding friction to the pull request workflow.

## Workflows

### `ci.yml`

Triggers on every push and pull request to `main`, and nightly at 00:00 UTC via a `schedule` cron.

Defines two parallel jobs.

#### `test` job

Runs on every trigger. Executes `npm run check` (lint, format, type check, unused, deps) and `npm run build` as one timed phase, then `npm run test:unit` (the fast unit suite) as a second timed phase, both measured against a soft duration budget — see Duration Budget below. This is the required status check for the `main` branch ruleset; pull requests cannot merge until it passes.

#### `integration` job

Runs the subprocess-heavy integration suite (`src/test/integration/`). It runs unconditionally on push to `main` and on the nightly cron, but on pull requests it uses `dorny/paths-filter` to skip unless the PR touches one of:

- `build/**`
- `src/lilypond/**`
- `src/scores/**`
- `src/test/integration/**`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `.nvmrc`
- `.github/workflows/ci.yml`

A skipped PR run is reported on the workflow summary page and in the job log with a message quoting the actual `should-run` output (e.g. `Integration tests skipped — should-run='false' (PR did not touch build-related paths).`), so the absence of test output is visible rather than appearing as a silent pass.

The `integration` job is not currently a required check; failures surface but do not block merge. This is deliberate while the path-filter and skip-reporting behaviour bed in.

### `e2e.yml`

Triggers on a cron schedule (02:00 UTC daily) and on manual `workflow_dispatch`.

Steps:

- `npm ci` — install dependencies.
- `npm run build` — production Vite build.
- `npx playwright install --with-deps` — install browser binaries.
- `npx playwright test` — run the e2e suite.

On failure, the Playwright HTML report is uploaded as an artifact and retained for 7 days.

This workflow is intentionally excluded from the PR gate. Playwright tests are slow and can flake on infrastructure issues. Running them nightly catches real regressions within 24 hours without blocking rapid fixes.

## Dependabot

`.github/dependabot.yml` configures automated dependency update PRs:

- **npm:** Weekly on Mondays at 09:00 UTC, targeting `main`. Related dependencies are grouped into single PRs (vite, vitest, build-tools, types-and-testing, ohm).
- **GitHub Actions:** Monthly, targeting `main`.

Dependabot PRs are subject to the same `ci.yml` checks and ruleset requirements as human-authored PRs.

### `dependabot-auto-merge.yml`

A separate workflow enables GitHub native auto-merge for Dependabot **patch** PRs once the `test` status check passes. Minor and major bumps remain open for manual review. This workflow runs only when the PR author is `dependabot[bot]` and inspects the update type via `dependabot/fetch-metadata` before enabling auto-merge.

### `deploy-production.yml`

Triggers via `workflow_run` when the `CI` workflow completes successfully on a push to `main`.

Steps:

- `actions/checkout` — checks out the exact commit SHA that CI validated (`github.event.workflow_run.head_sha`).
- `actions/setup-node` — installs Node.js from `.nvmrc`.
- Compute score cache key and restore generated SVGs — skips LilyPond install when inputs are unchanged.
- Install LilyPond — only on cache miss.
- `npm ci` — install dependencies.
- `npm run build` — production Vite build.
- Install Netlify CLI.
- `netlify deploy --prod` — deploy to production.

This workflow depends on the `CI` workflow passing first. It does not run on scheduled CI runs or PR CI runs.

### `netlify-preview.yml`

Triggers on `pull_request` events (`opened`, `synchronize`).

Builds the site in GitHub Actions (`npm ci && npm run build`) and deploys the `dist/` folder to Netlify via the CLI using a PR-number alias (`pr-NUMBER`). The preview URL is always `https://pr-NUMBER--spemplayer.netlify.app`.

This workflow exists because the repository is private and Netlify's native GitHub integration requires manual approval for deploy previews from non-team members on the Free plan. Building and deploying through GitHub Actions using a Netlify personal access token bypasses that approval gate.

The workflow posts (or updates) a bot comment on the PR with the preview URL.

## Node.js Version

The Node.js version is pinned in `.nvmrc`. All GitHub Actions workflows read this file via `node-version-file` in `actions/setup-node`. Netlify should be configured to use the same version.

## Duration Budget

The `test` job logs the duration of each measured phase (check + build, unit tests) and reports a summary. Soft budgets (not hard gates) are defined as `UNIT_BUDGET_SEC` and `TOTAL_BUDGET_SEC` env vars on the Report step in `ci.yml`:

- **Unit tests:** under 2 minutes (`UNIT_BUDGET_SEC=120`).
- **Measured phases combined** (check + build + unit tests): under 6 minutes (`TOTAL_BUDGET_SEC=360`).

The reported total covers the timed phases only, NOT the per-job overhead (`actions/checkout`, `actions/setup-node`, `npm ci`); the wall-clock job duration shown in the GitHub UI will be larger.

Current baseline (Linux runner, on `main`): the test job's measured phases run in roughly 60s end-to-end. The 120s and 360s budgets are set at approximately 2× and 6× that baseline so they flag regression rather than normal run-to-run variance.

Exceeding a budget emits a GitHub Actions warning annotation and a `Budget exceeded` block on the workflow run summary; it does **not** fail the job or block merge. The budgets are monitored manually by Andrew when warnings surface in CI logs; aggregation and history are not yet wired up.

## Branch Protection

The `main` branch has a GitHub Ruleset ("Main should be golden") that enforces:

- Pull requests required for all collaborators except the repository owner (bypass list)
- The `test` job from `ci.yml` must pass before merge
- Branches must be up to date with `main` before merging
- Force pushes and deletions are restricted
