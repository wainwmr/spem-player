import { MusicCanvasWatcher } from "../ts/MusicCanvasWatcher";

// MusicCanvas is deliberately not imported or defined here. The watcher
// listens for `music-canvas-hover` events fired by `<music-canvas>` elements,
// but the tests dispatch those events with synthetic detail objects, so a
// real upgraded MusicCanvas is not needed. Leaving `<music-canvas>` as an
// unupgraded HTMLElement avoids ~500-700ms per test from MusicCanvas's
// async `#init` (processLilypond) — the previous behaviour that made this
// file take ~7s.
//
// The synthetic event detail objects below are a MANUAL MIRROR of the shape
// produced by `MusicElement.fireEvent` in production. If that shape changes,
// update the detail objects in this file to match — they are not derived
// from any shared helper.
MusicCanvasWatcher.define("music-canvas-watcher");

describe("MusicCanvasWatcher custom element (unit, synthetic canvas events)", () => {
  let watcher: MusicCanvasWatcher | null;

  beforeEach(() => {
    document.body.innerHTML = `<music-canvas></music-canvas><music-canvas-watcher></music-canvas-watcher>`;
    watcher = document.querySelector("music-canvas-watcher");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("creates output spans on connection", () => {
    expect(watcher).not.toBeNull();
    expect(watcher?.querySelector("#choir-output")).not.toBeNull();
    expect(watcher?.querySelector("#part-output")).not.toBeNull();
    expect(watcher?.querySelector("#bar-output")).not.toBeNull();
  });

  it("handleCanvasHover updates display and shows watcher", () => {
    expect(watcher).not.toBeNull();

    const canvas = document.querySelector("music-canvas");
    expect(canvas).not.toBeNull();

    const event = new CustomEvent("music-canvas-hover", {
      detail: { position: { choir: 2, part: 1, bar: 42.5 } },
    });

    canvas!.dispatchEvent(event);

    const choirOutput = watcher!.querySelector("#choir-output");
    const partOutput = watcher!.querySelector("#part-output");
    const barOutput = watcher!.querySelector("#bar-output");

    expect(choirOutput?.textContent).toBe("Choir 3");
    expect(partOutput?.textContent).toBe("Alto");
    expect(barOutput?.textContent).toBe("Bar 42");
    expect(watcher!.classList.contains("hide")).toBe(false);
  });

  it("handleCanvasHover hides part output for 'all' parts", () => {
    expect(watcher).not.toBeNull();

    const canvas = document.querySelector("music-canvas");
    expect(canvas).not.toBeNull();

    const event = new CustomEvent("music-canvas-hover", {
      detail: { position: { choir: 0, part: "all", bar: 10 } },
    });

    canvas!.dispatchEvent(event);

    const partOutput = watcher!.querySelector("#part-output");
    expect(partOutput?.textContent).toBe("");
  });

  it("clears previous timeout on re-hover", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const canvas = document.querySelector("music-canvas");
    const event = new CustomEvent("music-canvas-hover", {
      detail: { position: { choir: 0, part: 0, bar: 10 } },
    });

    canvas!.dispatchEvent(event);
    canvas!.dispatchEvent(event);

    expect(clearTimeoutSpy).toHaveBeenCalledOnce();

    clearTimeoutSpy.mockRestore();
  });

  it("does not call clearTimeout on first hover", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const canvas = document.querySelector("music-canvas");
    const event = new CustomEvent("music-canvas-hover", {
      detail: { position: { choir: 0, part: 0, bar: 10 } },
    });

    canvas!.dispatchEvent(event);

    expect(clearTimeoutSpy).not.toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it("adds hide class after timeout expires", () => {
    vi.useFakeTimers();

    const canvas = document.querySelector("music-canvas");
    const event = new CustomEvent("music-canvas-hover", {
      detail: { position: { choir: 0, part: 0, bar: 10 } },
    });

    canvas!.dispatchEvent(event);
    expect(watcher!.classList.contains("hide")).toBe(false);

    vi.advanceTimersByTime(1500);
    expect(watcher!.classList.contains("hide")).toBe(true);
  });

  it("does not repeatedly hide after timeout fires once", () => {
    vi.useFakeTimers();

    const canvas = document.querySelector("music-canvas");
    const event = new CustomEvent("music-canvas-hover", {
      detail: { position: { choir: 0, part: 0, bar: 10 } },
    });

    canvas!.dispatchEvent(event);
    vi.advanceTimersByTime(1500);
    expect(watcher!.classList.contains("hide")).toBe(true);

    watcher!.classList.remove("hide");
    vi.advanceTimersByTime(1500);
    expect(watcher!.classList.contains("hide")).toBe(false);
  });
});
