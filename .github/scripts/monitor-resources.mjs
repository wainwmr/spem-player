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
 * Environment variables (all required):
 *   NETLIFY_AUTH_TOKEN
 *   NETLIFY_SITE_ID
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *   GITHUB_TOKEN
 *   GITHUB_REPOSITORY  (owner/repo format)
 */

const NETLIFY_API = "https://api.netlify.com/api/v1";
const TELEGRAM_API = "https://api.telegram.org/bot";

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

async function getGitHubUsage() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

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
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body }),
  });
  if (!res.ok) throw new Error(`Issues API HTTP ${res.status}`);
}

async function main() {
  let netlify, github;

  try {
    netlify = await getNetlifyUsage();
  } catch (e) {
    await sendTelegram(`🚨 Monitor: Netlify API failed — ${e.message}`);
    await openIssue("Monitor failure: Netlify API error", e.message);
    throw e;
  }

  try {
    github = await getGitHubUsage();
  } catch (e) {
    await sendTelegram(`🚨 Monitor: GitHub API failed — ${e.message}`);
    await openIssue("Monitor failure: GitHub API error", e.message);
    throw e;
  }

  const netlifyPct = netlify.limit > 0 ? Math.round((netlify.current / netlify.limit) * 100) : 0;
  const githubPct = github.limit > 0 ? Math.round((github.current / github.limit) * 100) : 0;
  const maxPct = Math.max(netlifyPct, githubPct);

  let emoji = "🟢";
  let status = "normal";
  if (maxPct >= 90) { emoji = "🚨"; status = "STOP"; }
  else if (maxPct >= 75) { emoji = "🔴"; status = "throttle"; }
  else if (maxPct >= 50) { emoji = "🟡"; status = "watch"; }

  const message = `${emoji} Netlify ${netlifyPct}% · GitHub ${githubPct}% — ${status}`;

  try {
    await sendTelegram(message);
  } catch (e) {
    await openIssue("Monitor failure: Telegram API error", e.message);
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

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
