# Continuous Integration

The repository uses GitHub Actions for automated testing and dependency updates. All workflows run on Ubuntu latest. Those that build or test the app read the Node.js version from `.nvmrc`; the two that only run a dependency-free script (`version-check.yml` and `push-helper-test.yml`) use the runner's preinstalled Node instead, and so skip the `actions/setup-node` step.

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

### `pwa-e2e-notify.yml`

Triggers on `workflow_run` when `PWA E2E` completes. The single `notify` job sends
one Telegram alert (the workflow name, its conclusion, and the failing run's URL)
via `packages/monitor/notify-workflow-failure.mjs`, using the existing
`TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` secrets. A clean run posts nothing.

`PWA E2E` runs only on a nightly cron and manual dispatch, never on push or pull
request. It gates nothing and notifies nobody, leaving only a 7-day failure
artifact, so a real e2e regression could fail unseen night after night. This
narrows that blind spot (#726).

**The gate is a deny-list, deliberately.** It fires on any conclusion that is not
`success`, `cancelled` or `skipped`, so it fails safe: a conclusion GitHub adds in
future alerts rather than silently not-alerting. Gating on `failure` alone would
have missed the cases most likely to go unseen. `pwa-e2e.yml` sets no
`timeout-minutes`, so a hung Playwright run rides the 6-hour runner cap and
concludes `timed_out`, which is a real regression and was silent.

**The alert path is deliberately dependency-free.** `notify-workflow-failure.mjs`
imports only `packages/monitor/telegram.mjs`, which imports nothing, so the job
runs it with bare `node` and needs no install step. An alert that cannot be sent
is the exact failure this workflow exists to prevent, and every dependency is one
more way for it to die before it runs. (It originally imported
`monitor-resources.mjs`, which statically pulls in the native `canvas` addon to
render burndown charts the alert has no use for.)

**Two residuals, accepted rather than hidden.** This narrows the blind spot; it does
not close it. Both were weighed and knowingly accepted (Andrew, 2026-07-14,
[#837](https://github.com/wainwmr/spem-player/issues/837), closed as accepted). They
are recorded here so nobody re-raises them as oversights, and so the consequence is
stated rather than discovered.

1. **Nobody watches the watcher.** If the `notify` job itself fails (a rotated
   secret, a Telegram outage), it goes red in the Actions tab and tells nobody,
   which is the same blind spot one level up. Closing it would need a second channel
   that does not share a failure mode with the first.
2. **A failure-triggered watcher cannot report that the thing it watches has
   stopped.** If `PWA E2E` never runs (a disabled cron, a renamed workflow, a run
   GitHub rejects before it starts) no `workflow_run` event fires and no `if:`
   expression can catch it. Only a scheduled watchdog ("did `PWA E2E` produce a run
   in the last 26 hours?") would.

The consequence being accepted, stated plainly: on a night when the e2e breaks *and*
the notifier is broken, the channel is silent, and silence looks exactly like a
passing run. An alert is still a large improvement on notifying nobody at all, which
is the position this replaces.

As a `workflow_run` workflow it only fires from the copy on the default branch, so
it cannot be exercised from a PR branch. **To prove the trigger after merge, at no
cost:** dispatch `PWA E2E` manually and watch for a `PWA E2E notify` run to appear
with its job skipped. If it appears, the trigger and the workflow-name coupling
are sound; if it does not, the coupling is broken. No alert is sent either way,
because a dispatched run that passes is excluded by the gate.

### `version-check.yml`

Triggers on every pull request to `main`, on `opened`, `synchronize`, `reopened` and
`edited`. Not path-filtered: the guard must see every PR. It exists so two builds
cannot ship under one version string
([#810](https://github.com/wainwmr/spem-player/issues/810), after PR #804 and PR #805
both shipped as 2.8.10 on 2026-07-13).

**The version it guards is the one in `packages/pwa/package.json`.** The root
`package.json` carries a different version and is not the app's. Vite injects the PWA
package's version into `index.html` at build time.

The rule, exactly as enforced:

- A PR that **changes app source** with a **user-facing intent** must carry a version
  strictly above `main`'s, and equal to no other open PR's.
- Any other PR must carry **no bump**: its version must not be above `main`'s. It may
  sit *below* `main`, which happens whenever `main` moves under a branch that
  correctly did not bump.

Both signals must fire. Either one alone misfires badly, and we have the evidence:
classifying on the commit type alone would have demanded a bump on 11 of 21
user-facing-typed commits that correctly shipped without one, because the common real
shape is an unscoped `fix:` on the monitor package, on lint config, or on a build
script.

**App source** is anything that can change what a user downloads:

- everything under `packages/pwa/`, including `index.html`, `index.ts`, `vite.config.ts`
  and `tsconfig.json` (a resolver or target change alters the bundle) and
  `.browserslistrc` / `.postcssrc.json` (they shape the emitted CSS);
- `packages/scores/src/`, which `vite.config.ts` aliases as `@scores` and bundles;
- `pnpm-lock.yaml`. The PWA declares `"dependencies": {}`, so everything it builds with
  (`vite`, `vite-plugin-pwa`, `sass-embedded`, `workbox-window`) is a devDependency and
  its output IS the bundle. Without the lockfile a dependency change would be
  structurally invisible to the guard.

It excludes, by exact path: `packages/pwa/package.json` (the version file itself, so
counting it would be circular), `packages/pwa/src/test/`, `packages/pwa/e2e/`,
`eslint.config.js`, `.prettierrc`, `.prettierignore`, `knip.json`,
`.dependency-cruiser.cjs`, `playwright.config.ts`, `tsconfig.e2e.json` and
`worktree-ports.ts`; plus `packages/scores/build/` (the LilyPond pipeline, which does not
ship), `packages/monitor/`, `.github/` and `doc/`. Anything else newly added under
`packages/pwa/` counts as shipping by default, which fails safe.

**User-facing intent** means a commit subject typed `feat:`, `feature:`, `fix:`,
`perf:` or `revert:`. `build:`, `chore:`, `ci:`, `docs:`, `refactor:`, `style:`, `test:`
and `tooling:` are internal. The type is matched case-insensitively, a `Revert "<subject>"`
inherits the intent of the subject it reverts, and a Dependabot dev-dependency subject
(`[deps](deps-dev):`) is internal. A conventional type it does not recognise
(`bugfix:`, `hotfix:`) is **not** treated as internal: it reads as user-facing, which
is the fail-safe direction.

**Which subjects it reads.** The repo squash-merges, so the subject that lands on
`main` is the **PR title**. The guard classifies the title *and* the branch commits: a
user-facing intent in either one counts. This is why `edited` is in the trigger list.
Without it, an author could pass green as `chore: tidy`, retitle to `feat: metronome`,
and merge unguarded.

**Two known residuals, stated rather than hidden.** Both are deliberate, and closing
either is a rule change for Andrew and Mark, not a bug fix.

1. **The type signal.** An internally-typed change to app source owes no bump. Measured
   against history, 12 of 122 passing commits changed app source, shipped no bump and
   were green, and they are ordinary honest `refactor:` PRs. Roughly one commit in nine.
   Closing it means "app source changed implies a bump", dropping the type signal
   entirely, which would have flagged 18 of 128.
2. **Dependabot.** A `[deps](deps-dev):` bump changes the lockfile, which IS app source,
   but classifies as internal and so owes no bump. Since `vite` is a devDependency, a
   bundler bump can ship a different build under an unchanged version. Without the
   exemption every Dependabot PR goes red, and Dependabot can neither bump the version
   nor clear the check, and its PRs auto-merge.

It **fails closed**, reporting a failure rather than a silent pass, when: either
version is not a plain `x.y.z`; the open-PR list cannot be read, is not a list, or
comes back full and so may be truncated; the list comes back without this PR in it
(which proves it is not the list we think it is, since the PR under test is itself an
open PR, and an empty list would otherwise read as "nothing to collide with"); an open
PR's version string will not parse; this PR's number or title is missing; or git cannot
be read. A peer whose
`packages/pwa/package.json` returns **404** is skipped rather than failed: that head
declares no app version, so it cannot collide, and failing the list would red every PR
in the repo until that one stale PR was closed.

Exit codes: **`0`** pass; **`1`** the version is wrong (`bump-owed`, `no-bump-owed`,
`collision`, `malformed-version`); **`2`** the guard could not tell (`unreadable`,
`unreadable-peer`), which is an infrastructure failure, not a version violation.

The decision lives in the pure function `decideVersion` in
`.github/scripts/version-check.mjs`, unit-tested by
`.github/scripts/version-check.test.mjs` (run by `push-helper-test.yml`, whose path
filter this change extends to cover `version-check.yml` itself).
`.github/scripts/version-check-cli.mjs` is the entry point the workflow runs; it exists
so the module can be imported by its tests without a "was I invoked directly?"
condition, which would be a fail-open guard on a fail-closed tool.

> **This check does not yet block a merge.** It reports a check named `version`, and
> the "Main should be golden" ruleset requires only `test` (see Branch Protection
> below). Until `version` is added to that ruleset's required status checks, a red
> result annotates the PR but does not prevent merging, and Dependabot auto-merge does
> not see it. Adding it is a repository settings change, not a code change. It is safe
> to require: the workflow has no path filter, so it runs on every PR to `main` and can
> never be a permanently-pending required check.

The job checks out with `filter: blob:none` and `sparse-checkout: .github`, because it
reads a 1,905-byte `package.json` while the tip tree is 791.5 MiB, of which 775.8 MiB is
the choir audio under `packages/pwa/public/audio/`. The two options are a pair: removing
the sparse checkout while keeping the filter re-introduces the full download.
`fetch-depth: 0` is kept and is required, because the commit walk and the diff both need
the merge base.

Permissions: `contents: read`, `pull-requests: read`.

### `scores-ci.yml`

Triggers on push to `main` and on `pull_request`, both path-filtered to `packages/scores/**` and this workflow file.

Permissions: `contents: write`.

Defines one job.

#### `test` job (`scores-ci.yml`)

Runs on `ubuntu-latest`.

Steps:

- `actions/checkout@v7` with `ref: ${{ github.head_ref || github.ref_name }}` — checkout the target branch so commits can be pushed back.
- `actions/setup-node@v6` from `.nvmrc` — install Node.js.
- `pnpm install` — clean install from lockfile.
- `pnpm run test:lilypond` — run the Lilypond-related test suite.
- `bash packages/scores/build/install-lilypond.sh` — install LilyPond.
- Set `PATH` to include LilyPond 2.26.0, then `pnpm run build:scores` — regenerate SVGs.
- Commit updated SVGs in `packages/pwa/src/scores/` if changes exist, with message `chore: regenerate SVGs`, then push. The commit deliberately carries no `[skip ci]`: it must trigger `pwa-ci` to verify the regenerated assets, and it must reach Netlify (which honours `[skip ci]`) so the new scores actually deploy. The workflow cannot re-trigger itself: its path filter (`packages/scores/**`) excludes the commit's path, and the job is guarded by `if: github.actor != 'github-actions[bot]'`.

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

**Build:** `pnpm run build` — Vite production build only (no prebuild; the Ohm
grammar bundle, precomputed note data, and SVGs are all committed). No LilyPond required.

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

The rebase is content-blind last-writer-wins, which is correct for a
fully-regenerated file (a dropped score SVG self-heals on the next build). The
build-usage series (`.github/monitor-series.json`) is the exception: it is
upserted, not regenerated, so last-writer-wins could overwrite the daily run's
real `mergedPRs` with a merge-time refresh's `0`. A value-preserving git merge
driver (`packages/monitor/merge-monitor-series.mjs`, bound by `.gitattributes`
and registered by the monitor workflows via
`git config merge.monitor-series.driver`) reconciles a concurrent rebase of that
file by keeping the larger per-day `mergedPRs`, so neither writer erases the
other's count ([#728](https://github.com/wainwmr/spem-player/issues/728)).

`push-helper-test.yml` runs the helper's regression test
(`.github/scripts/push-with-rebase.test.sh`) on any change under
`.github/scripts/`, and also runs the `version-check.mjs` unit tests
(`node --test .github/scripts/version-check.test.mjs`).

## Node.js Version

The Node.js version is pinned in `.nvmrc`. GitHub Actions workflows that build or test the app read this file via `node-version-file` in `actions/setup-node`. Netlify should be configured to use the same version.

Two workflows are deliberate exceptions and run on the runner's preinstalled Node: `version-check.yml` and the version-check step of `push-helper-test.yml`. Both execute a single dependency-free script that uses only long-stable Node APIs, so pinning would add an `actions/setup-node` step to every pull request for determinism they do not need.

## Branch Protection

The `main` branch has a GitHub Ruleset ("Main should be golden") that enforces:

- Pull requests required for all collaborators except the repository owner (bypass list)
- The `test` job (from `pwa-ci.yml` for PWA changes, `monitor-ci.yml` for monitor changes, `scores-ci.yml` for LilyPond changes, or `test-noop.yml` otherwise) must pass before merge
- Branches must be up to date with `main` before merging
- Force pushes and deletions are restricted

`test` is currently the **only** required status check. The `version` job from
`version-check.yml` is therefore advisory: it reports on every PR, but a red result
does not block the merge button, and Dependabot auto-merge
(`.github/workflows/dependabot-auto-merge.yml`, which merges once the required
checks pass) does not see it. **To make the app-version guard actually guard, add
`version` to this ruleset's required status checks.** That is a repository settings
change and cannot be made from a pull request.
