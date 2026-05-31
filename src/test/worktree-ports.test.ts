import { describe, it, expect } from "vitest";
import { portOffset, DEV_PORT, PREVIEW_PORT } from "../../worktree-ports.ts";

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

  it("returns 0 when SPEM_PORT_OFFSET is unset", () => {
    expect(portOffset(undefined)).toBe(0);
  });

  it("returns 0 for an empty or whitespace value", () => {
    expect(portOffset("")).toBe(0);
    expect(portOffset("   ")).toBe(0);
  });

  it("parses a valid non-negative integer offset", () => {
    expect(portOffset("0")).toBe(0);
    expect(portOffset("100")).toBe(100);
    expect(portOffset("400")).toBe(400);
  });

  it("falls back to 0 for malformed, negative, or non-integer values (never throws)", () => {
    // A mistyped offset must degrade to the default port rather than
    // throw at config-eval — a worktree's own setup error cannot then
    // break the build for CI, forks, or anyone else. A real collision
    // surfaces as EADDRINUSE at preview bind (strictPort) instead.
    expect(portOffset("abc")).toBe(0);
    expect(portOffset("1OO")).toBe(0); // letter O, not zeros
    expect(portOffset("-100")).toBe(0);
    expect(portOffset("10.5")).toBe(0);
  });
});
