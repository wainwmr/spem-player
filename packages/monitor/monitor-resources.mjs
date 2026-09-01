#!/usr/bin/env node
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Daily build-resource monitor.
 *
 * Queries Netlify and GitHub APIs for current-period build-minute usage,
 * posts a one-line summary to Telegram, and opens a critical issue when a
 * service's status reaches `stop`.
 *
 * Status is rate-relative (#724): actual remaining budget is classified against
 * the sustainable-remaining curve R(t) = (1 - t)^alpha for the elapsed fraction
 * of the period, yielding good / watch / throttle / stop. A curve-driven `stop`
 * is capped to `throttle` unless actual usage already breaches the critical
 * threshold (90%), so an early-period burst cannot open a critical issue on a
 * projection alone (#553 guard). The Telegram message is skipped on days with no
 * PR merges when both actual and projected usage are below the 75% watch
 * threshold; watch and worse always send regardless of PR activity.
 *
 * Run with `--refresh` for the lightweight merge-time path (#699): it refreshes
 * today's series entry from the live APIs without rendering, Telegram, or
 * critical-issue logic, so the throttle gate reads up-to-date usage intra-day.
 * It needs only the Netlify and GitHub credentials, not the Telegram ones.
 *
 * Environment variables (all required for the daily run):
 *   NETLIFY_AUTH_TOKEN
 *   NETLIFY_SITE_ID
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *   GITHUB_TOKEN
 *   GITHUB_REPOSITORY  (owner/repo format)
 */

import { fileURLToPath } from "url";
import { realpathSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { renderBurndown, dayDiff } from "./render-burndown.mjs";
// Rate-relative throttle alphas (#724) live in their own module so the status
// logic and the chart renderer share one source of truth (see constants.mjs).
import { WATCH_ALPHA, THROTTLE_ALPHA, STOP_ALPHA } from "./constants.mjs";

const NETLIFY_API = "https://api.netlify.com/api/v1";
const TELEGRAM_API = "https://api.telegram.org/bot";
const WATCH_THRESHOLD_PCT = 75;
const CRITICAL_THRESHOLD_PCT = 90;
const SERIES_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
  ".github/monitor-series.json"
);

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
 * The sustainable-remaining curve R(t) = (1 - t)^alpha (#724): the fraction of
 * budget a service may still hold at elapsed-fraction `t`, where remaining falls
 * as the `alpha`-power of the remaining time. `alpha = 1` is the linear
 * burn-to-zero pace; `alpha < 1` keeps more in reserve early and defers spending
 * to period end (less early, more late); `alpha > 1` front-loads. Clamped
 * outside the open interval — full budget at or before the start (`t <= 0`),
 * none at or after the end (`t >= 1`) — so an out-of-range `t` (a reference date
 * past period end) is handled rather than extrapolated.
 *
 * @param {number} t - Elapsed fraction of the billing period; clamped outside [0, 1].
 * @param {number} alpha - Pace exponent; higher burns faster.
 * @returns {number} Remaining-budget fraction on the curve (0-1).
 */
export function curveRemaining(t, alpha) {
  if (t <= 0) return 1;
  if (t >= 1) return 0;
  return Math.pow(1 - t, alpha);
}

/**
 * Classify a service's actual remaining-budget fraction against the family of
 * pace curves at elapsed-fraction `t` (#724). The cascade checks the
 * most-severe (lowest) curve first; a lower alpha sits higher, so the bands
 * nest watch > throttle > stop in remaining. This nesting relies on
 * WATCH_ALPHA < THROTTLE_ALPHA < STOP_ALPHA (derived from THROTTLE_ALPHA in
 * constants.mjs, so it holds by construction).
 *
 * @param {number} actualRemaining - Remaining-budget fraction; may be negative
 *   when usage exceeds 100% (handled by the `<=` comparisons).
 * @param {number} t - Elapsed fraction of the billing period; clamped in curveRemaining.
 * @returns {"good"|"watch"|"throttle"|"stop"}
 */
export function statusFromCurve(actualRemaining, t) {
  if (actualRemaining <= curveRemaining(t, STOP_ALPHA)) return "stop";
  if (actualRemaining <= curveRemaining(t, THROTTLE_ALPHA)) return "throttle";
  if (actualRemaining <= curveRemaining(t, WATCH_ALPHA)) return "watch";
  return "good";
}

/**
 * @typedef {object} UsageRecord
 * @property {number} current - Consumed build minutes so far this period.
 * @property {number} limit - Build-minute quota for the period.
 * @property {string} periodStartDate - Billing period start (YYYY-MM-DD).
 * @property {string} periodEndDate - Billing period end (YYYY-MM-DD).
 */

/**
 * @typedef {object} SeriesEntry
 * @property {string} date - ISO date (YYYY-MM-DD).
 * @property {number|null} netlifyCurrent - Netlify build minutes consumed so
 *   far, or `null` when the value is unknown for a backfilled day.
 * @property {number} githubMinutes - GitHub Actions minutes consumed so far.
 * @property {number} mergedPRs - Number of PRs merged on this day.
 * @property {Summary|null} summary - Pre-computed daily status snapshot, or
 *   `null` when the underlying data is insufficient.
 * @property {"logged"|"backfill"} source - Provenance of the entry.
 */

/**
 * @typedef {object} Summary
 * @property {number|null} netlifyPct - Netlify actual usage percentage.
 * @property {number|null} netlifyProjected - Netlify projected end-of-period
 *   percentage.
 * @property {"good"|"watch"|"throttle"|"stop"|null} netlifyStatus - Netlify
 *   signal status.
 * @property {number} githubPct - GitHub actual usage percentage.
 * @property {number} githubProjected - GitHub projected end-of-period
 *   percentage.
 * @property {"good"|"watch"|"throttle"|"stop"} githubStatus - GitHub signal
 *   status.
 * @property {"good"|"watch"|"throttle"|"stop"} overallStatus - Worse of the
 *   two service statuses.
 * @property {number} mergedPRs - Number of PRs merged on this day.
 */

/**
 * @typedef {object} NetlifyDailyMinutes
 * @property {string} date - ISO date (YYYY-MM-DD).
 * @property {number} minutes - Netlify build minutes used on this day.
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
 * Build the current calendar month's period from a reference date. Exposes the
 * start-of-month `Date` (for a caller needing a full ISO timestamp) and both
 * boundaries as `YYYY-MM-DD` strings (for callers needing date strings), so the
 * places that derived these share one construction instead of repeating it. The
 * end-of-month boundary is computed only to produce `periodEndDate`; it is not
 * returned as a `Date`, since no caller needs one and a midnight-on-the-last-day
 * `Date` is an easy end-of-period footgun.
 *
 * @param {Date} [now] - Reference date; defaults to `new Date()`.
 * @returns {{start: Date, periodStartDate: string, periodEndDate: string}}
 */
export function calendarMonthPeriod(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    start,
    periodStartDate: start.toISOString().slice(0, 10),
    periodEndDate: end.toISOString().slice(0, 10),
  };
}

/**
 * Compute actual percentage, the linear projection, and the named status for
 * one service from its raw usage record. Status is driven by the rate-relative
 * curve (#724): the actual remaining-budget fraction is classified against the
 * pace curves at the elapsed fraction `t`. A curve-driven `stop` is capped to
 * `throttle` unless actual usage already breaches the critical threshold, so an
 * early-period burst — where the curve bands are tightest — cannot open a
 * critical issue on a projection alone (the #553 guard, kept under #724). The
 * projection always operates on a percentage, never raw minutes (Vera 536-01).
 * `projected` no longer drives status, but it is not inert: `main` feeds it into
 * `shouldSkipReport` (gating whether the daily Telegram report is suppressed)
 * and `formatCriticalIssue` uses it for the issue wording.
 *
 * @param {UsageRecord} usage
 * @param {Date} [now] - Reference date; defaults to `new Date()`.
 * @returns {{pct: number, projected: number, status: "good"|"watch"|"throttle"|"stop"}}
 *   Actual percentage, the linear end-of-period projection (still gates report
 *   suppression and the critical-issue wording), and the named status.
 */
export function computeUsageStatus(usage, now = new Date()) {
  // Work from the unrounded percentage: rounding first would scale the rounding
  // error by period/elapsed (up to 30x on day one).
  const rawPct = usage.limit > 0 ? (usage.current / usage.limit) * 100 : 0;
  const pct = Math.round(rawPct);
  const elapsed = daysSince(usage.periodStartDate, now);
  const period = daysInPeriod(usage.periodStartDate, usage.periodEndDate);
  const projected = projectedPct(rawPct, elapsed, period);
  const curveStatus = statusFromCurve(1 - rawPct / 100, elapsed / period);
  // #553 guard: a curve-driven stop is a forward projection, so cap it to
  // throttle unless actual usage has genuinely breached the critical threshold.
  const status =
    curveStatus === "stop" && pct < CRITICAL_THRESHOLD_PCT
      ? "throttle"
      : curveStatus;
  return { pct, projected, status };
}

/**
 * Compute the overall status from two service statuses.
 *
 * @param {"good"|"watch"|"throttle"|"stop"|null} a
 * @param {"good"|"watch"|"throttle"|"stop"|null} b
 * @returns {"good"|"watch"|"throttle"|"stop"}
 */
export function overallStatusName(a, b) {
  const ranks = { good: 0, watch: 1, throttle: 2, stop: 3 };
  const aRank = a == null ? -1 : ranks[a];
  const bRank = b == null ? -1 : ranks[b];
  const worst = Math.max(aRank, bRank);
  return worst === 3 ? "stop" : worst === 2 ? "throttle" : worst === 1 ? "watch" : "good";
}

/**
 * Build a daily summary snapshot from the already-fetched usage records.
 *
 * @param {string} date - ISO date (YYYY-MM-DD).
 * @param {UsageRecord} netlify
 * @param {UsageRecord} github
 * @param {number} mergedPRs
 * @returns {Summary}
 */
export function buildSummary(date, netlify, github, mergedPRs) {
  const day = new Date(date);
  const githubStatus = computeUsageStatus(github, day);
  const netlifyStatus =
    netlify.current == null ? null : computeUsageStatus(netlify, day);
  const githubStatusName = githubStatus.status;
  const netlifyStatusName = netlifyStatus ? netlifyStatus.status : null;
  return {
    netlifyPct: netlifyStatus?.pct ?? null,
    netlifyProjected: netlifyStatus?.projected ?? null,
    netlifyStatus: netlifyStatusName,
    githubPct: githubStatus.pct,
    githubProjected: githubStatus.projected,
    githubStatus: githubStatusName,
    overallStatus: overallStatusName(netlifyStatusName, githubStatusName),
    mergedPRs,
  };
}

export async function api(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} on ${url}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getNetlifyUsage() {
  const site = await api(
    `${NETLIFY_API}/sites/${process.env.NETLIFY_SITE_ID}`,
    { headers: { Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}` } }
  );
  const status = await api(
    `${NETLIFY_API}/${site.account_slug}/builds/status`,
    { headers: { Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}` } }
  );
  const { periodStartDate: fallbackStart, periodEndDate: fallbackEnd } =
    calendarMonthPeriod();
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

export async function getMergedPRCount(since) {
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
 * records. The service is named by the one whose status is `stop` (Netlify
 * takes precedence when both are), and the wording distinguishes an actual
 * breach from a projection (Vera 536-04/536-07, #724).
 *
 * @param {{pct: number, projected: number, status: "good"|"watch"|"throttle"|"stop"}} netlifyStatus
 * @param {{pct: number, projected: number, status: "good"|"watch"|"throttle"|"stop"}} githubStatus
 * @returns {{title: string, body: string}}
 */
export function formatCriticalIssue(netlifyStatus, githubStatus) {
  const svc = netlifyStatus.status === "stop" ? "Netlify" : "GitHub";
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

/**
 * Fetch all workflow runs for the current calendar month, paginated.
 *
 * @returns {Promise<object[]>} Array of workflow run objects.
 */
export async function getGitHubRuns() {
  const { owner, repo } = parseRepo();
  const start = calendarMonthPeriod().start.toISOString();

  const runs = [];
  let page = 1;
  while (true) {
    const data = await api(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?created=>=${start}&per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } }
    );
    const pageRuns = data.workflow_runs || [];
    if (pageRuns.length === 0) break;
    runs.push(...pageRuns);
    if (pageRuns.length < 100) break;
    page++;
  }
  return runs;
}

export async function getGitHubUsage(preFetchedRuns) {
  const { periodStartDate, periodEndDate } = calendarMonthPeriod();

  const runs = preFetchedRuns ?? (await getGitHubRuns());
  let totalMs = 0;
  for (const run of runs) {
    if (run.run_duration_ms) {
      totalMs += run.run_duration_ms;
    } else if (run.run_started_at && run.updated_at) {
      const s = new Date(run.run_started_at).getTime();
      const e = new Date(run.updated_at).getTime();
      totalMs += Math.max(0, e - s);
    }
  }

  return {
    current: Math.round(totalMs / 60000),
    limit: 2000,
    periodStartDate,
    periodEndDate,
  };
}

// Re-exported from the dependency-free leaf module so packages/monitor stays the
// single home of the Telegram-send logic, while the CI failure alert (#726) can
// import the leaf directly and avoid this module's static `canvas` import (via
// render-burndown.mjs). A missing canvas prebuild would otherwise throw at module
// scope and lose the alert before it ran, which is the blind spot #726 closes.
// Imported AND re-exported, not re-exported alone: `export { x } from "..."` binds
// nothing in this module's scope, and dispatchAlert below calls sendTelegram
// directly. (The tests caught that immediately, which is the argument for them.)
import {
  formatWorkflowFailureMessage,
  sendTelegram,
} from "./telegram.mjs";
export { formatWorkflowFailureMessage, sendTelegram };

/**
 * Post a PNG image to Telegram with a text caption. Uses multipart/form-data
 * so the Bot API receives the image as a file upload.
 *
 * @param {Buffer} pngBuffer
 * @param {string} caption
 */
export async function sendTelegramPhoto(pngBuffer, caption = "") {
  const url = `${TELEGRAM_API}${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const form = new FormData();
  form.append("chat_id", process.env.TELEGRAM_CHAT_ID);
  if (caption) {
    form.append("caption", caption);
  }
  form.append(
    "photo",
    new Blob([pngBuffer], { type: "image/png" }),
    "burndown.png"
  );
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendPhoto HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
}

export async function openIssue(title, body) {
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
 * Dispatch a monitor alert: optionally send a Telegram message, then open a
 * tracking issue. The two legs are attempted independently: a failure in
 * either is logged with `onErrorLog` (tagged with the failing leg) and
 * swallowed, so a Telegram outage
 * cannot suppress the durable tracking issue (#748) and a secondary alert
 * failure never masks the caller's own in-flight error.
 *
 * @param {object} alert
 * @param {string} [alert.telegramText] - Telegram message. Omit it (or pass any
 *   falsy value) to open an issue only — used when Telegram itself is the failing
 *   service.
 * @param {string} alert.issueTitle
 * @param {string} alert.issueBody
 * @param {string} alert.onErrorLog - Prefix for the swallowed-failure log line.
 */
export async function dispatchAlert({
  telegramText,
  issueTitle,
  issueBody,
  onErrorLog,
}) {
  // Each log line tags its leg: a network-level fetch failure carries the
  // bare message "fetch failed" with no host, so without the tag the two legs
  // are indistinguishable in a CI log exactly when it matters, namely whether
  // the durable issue opened or not (Vera 748-01).
  if (telegramText) {
    try {
      await sendTelegram(telegramText);
    } catch (alertErr) {
      console.error(`${onErrorLog}: [telegram] ${alertErr.message}`);
    }
  }
  try {
    await openIssue(issueTitle, issueBody);
  } catch (alertErr) {
    console.error(`${onErrorLog}: [issue] ${alertErr.message}`);
  }
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

/**
 * Return today's date as `YYYY-MM-DD` in UTC.
 *
 * @param {Date} [now] - Reference date; defaults to `new Date()`.
 * @returns {string}
 */
export function todayISO(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * Read the daily resource series from `filePath`. Missing or empty files
 * return a fresh array; malformed JSON throws so history is never silently
 * reset (Vera 566-01).
 *
 * @param {string} [filePath] - Path to the series JSON file; defaults to
 *   `.github/monitor-series.json` relative to the repository root.
 * @returns {SeriesEntry[]}
 * @throws {Error} If the file exists, is non-empty, and is not valid JSON or
 *   is not an array.
 */
export function loadSeries(filePath = SERIES_FILE) {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    return [];
  }
  const raw = readFileSync(resolved, "utf8").trim();
  if (raw === "") {
    return [];
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`series file ${filePath} must contain a JSON array`);
  }
  return parsed;
}

/**
 * Write the daily resource series to `filePath` as formatted JSON.
 *
 * @param {SeriesEntry[]} series
 * @param {string} [filePath] - Path to the series JSON file; defaults to
 *   `.github/monitor-series.json` relative to the repository root.
 */
export function saveSeries(series, filePath = SERIES_FILE) {
  const resolved = resolve(filePath);
  writeFileSync(resolved, JSON.stringify(series, null, 2) + "\n", "utf8");
}

/**
 * Return a new series where `entry` replaces any existing entry with the
 * same date, or is appended if the date is new. The series is kept sorted
 * by date (Vera 566-01).
 *
 * @param {SeriesEntry[]} series
 * @param {SeriesEntry} entry
 * @returns {SeriesEntry[]}
 */
export function appendOrReplaceDay(series, entry) {
  const idx = series.findIndex((item) => item.date === entry.date);
  const next = idx === -1 ? [...series, entry] : series.with(idx, entry);
  return next.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Build a logged entry from the already-fetched usage records.
 *
 * @param {string} date - ISO date string (YYYY-MM-DD).
 * @param {UsageRecord} netlify
 * @param {UsageRecord} github
 * @param {number} [mergedPRs] - Number of PRs merged on this day.
 * @returns {SeriesEntry}
 */
export function buildLoggedEntry(date, netlify, github, mergedPRs = 0) {
  return {
    date,
    netlifyCurrent: netlify.current,
    githubMinutes: github.current,
    mergedPRs,
    summary: buildSummary(date, netlify, github, mergedPRs),
    source: "logged",
  };
}

/**
 * Back-calculate GitHub cumulative minutes per day from workflow runs.
 * Returns one entry per calendar day from `periodStartDate` to
 * `periodEndDate` inclusive, with `githubMinutes` being the cumulative total
 * of all runs whose `run_started_at` falls on or before that day. Days with
 * no runs carry forward the previous cumulative value so the line is
 * continuous (Vera 566-04).
 *
 * @param {object[]} runs - GitHub Actions workflow runs.
 * @param {string} runs[].run_started_at - ISO timestamp.
 * @param {number} runs[].run_duration_ms - Run duration in milliseconds.
 * @param {string} periodStartDate - ISO date (YYYY-MM-DD).
 * @param {string} periodEndDate - ISO date (YYYY-MM-DD).
 * @returns {{date: string, githubMinutes: number}[]}
 */
export function githubRunsToDailySeries(runs, periodStartDate, periodEndDate) {
  const start = new Date(periodStartDate);
  const end = new Date(periodEndDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const startUtc = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  const endUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );

  /** @type {Map<string, number>} */
  const dailyMinutes = new Map();
  for (const run of runs) {
    if (!run.run_started_at) continue;
    const date = run.run_started_at.slice(0, 10);
    const durationMs =
      run.run_duration_ms ??
      (run.updated_at
        ? Math.max(
            0,
            new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime()
          )
        : 0);
    dailyMinutes.set(
      date,
      (dailyMinutes.get(date) ?? 0) + durationMs / 60000
    );
  }

  const result = [];
  let cumulative = 0;
  for (let t = startUtc; t <= endUtc; t += msPerDay) {
    const date = new Date(t).toISOString().slice(0, 10);
    cumulative += dailyMinutes.get(date) ?? 0;
    result.push({ date, githubMinutes: Math.round(cumulative) });
  }
  return result;
}

/**
 * Convert daily Netlify build minutes into cumulative backfill series entries.
 * `netlifyCurrent` is the running total of minutes consumed up to and
 * including each date, matching the shape returned by the Netlify API
 * (Vera 566-04).
 *
 * @param {NetlifyDailyMinutes[]} dailyMinutes
 * @returns {{date: string, netlifyCurrent: number}[]}
 */
export function netlifyDailyMinutesToBackfill(dailyMinutes) {
  let cumulative = 0;
  return dailyMinutes.map(({ date, minutes }) => {
    cumulative += minutes;
    return { date, netlifyCurrent: cumulative };
  });
}

/**
 * Combine GitHub and Netlify backfill data into a single series. Dates that
 * appear in only one source keep the other value as `null` so the chart can
 * render gaps rather than invent points (Vera 566-04).
 *
 * @param {{date: string, githubMinutes: number}[]} githubSeries
 * @param {{date: string, netlifyCurrent: number}[]} netlifySeries
 * @param {UsageRecord} githubUsage - Provides limit and period dates for
 *   summary calculation.
 * @param {UsageRecord} netlifyUsage - Provides limit and period dates for
 *   summary calculation.
 * @returns {SeriesEntry[]}
 */
export function buildBackfillSeries(
  githubSeries,
  netlifySeries,
  githubUsage,
  netlifyUsage
) {
  /** @type {Map<string, {githubMinutes?: number, netlifyCurrent?: number}>} */
  const byDate = new Map();
  for (const { date, githubMinutes } of githubSeries) {
    const existing = byDate.get(date) ?? {};
    existing.githubMinutes = githubMinutes;
    byDate.set(date, existing);
  }
  for (const { date, netlifyCurrent } of netlifySeries) {
    const existing = byDate.get(date) ?? {};
    existing.netlifyCurrent = netlifyCurrent;
    byDate.set(date, existing);
  }

  return Array.from(byDate.entries())
    .map(([date, values]) => {
      const github = {
        current: values.githubMinutes ?? 0,
        limit: githubUsage.limit,
        periodStartDate: githubUsage.periodStartDate,
        periodEndDate: githubUsage.periodEndDate,
      };
      const netlify = {
        current: values.netlifyCurrent ?? null,
        limit: netlifyUsage.limit,
        periodStartDate: netlifyUsage.periodStartDate,
        periodEndDate: netlifyUsage.periodEndDate,
      };
      return {
        date,
        netlifyCurrent: values.netlifyCurrent ?? null,
        githubMinutes: values.githubMinutes ?? 0,
        mergedPRs: 0,
        summary: buildSummary(date, netlify, github, 0),
        source: "backfill",
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * One-shot backfill seed for the current billing window. Fetches current
 * usage from the APIs, back-calculates GitHub cumulative minutes per day,
 * converts the Telegram-reported Netlify percentages into approximate
 * netlifyCurrent values, and writes the result to the series file. Existing
 * logged dates are preserved; only missing dates are seeded (Vera 566-04).
 *
 * @param {NetlifyDailyMinutes[]} netlifyDailyMinutes - Dated Netlify daily minutes.
 * @param {string} [filePath] - Optional override for the series file path.
 */
export async function seedBackfillSeries(
  netlifyDailyMinutes,
  filePath = SERIES_FILE
) {
  const [runs, netlifyUsage] = await Promise.all([
    getGitHubRuns(),
    getNetlifyUsage(),
  ]);
  const githubUsage = await getGitHubUsage(runs);

  const githubSeries = githubRunsToDailySeries(
    runs,
    githubUsage.periodStartDate,
    githubUsage.periodEndDate
  );
  const netlifySeries = netlifyDailyMinutesToBackfill(netlifyDailyMinutes);
  const backfill = buildBackfillSeries(
    githubSeries,
    netlifySeries,
    githubUsage,
    netlifyUsage
  );

  const existing = loadSeries(filePath);
  const existingDates = new Set(existing.map((entry) => entry.date));
  const merged = [...existing];
  for (const entry of backfill) {
    if (!existingDates.has(entry.date)) {
      merged.push(entry);
    }
  }

  saveSeries(merged.sort((a, b) => a.date.localeCompare(b.date)), filePath);
}

export async function main(seriesFile = SERIES_FILE) {
  let netlify, github;

  try {
    netlify = await getNetlifyUsage();
  } catch (e) {
    await dispatchAlert({
      telegramText: `🚨 Monitor: Netlify API failed — ${e.message}`,
      issueTitle: "Monitor failure: Netlify API error",
      issueBody: e.message,
      onErrorLog: "Failed to send alert for Netlify failure",
    });
    throw e;
  }

  try {
    github = await getGitHubUsage();
  } catch (e) {
    await dispatchAlert({
      telegramText: `🚨 Monitor: GitHub API failed — ${e.message}`,
      issueTitle: "Monitor failure: GitHub API error",
      issueBody: e.message,
      onErrorLog: "Failed to send alert for GitHub failure",
    });
    throw e;
  }

  try {
    const series = loadSeries(seriesFile);
    const entry = buildLoggedEntry(todayISO(), netlify, github);
    saveSeries(appendOrReplaceDay(series, entry), seriesFile);
  } catch (e) {
    // A series-file failure must not break the alert path, but it must be
    // visible in the workflow log (Vera 566-02).
    console.error(`Failed to update resource series: ${e.message}`);
  }

  // mergedCount is fetched below; once known, the today's entry is updated
  // with the daily PR count so the burndown histogram can be rendered from
  // the series file alone.

  const netlifyStatus = computeUsageStatus(netlify);
  const githubStatus = computeUsageStatus(github);
  const netlifyPct = netlifyStatus.pct;
  const githubPct = githubStatus.pct;
  const maxActual = Math.max(netlifyPct, githubPct);
  const maxProjected = Math.max(netlifyStatus.projected, githubStatus.projected);
  const netlifyStatusName = netlifyStatus.status;
  const githubStatusName = githubStatus.status;
  const overallStatus = overallStatusName(netlifyStatusName, githubStatusName);

  const since = getReportingSince();
  let mergedCount;
  try {
    mergedCount = await getMergedPRCount(since);
  } catch (e) {
    await dispatchAlert({
      telegramText: `🚨 Monitor: PR search API failed — ${e.message}`,
      issueTitle: "Monitor failure: PR search API error",
      issueBody: e.message,
      onErrorLog: "Failed to send alert for PR search failure",
    });
    throw e;
  }

  if (shouldSkipReport(mergedCount, maxActual, maxProjected)) {
    console.log(
      `Skipping report: no PRs merged and usage normal (actual ${maxActual}%, projected ${maxProjected}%)`
    );
    return;
  }

  try {
    const series = loadSeries(seriesFile);
    const todayEntry = series.find((entry) => entry.date === todayISO());
    if (todayEntry) {
      const updated = {
        ...todayEntry,
        mergedPRs: mergedCount,
        summary: { ...todayEntry.summary, mergedPRs: mergedCount },
      };
      saveSeries(appendOrReplaceDay(series, updated), seriesFile);
    }
  } catch (e) {
    console.error(`Failed to update PR count in series: ${e.message}`);
  }

  try {
    const series = loadSeries(seriesFile);
    const prCounts = series
      .filter((entry) => (entry.mergedPRs ?? 0) > 0)
      .map((entry) => ({
        dayIndex: dayDiff(github.periodStartDate, entry.date),
        count: entry.mergedPRs,
      }));
    const chart = await renderBurndown(
      github,
      netlify,
      series,
      new Date(),
      prCounts,
      { github: githubStatusName, netlify: netlifyStatusName, overall: overallStatus }
    );
    await sendTelegramPhoto(chart);
  } catch (e) {
    await dispatchAlert({
      issueTitle: "Monitor failure: Telegram chart error",
      issueBody: e.message,
      onErrorLog: "Failed to open issue for Telegram chart failure",
    });
    throw e;
  }

  if (overallStatus === "stop") {
    const { title, body } = formatCriticalIssue(netlifyStatus, githubStatus);
    await openIssue(title, body);
  }

  console.log(`monitor-resources: ${overallStatus} (Netlify ${netlifyPct}%, GitHub ${githubPct}%)`);
}

/**
 * Merge-time refresh of today's series entry (#699).
 *
 * Fetches current Netlify and GitHub usage, rebuilds today's summary, and
 * upserts it into the series file — and nothing else. Unlike `main` it sends no
 * Telegram message, renders no chart, opens no critical issue, and does not
 * re-fetch the merged-PR count (it leaves `mergedPRs` at 0; the daily run sets
 * the real count later, but only when it does not skip the report — see
 * `shouldSkipReport`). Its single purpose is to keep the committed
 * `overallStatus` fresh so the throttle gate reacts intra-day.
 *
 * Usage is fetched before the series is touched, so an API failure rejects
 * without writing the file. Alerts are deliberately not dispatched on failure;
 * the daily run owns alerting.
 *
 * @param {string} [seriesFile] - Series file path; defaults to `SERIES_FILE`.
 * @returns {Promise<"good"|"watch"|"throttle"|"stop">} The new overall status.
 */
export async function refresh(seriesFile = SERIES_FILE) {
  const netlify = await getNetlifyUsage();
  const github = await getGitHubUsage();
  const series = loadSeries(seriesFile);
  const entry = buildLoggedEntry(todayISO(), netlify, github);
  saveSeries(appendOrReplaceDay(series, entry), seriesFile);
  // overallStatusName never returns null and buildLoggedEntry always populates
  // summary, so overallStatus is one of the four status strings, never null.
  const overallStatus = entry.summary.overallStatus;
  console.log(`monitor-resources: refreshed ${overallStatus}`);
  return overallStatus;
}

/**
 * Select the CLI entrypoint from argv. `--refresh` runs the lightweight
 * merge-time refresh; anything else runs the full daily monitor.
 *
 * @param {string[]} argv - Process argv (or any string array).
 * @returns {"refresh"|"main"} Any argv lacking `--refresh` (including unknown
 *   flags) routes to `main`.
 */
export function selectCommand(argv) {
  return argv.includes("--refresh") ? "refresh" : "main";
}

// Only run a command when invoked directly, not when imported by tests.
// realpathSync on both sides resolves symlinks so the comparison holds
// when Node is launched via a symlinked path (macOS / nvm common case).
const __filename = fileURLToPath(import.meta.url);
const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === realpathSync(__filename);
if (isMain) {
  const run = selectCommand(process.argv) === "refresh" ? refresh : main;
  run().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
