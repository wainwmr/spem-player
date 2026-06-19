import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ensureLf, toLf } from "../../build/build-ohm.mjs";

/**
 * Guards the `build:ohm` CRLF normalisation step (#648, a #611 recurrence).
 *
 * #611 pinned `*.ohm text eol=lf` in `.gitattributes`, which keeps *fresh*
 * checkouts LF. But a worktree that already held a CRLF `ly-grammar.ohm`
 * keeps it: git normalises CRLF to LF when diffing against the LF blob, so
 * the file reads clean and `git checkout --` never rewrites it. An agent
 * building from such a worktree bakes `\r\n` into the bundle's `source`
 * literal. The fix is a normalisation step in `build:ohm` that forces the
 * grammar to LF before `ohm generateBundles` runs, regardless of worktree
 * state. These tests pin that step's behaviour and its wiring.
 *
 * Reads are relative to the pwa package cwd, matching ohm-eol.test.ts.
 */
describe("build:ohm CRLF guard (#648)", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ohm-eol-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("toLf converts CRLF and lone CR to LF", () => {
    expect(toLf("a\r\nb\rc\n")).toBe("a\nb\nc\n");
  });

  it("ensureLf rewrites a CRLF file to LF and reports the change", () => {
    const f = join(dir, "g.ohm");
    writeFileSync(f, 'Grammar {\r\n  x = "y"\r\n}\r\n');
    expect(ensureLf(f)).toBe(true);
    const out = readFileSync(f, "utf8");
    expect(out.includes("\r")).toBe(false);
    expect(out).toBe('Grammar {\n  x = "y"\n}\n');
  });

  it("ensureLf leaves an LF file untouched and reports no change", () => {
    const f = join(dir, "g.ohm");
    const lf = 'Grammar {\n  x = "y"\n}\n';
    writeFileSync(f, lf);
    expect(ensureLf(f)).toBe(false);
    expect(readFileSync(f, "utf8")).toBe(lf);
  });

  it("build:ohm normalises the grammar before generateBundles", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const script: string = pkg.scripts["build:ohm"];
    expect(
      script,
      "build:ohm must invoke the build-ohm normaliser (#648)"
    ).toContain("build-ohm.mjs");
    expect(script).toContain("generateBundles");
    expect(
      script.indexOf("build-ohm.mjs"),
      "the normaliser must run before generateBundles"
    ).toBeLessThan(script.indexOf("generateBundles"));
  });
});
