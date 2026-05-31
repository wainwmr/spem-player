/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { appendFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

/**
 * Build the CI duration-budget report (#422).
 *
 * The LilyPond SVG render is a fixed external cost, not a regression signal, so
 * it is reported on its own line but EXCLUDED from the pass/fail soft-budget
 * total. The budgeted total guards only the phases we control cheaply: check,
 * the vite bundle, and unit tests. A budget that breaches on every full build is
 * alarm fatigue — it trains everyone to ignore the one regression it should
 * catch. (With #421's cache, the render is ~0s on a hit and only pays its full
 * cost on a miss; either way it does not count against the budget.)
 */

/** Coerce an env string / number to a non-negative integer, else 0. */
function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

/**
 * Compute the duration report. Pure — no I/O.
 *
 * @param {{check?: number|string, render?: number|string, bundle?: number|string,
 *   unit?: number|string, unitBudget?: number|string, totalBudget?: number|string}} phases
 * @returns {{summaryLines: string[], warnings: string[], budgetedTotal: number}}
 */
export function buildDurationReport(phases) {
  const check = toInt(phases.check);
  const render = toInt(phases.render);
  const bundle = toInt(phases.bundle);
  const unit = toInt(phases.unit);
  const unitBudget = toInt(phases.unitBudget);
  const totalBudget = toInt(phases.totalBudget);

  // The render is deliberately NOT part of the budgeted total.
  const budgetedTotal = check + bundle + unit;

  const summaryLines = [
    "## CI duration (measured phases)",
    `- Check: ${check}s`,
    `- SVG render: ${render}s (LilyPond — excluded from the budget; a fixed external cost, ~0s on a cache hit)`,
    `- Bundle (vite): ${bundle}s`,
    `- Unit tests: ${unit}s (budget: ${unitBudget}s)`,
    `- Budgeted total — check + bundle + unit: ${budgetedTotal}s (budget: ${totalBudget}s)`,
    "_Excludes per-job overhead (checkout, setup-node, npm ci) and the SVG render; the GitHub UI job time will be larger._",
  ];

  // Mirror the prior report's behaviour: when nothing timed (e.g. an upstream
  // failure before any phase ran), say so rather than implying real zeros.
  if (check === 0 && render === 0 && bundle === 0 && unit === 0) {
    summaryLines.push(
      "",
      "_Duration data unavailable — no timed phases completed._",
    );
  }

  const warnings = [];
  if (unit > unitBudget) {
    warnings.push(
      `Unit tests took ${unit}s, exceeding the ${unitBudget}s soft budget.`,
    );
  }
  if (budgetedTotal > totalBudget) {
    warnings.push(
      `Budgeted CI phases (check + bundle + unit) took ${budgetedTotal}s, exceeding the ${totalBudget}s soft budget.`,
    );
  }

  return { summaryLines, warnings, budgetedTotal };
}

// CLI: read phase durations from the environment, emit the report to stdout and
// $GITHUB_STEP_SUMMARY, and a ::warning:: annotation per soft-budget breach.
// Budgets are SOFT — breaches warn but do not fail the job.
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const report = buildDurationReport({
    check: process.env.CHECK_S,
    render: process.env.RENDER_S,
    bundle: process.env.BUNDLE_S,
    unit: process.env.UNIT_S,
    unitBudget: process.env.UNIT_BUDGET_SEC,
    totalBudget: process.env.TOTAL_BUDGET_SEC,
  });

  const summary = report.summaryLines.join("\n") + "\n";
  process.stdout.write(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
  for (const w of report.warnings) {
    process.stdout.write(`::warning::${w}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n**Budget exceeded:** ${w}\n`);
    }
  }
}
