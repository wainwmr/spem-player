// Per-worktree dev/preview port offset, so multiple agent worktrees can
// run their dev/preview servers at once without colliding.
//
// Each worktree declares its own offset via the SPEM_PORT_OFFSET
// environment variable, set once in that worktree (its launch script or
// a gitignored .env.local). Anything that does NOT set it — CI, forks, a
// fresh clone, the main checkout — gets offset 0 and the default ports,
// so config evaluation can never fail on an unrecognised checkout
// directory. The offset is the worktree's own fact to declare; we do not
// infer it from the directory name (CI checks out into `spem-player`, a
// fork could be named anything — the name is an unreliable proxy).
//
// Suggested per-worktree values (offset -> dev / preview):
//   main / claude  0   -> 5173 / 4173
//   vera           100 -> 5273 / 4273
//   kimi           200 -> 5373 / 4373
//   copilot        300 -> 5473 / 4473
//   tele           400 -> 5573 / 4573
//
// vite.config.ts and playwright.config.ts read DEV_PORT / PREVIEW_PORT at
// config-eval time; the offset is resolved once here at module load.

/**
 * Resolve the per-worktree port offset from `SPEM_PORT_OFFSET`.
 *
 * @param raw - the raw env value (defaults to
 *   `process.env.SPEM_PORT_OFFSET`).
 * @returns the offset as a non-negative integer, or `0` when the
 *   variable is unset, empty, or not a valid non-negative integer.
 *
 * Never throws: a mistyped offset degrades to the default ports rather
 * than breaking config-eval for every command (test, build, lint). A
 * genuine collision between two worktrees surfaces instead as
 * EADDRINUSE at preview bind, where Playwright uses `strictPort`.
 */
export const portOffset = (
  raw: string | undefined = process.env.SPEM_PORT_OFFSET,
): number => {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
};

export const DEV_PORT = 5173 + portOffset();
export const PREVIEW_PORT = 4173 + portOffset();
