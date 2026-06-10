#!/usr/bin/env node
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Daily build-resource monitor.
 *
 * Queries Netlify and GitHub APIs for current-period build-minute usage,
 * posts a one-line summary to Telegram, and opens a critical issue if
 * either service exceeds 90% of quota.
 *
 * Skips the Telegram message on days with no PR merges and normal usage
 * (below 50%). Watch (≥ 50%), throttle (≥ 75%), and critical (≥ 90%) alerts
 * always send regardless of PR activity.
 *
 * Environment variables (all required):
 *   NETLIFY_AUTH_TOKEN
 *   NETLIFY_SITE_ID
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *   GITHUB_TOKEN
 *   GITHUB_REPOSITORY  (owner/repo format)
 */

import { fileURLToPath } from "url";
import { realpathSync } from "fs";

const NETLIFY_API = "https://api.netlify.com/api/v1";
const TELEGRAM_API = "https://api.telegram.org/bot";
const WATCH_THRESHOLD_PCT = 50;

async function api(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} on ${url}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function getNetlifyUsage() {
  const site = await api(
    `${NETLIFY_API}/sites/${process.env.NETLIFY_SITE_ID}`,
    { headers: { Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}` } }
  );
  const status = await api(
    `${NETLIFY_API}/${site.account_slug}/builds/status`,
    { headers: { Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}` } }
  );
  return {
    current: status.minutes?.current ?? 0,
    limit: parseInt(status.minutes?.included_minutes_with_packs ?? "300", 10),
  };
}

/**
 * Parse `owner` and `repo` from the `GITHUB_REPOSITORY` environment variable.
 *
 * @returns {{owner: string, repo: string}} Both guaranteed non-empty.
 * @throws {Error} If `GITHUB_REPOSITORY` is absent or not in `owner/repo` form.
 */
export function parseRepo() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY?.split("/") ?? [];
  if (!owner || !repo) {
    throw new Error(
      `GITHUB_REPOSITORY must be owner/repo format, got: ${process.env.GITHUB_REPOSITORY}`
    );
  }
  return { owner, repo };
}

async function getMergedPRCount(since) {
  const { owner, repo } = parseRepo();
  const data = await api(
    `https://api.github.com/search/issues?q=repo:${owner}/${repo}+is:pr+is:merged+merged:>=${since}&per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  // total_count is reliable from the Search API even with per_page=1;
  // we need the count, not the PR records, so fetching one record is enough.
  if (!Number.isInteger(data.total_count) || data.total_count < 0) {
    throw new Error(
      `PR search API returned unexpected total_count: ${JSON.stringify(data.total_count)}`
    );
  }
  return data.total_count;
}

/**
 * Returns true if the daily Telegram report should be suppressed.
 *
 * Suppresses only when both conditions hold: no PRs merged in the reporting
 * window (mergedCount === 0) and resource usage is below the watch threshold.
 * Either condition alone is insufficient.
 *
 * @param {number} mergedCount - PR merge count for the reporting window.
 * @param {number} maxPct - Maximum of Netlify and GitHub usage percentages (0–100).
 * @returns {boolean}
 */
export function shouldSkipReport(mergedCount, maxPct) {
  return mergedCount === 0 && maxPct < WATCH_THRESHOLD_PCT;
}

/**
 * Builds the one-line Telegram summary message.
 * Appends "· N PR(s) merged" only when mergedCount > 0.
 *
 * @param {string} emoji - Status emoji (🟢/🟡/🔴/🚨).
 * @param {number} netlifyPct - Netlify usage percentage (0–100).
 * @param {number} githubPct - GitHub Actions usage percentage (0–100).
 * @param {string} status - Status label ("normal"/"watch"/"throttle"/"STOP").
 * @param {number} mergedCount - Number of PRs merged in the reporting window.
 * @returns {string}
 */
export function formatMessage(
  emoji,
  netlifyPct,
  githubPct,
  status,
  mergedCount
) {
  const base = `${emoji} Netlify ${netlifyPct}% · GitHub ${githubPct}% — ${status}`;
  if (mergedCount === 0) return base;
  const noun = mergedCount === 1 ? "PR" : "PRs";
  return `${base} · ${mergedCount} ${noun} merged`;
}

/**
 * Returns the start of the 24-hour reporting window as a `YYYY-MM-DD` string.
 *
 * GitHub's Search API `merged:` qualifier requires `YYYY-MM-DD`; passing an
 * ISO timestamp causes it to return `total_count: 0` even when matching PRs
 * exist. See #491.
 *
 * @param {number} nowMs - Current time in milliseconds since Unix epoch.
 * @returns {string}
 */
export function getReportingSince(nowMs = Date.now()) {
  return new Date(nowMs - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function getGitHubUsage() {
  const { owner, repo } = parseRepo();
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

  let totalMs = 0;
  let page = 1;
  while (true) {
    const data = await api(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?created=>=${start}&per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } }
    );
    const runs = data.workflow_runs || [];
    if (runs.length === 0) break;

    for (const run of runs) {
      if (run.run_duration_ms) {
        totalMs += run.run_duration_ms;
      } else if (run.run_started_at && run.updated_at) {
        const s = new Date(run.run_started_at).getTime();
        const e = new Date(run.updated_at).getTime();
        totalMs += Math.max(0, e - s);
      }
    }

    if (runs.length < 100) break;
    page++;
  }

  return { current: Math.round(totalMs / 60000), limit: 2000 };
}

async function sendTelegram(text) {
  const url = `${TELEGRAM_API}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
  });
  if (!res.ok) throw new Error(`Telegram HTTP ${res.status}`);
}

async function openIssue(title, body) {
  const { owner, repo } = parseRepo();
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body }),
    }
  );
  if (!res.ok) throw new Error(`Issues API HTTP ${res.status}`);
}

async function main() {
  let netlify, github;

  try {
    netlify = await getNetlifyUsage();
  } catch (e) {
    try {
      await sendTelegram(`🚨 Monitor: Netlify API failed — ${e.message}`);
      await openIssue("Monitor failure: Netlify API error", e.message);
    } catch (alertErr) {
      console.error(
        `Failed to send alert for Netlify failure: ${alertErr.message}`
      );
    }
    throw e;
  }

  try {
    github = await getGitHubUsage();
  } catch (e) {
    try {
      await sendTelegram(`🚨 Monitor: GitHub API failed — ${e.message}`);
      await openIssue("Monitor failure: GitHub API error", e.message);
    } catch (alertErr) {
      console.error(
        `Failed to send alert for GitHub failure: ${alertErr.message}`
      );
    }
    throw e;
  }

  const netlifyPct =
    netlify.limit > 0 ? Math.round((netlify.current / netlify.limit) * 100) : 0;
  const githubPct =
    github.limit > 0 ? Math.round((github.current / github.limit) * 100) : 0;
  const maxPct = Math.max(netlifyPct, githubPct);

  let emoji = "🟢";
  let status = "normal";
  if (maxPct >= 90) {
    emoji = "🚨";
    status = "STOP";
  } else if (maxPct >= 75) {
    emoji = "🔴";
    status = "throttle";
  } else if (maxPct >= WATCH_THRESHOLD_PCT) {
    emoji = "🟡";
    status = "watch";
  }

  const since = getReportingSince();
  let mergedCount;
  try {
    mergedCount = await getMergedPRCount(since);
  } catch (e) {
    try {
      await sendTelegram(`🚨 Monitor: PR search API failed — ${e.message}`);
      await openIssue("Monitor failure: PR search API error", e.message);
    } catch (alertErr) {
      console.error(
        `Failed to send alert for PR search failure: ${alertErr.message}`
      );
    }
    throw e;
  }

  if (shouldSkipReport(mergedCount, maxPct)) {
    console.log(`Skipping report: no PRs merged and usage normal (${maxPct}%)`);
    return;
  }

  const message = formatMessage(
    emoji,
    netlifyPct,
    githubPct,
    status,
    mergedCount
  );

  try {
    await sendTelegram(message);
  } catch (e) {
    try {
      await openIssue("Monitor failure: Telegram API error", e.message);
    } catch (alertErr) {
      console.error(
        `Failed to open issue for Telegram failure: ${alertErr.message}`
      );
    }
    throw e;
  }

  if (maxPct >= 90) {
    const svc = netlifyPct >= 90 ? "Netlify" : "GitHub";
    await openIssue(
      `BUILD MINUTES CRITICAL: ${svc} at ${maxPct}%`,
      `Daily monitoring detected ${svc} build minutes at ${maxPct}% of quota.\n\nRunbook:\n1. Confirm Netlify auto-builds remain disabled.\n2. Disable non-essential scheduled workflows.\n3. Batch commits to reduce push frequency.\n4. Review open PRs for unnecessary preview deploys.\n5. Consider a 24-hour code freeze on non-urgent work.`
    );
  }

  console.log(message);
}

// Only run main() when invoked directly, not when imported by tests.
// realpathSync on both sides resolves symlinks so the comparison holds
// when Node is launched via a symlinked path (macOS / nvm common case).
const __filename = fileURLToPath(import.meta.url);
const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === realpathSync(__filename);
if (isMain) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
