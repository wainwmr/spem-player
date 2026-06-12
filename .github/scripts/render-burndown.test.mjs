import { test } from "node:test";
import assert from "node:assert/strict";
import { renderBurndown } from "./render-burndown.mjs";

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
  const png = await renderBurndown(github, netlify, series, now);
  assert.ok(Buffer.isBuffer(png));
  assert.ok(png.length > 0);
  assert.equal(png.toString("hex", 0, 8), "89504e470d0a1a0a"); // PNG magic bytes
  // 1200 x 600 canvas → IHDR width/height big-endian at bytes 16-24
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 600);
});

test("renderBurndown handles empty series using current usage only", async () => {
  const now = new Date("2026-06-15T12:00:00Z");
  const png = await renderBurndown(github, netlify, [], now);
  assert.ok(Buffer.isBuffer(png));
  assert.ok(png.length > 0);
});

test("renderBurndown tolerates null Netlify values", async () => {
  const sparse = [
    { date: "2026-06-01", netlifyCurrent: null, githubMinutes: 50, source: "backfill" },
    { date: "2026-06-10", netlifyCurrent: 100, githubMinutes: 500, source: "logged" },
  ];
  const now = new Date("2026-06-10T12:00:00Z");
  const png = await renderBurndown(github, netlify, sparse, now);
  assert.ok(Buffer.isBuffer(png));
  assert.ok(png.length > 0);
});
