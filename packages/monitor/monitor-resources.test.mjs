import { test, after, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  projectedPct,
  computeUsageStatus,
  formatCriticalIssue,
  validatePeriod,
  daysSince,
  daysInPeriod,
  shouldSkipReport,
  getReportingSince,
  parseRepo,
  todayISO,
  paceBucket,
  statusName,
  overallStatusName,
  loadSeries,
  saveSeries,
  appendOrReplaceDay,
  buildLoggedEntry,
  buildSummary,
  githubRunsToDailySeries,
  netlifyDailyMinutesToBackfill,
  buildBackfillSeries,
  calendarMonthPeriod,
  dispatchAlert,
  api,
  getNetlifyUsage,
  getGitHubRuns,
  getGitHubUsage,
  getMergedPRCount,
  sendTelegram,
  sendTelegramPhoto,
  openIssue,
  main,
} from "./monitor-resources.mjs";

// projectedPct: linear burn-rate projection
test("projectedPct projects 45% on day 3 to 450%", () => {
  assert.equal(projectedPct(45, 3, 30), 450);
});

test("projectedPct projects 50% on day 15 to 100%", () => {
  assert.equal(projectedPct(50, 15, 30), 100);
});

test("projectedPct projects 50% on day 30 to 50%", () => {
  assert.equal(projectedPct(50, 30, 30), 50);
});

test("projectedPct returns 0 for zero usage", () => {
  assert.equal(projectedPct(0, 1, 30), 0);
});

test("projectedPct clamps daysElapsed to 1", () => {
  assert.equal(projectedPct(10, 0, 30), 300);
});

// computeUsageStatus: binds the projection to API-shaped raw values — the
// regression net for the units bug (Vera 536-01): the helper must divide by
// the limit before projecting, never project raw minutes.
test("computeUsageStatus projects percentages, not minutes (Vera 536-01)", () => {
  const usage = {
    current: 60,
    limit: 300,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const now = new Date("2026-06-15T12:00:00Z");
  assert.deepEqual(computeUsageStatus(usage, now), {
    pct: 20,
    projected: 40,
    statusPct: 40,
  });
});

test("computeUsageStatus on-budget usage is capped at throttle", () => {
  const usage = {
    current: 150,
    limit: 300,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const now = new Date("2026-06-15T12:00:00Z");
  assert.deepEqual(computeUsageStatus(usage, now), {
    pct: 50,
    projected: 100,
    statusPct: 82,
  });
});

test("computeUsageStatus converges on the period's last day", () => {
  const usage = {
    current: 210,
    limit: 300,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const now = new Date("2026-06-30T12:00:00Z");
  const result = computeUsageStatus(usage, now);
  assert.equal(result.projected, result.pct);
});

test("computeUsageStatus day-one spike is capped at throttle (#553)", () => {
  const usage = {
    current: 20,
    limit: 300,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const now = new Date("2026-06-01T12:00:00Z");
  const result = computeUsageStatus(usage, now);
  assert.equal(result.pct, 7);
  assert.equal(result.projected, 200);
  assert.equal(result.statusPct, 82);
});

// Projection-damping policy (#553): projection-driven STOP is capped at
// throttle unless actual usage already breaches the critical threshold.
test("computeUsageStatus caps day-1 spike at throttle", () => {
  const usage = {
    current: 30,
    limit: 100,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const result = computeUsageStatus(usage, new Date("2026-06-01T12:00:00Z"));
  assert.equal(result.pct, 30);
  assert.equal(result.projected, 900);
  assert.equal(result.statusPct, 82);
});

test("computeUsageStatus actual breach overrides projection cap", () => {
  const usage = {
    current: 92,
    limit: 100,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const result = computeUsageStatus(usage, new Date("2026-06-01T12:00:00Z"));
  assert.equal(result.pct, 92);
  assert.equal(result.projected, 2760);
  assert.equal(result.statusPct, 92);
});

test("computeUsageStatus caps mid-period projection at throttle", () => {
  const usage = {
    current: 100,
    limit: 200,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const result = computeUsageStatus(usage, new Date("2026-06-15T12:00:00Z"));
  assert.equal(result.pct, 50);
  assert.equal(result.projected, 100);
  assert.equal(result.statusPct, 82);
});

test("computeUsageStatus leaves late-period normal usage unchanged", () => {
  const usage = {
    current: 170,
    limit: 200,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const result = computeUsageStatus(usage, new Date("2026-06-29T12:00:00Z"));
  assert.equal(result.pct, 85);
  assert.equal(result.projected, 88);
  assert.equal(result.statusPct, 88);
});

test("computeUsageStatus caps projection at the 90% boundary", () => {
  const usage = {
    current: 89,
    limit: 100,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const result = computeUsageStatus(usage, new Date("2026-06-01T12:00:00Z"));
  assert.equal(result.pct, 89);
  assert.equal(result.projected, 2670);
  assert.equal(result.statusPct, 82);
});

test("computeUsageStatus zero limit yields zeros, no division error", () => {
  const usage = {
    current: 10,
    limit: 0,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const result = computeUsageStatus(usage, new Date("2026-06-10T00:00:00Z"));
  assert.deepEqual(result, { pct: 0, projected: 0, statusPct: 0 });
});

// formatCriticalIssue: binds the critical-issue attribution and wording —
// the service is named by the quantity that drove the STOP (statusPct), and
// the title distinguishes an actual breach from a projection (Vera 536-07).
test("formatCriticalIssue names the actual-breach service with at-N% wording", () => {
  const { title, body } = formatCriticalIssue(
    { pct: 92, projected: 95, statusPct: 95 },
    { pct: 10, projected: 12, statusPct: 12 }
  );
  assert.equal(title, "BUILD MINUTES CRITICAL: Netlify at 92%");
  assert.match(body, /Netlify build minutes at 92% of quota\./);
});

test("formatCriticalIssue names the projection-driven service with projected wording", () => {
  const { title, body } = formatCriticalIssue(
    { pct: 30, projected: 120, statusPct: 120 },
    { pct: 10, projected: 12, statusPct: 12 }
  );
  assert.equal(title, "BUILD MINUTES CRITICAL: Netlify projected 120%");
  assert.match(
    body,
    /Netlify build minutes at 30% of quota and projected to reach 120% by period end\./
  );
});

test("formatCriticalIssue attributes a GitHub-projection STOP to GitHub (Vera 536-04 regression pin)", () => {
  const { title } = formatCriticalIssue(
    { pct: 20, projected: 40, statusPct: 40 },
    { pct: 15, projected: 110, statusPct: 110 }
  );
  assert.equal(title, "BUILD MINUTES CRITICAL: GitHub projected 110%");
});

// validatePeriod: malformed billing dates must fail loudly in the getters
// (riding the existing API-failure alert path), never propagate NaN into the
// projection where every threshold comparison silently goes false
// (Vera 536-02).
test("validatePeriod accepts plain dates and returns them normalised", () => {
  assert.deepEqual(validatePeriod("2026-06-01", "2026-06-30"), {
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  });
});

test("validatePeriod normalises full ISO timestamps to YYYY-MM-DD", () => {
  assert.deepEqual(
    validatePeriod("2026-06-01T08:30:00.000Z", "2026-06-30T23:59:59Z"),
    { periodStartDate: "2026-06-01", periodEndDate: "2026-06-30" }
  );
});

test("validatePeriod throws on an unparseable start date", () => {
  assert.throws(
    () => validatePeriod("garbage", "2026-06-30"),
    /unparseable period date/
  );
});

test("validatePeriod throws when the period ends before it starts", () => {
  assert.throws(
    () => validatePeriod("2026-06-30", "2026-06-01"),
    /period ends before it starts/
  );
});

// daysSince / daysInPeriod: inclusive whole-day counts
test("daysSince returns 1 on the period's first day", () => {
  assert.equal(daysSince("2026-06-01", new Date("2026-06-01T23:00:00Z")), 1);
});

test("daysSince equals daysInPeriod on the period's last day", () => {
  const now = new Date("2026-06-30T01:00:00Z");
  assert.equal(
    daysSince("2026-06-01", now),
    daysInPeriod("2026-06-01", "2026-06-30")
  );
});

test("daysInPeriod handles February and 31-day months", () => {
  assert.equal(daysInPeriod("2026-02-01", "2026-02-28"), 28);
  assert.equal(daysInPeriod("2026-07-01", "2026-07-31"), 31);
});

// shouldSkipReport: skip only when zero PRs AND both actual and projected
// usage are below the watch threshold — main() passes the actual max and
// projected max separately; this helper is the single place they are combined.
test("shouldSkipReport skips when zero PRs and low projected usage", () => {
  assert.equal(shouldSkipReport(0, 30, 30), true);
  assert.equal(shouldSkipReport(0, 0, 0), true);
});

test("shouldSkipReport sends when zero PRs but projected watch threshold reached", () => {
  assert.equal(shouldSkipReport(0, 30, 75), false);
});

test("shouldSkipReport sends when zero PRs but projected throttle threshold reached", () => {
  assert.equal(shouldSkipReport(0, 30, 82), false);
});

test("shouldSkipReport sends when zero PRs but projected STOP threshold reached", () => {
  assert.equal(shouldSkipReport(0, 30, 90), false);
});

test("shouldSkipReport sends when actual high even if projected low", () => {
  assert.equal(shouldSkipReport(0, 80, 30), false);
});

test("shouldSkipReport sends when PRs merged regardless of usage", () => {
  assert.equal(shouldSkipReport(1, 30, 30), false);
  assert.equal(shouldSkipReport(3, 10, 10), false);
  assert.equal(shouldSkipReport(1, 95, 95), false);
});

// getReportingSince: must produce YYYY-MM-DD for GitHub Search API
test("getReportingSince returns YYYY-MM-DD format", () => {
  const since = getReportingSince(Date.UTC(2026, 5, 8, 7, 13, 8));
  assert.equal(since, "2026-06-07");
  assert.doesNotMatch(since, /T/);
  assert.doesNotMatch(since, /Z/);
});

// parseRepo: parses and validates GITHUB_REPOSITORY environment variable.
// These tests mutate the shared env var; restore it afterwards so they do not
// leak global state to later tests or depend on execution order.
const ORIG_GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
after(() => {
  if (ORIG_GITHUB_REPOSITORY === undefined) {
    delete process.env.GITHUB_REPOSITORY;
  } else {
    process.env.GITHUB_REPOSITORY = ORIG_GITHUB_REPOSITORY;
  }
});

test("parseRepo returns owner and repo for valid input", () => {
  process.env.GITHUB_REPOSITORY = "wainwmr/spem-player";
  const result = parseRepo();
  assert.equal(result.owner, "wainwmr");
  assert.equal(result.repo, "spem-player");
});

test("parseRepo throws when GITHUB_REPOSITORY is undefined", () => {
  delete process.env.GITHUB_REPOSITORY;
  assert.throws(
    () => parseRepo(),
    /GITHUB_REPOSITORY must be owner\/repo format, got: undefined/
  );
});

test("parseRepo throws when GITHUB_REPOSITORY has no slash", () => {
  process.env.GITHUB_REPOSITORY = "badvalue";
  assert.throws(
    () => parseRepo(),
    /GITHUB_REPOSITORY must be owner\/repo format, got: badvalue/
  );
});

test("parseRepo throws when GITHUB_REPOSITORY is empty string", () => {
  process.env.GITHUB_REPOSITORY = "";
  assert.throws(
    () => parseRepo(),
    /GITHUB_REPOSITORY must be owner\/repo format, got: /
  );
});

// todayISO: returns UTC calendar date
test("todayISO returns YYYY-MM-DD from a UTC timestamp", () => {
  assert.equal(todayISO(new Date("2026-06-12T14:23:00Z")), "2026-06-12");
});

// paceBucket: classify projected end-of-period percentage against critical pace
test("paceBucket returns green when well under critical pace", () => {
  assert.equal(paceBucket(0), "green");
  assert.equal(paceBucket(89), "green");
});

test("paceBucket returns yellow at or near critical pace", () => {
  assert.equal(paceBucket(90), "yellow");
  assert.equal(paceBucket(100), "yellow");
});

test("paceBucket returns red when over critical pace", () => {
  assert.equal(paceBucket(101), "red");
  assert.equal(paceBucket(150), "red");
});

// statusName: map status percentage to named signal
 test("statusName maps thresholds to the correct signal", () => {
   assert.equal(statusName(0), "good");
   assert.equal(statusName(74), "good");
   assert.equal(statusName(75), "watch");
   assert.equal(statusName(81), "watch");
   assert.equal(statusName(82), "throttle");
   assert.equal(statusName(89), "throttle");
   assert.equal(statusName(90), "stop");
   assert.equal(statusName(120), "stop");
 });

 // overallStatusName: worse of two service statuses wins
 test("overallStatusName returns the worse service status", () => {
   assert.equal(overallStatusName("good", "watch"), "watch");
   assert.equal(overallStatusName("throttle", "watch"), "throttle");
   assert.equal(overallStatusName("stop", "throttle"), "stop");
   assert.equal(overallStatusName("good", "good"), "good");
 });

 test("overallStatusName treats null as good", () => {
   assert.equal(overallStatusName(null, "watch"), "watch");
   assert.equal(overallStatusName(null, null), "good");
 });

describe("loadSeries / saveSeries", () => {
  let tmpDir;
  after(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  test("loadSeries returns empty array for missing file", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "monitor-series-"));
    const result = loadSeries(join(tmpDir, "does-not-exist.json"));
    assert.deepEqual(result, []);
  });

  test("loadSeries returns empty array for empty file", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "monitor-series-"));
    const path = join(tmpDir, "empty.json");
    writeFileSync(path, "", "utf8");
    const result = loadSeries(path);
    assert.deepEqual(result, []);
  });

  test("loadSeries throws on malformed JSON", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "monitor-series-"));
    const path = join(tmpDir, "bad.json");
    writeFileSync(path, "not json", "utf8");
    assert.throws(() => loadSeries(path), /Unexpected token/);
  });

  test("loadSeries throws on non-array JSON", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "monitor-series-"));
    const path = join(tmpDir, "object.json");
    writeFileSync(path, JSON.stringify({ foo: 1 }), "utf8");
    assert.throws(() => loadSeries(path), /must contain a JSON array/);
  });

  test("saveSeries round-trips through loadSeries", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "monitor-series-"));
    const path = join(tmpDir, "series.json");
    const series = [
      {
        date: "2026-06-10",
        netlifyCurrent: 10,
        githubMinutes: 20,
        mergedPRs: 3,
        summary: {
          netlifyPct: 3,
          netlifyProjected: 10,
          netlifyStatus: "good",
          githubPct: 1,
          githubProjected: 3,
          githubStatus: "good",
          overallStatus: "good",
          mergedPRs: 3,
        },
        source: "logged",
      },
    ];
    saveSeries(series, path);
    const loaded = loadSeries(path);
    assert.deepEqual(loaded, series);
  });
});

// appendOrReplaceDay: idempotent per date and sorted
test("appendOrReplaceDay appends a new date", () => {
  const series = [
    { date: "2026-06-10", netlifyCurrent: 10, githubMinutes: 20, mergedPRs: 1, source: "logged" },
  ];
  const entry = { date: "2026-06-11", netlifyCurrent: 15, githubMinutes: 25, mergedPRs: 2, source: "logged" };
  const result = appendOrReplaceDay(series, entry);
  assert.equal(result.length, 2);
  assert.equal(result[1].date, "2026-06-11");
});

test("appendOrReplaceDay replaces an existing date", () => {
  const series = [
    { date: "2026-06-10", netlifyCurrent: 10, githubMinutes: 20, mergedPRs: 1, source: "logged" },
  ];
  const entry = { date: "2026-06-10", netlifyCurrent: 99, githubMinutes: 99, mergedPRs: 5, source: "logged" };
  const result = appendOrReplaceDay(series, entry);
  assert.equal(result.length, 1);
  assert.equal(result[0].netlifyCurrent, 99);
  assert.equal(result[0].mergedPRs, 5);
});

test("appendOrReplaceDay keeps series sorted", () => {
  const series = [
    { date: "2026-06-12", netlifyCurrent: 12, githubMinutes: 22, mergedPRs: 1, source: "logged" },
  ];
  const entry = { date: "2026-06-10", netlifyCurrent: 10, githubMinutes: 20, mergedPRs: 1, source: "logged" };
  const result = appendOrReplaceDay(series, entry);
  assert.equal(result[0].date, "2026-06-10");
  assert.equal(result[1].date, "2026-06-12");
});

// buildSummary: pre-computes daily status snapshot
test("buildSummary computes percentages, projections and statuses", () => {
  const netlify = {
    current: 30,
    limit: 300,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const github = {
    current: 120,
    limit: 2000,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const summary = buildSummary("2026-06-12", netlify, github, 2);
  assert.equal(summary.netlifyPct, 10);
  assert.equal(summary.netlifyProjected, 25);
  assert.equal(summary.netlifyStatus, "good");
  assert.equal(summary.githubPct, 6);
  assert.equal(summary.githubProjected, 15);
  assert.equal(summary.githubStatus, "good");
  assert.equal(summary.overallStatus, "good");
  assert.equal(summary.mergedPRs, 2);
});

test("buildSummary uses null netlify values when current is missing", () => {
  const netlify = {
    current: null,
    limit: 300,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const github = {
    current: 120,
    limit: 2000,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const summary = buildSummary("2026-06-12", netlify, github, 0);
  assert.equal(summary.netlifyPct, null);
  assert.equal(summary.netlifyProjected, null);
  assert.equal(summary.netlifyStatus, null);
  assert.equal(summary.githubPct, 6);
  assert.equal(summary.githubStatus, "good");
  assert.equal(summary.overallStatus, "good");
});

// buildLoggedEntry: shapes a logged entry from usage records
test("buildLoggedEntry uses current values and source logged", () => {
  const netlify = { current: 30, limit: 300, periodStartDate: "2026-06-01", periodEndDate: "2026-06-30" };
  const github = { current: 120, limit: 2000, periodStartDate: "2026-06-01", periodEndDate: "2026-06-30" };
  const entry = buildLoggedEntry("2026-06-12", netlify, github);
  assert.equal(entry.date, "2026-06-12");
  assert.equal(entry.netlifyCurrent, 30);
  assert.equal(entry.githubMinutes, 120);
  assert.equal(entry.mergedPRs, 0);
  assert.equal(entry.source, "logged");
  assert.ok(entry.summary);
  assert.equal(entry.summary.netlifyPct, 10);
  assert.equal(entry.summary.githubPct, 6);
});

test("buildLoggedEntry includes merged PR count", () => {
  const netlify = { current: 30, limit: 300, periodStartDate: "2026-06-01", periodEndDate: "2026-06-30" };
  const github = { current: 120, limit: 2000, periodStartDate: "2026-06-01", periodEndDate: "2026-06-30" };
  const entry = buildLoggedEntry("2026-06-12", netlify, github, 4);
  assert.equal(entry.mergedPRs, 4);
  assert.equal(entry.summary.mergedPRs, 4);
});

// githubRunsToDailySeries: cumulative minutes per day
test("githubRunsToDailySeries cumulates runs per day", () => {
  const runs = [
    { run_started_at: "2026-06-01T08:00:00Z", run_duration_ms: 60000 },
    { run_started_at: "2026-06-01T09:00:00Z", run_duration_ms: 120000 },
    { run_started_at: "2026-06-03T10:00:00Z", run_duration_ms: 180000 },
  ];
  const result = githubRunsToDailySeries(runs, "2026-06-01", "2026-06-04");
  assert.deepEqual(result, [
    { date: "2026-06-01", githubMinutes: 3 },
    { date: "2026-06-02", githubMinutes: 3 },
    { date: "2026-06-03", githubMinutes: 6 },
    { date: "2026-06-04", githubMinutes: 6 },
  ]);
});

test("githubRunsToDailySeries falls back to updated_at when duration missing", () => {
  const runs = [
    {
      run_started_at: "2026-06-02T10:00:00Z",
      updated_at: "2026-06-02T10:05:30Z",
    },
  ];
  const result = githubRunsToDailySeries(runs, "2026-06-02", "2026-06-02");
  assert.deepEqual(result, [{ date: "2026-06-02", githubMinutes: 6 }]);
});

test("githubRunsToDailySeries ignores runs with missing run_started_at", () => {
  const runs = [{ run_duration_ms: 60000 }];
  const result = githubRunsToDailySeries(runs, "2026-06-01", "2026-06-01");
  assert.deepEqual(result, [{ date: "2026-06-01", githubMinutes: 0 }]);
});

// netlifyDailyMinutesToBackfill
test("netlifyDailyMinutesToBackfill cumulates daily minutes", () => {
  const dailyMinutes = [
    { date: "2026-06-12", minutes: 10 },
    { date: "2026-06-13", minutes: 23 },
    { date: "2026-06-14", minutes: 0 },
  ];
  const result = netlifyDailyMinutesToBackfill(dailyMinutes);
  assert.deepEqual(result, [
    { date: "2026-06-12", netlifyCurrent: 10 },
    { date: "2026-06-13", netlifyCurrent: 33 },
    { date: "2026-06-14", netlifyCurrent: 33 },
  ]);
});

// buildBackfillSeries: merges GitHub and Netlify backfill data
test("buildBackfillSeries combines both sources on matching dates", () => {
  const github = [
    { date: "2026-06-12", githubMinutes: 100 },
    { date: "2026-06-13", githubMinutes: 120 },
  ];
  const netlify = [
    { date: "2026-06-12", netlifyCurrent: 30 },
  ];
  const githubUsage = {
    current: 120,
    limit: 2000,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const netlifyUsage = {
    current: 30,
    limit: 300,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
  };
  const result = buildBackfillSeries(github, netlify, githubUsage, netlifyUsage);
  assert.equal(result.length, 2);
  assert.equal(result[0].date, "2026-06-12");
  assert.equal(result[0].netlifyCurrent, 30);
  assert.equal(result[0].githubMinutes, 100);
  assert.equal(result[0].mergedPRs, 0);
  assert.equal(result[0].source, "backfill");
  assert.ok(result[0].summary);
  assert.equal(result[0].summary.netlifyPct, 10);
  assert.equal(result[0].summary.githubPct, 5);
  assert.equal(result[1].date, "2026-06-13");
  assert.equal(result[1].netlifyCurrent, null);
  assert.equal(result[1].summary.netlifyPct, null);
  assert.equal(result[1].summary.githubPct, 6);
});

// ===========================================================================
// #658: coverage for the network/orchestration paths and the extracted
// helpers (calendarMonthPeriod, dispatchAlert). Every fetch call is mocked,
// so these tests never touch the network or the real series file.
// ===========================================================================

const REAL_FETCH = globalThis.fetch;
const NET_ENV_KEYS = [
  "NETLIFY_SITE_ID",
  "NETLIFY_AUTH_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "GITHUB_TOKEN",
  "GITHUB_REPOSITORY",
];
const SAVED_NET_ENV = {};

function setNetEnv() {
  for (const k of NET_ENV_KEYS) SAVED_NET_ENV[k] = process.env[k];
  process.env.NETLIFY_SITE_ID = "site-123";
  process.env.NETLIFY_AUTH_TOKEN = "ntok";
  process.env.TELEGRAM_BOT_TOKEN = "btok";
  process.env.TELEGRAM_CHAT_ID = "chat-1";
  process.env.GITHUB_TOKEN = "gtok";
  process.env.GITHUB_REPOSITORY = "wainwmr/spem-player";
}

function restoreNetEnv() {
  for (const k of NET_ENV_KEYS) {
    if (SAVED_NET_ENV[k] === undefined) delete process.env[k];
    else process.env[k] = SAVED_NET_ENV[k];
  }
}

/** Build a minimal Response-like object for the fetch stub. */
function res(body, { ok = true, status = 200 } = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => (typeof body === "string" ? JSON.parse(text) : body),
    text: async () => text,
  };
}

/**
 * Install a fetch stub that dispatches by the first matching URL substring.
 * `routes` is an array of [needle, (url, opts) => Response]. Records calls.
 */
function routeFetch(routes) {
  const calls = [];
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    calls.push({ url: u, opts });
    for (const [needle, factory] of routes) {
      if (u.includes(needle)) return factory(u, opts);
    }
    throw new Error(`unexpected fetch: ${u}`);
  };
  return calls;
}

/** Set env + install the fetch stub; returns calls and a paired restore(). */
function startMock(routes) {
  setNetEnv();
  const calls = routeFetch(routes);
  return {
    calls,
    restore() {
      globalThis.fetch = REAL_FETCH;
      restoreNetEnv();
    },
  };
}

// --- calendarMonthPeriod ---------------------------------------------------

describe("calendarMonthPeriod", () => {
  test("returns the first and last day of the month for a mid-month date", () => {
    const p = calendarMonthPeriod(new Date("2026-06-15T12:00:00Z"));
    assert.equal(p.periodStartDate, "2026-06-01");
    assert.equal(p.periodEndDate, "2026-06-30");
    assert.equal(p.start.toISOString(), "2026-06-01T00:00:00.000Z");
  });

  test("handles February (28 days in 2026)", () => {
    const p = calendarMonthPeriod(new Date("2026-02-10T00:00:00Z"));
    assert.equal(p.periodStartDate, "2026-02-01");
    assert.equal(p.periodEndDate, "2026-02-28");
  });

  test("handles December without spilling the start into the next year", () => {
    const p = calendarMonthPeriod(new Date("2026-12-20T00:00:00Z"));
    assert.equal(p.periodStartDate, "2026-12-01");
    assert.equal(p.periodEndDate, "2026-12-31");
  });
});

// --- dispatchAlert ---------------------------------------------------------

describe("dispatchAlert", () => {
  test("sends Telegram then opens an issue when telegramText is given", async () => {
    const m = startMock([
      ["/sendMessage", () => res({ ok: true })],
      ["/issues", () => res({ id: 1 })],
    ]);
    try {
      await dispatchAlert({
        telegramText: "boom",
        issueTitle: "T",
        issueBody: "B",
        onErrorLog: "Failed to send alert for X",
      });
      assert.equal(m.calls.length, 2);
      assert.match(m.calls[0].url, /sendMessage/);
      assert.match(m.calls[1].url, /\/issues$/);
    } finally {
      m.restore();
    }
  });

  test("opens only an issue when telegramText is omitted", async () => {
    const m = startMock([["/issues", () => res({ id: 1 })]]);
    try {
      await dispatchAlert({
        issueTitle: "T",
        issueBody: "B",
        onErrorLog: "Failed to open issue for X",
      });
      assert.equal(m.calls.length, 1);
      assert.match(m.calls[0].url, /\/issues$/);
    } finally {
      m.restore();
    }
  });

  test("swallows a dispatch failure and logs it with the given prefix", async () => {
    const m = startMock([["/issues", () => res("nope", { ok: false, status: 500 })]]);
    const errs = [];
    const origErr = console.error;
    console.error = (msg) => errs.push(msg);
    try {
      await dispatchAlert({
        issueTitle: "T",
        issueBody: "B",
        onErrorLog: "Failed to open issue for chart",
      });
      assert.equal(errs.length, 1);
      assert.match(errs[0], /^Failed to open issue for chart: /);
    } finally {
      console.error = origErr;
      m.restore();
    }
  });
});

// --- api -------------------------------------------------------------------

describe("api", () => {
  test("returns parsed JSON on a 2xx response", async () => {
    const m = startMock([["example.test", () => res({ hello: "world" })]]);
    try {
      assert.deepEqual(await api("https://example.test/x"), { hello: "world" });
    } finally {
      m.restore();
    }
  });

  test("throws with status and body on a non-2xx response", async () => {
    const m = startMock([
      ["example.test", () => res("bad things", { ok: false, status: 503 })],
    ]);
    try {
      await assert.rejects(
        () => api("https://example.test/x"),
        /HTTP 503 on https:\/\/example\.test\/x: bad things/
      );
    } finally {
      m.restore();
    }
  });
});

// --- getNetlifyUsage -------------------------------------------------------

describe("getNetlifyUsage", () => {
  test("returns usage with the API-provided period dates", async () => {
    const m = startMock([
      ["/builds/status", () =>
        res({
          minutes: {
            current: 60,
            included_minutes_with_packs: "300",
            period_start_date: "2026-06-01",
            period_end_date: "2026-06-30",
          },
        }),
      ],
      ["/sites/", () => res({ account_slug: "acct" })],
    ]);
    try {
      const out = await getNetlifyUsage();
      assert.equal(out.current, 60);
      assert.equal(out.limit, 300);
      assert.equal(out.periodStartDate, "2026-06-01");
      assert.equal(out.periodEndDate, "2026-06-30");
    } finally {
      m.restore();
    }
  });

  test("falls back to the calendar month and warns when period dates are missing", async () => {
    const m = startMock([
      ["/builds/status", () => res({ minutes: { current: 10 } })],
      ["/sites/", () => res({ account_slug: "acct" })],
    ]);
    const warns = [];
    const origWarn = console.warn;
    console.warn = (msg) => warns.push(msg);
    try {
      const out = await getNetlifyUsage();
      const expected = calendarMonthPeriod(new Date());
      assert.equal(out.current, 10);
      assert.equal(out.limit, 300);
      assert.equal(out.periodStartDate, expected.periodStartDate);
      assert.equal(out.periodEndDate, expected.periodEndDate);
      assert.equal(warns.length, 1);
    } finally {
      console.warn = origWarn;
      m.restore();
    }
  });
});

// --- getGitHubRuns ---------------------------------------------------------

describe("getGitHubRuns", () => {
  test("collects workflow runs across pages until a short page ends it", async () => {
    const page1 = { workflow_runs: Array.from({ length: 100 }, (_, i) => ({ id: i })) };
    const page2 = { workflow_runs: [{ id: 100 }] };
    const m = startMock([
      ["page=2", () => res(page2)],
      ["/actions/runs", () => res(page1)],
    ]);
    try {
      const runs = await getGitHubRuns();
      assert.equal(runs.length, 101);
      assert.ok(m.calls.some((c) => c.url.includes("page=2")));
    } finally {
      m.restore();
    }
  });
});

// --- getGitHubUsage --------------------------------------------------------

describe("getGitHubUsage", () => {
  test("sums run durations into minutes against the 2000-minute limit", async () => {
    const runs = [
      { run_duration_ms: 600000 },
      { run_started_at: "2026-06-02T10:00:00Z", updated_at: "2026-06-02T10:05:00Z" },
    ];
    const out = await getGitHubUsage(runs);
    const expected = calendarMonthPeriod(new Date());
    assert.equal(out.current, 15);
    assert.equal(out.limit, 2000);
    assert.equal(out.periodStartDate, expected.periodStartDate);
    assert.equal(out.periodEndDate, expected.periodEndDate);
  });

  test("fetches runs itself when none are pre-supplied", async () => {
    const m = startMock([
      ["/actions/runs", () => res({ workflow_runs: [{ run_duration_ms: 120000 }] })],
    ]);
    try {
      const out = await getGitHubUsage();
      assert.equal(out.current, 2);
    } finally {
      m.restore();
    }
  });
});

// --- getMergedPRCount ------------------------------------------------------

describe("getMergedPRCount", () => {
  test("returns total_count from the search API", async () => {
    const m = startMock([["/search/issues", () => res({ total_count: 4 })]]);
    try {
      assert.equal(await getMergedPRCount("2026-06-10"), 4);
    } finally {
      m.restore();
    }
  });

  test("throws on a non-integer total_count", async () => {
    const m = startMock([["/search/issues", () => res({ total_count: "many" })]]);
    try {
      await assert.rejects(
        () => getMergedPRCount("2026-06-10"),
        /unexpected total_count/
      );
    } finally {
      m.restore();
    }
  });
});

// --- sendTelegram / sendTelegramPhoto / openIssue --------------------------

describe("Telegram and issue posting", () => {
  test("sendTelegram posts the chat id and text on ok", async () => {
    const m = startMock([["/sendMessage", () => res({ ok: true })]]);
    try {
      await sendTelegram("hi");
      assert.equal(m.calls.length, 1);
      const sent = JSON.parse(m.calls[0].opts.body);
      assert.equal(sent.text, "hi");
      assert.equal(sent.chat_id, "chat-1");
    } finally {
      m.restore();
    }
  });

  test("sendTelegram throws on a non-ok response", async () => {
    const m = startMock([["/sendMessage", () => res("", { ok: false, status: 400 })]]);
    try {
      await assert.rejects(() => sendTelegram("hi"), /Telegram HTTP 400/);
    } finally {
      m.restore();
    }
  });

  test("sendTelegramPhoto uploads a PNG buffer as multipart form data", async () => {
    const m = startMock([["/sendPhoto", () => res({ ok: true })]]);
    try {
      await sendTelegramPhoto(Buffer.from([1, 2, 3]), "caption");
      assert.equal(m.calls.length, 1);
      assert.equal(m.calls[0].opts.method, "POST");
      assert.ok(m.calls[0].opts.body instanceof FormData);
    } finally {
      m.restore();
    }
  });

  test("sendTelegramPhoto throws on a non-ok response", async () => {
    const m = startMock([["/sendPhoto", () => res("err", { ok: false, status: 500 })]]);
    try {
      await assert.rejects(
        () => sendTelegramPhoto(Buffer.from([1]), ""),
        /sendPhoto HTTP 500/
      );
    } finally {
      m.restore();
    }
  });

  test("openIssue posts title and body on ok", async () => {
    const m = startMock([["/issues", () => res({ id: 1 })]]);
    try {
      await openIssue("Title", "Body");
      assert.equal(m.calls.length, 1);
      const sent = JSON.parse(m.calls[0].opts.body);
      assert.equal(sent.title, "Title");
      assert.equal(sent.body, "Body");
    } finally {
      m.restore();
    }
  });

  test("openIssue throws on a non-ok response", async () => {
    const m = startMock([["/issues", () => res("", { ok: false, status: 422 })]]);
    try {
      await assert.rejects(() => openIssue("T", "B"), /Issues API HTTP 422/);
    } finally {
      m.restore();
    }
  });
});

// --- main ------------------------------------------------------------------

// These tests are clock-independent by construction, even though `main` reads
// the real clock internally (todayISO/getReportingSince): the skip case forces
// `current: 0` and `total_count: 0`, so usage is 0 regardless of the date, and
// the stop case pins `run_duration_ms` to 95% of the budget, which is stop-level
// on any date. Keep that property if you raise the fixture numbers, or inject a
// fixed reference date instead.
describe("main", () => {
  test("skips the report when no PRs merged and usage is zero", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "monitor-main-"));
    const seriesFile = join(tmp, "series.json");
    const logs = [];
    const origLog = console.log;
    console.log = (msg) => logs.push(msg);
    const m = startMock([
      ["/sites/", () => res({ account_slug: "acct" })],
      ["/builds/status", () =>
        res({
          minutes: {
            current: 0,
            included_minutes_with_packs: "300",
            period_start_date: "2026-06-01",
            period_end_date: "2026-06-30",
          },
        }),
      ],
      ["/actions/runs", () => res({ workflow_runs: [] })],
      ["/search/issues", () => res({ total_count: 0 })],
    ]);
    try {
      await main(seriesFile);
      assert.ok(logs.some((msg) => /Skipping report/.test(msg)));
    } finally {
      console.log = origLog;
      m.restore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("dispatches an alert and rethrows when the Netlify API fails", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "monitor-main-"));
    const seriesFile = join(tmp, "series.json");
    const m = startMock([
      ["/sendMessage", () => res({ ok: true })],
      ["/issues", () => res({ id: 1 })],
      ["/sites/", () => res("netlify down", { ok: false, status: 500 })],
    ]);
    try {
      await assert.rejects(() => main(seriesFile), /HTTP 500/);
      assert.ok(m.calls.some((c) => /sendMessage/.test(c.url)));
      assert.ok(m.calls.some((c) => /\/issues$/.test(c.url)));
    } finally {
      m.restore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("renders a report and opens a critical issue at stop-level usage", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "monitor-main-"));
    const seriesFile = join(tmp, "series.json");
    const logs = [];
    const origLog = console.log;
    console.log = (msg) => logs.push(msg);
    const m = startMock([
      ["/sites/", () => res({ account_slug: "acct" })],
      ["/builds/status", () =>
        res({
          minutes: {
            current: 10,
            included_minutes_with_packs: "300",
            period_start_date: "2026-06-01",
            period_end_date: "2026-06-30",
          },
        }),
      ],
      ["/actions/runs", () => res({ workflow_runs: [{ run_duration_ms: 114000000 }] })],
      ["/search/issues", () => res({ total_count: 2 })],
      ["/sendPhoto", () => res({ ok: true })],
      ["/issues", () => res({ id: 1 })],
    ]);
    try {
      await main(seriesFile);
      assert.ok(m.calls.some((c) => /sendPhoto/.test(c.url)));
      assert.ok(m.calls.some((c) => /\/issues$/.test(c.url)));
      assert.ok(logs.some((msg) => /stop/.test(msg)));
    } finally {
      console.log = origLog;
      m.restore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("a series-write failure does not break the run (Vera 566-02)", async () => {
    // seriesFile sits under a directory that does not exist: loadSeries reads an
    // absent file (-> []), but saveSeries throws on write. The 566-02 invariant
    // is that main() logs the failure and still completes the run rather than
    // propagating it. Pins that behaviour so a future change cannot regress it.
    const tmp = mkdtempSync(join(tmpdir(), "monitor-main-"));
    const seriesFile = join(tmp, "missing-dir", "series.json");
    const logs = [];
    const errs = [];
    const origLog = console.log;
    const origErr = console.error;
    console.log = (msg) => logs.push(msg);
    console.error = (msg) => errs.push(msg);
    const m = startMock([
      ["/sites/", () => res({ account_slug: "acct" })],
      ["/builds/status", () =>
        res({
          minutes: {
            current: 0,
            included_minutes_with_packs: "300",
            period_start_date: "2026-06-01",
            period_end_date: "2026-06-30",
          },
        }),
      ],
      ["/actions/runs", () => res({ workflow_runs: [] })],
      ["/search/issues", () => res({ total_count: 0 })],
    ]);
    try {
      // Must resolve, not reject: the series-write failure is swallowed.
      await main(seriesFile);
      assert.ok(errs.some((msg) => /Failed to update resource series/.test(msg)));
      assert.ok(logs.some((msg) => /Skipping report/.test(msg)));
    } finally {
      console.log = origLog;
      console.error = origErr;
      m.restore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
