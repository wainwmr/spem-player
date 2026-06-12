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
  formatMessage,
  getReportingSince,
  parseRepo,
  todayISO,
  paceBucket,
  formatCaption,
  loadSeries,
  saveSeries,
  appendOrReplaceDay,
  buildLoggedEntry,
  githubRunsToDailySeries,
  netlifyDailyMinutesToBackfill,
  buildBackfillSeries,
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

test("computeUsageStatus on-budget usage projects to exactly 100", () => {
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
    statusPct: 100,
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

test("computeUsageStatus day-one extrapolation is linear (damping tracked in #553)", () => {
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
  assert.equal(result.statusPct, 200);
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
// usage are below 50% — main() passes the actual max and projected max
// separately; this helper is the single place they are combined.
test("shouldSkipReport skips when zero PRs and low projected usage", () => {
  assert.equal(shouldSkipReport(0, 30, 30), true);
  assert.equal(shouldSkipReport(0, 0, 0), true);
});

test("shouldSkipReport sends when zero PRs but projected watch threshold reached", () => {
  assert.equal(shouldSkipReport(0, 30, 50), false);
});

test("shouldSkipReport sends when zero PRs but projected throttle threshold reached", () => {
  assert.equal(shouldSkipReport(0, 30, 75), false);
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

// formatMessage: append PR count only when > 0
test("formatMessage omits PR suffix when no PRs", () => {
  assert.equal(
    formatMessage("🟢", 23, 45, "normal", 0),
    "🟢 Netlify 23% · GitHub 45% — normal"
  );
});

test("formatMessage uses singular when one PR merged", () => {
  assert.equal(
    formatMessage("🟢", 23, 45, "normal", 1),
    "🟢 Netlify 23% · GitHub 45% — normal · 1 PR merged"
  );
});

test("formatMessage uses plural when multiple PRs merged", () => {
  assert.equal(
    formatMessage("🟡", 51, 30, "watch", 3),
    "🟡 Netlify 51% · GitHub 30% — watch · 3 PRs merged"
  );
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

// formatCaption: date + per-service colour + PR count
test("formatCaption builds the image caption", () => {
  const githubStatus = { pct: 25, projected: 30, statusPct: 30 };
  const netlifyStatus = { pct: 33, projected: 110, statusPct: 110 };
  const caption = formatCaption("2026-06-12", githubStatus, netlifyStatus, 2);
  assert.equal(caption, "12 Jun: 🟢 GitHub 25% | 🔴 Netlify 33% | 2 PRs merged");
});

test("formatCaption uses singular PR when one merged", () => {
  const caption = formatCaption(
    "2026-06-12",
    { pct: 80, projected: 95, statusPct: 95 },
    { pct: 10, projected: 20, statusPct: 20 },
    1
  );
  assert.match(caption, /\| 1 PR merged$/);
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
      { date: "2026-06-10", netlifyCurrent: 10, githubMinutes: 20, source: "logged" },
    ];
    saveSeries(series, path);
    const loaded = loadSeries(path);
    assert.deepEqual(loaded, series);
  });
});

// appendOrReplaceDay: idempotent per date and sorted
test("appendOrReplaceDay appends a new date", () => {
  const series = [
    { date: "2026-06-10", netlifyCurrent: 10, githubMinutes: 20, source: "logged" },
  ];
  const entry = { date: "2026-06-11", netlifyCurrent: 15, githubMinutes: 25, source: "logged" };
  const result = appendOrReplaceDay(series, entry);
  assert.equal(result.length, 2);
  assert.equal(result[1].date, "2026-06-11");
});

test("appendOrReplaceDay replaces an existing date", () => {
  const series = [
    { date: "2026-06-10", netlifyCurrent: 10, githubMinutes: 20, source: "logged" },
  ];
  const entry = { date: "2026-06-10", netlifyCurrent: 99, githubMinutes: 99, source: "logged" };
  const result = appendOrReplaceDay(series, entry);
  assert.equal(result.length, 1);
  assert.equal(result[0].netlifyCurrent, 99);
});

test("appendOrReplaceDay keeps series sorted", () => {
  const series = [
    { date: "2026-06-12", netlifyCurrent: 12, githubMinutes: 22, source: "logged" },
  ];
  const entry = { date: "2026-06-10", netlifyCurrent: 10, githubMinutes: 20, source: "logged" };
  const result = appendOrReplaceDay(series, entry);
  assert.equal(result[0].date, "2026-06-10");
  assert.equal(result[1].date, "2026-06-12");
});

// buildLoggedEntry: shapes a logged entry from usage records
test("buildLoggedEntry uses current values and source logged", () => {
  const netlify = { current: 30, limit: 300, periodStartDate: "2026-06-12", periodEndDate: "2026-07-11" };
  const github = { current: 120, limit: 2000, periodStartDate: "2026-06-01", periodEndDate: "2026-06-30" };
  const entry = buildLoggedEntry("2026-06-12", netlify, github);
  assert.deepEqual(entry, {
    date: "2026-06-12",
    netlifyCurrent: 30,
    githubMinutes: 120,
    source: "logged",
  });
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
  const result = buildBackfillSeries(github, netlify);
  assert.deepEqual(result, [
    { date: "2026-06-12", netlifyCurrent: 30, githubMinutes: 100, source: "backfill" },
    { date: "2026-06-13", netlifyCurrent: null, githubMinutes: 120, source: "backfill" },
  ]);
});
