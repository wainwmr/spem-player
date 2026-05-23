# Continuous Integration

The repository uses GitHub Actions for automated testing and dependency updates. All workflows run on Ubuntu latest and read the Node.js version from `.nvmrc`.

## Philosophy

- **Fast PR gate:** Only unit tests, lint, and type checks block merges. The full browser-based end-to-end suite runs separately.
- **Nightly regression:** Playwright e2e tests run on a schedule to catch browser-level regressions without adding friction to the pull request workflow.

## Workflows

### `ci.yml`

Triggers on every push and pull request to `main`.

Jobs:

| Step | Purpose |
|------|---------|
| `npm ci` | Install dependencies |
| `npm run format:check` | Verify Prettier formatting |
| `npm run lint` | ESLint with zero warnings |
| `npx tsc --noEmit` | Type check without emitting files |
| `npm run build` | Production Vite build |
| `npx vitest run` | Unit and integration test suite |

This is the required status check for the `main` branch ruleset. Pull requests cannot merge until this job passes.

### `e2e.yml`

Triggers on a cron schedule (02:00 UTC daily) and on manual `workflow_dispatch`.

Jobs:

| Step | Purpose |
|------|---------|
| `npm ci` | Install dependencies |
| `npm run build` | Production Vite build |
| `npx playwright install --with-deps` | Install browser binaries |
| `npx playwright test` | Run e2e suite |

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
