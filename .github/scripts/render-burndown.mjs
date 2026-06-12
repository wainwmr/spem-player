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
    const dayIndex = dayDiff(usage.periodStartDate, entry.date);
    if (dayIndex < 0 || dayIndex >= usage.periodDays) continue;
    points.push({
      date: entry.date,
      dayIndex,
      remaining: remainingPct(value, usage.limit),
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
 * Classify a projected end-of-period percentage against the critical-pace
 * diagonal. Mirrors monitor-resources.mjs paceBucket for offline rendering.
 *
 * @param {number} projectedPct
 * @returns {"green"|"yellow"|"red"}
 */
function paceBucket(projectedPct) {
  if (projectedPct > 100) return "red";
  if (projectedPct >= 90) return "yellow";
  return "green";
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
 * @param {UsageRecord} usage
 * @param {{date: string, dayIndex: number, remaining: number}[]} points
 * @param {Date} now
 */
function drawPanel(ctx, originX, icon, usage, points, now) {
  const today = now.toISOString().slice(0, 10);
  const days = usage.periodDays;
  const todayIndex = Math.min(dayDiff(usage.periodStartDate, today), days - 1);

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
  const projected = projectedEndPct(currentUsed, todayIndex + 1, days);
  const projectionColor = COLORS[paceBucket(projected)];

  ctx.fillStyle = projectionColor;
  ctx.font = "900 52px sans-serif";
  ctx.fillText(`${usage.current}/${usage.limit}`, valueX, valueY);

  ctx.fillStyle = COLORS.text;
  ctx.font = "500 36px sans-serif";
  ctx.fillText("mins", valueX, valueY + 54);

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
      const consumed = 100 - curr.remaining;
      const projected = projectedEndPct(consumed, curr.dayIndex + 1, days);
      const color = COLORS[paceBucket(projected)];

      const x1 = ox + (prev.dayIndex / (days - 1)) * CHART_WIDTH;
      const y1 = oy + CHART_HEIGHT * (1 - prev.remaining / 100);
      const x2 = ox + (curr.dayIndex / (days - 1)) * CHART_WIDTH;
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

  // Projection from today to period-end (drawn before the dot so the dot sits on top)
  const xNow = ox + (todayIndex / (days - 1)) * CHART_WIDTH;
  const yNow = oy + CHART_HEIGHT * (currentUsed / 100);
  ctx.strokeStyle = projectionColor;
  ctx.lineWidth = 7;
  ctx.setLineDash([2, 8]);
  ctx.beginPath();
  ctx.moveTo(xNow, yNow);
  ctx.lineTo(ox + CHART_WIDTH, oy + CHART_HEIGHT * Math.min(100, projected) / 100);
  ctx.stroke();
  ctx.setLineDash([]);

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
  const todayIndex = Math.min(dayDiff(usage.periodStartDate, today), days - 1);

  const HISTOGRAM_MAX_COUNT = 15; // observed month max
  const FUTURE_PLACEHOLDER_HEIGHT = 6;
  const histogramTop = PANEL_HEIGHT + PADDING_Y;
  const histogramBottom = CANVAS_HEIGHT - PADDING_Y;
  const histogramHeight = histogramBottom - histogramTop;
  const histogramLeft = PADDING_X + CHART_LEFT;
  const histogramRight =
    PADDING_X + PANEL_WIDTH + GAP + CHART_RIGHT;
  const histogramWidth = histogramRight - histogramLeft;
  const dayWidth = histogramWidth / (days - 1);
  const barWidth = Math.min(dayWidth * 0.7, 18);

  // Bar centres are inset so the first bar starts at histogramLeft and the
  // last bar ends at histogramRight.
  const slotWidth = (histogramWidth - barWidth) / (days - 1);

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
    const x = histogramLeft + barWidth / 2 + dayIndex * slotWidth;

    let height;
    let fill;
    if (dayIndex > todayIndex) {
      height = FUTURE_PLACEHOLDER_HEIGHT;
      fill = COLORS.histogramFuture;
    } else {
      height = Math.min(count / HISTOGRAM_MAX_COUNT, 1) * histogramHeight;
      fill = dayIndex === todayIndex ? COLORS.green : COLORS.histogramPast;
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
 * @returns {Promise<Buffer>}
 */
export async function renderBurndown(
  github,
  netlify,
  series,
  now = new Date(),
  prCounts = []
) {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  // White outer background; panels are also filled white.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const [githubIcon, netlifyIcon] = await Promise.all([
    loadImage(resolve(__dirname, "icons/github.png")),
    loadImage(resolve(__dirname, "icons/netlify.png")),
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

  drawPanel(ctx, PADDING_X, githubIcon, enrichedGithub, githubPoints, now);
  drawPanel(
    ctx,
    PADDING_X + PANEL_WIDTH + GAP,
    netlifyIcon,
    enrichedNetlify,
    netlifyPoints,
    now
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
 * Functions exported purely for unit testing. Not part of the public API.
 */
export const exportedForTesting = {
  drawHistogram,
};
