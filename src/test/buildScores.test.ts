import { describe, it, expect } from "vitest";
import { parseArgs, buildPattern } from "../../build/buildScores.mjs";

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

  it("does not treat a following --arg as a value for the previous key", () => {
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
