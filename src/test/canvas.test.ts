import { MusicCanvas } from "../ts/MusicCanvas";
import config from "../ts/config";
import type { Position } from "../ts/common";
MusicCanvas.define("music-canvas");

var canvas: MusicCanvas | null;
describe("MusicCanvas custom element", () => {
  beforeAll(async () => {
    document.body.innerHTML = `<music-canvas></music-canvas>`;
    canvas = document.querySelector("music-canvas");
    // Wait for connectedCallback -> #init -> processLilypond -> draw
    await new Promise((r) => setTimeout(r, 500));
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  it("Check that the canvasent contains a canvas", async () => {
    expect(canvas).not.toBeNull();
    console.log(canvas?.innerHTML);
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
    freshCanvas.dict = [];
    freshCanvas.ranges = [];
    freshCanvas.draw();
  });

  it("draw() executes during playback without throttling", () => {
    expect(canvas).not.toBeNull();
    canvas!.playing = true;
    canvas!.draw();
    canvas!.playing = false;
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

  it("seek() does not throw when dict[intbar] is undefined (#244)", () => {
    expect(canvas).not.toBeNull();
    const saved = canvas!.dict[2];
    delete canvas!.dict[2];
    const pos = { choir: 0, part: "all" as const, bar: 1 };
    expect(() => canvas!.seek(pos, +1)).not.toThrow();
    canvas!.dict[2] = saved;
  });

  it("seek() backward from bar 1 with empty dict[0] returns 0 (#244)", () => {
    expect(canvas).not.toBeNull();
    const saved = canvas!.dict[0];
    delete canvas!.dict[0];
    const pos = { choir: 0, part: "all" as const, bar: 1 };
    expect(canvas!.seek(pos, -1)).toBe(0);
    canvas!.dict[0] = saved;
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

    // Seed sentinel values that the derived coord-A position MUST differ
    // from. With the current `config.choirs[0].length` and `config.parts.length`
    // (and `canvasPadding=5`), `#getTouchPos` at (1200,300) maps to
    // choir≈6, bar≈119, voicePart=0 — see #327's table-driven test below
    // for the part derivation.
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

    // State must have been committed to the derived position. The
    // load-bearing #326 contract is "touchstart commits"; the falsifier
    // is the seeded `voicePart=2` differing from the derived value. The
    // specific derived value is #327's arithmetic and is pinned by the
    // table-driven test below, not here.
    expect(canvas!.voicePart).not.toBe(2);
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

    // Seed sentinel values that DIFFER from what `#getTouchPos` would
    // derive at (1200,300) (choir≈6, bar≈119 via `#getTouchPos`, voicePart=0
    // post-#327). The seeded `voicePart=2` is the load-bearing falsifier:
    // if touchmove ever commits, it would be overwritten with the derived
    // value.
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

  // #327: touch must select a specific part (0..parts.length-1) instead
  // of always "all". Table covers each part row inside choir 0.
  //
  // Derivation (assuming the mocked 1400x400 rect, `canvasPadding=5`, and
  // the current `config.choirs[0].length` and `config.parts.length`):
  //   y    = (clientY - canvasPadding) * choirs.length / (height - 2*padding)
  //   part = floor((y % 1) * parts.length)
  //
  // The literal expected-part values below assume the current config
  // (8 choirs, 5 parts, padding 5) and the 1400x400 mock; if those change,
  // the table needs regenerating. The chosen clientY values land
  // comfortably mid-row (≥ 0.3 from the nearest boundary) so floating-point
  // jitter cannot flip the assertion.
  it.each([
    [10, 0],
    [20, 1],
    [30, 2],
    [40, 3],
    [50, 4],
  ])(
    "touchstart at clientY=%i selects part %i (#327)",
    async (clientY, expectedPart) => {
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
        clientX: 100,
        clientY,
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
      expect(event.detail.position.part).toBe(expectedPart);
    }
  );

  // #327 boundary cases — the two subtle edges the `#getTouchPos` clamp
  // comment reasons about, neither of which the mid-row table above exercises:
  //   - Bottom edge (clientY past height-padding): clampedY pins to
  //     height-padding, so y === choirs.length exactly. `choir` saturates via
  //     its Math.min clamp while `part` wraps to 0 (y % 1 === 0). Guards the
  //     choir clamp ceiling — a regression in the ceiling would change part
  //     or choir here silently.
  //   - Choir boundary: part runs 0..parts.length-1 within a choir and resets
  //     to 0 in the next choir. Guards the `y % 1` wrap (part is per-choir).
  // [clientY, expectedChoir, expectedPart] for the same 1400x400 mock; see the
  // derivation comment on the table above for the config dependence.
  it.each([
    [399, 7, 0], // clamped to the bottom edge: choir saturates, part wraps to 0
    [49, 0, 4], // last part of choir 0
    [59, 1, 0], // first part of choir 1 — part resets across the boundary
  ])(
    "touchstart at clientY=%i selects choir %i part %i (#327)",
    async (clientY, expectedChoir, expectedPart) => {
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
        clientX: 100,
        clientY,
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
      expect(event.detail.position.choir).toBe(expectedChoir);
      expect(event.detail.position.part).toBe(expectedPart);
    }
  );
});
