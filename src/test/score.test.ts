import { MusicScore } from "../ts/MusicScore";
import config from "../ts/config";
import {
  expectedBar,
  expectedChoir,
  expectedPart,
  waitForEvent,
} from "./helpers";
import { makeFixtureSvg } from "./fixtureScore";

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

  it("observes the recording attribute and updates the recording property (#237)", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    // Connect and load once so the element is live; recording defaults to 0.
    const waitingForLoaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem.setAttribute("choir", "0");
    await waitingForLoaded;
    expect(elem.recording).toBe(0);

    // Observing "recording" must both update the property and trigger a reload.
    // Awaiting the reload asserts the observed-attribute contract (the
    // attributeChangedCallback oldValue==newValue guard does not suppress a
    // genuine 0->1 change) and leaves no #loadScore() promise dangling past the
    // test boundary.
    const reloaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem.setAttribute("recording", "1");
    await reloaded;
    expect(elem.recording).toBe(1);
  });

  it("reloads the score with the new recording when recording changes (#237)", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    const recordings: number[] = [];
    const originalLoader = MusicScore.testSvgLoader;
    MusicScore.testSvgLoader = (scoreType, _choir, recording) => {
      recordings.push(recording);
      return makeFixtureSvg(scoreType);
    };

    // Initial choir load happens at recording 0.
    let loaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem.setAttribute("choir", "0");
    await loaded;
    const countAfterChoir = recordings.length;

    // Changing recording alone (no choir change) must trigger a fresh load
    // carrying the new recording value.
    loaded = waitForEvent(
      elem,
      "music-score-loaded",
      handleScoreLoaded,
      0,
      null,
      0
    );
    elem.setAttribute("recording", "1");
    await loaded;

    expect(recordings.length).toBeGreaterThan(countAfterChoir);
    expect(recordings[recordings.length - 1]).toBe(1);

    MusicScore.testSvgLoader = originalLoader;
  });

  it("resolves the CotE choir name with an ALC fallback (#237)", () => {
    // CotE (recording 1): the primary filename uses the CotE name, the
    // fallback is always the ALC name for the same choir, so the score can
    // fall back to the ALC SVG while CotE SVGs do not exist (until #573).
    expect(MusicScore.choirSvgNames(1, 0)).toEqual({
      primary: "1",
      fallback: "I A",
    });
    expect(MusicScore.choirSvgNames(1, 2)).toEqual({
      primary: "3",
      fallback: "II A",
    });
    // ALC (recording 0): primary and fallback are identical.
    expect(MusicScore.choirSvgNames(0, 0)).toEqual({
      primary: "I A",
      fallback: "I A",
    });
  });

  it("loadWithFallback returns the primary when it loads, without trying the fallback (#237)", async () => {
    const calls: string[] = [];
    const importer = async (stem: string) => {
      calls.push(stem);
      return `<svg data-stem="${stem}"/>`;
    };
    const svg = await MusicScore.loadWithFallback("1", "I A", importer);
    expect(svg).toBe('<svg data-stem="1"/>');
    expect(calls).toEqual(["1"]); // fallback never attempted
  });

  it("loadWithFallback falls back to the ALC name when the primary import fails (#237)", async () => {
    const calls: string[] = [];
    const importer = async (stem: string) => {
      calls.push(stem);
      if (stem === "1") throw new Error("missing CotE file");
      return `<svg data-stem="${stem}"/>`;
    };
    const svg = await MusicScore.loadWithFallback("1", "I A", importer);
    expect(svg).toBe('<svg data-stem="I A"/>');
    expect(calls).toEqual(["1", "I A"]); // primary then fallback
  });

  it("loadWithFallback returns null when both primary and fallback fail (#237)", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const importer = async () => {
      throw new Error("nope");
    };
    const svg = await MusicScore.loadWithFallback("1", "I A", importer);
    expect(svg).toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("loadWithFallback does not re-import when primary === fallback (ALC) (#237)", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const calls: string[] = [];
    const importer = async (stem: string) => {
      calls.push(stem);
      throw new Error("missing");
    };
    const svg = await MusicScore.loadWithFallback("I A", "I A", importer);
    expect(svg).toBeNull();
    expect(calls).toEqual(["I A"]); // single attempt, no redundant retry
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("aborts a stale choir load when a newer recording load resolves first (#237)", async () => {
    const elem = document.querySelector("music-score") as MusicScore;
    elem.scrollTo = vi.fn();

    let resolveChoir: (svg: string) => void = () => {};
    let resolveRecording: (svg: string) => void = () => {};

    const originalLoader = MusicScore.testSvgLoader;
    // The two interleaved loads are told apart by the recording argument:
    // setChoir(0) loads at recording 0, setRecording(1) loads at recording 1.
    // Both drive the shared #loadGeneration guard (#391), so a recording change
    // racing a choir change must resolve consistently.
    MusicScore.testSvgLoader = (scoreType, _choir, recording) => {
      if (recording === 0) {
        return new Promise((resolve) => {
          resolveChoir = resolve;
        }) as unknown as string;
      }
      if (recording === 1) {
        return new Promise((resolve) => {
          resolveRecording = resolve;
        }) as unknown as string;
      }
      return makeFixtureSvg(scoreType);
    };

    const pChoir = elem.setChoir(0); // generation 1, recording 0
    const pRecording = elem.setRecording(1); // generation 2 (newer), recording 1

    // The newer load (recording) resolves first and wins.
    resolveRecording(
      makeFixtureSvg("modern").replace("<svg ", '<svg data-rec="1" ')
    );
    await new Promise((r) => setTimeout(r, 10));

    // The stale choir load resolves last and must be discarded by the guard.
    resolveChoir(
      makeFixtureSvg("modern").replace("<svg ", '<svg data-rec="0" ')
    );

    await Promise.all([pChoir, pRecording]);

    expect(elem.recording).toBe(1);
    expect(elem.svg).not.toBeNull();
    expect(elem.svg!.getAttribute("data-rec")).toBe("1"); // newer load won

    MusicScore.testSvgLoader = originalLoader;
  });
});
