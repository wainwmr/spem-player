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

### `reset-spine-on-close.yml`

Triggers on `issues: closed`. Repaints the terminal `.WSx` spine label when
GitHub closes a ticket, a transition where no agent is in the loop to repaint it,
so the label does not drift until a later audit. It maps the close reason to the
spine as follows: a `completed` close becomes `.WS4`, and anything else (not
planned, duplicate, or an unrecognised reason) becomes `.WS9`, never assuming
merged. It reads only `.WSx` labels, so trust labels (`vera...`,
`UI...`) and flags are left untouched, and it is idempotent: a ticket already
carrying the correct spine yields no edit.

Permissions: `issues: write` (the default token is read-only for the issues
scope in this organisation).

## Dependabot

`.github/dependabot.yml` configures automated dependency update PRs:

- **pnpm:** Weekly on Mondays at 09:00 UTC, targeting `main`. Related dependencies are grouped into single PRs (vite, vitest, build-tools, types-and-testing, ohm).
- **GitHub Actions:** Weekly on Mondays at 09:00 UTC, targeting `main`.

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

### `monitor-run.yml`, `monitor-refresh.yml`, and `monitor-ci.yml`

The build-resource monitor tracks Netlify and GitHub Actions usage, posts a daily
burndown chart to Telegram, and opens a critical issue if usage nears quota.
`monitor-run.yml` is the daily run; `monitor-refresh.yml` re-reads usage on push
to `main` (at most one series-changing refresh per hour; no Telegram, chart, or
critical issue) so the throttle gate reacts to intra-day merges; `monitor-ci.yml`
is the test gate for monitor changes. See [`doc/MONITOR.md`](./MONITOR.md) for the full monitor documentation,
including status thresholds, workflow permissions, required secrets, and how to
run the monitor locally.

### Pushing regenerated files to `main`

Three workflows commit a regenerated file to `main`: `monitor-run.yml`,
`monitor-refresh.yml`, and `scores-ci.yml`. Each pushes via the shared helper
`.github/scripts/push-with-rebase.sh`, which retries with a rebase if a concurrent
push moved `main` first, so an overlapping run converges instead of failing
non-fast-forward ([#727](https://github.com/wainwmr/spem-player/issues/727)).
`push-helper-test.yml` runs the helper's regression test
(`.github/scripts/push-with-rebase.test.sh`) on any change under
`.github/scripts/`.

## Node.js Version

The Node.js version is pinned in `.nvmrc`. All GitHub Actions workflows read this file via `node-version-file` in `actions/setup-node`. Netlify should be configured to use the same version.

## Branch Protection

The `main` branch has a GitHub Ruleset ("Main should be golden") that enforces:

- Pull requests required for all collaborators except the repository owner (bypass list)
- The `test` job (from `pwa-ci.yml` for PWA changes, `monitor-ci.yml` for monitor changes, `scores-ci.yml` for LilyPond changes, or `test-noop.yml` otherwise) must pass before merge
- Branches must be up to date with `main` before merging
- Force pushes and deletions are restricted
