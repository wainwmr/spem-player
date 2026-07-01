import {
  Duration,
  Note,
  Rest,
  BarLine,
  Command,
  Component,
} from "../src/lily/music-classes";

describe("Duration", () => {
  it("creates durations for all note values", () => {
    expect(new Duration("\\longa").sfths).toBe(256);
    expect(new Duration("\\breve").sfths).toBe(128);
    expect(new Duration("1").sfths).toBe(64);
    expect(new Duration("2").sfths).toBe(32);
    expect(new Duration("4").sfths).toBe(16);
    expect(new Duration("8").sfths).toBe(8);
    expect(new Duration("16").sfths).toBe(4);
    expect(new Duration("32").sfths).toBe(2);
    expect(new Duration("64").sfths).toBe(1);
  });

  it("throws on an unknown duration", () => {
    expect(() => new Duration("99")).toThrow("Unknown duration: 99");
    // The empty string is not a case label, so a duration-less construction
    // throws too — the `duration` parameter is required for this reason.
    expect(() => new Duration("")).toThrow("Unknown duration: ");
    // The throw fires in the switch, before the dotted/multiplier arithmetic,
    // so an unknown duration throws regardless of those arguments.
    expect(() => new Duration("99", ".", 2)).toThrow("Unknown duration: 99");
  });

  it("handles dotted notes", () => {
    expect(new Duration("4", ".").sfths).toBe(24); // 16 * 1.5
    expect(new Duration("4", "..").sfths).toBe(28); // 16 * 1.75
  });

  it("handles multiplier", () => {
    expect(new Duration("4", "", 2).sfths).toBe(32);
    expect(new Duration("4", ".", 2).sfths).toBe(48);
  });

  it("handles a negative multiplier", () => {
    const d = new Duration("4", "", -2);
    expect(d.sfths).toBe(-32); // 16 * -2
    expect(d.toString()).toBe("4*-2");
  });

  it("toString formats correctly", () => {
    expect(new Duration("4").toString()).toBe("4");
    expect(new Duration("4", ".").toString()).toBe("4.");
    expect(new Duration("4", "", 2).toString()).toBe("4*2");
    expect(new Duration("4", "..", 3).toString()).toBe("4..*3");
  });
});

describe("Note", () => {
  it("toString formats note correctly", () => {
    const d = new Duration("4");
    const n = new Note({
      notename: "c",
      accidental: null,
      octave: null,
      duration: d,
      slur: null,
    });
    expect(n.toString()).toBe("c4");
  });

  it("toString includes accidental and octave", () => {
    const d = new Duration("8");
    const n = new Note({
      notename: "d",
      accidental: "is",
      octave: "'",
      duration: d,
      slur: null,
    });
    expect(n.toString()).toBe("dis'8");
  });

  it("toString can hide duration", () => {
    const d = new Duration("2");
    const n = new Note({
      notename: "e",
      accidental: null,
      octave: null,
      duration: d,
      slur: "(",
    });
    expect(n.toString(false)).toBe("e(");
  });

  it("toString concatenates all fields in order", () => {
    const d = new Duration("4");
    const n = new Note({
      notename: "c",
      accidental: "is",
      octave: "'",
      duration: d,
      slur: "(",
    });
    expect(n.toString()).toBe("cis'4(");
  });

  it("assigns each named parameter to the correct property", () => {
    const d = new Duration("4");
    const n = new Note({
      notename: "c",
      accidental: "is",
      octave: "'",
      duration: d,
      slur: "(",
    });
    expect(n.notename).toBe("c");
    expect(n.accidental).toBe("is");
    expect(n.octave).toBe("'");
    expect(n.duration).toBe(d);
    expect(n.slur).toBe("(");
  });
});

describe("Rest", () => {
  it("toString formats rest correctly", () => {
    const d = new Duration("4");
    const r = new Rest("r", d);
    expect(r.toString()).toBe("r4");
  });

  it("toString can hide duration", () => {
    const d = new Duration("2");
    const r = new Rest("R", d);
    expect(r.toString(false)).toBe("R");
  });

  it("toString with a null duration returns only the restname", () => {
    // The constructor types `duration` as Duration, but the toString guard
    // (`this.duration != null`) defends a null at runtime; pin that behaviour.
    const r = new Rest("r", null as unknown as Duration);
    expect(r.toString()).toBe("r");
  });
});

describe("BarLine", () => {
  it("toString returns bar line", () => {
    expect(new BarLine().toString()).toBe("|");
  });
});

describe("Command", () => {
  it("toString returns Command", () => {
    expect(new Command().toString()).toBe("Command");
  });
});

describe("Component", () => {
  it("base toString returns the legacy placeholder", () => {
    expect(new Component(null).toString()).toBe("huh");
  });

  it("the four concrete subclasses override Component's toString", () => {
    // The "huh" placeholder is a legacy base-class value that production code
    // must not rely on. Assert the override directly: each subclass defines its
    // own toString, so an instance never inherits the base placeholder. A
    // subclass that silently lost its override would inherit
    // Component.prototype.toString and fail here.
    expect(BarLine.prototype.toString).not.toBe(Component.prototype.toString);
    expect(Note.prototype.toString).not.toBe(Component.prototype.toString);
    expect(Rest.prototype.toString).not.toBe(Component.prototype.toString);
    expect(Command.prototype.toString).not.toBe(Component.prototype.toString);
  });
});
