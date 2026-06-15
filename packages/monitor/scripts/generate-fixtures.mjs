#!/usr/bin/env node
// Generate synthetic monitor-series fixtures for local burndown rendering tests.

import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, "..", "fixtures");
mkdirSync(fixturesDir, { recursive: true });

const PERIOD_START = "2026-06-01";
const PERIOD_DAYS = 30;

function dateFromStart(offsetDays) {
  const start = new Date(PERIOD_START);
  start.setUTCDate(start.getUTCDate() + offsetDays);
  return start.toISOString().slice(0, 10);
}

function entry(dateOffset, githubMinutes, netlifyCurrent, mergedPRs) {
  return {
    date: dateFromStart(dateOffset),
    netlifyCurrent,
    githubMinutes,
    source: "logged",
    mergedPRs,
  };
}

function makeSeries(generator, lastDayIndex) {
  const series = [];
  for (let d = 0; d <= lastDayIndex; d++) {
    series.push(entry(d, generator.github(d), generator.netlify(d), generator.prs(d)));
  }
  return series;
}

const scenarios = [
  {
    name: "empty",
    series: [],
    description: "No series entries; renderer falls back to seeded/default current values.",
  },
  {
    name: "start",
    series: makeSeries(
      {
        github: () => 104,
        netlify: () => 0,
        prs: () => 5,
      },
      0
    ),
    description: "Only the first day (1 June).",
  },
  {
    name: "day-07",
    series: makeSeries(moderateGenerator(), 6),
    description: "One week into the period, moderate burn.",
  },
  {
    name: "day-14",
    series: makeSeries(moderateGenerator(), 13),
    description: "Two weeks into the period, moderate burn.",
  },
  {
    name: "day-21",
    series: makeSeries(moderateGenerator(), 20),
    description: "Three weeks into the period, moderate burn.",
  },
  {
    name: "full",
    series: makeSeries(moderateGenerator(), PERIOD_DAYS - 1),
    description: "Full month of moderate burn, ending on 30 June.",
  },
  {
    name: "slow",
    series: makeSeries(slowGenerator(), PERIOD_DAYS - 1),
    description: "Slow burn; well under budget for the whole month.",
  },
  {
    name: "fast",
    series: makeSeries(fastGenerator(), PERIOD_DAYS - 1),
    description: "Fast burn; exceeds both quotas before the end of the month.",
  },
  {
    name: "fast-mid",
    series: makeSeries(fastGenerator(), 14),
    description: "Fast burn up to mid-month, already near/over quota.",
  },
];

function moderateGenerator() {
  return {
    github: (d) => Math.round(50 + d * 35 + Math.sin(d * 0.7) * 20),
    netlify: (d) => Math.round(2 + d * 5 + Math.cos(d * 0.5) * 3),
    prs: (d) => 3 + (d % 6) + Math.round(Math.sin(d * 0.9) * 2),
  };
}

function slowGenerator() {
  return {
    github: (d) => Math.round(20 + d * 7 + Math.sin(d * 0.4) * 5),
    netlify: (d) => Math.round(1 + d * 1.2 + Math.cos(d * 0.3) * 1),
    prs: (d) => 1 + (d % 3),
  };
}

function fastGenerator() {
  return {
    github: (d) => Math.round(100 + d * 80 + Math.sin(d * 0.6) * 30),
    netlify: (d) => Math.round(d * 12 + Math.cos(d * 0.5) * 4),
    prs: (d) => 5 + (d % 8) + Math.round(Math.cos(d * 0.4) * 3),
  };
}

for (const { name, series, description } of scenarios) {
  const path = resolve(fixturesDir, `${name}.json`);
  writeFileSync(path, JSON.stringify(series, null, 2) + "\n");
  console.log(`wrote ${path} (${series.length} entries) — ${description}`);
}
