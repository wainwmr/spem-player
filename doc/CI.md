# Continuous Integration

The repository uses GitHub Actions for automated testing and dependency updates. All workflows run on Ubuntu latest and read the Node.js version from `.nvmrc`.

## Philosophy

- **Fast PR gate:** Only unit tests, lint, and type checks block merges. The full browser-based end-to-end suite runs separately.
- **Nightly regression:** Playwright e2e tests run on a schedule to catch browser-level regressions without adding friction to the pull request workflow.

## Workflows

### `ci.yml`

Triggers on push and pull request to `main`, nightly at 00:00 UTC via a `schedule` cron, and path-filtered to skip changes that do not affect the application build or unit tests (for example, `lilypond/src/**` and `lilypond/build/**` are ignored).

Defines three jobs.

#### `changes` job

Runs first on every trigger. For `push` and `schedule` events it always reports that application-relevant files changed. For `pull_request` events it compares the PR branch to the base branch and reports whether any changed file lies outside `ci.yml`'s `paths-ignore` list.

#### `test` job

Runs only when `changes` reports application-relevant files. Executes `pnpm run check` (lint, format, type check, unused, deps) and `pnpm run build`, then `pnpm run test:unit`. This is the required status check for the `main` branch ruleset; pull requests cannot merge until it passes.

#### `test-noop` job

Runs only when `changes` reports that *all* changed files are inside `ci.yml`'s `paths-ignore` list (for example, a PR confined to root-level `*.md` or to one of the ignored sibling workflow files). Reports the same `test` check name as the real job so branch protection is satisfied, without doing any application build or test work. This prevents the blocked-PR problem described in #558 and tracked more generally in #563.

### `e2e.yml`

Triggers on a cron schedule (02:00 UTC daily) and on manual `workflow_dispatch`.

Steps:

- `pnpm ci` — clean install from lockfile.
- `pnpm run build` — production Vite build.
- `pnpm exec playwright install --with-deps` — install browser binaries.
- `pnpm exec playwright test` — run the e2e suite.

On failure, the Playwright HTML report is uploaded as an artifact and retained for 7 days.

This workflow is intentionally excluded from the PR gate. Playwright tests are slow and can flake on infrastructure issues. Running them nightly catches real regressions within 24 hours without blocking rapid fixes.

### `lilypond.yml`

Triggers on push to `main` and on `pull_request`, both path-filtered to `lilypond/src/**`, `lilypond/test/**`, `lilypond/build/buildScores.mjs`, `lilypond/build/postprocessSvg.mjs`, and `lilypond/build/install-lilypond.sh`.

Permissions: `contents: write`.

Defines one job.

#### `regenerate-svgs` job

Runs on `ubuntu-latest`.

Steps:

- `actions/checkout@v6` with `ref: ${{ github.head_ref || github.ref_name }}` — checkout the target branch so commits can be pushed back.
- `actions/setup-node@v6` from `.nvmrc` — install Node.js.
- `pnpm ci` — clean install from lockfile.
- `pnpm run test:lilypond` — run the Lilypond-related test suite.
- `bash lilypond/build/install-lilypond.sh` — install LilyPond.
- Set `PATH` to include LilyPond 2.26.0, then `pnpm run build:scores` — regenerate SVGs.
- Commit updated SVGs in `src/scores/` if changes exist, with message `chore: regenerate SVGs [skip ci]`, then push.

If no SVGs changed, the job exits cleanly without committing.

## Dependabot

`.github/dependabot.yml` configures automated dependency update PRs:

- **pnpm:** Weekly on Mondays at 09:00 UTC, targeting `main`. Related dependencies are grouped into single PRs (vite, vitest, build-tools, types-and-testing, ohm).
- **GitHub Actions:** Monthly, targeting `main`.

Dependabot PRs are subject to the same `ci.yml` checks and ruleset requirements as human-authored PRs.

### `dependabot-auto-merge.yml`

A separate workflow enables GitHub native auto-merge for Dependabot **patch** PRs once the `test` status check passes. Minor and major bumps remain open for manual review. This workflow runs only when the PR author is `dependabot[bot]` and inspects the update type via `dependabot/fetch-metadata` before enabling auto-merge.

### Netlify builds and deploys

Netlify handles both production deploys (on push to `main`) and deploy previews
(on pull requests) via its native GitHub integration.

**Build:** `pnpm run build` — Vite prebuild (Ohm grammar bundle, SVGs are already
committed) then Vite production build. No LilyPond required.

**Path filter:** `netlify.toml` configures an `ignore` command that skips the
build when none of the build-relevant paths changed. This preserves the 300
free monthly build minutes. `lilypond/src/` is intentionally excluded from the
filter — `.ly` changes trigger the LilyPond workflow (#462) which commits
updated SVGs, and the SVG commit then triggers Netlify.

**Deploy preview:** Netlify posts a preview URL as a comment on each PR
automatically.

### `monitor-resources.yml`

Triggers daily at 02:29 UTC (`cron: "29 2 * * *"`, deliberately off the top of the hour to avoid GitHub's schedule throttling; GitHub's ~5 h scheduling delay lands the Telegram post around breakfast) and on manual `workflow_dispatch`. Runs one job, `monitor`, on Ubuntu latest with `actions: read`, `issues: write`, `contents: write`, and `pull-requests: read` permissions.

Steps:

- `actions/checkout@v6` — checkout the repository.
- `node .github/scripts/monitor-resources.mjs` — run the monitor, with `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `GITHUB_TOKEN` passed in the environment. After fetching usage, the script appends (or replaces) today's entry in `.github/monitor-series.json` with the current Netlify and GitHub build-minute totals.
- Commit the updated `.github/monitor-series.json` if it changed, with message `chore: update daily resource series [skip ci]`, then push. The workflow triggers only on `schedule` and `workflow_dispatch` (never on `push`), so this self-commit cannot loop the workflow; the `[skip ci]` suffix also prevents it from consuming a `ci.yml` run.

The script queries the current period's Netlify build-minute usage and GitHub Actions usage. Status thresholds — watch (≥ 50%), throttle (≥ 75%), and critical (≥ 90%) — apply to the higher of actual usage and the linearly projected end-of-period usage, so an unsustainable burn rate raises the alarm early in the billing period. On days with no PRs merged in the past 24 hours and both actual and projected usage below the watch threshold (50%), the Telegram message is skipped to reduce noise; watch and worse always send regardless of PR activity. When the message is sent, it takes the form `Netlify <n>% · GitHub <n>% — <status>` (the percentages are actual usage; the status reflects the worse of actual and projected), appending `· N PR(s) merged` when at least one PR merged in the past 24 hours. If either service reaches, or is projected to reach by period end, **90%** of its quota, the status becomes `STOP` (with a 🚨 prefix) and the workflow opens a critical GitHub issue containing a runbook for reducing build-minute consumption.

The `.github/monitor-series.json` file holds the daily `{ date, netlifyCurrent, githubMinutes, source }` series. The `source` field is `"logged"` for entries written by the monitor and `"backfill"` for the one-time seed populated from API/GitHub run history and Telegram-reported Netlify percentages.

### `monitor-resources-test.yml`

Triggers on push to `main` and on `pull_request`, both path-filtered to the monitor script, its test file, and this workflow file. This is a separate, optional build for repository infrastructure: it runs only the monitor's `node:test` suite and does not install application dependencies or run the Spem Player build. It keeps the monitor's tests out of the main `ci.yml` gate while ensuring monitor changes are exercised before merge.

Steps:

- `actions/checkout@v6` — checkout the repository.
- `actions/setup-node@v6` from `.nvmrc` — install Node.js.
- `node --test .github/scripts/monitor-resources.test.mjs` — run the monitor tests.

Run locally with `pnpm run test:monitor`.

## Node.js Version

The Node.js version is pinned in `.nvmrc`. All GitHub Actions workflows read this file via `node-version-file` in `actions/setup-node`. Netlify should be configured to use the same version.

## Branch Protection

The `main` branch has a GitHub Ruleset ("Main should be golden") that enforces:

- Pull requests required for all collaborators except the repository owner (bypass list)
- The `test` job from `ci.yml` must pass before merge
- Branches must be up to date with `main` before merging
- Force pushes and deletions are restricted
