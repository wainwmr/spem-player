// Per-worktree dev/preview port offset, so multiple agent worktrees can
// run their dev/preview servers at once without colliding.
//
// Each worktree declares its own offset, resolved in order from:
//   1. the SPEM_PORT_OFFSET environment variable, if set; otherwise
//   2. a gitignored `.worktree-offset` file at the worktree root, found by
//      walking up from this module, holding just the number.
// Anything that declares neither — CI, forks, a fresh clone, the main
// checkout — gets offset 0 and the default ports, so config evaluation
// can never fail on an unrecognised checkout.
//
// The file fallback exists because the environment variable is not
// reliably delivered to programmatically-spawned processes (IDE task
// runners, test harnesses); a child may never see SPEM_PORT_OFFSET. The
// file is resolved by walking up from this module's own location (not the
// process cwd) to the worktree root, so it is correct however the process
// was launched and wherever the module sits in the tree. The
// offset is the worktree's own fact to declare; we do not infer it from
// the directory name (CI checks out into `spem-player`, a fork could be
// named anything — the name is an unreliable proxy).
//
// vite.config.ts and playwright.config.ts read DEV_PORT / PREVIEW_PORT at
// config-eval time; the offset is resolved once here at module load.

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Read the raw offset from the nearest `.worktree-offset` file, walking up
 * from this module to the worktree root.
 *
 * @param metaUrl - module URL to resolve against (defaults to this module's
 *   own `import.meta.url`). Walking up from the module location, not
 *   `process.cwd()`, keeps it correct however the process was launched and
 *   wherever the module sits in the tree (the file lives at the worktree
 *   root; this module is under packages/pwa/ after the monorepo move, #620).
 * @returns the trimmed contents of the first `.worktree-offset` found in the
 *   module's directory or an ancestor up to and including the worktree root
 *   (the dir holding `.git`), or `undefined` when none exists (CI, forks, the
 *   main checkout) or it is unreadable. Never throws.
 */
export function readWorktreeOffset(
  metaUrl: string = import.meta.url,
): string | undefined {
  let dir = dirname(fileURLToPath(metaUrl));
  for (;;) {
    const candidate = resolve(dir, ".worktree-offset");
    if (existsSync(candidate)) {
      try {
        return readFileSync(candidate, "utf-8").trim();
      } catch {
        return undefined; // present but unreadable: degrade to default
      }
    }
    // Ceiling: the offset is a worktree-scoped fact, so stop the walk at the
    // worktree root — the directory holding `.git` (a directory in the main
    // checkout, a file in a linked worktree; existsSync covers both) — rather
    // than escaping above it and inheriting a stray ancestor's offset.
    if (existsSync(resolve(dir, ".git"))) return undefined;
    // Filesystem-root backstop: a checkout that is not a git tree at all (a
    // tarball export, a degraded CI checkout with no `.git` anywhere) still
    // terminates here at offset 0, preserving the never-throw guarantee. Left
    // deliberately unit-untested — reaching it requires a real filesystem root,
    // and mocking `dirname` to fake one is more brittle than the two-line guard.
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/**
 * Parse a raw offset value to a non-negative integer, returning `0` when it
 * is undefined, empty, or not a valid non-negative integer. Pure — no
 * environment or filesystem access — so it is deterministic in every
 * worktree and is the unit the value-case tests target.
 */
export const parseOffset = (raw: string | undefined): number => {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
};

/**
 * Resolve the per-worktree port offset from `SPEM_PORT_OFFSET`, falling
 * back to a `.worktree-offset` file found by walking up from this module, then
 * parse it via {@link parseOffset}.
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
): number => parseOffset(raw);

export const DEV_PORT = 5173 + portOffset();
export const PREVIEW_PORT = 4173 + portOffset();
