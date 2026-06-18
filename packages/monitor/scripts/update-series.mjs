#!/usr/bin/env node
// Stage 1: fetch current Netlify/GitHub usage and PR count, then update
// .github/monitor-series.json.
//
// Usage:
//   node scripts/update-series.mjs
//
// Required env vars:
//   NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID,
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
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

const netlify = await getNetlifyUsage();
const github = await getGitHubUsage();
const mergedCount = await getMergedPRCount(getReportingSince());

const entry = buildLoggedEntry(todayISO(), netlify, github, mergedCount);
const series = loadSeries();
saveSeries(appendOrReplaceDay(series, entry));

console.log(
  `Updated ${entry.date}: GitHub ${github.current}/${github.limit} mins, Netlify ${netlify.current}/${netlify.limit} mins, ${mergedCount} PR(s)`
);
