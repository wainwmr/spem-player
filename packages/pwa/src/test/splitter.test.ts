import { describe, it, expect, beforeAll, vi } from "vitest";
import { MusicControls } from "../ts/MusicControls";

describe("splitter drag cursor", () => {
  beforeAll(async () => {
    vi.resetModules();

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

  it("toggles the resizing-split class on the body while dragging the splitter", () => {
    const splitter = document.querySelector(".splitter") as HTMLElement;

    splitter.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(document.body.classList.contains("resizing-split")).toBe(true);

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    expect(document.body.classList.contains("resizing-split")).toBe(false);
  });

  it("clears the drag when a move arrives with no button held (missed mouseup)", () => {
    const splitter = document.querySelector(".splitter") as HTMLElement;

    splitter.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, buttons: 1 })
    );
    expect(document.body.classList.contains("resizing-split")).toBe(true);

    // A release outside the document never reaches our mouseup listener; the
    // next in-window move arrives with buttons === 0 and must end the drag.
    document.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, buttons: 0 })
    );
    expect(document.body.classList.contains("resizing-split")).toBe(false);
  });
});
