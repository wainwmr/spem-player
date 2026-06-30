import { MusicScore } from "../ts/MusicScore";
import config from "../ts/config";
import {
  expectedBar,
  expectedChoir,
  expectedPart,
  waitForEvent,
} from "./helpers";
import { makeFixtureSvg } from "./fixtureScore";

// Capture ResizeObserver callbacks so tests can drive the resize path, and
// count disconnects so the teardown test can assert the observer is released.
const resizeObserverCallbacks = new WeakMap<Element, () => void>();
let resizeObserverDisconnects = 0;

vi.stubGlobal(
  "ResizeObserver",
  class {
    #callback: ResizeObserverCallback;
    #target: Element | null = null;

    constructor(callback: ResizeObserverCallback) {
      this.#callback = callback;
    }

    observe(target: Element) {
      this.#target = target;
      resizeObserverCallbacks.set(target, () =>
        // The entry shape is intentionally minimal: the production callback
        // ignores its arguments and re-reads offsetWidth / getBoundingClientRect,
        // so only `target` is real. Enrich this if the callback ever reads the
        // rect.
        this.#callback(
          [
            {
              target,
              contentRect: { width: 0, height: 0 } as DOMRectReadOnly,
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver
        )
      );
    }

    disconnect() {
      resizeObserverDisconnects++;
      if (this.#target) {
        resizeObserverCallbacks.delete(this.#target);
        this.#target = null;
      }
    }
  }
);

function triggerResize(target: Element) {
  const callback = resizeObserverCallbacks.get(target);
  if (callback) callback();
}

// Polyfill DOMPoint for jsdom
if (typeof DOMPoint === "undefined") {
  globalThis.DOMPoint = class DOMPoint {
    x: number;
    y: number;
    constructor(x: number = 0, y: number = 0) {
      this.x = x;
      this.y = y;
    }
    matrixTransform(_matrix: any) {
      return { x: this.x, y: this.y };
    }
  } as any;
}

describe("MusicScore custom element", () => {
  beforeAll(() => {
    MusicScore.define("music-score");

    // vi.spyOn(HTMLElement.prototype, "scrollTo").mockReturnValue();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    document.body.innerHTML = `<music-score></music-score>`;
  });

  const handleScoreLoaded = async (event: Event) => {
    // ... your logic ...
    return new Promise((resolve, reject) => {
      try {
        // Perform assertions
        const d = (event as CustomEvent).detail;
        expect(d).not.toBeNull();
        if (expectedChoir) expect(d.position.choir).toBe(expectedChoir);
        if (expectedPart) expect(d.position.part).toBe(expectedPart);
        if (expectedBar) expect(d.position.bar).toBe(expectedBar);

        resolve(true); // Resolve if assertions pass
      } catch (error) {
        reject(error); // Reject if an assertion fails
      }
    });
  };

  it("Check that we can load the score correctly", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    elem.scrollTo = vi.fn(); // jsdom doesn't seem to implement HTMLElement.scrollTo()

    // wait for score to be loaded
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    const loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();

    const hPos = document.querySelector(
      "svg rect[id='hPos']"
    ) as SVGRectElement;
    expect(hPos).not.toBeNull(); // highlight has been added
    expect(hPos?.style.fillOpacity).toBe("0"); // but currently invisible

    const hBar = document.querySelector(
      "svg rect[id='hBar']"
    ) as SVGRectElement;
    expect(hBar).not.toBeNull(); // highlight has been added
    expect(hBar?.getAttribute("width")).toBe("0"); // but currently invisible
  });

  it("highlightPosition width is proportional to svgWidth", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    const loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const width = elem.highlightPosition.getAttribute("width");
    expect(width).not.toBe("7");
    expect(width).not.toBe("0");
    expect(Number(width)).toBeCloseTo(elem.svgWidth / 600, 0);
  });

  it("mask rect width matches highlightPosition width", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const indicatorWidth = elem.highlightPosition.getAttribute("width");
    const maskWidth = elem.maskRect!.getAttribute("width");
    expect(maskWidth).toBe(indicatorWidth);
  });

  it("exposes typed maskRect and maskLine fields as children of highlightMask", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    expect(elem.maskRect).not.toBeNull();
    expect(elem.maskLine).not.toBeNull();
    expect(elem.maskRect!.tagName).toBe("rect");
    expect(elem.maskLine!.tagName).toBe("line");
    expect(elem.highlightMask.children).toContain(elem.maskRect);
    expect(elem.highlightMask.children).toContain(elem.maskLine);
  });

  it("highlightPosition width changes with score type", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    var waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    var loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const modernWidth = elem.highlightPosition.getAttribute("width");

    waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem.setAttribute("score-type", "early");
    loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const earlyWidth = elem.highlightPosition.getAttribute("width");
    expect(earlyWidth).not.toBe(modernWidth);
  }, 20000);

  it("Check all scores have the same number of bars", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    elem.scrollTo = vi.fn(); // jsdom doesn't seem to implement HTMLElement.scrollTo()

    for (var c = 0; c < config.choirs[0].length; c++) {
      // wait for score to be loaded
      const waitingForLoaded = waitForEvent(
        elem,
        "music-score-loaded",
        handleScoreLoaded,
        0,
        null,
        0
      );
      elem?.setAttribute("choir", String(c));
      const loadResult = await waitingForLoaded;
      expect(loadResult).toStrictEqual(true);

      const svg = document.querySelector("svg");
      expect(svg).not.toBeNull();

      expect(elem.bars.length).toBe(139);
      expect(elem.bars[0]).toBe(0);
      expect(elem.bars[138]).toBe(elem.svgWidth);
    }
  }, 20000);

  it("Changing bar sets the highlight correctly", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    elem.scrollTo = vi.fn(); // jsdom doesn't seem to implement HTMLElement.scrollTo()

    // wait for score to be loaded
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    const loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();

    elem.setAttribute("bar", "40");
    expect(elem.highlightBar.getAttribute("width")).not.toBe("0");
    expect(elem.highlightBar.style.fillOpacity).not.toBe("0");
    expect(elem.highlightBar.getAttribute("x")).toBe(String(elem.bars[39]));
  });

  it("Bar 138 highlight uses last bar width", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;
    elem.setAttribute("bar", "138");
    expect(elem.highlightBar.getAttribute("width")).not.toBe("0");
  });

  it("Changing score type works", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    elem.scrollTo = vi.fn(); // jsdom doesn't seem to implement HTMLElement.scrollTo()

    // wait for score to be loaded
    elem?.setAttribute("choir", "0");
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem.setAttribute("score-type", "early");
    const loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("Changing score type to a bad one works", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    elem.scrollTo = vi.fn(); // jsdom doesn't seem to implement HTMLElement.scrollTo()

    // wait for score to be loaded
    elem?.setAttribute("choir", "0");
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem.setAttribute("score-type", "frog");
    const loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("When playing, highlight bar disappears and position highligt shows", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    elem.scrollTo = vi.fn(); // jsdom doesn't seem to implement HTMLElement.scrollTo()

    // wait for score to be loaded
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    elem.setAttribute("bar", "77");
    const loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    expect(elem.highlightBar.style.fillOpacity).not.toBe("0");
    expect(elem.highlightPosition.style.fillOpacity).toBe("0");

    elem.setAttribute("playing", "true");

    expect(elem.highlightBar.style.fillOpacity).toBe("0");
    expect(elem.highlightPosition.style.fillOpacity).not.toBe("0");
  });

  it("Changing score type results in different highlited bar", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    elem.scrollTo = vi.fn(); // jsdom doesn't seem to implement HTMLElement.scrollTo()

    // wait for score to be loaded
    var waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "4");
    elem.setAttribute("bar", "40");
    var loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    // get the highlight bar start position
    const startpos = elem.highlightBar.getAttribute("x");
    const width = elem.highlightBar.getAttribute("width");

    // Wait for the score to be fully ready (scroll/highlight applied)
    // before asserting on post-scroll bar positions.
    const waitingForReady = waitForEvent(
      elem,
      "music-score-ready",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem.setAttribute("score-type", "early");
    loadResult = await waitingForReady;
    expect(loadResult).toStrictEqual(true);

    expect(elem.highlightBar.getAttribute("x")).not.toBe(startpos); // highlight bar x pos has changed
    expect(elem.highlightBar.getAttribute("width")).not.toBe(width); // highlight bar width has changed
  });

  it("scoreClicked sets bar and fires event", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const svg = elem.svg!;
    svg.getScreenCTM = vi.fn(
      () =>
        ({
          inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
        }) as any
    );

    elem.bars = [0, 100, 200, 300];

    const clickPromise = new Promise<void>((resolve) => {
      elem.addEventListener("music-score-click", () => resolve(), {
        once: true,
      });
    });

    const mockEvent = new MouseEvent("click", { clientX: 150, clientY: 50 });
    elem.scoreClicked(mockEvent);

    await clickPromise;
    expect(elem.bar).toBe(2);
  });

  it("scoreClicked routes intro region to bar 0 and pins boundary at bars[1] (#320)", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const svg = elem.svg!;
    svg.getScreenCTM = vi.fn(
      () =>
        ({
          inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
        }) as any
    );

    // Stub `bars` directly so the test exercises `scoreClicked`'s arithmetic
    // against a known-shape array, rather than the SVG-derived shape from
    // `getBars()` (which depends on rendered tspan layout). bars[1] = 100 is
    // the intro/bar-1 boundary; the strict-`<` semantic in MusicScore.ts must
    // hold.
    elem.bars = [0, 100, 200, 300];

    const clickAt = async (x: number): Promise<void> => {
      const fired = new Promise<void>((resolve) => {
        elem.addEventListener("music-score-click", () => resolve(), {
          once: true,
        });
      });
      elem.scoreClicked(new MouseEvent("click", { clientX: x, clientY: 50 }));
      await fired;
    };

    await clickAt(0);
    expect(elem.bar).toBe(0); // very left edge → intro

    await clickAt(50);
    expect(elem.bar).toBe(0); // well inside intro region

    await clickAt(99);
    expect(elem.bar).toBe(0); // just under bars[1] → still intro

    await clickAt(100);
    expect(elem.bar).toBe(2); // exactly bars[1]: strict-< excludes, find returns bars[2]
  });

  it("creates a clef overlay on load", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const overlay = elem.querySelector(".score-clef-overlay");
    expect(overlay).not.toBeNull();

    const overlaySvg = overlay!.querySelector("svg");
    expect(overlaySvg).not.toBeNull();
  });

  it("removes old clef overlay when loading a new score", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    var waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    expect(elem.querySelectorAll(".score-clef-overlay").length).toBe(1);

    waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "1");
    await waitingForLoaded;

    expect(elem.querySelectorAll(".score-clef-overlay").length).toBe(1);
  });

  it("clef overlay does not contain highlight elements", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const overlay = elem.querySelector(".score-clef-overlay");
    expect(overlay).not.toBeNull();
    expect(overlay!.querySelector("#hPos")).toBeNull();
    expect(overlay!.querySelector("#hBar")).toBeNull();
    expect(overlay!.querySelector("[id='hPosMask']")).toBeNull();
  });

  it("part highlight element exists after load", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const hPart = document.querySelector(
      "svg rect[id='hPart']"
    ) as SVGRectElement;
    expect(hPart).not.toBeNull();
  });

  it("setting part makes highlight visible", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    elem.setAttribute("part", "0");
    expect(elem.highlightPart.style.fillOpacity).not.toBe("0");
    expect(elem.highlightPart.getAttribute("width")).toBe(
      String(elem.svgWidth)
    );
  });

  it("setting part to 'all' hides highlight", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    elem.setAttribute("part", "0");
    expect(elem.highlightPart.style.fillOpacity).not.toBe("0");

    elem.setAttribute("part", "all");
    expect(elem.highlightPart.style.fillOpacity).toBe("0");
  });

  it("clef overlay does not contain part highlight", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const overlay = elem.querySelector(".score-clef-overlay");
    expect(overlay).not.toBeNull();
    expect(overlay!.querySelector("#hPart")).toBeNull();
  });

  it("injects dimming style when a part is selected", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    elem.setAttribute("part", "2");
    const dimStyle = document.querySelector("svg style#part-dim-style");
    expect(dimStyle).not.toBeNull();
    expect(dimStyle!.textContent).toContain(
      'g[data-part]:not([data-part="2"])'
    );
    expect(dimStyle!.textContent).toContain("opacity: 0.3");
  });

  it("clears dimming style when part is set to all", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    elem.setAttribute("part", "1");
    const dimStyle = document.querySelector(
      "svg style#part-dim-style"
    ) as SVGStyleElement;
    expect(dimStyle).not.toBeNull();
    expect(dimStyle.textContent).not.toBe("");

    elem.setAttribute("part", "all");
    expect(dimStyle.textContent).toBe("");
  });

  it("clef overlay does not contain dimming style", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const overlay = elem.querySelector(".score-clef-overlay");
    expect(overlay).not.toBeNull();
    expect(overlay!.querySelector("#part-dim-style")).toBeNull();
  });

  it("caches scoreWidth so scrollSmooth does not re-read getBoundingClientRect after load", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    // Stub layout dimensions before the post-load requestAnimationFrame populates
    // the cache. With these values, the scroll math for bar 40 is deterministic.
    vi.spyOn(elem, "offsetWidth", "get").mockReturnValue(800);
    const rectSpy = vi
      .spyOn(window.SVGElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ width: 2000 } as DOMRect);

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const waitingForReady = waitForEvent(
      elem,
      "music-score-ready",
      handleScoreLoaded,
      0,
      null,
      0
    );
    await waitingForReady;

    const scrollArea = elem.querySelector(
      ".score-scroll-area"
    ) as HTMLDivElement;

    // After the cache is populated, sabotage getBoundingClientRect. A
    // non-cached scrollSmooth would read 0 and produce a wrong scroll position.
    rectSpy.mockReturnValue({ width: 0 } as DOMRect);

    elem.setAttribute("bar", "40");
    expect(scrollArea.scrollLeft).toBeGreaterThan(0);
  });

  it("caches frameWidth and only refreshes it via ResizeObserver", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    vi.spyOn(elem, "offsetWidth", "get").mockReturnValue(800);
    vi.spyOn(
      window.SVGElement.prototype,
      "getBoundingClientRect"
    ).mockReturnValue({ width: 2000 } as DOMRect);
    // The ResizeObserver was wired in connectedCallback, before the offsetWidth
    // spy was installed, so its first measure read jsdom's 0; drive it once now
    // to populate the frameWidth cache.
    triggerResize(elem);

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const waitingForReady = waitForEvent(
      elem,
      "music-score-ready",
      handleScoreLoaded,
      0,
      null,
      0
    );
    await waitingForReady;

    const scrollArea = elem.querySelector(
      ".score-scroll-area"
    ) as HTMLDivElement;

    // Change offsetWidth without invoking the ResizeObserver callback. A cached
    // frameWidth stays at 800; a non-cached scrollSmooth reads 400 and scrolls
    // further (bar 40 with fixture width 1000: ~565 - 100 = 465).
    vi.spyOn(elem, "offsetWidth", "get").mockReturnValue(400);
    elem.setAttribute("bar", "40");
    expect(scrollArea.scrollLeft).toBeCloseTo(365, 0);

    // Now drive the resize path: the callback refreshes the cache to 400.
    triggerResize(elem);
    elem.setAttribute("bar", "41");
    elem.setAttribute("bar", "40");
    expect(scrollArea.scrollLeft).toBeCloseTo(465, 0);
  });

  it("refreshes scoreWidth on score load", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    vi.spyOn(elem, "offsetWidth", "get").mockReturnValue(800);
    let scoreWidth = 2000;
    const rectSpy = vi
      .spyOn(window.SVGElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ width: scoreWidth } as DOMRect);
    // Populate the frameWidth cache now that offsetWidth is stubbed.
    triggerResize(elem);

    const waitingForLoaded1 = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded1;

    const waitingForReady1 = waitForEvent(
      elem,
      "music-score-ready",
      handleScoreLoaded,
      0,
      null,
      0
    );
    await waitingForReady1;

    // Load a different score type with a narrower rendered width.
    scoreWidth = 1200;
    rectSpy.mockReturnValue({ width: scoreWidth } as DOMRect);

    const waitingForReady2 = waitForEvent(
      elem,
      "music-score-ready",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem.setAttribute("score-type", "early");
    await waitingForReady2;

    const scrollArea = elem.querySelector(
      ".score-scroll-area"
    ) as HTMLDivElement;

    // After the second load the cache holds scoreWidth 1200. Sabotage the
    // getter to prove the cached value is used, not a fresh read.
    rectSpy.mockReturnValue({ width: 0 } as DOMRect);
    elem.setAttribute("bar", "40");
    // With the refreshed cache, scrollLeft is based on 1200; with a stale 2000
    // cache it would be much larger, and with no cache it would be negative.
    expect(scrollArea.scrollLeft).toBeGreaterThan(0);
    expect(scrollArea.scrollLeft).toBeLessThan(300);
  });

  it("refreshes scoreWidth on resize, not only on load (#692 splitter drag)", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    vi.spyOn(elem, "offsetWidth", "get").mockReturnValue(800);
    const rectSpy = vi
      .spyOn(window.SVGElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ width: 2000 } as DOMRect);
    // Populate the frameWidth cache now that offsetWidth is stubbed.
    triggerResize(elem);

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const waitingForReady = waitForEvent(
      elem,
      "music-score-ready",
      handleScoreLoaded,
      0,
      null,
      0
    );
    await waitingForReady;

    const scrollArea = elem.querySelector(
      ".score-scroll-area"
    ) as HTMLDivElement;

    // A splitter drag changes the panel height, so the height:100% SVG renders
    // narrower. The element resizes, so the ResizeObserver fires — and must
    // refresh the cached scoreWidth, not only frameWidth (#692). Drive the
    // resize with the new, narrower width, then sabotage the getter to 0 to
    // prove the refreshed *cache* (1000) is read, not a fresh re-measure.
    rectSpy.mockReturnValue({ width: 1000 } as DOMRect);
    triggerResize(elem);
    rectSpy.mockReturnValue({ width: 0 } as DOMRect);

    elem.setAttribute("bar", "40");
    // scoreWidth 1000, frameWidth 800: 0.2826*1000 - 0.25*800 ≈ 83. A stale 2000
    // cache (resize not refreshing scoreWidth) would give ≈365.
    expect(scrollArea.scrollLeft).toBeCloseTo(83, 0);
  });

  it("falls back to a live offsetWidth read when frameWidth was never validly cached (#692)", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    // connectedCallback already ran in beforeEach with jsdom's offsetWidth of 0.
    // That 0 must NOT be cached, or it would suppress the live-read fallback.
    // Deliberately do NOT triggerResize, so frameWidth stays uncached and
    // scrollSmooth must read offsetWidth live.
    vi.spyOn(elem, "offsetWidth", "get").mockReturnValue(800);
    vi.spyOn(
      window.SVGElement.prototype,
      "getBoundingClientRect"
    ).mockReturnValue({ width: 2000 } as DOMRect);

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const waitingForReady = waitForEvent(
      elem,
      "music-score-ready",
      handleScoreLoaded,
      0,
      null,
      0
    );
    await waitingForReady;

    const scrollArea = elem.querySelector(
      ".score-scroll-area"
    ) as HTMLDivElement;

    elem.setAttribute("bar", "40");
    // frameWidth falls back to the live offsetWidth 800 (not a cached 0):
    // 0.2826*2000 - 0.25*800 ≈ 365. A cached 0 frameWidth would give ≈565.
    expect(scrollArea.scrollLeft).toBeCloseTo(365, 0);
  });

  it("disconnects the ResizeObserver when removed from the DOM (#692)", () => {
    const elem = document.querySelector("music-score") as MusicScore;
    const before = resizeObserverDisconnects;

    elem.remove();

    expect(resizeObserverDisconnects).toBe(before + 1);
    // After disconnect the callback is released, so a later resize is a no-op
    // (no throw, nothing to refresh).
    expect(() => triggerResize(elem)).not.toThrow();
  });

  it("invalidates the cached scoreWidth on score change, falling back to a live read when the new measure is unavailable (#692)", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    vi.spyOn(elem, "offsetWidth", "get").mockReturnValue(800);
    const rectSpy = vi
      .spyOn(window.SVGElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ width: 2000 } as DOMRect);
    triggerResize(elem); // cache frameWidth 800

    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem?.setAttribute("choir", "0");
    await waitingForLoaded;

    const waitingForReady = waitForEvent(
      elem,
      "music-score-ready",
      handleScoreLoaded,
      0,
      null,
      0
    );
    await waitingForReady;
    // The cache now holds the first score's width (2000).

    // Switch to a different score whose post-load measure transiently reads 0
    // (layout not yet settled), so the > 0 guard skips the cache update. The
    // previous 2000 must NOT survive: a score change invalidates the cache, so
    // scrollSmooth falls back to a live read of the new score (#692).
    rectSpy.mockReturnValue({ width: 0 } as DOMRect);
    const waitingForReady2 = waitForEvent(
      elem,
      "music-score-ready",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem.setAttribute("score-type", "early");
    await waitingForReady2;

    const scrollArea = elem.querySelector(
      ".score-scroll-area"
    ) as HTMLDivElement;

    // A live read now returns the new score's width (1500); the stale 2000 is
    // gone.
    rectSpy.mockReturnValue({ width: 1500 } as DOMRect);
    elem.setAttribute("bar", "40");
    // Live scoreWidth 1500, frameWidth 800: 0.2826*1500 - 0.25*800 ≈ 224. A
    // stale cached 2000 (no invalidation on score change) would give ≈365.
    expect(scrollArea.scrollLeft).toBeCloseTo(224, 0);
  });

  // Keep this test LAST among ResizeObserver-dependent tests: it stubs
  // ResizeObserver to undefined and restores it in `finally`, so any later
  // RO-dependent test would rely on that restore having run (#692).
  it("connects without throwing when ResizeObserver is unavailable (#692)", async () => {
    // Simulate an environment without ResizeObserver: the element must still
    // connect, load, and scroll (frameWidth simply won't refresh on resize).
    const original = globalThis.ResizeObserver;
    vi.stubGlobal("ResizeObserver", undefined);
    try {
      document.body.innerHTML = `<music-score></music-score>`;
      const elem = document.querySelector("music-score") as MusicScore;
      elem.scrollTo = vi.fn();
      vi.spyOn(elem, "offsetWidth", "get").mockReturnValue(800);
      vi.spyOn(
        window.SVGElement.prototype,
        "getBoundingClientRect"
      ).mockReturnValue({ width: 2000 } as DOMRect);

      const waitingForLoaded = waitForEvent(
        elem,
        "music-score-loaded",
        handleScoreLoaded,
        0,
        null,
        0
      );
      elem?.setAttribute("choir", "0");
      await waitingForLoaded;

      const waitingForReady = waitForEvent(
        elem,
        "music-score-ready",
        handleScoreLoaded,
        0,
        null,
        0
      );
      await waitingForReady;

      const scrollArea = elem.querySelector(
        ".score-scroll-area"
      ) as HTMLDivElement;
      elem.setAttribute("bar", "40");
      // scoreWidth cached on load (2000), frameWidth falls back to live 800: ≈365.
      expect(scrollArea.scrollLeft).toBeCloseTo(365, 0);
    } finally {
      vi.stubGlobal("ResizeObserver", original);
    }
  });

  it("aborts stale #loadScore when a newer choir request resolves first (#391)", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    let resolveChoir0: (svg: string) => void = () => {};
    let resolveChoir1: (svg: string) => void = () => {};

    const originalLoader = MusicScore.testSvgLoader;
    MusicScore.testSvgLoader = (scoreType, choir) => {
      if (choir === 0) {
        return new Promise((resolve) => {
          resolveChoir0 = resolve;
        }) as unknown as string;
      }
      if (choir === 1) {
        return new Promise((resolve) => {
          resolveChoir1 = resolve;
        }) as unknown as string;
      }
      return makeFixtureSvg(scoreType);
    };

    // Start two choir changes without awaiting between them
    const p0 = elem.setChoir(0);
    const p1 = elem.setChoir(1);

    // Resolve choir 1 first (the newer request wins the race)
    resolveChoir1(
      makeFixtureSvg("modern").replace("<svg ", '<svg data-choir="1" ')
    );
    await new Promise((r) => setTimeout(r, 10));

    // Then resolve choir 0 (stale)
    resolveChoir0(
      makeFixtureSvg("modern").replace("<svg ", '<svg data-choir="0" ')
    );

    await Promise.all([p0, p1]);

    // Final state must be consistent: svg, bars, and choir all agree
    expect(elem.choir).toBe(1);
    expect(elem.svg).not.toBeNull();
    expect(elem.svg!.isConnected).toBe(true);
    expect(elem.svg!.getAttribute("data-choir")).toBe("1");

    MusicScore.testSvgLoader = originalLoader;
  });
});
