import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  parseArgs,
  buildPattern,
  rawNeedsRender,
  finalNeedsRebuild,
} from "../build/buildScores.mjs";

describe("parseArgs", () => {
  it("returns defaults when given no arguments", () => {
    const options = parseArgs([]);
    expect(options.version).toBe("Hugh Keyte");
    expect(options.notation).toBeNull();
    expect(options.choir).toBeUndefined();
  });

  it("parses --key=value syntax", () => {
    const options = parseArgs(["--version=OUP", "--notation=early"]);
    expect(options.version).toBe("OUP");
    expect(options.notation).toBe("early");
  });

  it("parses --key value syntax", () => {
    const options = parseArgs(["--version", "OUP", "--notation", "modern"]);
    expect(options.version).toBe("OUP");
    expect(options.notation).toBe("modern");
  });

  it("treats a bare --flag as boolean true", () => {
    const options = parseArgs(["--dry-run"]);
    expect(options["dry-run"]).toBe(true);
  });

  it("parses mixed key=value, key value, and boolean flags", () => {
    const options = parseArgs([
      "--version=OUP",
      "--notation",
      "early",
      "--dry-run",
      "--choir",
      "I A",
    ]);
    expect(options.version).toBe("OUP");
    expect(options.notation).toBe("early");
    expect(options["dry-run"]).toBe(true);
    expect(options.choir).toBe("I A");
  });

  it("treats a bare --flag followed by another --flag as boolean, then parses the next flag normally", () => {
    const options = parseArgs(["--dry-run", "--version", "OUP"]);
    expect(options["dry-run"]).toBe(true);
    expect(options.version).toBe("OUP");
  });
});

describe("buildPattern", () => {
  it("returns a wildcard pattern when choir is omitted", () => {
    expect(buildPattern("lilypond/src/Hugh Keyte/early")).toBe(
      "lilypond/src/Hugh Keyte/early/Choir*.ly"
    );
  });

  it("returns a single-choir pattern when choir is provided", () => {
    expect(buildPattern("lilypond/src/Hugh Keyte/early", "I A")).toBe(
      "lilypond/src/Hugh Keyte/early/Choir I A.ly"
    );
  });
});

// The rebuild decision is split (#760): a raw render is only redone when the
// sources are newer than the kept raw SVG; the postprocess step is only redone
// when the raw was re-rendered, the final is missing, or the postprocessor is
// newer than the final. Both gates use `>=` so an equal mtime forces the work
// (the RR item-4 tie fix folded in — a coarse-FS tie must not skip a rebuild).
describe("rawNeedsRender", () => {
  let dir: string;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  function svgAt(mtimeMs: number): string {
    dir = mkdtempSync(join(tmpdir(), "spem-rebuild-"));
    const p = join(dir, "raw.svg");
    writeFileSync(p, "<svg/>", "utf-8");
    const when = new Date(mtimeMs);
    utimesSync(p, when, when);
    return p;
  }

  it("renders when the raw SVG is missing", () => {
    expect(rawNeedsRender(1000, join(tmpdir(), "does-not-exist-760.svg"))).toBe(
      true
    );
  });

  it("does not render when the raw is strictly newer than its sources", () => {
    const raw = svgAt(20000);
    expect(rawNeedsRender(19000, raw)).toBe(false);
  });

  it("renders when a source is strictly newer than the raw", () => {
    const raw = svgAt(20000);
    expect(rawNeedsRender(21000, raw)).toBe(true);
  });

  it("renders on an equal mtime (tie forces a rebuild, RR item 4)", () => {
    const raw = svgAt(20000);
    expect(rawNeedsRender(20000, raw)).toBe(true);
  });
});

describe("finalNeedsRebuild", () => {
  let dir: string;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  function finalAt(mtimeMs: number): string {
    dir = mkdtempSync(join(tmpdir(), "spem-final-"));
    const p = join(dir, "final.svg");
    writeFileSync(p, "<svg/>", "utf-8");
    const when = new Date(mtimeMs);
    utimesSync(p, when, when);
    return p;
  }

  it("rebuilds when the final SVG is missing", () => {
    expect(
      finalNeedsRebuild(1000, join(tmpdir(), "no-final-760.svg"), 1)
    ).toBe(true);
  });

  it("does not rebuild when the final is strictly newer than sources and postprocessor", () => {
    const final = finalAt(30000);
    expect(finalNeedsRebuild(29000, final, 29000)).toBe(false);
  });

  it("rebuilds when a source is strictly newer than the final", () => {
    const final = finalAt(30000);
    expect(finalNeedsRebuild(31000, final, 1)).toBe(true);
  });

  it("rebuilds when the postprocessor is strictly newer than the final", () => {
    const final = finalAt(30000);
    expect(finalNeedsRebuild(1, final, 31000)).toBe(true);
  });

  it("rebuilds on an equal source mtime (tie forces a rebuild, RR item 4)", () => {
    const final = finalAt(30000);
    expect(finalNeedsRebuild(30000, final, 1)).toBe(true);
  });

  it("rebuilds on an equal postprocessor mtime (tie forces a rebuild, RR item 4)", () => {
    const final = finalAt(30000);
    expect(finalNeedsRebuild(1, final, 30000)).toBe(true);
  });
});
