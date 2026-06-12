# Method: Monitor Build Resources

## Purpose

Prevent depletion of Netlify build minutes and GitHub Actions minutes by providing daily usage visibility and threshold-based alerts to the team Telegram group.

## Scope

- **Netlify:** build minutes consumed vs monthly limit (300 on Starter plan)
- **GitHub Actions:** minutes consumed vs monthly limit (2,000 on Free plan for private repos)
- **Exclusions:** AI tool usage (Claude, Kimi) — monitored separately if cost becomes material

## Schedule

Daily at 08:00 UTC via GitHub Actions scheduled workflow (`cron: "0 8 * * *"`).

## Notification channel

Telegram group chat. Post a single message per day summarising both services.

## Prerequisites

All secrets are configured in the GitHub repository:

| Secret | Status |
|---|---|
| `TELEGRAM_BOT_TOKEN` | ✓ Configured (Andrew's bot `@bv79c_bot`) |
| `TELEGRAM_CHAT_ID` | ✓ Configured ("Meet Tele" group) |
| `NETLIFY_AUTH_TOKEN` | ✓ Configured (not used by current CI workflows) |
| `NETLIFY_SITE_ID` | ✓ Configured (not used by current CI workflows) |

The workflow uses the default `GITHUB_TOKEN` for Actions usage queries; no additional token is required.

## API endpoints

| Service | Endpoint | Purpose |
|---|---|---|
| Netlify | `GET /api/v1/{account_slug}/builds/status` | Current period minutes, limit, period dates |
| GitHub | `GET /repos/{owner}/{repo}/actions/runs` with date filter | Estimate minutes from completed workflow runs |

GitHub does not expose a single "minutes used this period" API for Free plans. The workflow must aggregate `run_duration_ms` from workflow runs within the current billing period (calendar month for Free plans).

## Message format

```
📊 Build Resources — {date}

Netlify: {current} / {limit} min ({pct}%)
GitHub:  {current} / {limit} min ({pct}%)

Status: {🟢 normal / 🟡 watch / 🔴 throttle / 🚨 stop}

Next threshold: {threshold} at projected {date}
```

## Thresholds and runbook

### 🟡 50% — Watch

- Action: none required.
- Message prefix: "⚠️ Usage above 50%."

### 🔴 75% — Throttle

- Action: the daily message includes a mandatory checklist posted to Telegram:
  1. Confirm Netlify auto-builds remain disabled.
  2. Disable non-essential scheduled workflows (E2E nightly runs, daily integration tests).
  3. Reduce push frequency to `main` where possible — batch small commits.
  4. Review open PRs for unnecessary preview deploys.

### 🚨 90% — Emergency stop

- Action: the monitoring workflow opens a high-priority issue titled `BUILD MINUTES CRITICAL: {service} at {pct}%`.
- Team agrees to a 24-hour code freeze on non-urgent work.
- Cancel all queued non-critical GitHub Actions jobs.
- The workflow itself continues to run so usage can be tracked to zero.

## Workflow behaviour on failure

If either API call fails, the workflow posts a failure message to Telegram and opens a repository issue so the breakage is not silent. Do not skip the notification on API failure — that would hide a monitoring gap.

## Implementation

The agent implements this as `.github/workflows/monitor-resources.yml`. The workflow:
1. Checks out the repo.
2. Queries Netlify API for build status.
3. Queries GitHub API for workflow runs in the current month and sums durations.
4. Computes percentages and determines threshold status.
5. Posts the formatted message to Telegram via `https://api.telegram.org/bot{token}/sendMessage`.
6. Opens an issue if the 90% threshold is breached.

## Verification

After implementation:
1. Trigger the workflow manually and confirm the Telegram message arrives.
2. Verify the numbers match the Netlify dashboard and GitHub billing page.
3. Check that a simulated 90% threshold correctly opens an issue.
