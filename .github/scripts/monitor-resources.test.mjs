import { test, after } from "node:test";
import assert from "node:assert/strict";
import {
  shouldSkipReport,
  formatMessage,
  getReportingSince,
  parseRepo,
} from "./monitor-resources.mjs";

// shouldSkipReport: skip only when zero PRs AND below 50% (normal status)
test("shouldSkipReport skips when zero PRs and normal usage", () => {
  assert.equal(shouldSkipReport(0, 0), true);
  assert.equal(shouldSkipReport(0, 49), true);
});

test("shouldSkipReport sends when zero PRs but watch threshold reached", () => {
  assert.equal(shouldSkipReport(0, 50), false);
});

test("shouldSkipReport sends when zero PRs but throttle threshold reached", () => {
  assert.equal(shouldSkipReport(0, 75), false);
});

test("shouldSkipReport sends when zero PRs but STOP threshold reached", () => {
  assert.equal(shouldSkipReport(0, 90), false);
});

test("shouldSkipReport sends when PRs merged regardless of usage", () => {
  assert.equal(shouldSkipReport(1, 0), false);
  assert.equal(shouldSkipReport(3, 10), false);
  assert.equal(shouldSkipReport(1, 95), false);
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
