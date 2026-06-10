import { vi } from "vitest";
import { makeFixtureSvg } from "./fixtureScore";

// `virtual:pwa-register` is supplied by vite-plugin-pwa at build time only, not
// under Vitest. Any suite that transitively imports index.ts (-> pwa-update.ts)
// would otherwise fail at import: Node's path layer rejects the unresolved id
// `file:///@vite-plugin-pwa/virtual:pwa-register` on Windows (POSIX tolerates
// the drive-letter-less path, Windows does not). A global stub keeps every suite
// importable; pwa-update-toast.test.ts hoists its own vi.mock, which takes
// precedence where it needs the registration callback. See ticket #530.
vi.mock("virtual:pwa-register", () => ({ registerSW: () => () => {} }));

// MusicScore.#loadSvg() checks `MusicScore.testSvgLoader` (static,
// preferred) first and falls back to `globalThis.__SPEM_TEST_SVG_LOADER`.
// We install the global here rather than the static because several test
// files call `vi.resetModules()` and re-import MusicScore — the static
// property would be lost on the re-import, but the global property
// survives. See MusicScore.ts:#loadSvg for the resolution order.
// The ambient `declare global` in src/ts/common.ts types this slot.
globalThis.__SPEM_TEST_SVG_LOADER = (scoreType) => makeFixtureSvg(scoreType);
