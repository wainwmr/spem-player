import { describe, it, expect } from "vitest";
import type { NoteData, Range } from "@scores/lily/lily";
import { Note, Duration } from "@scores/lily/music-classes";

// Type-level guards for the note-data types consumed from @spem/scores (#693).
// These live in the pwa suite because pwa's check:types runs tsc over its tests,
// so the `@ts-expect-error` directives are actually validated; the scores suite
// type-checks only its production code.
describe("LilypondData type guards", () => {
  it("Range fields are readonly at compile time (#551)", () => {
    // Pins the readonly invariant in both directions: while it holds, the
    // ts-expect-error directives below suppress the TS2540 these writes
    // produce; if someone removes readonly, the directives become "unused
    // directive" errors in check:types. Writes go to a fresh literal (readonly
    // is compile-time only — the assignments execute at runtime).
    const r: Range = { from: 1, to: 2 };
    // @ts-expect-error -- Range.from is readonly (#551)
    r.from = 0;
    // @ts-expect-error -- Range.to is readonly (#551)
    r.to = 0;
    expect(r.from).toBe(0);
  });

  it("Note is structurally a NoteData (wire-shape drift guard, Vera 693-02)", () => {
    // The central invariant of #693: the Note/Duration builder classes must stay
    // assignable to the plain NoteData/DurationData wire types the runtime loads.
    // The `const asData: NoteData = n` assignment is the compile-time guard — it
    // stops type-checking if a class field drifts from the data type. Without it,
    // the only enforcer is an incidental `n: comp` assignment in the parse loop.
    const n = new Note({
      notename: "c",
      accidental: null,
      octave: null,
      duration: new Duration("4"),
      slur: null,
    });
    const asData: NoteData = n;
    expect(asData.notename).toBe("c");
    expect(asData.duration?.sfths).toBe(16);
  });
});
