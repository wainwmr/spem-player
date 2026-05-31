// Hand-written ambient types for ciDurationReport.mjs so the Vitest suite in
// src/test/ can import it from TypeScript. Keep in sync with the exports
// at the bottom of ciDurationReport.mjs.

// Durations/budgets are coerced (the CLI passes env strings; tests pass numbers
// and may pass NaN/undefined to exercise the coercion).
type Duration = number | string | undefined;

export function buildDurationReport(phases: {
  check?: Duration;
  render?: Duration;
  bundle?: Duration;
  unit?: Duration;
  unitBudget?: Duration;
  totalBudget?: Duration;
}): { summaryLines: string[]; warnings: string[]; budgetedTotal: number };
