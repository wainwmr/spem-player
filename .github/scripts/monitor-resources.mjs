#!/usr/bin/env node
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Daily build-resource monitor.
 *
 * Queries Netlify and GitHub APIs for current-period build-minute usage,
 * posts a one-line summary to Telegram, and opens a critical issue if
 * either service reaches — or is linearly projected to reach by the end of
 * its billing period — 90% of quota.
 *
 * All thresholds apply to the higher of actual and projected end-of-period
 * usage. Skips the Telegram message on days with no PR merges when both
 * actual and projected usage are below 50%. Watch (≥ 50%), throttle (≥ 75%),
 * and critical (≥ 90%) alerts always send regardless of PR activity.
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

/**
 * Project current usage to the end of the billing period using a linear
 * burn-rate assumption. Pure scaling: the result is in the same unit as
 * `current` — pass a percentage to get a projected percentage.
 *
 * @param {number} current - Usage percentage consumed so far (0-100).
 * @param {number} daysElapsed - Days since the period started; values below
 *   1 are clamped to 1.
 * @param {number} daysInPeriod - Total days in the billing period.
 * @returns {number} Projected end-of-period percentage (0-100+), rounded.
 */
export function projectedPct(current, daysElapsed, daysInPeriod) {
  return Math.round((current / Math.max(1, daysElapsed)) * daysInPeriod);
}

/**
 * @typedef {object} UsageRecord
 * @property {number} current - Consumed build minutes so far this period.
 * @property {number} limit - Build-minute quota for the period.
 * @property {string} periodStartDate - Billing period start (YYYY-MM-DD).
 * @property {string} periodEndDate - Billing period end (YYYY-MM-DD).
 */

/**
 * Validate and normalise a billing period's date pair. Throws on an
 * unparseable date or an end-before-start pair so that malformed API data
 * fails loudly on the caller's alert path instead of propagating NaN into
 * the projection, where every threshold comparison silently reads false
 * (Vera 536-02).
 *
 * @param {string} startStr - Period start, ISO date or timestamp.
 * @param {string} endStr - Period end, ISO date or timestamp.
 * @returns {{periodStartDate: string, periodEndDate: string}} Normalised
 *   to YYYY-MM-DD.
 */
export function validatePeriod(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error(
      `unparseable period date: start=${JSON.stringify(startStr)} end=${JSON.stringify(endStr)}`
    );
  }
  if (end.getTime() < start.getTime()) {
    throw new Error(
      `period ends before it starts: start=${startStr} end=${endStr}`
    );
  }
  return {
    periodStartDate: start.toISOString().slice(0, 10),
    periodEndDate: end.toISOString().slice(0, 10),
  };
}

/**
 * Compute actual, projected, and status percentages for one service from
 * its raw usage record. The single place raw minutes are converted to
 * percentages before projection — the projection always operates on a
 * percentage (Vera 536-01).
 *
 * @param {UsageRecord} usage
 * @param {Date} [now] - Reference date; defaults to `new Date()`.
 * @returns {{pct: number, projected: number, statusPct: number}} Actual
 *   percentage, linearly projected end-of-period percentage, and the worse
 *   of the two (which drives status).
 */
export function computeUsageStatus(usage, now = new Date()) {
  // Project from the unrounded percentage: rounding first would scale the
  // rounding error by period/elapsed (up to 30x on day one).
  const rawPct = usage.limit > 0 ? (usage.current / usage.limit) * 100 : 0;
  const pct = Math.round(rawPct);
  const elapsed = daysSince(usage.periodStartDate, now);
  const period = daysInPeriod(usage.periodStartDate, usage.periodEndDate);
  const projected = projectedPct(rawPct, elapsed, period);
  return { pct, projected, statusPct: Math.max(pct, projected) };
}

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
  const now = new Date();
  const fallbackStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
  const fallbackEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
  if (!status.minutes?.period_start_date || !status.minutes?.period_end_date) {
    // Netlify billing periods anchor to the account day, often mid-month; a
    // calendar-month assumption can skew the projection in either direction,
    // so the operator must know it engaged (Vera 536-03).
    console.warn(
      "monitor-resources: period dates missing from Netlify response; assuming calendar month"
    );
  }
  return {
    current: status.minutes?.current ?? 0,
    limit: parseInt(status.minutes?.included_minutes_with_packs ?? "300", 10),
    ...validatePeriod(
      status.minutes?.period_start_date ?? fallbackStart,
      status.minutes?.period_end_date ?? fallbackEnd
    ),
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
 * Suppresses only when all three conditions hold: no PRs merged in the
 * reporting window (mergedCount === 0), actual usage below the watch
 * threshold, and projected end-of-period usage below the watch threshold.
 * This is the single place the cross-service actual and projected maxima
 * are combined for the skip decision; callers pass them separately
 * (Vera 536-04).
 *
 * @param {number} mergedCount - PR merge count for the reporting window.
 * @param {number} maxActualPct - Worse of the services' actual usage
 *   percentages (0-100).
 * @param {number} maxProjectedPct - Worse of the services' projected
 *   end-of-period percentages (0-100+).
 * @returns {boolean}
 */
export function shouldSkipReport(mergedCount, maxActualPct, maxProjectedPct) {
  return (
    mergedCount === 0 &&
    Math.max(maxActualPct, maxProjectedPct) < WATCH_THRESHOLD_PCT
  );
}

/**
 * Build the critical-issue title and body from the two services' status
 * records. The service is named by the quantity that drove the STOP
 * (statusPct, the worse of actual and projected), and the wording
 * distinguishes an actual breach from a projection (Vera 536-04/536-07).
 *
 * @param {{pct: number, projected: number, statusPct: number}} netlifyStatus
 * @param {{pct: number, projected: number, statusPct: number}} githubStatus
 * @returns {{title: string, body: string}}
 */
export function formatCriticalIssue(netlifyStatus, githubStatus) {
  const svc = netlifyStatus.statusPct >= 90 ? "Netlify" : "GitHub";
  const svcStatus = svc === "Netlify" ? netlifyStatus : githubStatus;
  const actualBreach = svcStatus.pct >= 90;
  const headline = actualBreach
    ? `at ${svcStatus.pct}%`
    : `projected ${svcStatus.projected}%`;
  const detail = actualBreach
    ? `at ${svcStatus.pct}% of quota`
    : `at ${svcStatus.pct}% of quota and projected to reach ${svcStatus.projected}% by period end`;
  return {
    title: `BUILD MINUTES CRITICAL: ${svc} ${headline}`,
    body: `Daily monitoring detected ${svc} build minutes ${detail}.\n\nRunbook:\n1. Confirm Netlify auto-builds remain disabled.\n2. Disable non-essential scheduled workflows.\n3. Batch commits to reduce push frequency.\n4. Review open PRs for unnecessary preview deploys.\n5. Consider a 24-hour code freeze on non-urgent work.`,
  };
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
  const periodStartDate = start.slice(0, 10);
  const periodEndDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);

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

  return {
    current: Math.round(totalMs / 60000),
    limit: 2000,
    periodStartDate,
    periodEndDate,
  };
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

/**
 * Return the number of whole calendar days from `startStr` up to and
 * including `now` (defaulting to the current UTC calendar day).
 *
 * @param {string} startStr - ISO date string (YYYY-MM-DD).
 * @param {Date} [now] - Reference date; defaults to `new Date()`.
 * @returns {number}
 */
export function daysSince(startStr, now = new Date()) {
  const start = new Date(startStr);
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((nowUtc - startUtc) / msPerDay) + 1;
}

/**
 * Return the number of whole calendar days from `startStr` to `endStr`
 * inclusive.
 *
 * @param {string} startStr - ISO date string (YYYY-MM-DD).
 * @param {string} endStr - ISO date string (YYYY-MM-DD).
 * @returns {number}
 */
export function daysInPeriod(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((endUtc - startUtc) / msPerDay) + 1;
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

  const netlifyStatus = computeUsageStatus(netlify);
  const githubStatus = computeUsageStatus(github);
  const netlifyPct = netlifyStatus.pct;
  const githubPct = githubStatus.pct;
  const maxActual = Math.max(netlifyPct, githubPct);
  const maxProjected = Math.max(netlifyStatus.projected, githubStatus.projected);
  const maxPct = Math.max(netlifyStatus.statusPct, githubStatus.statusPct);

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

  if (shouldSkipReport(mergedCount, maxActual, maxProjected)) {
    console.log(
      `Skipping report: no PRs merged and usage normal (actual ${maxActual}%, projected ${maxProjected}%)`
    );
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
    const { title, body } = formatCriticalIssue(netlifyStatus, githubStatus);
    await openIssue(title, body);
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
