import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { mergeSeries } from "./merge-monitor-series.mjs";

/**
 * Build a minimal series entry with a self-consistent summary.mergedPRs.
 */
function entry(date, mergedPRs, extra = {}) {
  return {
    date,
    netlifyCurrent: 100,
    githubMinutes: 200,
    mergedPRs,
    summary: { date, mergedPRs, overallStatus: "good" },
    source: "logged",
    ...extra,
  };
}

describe("mergeSeries (#728 value-preserving monitor-series merge)", () => {
  test("keeps the richer mergedPRs when ours is the poorer (refresh wrote 0)", () => {
    // The losing ordering: ours = merge-time refresh (0), theirs = daily run (3).
    const ours = JSON.stringify([entry("2026-06-30", 0)]);
    const theirs = JSON.stringify([entry("2026-06-30", 3)]);
    const merged = mergeSeries(ours, theirs);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].mergedPRs, 3);
    assert.equal(merged[0].summary.mergedPRs, 3);
  });

  test("keeps the richer mergedPRs when ours is the richer (reverse ordering)", () => {
    const ours = JSON.stringify([entry("2026-06-30", 5)]);
    const theirs = JSON.stringify([entry("2026-06-30", 0)]);
    const merged = mergeSeries(ours, theirs);
    assert.equal(merged[0].mergedPRs, 5);
    assert.equal(merged[0].summary.mergedPRs, 5);
  });

  test("unions distinct days, preserving each side's entries (sorted by date)", () => {
    const ours = JSON.stringify([entry("2026-06-29", 1), entry("2026-06-30", 0)]);
    const theirs = JSON.stringify([entry("2026-06-30", 2), entry("2026-07-01", 4)]);
    const merged = mergeSeries(ours, theirs);
    assert.deepEqual(
      merged.map((e) => e.date),
      ["2026-06-29", "2026-06-30", "2026-07-01"]
    );
    assert.equal(merged.find((e) => e.date === "2026-06-30").mergedPRs, 2);
  });

  test("727-12: a multi-day manual backfill survives a concurrent single-day refresh", () => {
    // ours = a CI refresh that only knows today (poorer); theirs = a manual
    // backfill carrying several richer days. The backfill days must survive.
    const ours = JSON.stringify([entry("2026-06-30", 0)]);
    const theirs = JSON.stringify([
      entry("2026-06-27", 2),
      entry("2026-06-28", 3),
      entry("2026-06-29", 1),
      entry("2026-06-30", 4),
    ]);
    const merged = mergeSeries(ours, theirs);
    assert.deepEqual(
      merged.map((e) => e.date),
      ["2026-06-27", "2026-06-28", "2026-06-29", "2026-06-30"]
    );
    assert.equal(merged.find((e) => e.date === "2026-06-30").mergedPRs, 4);
  });

  test("treats a missing mergedPRs as 0 without crashing", () => {
    const ours = JSON.stringify([{ date: "2026-06-30", source: "logged" }]);
    const theirs = JSON.stringify([entry("2026-06-30", 2)]);
    const merged = mergeSeries(ours, theirs);
    assert.equal(merged[0].mergedPRs, 2);
  });

  test("an equal-count tie keeps the first argument's entry", () => {
    const ours = JSON.stringify([entry("2026-06-30", 3, { source: "ours" })]);
    const theirs = JSON.stringify([entry("2026-06-30", 3, { source: "theirs" })]);
    const merged = mergeSeries(ours, theirs);
    assert.equal(merged[0].source, "ours");
    assert.equal(merged[0].mergedPRs, 3);
  });

  test("keeps the larger count when both same-day sides are non-zero", () => {
    const ours = JSON.stringify([entry("2026-06-30", 2)]);
    const theirs = JSON.stringify([entry("2026-06-30", 5)]);
    const merged = mergeSeries(ours, theirs);
    assert.equal(merged[0].mergedPRs, 5);
    assert.equal(merged[0].summary.mergedPRs, 5);
  });

  test("throws on a non-array side so a malformed merge fails loudly", () => {
    assert.throws(() => mergeSeries("{}", "[]"), /must be a JSON array/);
    assert.throws(() => mergeSeries("[]", "5"), /must be a JSON array/);
  });
});
