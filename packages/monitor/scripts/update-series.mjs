#!/usr/bin/env node
// Stage 1: fetch current Netlify/GitHub usage and PR count, then update
// .github/monitor-series.json.
//
// Usage:
//   NETLIFY_AUTH_TOKEN=... NETLIFY_SITE_ID=... GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo pnpm update-series
//
// Required env vars:
//   NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID,
//   GITHUB_TOKEN, GITHUB_REPOSITORY

import {
  getNetlifyUsage,
  getGitHubUsage,
  getMergedPRCount,
  buildLoggedEntry,
  loadSeries,
  saveSeries,
  appendOrReplaceDay,
  todayISO,
  getReportingSince,
} from "../monitor-resources.mjs";

const required = [
  "NETLIFY_AUTH_TOKEN",
  "NETLIFY_SITE_ID",
  "GITHUB_TOKEN",
  "GITHUB_REPOSITORY",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`
  );
  process.exit(1);
}

if (!process.env.GITHUB_REPOSITORY?.includes("/")) {
  console.error(
    `GITHUB_REPOSITORY must be in owner/repo format, got: ${process.env.GITHUB_REPOSITORY}`
  );
  process.exit(1);
}

const netlify = await getNetlifyUsage();
const github = await getGitHubUsage();
const mergedCount = await getMergedPRCount(getReportingSince());

const entry = buildLoggedEntry(todayISO(), netlify, github, mergedCount);
const series = loadSeries();
saveSeries(appendOrReplaceDay(series, entry));

console.log(
  `Updated ${entry.date}: GitHub ${github.current}/${github.limit} mins, Netlify ${netlify.current}/${netlify.limit} mins, ${mergedCount} PR(s)`
);
