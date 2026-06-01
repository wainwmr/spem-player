import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import {
  parseArgs,
  buildPattern,
  canaryCheck,
} from "../../build/buildScores.mjs";

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
    const options = parseArgs(["--skip-if-missing"]);
    expect(options["skip-if-missing"]).toBe(true);
  });

  it("parses mixed key=value, key value, and boolean flags", () => {
    const options = parseArgs([
      "--version=OUP",
      "--notation",
      "early",
      "--skip-if-missing",
      "--choir",
      "I A",
    ]);
    expect(options.version).toBe("OUP");
    expect(options.notation).toBe("early");
    expect(options["skip-if-missing"]).toBe(true);
    expect(options.choir).toBe("I A");
  });

  it("treats a bare --flag followed by another --flag as boolean, then parses the next flag normally", () => {
    const options = parseArgs(["--skip-if-missing", "--version", "OUP"]);
    expect(options["skip-if-missing"]).toBe(true);
    expect(options.version).toBe("OUP");
  });
});

describe("buildPattern", () => {
  it("returns a wildcard pattern when choir is omitted", () => {
    expect(buildPattern("src/lilypond/Hugh Keyte/early")).toBe(
      "src/lilypond/Hugh Keyte/early/Choir*.ly"
    );
  });

  it("returns a single-choir pattern when choir is provided", () => {
    expect(buildPattern("src/lilypond/Hugh Keyte/early", "I A")).toBe(
      "src/lilypond/Hugh Keyte/early/Choir I A.ly"
    );
  });
});

describe("canaryCheck", () => {
  // canaryCheck(version, root) probes BOTH notations'
  // `${root}/src/scores/${version}/<notation>/Choir I A.svg`. The expected
  // paths are built the same way the function does, so the `missing` field
  // compares exactly. Real files in a temp dir — no fs mocking.
  const version = "Hugh Keyte";
  let root: string;

  const modernCanary = () =>
    `${root}/src/scores/${version}/modern/Choir I A.svg`;
  const earlyCanary = () => `${root}/src/scores/${version}/early/Choir I A.svg`;

  function makeCanary(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, "<svg/>");
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "canary-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("returns ok when both notation canaries are present", () => {
    makeCanary(modernCanary());
    makeCanary(earlyCanary());
    expect(canaryCheck(version, root)).toEqual({ ok: true });
  });

  it("fails on the modern canary when only early is present", () => {
    makeCanary(earlyCanary());
    expect(canaryCheck(version, root)).toEqual({
      ok: false,
      missing: modernCanary(),
    });
  });

  it("fails on the early canary when only modern is present", () => {
    makeCanary(modernCanary());
    expect(canaryCheck(version, root)).toEqual({
      ok: false,
      missing: earlyCanary(),
    });
  });

  it("fails on the modern canary first when both are missing", () => {
    expect(canaryCheck(version, root)).toEqual({
      ok: false,
      missing: modernCanary(),
    });
  });

  it("uses the version parameter — OUP edition (not hard-coded)", () => {
    const oup = "OUP";
    makeCanary(`${root}/src/scores/${oup}/modern/Choir I A.svg`);
    makeCanary(`${root}/src/scores/${oup}/early/Choir I A.svg`);
    // A version-hardcoded probe would look under "Hugh Keyte" and miss these.
    expect(canaryCheck(oup, root)).toEqual({ ok: true });
  });
});
