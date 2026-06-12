import { describe, it, expect } from "vitest";
import {
  parseArgs,
  buildPattern,
  parseLilypondVersion,
  compareVersions,
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

describe("parseLilypondVersion", () => {
  it("captures a plain release version", () => {
    expect(parseLilypondVersion("GNU LilyPond 2.26.0")).toBe("2.26.0");
  });

  it("captures a pre-release version including its suffix (#519)", () => {
    // The previous regex (\d+\.\d+\.\d+) silently truncated the suffix,
    // masking the compareVersions defect below.
    expect(parseLilypondVersion("GNU LilyPond 2.26.0-rc1")).toBe("2.26.0-rc1");
  });

  it("returns null when the banner does not match", () => {
    expect(parseLilypondVersion("not a lilypond banner")).toBeNull();
  });

  it("returns null for a non-version token so garbage is reported as unknown (#549)", () => {
    // The X.Y.Z core is required: a bare \S+ would accept "weird-build"
    // as a version and defeat the "unknown version, echo raw stdout"
    // diagnostic path.
    expect(parseLilypondVersion("GNU LilyPond weird-build")).toBeNull();
  });
});

describe("compareVersions", () => {
  it("treats equal versions as equal", () => {
    expect(compareVersions("2.26.0", "2.26.0")).toBe(0);
  });

  it("orders a lower patch/minor as less", () => {
    expect(compareVersions("2.25.0", "2.26.0")).toBeLessThan(0);
  });

  it("orders a higher minor as greater", () => {
    expect(compareVersions("2.27.0", "2.26.0")).toBeGreaterThan(0);
  });

  it("orders a pre-release below its release (#519)", () => {
    // Exact -1, not just sign: a regression that flipped magnitude without
    // flipping sign would slip past a relational matcher (Vera 519-04).
    expect(compareVersions("2.26.0-rc1", "2.26.0")).toBe(-1);
  });

  it("orders pre-releases lexicographically among themselves", () => {
    expect(compareVersions("2.26.0-rc1", "2.26.0-rc2")).toBeLessThan(0);
  });

  it("orders a release above its pre-release (#519)", () => {
    expect(compareVersions("2.26.0", "2.26.0-rc1")).toBe(1);
  });

  it("lets a higher patch outrank a pre-release of a lower patch", () => {
    expect(compareVersions("2.26.1-rc1", "2.26.0")).toBeGreaterThan(0);
  });

  it("accepts a pre-release of a higher version (Vera 519-03)", () => {
    // The suffix branch only runs when the numeric parts tie; pin that a
    // higher numeric core wins regardless of suffix, so a "return early on
    // any suffix" simplification cannot wrongly reject 2.27.0-rc1.
    expect(compareVersions("2.27.0-rc1", "2.26.0")).toBeGreaterThan(0);
  });

  it("treats two identical pre-releases as equal (Vera 519-06)", () => {
    expect(compareVersions("2.26.0-rc1", "2.26.0-rc1")).toBe(0);
  });

  it("orders multi-digit pre-release identifiers lexicographically — a known limitation (Vera 519-05)", () => {
    // Documented limitation: lexicographic suffix compare puts "-rc10"
    // BELOW "-rc2". LilyPond ships no double-digit rc, so this never bites
    // the version gate; the test exists to make the contract honest.
    expect(compareVersions("2.26.0-rc10", "2.26.0-rc2")).toBeLessThan(0);
  });

  it("parses each part's leading integer so a leading-zero part equals its bare form (Vera 519-01)", () => {
    // Pins the {num, rest} split. The old slice(String(num).length) turned
    // "08" into {num: 8, rest: "8"}, mis-ranking it below "8"; the regex
    // split keeps rest empty so "2.08.0" compares equal to "2.8.0".
    expect(compareVersions("2.08.0", "2.8.0")).toBe(0);
  });
});
