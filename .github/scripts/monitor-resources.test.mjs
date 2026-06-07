import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldSkipReport, formatMessage } from "./monitor-resources.mjs";

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
