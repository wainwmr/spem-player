import { MusicElement } from "../ts/MusicElement";
import { MusicControls } from "../ts/MusicControls";

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
  // (no-throw boundary behaviour and verifiable side-effect absence) rather
  // than logging that doesn't exist.

  it("adoptedCallback can be called without error", () => {
    const elem = document.createElement("test-element") as MusicElement;
    // adoptedCallback is hard to trigger in jsdom, but we can call it directly.
    // It is a no-op today; this test pins that boundary so future contributors
    // notice if they accidentally make the implementation throw.
    expect(() => (elem as any).adoptedCallback()).not.toThrow();
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
    expect(() =>
      (elem as any).attributeChangedCallback("badattr", "old", "new")
    ).not.toThrow();
    expect(elem.recording).toBe(before.recording);
    expect(elem.choir).toBe(before.choir);
    expect(elem.voicePart).toBe(before.voicePart);
    expect(elem.bar).toBe(before.bar);
    expect(elem.playing).toBe(before.playing);
    document.body.removeChild(elem);
  });

  it("attributeChangedCallback short-circuits on same value", () => {
    const elem = document.createElement("test-element") as MusicElement;
    document.body.appendChild(elem);
    const spy = vi.spyOn(elem, "setChoir");
    // First call: oldValue == newValue, so the early-return should fire and
    // setChoir should never run. (Using a handled attribute name — "choir" —
    // so the switch would otherwise dispatch to setChoir.)
    (elem as any).attributeChangedCallback("choir", "1", "1");
    expect(spy).not.toHaveBeenCalled();
    // Sanity: a real value change does dispatch.
    (elem as any).attributeChangedCallback("choir", "1", "2");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    document.body.removeChild(elem);
  });

  it("define catches duplicate registration", () => {
    // Define a new tag, then redefine it to hit the catch block in
    // MusicElement.define. The redefine should not throw.
    class TestControl extends MusicControls {}
    TestControl.define("test-control-duplicate");
    expect(() => TestControl.define("test-control-duplicate")).not.toThrow();
  });
});
