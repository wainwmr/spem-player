#!/usr/bin/env node
// Stage 3: render the burndown from the current series and post it to Telegram.
//
// Usage:
//   node scripts/notify-telegram.mjs
//
// Required env vars:
//   NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID,
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
//   GITHUB_TOKEN, GITHUB_REPOSITORY

import {
  getNetlifyUsage,
  getGitHubUsage,
  computeUsageStatus,
  statusName,
  overallStatusName,
  loadSeries,
  dayDiff,
  sendTelegramPhoto,
} from "../monitor-resources.mjs";
import { renderBurndown } from "../render-burndown.mjs";

const netlify = await getNetlifyUsage();
const github = await getGitHubUsage();

const netlifyStatus = computeUsageStatus(netlify);
const githubStatus = computeUsageStatus(github);
const statuses = {
  github: statusName(githubStatus.statusPct),
  netlify: statusName(netlifyStatus.statusPct),
  overall: overallStatusName(
    statusName(netlifyStatus.statusPct),
    statusName(githubStatus.statusPct)
  ),
};

const series = loadSeries();
const prCounts = series
  .filter((entry) => (entry.mergedPRs ?? 0) > 0)
  .map((entry) => ({
    dayIndex: dayDiff(github.periodStartDate, entry.date),
    count: entry.mergedPRs,
  }));

const png = await renderBurndown(
  github,
  netlify,
  series,
  new Date(),
  prCounts,
  statuses
);

const caption =
  `GitHub ${github.current}/${github.limit} mins (${githubStatus.pct}%), ` +
  `Netlify ${netlify.current}/${netlify.limit} mins (${netlifyStatus.pct}%) — ${statuses.overall}`;

await sendTelegramPhoto(png, caption);
console.log(`Posted Telegram notification: ${caption}`);
