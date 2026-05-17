import { MusicCanvas } from "../ts/MusicCanvas";
import config from "../ts/config";
import {
  processLilypond,
  dict,
  ranges,
  barCount,
  frLocations,
} from "../ts/lily";

MusicCanvas.define("music-canvas");
processLilypond();

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
    const savedDict = dict.splice(0);
    const savedRanges = ranges.splice(0);
    const freshCanvas = document.createElement("music-canvas") as MusicCanvas;
    document.body.appendChild(freshCanvas);
    freshCanvas.draw();
    document.body.removeChild(freshCanvas);
    dict.push(...savedDict);
    ranges.push(...savedRanges);
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
    expect(canvas!.shimmerPhases.length).toBe(frLocations.length);
    expect(canvas!.shimmerPhases[0]).toBeGreaterThanOrEqual(0);
    expect(canvas!.shimmerPhases[0]).toBeLessThan(Math.PI * 2);
  });

  it("draw() renders false-relation shimmer circles when frLocations are populated", async () => {
    expect(canvas).not.toBeNull();
    expect(frLocations.length).toBeGreaterThan(0);
    canvas!.draw();
  });

  it("seek() clamps to lower bound when seeking backward from bar 0", () => {
    expect(canvas).not.toBeNull();
    const pos = { choir: 0, part: "all" as const, bar: 0 };
    expect(canvas!.seek(pos, -1)).toBe(0);
  });

  it("seek() clamps to upper bound when seeking forward from last bar", () => {
    expect(canvas).not.toBeNull();
    const pos = { choir: 0, part: "all" as const, bar: barCount };
    expect(canvas!.seek(pos, +1)).toBe(barCount);
  });

  it("seek() finds next section change forward from bar 1", () => {
    expect(canvas).not.toBeNull();
    const pos = { choir: 0, part: "all" as const, bar: 1 };
    const result = canvas!.seek(pos, +1);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(barCount);
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
    Object.defineProperty(touchStart, "preventDefault", { value: vi.fn() });

    innerCanvas.dispatchEvent(touchStart);
    const event = await promise;
    const pos = event.detail.position;
    expect(pos.bar).toBeGreaterThanOrEqual(0);
    expect(pos.bar).toBeLessThan(140);
    expect(pos.choir).toBeGreaterThanOrEqual(0);
    expect(pos.choir).toBeLessThan(config.choirs[0].length);
  });

  it("setPlaying(false) cancels pending playback animation frame", () => {
    expect(canvas).not.toBeNull();

    const originalCancel = window.cancelAnimationFrame;
    const cancelledIds: number[] = [];
    window.cancelAnimationFrame = (id: number) => {
      cancelledIds.push(id);
    };

    // Start playback
    canvas!.setPlaying(true);

    // Stop playback
    canvas!.setPlaying(false);

    // Should have explicitly cancelled the animation frame
    expect(cancelledIds.length).toBeGreaterThan(0);

    window.cancelAnimationFrame = originalCancel;
  });
});
