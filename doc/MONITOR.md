# Build-resource Monitor

The Spem Player repository runs a small Node.js monitor under `packages/monitor/`
that tracks Netlify and GitHub Actions build-minute usage, posts a daily burndown
chart to Telegram, and opens a critical issue if usage nears quota.

## Why it exists

Both Netlify (build minutes) and GitHub Actions (workflow minutes) have monthly
quotas. The monitor gives early warning of an unsustainable burn rate before the
quota is exhausted.

## Files

- `packages/monitor/monitor-resources.mjs` — fetches usage, decides status,
  updates `.github/monitor-series.json`, sends the Telegram chart, and opens a
  critical issue when needed.
- `packages/monitor/render-burndown.mjs` — renders the two-panel burndown chart
  as a PNG.
- `packages/monitor/package.json` — defines the `@spem/monitor` package, its
  `test` script (`node --test monitor-resources.test.mjs render-burndown.test.mjs`)
  and its `lint` script.
- `.github/workflows/monitor-ci.yml` — CI gate for monitor changes.
- `.github/workflows/monitor-run.yml` — scheduled daily run.
- `.github/workflows/monitor-refresh.yml` — merge-time refresh that keeps
  today's series entry current intra-day (at most one series-changing refresh
  per hour).
- `.github/monitor-series.json` — daily cumulative usage series, committed by
  `monitor-run.yml` and refreshed intra-day by `monitor-refresh.yml`.

## Status thresholds

Status is the worse of the Netlify and GitHub statuses, driven by `statusPct`:

- `good` — below 75%.
- `watch` — 75% or above.
- `throttle` — 82% or above.
- `stop` — 90% or above (actual usage only; projection alone cannot open a
  critical issue).

`computeUsageStatus` projects current usage linearly to the end of the billing
period, working from the unrounded percentage to avoid scaling the rounding
error. The status driver is the worse of actual percentage and projected
percentage, capped at `throttle` unless actual usage already breaches critical.

## Daily report behaviour

The scheduled workflow runs daily at 02:29 UTC. It:

1. Fetches the current billing-period usage from Netlify and GitHub.
2. Builds a daily summary and appends (or replaces) today's entry in
   `.github/monitor-series.json`.
3. Fetches the number of PRs merged in the last 24 hours.
4. Skips the Telegram post only when no PRs were merged in the last 24 hours
   **and** both actual and projected usage are below the watch threshold (75%).
   Watch and worse always send.
5. Renders and posts the burndown chart to Telegram as a photo with no caption.
6. Opens a critical issue if the overall status reaches `stop`.

The chart encodes the full signal: green for good, yellow for watch, red for
throttle, and red with a fire icon for stop.

## Workflows

### `monitor-ci.yml`

Runs on push to `main` and on `pull_request`, path-filtered to
`packages/monitor/**` and the workflow file. It installs monitor dependencies
and runs `pnpm --filter @spem/monitor test`. This is a separate, optional gate:
it does not run the Spem Player build.

Run locally with `pnpm run test:monitor`.

### `monitor-run.yml`

Runs on a daily cron (`29 2 * * *`) and on `workflow_dispatch`. Permissions:

- `actions: read`
- `issues: write`
- `contents: write`
- `pull-requests: read`

Required secrets:

- `MONITOR_PUSH_TOKEN` — used to commit the updated series file.
- `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` — Netlify API access.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` — Telegram post.
- `GITHUB_TOKEN` — GitHub API access for usage and issue creation.

Steps:

1. Check out the repository.
2. Install dependencies with
   `pnpm install --frozen-lockfile --filter @spem/monitor`.
3. Run `pnpm --filter @spem/monitor exec node monitor-resources.mjs`.
4. If `.github/monitor-series.json` changed, commit it with
   `chore: update daily resource series [skip ci]` and push.

The workflow triggers only on `schedule` and `workflow_dispatch`, so the
self-commit cannot loop the workflow. The `[skip ci]` suffix also prevents it
from consuming a `pwa-ci.yml` run.

### `monitor-refresh.yml`

Runs on every push to `main`. It keeps the throttle gate (Item #646) reacting to
intra-day usage instead of waiting for the next daily run: it re-fetches Netlify
and GitHub usage, recomputes today's summary, and upserts today's entry in
`.github/monitor-series.json`.

It deliberately does **less** than the daily run. It invokes
`monitor-resources.mjs --refresh`, which updates today's entry only and sends no
Telegram message, renders no chart, and opens no critical issue. It also leaves
`mergedPRs` at 0; the daily run sets the real count later, but only on a run that
does not skip the report (see `shouldSkipReport`).

The hourly cap is a `git log --grep` for the previous refresh commit, so the
checkout uses `fetch-depth: 0` to make that history visible. Because the cap keys
off the last series-update commit, it caps refreshes that **change** the series
to one per hour; in a flat-usage window (no series change, hence no commit) a
merge may re-read the APIs, which is cheap (rate-limit only, no build minutes).
The workflow is loop-safe: its self-commit (`chore: refresh build-usage series
[skip ci]`) carries `[skip ci]`, which suppresses the push trigger that would
otherwise re-run it, and a no-change run makes no commit so it cannot loop.

Required secrets: `MONITOR_PUSH_TOKEN` (to commit the series),
`NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`, and `GITHUB_TOKEN`. It does not use the
Telegram secrets.

## Running locally

- Run monitor tests: `pnpm run test:monitor`
- Lint the monitor package: `pnpm --filter @spem/monitor lint`
- Run the monitor script locally: set the environment variables listed in
  `monitor-resources.mjs` and run
  `pnpm --filter @spem/monitor exec node monitor-resources.mjs`.
- Run the merge-time refresh locally: set the same variables minus the Telegram
  ones, then
  `pnpm --filter @spem/monitor exec node monitor-resources.mjs --refresh`.

## Notes

- Do not edit `.github/monitor-series.json` by hand; the workflow owns it.
- Netlify billing periods can start mid-month; the script warns and falls back
  to a calendar-month assumption if the API omits period dates.
- GitHub usage is derived from workflow-run durations for the current calendar
  month.

## Related tickets

- [#536](https://github.com/wainwmr/spem-player/issues/536) — monitor burn-rate
  projection status model.
- [#553](https://github.com/wainwmr/spem-player/issues/553) — damp early-period
  projections.
- [#564](https://github.com/wainwmr/spem-player/issues/564) — monitor CI wiring.
- [#581](https://github.com/wainwmr/spem-player/issues/581) — split monitor
  tests into their own workflow.
- [#616](https://github.com/wainwmr/spem-player/issues/616) /
  [#617](https://github.com/wainwmr/spem-player/issues/617) — restore ESLint
  coverage for monitor `.mjs` files.
