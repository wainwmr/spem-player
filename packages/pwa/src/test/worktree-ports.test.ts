import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  parseOffset,
  portOffset,
  DEV_PORT,
  PREVIEW_PORT,
  readWorktreeOffset,
} from "../../worktree-ports.ts";

describe("worktree-ports", () => {
  it("DEV_PORT is exactly 1000 above PREVIEW_PORT (single shared offset)", () => {
    // The module-load constants depend on the process env at import, so
    // we assert the invariant between them rather than absolute values.
    expect(DEV_PORT - PREVIEW_PORT).toBe(1000);
  });

  it("DEV_PORT / PREVIEW_PORT apply the resolved offset to the base ports", () => {
    expect(DEV_PORT).toBe(5173 + portOffset());
    expect(PREVIEW_PORT).toBe(4173 + portOffset());
  });

  // The value-parse cases target the pure `parseOffset`, not `portOffset`:
  // calling `portOffset(undefined)` triggers its default parameter, which
  // reads the `.worktree-offset` file and makes the result worktree-dependent
  // (green in CI, red wherever an offset file exists). `parseOffset` has no
  // such default, so these stay deterministic in every worktree.
  it("parseOffset returns 0 for an undefined raw value", () => {
    expect(parseOffset(undefined)).toBe(0);
  });

  it("parseOffset returns 0 for an empty or whitespace value", () => {
    expect(parseOffset("")).toBe(0);
    expect(parseOffset("   ")).toBe(0);
  });

  it("parseOffset parses a valid non-negative integer offset", () => {
    expect(parseOffset("0")).toBe(0);
    expect(parseOffset("100")).toBe(100);
    expect(parseOffset("400")).toBe(400);
  });

  it("parseOffset falls back to 0 for malformed, negative, or non-integer values (never throws)", () => {
    // A mistyped offset must degrade to the default port rather than
    // throw at config-eval — a worktree's own setup error cannot then
    // break the build for CI, forks, or anyone else. A real collision
    // surfaces as EADDRINUSE at preview bind (strictPort) instead.
    expect(parseOffset("abc")).toBe(0);
    expect(parseOffset("1OO")).toBe(0); // letter O, not zeros
    expect(parseOffset("-100")).toBe(0);
    expect(parseOffset("10.5")).toBe(0);
  });
});

describe("readWorktreeOffset", () => {
  it("reads the trimmed offset from a .worktree-offset file in the module's own directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "wt-offset-"));
    try {
      writeFileSync(join(dir, ".worktree-offset"), "200\n");
      const moduleUrl = pathToFileURL(join(dir, "worktree-ports.ts")).href;
      expect(readWorktreeOffset(moduleUrl)).toBe("200");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reads the offset from an ancestor directory (walks up from the module)", () => {
    // The offset file lives at the worktree root, while the module sits under
    // packages/pwa/ after the monorepo move (#620). Resolution must walk up.
    const root = mkdtempSync(join(tmpdir(), "wt-offset-"));
    try {
      writeFileSync(join(root, ".worktree-offset"), "200\n");
      const moduleDir = join(root, "packages", "pwa");
      mkdirSync(moduleDir, { recursive: true });
      const moduleUrl = pathToFileURL(
        join(moduleDir, "worktree-ports.ts")
      ).href;
      expect(readWorktreeOffset(moduleUrl)).toBe("200");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("returns undefined when no .worktree-offset exists in the module dir or any ancestor up to the worktree root", () => {
    // Hermetic: a `.git` marker bounds the walk at the temp root, so the result
    // cannot depend on whether some real ancestor of tmpdir() happens to hold an
    // offset file (the convention is live on this machine).
    const root = mkdtempSync(join(tmpdir(), "wt-offset-"));
    try {
      writeFileSync(join(root, ".git"), "gitdir: /elsewhere\n");
      const moduleDir = join(root, "packages", "pwa");
      mkdirSync(moduleDir, { recursive: true });
      const moduleUrl = pathToFileURL(
        join(moduleDir, "worktree-ports.ts")
      ).href;
      expect(readWorktreeOffset(moduleUrl)).toBeUndefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("stops at the worktree root (a dir containing .git) and does not inherit an offset above it", () => {
    // The offset is a worktree-scoped fact: a stray .worktree-offset above the
    // worktree root must not leak into an offset-less worktree.
    const above = mkdtempSync(join(tmpdir(), "wt-offset-"));
    try {
      writeFileSync(join(above, ".worktree-offset"), "999\n");
      const worktree = join(above, "worktree");
      const moduleDir = join(worktree, "packages", "pwa");
      mkdirSync(moduleDir, { recursive: true });
      writeFileSync(join(worktree, ".git"), "gitdir: /elsewhere\n");
      const moduleUrl = pathToFileURL(
        join(moduleDir, "worktree-ports.ts")
      ).href;
      expect(readWorktreeOffset(moduleUrl)).toBeUndefined();
    } finally {
      rmSync(above, { recursive: true, force: true });
    }
  });

  it("returns the nearest .worktree-offset, not a farther ancestor's", () => {
    const root = mkdtempSync(join(tmpdir(), "wt-offset-"));
    try {
      writeFileSync(join(root, ".worktree-offset"), "200\n");
      const moduleDir = join(root, "packages", "pwa");
      mkdirSync(moduleDir, { recursive: true });
      writeFileSync(join(moduleDir, ".worktree-offset"), "30\n");
      const moduleUrl = pathToFileURL(
        join(moduleDir, "worktree-ports.ts")
      ).href;
      expect(readWorktreeOffset(moduleUrl)).toBe("30");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("returns undefined when .worktree-offset is present but unreadable (a directory)", () => {
    // existsSync() is true for a directory, but readFileSync() throws EISDIR;
    // the inner catch must degrade to undefined, not propagate.
    const dir = mkdtempSync(join(tmpdir(), "wt-offset-"));
    try {
      mkdirSync(join(dir, ".worktree-offset"));
      const moduleUrl = pathToFileURL(join(dir, "worktree-ports.ts")).href;
      expect(readWorktreeOffset(moduleUrl)).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("portOffset default-parameter composition", () => {
  // portOffset()'s default parameter resolves
  // `process.env.SPEM_PORT_OFFSET ?? readWorktreeOffset()` and parses it. These
  // pin that wiring — env precedence, then file fallback — without asserting an
  // absolute offset, so they hold in every worktree (the value-parse cases above
  // moved to `parseOffset` precisely to stay worktree-agnostic; this restores
  // coverage of the composition itself, which the move would otherwise drop).
  const original = process.env.SPEM_PORT_OFFSET;
  afterEach(() => {
    if (original === undefined) delete process.env.SPEM_PORT_OFFSET;
    else process.env.SPEM_PORT_OFFSET = original;
  });

  it("prefers SPEM_PORT_OFFSET over the .worktree-offset file", () => {
    process.env.SPEM_PORT_OFFSET = "100";
    expect(portOffset()).toBe(100);
  });

  it("falls back to the .worktree-offset file when SPEM_PORT_OFFSET is unset", () => {
    delete process.env.SPEM_PORT_OFFSET;
    expect(portOffset()).toBe(parseOffset(readWorktreeOffset()));
  });
});
