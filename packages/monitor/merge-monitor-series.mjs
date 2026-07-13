/**
 * Value-preserving git merge driver for `.github/monitor-series.json` (#728).
 *
 * The series is accumulated, not regenerated: each run upserts only today's
 * entry. Two writers can target the same day with different `mergedPRs` — the
 * daily `main()` run writes the real count, the merge-time `refresh()` writes
 * `0` — and the `-X theirs` rebase in `push-with-rebase.sh` is content-blind,
 * so whichever push lands second overwrites the other's count (the daily count
 * lost to a `0`). This driver reconciles by value: for each day it keeps the
 * entry with the **larger** `mergedPRs`, so the richer count always survives a
 * concurrent rebase or merge. It is bound to the series path by `.gitattributes`
 * and registered per-checkout by the monitor workflows
 * (`git config merge.monitor-series.driver ...`).
 *
 * Git invokes it as `node merge-monitor-series.mjs %O %A %B %P`. In the rebase
 * that triggers it (`git rebase -X theirs FETCH_HEAD`) git replays our commit
 * onto the upstream tip, so `%A` is the **upstream/onto** side (the run that
 * landed first) and `%B` is the **replayed** commit (ours) — the inverse of a
 * plain merge's ours/theirs (see `push-with-rebase.sh`). The reconciliation is a
 * commutative union+max, so the result does not depend on which side is which;
 * the only ordering effect is the equal-count tie-break, which keeps the first
 * argument's entry. The merged result is written back to `%A`, exiting `0`; a
 * malformed input exits non-zero so the conflict surfaces loudly rather than
 * silently dropping data.
 *
 * Trade-off: the winner is kept **wholesale**, so on a `main`-vs-`refresh`
 * collision the entry with the real `mergedPRs` wins and the loser's possibly
 * fresher `overallStatus` is dropped. That is deliberate: a lost `mergedPRs` is
 * permanent (never backfilled), whereas `overallStatus` self-heals on the next
 * refresh and the throttle gate already tolerates day-scale staleness, so the
 * permanent-loss field is the one worth protecting. A field-wise merge would
 * need a per-entry write-freshness marker the series does not carry.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** @typedef {import("./monitor-resources.mjs").SeriesEntry} SeriesEntry */

/**
 * Merge two serialised monitor series, keeping the richer `mergedPRs` per day.
 *
 * For each `date` present in either side, one entry is emitted. When a date is
 * in both, the entry with the greater `mergedPRs` wins wholesale (so its
 * `summary.mergedPRs` stays internally consistent); an equal-count tie keeps the
 * first argument's entry. A union+max merge needs no common ancestor and never
 * invents a conflict. The result is sorted by date, matching `saveSeries`. The
 * producer guarantees one entry per day (`appendOrReplaceDay`); a hypothetical
 * intra-side duplicate would be deduped to its max here.
 *
 * Pure (text in, objects out): `main()` owns the file I/O and the
 * `JSON.stringify(..., null, 2) + "\n"` formatting that must match `saveSeries`.
 *
 * @param {string} oursText - The `%A` side as JSON text (an array of entries).
 * @param {string} theirsText - The `%B` side as JSON text.
 * @returns {SeriesEntry[]} The merged series, sorted ascending by `date`.
 * @throws {Error} If either side is not a JSON array.
 */
export function mergeSeries(oursText, theirsText) {
  const ours = JSON.parse(oursText);
  const theirs = JSON.parse(theirsText);
  if (!Array.isArray(ours) || !Array.isArray(theirs)) {
    throw new Error("monitor-series merge input must be a JSON array");
  }
  /** @type {Map<string, SeriesEntry>} */
  const byDate = new Map();
  // First argument first, so an equal-count tie keeps its entry (deterministic).
  for (const e of [...ours, ...theirs]) {
    const existing = byDate.get(e.date);
    if (!existing || (e.mergedPRs ?? 0) > (existing.mergedPRs ?? 0)) {
      byDate.set(e.date, e);
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Git merge-driver entry point. Reads `%A` and `%B`, writes the value-preserving
 * merge back to `%A`, and returns `0`.
 *
 * @param {string[]} argv - `process.argv`: `[node, script, %O, %A, %B, %P]`.
 * @returns {number} `0` on a clean merge.
 */
function main(argv) {
  const oursFile = argv[3]; // %A — the side merged into, and the output target.
  const theirsFile = argv[4]; // %B — the other side.
  // argv[2] is %O (ancestor); a union+max merge needs no base.
  const merged = mergeSeries(
    readFileSync(oursFile, "utf8"),
    readFileSync(theirsFile, "utf8")
  );
  writeFileSync(oursFile, JSON.stringify(merged, null, 2) + "\n", "utf8");
  return 0;
}

// Run only when invoked directly as the merge driver, not when imported by tests.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exit(main(process.argv));
  } catch (err) {
    console.error(`merge-monitor-series: ${err.message}`);
    process.exit(1);
  }
}
