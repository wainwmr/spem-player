// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";

import { buildDurationReport } from "../../build/ciDurationReport.mjs";

// The load-bearing property (#422): the LilyPond SVG render is a fixed external
// cost, not a regression signal, so it must be EXCLUDED from the pass/fail
// soft-budget total — otherwise a full build always breaches and the budget
// becomes noise (alarm fatigue). The budgeted total guards only what we control
// cheaply: check, the vite bundle, and unit tests.
const BUDGETS = { unitBudget: 120, totalBudget: 360 };

describe("buildDurationReport", () => {
  it("excludes the SVG render from the budgeted total", () => {
    const r = buildDurationReport({
      check: 10,
      render: 570,
      bundle: 3,
      unit: 20,
      ...BUDGETS,
    });
    // check + bundle + unit, NOT render
    expect(r.budgetedTotal).toBe(33);
  });

  it("does not warn when only the render is large (full-build case)", () => {
    const r = buildDurationReport({
      check: 10,
      render: 570,
      bundle: 3,
      unit: 20,
      ...BUDGETS,
    });
    expect(r.warnings).toEqual([]);
  });

  it("warns when the budgeted total (check+bundle+unit) breaches", () => {
    const r = buildDurationReport({
      check: 200,
      render: 5,
      bundle: 100,
      unit: 100,
      ...BUDGETS,
    });
    // 200 + 100 + 100 = 400 > 360
    expect(r.budgetedTotal).toBe(400);
    expect(r.warnings.join("\n")).toMatch(/budget/i);
    expect(r.warnings.join("\n")).toMatch(/400/);
  });

  it("warns when unit tests breach their own budget", () => {
    const r = buildDurationReport({
      check: 10,
      render: 5,
      bundle: 3,
      unit: 150,
      ...BUDGETS,
    });
    expect(r.warnings.join("\n")).toMatch(/unit/i);
  });

  it("a large render alone never breaches, even with unit near budget", () => {
    const r = buildDurationReport({
      check: 5,
      render: 9999,
      bundle: 2,
      unit: 10,
      ...BUDGETS,
    });
    expect(r.warnings).toEqual([]);
  });

  it("reports the render on its own line, marked as excluded from the budget", () => {
    const r = buildDurationReport({
      check: 10,
      render: 570,
      bundle: 3,
      unit: 20,
      ...BUDGETS,
    });
    const text = r.summaryLines.join("\n");
    expect(text).toMatch(/render/i);
    expect(text).toMatch(/570/);
    // the render line (or its surrounding note) flags that it is excluded
    expect(text.toLowerCase()).toContain("exclud");
  });

  it("notes 'data unavailable' and does not warn when no phase timed", () => {
    const r = buildDurationReport({
      check: 0,
      render: 0,
      bundle: 0,
      unit: 0,
      ...BUDGETS,
    });
    expect(r.summaryLines.join("\n").toLowerCase()).toContain("unavailable");
    expect(r.warnings).toEqual([]);
  });

  it("coerces missing/non-numeric durations to 0", () => {
    const r = buildDurationReport({
      check: Number.NaN,
      render: undefined,
      bundle: 3,
      unit: 20,
      ...BUDGETS,
    });
    // NaN check + undefined render -> 0; budgeted = 0 + 3 + 20
    expect(r.budgetedTotal).toBe(23);
  });

  it("does not warn when the budgeted total exactly equals its budget (boundary)", () => {
    const r = buildDurationReport({
      check: 200,
      render: 5,
      bundle: 100,
      unit: 60,
      ...BUDGETS,
    });
    // 200 + 100 + 60 = 360 === totalBudget; strict `>` means no warning
    expect(r.budgetedTotal).toBe(360);
    expect(r.warnings).toEqual([]);
  });

  it("warns when the budgeted total is one second over its budget (boundary)", () => {
    const r = buildDurationReport({
      check: 201,
      render: 5,
      bundle: 100,
      unit: 60,
      ...BUDGETS,
    });
    expect(r.budgetedTotal).toBe(361);
    expect(r.warnings.join("\n")).toMatch(/361/);
  });

  it("does not warn when unit tests exactly equal their budget (boundary)", () => {
    const r = buildDurationReport({
      check: 10,
      render: 5,
      bundle: 10,
      unit: 120,
      ...BUDGETS,
    });
    // unit === unitBudget; strict `>` means no unit warning; total 140 < 360
    expect(r.warnings).toEqual([]);
  });

  it("warns when unit tests are one second over their budget (boundary)", () => {
    const r = buildDurationReport({
      check: 10,
      render: 5,
      bundle: 10,
      unit: 121,
      ...BUDGETS,
    });
    expect(r.warnings.join("\n")).toMatch(/unit/i);
    expect(r.warnings.join("\n")).toMatch(/121/);
  });

  it("parses numeric-string durations (env values arrive as strings)", () => {
    const r = buildDurationReport({
      check: "5",
      render: "0",
      bundle: "3",
      unit: "20",
      ...BUDGETS,
    });
    // strings parsed, not dropped: 5 + 3 + 20
    expect(r.budgetedTotal).toBe(28);
  });

  it("coerces non-integer, negative, null and non-numeric durations to 0", () => {
    const r = buildDurationReport({
      check: "5.5", // non-integer -> 0
      render: null, // null -> 0 (excluded from budget anyway)
      bundle: -3, // negative -> 0
      unit: "abc", // non-numeric -> 0
      ...BUDGETS,
    });
    expect(r.budgetedTotal).toBe(0);
  });

  it("does not show 'unavailable' when only the render timed (others 0)", () => {
    const r = buildDurationReport({
      check: 0,
      render: 570,
      bundle: 0,
      unit: 0,
      ...BUDGETS,
    });
    // The render is excluded from the budget but IS part of the all-zero guard,
    // so a render-only run is not "data unavailable" and must not warn.
    expect(r.summaryLines.join("\n").toLowerCase()).not.toContain(
      "unavailable"
    );
    expect(r.warnings).toEqual([]);
  });
});
