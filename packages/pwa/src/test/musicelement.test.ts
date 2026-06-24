import { MusicElement } from "../ts/MusicElement";
import { MusicControls } from "../ts/MusicControls";
import type { AssertNever, MusicEventDetail } from "../ts/common";

// Compile-time exhaustiveness guard for the music-event typing (#716).
// `AssertNever<T>` (common.ts) errors unless `T` is `never`. Applied here to a
// local union and a local event map with a deliberately MISSING key, the
// `Exclude` resolves to that missing key, the assertion errors, and the
// suppression directive below absorbs it. If the guard mechanism ever stops
// rejecting a missing key, that directive becomes unused and `tsc`
// (check:types) fails -- the same compile-time-guard pattern as the #646
// fireEvent test below and the #551 readonly-Range test in spem.test.ts. This
// pins the mechanism that protects the real `MusicEventType` /
// `HTMLElementEventMap` lockstep in common.ts.
type _ProbeMap = { "music-mapped": CustomEvent<MusicEventDetail> };
type _ProbeUnion = "music-mapped" | "music-unmapped";
// @ts-expect-error -- "music-unmapped" has no _ProbeMap key, so Exclude is "music-unmapped", which violates AssertNever's `never` constraint (#716)
type _ProbeExhaustive = AssertNever<Exclude<_ProbeUnion, keyof _ProbeMap>>;

// Create a concrete subclass for testing
class TestElement extends MusicElement {
  static observedAttributes = ["test"];
}
customElements.define("test-element", TestElement);

describe("MusicElement", () => {
  // The spec for #378 suggested spying on console.log / console.warn for the
  // first two tests, but MusicElement.adoptedCallback() is empty and
  // attributeChangedCallback's default case is a no-op — there is no log to
  // spy on, and refactoring MusicElement to add logging is explicitly out of
  // scope per the ticket. The tests below assert what the code actually does
  // (no-throw boundary behaviour + observable-state absence-of-mutation +
  // verifiable absence of event dispatch) rather than logging that doesn't
  // exist.

  it("adoptedCallback can be called without error and does not mutate state", () => {
    const elem = document.createElement("test-element") as MusicElement;
    // adoptedCallback is hard to trigger in jsdom, but we can call it directly.
    // It is a no-op today; we pin both the no-throw boundary AND the
    // absence-of-state-mutation so a silent side effect (e.g. `this.bar = 99`)
    // would be caught.
    const before = {
      recording: elem.recording,
      choir: elem.choir,
      voicePart: elem.voicePart,
      bar: elem.bar,
      playing: elem.playing,
    };
    expect(() => elem.adoptedCallback()).not.toThrow();
    expect(elem.recording).toBe(before.recording);
    expect(elem.choir).toBe(before.choir);
    expect(elem.voicePart).toBe(before.voicePart);
    expect(elem.bar).toBe(before.bar);
    expect(elem.playing).toBe(before.playing);
  });

  it("attributeChangedCallback ignores unknown attribute names", () => {
    const elem = document.createElement("test-element") as MusicElement;
    document.body.appendChild(elem);
    // Snapshot the observable state so we can assert nothing mutated.
    const before = {
      recording: elem.recording,
      choir: elem.choir,
      voicePart: elem.voicePart,
      bar: elem.bar,
      playing: elem.playing,
    };
    // Also spy on fireEvent — the default switch branch is a bare `break`
    // today, so any future side effect that touches anything outside the five
    // snapshotted fields would otherwise pass silently. Every legitimate
    // dispatch in MusicElement routes through fireEvent, so this catches
    // events / observers added inside the default branch.
    const fireSpy = vi.spyOn(elem, "fireEvent");
    expect(() =>
      elem.attributeChangedCallback("badattr", "old", "new")
    ).not.toThrow();
    expect(elem.recording).toBe(before.recording);
    expect(elem.choir).toBe(before.choir);
    expect(elem.voicePart).toBe(before.voicePart);
    expect(elem.bar).toBe(before.bar);
    expect(elem.playing).toBe(before.playing);
    expect(fireSpy).not.toHaveBeenCalled();
    fireSpy.mockRestore();
    document.body.removeChild(elem);
  });

  it("attributeChangedCallback short-circuits on same value", () => {
    const elem = document.createElement("test-element") as MusicElement;
    document.body.appendChild(elem);
    const choirBefore = elem.choir;
    const spy = vi.spyOn(elem, "setChoir");
    // First call: oldValue == newValue, so the early-return should fire and
    // setChoir should never run. (Using a handled attribute name — "choir" —
    // so the switch would otherwise dispatch to setChoir.)
    elem.attributeChangedCallback("choir", "1", "1");
    expect(spy).not.toHaveBeenCalled();
    expect(elem.choir).toBe(choirBefore); // refactor-proof observable check
    // Sanity: a real value change does dispatch.
    elem.attributeChangedCallback("choir", "1", "2");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    document.body.removeChild(elem);
  });

  it("define catches duplicate registration and keeps the first class", () => {
    // Use two DIFFERENT subclasses for the same tag so that a regression
    // (e.g. removing the try/catch around customElements.define) would either
    // throw OR replace the registered class — both of which the assertions
    // below catch.
    class TestControlFirst extends MusicControls {}
    class TestControlSecond extends MusicControls {}
    TestControlFirst.define("test-control-duplicate");
    expect(() =>
      TestControlSecond.define("test-control-duplicate")
    ).not.toThrow();
    // First registration wins; the catch swallowed the duplicate.
    expect(customElements.get("test-control-duplicate")).toBe(TestControlFirst);
  });

  it("types the event name and the detail payload (#646)", () => {
    // Pins the compile-time event contract that #646 introduces. While it holds,
    // the @ts-expect-error below suppresses the error a bad event name now
    // produces; if someone widens `fireEvent`'s type back to `string`, the
    // directive becomes unused and `tsc` (check:types) fails (same compile-time
    // guard pattern as the #551 readonly-Range test in spem.test.ts). The listener
    // body proves the HTMLElementEventMap augmentation narrows `e` so `e.detail` is
    // typed without a cast.
    const elem = document.createElement("test-element") as MusicElement;
    document.body.appendChild(elem);
    const received: MusicEventDetail[] = [];
    elem.addEventListener("music-controls-changed", (e) => {
      received.push(e.detail);
    });
    elem.setChoir(3);
    expect(received).toHaveLength(1);
    expect(received[0].position.choir).toBe(3);
    // @ts-expect-error -- fireEvent rejects names outside MusicEventType (#646)
    elem.fireEvent("not-a-music-event");
    document.body.removeChild(elem);
  });
});
