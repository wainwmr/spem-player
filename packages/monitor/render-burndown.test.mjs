import { test } from "node:test";
import assert from "node:assert/strict";
import { renderBurndown, exportedForTesting } from "./render-burndown.mjs";

const { drawHistogram, statusColor, drawThrottleCurve, CHART_WIDTH, CHART_HEIGHT } =
  exportedForTesting;

const statuses = { github: "good", netlify: "watch", overall: "watch" };

const github = {
  current: 500,
  limit: 2000,
  periodStartDate: "2026-06-01",
  periodEndDate: "2026-06-30",
};

const netlify = {
  current: 100,
  limit: 300,
  periodStartDate: "2026-06-01",
  periodEndDate: "2026-06-30",
};

const series = [
  { date: "2026-06-01", netlifyCurrent: 10, githubMinutes: 50, source: "backfill" },
  { date: "2026-06-05", netlifyCurrent: 40, githubMinutes: 200, source: "backfill" },
  { date: "2026-06-10", netlifyCurrent: 100, githubMinutes: 500, source: "logged" },
];

test("renderBurndown returns a non-empty PNG buffer with correct dimensions", async () => {
  const now = new Date("2026-06-10T12:00:00Z");
  const png = await renderBurndown(github, netlify, series, now, [], statuses);
  assert.ok(Buffer.isBuffer(png));
  assert.ok(png.length > 0);
  assert.equal(png.toString("hex", 0, 8), "89504e470d0a1a0a"); // PNG magic bytes
  // 1200 x 600 canvas → IHDR width/height big-endian at bytes 16-24
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 600);
});

test("renderBurndown handles empty series using current usage only", async () => {
  const now = new Date("2026-06-15T12:00:00Z");
  const png = await renderBurndown(github, netlify, [], now, [], statuses);
  assert.ok(Buffer.isBuffer(png));
  assert.ok(png.length > 0);
});

test("renderBurndown tolerates null Netlify values", async () => {
  const sparse = [
    { date: "2026-06-01", netlifyCurrent: null, githubMinutes: 50, source: "backfill" },
    { date: "2026-06-10", netlifyCurrent: 100, githubMinutes: 500, source: "logged" },
  ];
  const now = new Date("2026-06-10T12:00:00Z");
  const png = await renderBurndown(github, netlify, sparse, now, [], statuses);
  assert.ok(Buffer.isBuffer(png));
  assert.ok(png.length > 0);
});

function createMockCtx() {
  return {
    strokeStyle: "",
    lineWidth: 0,
    fillStyle: "",
    operations: [],
    beginPath() {
      this.operations.push({ type: "beginPath" });
    },
    moveTo(x, y) {
      this.operations.push({ type: "moveTo", x, y });
    },
    lineTo(x, y) {
      this.operations.push({ type: "lineTo", x, y });
    },
    stroke() {
      this.operations.push({ type: "stroke" });
    },
    fillRect(x, y, w, h) {
      this.operations.push({ type: "fillRect", x, y, w, h, fill: this.fillStyle });
    },
  };
}

// drawThrottleCurve: the rate-relative pace reference (#724), replacing the
// straight critical-pace diagonal.
test("drawThrottleCurve draws a sampled polyline from top-left to bottom-right", () => {
  const ctx = createMockCtx();
  const ox = 100;
  const oy = 50;
  drawThrottleCurve(ctx, ox, oy);

  const moves = ctx.operations.filter((op) => op.type === "moveTo");
  const lines = ctx.operations.filter((op) => op.type === "lineTo");
  assert.equal(moves.length, 1, "one moveTo starts the polyline");
  assert.ok(
    lines.length > 2,
    "a sampled curve has many segments, not one diagonal segment"
  );

  // Starts at the chart origin (top-left).
  assert.equal(moves[0].x, ox);
  assert.equal(moves[0].y, oy);

  // Ends at the bottom-right corner of the chart area.
  const last = lines[lines.length - 1];
  assert.ok(Math.abs(last.x - (ox + CHART_WIDTH)) < 1e-9);
  assert.ok(Math.abs(last.y - (oy + CHART_HEIGHT)) < 1e-9);

  // Bows above the diagonal: at the horizontal midpoint the curve sits above the
  // straight diagonal (less used than the linear pace), so its y is above the midline.
  const mid = lines.find((op) => Math.abs(op.x - (ox + CHART_WIDTH / 2)) < 1e-9);
  assert.ok(mid, "a sample sits at the horizontal midpoint");
  assert.ok(
    mid.y < oy + CHART_HEIGHT / 2,
    "curve bows above the diagonal midpoint"
  );
});

test("drawHistogram draws a baseline and bars for past days with PRs", () => {
  const ctx = createMockCtx();
  const usage = {
    current: 100,
    limit: 1000,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
    periodDays: 30,
  };
  const now = new Date("2026-06-05T12:00:00Z");
  drawHistogram(ctx, usage, now, [{ dayIndex: 0, count: 3 }]);

  const baseline = ctx.operations.find(
    (op) => op.type === "moveTo" && op.x > 0
  );
  assert.ok(baseline, "baseline moveTo should exist");

  const bars = ctx.operations.filter((op) => op.type === "fillRect");
  assert.ok(bars.length > 0, "at least one bar should be drawn");
  assert.ok(
    bars.some((bar) => bar.fill === "#8995a5"),
    "past bar should use histogramPast colour"
  );
});

test("drawHistogram highlights today in green", () => {
  const ctx = createMockCtx();
  const usage = {
    current: 100,
    limit: 1000,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
    periodDays: 30,
  };
  const now = new Date("2026-06-05T12:00:00Z");
  drawHistogram(ctx, usage, now, [{ dayIndex: 4, count: 2 }]);

  const todayBar = ctx.operations.find(
    (op) => op.type === "fillRect" && op.fill === "#16a34a"
  );
  assert.ok(todayBar, "today's bar should be green");
});

test("drawHistogram draws tiny placeholders for future days", () => {
  const ctx = createMockCtx();
  const usage = {
    current: 100,
    limit: 1000,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
    periodDays: 30,
  };
  const now = new Date("2026-06-05T12:00:00Z");
  drawHistogram(ctx, usage, now, []);

  const futureBars = ctx.operations.filter(
    (op) => op.type === "fillRect" && op.fill === "#cbd5e1"
  );
  assert.ok(futureBars.length > 0, "future placeholders should be drawn");
  assert.ok(
    futureBars.every((bar) => bar.h === 6),
    "future placeholders should be 6 px tall"
  );
});

test("drawHistogram skips days with zero PRs", () => {
  const ctx = createMockCtx();
  const usage = {
    current: 100,
    limit: 1000,
    periodStartDate: "2026-06-01",
    periodEndDate: "2026-06-30",
    periodDays: 30,
  };
  const now = new Date("2026-06-05T12:00:00Z");
  drawHistogram(ctx, usage, now, [{ dayIndex: 0, count: 0 }]);

  const pastBars = ctx.operations.filter(
    (op) => op.type === "fillRect" && op.fill === "#8995a5"
  );
  assert.equal(pastBars.length, 0, "zero-count past day should not draw a bar");
});

// statusColor: maps named statuses to chart colours

test("statusColor maps each status to the expected colour", () => {
  assert.equal(statusColor("good"), "#16a34a");
  assert.equal(statusColor("watch"), "#ca8a04");
  assert.equal(statusColor("throttle"), "#dc2626");
  assert.equal(statusColor("stop"), "#dc2626");
});

test("statusColor falls back to green for unknown status", () => {
  assert.equal(statusColor("unknown"), "#16a34a");
});
