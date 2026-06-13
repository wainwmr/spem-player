import { describe, it, expect } from "vitest";
import { parseURLSearch } from "../ts/url";

describe("parseURLSearch", () => {
  it("preserves a value containing '=' instead of truncating at the first '='", () => {
    // The bug was split("="): "recording=alc=extra" -> ["recording","alc",
    // "extra"], so parm[1] === "alc" and recording wrongly resolved to 0.
    // The fix (indexOf/slice) keeps val === "alc=extra".
    expect(parseURLSearch("?recording=alc=extra").recording).toBe(1);
    // Tighter proof that the WHOLE value survives, not merely "not alc":
    // score only sets early when the value is exactly "early". Truncation
    // would read "early" (true); preservation reads "early=x" (false). So
    // this fails against the old split() bug AND pins full-value handling.
    expect(parseURLSearch("?score=early=x").early).toBe(false);
    expect(parseURLSearch("?score=early").early).toBe(true);
  });

  it("handles normal parameters without '=' in the value", () => {
    const result = parseURLSearch("?recording=alc&choir=3&bar=10");
    expect(result.recording).toBe(0);
    expect(result.choir).toBe(3);
    expect(result.bar).toBe(10);
  });

  it("returns the documented defaults for an empty search string", () => {
    const result = parseURLSearch("");
    expect(result.recording).toBe(0);
    expect(result.choir).toBe(0);
    expect(result.part).toBe("all");
    expect(result.dark).toBe(true);
    expect(result.early).toBe(false);
  });

  it("treats a key with no '=' as having the default value", () => {
    // A key with no '=' has val === undefined, and Number(undefined)
    // is NaN. The NaN guard should fall back to the default.
    expect(parseURLSearch("?choir").choir).toBe(0);
  });

  it("ignores an invalid bar parameter (#235)", () => {
    expect(parseURLSearch("?bar=abc").bar).toBe(1 - 2 / 4); // default for ALC recording
  });

  it("ignores an invalid choir parameter (#235)", () => {
    expect(parseURLSearch("?choir=xyz").choir).toBe(0);
  });

  it("accepts valid bar and choir parameters (#235)", () => {
    expect(parseURLSearch("?bar=50").bar).toBe(50);
    expect(parseURLSearch("?choir=3").choir).toBe(3);
  });

  it("parses ?dark=0 as light mode (#236)", () => {
    expect(parseURLSearch("?dark=0").dark).toBe(false);
  });

  it("parses ?dark=false as light mode (#236)", () => {
    expect(parseURLSearch("?dark=false").dark).toBe(false);
  });

  it("parses ?dark=1 as dark mode (#236)", () => {
    expect(parseURLSearch("?dark=1").dark).toBe(true);
  });

  it("uses the requested recording's intro_beats for the default bar (#241)", () => {
    // intro_beats = [ALC 2, CotE 4]; the initial bar is 1 - intro_beats/4.
    // The default bar must be keyed off the *parsed* recording, not the
    // pre-parse default (ALC). CotE with no explicit ?bar= starts at bar 0.
    expect(parseURLSearch("?recording=cote").bar).toBe(1 - 4 / 4); // 0
    expect(parseURLSearch("?recording=alc").bar).toBe(1 - 2 / 4); // 0.5
    // An explicit ?bar= still overrides the recording-derived default.
    expect(parseURLSearch("?recording=cote&bar=10").bar).toBe(10);
    // Explicit ?bar=0 is kept, not treated as "unset" — pins the `??` sentinel
    // boundary against a future `||` regression (0 is falsy but not nullish).
    expect(parseURLSearch("?recording=alc&bar=0").bar).toBe(0);
  });
});
