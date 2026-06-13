import { describe, it, expect, beforeAll, vi } from "vitest";
import { MusicControls } from "../ts/MusicControls";
import { MusicScore } from "../ts/MusicScore";
import { MusicCanvas } from "../ts/MusicCanvas";

describe("setBar boundary wrapping", () => {
  beforeAll(async () => {
    vi.resetModules();

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
    if (!HTMLElement.prototype.scrollTo) {
      HTMLElement.prototype.scrollTo = () => {};
    }

    document.body.innerHTML = `
      <div class="viewportDiv">
        <div id="backdrop"></div>
        <header class="header">
          <span class="title">Spem Player</span>
          <span id="info" class="tooltip"><span id="help-icon"></span></span>
          <div class="header-spacer"></div>
          <span id="recordinglabel"></span>
          <span id="recordingswitch"></span>
          <span id="scoreswitch"></span>
          <span id="darkswitch"></span>
        </header>
        <div id="help"></div>
        <div class="split-container">
          <music-score></music-score>
          <div class="splitter"></div>
          <music-canvas></music-canvas>
        </div>
        <div class="footer">
          <music-controls></music-controls>
          <music-canvas-watcher class="hide"></music-canvas-watcher>
        </div>
      </div>
    `;

    await import("../ts/MusicCanvas");
    await import("../ts/MusicScore");
    await import("../ts/MusicControls");
    await import("../ts/MusicCanvasWatcher");

    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockReturnThis();

    await import("../../index.ts");
    window.dispatchEvent(new Event("load"));
  }, 30000);

  afterAll(async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    if (controls) controls.pause();
    await new Promise((resolve) => setTimeout(resolve, 100));
    vi.restoreAllMocks();
  });

  it("wraps bar 140 to 0 via music-controls-changed event", async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const score = document.querySelector("music-score") as MusicScore;
    const canvas = document.querySelector("music-canvas") as MusicCanvas;

    controls.dispatchEvent(
      new CustomEvent("music-controls-changed", {
        detail: { position: { choir: 0, part: "all", bar: 140 } },
        bubbles: true,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(controls.getAttribute("bar")).toBe("0");
    expect(score.getAttribute("bar")).toBe("0");
    expect(canvas.getAttribute("bar")).toBe("0");
  });

  it("wraps bar 141 to 0 via music-controls-changed event", async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const score = document.querySelector("music-score") as MusicScore;
    const canvas = document.querySelector("music-canvas") as MusicCanvas;

    controls.dispatchEvent(
      new CustomEvent("music-controls-changed", {
        detail: { position: { choir: 0, part: "all", bar: 141 } },
        bubbles: true,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(controls.getAttribute("bar")).toBe("0");
    expect(score.getAttribute("bar")).toBe("0");
    expect(canvas.getAttribute("bar")).toBe("0");
  });

  it("wraps negative bar to 139 via music-controls-changed event", async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const score = document.querySelector("music-score") as MusicScore;
    const canvas = document.querySelector("music-canvas") as MusicCanvas;

    controls.dispatchEvent(
      new CustomEvent("music-controls-changed", {
        detail: { position: { choir: 0, part: "all", bar: -1 } },
        bubbles: true,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(controls.getAttribute("bar")).toBe("139");
    expect(score.getAttribute("bar")).toBe("139");
    expect(canvas.getAttribute("bar")).toBe("139");
  });
});
