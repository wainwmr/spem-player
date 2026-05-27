# Continuous Integration

The repository uses GitHub Actions for automated testing and dependency updates. All workflows run on Ubuntu latest and read the Node.js version from `.nvmrc`.

## Philosophy

- **Fast PR gate:** Only unit tests, lint, and type checks block merges. The full browser-based end-to-end suite runs separately.
- **Nightly regression:** Playwright e2e tests run on a schedule to catch browser-level regressions without adding friction to the pull request workflow.

## Workflows

### `ci.yml`

Triggers on every push and pull request to `main`, and nightly at 00:00 UTC via a `schedule` cron.

Defines two parallel jobs.

#### `test` job

Runs on every trigger. Executes `npm run ci`, which runs `npm run check` (lint, format, type check, unused, deps), `npm run build`, and `npm run test:unit` (the fast unit suite). This is the required status check for the `main` branch ruleset; pull requests cannot merge until it passes.

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

## Node.js Version

The Node.js version is pinned in `.nvmrc`. Both GitHub Actions workflows read this file via `node-version-file` in `actions/setup-node`. Netlify should be configured to use the same version.

## Branch Protection

The `main` branch has a GitHub Ruleset ("Main should be golden") that enforces:

- Pull requests required for all collaborators except the repository owner (bypass list)
- The `test` job from `ci.yml` must pass before merge
- Branches must be up to date with `main` before merging
- Force pushes and deletions are restricted
