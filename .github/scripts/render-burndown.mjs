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

import { createCanvas } from "canvas";

/**
 * @typedef {import("./monitor-resources.mjs").UsageRecord} UsageRecord
 * @typedef {import("./monitor-resources.mjs").SeriesEntry} SeriesEntry
 */

const COLORS = {
  background: "#0f172a",
  panelBg: "#1e293b",
  text: "#f8fafc",
  muted: "#94a3b8",
  grid: "#334155",
  diagonal: "#64748b",
  youAreHere: "#f8fafc",
  green: "#4ade80",
  yellow: "#facc15",
  red: "#f87171",
};

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const PADDING_X = 32;
const PADDING_Y = 24;
const GAP = 32;
const PANEL_WIDTH = (CANVAS_WIDTH - 2 * PADDING_X - GAP) / 2;
const PANEL_HEIGHT = CANVAS_HEIGHT - 2 * PADDING_Y;
const HEADER_HEIGHT = 72;
const CHART_TOP = HEADER_HEIGHT + 16;
const CHART_BOTTOM = PANEL_HEIGHT - 56;
const CHART_LEFT = 72;
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
function dayDiff(startStr, dateStr) {
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
 * Draw one panel.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} originX
 * @param {string} serviceName
 * @param {UsageRecord} usage
 * @param {{date: string, dayIndex: number, remaining: number}[]} points
 * @param {Date} now
 */
function drawPanel(ctx, originX, serviceName, usage, points, now) {
  const today = now.toISOString().slice(0, 10);
  const days = usage.periodDays;
  const todayIndex = Math.min(dayDiff(usage.periodStartDate, today), days - 1);

  // Panel background
  ctx.save();
  ctx.fillStyle = COLORS.panelBg;
  roundRect(ctx, originX, 0, PANEL_WIDTH, PANEL_HEIGHT, 16);
  ctx.fill();

  // Header
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(serviceName, originX + 24, HEADER_HEIGHT / 2);

  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(
    `${usage.current}/${usage.limit} min`,
    originX + PANEL_WIDTH - 24,
    HEADER_HEIGHT / 2
  );

  // Chart origin
  const ox = originX + CHART_LEFT;
  const oy = CHART_TOP;

  // Gridlines and Y-axis labels
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = COLORS.muted;
  ctx.font = "18px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const pct of [0, 25, 50, 75, 100]) {
    const y = oy + CHART_HEIGHT * (1 - pct / 100);
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox + CHART_WIDTH, y);
    ctx.stroke();
    ctx.fillText(`${pct}`, ox - 10, y);
  }

  // X-axis labels
  ctx.fillStyle = COLORS.muted;
  ctx.font = "16px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(formatDate(usage.periodStartDate), ox, CHART_BOTTOM + 10);
  ctx.textAlign = "right";
  ctx.fillText(
    formatDate(usage.periodEndDate),
    ox + CHART_WIDTH,
    CHART_BOTTOM + 10
  );

  // Critical-pace diagonal (full → 0)
  ctx.strokeStyle = COLORS.diagonal;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + CHART_WIDTH, oy + CHART_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  // Actual-remaining line, coloured per segment
  if (points.length >= 2) {
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const consumed = 100 - curr.remaining;
      const projected = projectedEndPct(consumed, curr.dayIndex + 1, days);
      const color = COLORS[paceBucket(projected)];

      const x1 = ox + (prev.dayIndex / (days - 1)) * CHART_WIDTH;
      const y1 = oy + CHART_HEIGHT * (prev.remaining / 100);
      const x2 = ox + (curr.dayIndex / (days - 1)) * CHART_WIDTH;
      const y2 = oy + CHART_HEIGHT * (curr.remaining / 100);

      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // You-are-here line + dot
  const xNow = ox + (todayIndex / (days - 1)) * CHART_WIDTH;
  ctx.strokeStyle = COLORS.youAreHere;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xNow, oy);
  ctx.lineTo(xNow, CHART_BOTTOM);
  ctx.stroke();

  const currentRemaining = remainingPct(usage.current, usage.limit);
  const yNow = oy + CHART_HEIGHT * (currentRemaining / 100);
  ctx.fillStyle = COLORS.youAreHere;
  ctx.beginPath();
  ctx.arc(xNow, yNow, 8, 0, Math.PI * 2);
  ctx.fill();

  // Projection from today to period-end
  const projectedConsumed = 100 - currentRemaining;
  const projected = projectedEndPct(projectedConsumed, todayIndex + 1, days);
  const projectionColor = COLORS[paceBucket(projected)];
  ctx.strokeStyle = projectionColor;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.moveTo(xNow, yNow);
  ctx.lineTo(ox + CHART_WIDTH, oy + CHART_HEIGHT * Math.max(0, 100 - projected) / 100);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

/**
 * Format an ISO date as `DD Mon`.
 *
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  const d = new Date(isoDate);
  return `${d.getUTCDate()} ${d.toLocaleString("en-GB", {
    month: "short",
    timeZone: "UTC",
  })}`;
}

/**
 * Render the burndown chart as a PNG buffer.
 *
 * @param {UsageRecord} github
 * @param {UsageRecord} netlify
 * @param {SeriesEntry[]} series
 * @param {Date} [now]
 * @returns {Buffer}
 */
export function renderBurndown(github, netlify, series, now = new Date()) {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const enrichedGithub = { ...github, periodDays: periodDays(github) };
  const enrichedNetlify = { ...netlify, periodDays: periodDays(netlify) };

  const githubPoints = buildPoints(series, "githubMinutes", enrichedGithub, now);
  const netlifyPoints = buildPoints(
    series,
    "netlifyCurrent",
    enrichedNetlify,
    now
  );

  drawPanel(ctx, PADDING_X, "GitHub", enrichedGithub, githubPoints, now);
  drawPanel(
    ctx,
    PADDING_X + PANEL_WIDTH + GAP,
    "Netlify",
    enrichedNetlify,
    netlifyPoints,
    now
  );

  return canvas.toBuffer("image/png");
}
