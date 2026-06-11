import { test, after } from "node:test";
import assert from "node:assert/strict";
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
