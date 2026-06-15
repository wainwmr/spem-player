// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Render a two-panel burndown chart as a PNG buffer.
 *
 * Consumes the daily resource series produced by monitor-resources.mjs and the
 * two usage records. Pure/offline: no network calls, so it is unit-testable.
 *
 * @module render-burndown
 */

import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

/**
 * @typedef {import("./monitor-resources.mjs").UsageRecord} UsageRecord
 * @typedef {import("./monitor-resources.mjs").SeriesEntry} SeriesEntry
 */

const COLORS = {
  panelBg: "#ffffff",
  text: "#0f172a",
  muted: "#475569",
  grid: "#cbd5e1",
  diagonal: "#94a3b8",
  youAreHere: "#0f172a",
  green: "#16a34a",
  yellow: "#ca8a04",
  red: "#dc2626",
  histogramPast: "#8995a5",
  histogramFuture: "#cbd5e1",
};

const STATUS_COLORS = {
  good: COLORS.green,
  watch: COLORS.yellow,
  throttle: COLORS.red,
  stop: COLORS.red,
};

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const PADDING_X = 32;
const PADDING_Y = 24;
const GAP = 32;
const PANEL_WIDTH = (CANVAS_WIDTH - 2 * PADDING_X - GAP) / 2;
const HISTOGRAM_HEIGHT = 80;
const PANEL_HEIGHT = CANVAS_HEIGHT - 2 * PADDING_Y - HISTOGRAM_HEIGHT;
const CHART_TOP = 24;
const CHART_BOTTOM = PANEL_HEIGHT - 24;
const CHART_LEFT = 24;
const CHART_RIGHT = PANEL_WIDTH - 24;
const CHART_HEIGHT = CHART_BOTTOM - CHART_TOP;
const CHART_WIDTH = CHART_RIGHT - CHART_LEFT;

/**
 * Convert cumulative minutes to budget-remaining percentage.
 *
 * @param {number} current
 * @param {number} limit
 * @returns {number}
 */
function remainingPct(current, limit) {
  if (limit <= 0) return 100;
  return Math.max(0, 100 - (current / limit) * 100);
}

/**
 * Map a service's daily cumulative series into { date, dayIndex, remaining }
 * points, filtering out null/undefined values and capping at today.
 *
 * `dayIndex` is the plot day: 0 is the notional start-of-period point (100%
 * remaining, no usage), 1 is the end of the first actual day, and `days` is
 * the end of the last day. This places day 0 one column to the left of day 1
 * and aligns the burndown line with the histogram columns.
 *
 * @param {SeriesEntry[]} series
 * @param {keyof SeriesEntry} key - "githubMinutes" or "netlifyCurrent".
 * @param {UsageRecord} usage
 * @param {Date} now
 * @returns {{date: string, dayIndex: number, remaining: number}[]}
 */
function buildPoints(series, key, usage, now) {
  const today = now.toISOString().slice(0, 10);
  const points = [];
  for (const entry of series) {
    if (entry.date > today) continue;
    const value = entry[key];
    if (value == null || Number.isNaN(value)) continue;
    const rawDayIndex = dayDiff(usage.periodStartDate, entry.date);
    if (rawDayIndex < 0 || rawDayIndex >= usage.periodDays) continue;
    points.push({
      date: entry.date,
      dayIndex: rawDayIndex + 1,
      remaining: remainingPct(value, usage.limit),
    });
  }
  // Burndown charts conventionally start at 100% remaining on the notional
  // day 0. It sits one column to the left of day 1 and has no histogram bar.
  if (points.length > 0) {
    points.unshift({
      date: usage.periodStartDate,
      dayIndex: 0,
      remaining: 100,
    });
  }
  return points;
}

/**
 * Whole calendar days from `startStr` to `dateStr` inclusive.
 *
 * @param {string} startStr
 * @param {string} dateStr
 * @returns {number}
 */
export function dayDiff(startStr, dateStr) {
  const start = new Date(startStr);
  const date = new Date(dateStr);
  const startUtc = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  const dateUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return Math.floor((dateUtc - startUtc) / (24 * 60 * 60 * 1000));
}

/**
 * Days in the period inclusive.
 *
 * @param {UsageRecord} usage
 * @returns {number}
 */
function periodDays(usage) {
  return dayDiff(usage.periodStartDate, usage.periodEndDate) + 1;
}

/**
 * Project current usage to end-of-period percentage.
 *
 * @param {number} currentPct - Current usage percentage (0-100).
 * @param {number} daysElapsed
 * @param {number} daysInPeriod
 * @returns {number}
 */
function projectedEndPct(currentPct, daysElapsed, daysInPeriod) {
  return Math.round((currentPct / Math.max(1, daysElapsed)) * daysInPeriod);
}

/**
 * Hex colour for a named monitor status.
 *
 * @param {"good"|"watch"|"throttle"|"stop"} status
 * @returns {string}
 */
function statusColor(status) {
  return STATUS_COLORS[status] ?? COLORS.green;
}

/**
 * Daily burn rates (units per day) between consecutive series entries up to
 * and including `today`. Used to build an optimistic/pessimistic projection
 * cone from the 1st and 3rd quartiles of past burn rates.
 *
 * @param {SeriesEntry[]} series
 * @param {keyof SeriesEntry} key
 * @param {string} today
 * @returns {number[]}
 */
function dailyBurnRates(series, key, today) {
  const rates = [];
  const filtered = series.filter(
    (entry) => entry.date <= today && entry[key] != null && !Number.isNaN(entry[key])
  );
  for (let i = 1; i < filtered.length; i++) {
    const prev = filtered[i - 1];
    const curr = filtered[i];
    const days = dayDiff(prev.date, curr.date);
    if (days <= 0) continue;
    rates.push((curr[key] - prev[key]) / days);
  }
  return rates;
}

/**
 * Linear-interpolation percentile of a sorted numeric array.
 *
 * @param {number[]} sorted
 * @param {number} q - Quantile in the range [0, 1].
 * @returns {number}
 */
function percentile(sorted, q) {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  if (next === undefined) return sorted[base];
  return sorted[base] + rest * (next - sorted[base]);
}

/**
 * Draw a rounded rectangle.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
 */
function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Base directory of this module, used to resolve icon paths.
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Draw one panel.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} originX
 * @param {HTMLImageElement} icon
 * @param {HTMLImageElement|null} fireIcon
 * @param {UsageRecord} usage
 * @param {{date: string, dayIndex: number, remaining: number}[]} points
 * @param {Date} now
 * @param {"good"|"watch"|"throttle"|"stop"} status
 */
function drawPanel(ctx, originX, icon, fireIcon, usage, points, now, status) {
  const today = now.toISOString().slice(0, 10);
  const days = usage.periodDays;
  const todayPlotDay = Math.min(
    dayDiff(usage.periodStartDate, today) + 1,
    days
  );

  // Panel background
  ctx.save();
  ctx.fillStyle = COLORS.panelBg;
  roundRect(ctx, originX, 0, PANEL_WIDTH, PANEL_HEIGHT, 16);
  ctx.fill();

  // Chart origin
  const ox = originX + CHART_LEFT;
  const oy = CHART_TOP;

  // Current usage label, top-right
  const valueX = originX + PANEL_WIDTH - 24;
  const valueY = CHART_TOP + 12;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";

  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
  const currentUsed = lastPoint
    ? 100 - lastPoint.remaining
    : 100 - remainingPct(usage.current, usage.limit);
  const projected = projectedEndPct(currentUsed, todayPlotDay, days);
  const panelColor = statusColor(status);

  ctx.fillStyle = panelColor;
  ctx.font = "900 52px sans-serif";
  ctx.fillText(`${usage.current}/${usage.limit}`, valueX, valueY);

  ctx.fillStyle = COLORS.text;
  ctx.font = "500 36px sans-serif";
  ctx.fillText("mins", valueX, valueY + 54);

  // Fire icon for stop status, underneath "mins" and right-justified.
  if (status === "stop" && fireIcon) {
    const fireHeight = 28;
    const fireWidth = (fireIcon.width / fireIcon.height) * fireHeight;
    ctx.drawImage(
      fireIcon,
      valueX - fireWidth,
      valueY + 54 + 40,
      fireWidth,
      fireHeight
    );
  }

  // Gridlines (no axis labels)
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (const pct of [0, 25, 50, 75, 100]) {
    const y = oy + CHART_HEIGHT * (pct / 100);
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox + CHART_WIDTH, y);
    ctx.stroke();
  }

  // Critical-pace diagonal (0% used → 100% used)
  ctx.strokeStyle = COLORS.diagonal;
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + CHART_WIDTH, oy + CHART_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  // Actual usage line, coloured per segment
  if (points.length >= 2) {
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const color = panelColor;

      const x1 = ox + (prev.dayIndex / days) * CHART_WIDTH;
      const y1 = oy + CHART_HEIGHT * (1 - prev.remaining / 100);
      const x2 = ox + (curr.dayIndex / days) * CHART_WIDTH;
      const y2 = oy + CHART_HEIGHT * (1 - curr.remaining / 100);

      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  const xNow = ox + (todayPlotDay / days) * CHART_WIDTH;
  const yNow = oy + CHART_HEIGHT * (currentUsed / 100);

  // Projection from today to period-end (drawn before the dot so the dot sits on top).
  // Skip it until we have more than three days of data — projecting from one,
  // two or three days is not reliable.
  if (todayPlotDay > 3) {
    ctx.strokeStyle = panelColor;
    ctx.lineWidth = 7;
    ctx.setLineDash([2, 8]);
    ctx.beginPath();
    ctx.moveTo(xNow, yNow);
    ctx.lineTo(ox + CHART_WIDTH, oy + CHART_HEIGHT * Math.min(100, projected) / 100);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // White dot on top of the projection line
  ctx.fillStyle = COLORS.youAreHere;
  ctx.beginPath();
  ctx.arc(xNow, yNow, 8, 0, Math.PI * 2);
  ctx.fill();

  // Service icon, bottom-left of the chart area.
  const iconHeight = 144;
  const iconWidth = (icon.width / icon.height) * iconHeight;
  ctx.drawImage(
    icon,
    originX + 36,
    CHART_BOTTOM - iconHeight - 24,
    iconWidth,
    iconHeight
  );

  ctx.restore();
}

/**
 * Draw a single PR-count histogram spanning underneath both panels.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {UsageRecord} usage
 * @param {Date} now
 * @param {{dayIndex: number, count: number}[]} prCounts
 */
function drawHistogram(ctx, usage, now, prCounts) {
  const today = now.toISOString().slice(0, 10);
  const days = usage.periodDays;
  const todayRawIndex = Math.min(
    dayDiff(usage.periodStartDate, today),
    days - 1
  );

  const HISTOGRAM_MAX_COUNT = 15; // observed month max
  const FUTURE_PLACEHOLDER_HEIGHT = 6;
  const histogramTop = PANEL_HEIGHT + PADDING_Y;
  const histogramBottom = CANVAS_HEIGHT - PADDING_Y;
  const histogramHeight = histogramBottom - histogramTop;
  const histogramLeft = PADDING_X + CHART_LEFT;
  const histogramRight =
    PADDING_X + PANEL_WIDTH + GAP + CHART_RIGHT;
  const histogramWidth = histogramRight - histogramLeft;
  // Histogram bars occupy day columns 1..days; day 0 has no bar.
  const dayWidth = histogramWidth / days;
  const barWidth = dayWidth * 0.5;

  // Baseline
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(histogramLeft, histogramBottom);
  ctx.lineTo(histogramRight, histogramBottom);
  ctx.stroke();

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const entry = prCounts.find((c) => c.dayIndex === dayIndex);
    const count = entry?.count ?? 0;
    // Bars sit at the right edge of each day column, aligned with the line
    // points and the "you are here" dot.
    const x = histogramLeft + (dayIndex + 1) * dayWidth;

    let height;
    let fill;
    if (dayIndex > todayRawIndex) {
      height = FUTURE_PLACEHOLDER_HEIGHT;
      fill = COLORS.histogramFuture;
    } else {
      height = Math.min(count / HISTOGRAM_MAX_COUNT, 1) * histogramHeight;
      fill = dayIndex === todayRawIndex ? COLORS.green : COLORS.histogramPast;
    }

    if (height <= 0) continue;
    ctx.fillStyle = fill;
    ctx.fillRect(x - barWidth / 2, histogramBottom - height, barWidth, height);
  }
}

/**
 * Render the burndown chart as a PNG buffer.
 *
 * @param {UsageRecord} github
 * @param {UsageRecord} netlify
 * @param {SeriesEntry[]} series
 * @param {Date} [now]
 * @param {{dayIndex: number, count: number}[]} [prCounts]
 * @param {{github: "good"|"watch"|"throttle"|"stop", netlify: "good"|"watch"|"throttle"|"stop", overall: "good"|"watch"|"throttle"|"stop"}} statuses
 * @returns {Promise<Buffer>}
 */
export async function renderBurndown(
  github,
  netlify,
  series,
  now = new Date(),
  prCounts = [],
  statuses
) {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  // White outer background; panels are also filled white.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const [githubIcon, netlifyIcon, fireIcon] = await Promise.all([
    loadImage(resolve(__dirname, "icons/github.png")),
    loadImage(resolve(__dirname, "icons/netlify.png")),
    loadImage(resolve(__dirname, "icons/fire.png")),
  ]);

  const enrichedGithub = { ...github, periodDays: periodDays(github) };
  const enrichedNetlify = { ...netlify, periodDays: periodDays(netlify) };

  const githubPoints = buildPoints(series, "githubMinutes", enrichedGithub, now);
  const netlifyPoints = buildPoints(
    series,
    "netlifyCurrent",
    enrichedNetlify,
    now
  );

  drawPanel(ctx, PADDING_X, githubIcon, fireIcon, enrichedGithub, githubPoints, now, statuses.github);
  drawPanel(
    ctx,
    PADDING_X + PANEL_WIDTH + GAP,
    netlifyIcon,
    fireIcon,
    enrichedNetlify,
    netlifyPoints,
    now,
    statuses.netlify
  );

  // Vertical separator between the two panels.
  const separatorX = PADDING_X + PANEL_WIDTH + GAP / 2;
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(separatorX, PADDING_Y + 8);
  ctx.lineTo(separatorX, PANEL_HEIGHT - 8);
  ctx.stroke();

  drawHistogram(ctx, enrichedGithub, now, prCounts);

  return canvas.toBuffer("image/png");
}

/**
 * Draw both services on a single wide panel, with service icons in front of the
 * usage labels in the top-right. Used for local experimentation; not the
 * Telegram two-panel layout.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} panelWidth
 * @param {HTMLImageElement} githubIcon
 * @param {HTMLImageElement} netlifyIcon
 * @param {HTMLImageElement} fireIcon
 * @param {UsageRecord} github
 * @param {UsageRecord} netlify
 * @param {{date: string, dayIndex: number, remaining: number}[]} githubPoints
 * @param {{date: string, dayIndex: number, remaining: number}[]} netlifyPoints
 * @param {Date} now
 * @param {{github: "good"|"watch"|"throttle"|"stop", netlify: "good"|"watch"|"throttle"|"stop"}} statuses
 */

/**
 * Draw both services on a single wide panel, with service icons in front of the
 * usage labels in the top-right. The PR histogram is overlaid at the bottom of
 * the chart area. Z-order: diagonal, histogram, projection lines, actual lines,
 * dots, labels.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} panelWidth
 * @param {HTMLImageElement} githubIcon
 * @param {HTMLImageElement} netlifyIcon
 * @param {UsageRecord} github
 * @param {UsageRecord} netlify
 * @param {{date: string, dayIndex: number, remaining: number}[]} githubPoints
 * @param {{date: string, dayIndex: number, remaining: number}[]} netlifyPoints
 * @param {SeriesEntry[]} series
 * @param {Date} now
 * @param {{dayIndex: number, count: number}[]} prCounts
 * @param {{github: "good"|"watch"|"throttle"|"stop", netlify: "good"|"watch"|"throttle"|"stop"}} statuses
 */
function drawCombinedPanel(
  ctx,
  panelWidth,
  githubIcon,
  netlifyIcon,
  fireIcon,
  github,
  netlify,
  githubPoints,
  netlifyPoints,
  series,
  now,
  prCounts,
  statuses
) {
  const today = now.toISOString().slice(0, 10);
  const days = github.periodDays;
  const todayPlotDay = Math.min(
    dayDiff(github.periodStartDate, today) + 1,
    days
  );
  const chartRight = panelWidth - CHART_LEFT;
  const chartWidth = chartRight - CHART_LEFT;

  // Panel background
  ctx.save();
  ctx.fillStyle = COLORS.panelBg;
  roundRect(ctx, PADDING_X, 0, panelWidth, PANEL_HEIGHT, 16);
  ctx.fill();
  // Clip subsequent drawing to the rounded panel so the overlaid histogram
  // stays inside the panel bounds.
  roundRect(ctx, PADDING_X, 0, panelWidth, PANEL_HEIGHT, 16);
  ctx.clip();

  // Chart origin
  const ox = PADDING_X + CHART_LEFT;
  const oy = CHART_TOP;

  const services = [
    {
      usage: github,
      points: githubPoints,
      icon: githubIcon,
      status: statuses.github,
      lineDash: [],
      lineWidth: 8,
      marker: "circle",
      markerFill: "#8b5cf6",
      seriesKey: "githubMinutes",
    },
    {
      usage: netlify,
      points: netlifyPoints,
      icon: netlifyIcon,
      status: statuses.netlify,
      lineDash: [],
      lineWidth: 8,
      marker: "diamond",
      markerFill: "#014847",
      seriesKey: "netlifyCurrent",
    },
  ];

  // Gridlines
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (const pct of [0, 25, 50, 75, 100]) {
    const y = oy + CHART_HEIGHT * (pct / 100);
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox + chartWidth, y);
    ctx.stroke();
  }

  // Critical-pace diagonal (at the back)
  ctx.strokeStyle = COLORS.diagonal;
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + chartWidth, oy + CHART_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  // PR histogram overlaid in the middle
  drawCombinedOverlayHistogram(ctx, ox, chartWidth, github, now, prCounts);

  // Projection cone (behind actual lines). Rather than a single falsely
  // precise trend line, we use the 1st and 3rd quartiles of the observed
  // daily burn rate to draw an optimistic/pessimistic range. Only draw the
  // cone once we have more than three days of data.
  if (todayPlotDay > 3) {
    for (const { usage, status, seriesKey, markerFill } of [...services].reverse()) {
      const rates = dailyBurnRates(series, seriesKey, today).sort((a, b) => a - b);
      if (rates.length === 0) continue;

      const currentUsed = 100 - remainingPct(usage.current, usage.limit);
      const remainingDays = days - todayPlotDay;
      const q1Rate = percentile(rates, 0.25);
      const q3Rate = percentile(rates, 0.75);

      const optimisticUsed = currentUsed + (q1Rate / usage.limit) * 100 * remainingDays;
      const pessimisticUsed = currentUsed + (q3Rate / usage.limit) * 100 * remainingDays;

      const xNow = ox + (todayPlotDay / days) * chartWidth;
      const yNow = oy + CHART_HEIGHT * (currentUsed / 100);
      const xEnd = ox + chartWidth;
      const yBottom = oy + CHART_HEIGHT;
      // Clamp the cone to the 100% usage line; do not draw it below the chart.
      const yOptimistic = Math.min(
        yBottom,
        oy + CHART_HEIGHT * (optimisticUsed / 100)
      );
      const yPessimistic = Math.min(
        yBottom,
        oy + CHART_HEIGHT * (pessimisticUsed / 100)
      );

      const panelColor = statusColor(status);

      ctx.save();

      // Fill the cone between the optimistic and pessimistic projections with
      // the signal colour.
      ctx.fillStyle = panelColor;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(xNow, yNow);
      ctx.lineTo(xEnd, yOptimistic);
      ctx.lineTo(xEnd, yPessimistic);
      ctx.closePath();
      ctx.fill();

      // Boundary lines for the cone in the service brand colour.
      ctx.strokeStyle = markerFill;
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 6]);
      ctx.lineCap = "round";
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(xNow, yNow);
      ctx.lineTo(xEnd, yOptimistic);
      ctx.moveTo(xNow, yNow);
      ctx.lineTo(xEnd, yPessimistic);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Actual usage lines (at the front). GitHub is drawn last so its solid
  // line dominates where the two lines overlap.
  for (const { points, status, lineDash, lineWidth } of [...services].reverse()) {
    const panelColor = statusColor(status);
    if (points.length >= 2) {
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const x1 = ox + (prev.dayIndex / days) * chartWidth;
        const y1 = oy + CHART_HEIGHT * (1 - prev.remaining / 100);
        const x2 = ox + (curr.dayIndex / days) * chartWidth;
        const y2 = oy + CHART_HEIGHT * (1 - curr.remaining / 100);

        ctx.strokeStyle = panelColor;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(lineDash);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  }
  ctx.setLineDash([]);

  // Per-service markers at each data point. Netlify diamonds are drawn first
  // so the smaller GitHub circles sit on top; the diamond's corners remain
  // visible around the circle where the two lines overlap.
  for (const { points, marker, markerFill } of [...services].reverse()) {
    ctx.fillStyle = markerFill;

    for (const point of points) {
      const x = ox + (point.dayIndex / days) * chartWidth;
      const y = oy + CHART_HEIGHT * (1 - point.remaining / 100);

      if (marker === "circle") {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (marker === "diamond") {
        const r = 9;
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Current-position marker for each service, using the same shape and fill
  // as the historical markers instead of a separate "you are here" dot.
  for (const { usage, marker, markerFill } of services) {
    const currentUsed = 100 - remainingPct(usage.current, usage.limit);
    const xNow = ox + (todayPlotDay / days) * chartWidth;
    const yNow = oy + CHART_HEIGHT * (currentUsed / 100);

    ctx.fillStyle = markerFill;
    if (marker === "circle") {
      ctx.beginPath();
      ctx.arc(xNow, yNow, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (marker === "diamond") {
      const r = 9;
      ctx.beginPath();
      ctx.moveTo(xNow, yNow - r);
      ctx.lineTo(xNow + r, yNow);
      ctx.lineTo(xNow, yNow + r);
      ctx.lineTo(xNow - r, yNow);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Small service icons next to the current markers. Ranked by current y so the
  // higher line gets its icon above the dot and the lower line gets its icon
  // below, preventing overlap while keeping each icon close to its line.
  const rankedServices = [...services]
    .map((service) => {
      const currentUsed = 100 - remainingPct(service.usage.current, service.usage.limit);
      const xNow = ox + (todayPlotDay / days) * chartWidth;
      const yNow = oy + CHART_HEIGHT * (currentUsed / 100);
      return { ...service, xNow, yNow };
    })
    .sort((a, b) => a.yNow - b.yNow);

  const lineIconHeight = 52;
  const lineIconGap = 8;
  for (let i = 0; i < rankedServices.length; i++) {
    const { icon, xNow, yNow } = rankedServices[i];
    const iconWidth = (icon.width / icon.height) * lineIconHeight;
    const iconX = xNow + lineIconGap;
    const iconY =
      i === 0
        ? yNow - lineIconHeight - lineIconGap
        : yNow + lineIconGap;
    ctx.drawImage(icon, iconX, iconY, iconWidth, lineIconHeight);
  }

  // Service labels, top-right: "<current>/<limit> m <icon>" on one line,
  // right-justified, icon on the far right.
  const valueX = PADDING_X + panelWidth - 24;
  const rowHeight = 64;
  for (let i = 0; i < services.length; i++) {
    const { usage, icon, status } = services[i];
    const valueY = CHART_TOP + 12 + i * rowHeight;
    const panelColor = statusColor(status);

    const numberText = `${usage.current}/${usage.limit}`;
    const unitText = "m";

    ctx.font = "900 52px sans-serif";
    const numberWidth = ctx.measureText(numberText).width;
    ctx.font = "500 36px sans-serif";
    const unitWidth = ctx.measureText(unitText).width;

    const iconHeight = 52;
    const iconWidth = (icon.width / icon.height) * iconHeight;
    const iconGap = 16;
    const unitGap = 8;

    const iconX = valueX - iconWidth;
    const unitX = iconX - iconGap;
    const numberX = unitX - unitWidth - unitGap;

    // Align number, unit and icon on a common bottom edge.
    const baselineY = valueY + 52;

    // Fire icon for STOP status, to the left of the minutes.
    if (status === "stop" && fireIcon) {
      const fireHeight = 52;
      const fireWidth = (fireIcon.width / fireIcon.height) * fireHeight;
      const fireGap = 8;
      const fireX = numberX - numberWidth - fireGap - fireWidth;
      ctx.drawImage(
        fireIcon,
        fireX,
        baselineY - fireHeight,
        fireWidth,
        fireHeight
      );
    }

    // Number (e.g. "647/2000")
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = panelColor;
    ctx.font = "900 52px sans-serif";
    ctx.fillText(numberText, numberX, baselineY);

    // Unit "m"
    ctx.fillStyle = COLORS.text;
    ctx.font = "500 36px sans-serif";
    ctx.textBaseline = "bottom";
    ctx.fillText(unitText, unitX, baselineY);

    // Service icon on the far right, bottom-aligned with the text
    ctx.drawImage(icon, iconX, baselineY - iconHeight, iconWidth, iconHeight);
  }

  ctx.restore();
}

/**
 * Draw a PR-count histogram overlaid at the bottom of the chart area.
 */
function drawCombinedOverlayHistogram(ctx, ox, chartWidth, usage, now, prCounts) {
  const today = now.toISOString().slice(0, 10);
  const days = usage.periodDays;
  const todayRawIndex = Math.min(
    dayDiff(usage.periodStartDate, today),
    days - 1
  );

  const FUTURE_PLACEHOLDER_HEIGHT = 6;
  // Share the graph's horizontal axis (100% used / 0% remaining line).
  const histogramBottom = CHART_BOTTOM;
  const histogramLeft = ox;
  const histogramRight = ox + chartWidth;
  const histogramWidth = chartWidth;
  // Histogram bars occupy day columns 1..days; day 0 has no bar.
  const dayWidth = histogramWidth / days;
  const barWidth = dayWidth * 0.5;

  // Scale so the tallest bar reaches the 50% level of the chart area.
  const maxCount = Math.max(...prCounts.map((c) => c.count), 1);
  const maxBarHeight = CHART_HEIGHT * 0.5;

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(histogramLeft, histogramBottom);
  ctx.lineTo(histogramRight, histogramBottom);
  ctx.stroke();

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const entry = prCounts.find((c) => c.dayIndex === dayIndex);
    const count = entry?.count ?? 0;
    // Bars sit at the right edge of each day column, aligned with the line
    // points and the "you are here" dot.
    const x = histogramLeft + (dayIndex + 1) * dayWidth;

    let height;
    let fill;
    if (dayIndex > todayRawIndex) {
      height = FUTURE_PLACEHOLDER_HEIGHT;
      fill = COLORS.histogramFuture;
    } else {
      height = (count / maxCount) * maxBarHeight;
      fill = dayIndex === todayRawIndex ? COLORS.green : COLORS.histogramPast;
    }

    if (height <= 0) continue;
    ctx.fillStyle = fill;
    ctx.fillRect(x - barWidth / 2, histogramBottom - height, barWidth, height);
  }
}

/**
 * Render a single wide burndown panel with both services overlaid.
 *
 * @param {UsageRecord} github
 * @param {UsageRecord} netlify
 * @param {SeriesEntry[]} series
 * @param {Date} [now]
 * @param {{dayIndex: number, count: number}[]} [prCounts]
 * @param {{github: "good"|"watch"|"throttle"|"stop", netlify: "good"|"watch"|"throttle"|"stop", overall: "good"|"watch"|"throttle"|"stop"}} statuses
 * @returns {Promise<Buffer>}
 */
export async function renderCombinedBurndown(
  github,
  netlify,
  series,
  now = new Date(),
  prCounts = [],
  statuses
) {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const [githubIcon, netlifyIcon, fireIcon] = await Promise.all([
    loadImage(resolve(__dirname, "icons/github.png")),
    loadImage(resolve(__dirname, "icons/netlify.png")),
    loadImage(resolve(__dirname, "icons/fire.png")),
  ]);

  const enrichedGithub = { ...github, periodDays: periodDays(github) };
  const enrichedNetlify = { ...netlify, periodDays: periodDays(netlify) };

  const panelWidth = CANVAS_WIDTH - 2 * PADDING_X;

  const githubPoints = buildPoints(series, "githubMinutes", enrichedGithub, now);
  const netlifyPoints = buildPoints(
    series,
    "netlifyCurrent",
    enrichedNetlify,
    now
  );

  drawCombinedPanel(
    ctx,
    panelWidth,
    githubIcon,
    netlifyIcon,
    fireIcon,
    enrichedGithub,
    enrichedNetlify,
    githubPoints,
    netlifyPoints,
    series,
    now,
    prCounts,
    statuses
  );

  return canvas.toBuffer("image/png");
}

/**
 * Functions exported purely for unit testing. Not part of the public API.
 */
export const exportedForTesting = {
  buildPoints,
  drawHistogram,
  statusColor,
};
