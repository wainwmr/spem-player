import {
  processLilypond,
  barCount,
  exportedForTesting,
  detectFalseRelations,
} from "../ts/lily";
import type { ActiveNote } from "../ts/lily";
const {
  romanise,
  setupLilypondParser,
  noteToPitchClass,
  semantics,
  resetLilypondCache,
} = exportedForTesting;
import { Note, Duration } from "../ts/music-classes";
import * as ohm from "ohm-js";
import lyGrammar from "../ohmjs/ly-grammar.ohm-bundle";

describe("lilypond parsing tests", () => {
  it("romanise", () => {
    expect(romanise(1)).toBe("I");
    expect(romanise(2)).toBe("II");
    expect(romanise(3)).toBe("III");
    expect(romanise(4)).toBe("IV");
    expect(romanise(5)).toBe("V");
    expect(romanise(6)).toBe("VI");
    expect(romanise(7)).toBe("VII");
    expect(romanise(8)).toBe("VIII");
    expect(romanise(984)).toBe("CMLXXXIV");
    expect(romanise(2024)).toBe("MMXXIV");
    expect(romanise(0)).toBe("");
    expect(romanise(-20)).toBe("");
    expect(romanise(9.2)).toBe("IX");
  });

  it("check lilypond parses OK", () => {
    var a: ohm.MatchResult;
    a = lyGrammar.match("{ a b c d }");
    expect(a.succeeded()).toBe(true);
    a = lyGrammar.match("\\relative c { a b c d e f g }");
    expect(a.succeeded()).toBe(true);
    a = lyGrammar.match("\\relative c'' { a2 b4. c1 d\\breve e\\longa f g }");
    expect(a.succeeded()).toBe(true);
    a = lyGrammar.match("\\relative c' { aes'''4*9~ }");
    expect(a.succeeded()).toBe(true);
    a = lyGrammar.match("sopOne = \\relative c'' { g2 f e d }");
    expect(a.succeeded()).toBe(true);
    // Cannot have digits in a lilypond variable name, so the next one should fail
    a = lyGrammar.match("sop987 = \\relative c'' { g2 f \\ficta e dis }");
    expect(a.succeeded()).toBe(false);
    expect(a.failed() && a.message.includes("sop987")).toBe(true);
  });

  it("setupLilypondParser", () => {
    var s = setupLilypondParser();
    expect(s).toBeTruthy();
  });

  it("fraction multiplier parses with denominator (#321)", () => {
    const match = lyGrammar.match("3/4", "fraction");
    expect(match.succeeded()).toBe(true);
    expect(semantics(match).parse()).toBe(0.75);
  });

  it("fraction multiplier parses without denominator (#321 regression)", () => {
    const match = lyGrammar.match("3", "fraction");
    expect(match.succeeded()).toBe(true);
    expect(semantics(match).parse()).toBe(3);
  });

  it("processLilypond", () => {
    const { dict, ranges } = processLilypond();
    expect(dict.length).toBe(139); // bars including bar zero
    expect(barCount).toBe(139);
    expect(ranges.length).toBe(8); // choirs
    for (var c = 0; c < 8; c++) {
      expect(ranges[c].length).toBe(5);
      for (var p = 0; p < 1; p++) {
        const last = ranges[c][p][ranges[c][p].length - 1];
        expect(last.to).toBe(139);
      }
    }
  });

  it("processLilypond() returns a result object with dict, ranges, barCount, frLocations", () => {
    const result = processLilypond();
    expect(result).toBeDefined();
    expect(result.dict.length).toBeGreaterThan(0);
    expect(result.ranges.length).toBe(8);
    expect(result.barCount).toBeGreaterThan(0);
    expect(result.frLocations.length).toBeGreaterThan(0);
  });

  it("processLilypond() throws on parse failure", () => {
    // Clear the module-level cache so processLilypond actually calls
    // lyGrammar.match. This test relies on earlier tests in this describe
    // block having warmed the cache; without the reset the cache short-
    // circuits before the mocked failure. If the test order changes or
    // `test.isolate` is ever set to false, this assumption needs revisiting.
    resetLilypondCache();
    const failedMatch = lyGrammar.match("sop987 = \\relative c'' { g2 f e d }"); // invalid: digits in var name
    vi.spyOn(lyGrammar, "match").mockReturnValueOnce(failedMatch);
    expect(() => processLilypond()).toThrow("Lilypond parse failed");
    vi.restoreAllMocks();
    // The cache assignment in processLilypond is unreachable past the throw,
    // so the cache should still be null. Subsequent calls should produce a
    // valid parse result rather than handing out a poisoned cached value.
    expect(processLilypond().dict.length).toBeGreaterThan(0);
  });

  it("processLilypond() returns identical reference on second call (cache hit)", () => {
    const first = processLilypond();
    const second = processLilypond();
    expect(second).toBe(first); // referential equality — same cached object
  });

  it("processLilypond() is idempotent over the parse — repeated cold calls produce equal data", () => {
    // Force a cold call by resetting the cache between invocations, so this
    // test actually exercises the parser's determinism rather than the
    // cache's identity (which is covered separately above).
    resetLilypondCache();
    const result1 = processLilypond();
    resetLilypondCache();
    const result2 = processLilypond();
    expect(result2.dict.length).toBe(result1.dict.length);
    expect(result2.ranges.length).toBe(result1.ranges.length);
    expect(result2.barCount).toBe(result1.barCount);
    expect(result2.frLocations.length).toBe(result1.frLocations.length);
  });

  it("noteToPitchClass maps natural notes correctly", () => {
    expect(
      noteToPitchClass(new Note("c", null, null, new Duration("4"), null))
    ).toBe(0);
    expect(
      noteToPitchClass(new Note("d", null, null, new Duration("4"), null))
    ).toBe(2);
    expect(
      noteToPitchClass(new Note("e", null, null, new Duration("4"), null))
    ).toBe(4);
    expect(
      noteToPitchClass(new Note("f", null, null, new Duration("4"), null))
    ).toBe(5);
    expect(
      noteToPitchClass(new Note("g", null, null, new Duration("4"), null))
    ).toBe(7);
    expect(
      noteToPitchClass(new Note("a", null, null, new Duration("4"), null))
    ).toBe(9);
    expect(
      noteToPitchClass(new Note("b", null, null, new Duration("4"), null))
    ).toBe(11);
  });

  it("noteToPitchClass maps accidentals correctly", () => {
    expect(
      noteToPitchClass(new Note("c", "is", null, new Duration("4"), null))
    ).toBe(1);
    expect(
      noteToPitchClass(new Note("c", "es", null, new Duration("4"), null))
    ).toBe(11);
    expect(
      noteToPitchClass(new Note("c", "isis", null, new Duration("4"), null))
    ).toBe(2);
    expect(
      noteToPitchClass(new Note("c", "eses", null, new Duration("4"), null))
    ).toBe(10);
    expect(
      noteToPitchClass(new Note("e", "es", null, new Duration("4"), null))
    ).toBe(3); // E flat
    expect(
      noteToPitchClass(new Note("b", "es", null, new Duration("4"), null))
    ).toBe(10); // B flat
  });

  it("detectFalseRelations finds false relations (same letter, different accidental)", () => {
    const activeNotes = new Map<number, ActiveNote[]>();
    activeNotes.set(1.0, [
      { c: 0, p: 0, n: new Note("f", null, null, new Duration("4"), null) },
      { c: 1, p: 0, n: new Note("f", "is", null, new Duration("4"), null) },
    ]);
    const result = detectFalseRelations(activeNotes);
    expect(result.length).toBe(2);
    expect(result[0].from).toBe(1.0);
    expect(result[0].to).toBe(1.0625);
    expect(result[0].c).toBe(0);
    expect(result[1].c).toBe(1);
  });

  it("detectFalseRelations ignores same-part clashes", () => {
    const activeNotes = new Map<number, ActiveNote[]>();
    activeNotes.set(1.0, [
      { c: 0, p: 0, n: new Note("f", null, null, new Duration("4"), null) },
      { c: 0, p: 0, n: new Note("f", "is", null, new Duration("4"), null) },
    ]);
    const result = detectFalseRelations(activeNotes);
    expect(result.length).toBe(0);
  });

  it("detectFalseRelations ignores different letters (even if semitone apart)", () => {
    const activeNotes = new Map<number, ActiveNote[]>();
    activeNotes.set(1.0, [
      { c: 0, p: 0, n: new Note("e", null, null, new Duration("4"), null) },
      { c: 1, p: 0, n: new Note("f", null, null, new Duration("4"), null) },
    ]);
    const result = detectFalseRelations(activeNotes);
    expect(result.length).toBe(0);
  });

  it("detectFalseRelations merges consecutive positions for same part", () => {
    const activeNotes = new Map<number, ActiveNote[]>();
    activeNotes.set(1.0, [
      { c: 0, p: 0, n: new Note("b", "es", null, new Duration("4"), null) },
      { c: 1, p: 0, n: new Note("b", null, null, new Duration("4"), null) },
    ]);
    activeNotes.set(1.0625, [
      { c: 0, p: 0, n: new Note("b", "es", null, new Duration("4"), null) },
      { c: 1, p: 0, n: new Note("b", null, null, new Duration("4"), null) },
    ]);
    const result = detectFalseRelations(activeNotes);
    expect(result.length).toBe(2);
    expect(result[0].from).toBe(1.0);
    expect(result[0].to).toBe(1.125);
    expect(result[1].from).toBe(1.0);
    expect(result[1].to).toBe(1.125);
  });
});
