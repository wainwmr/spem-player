#!/usr/bin/env node
// Local, offline renderer for the resource burndown graphic.
//
// Usage:
//   node scripts/draw-burndown.mjs
//   node scripts/draw-burndown.mjs --data packages/monitor/fixtures/fast.json
//   node scripts/draw-burndown.mjs --data packages/monitor/fixtures/full.json --thresholds 75-82-90
//
// Edit the hardcoded usage values below to experiment with different states.

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { renderCombinedBurndown, dayDiff } from "../render-burndown.mjs";
import {
  computeUsageStatus,
  statusName,
  overallStatusName,
  DEFAULT_THRESHOLDS,
} from "../monitor-resources.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..");

const thresholds = parseThresholds(process.argv.slice(2));

/**
 * Parse an optional "--thresholds watch-throttle-critical" argument.
 * Falls back to the production defaults on missing or malformed input.
 *
 * @param {string[]} args
 * @returns {{watch: number, throttle: number, critical: number}}
 */
function parseThresholds(args) {
  const idx = args.findIndex((a) => a === "--thresholds");
  if (idx === -1) return DEFAULT_THRESHOLDS;
  const value = args[idx + 1];
  if (!value) return DEFAULT_THRESHOLDS;
  const parts = value.split("-").map((s) => Number.parseInt(s, 10));
  if (
    parts.length !== 3 ||
    parts.some(Number.isNaN) ||
    !(parts[0] < parts[1] && parts[1] < parts[2])
  ) {
    console.warn(
      `Invalid --thresholds "${value}". Expected watch-throttle-critical (e.g. 75-82-90). Using defaults.`
    );
    return DEFAULT_THRESHOLDS;
  }
  // When thresholds are overridden, projection-driven STOP should actually
  // reach STOP so the signals visibly follow the supplied thresholds.
  return { watch: parts[0], throttle: parts[1], critical: parts[2], projectionCap: parts[2] };
}

const dataPath = parseDataPath(process.argv.slice(2));

const series = JSON.parse(readFileSync(dataPath, "utf8"));

/**
 * Parse an optional "--data <path>" argument.
 * Relative paths are resolved from the repository root so fixtures can be
 * referenced as `packages/monitor/fixtures/<name>.json`.
 *
 * @param {string[]} args
 * @returns {string}
 */
function parseDataPath(args) {
  const idx = args.findIndex((a) => a === "--data");
  if (idx === -1) {
    return resolve(repoRoot, ".github/monitor-series.json");
  }
  const value = args[idx + 1];
  if (!value) {
    console.error("Missing value for --data; using real series file.");
    return resolve(repoRoot, ".github/monitor-series.json");
  }
  return resolve(repoRoot, value);
}

const todayISO = new Date().toISOString().slice(0, 10);

// Seed current usage from the latest series entry on or before today so the
// plotted line and the current dot stay aligned. (If the JSON contains a
// future backfill/log entry, buildPoints() drops it, so using the absolute
// last entry would place the dot one day ahead of the line.)
const latest =
  series.findLast((entry) => entry.date <= todayISO) ??
  series[series.length - 1] ??
  {};

// Experiment with these values. `current` is seeded from the latest series
// entry so the plotted line and the current dot align; edit it to explore
// hypothetical states, but keep it >= the latest logged value to avoid a
// downward jump at the end of the line.
const github = {
  current: latest.githubMinutes ?? 500,
  limit: 2000,
  periodStartDate: "2026-06-01",
  periodEndDate: "2026-06-30",
};

const netlify = {
  current: latest.netlifyCurrent ?? 100,
  limit: 300,
  periodStartDate: "2026-06-01",
  periodEndDate: "2026-06-30",
};

const prCounts = series
  .filter(
    (entry) =>
      (entry.mergedPRs ?? 0) > 0 && entry.date <= todayISO
  )
  .map((entry) => ({
    dayIndex: dayDiff(github.periodStartDate, entry.date),
    count: entry.mergedPRs,
  }));

// Render the chart as-of the latest data point. This keeps the current dot
// and the line endpoint on the same day; otherwise the dot sits at the real
// "today" while the line only reaches the last logged day.
const now = latest.date ? new Date(latest.date) : new Date();

const githubStatusName = statusName(
  computeUsageStatus(github, now, thresholds).statusPct,
  thresholds
);
const netlifyStatusName = statusName(
  computeUsageStatus(netlify, now, thresholds).statusPct,
  thresholds
);
const overall = overallStatusName(netlifyStatusName, githubStatusName);

const png = await renderCombinedBurndown(github, netlify, series, now, prCounts, {
  github: githubStatusName,
  netlify: netlifyStatusName,
  overall,
});

const outPath = resolve(repoRoot, "temp/burndown.png");
writeFileSync(outPath, png);
console.log(`wrote ${outPath}`);

function fmtProjected(usage, now) {
  const { pct, projected } = computeUsageStatus(usage, now, thresholds);
  const projectedMins = Math.round((projected / 100) * usage.limit);
  return `${usage.current}/${usage.limit} mins (${pct}%), projected ${projectedMins}/${usage.limit} mins (${projected}%)`;
}

console.log(`GitHub:  ${fmtProjected(github, now)} — ${githubStatusName}`);
console.log(`Netlify: ${fmtProjected(netlify, now)} — ${netlifyStatusName}`);
console.log(`Overall: ${overall}`);
