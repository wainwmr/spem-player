// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { processLilypond } from "../src/lily/lily";
import { serialise, loadLilyData } from "../src/lily/serialise";
import type { PlainLilypondData } from "../src/lily/serialise";

const spem = readFileSync(
  fileURLToPath(new URL("../src/Hugh Keyte/spem.ly", import.meta.url)),
  "utf-8"
);
const committed = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../src/lily/lilyData.json", import.meta.url)),
    "utf-8"
  )
) as PlainLilypondData;

describe("precomputed lily data (#693)", () => {
  it("parses spem.ly to the expected shape", () => {
    const data = processLilypond(spem);
    expect(data.barCount).toBe(139);
    expect(data.ranges.size).toBe(40); // 8 choirs * 5 parts
    expect(data.notesByQuant.size).toBeGreaterThan(0);
    expect(data.frLocations.length).toBeGreaterThan(0);
    for (let c = 0; c < 8; c++) {
      for (let p = 0; p < 5; p++) {
        const list = data.ranges.get(`${c}-${p}`)!;
        expect(list[list.length - 1].to).toBe(139);
      }
    }
  });

  it("loadLilyData is the exact inverse of serialise (golden equivalence)", () => {
    // The load-bearing guard: the precompute reproduces the runtime parse exactly.
    // toEqual (not toStrictEqual) so a Note-instance leaf equals its plain shape.
    const data = processLilypond(spem);
    const reloaded = loadLilyData(serialise(data));
    expect(reloaded).toEqual(data);
  });

  it("the committed lilyData.json is current (regenerated from spem.ly)", () => {
    // Fails loudly if spem.ly or the parser changed without rerunning
    // `pnpm --filter @spem/scores build:lilydata`. This is what keeps the
    // shipped constant honest.
    const fresh = serialise(processLilypond(spem));
    expect(committed).toEqual(fresh);
  });

  it("loaded data exposes the runtime-read fields as plain values", () => {
    const loaded = loadLilyData(committed);
    expect(loaded.barCount).toBe(139);
    // notesByQuant leaves carry a plain duration.sfths (the only note field the
    // runtime reads), not a Duration instance.
    const firstEntries = loaded.notesByQuant.values().next().value!;
    const sfths = firstEntries[0].n.duration?.sfths;
    expect(typeof sfths).toBe("number");
  });

  it("loadLilyData throws on malformed data (Vera 693-01)", () => {
    // The `as unknown as PlainLilypondData` cast at the pwa load site erases the
    // compiler's shape check; the loader validates its own input so a malformed
    // lilyData.json fails loudly at load, not as a deep undefined read later.
    expect(() => loadLilyData({} as unknown as PlainLilypondData)).toThrow(
      /malformed/
    );
    expect(() =>
      loadLilyData({
        notesByQuant: [],
        ranges: [],
        frLocations: [],
        barCount: "139",
      } as unknown as PlainLilypondData)
    ).toThrow(/malformed/);
  });
});
