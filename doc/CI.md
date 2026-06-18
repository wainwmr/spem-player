# Continuous Integration

The repository uses GitHub Actions for automated testing and dependency updates. All workflows run on Ubuntu latest and read the Node.js version from `.nvmrc`.

## Philosophy

- **Fast PR gate:** Only unit tests, lint, and type checks block merges. The full browser-based end-to-end suite runs separately.
- **Nightly regression:** Playwright e2e tests run on a schedule to catch browser-level regressions without adding friction to the pull request workflow.

## Workflows

### `pwa-ci.yml`

Triggers on push and pull request to `main`, nightly at 00:00 UTC via a `schedule` cron, and path-filtered to run only when PWA-relevant files change. Included paths are `packages/pwa/**`, root workspace files that affect the build (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.nvmrc`), and the workflow file itself.

Defines one job.

#### `test` job (`pwa-ci.yml`)

Executes `pnpm run check` (lint, format, type check, unused, deps) and `pnpm run build`, then `pnpm run test:unit`. This is the required status check for the `main` branch ruleset; pull requests cannot merge until it passes.

### `test-noop.yml`

Runs only when a push or pull request to `main` changes files outside the path filters of `pwa-ci.yml`, `monitor-ci.yml`, and `scores-ci.yml` (for example, root `*.md`, `doc/**`, or sibling workflow files such as `pwa-e2e.yml`). It defines a single `test` job that does nothing except report success, so the required `test` status check is still satisfied for PRs that do not touch PWA-, monitor-, or LilyPond-relevant files.

### `pwa-e2e.yml`

Triggers on a cron schedule (02:00 UTC daily) and on manual `workflow_dispatch`.

Steps:

- `pnpm ci` — clean install from lockfile.
- `pnpm run build` — production Vite build.
- `pnpm exec playwright install --with-deps` — install browser binaries.
- `pnpm exec playwright test` — run the e2e suite.

On failure, the Playwright HTML report is uploaded as an artifact and retained for 7 days.

This workflow is intentionally excluded from the PR gate. Playwright tests are slow and can flake on infrastructure issues. Running them nightly catches real regressions within 24 hours without blocking rapid fixes.

### `scores-ci.yml`

Triggers on push to `main` and on `pull_request`, both path-filtered to `packages/scores/**` and this workflow file.

Permissions: `contents: write`.

Defines one job.

#### `test` job (`scores-ci.yml`)

Runs on `ubuntu-latest`.

Steps:

- `actions/checkout@v6` with `ref: ${{ github.head_ref || github.ref_name }}` — checkout the target branch so commits can be pushed back.
- `actions/setup-node@v6` from `.nvmrc` — install Node.js.
- `pnpm install` — clean install from lockfile.
- `pnpm run test:lilypond` — run the Lilypond-related test suite.
- `bash packages/scores/build/install-lilypond.sh` — install LilyPond.
- Set `PATH` to include LilyPond 2.26.0, then `pnpm run build:scores` — regenerate SVGs.
- Commit updated SVGs in `packages/pwa/src/scores/` if changes exist, with message `chore: regenerate SVGs [skip ci]`, then push.

If no SVGs changed, the job exits cleanly without committing.

## Dependabot

`.github/dependabot.yml` configures automated dependency update PRs:

- **pnpm:** Weekly on Mondays at 09:00 UTC, targeting `main`. Related dependencies are grouped into single PRs (vite, vitest, build-tools, types-and-testing, ohm).
- **GitHub Actions:** Monthly, targeting `main`.

Dependabot PRs are subject to the same `test` status check and ruleset requirements as human-authored PRs.

### `dependabot-auto-merge.yml`

A separate workflow enables GitHub native auto-merge for Dependabot **patch** PRs once the `test` status check passes. Minor and major bumps remain open for manual review. This workflow runs only when the PR author is `dependabot[bot]` and inspects the update type via `dependabot/fetch-metadata` before enabling auto-merge.

### Netlify builds and deploys

Netlify handles both production deploys (on push to `main`) and deploy previews
(on pull requests) via its native GitHub integration.

**Build:** `pnpm run build` — Vite prebuild (Ohm grammar bundle, SVGs are already
committed) then Vite production build. No LilyPond required.

**Path filter:** `netlify.toml` configures an `ignore` command that skips the
build when none of the build-relevant paths changed. This preserves the 300
free monthly build minutes. `packages/scores/src/` is intentionally excluded from the
filter — `.ly` changes trigger the Scores CI workflow (#462) which commits
updated SVGs, and the SVG commit then triggers Netlify.

**Deploy preview:** Netlify posts a preview URL as a comment on each PR
automatically.

### `monitor-run.yml`

Triggers daily at 02:29 UTC (`cron: "29 2 * * *"`, deliberately off the top of the hour to avoid GitHub's schedule throttling; GitHub's ~5 h scheduling delay lands the Telegram post around breakfast) and on manual `workflow_dispatch`. Runs one job, `monitor`, on Ubuntu latest with `actions: read`, `issues: write`, `contents: write`, and `pull-requests: read` permissions.

Steps:

- `actions/checkout@v6` — checkout the repository.
- `pnpm --filter monitor exec node monitor-resources.mjs` — run the monitor, with `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `GITHUB_TOKEN` passed in the environment. After fetching usage, the script appends (or replaces) today's entry in `.github/monitor-series.json` with the current Netlify and GitHub build-minute totals.
- Commit the updated `.github/monitor-series.json` if it changed, with message `chore: update daily resource series [skip ci]`, then push. The workflow triggers only on `schedule` and `workflow_dispatch` (never on `push`), so this self-commit cannot loop the workflow; the `[skip ci]` suffix also prevents it from consuming a `pwa-ci.yml` run.

The script queries the current period's Netlify build-minute usage and GitHub Actions usage. Status thresholds — good (< 75%), watch (≥ 75%), throttle (≥ 82%), and stop (≥ 90%) — apply to actual usage, while a linearly projected end-of-period usage can raise an early warning up to throttle (82%) when actual usage is below 90%. This prevents a single high-burn day early in the period from opening a false critical issue while still surfacing an unsustainable burn rate. On days with no PRs merged in the past 24 hours and both actual and projected usage below the watch threshold (50%), the Telegram post is skipped to reduce noise; watch and worse always send regardless of PR activity. The monitor posts only the burndown chart image — no caption and no separate text message — because the chart encodes the full signal: green for good, yellow/amber for watch, red for throttle, and red with a fire icon for stop. If either service actually reaches **90%** of its quota, the status becomes `stop` and the workflow opens a critical GitHub issue containing a runbook for reducing build-minute consumption; projection alone cannot open a critical issue.

The `.github/monitor-series.json` file holds the daily `{ date, netlifyCurrent, githubMinutes, mergedPRs, summary, source }` series. `mergedPRs` is the number of PRs merged on that day; `summary` is a pre-computed snapshot `{ netlifyPct, netlifyProjected, netlifyStatus, githubPct, githubProjected, githubStatus, overallStatus, mergedPRs }` so agents can read status without recalculating. Status values are `"good"`, `"watch"`, `"throttle"`, or `"stop"`. The `source` field is `"logged"` for entries written by the monitor and `"backfill"` for the one-time seed populated from API/GitHub run history and Netlify daily build minutes.

### `monitor-ci.yml`

Triggers on push to `main` and on `pull_request`, both path-filtered to `packages/monitor/**` and this workflow file. This is a separate, optional build for repository infrastructure: it runs only the monitor's `node:test` suite and does not run the Spem Player build. It keeps the monitor's tests out of the main `pwa-ci.yml` gate while ensuring monitor changes are exercised before merge.

Steps:

- `actions/checkout@v6` — checkout the repository.
- `pnpm/action-setup@v4` and `actions/setup-node@v6` from `.nvmrc` — install Node.js and pnpm.
- `pnpm install --filter monitor` — install monitor dependencies (required for the `canvas` native module used by the burndown renderer).
- `pnpm --filter monitor test` — run the monitor and burndown tests.

Run locally with `pnpm run test:monitor`.

## Node.js Version

The Node.js version is pinned in `.nvmrc`. All GitHub Actions workflows read this file via `node-version-file` in `actions/setup-node`. Netlify should be configured to use the same version.

## Branch Protection

The `main` branch has a GitHub Ruleset ("Main should be golden") that enforces:

- Pull requests required for all collaborators except the repository owner (bypass list)
- The `test` job (from `pwa-ci.yml` for PWA changes, `monitor-ci.yml` for monitor changes, `scores-ci.yml` for LilyPond changes, or `test-noop.yml` otherwise) must pass before merge
- Branches must be up to date with `main` before merging
- Force pushes and deletions are restricted
