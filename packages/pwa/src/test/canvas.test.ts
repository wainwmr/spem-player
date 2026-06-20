import { MusicCanvas } from "../ts/MusicCanvas";
import config from "../ts/config";
import type { Position } from "../ts/common";
import { Duration, Note } from "../ts/music-classes";
MusicCanvas.define("music-canvas");

var canvas: MusicCanvas | null;
describe("MusicCanvas custom element", () => {
  beforeAll(() => {
    document.body.innerHTML = `<music-canvas></music-canvas>`;
    canvas = document.querySelector("music-canvas");
    // No wait needed: the innerHTML setter upgrades the element synchronously
    // ([CEReactions]) and #init contains no awaits, so the element is fully
    // initialised here. A genuinely async #init would break this assumption.
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  // seek() tests overwrite choir ranges on the shared beforeAll canvas; snapshot
  // and restore the map per test so a fixture never leaks into a later test (#598).
  // #704 also mutates notesByQuant, so snapshot that too.
  let savedRanges: NonNullable<typeof canvas>["ranges"];
  let savedNotesByQuant: NonNullable<typeof canvas>["notesByQuant"];
  beforeEach(() => {
    savedRanges = new Map();
    for (const [key, value] of canvas!.ranges) savedRanges.set(key, [...value]);
    savedNotesByQuant = canvas!.notesByQuant;
  });
  afterEach(() => {
    canvas!.ranges = savedRanges;
    canvas!.notesByQuant = savedNotesByQuant;
  });

  it("Check that the canvasent contains a canvas", async () => {
    expect(canvas).not.toBeNull();
    expect(canvas?.querySelector("canvas")).not.toBe(null);
  });

  it("draw() renders when dict and ranges are populated", async () => {
    expect(canvas).not.toBeNull();
    expect(canvas!.canvas).not.toBeNull();
    canvas!.draw();
  });

  it("draw() early returns when dict/ranges are empty", async () => {
    // Note: this exercises the !this.canvas guard (element not in DOM), not the
    // ranges.length === 0 guard. See refactor item 15 in wiki/refactor-lily.ts.md.
    const freshCanvas = document.createElement("music-canvas") as MusicCanvas;
    freshCanvas.notesByQuant = new Map();
    freshCanvas.ranges = new Map();
    freshCanvas.draw();
  });

  it("draw() renders every frame at 120Hz during playback (#554)", () => {
    expect(canvas).not.toBeNull();
    // Fixture precondition: draw() returns silently on empty data, so a dead
    // fixture would report 0 renders and masquerade as a throttle regression.
    // notesByQuant is the guard that actually trips on a data-less parse;
    // ranges is seeded per choir-part pair unconditionally (lily.ts), so its
    // size only detects #init never completing.
    expect(canvas!.ranges.size).toBeGreaterThan(0);
    expect(canvas!.notesByQuant.size).toBeGreaterThan(0);

    // Simulate a 120Hz display: rAF fires every ~8.3ms. The old #shouldDraw
    // throttle read Date.now() (not the rAF timestamp), so the clock must be
    // mocked: real elapsed time per iteration of this synchronous loop is
    // nondeterministic — near 0ms when renders are fast, but above the old
    // 10ms threshold when a jsdom render runs slow (see below), in which
    // case a reintroduced throttle would never drop a frame and this test
    // would pass anyway.
    let fakeNow = 100_000;
    const dateSpy = vi.spyOn(Date, "now").mockImplementation(() => fakeNow);

    let rafId = 0;
    const rAFCallbacks: FrameRequestCallback[] = [];
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        rAFCallbacks.push(cb);
        return ++rafId; // distinct non-zero handles, per the platform contract
      });

    // draw() is *called* on every rAF tick regardless of the old throttle
    // (which suppressed rendering inside draw, not the call), so a spy on
    // draw itself would be vacuous. Count effective renders instead:
    // each render clears the full canvas via one fillRect(0, 0, w, h).
    const ctx = canvas!.canvas!.getContext("2d")!;
    const fillRectSpy = vi.spyOn(ctx, "fillRect");

    // The finally block guarantees mock restoration even if the mid-loop
    // rAF-chain assertion or an unexpected play()/draw() exception throws.
    // A leaked frozen Date.now or black-holed rAF cascades failures across
    // the file. (A reintroduced throttle itself throws nothing — it surfaces
    // as a low count at the assertion after the finally.)
    let fullClears: number | undefined;
    try {
      // 12 frames suffice: the throttle's drop pattern alternates (render,
      // drop, render, ...), so any count exposes it — 12/12 without the
      // throttle, 6/12 with it. More frames only slow the suite (a full
      // jsdom canvas render can exceed the old 10ms threshold under load).
      canvas!.playing = true;
      canvas!.play();
      for (let i = 0; i < 12; i++) {
        const cb = rAFCallbacks.shift();
        // A broken rAF chain must name itself, not surface as a low count.
        expect(cb, `rAF chain broke at frame ${i}`).toBeDefined();
        cb!(fakeNow);
        fakeNow += 8.3;
      }

      // Count inside the try: mockRestore() below wipes mock.calls.
      fullClears = fillRectSpy.mock.calls.filter(
        (c) =>
          c[0] === 0 &&
          c[1] === 0 &&
          c[2] === canvas!.canvas!.width &&
          c[3] === canvas!.canvas!.height
      ).length;
    } finally {
      canvas!.playing = false;
      dateSpy.mockRestore();
      rafSpy.mockRestore();
      fillRectSpy.mockRestore();
      canvas!.playLoopId = 0;
    }

    expect(fullClears).toBe(12);
  });

  it("setBar() does not render directly during playback (#554)", () => {
    expect(canvas).not.toBeNull();
    const ctx = canvas!.canvas!.getContext("2d")!;
    const fillRectSpy = vi.spyOn(ctx, "fillRect");
    const countFullClears = () =>
      fillRectSpy.mock.calls.filter(
        (c) =>
          c[0] === 0 &&
          c[1] === 0 &&
          c[2] === canvas!.canvas!.width &&
          c[3] === canvas!.canvas!.height
      ).length;

    // The body must stay synchronous: an await would let the (live, unmocked)
    // shimmer loop fire while paused and inflate the render counts.
    let clearsWhilePlaying: number | undefined;
    let clearsWhilePaused: number | undefined;
    let barWhilePlaying: number | undefined;
    try {
      // While playing, the play loop already renders every rAF tick; setBar
      // (driven by the controls loop, also every tick) must not add a second
      // render per frame. The old throttle silently collapsed that duplicate;
      // with the throttle gone, the guard in setBar is what prevents it.
      canvas!.playing = true;
      canvas!.setBar(10);
      clearsWhilePlaying = countFullClears();
      barWhilePlaying = canvas!.bar;

      // While paused there is no play loop, and no rAF callback can fire
      // while this body stays synchronous; setBar's direct draw is what
      // renders a bar change immediately (in the app the shimmer loop would
      // catch up a frame later) and must remain.
      canvas!.playing = false;
      canvas!.setBar(11);
      clearsWhilePaused = countFullClears() - clearsWhilePlaying;
    } finally {
      canvas!.playing = false;
      fillRectSpy.mockRestore();
    }

    expect(clearsWhilePlaying).toBe(0);
    // The guard must skip only the draw — state must still commit (a
    // top-of-method early return would freeze the bar during playback).
    expect(barWhilePlaying).toBe(10);
    expect(clearsWhilePaused).toBe(1);
    expect(canvas!.bar).toBe(11);
  });

  it("draw() with a specific voice part", async () => {
    expect(canvas).not.toBeNull();
    canvas!.voicePart = 2; // Tenor
    canvas!.bar = 10;
    canvas!.draw();
    canvas!.voicePart = "all";
  });

  it("draw() displays dev info when isOnDevBranch is true", () => {
    expect(canvas).not.toBeNull();
    const ctx = canvas!.canvas!.getContext("2d")!;
    const fillTextSpy = vi.spyOn(ctx, "fillText");

    canvas!.isOnDevBranch = true;
    canvas!.draw();

    const fpsCalls = fillTextSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].startsWith("FPS:")
    );
    expect(fpsCalls.length).toBeGreaterThan(0);

    fillTextSpy.mockRestore();
  });

  it("draw() does not display dev info when isOnDevBranch is false", () => {
    expect(canvas).not.toBeNull();
    const ctx = canvas!.canvas!.getContext("2d")!;
    const fillTextSpy = vi.spyOn(ctx, "fillText");

    canvas!.isOnDevBranch = false;
    canvas!.draw();

    const fpsCalls = fillTextSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].startsWith("FPS:")
    );
    expect(fpsCalls.length).toBe(0);

    fillTextSpy.mockRestore();
  });

  it("initialises shimmer phases for each FR location", () => {
    expect(canvas).not.toBeNull();
    expect(canvas!.shimmerPhases.length).toBe(canvas!.frLocations.length);
    expect(canvas!.shimmerPhases[0]).toBeGreaterThanOrEqual(0);
    expect(canvas!.shimmerPhases[0]).toBeLessThan(Math.PI * 2);
  });

  it("draw() renders false-relation shimmer circles when frLocations are populated", async () => {
    expect(canvas).not.toBeNull();
    expect(canvas!.frLocations.length).toBeGreaterThan(0);
    canvas!.draw();
  });

  it("paused shimmer loop throttles its idle redraws (#649)", () => {
    // The paused shimmer loop used to call draw() on every rAF tick (the
    // display refresh rate, 60-120Hz+) even though only the FR-hotspot breathing
    // changes while paused. The throttle must drop most idle redraws. Mirrors
    // the #554 play-loop test:
    // mock rAF to collect callbacks, drive ticks manually, and count effective
    // renders by the one full-canvas fillRect(0,0,w,h) each draw() issues.
    //
    // The whole body stays synchronous: a fresh canvas's #init runs to
    // completion during appendChild (no awaits in #init), scheduling the first
    // shimmer callback into the mock. Staying synchronous means the real rAF
    // never fires, so the shared fixture's live shimmer loop cannot reschedule
    // into this mock and pollute the count.
    const rAFCallbacks: FrameRequestCallback[] = [];
    let rafId = 0;
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        rAFCallbacks.push(cb);
        return ++rafId;
      });

    const fresh = document.createElement("music-canvas") as MusicCanvas;
    let fullClears: number | undefined;
    try {
      document.body.appendChild(fresh);
      // Preconditions: #init completed, the loop will actually run, and draw()
      // will not early-return on empty data (a dead fixture would report 0
      // clears and masquerade as a throttle).
      expect(fresh.frLocations.length).toBeGreaterThan(0);
      expect(fresh.ranges.size).toBeGreaterThan(0);
      expect(fresh.notesByQuant.size).toBeGreaterThan(0);
      expect(fresh.shimmerLoopId).not.toBe(0);

      // Spy after #init so its one-shot draw is not counted.
      const ctx = fresh.canvas!.getContext("2d")!;
      const fillRectSpy = vi.spyOn(ctx, "fillRect");

      // Drive 12 ticks 50ms apart (a 550ms span). With a ~100ms idle throttle
      // only a few ticks redraw; without any throttle all 12 would.
      const TICKS = 12;
      const STEP_MS = 50;
      let ts = 1000;
      for (let i = 0; i < TICKS; i++) {
        const cb = rAFCallbacks.shift();
        expect(cb, `shimmer rAF chain broke at frame ${i}`).toBeDefined();
        cb!(ts);
        ts += STEP_MS;
      }

      fullClears = fillRectSpy.mock.calls.filter(
        (c) =>
          c[0] === 0 &&
          c[1] === 0 &&
          c[2] === fresh.canvas!.width &&
          c[3] === fresh.canvas!.height
      ).length;
      fillRectSpy.mockRestore();
    } finally {
      rafSpy.mockRestore();
      fresh.remove();
    }

    // Deterministic: #lastShimmerDraw starts at 0 and the 100ms throttle redraws
    // at ts 1000, 1100, 1200, 1300, 1400, 1500 of the 12 ticks at 1000..1550 —
    // exactly 6. The exact count pins the 100ms interval and the `>=` boundary,
    // not merely "a throttle exists": no throttle gives 12, total suppression
    // gives 0, a different interval shifts the count.
    expect(fullClears).toBe(6);
  });

  it("paused shimmer loop does not start when frLocations is empty (#649)", async () => {
    // With no false-relation hotspots there is nothing to animate while paused,
    // so the shimmer loop must not schedule any redraw. The static scene is
    // still painted on demand by setBar/setChoir/setPart.
    //
    // A populated reconnect is used as a positive control: it proves the
    // microtask flush below is enough for connectedCallback's post-await
    // loop-start body to actually run, so the empty case's "no schedule" cannot
    // be a vacuous pass (asserting before the body ran). Both reconnects take
    // #init's early-return path (the canvas already exists), so only microtasks
    // need flushing and the real rAF never fires to pollute the spy.
    const fresh = document.createElement("music-canvas") as MusicCanvas;
    document.body.appendChild(fresh);
    await new Promise((r) => setTimeout(r, 500)); // real #init populates FR data
    const populatedFr = fresh.frLocations;
    expect(populatedFr.length).toBeGreaterThan(0);

    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation(() => 999);
    try {
      // Positive control: reconnect WITH hotspots -> the loop starts under this
      // exact flush regime and schedules one rAF.
      fresh.remove();
      expect(fresh.shimmerLoopId).toBe(0);
      fresh.frLocations = populatedFr;
      document.body.appendChild(fresh);
      await Promise.resolve();
      await Promise.resolve();
      expect(rafSpy).toHaveBeenCalled();
      expect(fresh.shimmerLoopId).not.toBe(0);
      const scheduledWhenPopulated = rafSpy.mock.calls.length;

      // Negative: reconnect with NO hotspots -> no further rAF is scheduled.
      fresh.remove();
      expect(fresh.shimmerLoopId).toBe(0);
      fresh.frLocations = [];
      document.body.appendChild(fresh);
      await Promise.resolve();
      await Promise.resolve();
      expect(rafSpy.mock.calls.length).toBe(scheduledWhenPopulated);
      expect(fresh.shimmerLoopId).toBe(0);
    } finally {
      rafSpy.mockRestore();
      fresh.remove();
    }
  });

  it("seek() clamps to lower bound when seeking backward from bar 0", () => {
    expect(canvas).not.toBeNull();
    const pos = { choir: 0, part: "all" as const, bar: 0 };
    expect(canvas!.seek(pos, -1)).toBe(0);
  });

  it("seek() clamps to upper bound when seeking forward from last bar", () => {
    expect(canvas).not.toBeNull();
    const pos = { choir: 0, part: "all" as const, bar: canvas!.barCount };
    expect(canvas!.seek(pos, +1)).toBe(canvas!.barCount);
  });

  it("seek() finds next section change forward from bar 1", () => {
    expect(canvas).not.toBeNull();
    const pos = { choir: 0, part: "all" as const, bar: 1 };
    const result = canvas!.seek(pos, +1);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(canvas!.barCount);
  });

  it("seek() does not throw when a choir-part range key is absent (#244, now via ranges)", () => {
    expect(canvas).not.toBeNull();
    // seek no longer reads notesByQuant (#598); the #244 "no data -> no throw"
    // intent now applies to the `ranges` lookup, which tolerates an absent
    // "choir-part" key (?? []).
    for (let p = 0; p < config.parts.length; p++)
      canvas!.ranges.delete(`0-${p}`);
    const pos = { choir: 0, part: "all" as const, bar: 1 };
    expect(() => canvas!.seek(pos, +1)).not.toThrow();
  });

  it("seek() backward from bar 1 with no choir-0 ranges returns 0 (#244, now via ranges)", () => {
    expect(canvas).not.toBeNull();
    // With choir 0 silent (no ranges), backward seek finds no flip edge and
    // clamps to bar 0 — the #244 clamp intent, now asserted against `ranges`.
    for (let p = 0; p < config.parts.length; p++)
      canvas!.ranges.set(`0-${p}`, []);
    const pos = { choir: 0, part: "all" as const, bar: 1 };
    expect(canvas!.seek(pos, -1)).toBe(0);
  });

  it("seek() stops at a section boundary that starts on a fractional bar, forward (#598)", () => {
    expect(canvas).not.toBeNull();
    // Choir 0 is silent until 1.5, then sings [1.5, 3.0]; isolate it by clearing
    // every part of choir 0 first, then declaring the one fractional range.
    for (let p = 0; p < config.parts.length; p++)
      canvas!.ranges.set(`0-${p}`, []);
    canvas!.ranges.set("0-0", [{ from: 1.5, to: 3.0 }]);
    const pos = { choir: 0, part: "all" as const, bar: 1 };
    // The old integer scan can only ever return an integer bar; the fractional
    // boundary 1.5 is reachable only by reading `ranges`.
    expect(canvas!.seek(pos, +1)).toBe(1.5);
  });

  it("seek() stops at a fractional section boundary, backward (#598)", () => {
    expect(canvas).not.toBeNull();
    for (let p = 0; p < config.parts.length; p++)
      canvas!.ranges.set(`0-${p}`, []);
    canvas!.ranges.set("0-0", [{ from: 1.5, to: 3.0 }]);
    const pos = { choir: 0, part: "all" as const, bar: 2.5 };
    expect(canvas!.seek(pos, -1)).toBe(1.5);
  });

  it("seek() suppresses an inner edge where the collective state does not flip (#598)", () => {
    expect(canvas).not.toBeNull();
    // Two contiguous parts sing back-to-back: part 0 [1.5, 3.0], part 1 [3.0, 4.5].
    // "Any part singing" never changes at the shared edge 3.0, so seek must skip
    // it. Seeking forward from 2.0 (inside part 0's range, BELOW the shared edge)
    // must land on 4.5: if the collective-flip filter regressed, the unsuppressed
    // 3.0 would be returned instead. (A start above 3.0 would not bite — 3.0 is
    // already behind it.)
    for (let p = 0; p < config.parts.length; p++)
      canvas!.ranges.set(`0-${p}`, []);
    canvas!.ranges.set("0-0", [{ from: 1.5, to: 3.0 }]);
    canvas!.ranges.set("0-1", [{ from: 3.0, to: 4.5 }]);
    expect(canvas!.seek({ choir: 0, part: "all" as const, bar: 2.0 }, +1)).toBe(
      4.5
    );
    // Forward from 1 still finds the genuine first flip at 1.5.
    expect(canvas!.seek({ choir: 0, part: "all" as const, bar: 1 }, +1)).toBe(
      1.5
    );
  });

  it("seek() unions ranges across parts, not just part 0 (#598)", () => {
    expect(canvas).not.toBeNull();
    // The only singing part of choir 0 is part 3; its boundary must still be
    // found via the "any part" union, not just part 0.
    for (let p = 0; p < config.parts.length; p++)
      canvas!.ranges.set(`0-${p}`, []);
    canvas!.ranges.set("0-3", [{ from: 2.5, to: 4.0 }]);
    expect(canvas!.seek({ choir: 0, part: "all" as const, bar: 1 }, +1)).toBe(
      2.5
    );
  });

  it("canvas click fires music-canvas-click event", async () => {
    expect(canvas).not.toBeNull();
    const promise = new Promise<void>((resolve) => {
      canvas!.addEventListener("music-canvas-click", () => resolve(), {
        once: true,
      });
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 1400,
          height: 400,
          top: 0,
          left: 0,
          right: 1400,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const mouseEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 50,
    });
    Object.defineProperty(mouseEvent, "offsetX", { value: 100 });
    Object.defineProperty(mouseEvent, "offsetY", { value: 50 });

    canvas!.querySelector("canvas")!.dispatchEvent(mouseEvent);
    await promise;
  });

  it("canvas mousemove fires music-canvas-hover event", async () => {
    expect(canvas).not.toBeNull();
    const promise = new Promise<void>((resolve) => {
      canvas!.addEventListener("music-canvas-hover", () => resolve(), {
        once: true,
      });
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 1400,
          height: 400,
          top: 0,
          left: 0,
          right: 1400,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const mouseEvent = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: 200,
      clientY: 100,
    });
    Object.defineProperty(mouseEvent, "offsetX", { value: 200 });
    Object.defineProperty(mouseEvent, "offsetY", { value: 100 });

    canvas!.querySelector("canvas")!.dispatchEvent(mouseEvent);
    await promise;
  });

  it("canvas touch events fire correctly", async () => {
    expect(canvas).not.toBeNull();

    const startPromise = new Promise<void>((resolve) => {
      canvas!.addEventListener("music-canvas-touchstart", () => resolve(), {
        once: true,
      });
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 1400,
          height: 400,
          top: 0,
          left: 0,
          right: 1400,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const innerCanvas = canvas!.querySelector("canvas")!;

    const touch = {
      clientX: 100,
      clientY: 50,
      identifier: 0,
      target: innerCanvas,
    };
    const touchStart = new Event("touchstart", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchStart, "targetTouches", { value: [touch] });
    Object.defineProperty(touchStart, "changedTouches", { value: [touch] });
    Object.defineProperty(touchStart, "preventDefault", { value: vi.fn() });

    innerCanvas.dispatchEvent(touchStart);
    await startPromise;

    const movePromise = new Promise<void>((resolve) => {
      canvas!.addEventListener("music-canvas-touchmove", () => resolve(), {
        once: true,
      });
    });
    const touchMove = new Event("touchmove", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchMove, "targetTouches", { value: [touch] });
    Object.defineProperty(touchMove, "changedTouches", { value: [touch] });
    Object.defineProperty(touchMove, "preventDefault", { value: vi.fn() });
    canvas!.dispatchEvent(touchMove);
    await movePromise;

    const endPromise = new Promise<void>((resolve) => {
      canvas!.addEventListener("music-canvas-touchend", () => resolve(), {
        once: true,
      });
    });
    const touchEnd = new Event("touchend", { bubbles: true, cancelable: true });
    Object.defineProperty(touchEnd, "preventDefault", { value: vi.fn() });
    canvas!.dispatchEvent(touchEnd);
    await endPromise;
  });

  it("getTouchPos resolves a position when the touch is not in targetTouches", async () => {
    expect(canvas).not.toBeNull();

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 1400,
          height: 400,
          top: 0,
          left: 0,
          right: 1400,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const innerCanvas = canvas!.querySelector("canvas")!;
    const touch = {
      clientX: 100,
      clientY: 50,
      identifier: 0,
      target: innerCanvas,
    };

    // Scenario: the user's finger has left the target element, so
    // targetTouches is empty, but the touch that triggered the event
    // is still in changedTouches. Reading targetTouches[0] here would
    // crash with TypeError; reading changedTouches[0] survives.
    //
    // The falsifier is `await startPromise`: when getTouchPos throws,
    // the touchstart handler aborts before firing the CustomEvent,
    // the promise never resolves, and the test times out (jsdom
    // routes listener exceptions to window.onerror rather than
    // propagating to dispatchEvent's caller — so a `not.toThrow()`
    // around the dispatch is vacuously true and cannot bind here).
    const startPromise = new Promise<CustomEvent<{ position: Position }>>(
      (resolve) => {
        canvas!.addEventListener(
          "music-canvas-touchstart",
          (e) => resolve(e as CustomEvent<{ position: Position }>),
          { once: true }
        );
      }
    );
    const touchStart = new Event("touchstart", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchStart, "targetTouches", { value: [] });
    Object.defineProperty(touchStart, "changedTouches", { value: [touch] });
    Object.defineProperty(touchStart, "preventDefault", { value: vi.fn() });

    innerCanvas.dispatchEvent(touchStart);
    const startEvent = await startPromise;
    const pos = startEvent.detail.position;

    // Positive controls: prove getTouchPos was actually invoked and
    // moveToPosition consumed its output. bar=9 is deterministic
    // from the math (floor((100-5) * 140 / 1400)); choir depends
    // on config.choirs[0].length so we range-check it.
    expect(pos.bar).toBe(9);
    expect(pos.choir).toBeGreaterThanOrEqual(0);
    expect(pos.choir).toBeLessThan(config.choirs[0].length);
    expect(canvas!.bar).toBe(pos.bar);
    expect(canvas!.choir).toBe(pos.choir);
  });

  // The touchmove counterpart of the above test was removed in cycle 2:
  // post-#326 (PR #400), `#touchMoved` no longer calls `#getTouchPos`,
  // so the only path that reads `changedTouches[0]` is `#touchStarted`.
  // The touchstart test above fully covers the production surface; the
  // removed touchmove version was passing only because the preceding
  // touchstart had set `canvas!.bar = 9`, which the touchmove handler
  // — now performing no commit — could not have set on its own.

  it("getMousePos returns valid part for clicks in top padding", async () => {
    expect(canvas).not.toBeNull();

    const promise = new Promise<CustomEvent>((resolve) => {
      canvas!.addEventListener(
        "music-canvas-click",
        (e) => resolve(e as CustomEvent),
        { once: true }
      );
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 1400,
          height: 400,
          top: 0,
          left: 0,
          right: 1400,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const mouseEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 2,
    });
    Object.defineProperty(mouseEvent, "offsetX", { value: 100 });
    Object.defineProperty(mouseEvent, "offsetY", { value: 2 });

    canvas!.querySelector("canvas")!.dispatchEvent(mouseEvent);
    const event = await promise;
    const pos = event.detail.position;
    expect(pos.part).toBeGreaterThanOrEqual(0);
    expect(pos.part).toBeLessThan(config.parts.length);
    expect(pos.choir).toBeGreaterThanOrEqual(0);
    expect(pos.choir).toBeLessThan(config.choirs[0].length);
    expect(pos.bar).toBeGreaterThanOrEqual(0);
    expect(pos.bar).toBeLessThan(140);
  });

  it("getMousePos returns valid bar for clicks in left padding", async () => {
    expect(canvas).not.toBeNull();

    const promise = new Promise<CustomEvent>((resolve) => {
      canvas!.addEventListener(
        "music-canvas-click",
        (e) => resolve(e as CustomEvent),
        { once: true }
      );
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 1400,
          height: 400,
          top: 0,
          left: 0,
          right: 1400,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const mouseEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: 2,
      clientY: 50,
    });
    Object.defineProperty(mouseEvent, "offsetX", { value: 2 });
    Object.defineProperty(mouseEvent, "offsetY", { value: 50 });

    canvas!.querySelector("canvas")!.dispatchEvent(mouseEvent);
    const event = await promise;
    const pos = event.detail.position;
    expect(pos.bar).toBeGreaterThanOrEqual(0);
    expect(pos.bar).toBeLessThan(140);
    expect(pos.choir).toBeGreaterThanOrEqual(0);
    expect(pos.choir).toBeLessThan(config.choirs[0].length);
    expect(pos.part).toBeGreaterThanOrEqual(0);
    expect(pos.part).toBeLessThan(config.parts.length);
  });

  it("getMousePos returns valid bar for clicks in right padding", async () => {
    expect(canvas).not.toBeNull();

    const promise = new Promise<CustomEvent>((resolve) => {
      canvas!.addEventListener(
        "music-canvas-click",
        (e) => resolve(e as CustomEvent),
        { once: true }
      );
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 1400,
          height: 400,
          top: 0,
          left: 0,
          right: 1400,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const mouseEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: 1398,
      clientY: 50,
    });
    Object.defineProperty(mouseEvent, "offsetX", { value: 1398 });
    Object.defineProperty(mouseEvent, "offsetY", { value: 50 });

    canvas!.querySelector("canvas")!.dispatchEvent(mouseEvent);
    const event = await promise;
    const pos = event.detail.position;
    expect(pos.bar).toBeGreaterThanOrEqual(0);
    expect(pos.bar).toBeLessThan(140);
    expect(pos.choir).toBeGreaterThanOrEqual(0);
    expect(pos.choir).toBeLessThan(config.choirs[0].length);
    expect(pos.part).toBeGreaterThanOrEqual(0);
    expect(pos.part).toBeLessThan(config.parts.length);
  });

  it("getTouchPos returns valid bar for touches in left padding", async () => {
    expect(canvas).not.toBeNull();

    const promise = new Promise<CustomEvent>((resolve) => {
      canvas!.addEventListener(
        "music-canvas-touchstart",
        (e) => resolve(e as CustomEvent),
        { once: true }
      );
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 1400,
          height: 400,
          top: 0,
          left: 0,
          right: 1400,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const innerCanvas = canvas!.querySelector("canvas")!;
    const touch = {
      clientX: 2,
      clientY: 50,
      identifier: 0,
      target: innerCanvas,
    };
    const touchStart = new Event("touchstart", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchStart, "targetTouches", { value: [touch] });
    Object.defineProperty(touchStart, "changedTouches", { value: [touch] });
    Object.defineProperty(touchStart, "preventDefault", { value: vi.fn() });

    innerCanvas.dispatchEvent(touchStart);
    const event = await promise;
    const pos = event.detail.position;
    expect(pos.bar).toBeGreaterThanOrEqual(0);
    expect(pos.bar).toBeLessThan(140);
    expect(pos.choir).toBeGreaterThanOrEqual(0);
    expect(pos.choir).toBeLessThan(config.choirs[0].length);
  });

  it("getMousePos returns bar 0 at left edge on a 200px viewport (#204)", async () => {
    expect(canvas).not.toBeNull();

    const promise = new Promise<CustomEvent>((resolve) => {
      canvas!.addEventListener(
        "music-canvas-click",
        (e) => resolve(e as CustomEvent),
        {
          once: true,
        }
      );
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 200,
          height: 400,
          top: 0,
          left: 0,
          right: 200,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const mouseEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: 0,
      clientY: 50,
    });
    Object.defineProperty(mouseEvent, "offsetX", { value: 0 });
    Object.defineProperty(mouseEvent, "offsetY", { value: 50 });

    canvas!.querySelector("canvas")!.dispatchEvent(mouseEvent);
    const event = await promise;
    const pos = event.detail.position;
    expect(pos.bar).toBe(0);
  });

  it("getMousePos returns last bar at right edge on a 200px viewport (#204)", async () => {
    expect(canvas).not.toBeNull();

    const promise = new Promise<CustomEvent>((resolve) => {
      canvas!.addEventListener(
        "music-canvas-click",
        (e) => resolve(e as CustomEvent),
        {
          once: true,
        }
      );
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 200,
          height: 400,
          top: 0,
          left: 0,
          right: 200,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const mouseEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: 200,
      clientY: 50,
    });
    Object.defineProperty(mouseEvent, "offsetX", { value: 200 });
    Object.defineProperty(mouseEvent, "offsetY", { value: 50 });

    canvas!.querySelector("canvas")!.dispatchEvent(mouseEvent);
    const event = await promise;
    const pos = event.detail.position;
    expect(pos.bar).toBe(canvas!.barCount);
  });

  it("getMousePos returns mid bar at centre on narrow viewports (#204)", async () => {
    expect(canvas).not.toBeNull();

    for (const width of [200, 400, 800]) {
      const promise = new Promise<CustomEvent>((resolve) => {
        canvas!.addEventListener(
          "music-canvas-click",
          (e) => resolve(e as CustomEvent),
          {
            once: true,
          }
        );
      });

      canvas!.getBoundingClientRect = vi.fn(
        () =>
          ({
            width,
            height: 400,
            top: 0,
            left: 0,
            right: width,
            bottom: 400,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          }) as DOMRect
      );

      const mouseEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: width / 2,
        clientY: 50,
      });
      Object.defineProperty(mouseEvent, "offsetX", { value: width / 2 });
      Object.defineProperty(mouseEvent, "offsetY", { value: 50 });

      canvas!.querySelector("canvas")!.dispatchEvent(mouseEvent);
      const event = await promise;
      const pos = event.detail.position;
      expect(pos.bar).toBe(Math.floor(canvas!.barCount / 2));
    }
  });

  it("getTouchPos returns bar 0 at left edge on a 200px viewport (#204)", async () => {
    expect(canvas).not.toBeNull();

    const promise = new Promise<CustomEvent>((resolve) => {
      canvas!.addEventListener(
        "music-canvas-touchstart",
        (e) => resolve(e as CustomEvent),
        { once: true }
      );
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 200,
          height: 400,
          top: 0,
          left: 0,
          right: 200,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const innerCanvas = canvas!.querySelector("canvas")!;
    const touch = {
      clientX: 0,
      clientY: 50,
      identifier: 0,
      target: innerCanvas,
    };
    const touchStart = new Event("touchstart", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchStart, "targetTouches", { value: [touch] });
    Object.defineProperty(touchStart, "changedTouches", { value: [touch] });
    Object.defineProperty(touchStart, "preventDefault", { value: vi.fn() });

    innerCanvas.dispatchEvent(touchStart);
    const event = await promise;
    const pos = event.detail.position;
    expect(pos.bar).toBe(0);
  });

  it("getTouchPos returns last bar at right edge on a 200px viewport (#204)", async () => {
    expect(canvas).not.toBeNull();

    const promise = new Promise<CustomEvent>((resolve) => {
      canvas!.addEventListener(
        "music-canvas-touchstart",
        (e) => resolve(e as CustomEvent),
        { once: true }
      );
    });

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 200,
          height: 400,
          top: 0,
          left: 0,
          right: 200,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    const innerCanvas = canvas!.querySelector("canvas")!;
    const touch = {
      clientX: 200,
      clientY: 50,
      identifier: 0,
      target: innerCanvas,
    };
    const touchStart = new Event("touchstart", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchStart, "targetTouches", { value: [touch] });
    Object.defineProperty(touchStart, "changedTouches", { value: [touch] });
    Object.defineProperty(touchStart, "preventDefault", { value: vi.fn() });

    innerCanvas.dispatchEvent(touchStart);
    const event = await promise;
    const pos = event.detail.position;
    expect(pos.bar).toBe(canvas!.barCount);
  });

  it("getTouchPos returns mid bar at centre on narrow viewports (#204)", async () => {
    expect(canvas).not.toBeNull();

    for (const width of [200, 400, 800]) {
      const promise = new Promise<CustomEvent>((resolve) => {
        canvas!.addEventListener(
          "music-canvas-touchstart",
          (e) => resolve(e as CustomEvent),
          { once: true }
        );
      });

      canvas!.getBoundingClientRect = vi.fn(
        () =>
          ({
            width,
            height: 400,
            top: 0,
            left: 0,
            right: width,
            bottom: 400,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          }) as DOMRect
      );

      const innerCanvas = canvas!.querySelector("canvas")!;
      const touch = {
        clientX: width / 2,
        clientY: 50,
        identifier: 0,
        target: innerCanvas,
      };
      const touchStart = new Event("touchstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchStart, "targetTouches", { value: [touch] });
      Object.defineProperty(touchStart, "changedTouches", { value: [touch] });
      Object.defineProperty(touchStart, "preventDefault", { value: vi.fn() });

      innerCanvas.dispatchEvent(touchStart);
      const event = await promise;
      const pos = event.detail.position;
      expect(pos.bar).toBe(Math.floor(canvas!.barCount / 2));
    }
  });

  it("touchstart commits position (#326)", async () => {
    // Inverse contract for the #326 touchmove fix: touchstart MUST still
    // commit. A future refactor that drops the `#moveToPosition` call from
    // `#touchStarted` (structurally identical to the line we removed from
    // `#touchMoved`) needs to fail this test.
    expect(canvas).not.toBeNull();

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 1400,
          height: 400,
          top: 0,
          left: 0,
          right: 1400,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    // Seed sentinel values that the derived coord-A position MUST differ from
    // (canvasPadding=5; (1200,300) maps to choir≈6, bar≈119, voicePart="all").
    canvas!.choir = 0;
    canvas!.voicePart = 2;
    canvas!.bar = 50;

    const startPromise = new Promise<void>((resolve) => {
      canvas!.addEventListener("music-canvas-touchstart", () => resolve(), {
        once: true,
      });
    });

    const innerCanvas = canvas!.querySelector("canvas")!;
    const touch = {
      clientX: 1200,
      clientY: 300,
      identifier: 0,
      target: innerCanvas,
    };
    const touchStart = new Event("touchstart", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchStart, "targetTouches", { value: [touch] });
    // Post-#388, `#getTouchPos` reads `changedTouches[0]` unconditionally
    // (see #388 for the production rationale), so synthetic TouchEvents in
    // tests must populate `changedTouches` or the getter throws `TypeError:
    // Cannot read properties of undefined`. This isn't browser-specific —
    // the read happens in our own code.
    Object.defineProperty(touchStart, "changedTouches", { value: [touch] });
    Object.defineProperty(touchStart, "preventDefault", { value: vi.fn() });

    innerCanvas.dispatchEvent(touchStart);
    await startPromise;

    // State must have been committed to the derived position. voicePart is the
    // load-bearing falsifier: `#getTouchPos` hard-codes "all" (see #327), so
    // any commit replaces the seeded `2` with `"all"`.
    expect(canvas!.voicePart).toBe("all");
    expect(canvas!.choir).not.toBe(0);
    expect(canvas!.bar).not.toBe(50);
  });

  it("touchmove does not commit position (#326)", async () => {
    expect(canvas).not.toBeNull();

    canvas!.getBoundingClientRect = vi.fn(
      () =>
        ({
          width: 1400,
          height: 400,
          top: 0,
          left: 0,
          right: 1400,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    // Seed sentinel values that DIFFER from what `#getTouchPos` would derive at
    // (1200,300) (which is choir≈6, bar≈119, voicePart="all"). The seeded
    // `voicePart=2` is the load-bearing falsifier: if touchmove ever commits,
    // it would be overwritten with "all" (hard-coded by `#getTouchPos`).
    canvas!.choir = 0;
    canvas!.voicePart = 2;
    canvas!.bar = 50;

    const movePromise = new Promise<void>((resolve) => {
      canvas!.addEventListener("music-canvas-touchmove", () => resolve(), {
        once: true,
      });
    });

    const innerCanvas = canvas!.querySelector("canvas")!;
    const touch = {
      clientX: 1200,
      clientY: 300,
      identifier: 0,
      target: innerCanvas,
    };
    const touchMove = new Event("touchmove", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchMove, "targetTouches", { value: [touch] });
    // Defensive mirror — `#touchMoved` does not currently read
    // `changedTouches` (post-#326 it does not call `#getTouchPos`), so this
    // is not load-bearing. Mirroring keeps the fixture consistent with the
    // touchstart counterpart and future-proofs against a refactor that
    // re-introduces `#getTouchPos` into the move path.
    Object.defineProperty(touchMove, "changedTouches", { value: [touch] });
    Object.defineProperty(touchMove, "preventDefault", { value: vi.fn() });

    innerCanvas.dispatchEvent(touchMove);
    await movePromise;

    // Internal state must remain at the seeded values — no commit on move.
    expect(canvas!.choir).toBe(0);
    expect(canvas!.voicePart).toBe(2);
    expect(canvas!.bar).toBe(50);
  });

  it("calling play() while already playing cancels the previous rAF loop (#245)", () => {
    expect(canvas).not.toBeNull();
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockReturnValue(42);

    canvas!.playing = true;
    canvas!.play();
    expect(cancelSpy).not.toHaveBeenCalled();

    canvas!.play();
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(cancelSpy).toHaveBeenLastCalledWith(42);

    cancelSpy.mockRestore();
    rafSpy.mockRestore();
    canvas!.playing = false;
    canvas!.playLoopId = 0;
  });

  it("setPlaying(false) cancels the playback rAF loop (#402)", () => {
    expect(canvas).not.toBeNull();
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockReturnValue(42);

    canvas!.playing = true;
    canvas!.play();
    expect(cancelSpy).not.toHaveBeenCalled();

    canvas!.setPlaying(false);
    expect(cancelSpy).toHaveBeenCalledWith(42);

    cancelSpy.mockRestore();
    rafSpy.mockRestore();
    canvas!.playLoopId = 0;
  });

  it("disconnect and reconnect restarts the shimmer loop (#245)", async () => {
    const freshCanvas = document.createElement("music-canvas") as MusicCanvas;
    document.body.appendChild(freshCanvas);

    expect(freshCanvas.shimmerLoopId).not.toBe(0);
    const oldShimmerId = freshCanvas.shimmerLoopId;

    freshCanvas.remove();
    expect(freshCanvas.shimmerLoopId).toBe(0);

    document.body.appendChild(freshCanvas);
    await Promise.resolve();

    expect(freshCanvas.shimmerLoopId).not.toBe(0);
    expect(freshCanvas.shimmerLoopId).not.toBe(oldShimmerId);

    freshCanvas.remove();
  });

  it("disconnect and reconnect during playback restarts the play loop (#554)", async () => {
    const freshCanvas = document.createElement("music-canvas") as MusicCanvas;
    document.body.appendChild(freshCanvas);

    freshCanvas.setPlaying(true);
    expect(freshCanvas.playLoopId).not.toBe(0);

    freshCanvas.remove();
    expect(freshCanvas.playLoopId).toBe(0);
    // disconnectedCallback cancels the loop but leaves playing true — that
    // desync is the scenario under test.
    expect(freshCanvas.playing).toBe(true);

    document.body.appendChild(freshCanvas);
    await Promise.resolve();

    // Without a restart the canvas is silently frozen: playing is true, no
    // loop runs, and the setBar guard skips the controls-driven draws that
    // used to be the de-facto fallback render path.
    expect(freshCanvas.playLoopId).not.toBe(0);

    freshCanvas.setPlaying(false);
    freshCanvas.remove();
  });

  it("removes all event listeners on disconnect and re-adds them on reconnect (#203)", async () => {
    const freshCanvas = document.createElement("music-canvas") as MusicCanvas;
    document.body.appendChild(freshCanvas);

    const innerCanvas = freshCanvas.querySelector("canvas")!;
    const addCanvasSpy = vi.spyOn(innerCanvas, "addEventListener");
    const removeCanvasSpy = vi.spyOn(innerCanvas, "removeEventListener");
    const addElemSpy = vi.spyOn(freshCanvas, "addEventListener");
    const removeElemSpy = vi.spyOn(freshCanvas, "removeEventListener");

    // Clear calls from initialisation so we only measure disconnect/reconnect
    addCanvasSpy.mockClear();
    addElemSpy.mockClear();
    removeCanvasSpy.mockClear();
    removeElemSpy.mockClear();

    freshCanvas.remove();

    expect(removeCanvasSpy).toHaveBeenCalledWith("click", expect.any(Function));
    expect(removeCanvasSpy).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function),
      false
    );
    expect(removeCanvasSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function)
    );
    expect(removeElemSpy).toHaveBeenCalledWith(
      "touchmove",
      expect.any(Function)
    );
    expect(removeElemSpy).toHaveBeenCalledWith(
      "touchend",
      expect.any(Function)
    );
    expect(removeElemSpy).toHaveBeenCalledWith("wheel", expect.any(Function));

    // Clear calls from disconnect so we only measure reconnect
    addCanvasSpy.mockClear();
    addElemSpy.mockClear();
    removeCanvasSpy.mockClear();
    removeElemSpy.mockClear();

    document.body.appendChild(freshCanvas);
    await Promise.resolve();

    expect(addCanvasSpy).toHaveBeenCalledWith("click", expect.any(Function));
    expect(addCanvasSpy).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function),
      false
    );
    expect(addCanvasSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
      { passive: false }
    );
    expect(addElemSpy).toHaveBeenCalledWith("touchmove", expect.any(Function), {
      passive: false,
    });
    expect(addElemSpy).toHaveBeenCalledWith("touchend", expect.any(Function), {
      passive: false,
    });
    expect(addElemSpy).toHaveBeenCalledWith("wheel", expect.any(Function), {
      passive: false,
    });

    addCanvasSpy.mockRestore();
    removeCanvasSpy.mockRestore();
    addElemSpy.mockRestore();
    removeElemSpy.mockRestore();
    freshCanvas.remove();
  });

  it("reconnect does not re-run first-init work (#651)", async () => {
    const freshCanvas = document.createElement("music-canvas") as MusicCanvas;
    document.body.appendChild(freshCanvas);
    await Promise.resolve();

    const originalInnerCanvas = freshCanvas.querySelector("canvas")!;
    const originalShimmerPhases = freshCanvas.shimmerPhases;
    const originalFalseRelationPulses = freshCanvas.falseRelationPulses;
    // Guard against a vacuous identity probe: shimmerPhases must be a populated
    // array so a re-run would produce a different one.
    expect(originalShimmerPhases.length).toBeGreaterThan(0);

    freshCanvas.remove();
    // The <canvas> survives disconnect (disconnectedCallback removes listeners
    // and cancels loops but does not null this.canvas); this is the invariant
    // the firstInit sentinel relies on to take the reconnect path.
    expect(freshCanvas.canvas).toBe(originalInnerCanvas);

    document.body.appendChild(freshCanvas);
    await Promise.resolve();

    // The reconnect (early-return) path re-attaches listeners but must NOT
    // re-run first-init work: the <canvas> is not recreated, and the freshly
    // minted first-init arrays (random shimmerPhases via map, falseRelationPulses
    // via new Array) keep their identity. These two are the right re-run probes:
    // they are rebuilt on every #init, unlike frLocations/notesByQuant/ranges,
    // which processLilypond memoises and would return by the same reference.
    expect(freshCanvas.querySelector("canvas")).toBe(originalInnerCanvas);
    expect(freshCanvas.shimmerPhases).toBe(originalShimmerPhases);
    expect(freshCanvas.falseRelationPulses).toBe(originalFalseRelationPulses);

    freshCanvas.remove();
  });

  it("prevents default on vertical wheel events but not on horizontal/zero scroll (#676)", () => {
    expect(canvas).not.toBeNull();

    const wheelEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(wheelEvent, "deltaY", { value: 10 });

    const preventDefaultSpy = vi.spyOn(wheelEvent, "preventDefault");
    canvas!.dispatchEvent(wheelEvent);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);

    const horizontalWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(horizontalWheel, "deltaY", { value: 0 });
    const horizontalPreventSpy = vi.spyOn(horizontalWheel, "preventDefault");
    canvas!.dispatchEvent(horizontalWheel);
    expect(horizontalPreventSpy).not.toHaveBeenCalled();

    preventDefaultSpy.mockRestore();
    horizontalPreventSpy.mockRestore();
  });

  it("setChoir and setPart redraw the overview (#676)", () => {
    expect(canvas).not.toBeNull();
    const drawSpy = vi.spyOn(canvas!, "draw");

    canvas!.setChoir(1);
    expect(drawSpy).toHaveBeenCalled();

    drawSpy.mockClear();
    canvas!.setPart(0);
    expect(drawSpy).toHaveBeenCalled();

    drawSpy.mockRestore();
  });

  it("play() rAF loop stops itself when playing becomes false (#676)", () => {
    expect(canvas).not.toBeNull();
    const rafCallbacks: FrameRequestCallback[] = [];
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });

    canvas!.playing = true;
    canvas!.play();
    expect(rafSpy).toHaveBeenCalledTimes(1);

    canvas!.playing = false;
    const cb = rafCallbacks.shift();
    expect(cb).toBeDefined();
    cb!(performance.now());

    // The loop must not schedule another frame once playing is false.
    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(canvas!.playLoopId).toBe(0);

    rafSpy.mockRestore();
  });

  it("pulses a note that onsets off the 1/16 grid (#704)", () => {
    expect(canvas).not.toBeNull();

    const onset = 0.03125; // 1/32 bar, between 1/16 quant points
    const note = new Note("a", null, null, new Duration("16"), null);
    canvas!.notesByQuant = new Map([[onset, [{ c: 0, p: 0, n: note }]]]);
    canvas!.bar = onset;
    canvas!.draw();

    expect(canvas!.lastNoteStart[0][0]).toBe(onset);
    expect(canvas!.lastNoteDuration[0][0]).toBe(4 / 128);
    expect(canvas!.pulses[0][0]).not.toBe(1);
  });

  it("still pulses notes on 1/16 and whole-bar boundaries after the finer quant (#704)", () => {
    expect(canvas).not.toBeNull();

    const note16 = new Note("b", null, null, new Duration("16"), null);
    const noteWhole = new Note("c", null, null, new Duration("1"), null);
    canvas!.notesByQuant = new Map([
      [0.0625, [{ c: 0, p: 1, n: note16 }]],
      [2.0, [{ c: 1, p: 2, n: noteWhole }]],
    ]);

    canvas!.bar = 0.0625;
    canvas!.draw();
    expect(canvas!.lastNoteStart[0][1]).toBe(0.0625);
    expect(canvas!.lastNoteDuration[0][1]).toBe(4 / 128);
    expect(canvas!.pulses[0][1]).not.toBe(1);

    canvas!.bar = 2.0;
    canvas!.draw();
    expect(canvas!.lastNoteStart[1][2]).toBe(2.0);
    expect(canvas!.lastNoteDuration[1][2]).toBe(64 / 128);
    expect(canvas!.pulses[1][2]).not.toBe(1);
  });
});
