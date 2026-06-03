// Per-worktree dev/preview port offset, so multiple agent worktrees can
// run their dev/preview servers at once without colliding.
//
// Each worktree declares its own offset, resolved in order from:
//   1. the SPEM_PORT_OFFSET environment variable, if set; otherwise
//   2. a gitignored `.worktree-offset` file beside this module, holding
//      just the number.
// Anything that declares neither — CI, forks, a fresh clone, the main
// checkout — gets offset 0 and the default ports, so config evaluation
// can never fail on an unrecognised checkout.
//
// The file fallback exists because the environment variable is not
// reliably delivered to programmatically-spawned processes (IDE task
// runners, test harnesses); a child may never see SPEM_PORT_OFFSET. The
// file is resolved relative to this module's own location, not the
// process cwd, so it is correct however the process was launched. The
// offset is the worktree's own fact to declare; we do not infer it from
// the directory name (CI checks out into `spem-player`, a fork could be
// named anything — the name is an unreliable proxy).
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

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Read the raw offset from a `.worktree-offset` file beside this module.
 *
 * @param metaUrl - module URL to resolve the file against (defaults to this
 *   module's own `import.meta.url`). Resolving against the module location,
 *   not `process.cwd()`, keeps it correct however the process was launched.
 * @returns the trimmed file contents, or `undefined` when the file is
 *   absent or unreadable. Never throws.
 */
export function readWorktreeOffset(
  metaUrl: string = import.meta.url,
): string | undefined {
  try {
    const dir = dirname(fileURLToPath(metaUrl));
    return readFileSync(resolve(dir, ".worktree-offset"), "utf-8").trim();
  } catch {
    return undefined;
  }
}

/**
 * Resolve the per-worktree port offset from `SPEM_PORT_OFFSET`, falling
 * back to a `.worktree-offset` file beside this module.
 *
 * @param raw - the raw offset value (defaults to
 *   `process.env.SPEM_PORT_OFFSET`, falling back to the `.worktree-offset`
 *   file when the variable is unset).
 * @returns the offset as a non-negative integer, or `0` when neither
 *   source is set, empty, or a valid non-negative integer.
 *
 * Never throws: a mistyped offset degrades to the default ports rather
 * than breaking config-eval for every command (test, build, lint). A
 * genuine collision between two worktrees surfaces instead as
 * EADDRINUSE at preview bind, where Playwright uses `strictPort`.
 */
export const portOffset = (
  raw: string | undefined = process.env.SPEM_PORT_OFFSET ??
    readWorktreeOffset(),
): number => {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
};

export const DEV_PORT = 5173 + portOffset();
export const PREVIEW_PORT = 4173 + portOffset();
