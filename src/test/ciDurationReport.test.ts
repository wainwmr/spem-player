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
});
