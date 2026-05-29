import { makeFixtureSvg } from "./fixtureScore";

// MusicScore.#loadSvg() checks `MusicScore.testSvgLoader` (static,
// preferred) first and falls back to `globalThis.__SPEM_TEST_SVG_LOADER`.
// We install the global here rather than the static because several test
// files call `vi.resetModules()` and re-import MusicScore — the static
// property would be lost on the re-import, but the global property
// survives. See MusicScore.ts:#loadSvg for the resolution order.
(globalThis as any).__SPEM_TEST_SVG_LOADER = (scoreType: string) =>
  makeFixtureSvg(scoreType);
