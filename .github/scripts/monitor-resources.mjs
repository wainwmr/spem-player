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
import { realpathSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { renderBurndown } from "./render-burndown.mjs";

const NETLIFY_API = "https://api.netlify.com/api/v1";
const TELEGRAM_API = "https://api.telegram.org/bot";
const WATCH_THRESHOLD_PCT = 50;
const SERIES_FILE = ".github/monitor-series.json";

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
 * Classify a projected end-of-period percentage against the critical-pace
 * diagonal (100% at period-end). Distinct from the watch/throttle/critical
 * budget thresholds.
 *
 * @param {number} projectedPct - Projected end-of-period usage percentage.
 * @returns {"green"|"yellow"|"red"}
 */
export function paceBucket(projectedPct) {
  if (projectedPct > 100) return "red";
  if (projectedPct >= 90) return "yellow";
  return "green";
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
 * @property {"logged"|"backfill"} source - Provenance of the entry.
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
 * Emoji for a pace bucket.
 *
 * @param {"green"|"yellow"|"red"} bucket
 * @returns {string}
 */
function paceBucketEmoji(bucket) {
  if (bucket === "red") return "🔴";
  if (bucket === "yellow") return "🟡";
  return "🟢";
}

/**
 * Build the Telegram image caption. Shows the date, a colour indicator per
 * service based on its projected pace, and the PR merge count.
 *
 * @param {string} date - ISO date (YYYY-MM-DD), displayed as "DD Mon".
 * @param {{pct: number, projected: number, statusPct: number}} githubStatus
 * @param {{pct: number, projected: number, statusPct: number}} netlifyStatus
 * @param {number} mergedCount
 * @returns {string}
 */
export function formatCaption(
  date,
  githubStatus,
  netlifyStatus,
  mergedCount
) {
  const d = new Date(date);
  const day = `${d.getUTCDate()} ${d.toLocaleString("en-GB", {
    month: "short",
    timeZone: "UTC",
  })}`;
  const githubEmoji = paceBucketEmoji(paceBucket(githubStatus.projected));
  const netlifyEmoji = paceBucketEmoji(paceBucket(netlifyStatus.projected));
  const noun = mergedCount === 1 ? "PR" : "PRs";
  return `${day}: ${githubEmoji} GitHub ${githubStatus.pct}% | ${netlifyEmoji} Netlify ${netlifyStatus.pct}% | ${mergedCount} ${noun} merged`;
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
async function getGitHubRuns() {
  const { owner, repo } = parseRepo();
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

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

async function getGitHubUsage(preFetchedRuns) {
  const now = new Date();
  const periodStartDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  )
    .toISOString()
    .slice(0, 10);
  const periodEndDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);

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

async function sendTelegram(text) {
  const url = `${TELEGRAM_API}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
  });
  if (!res.ok) throw new Error(`Telegram HTTP ${res.status}`);
}

/**
 * Post a PNG image to Telegram with a text caption. Uses multipart/form-data
 * so the Bot API receives the image as a file upload.
 *
 * @param {Buffer} pngBuffer
 * @param {string} caption
 */
async function sendTelegramPhoto(pngBuffer, caption) {
  const url = `${TELEGRAM_API}${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const form = new FormData();
  form.append("chat_id", process.env.TELEGRAM_CHAT_ID);
  form.append("caption", caption);
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
 * @returns {SeriesEntry}
 */
export function buildLoggedEntry(date, netlify, github) {
  return {
    date,
    netlifyCurrent: netlify.current,
    githubMinutes: github.current,
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
 * @returns {SeriesEntry[]}
 */
export function buildBackfillSeries(githubSeries, netlifySeries) {
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
    .map(([date, values]) => ({
      date,
      netlifyCurrent: values.netlifyCurrent ?? null,
      githubMinutes: values.githubMinutes ?? 0,
      source: "backfill",
    }))
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
  const runs = await getGitHubRuns();
  const githubUsage = await getGitHubUsage(runs);

  const githubSeries = githubRunsToDailySeries(
    runs,
    githubUsage.periodStartDate,
    githubUsage.periodEndDate
  );
  const netlifySeries = netlifyDailyMinutesToBackfill(netlifyDailyMinutes);
  const backfill = buildBackfillSeries(githubSeries, netlifySeries);

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

  try {
    const series = loadSeries();
    const entry = buildLoggedEntry(todayISO(), netlify, github);
    saveSeries(appendOrReplaceDay(series, entry));
  } catch (e) {
    // A series-file failure must not break the alert path, but it must be
    // visible in the workflow log (Vera 566-02).
    console.error(`Failed to update resource series: ${e.message}`);
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
  const caption = formatCaption(
    todayISO(),
    githubStatus,
    netlifyStatus,
    mergedCount
  );

  try {
    const series = loadSeries();
    const chart = await renderBurndown(github, netlify, series);
    await sendTelegramPhoto(chart, caption);
  } catch (e) {
    try {
      await openIssue("Monitor failure: Telegram chart error", e.message);
    } catch (alertErr) {
      console.error(
        `Failed to open issue for Telegram chart failure: ${alertErr.message}`
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
