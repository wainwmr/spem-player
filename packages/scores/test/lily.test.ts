// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { describe, it, expect } from "vitest";
import { exportedForTesting, detectFalseRelations } from "../src/lily/lily";
import type { ActiveNote } from "../src/lily/lily";
const { setupLilypondParser, semantics } = exportedForTesting;
import { Note, Duration } from "../src/lily/music-classes";
import * as ohm from "ohm-js";
import lyGrammar from "../src/lily/ly-grammar.ohm-bundle";

describe("lilypond parsing tests", () => {
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

  // The old pwa lily.test.ts had a "parse result is typed, not any" @ts-expect-error
  // here; it is dropped rather than moved because scores test/ is not type-checked
  // (tsconfig covers src/lily + buildLilyData only), so the directive would be a
  // silent no-op giving false assurance (Vera 693-03). Type-checking scores tests
  // is tracked as a follow-up.

  it("detectFalseRelations finds false relations (same letter, different accidental)", () => {
    const activeNotes = new Map<number, ActiveNote[]>();
    activeNotes.set(1.0, [
      {
        c: 0,
        p: 0,
        n: new Note({
          notename: "f",
          accidental: null,
          octave: null,
          duration: new Duration("4"),
          slur: null,
        }),
      },
      {
        c: 1,
        p: 0,
        n: new Note({
          notename: "f",
          accidental: "is",
          octave: null,
          duration: new Duration("4"),
          slur: null,
        }),
      },
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
      {
        c: 0,
        p: 0,
        n: new Note({
          notename: "f",
          accidental: null,
          octave: null,
          duration: new Duration("4"),
          slur: null,
        }),
      },
      {
        c: 0,
        p: 0,
        n: new Note({
          notename: "f",
          accidental: "is",
          octave: null,
          duration: new Duration("4"),
          slur: null,
        }),
      },
    ]);
    const result = detectFalseRelations(activeNotes);
    expect(result.length).toBe(0);
  });

  it("detectFalseRelations ignores different letters (even if semitone apart)", () => {
    const activeNotes = new Map<number, ActiveNote[]>();
    activeNotes.set(1.0, [
      {
        c: 0,
        p: 0,
        n: new Note({
          notename: "e",
          accidental: null,
          octave: null,
          duration: new Duration("4"),
          slur: null,
        }),
      },
      {
        c: 1,
        p: 0,
        n: new Note({
          notename: "f",
          accidental: null,
          octave: null,
          duration: new Duration("4"),
          slur: null,
        }),
      },
    ]);
    const result = detectFalseRelations(activeNotes);
    expect(result.length).toBe(0);
  });

  it("detectFalseRelations merges consecutive positions for same part", () => {
    const activeNotes = new Map<number, ActiveNote[]>();
    activeNotes.set(1.0, [
      {
        c: 0,
        p: 0,
        n: new Note({
          notename: "b",
          accidental: "es",
          octave: null,
          duration: new Duration("4"),
          slur: null,
        }),
      },
      {
        c: 1,
        p: 0,
        n: new Note({
          notename: "b",
          accidental: null,
          octave: null,
          duration: new Duration("4"),
          slur: null,
        }),
      },
    ]);
    activeNotes.set(1.0625, [
      {
        c: 0,
        p: 0,
        n: new Note({
          notename: "b",
          accidental: "es",
          octave: null,
          duration: new Duration("4"),
          slur: null,
        }),
      },
      {
        c: 1,
        p: 0,
        n: new Note({
          notename: "b",
          accidental: null,
          octave: null,
          duration: new Duration("4"),
          slur: null,
        }),
      },
    ]);
    const result = detectFalseRelations(activeNotes);
    expect(result.length).toBe(2);
    expect(result[0].from).toBe(1.0);
    expect(result[0].to).toBe(1.125);
    expect(result[1].from).toBe(1.0);
    expect(result[1].to).toBe(1.125);
  });
});
