import { describe, it, expect, beforeAll, vi } from "vitest";
import { MusicControls } from "../ts/MusicControls";

describe("Space bar play/pause", () => {
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
          <span id="info" class="tooltip"></span>
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
    vi.restoreAllMocks();
  });

  it("Space toggles play/pause when focus is on the document body", async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    controls.playing = false;

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(controls.isPlaying()).toBe(true);

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(controls.isPlaying()).toBe(false);
  });

  it("Space does not toggle play/pause when an input element is focused", () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const input = document.createElement("input");
    document.body.appendChild(input);

    controls.playing = false;
    input.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    expect(controls.isPlaying()).toBe(false);

    document.body.removeChild(input);
  });

  it("Space does not toggle play/pause when a select element is focused", () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const select = document.createElement("select");
    document.body.appendChild(select);

    controls.playing = false;
    select.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    expect(controls.isPlaying()).toBe(false);

    document.body.removeChild(select);
  });

  it("Space does not toggle play/pause when a textarea is focused", () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    controls.playing = false;
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    expect(controls.isPlaying()).toBe(false);

    document.body.removeChild(textarea);
  });

  it("Digit2 in bar input does not change choir (#182)", async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    bar.focus();
    bar.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Digit2", key: "2", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(controls.getAttribute("choir")).toBe("0");
  });

  it("KeyD in choir select does not toggle dark mode (#182)", async () => {
    const select = document.getElementById("choir-select") as HTMLSelectElement;
    select.focus();
    const wasLight = document.body.classList.contains("light-theme");
    select.dispatchEvent(
      new KeyboardEvent("keydown", { code: "KeyD", key: "d", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.classList.contains("light-theme")).toBe(wasLight);
  });

  it("Alt+B prevents default to avoid macOS special-character insertion", async () => {
    const event = new KeyboardEvent("keydown", {
      code: "KeyB",
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    document.body.dispatchEvent(event);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(preventDefaultSpy).toHaveBeenCalled();
    preventDefaultSpy.mockRestore();
  });

  it("Alt+B focuses the bar input and selects its value", async () => {
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    const selectSpy = vi.spyOn(bar, "select");

    document.body.focus();
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "KeyB",
        altKey: true,
        bubbles: true,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.activeElement).toBe(bar);
    expect(selectSpy).toHaveBeenCalled();
    selectSpy.mockRestore();
  });

  it("Alt+B focuses bar input even when a control input is focused", async () => {
    const input = document.createElement("input");
    input.classList.add("control");
    document.body.appendChild(input);
    input.focus();

    const bar = document.getElementById("bar-field") as HTMLInputElement;

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "KeyB",
        altKey: true,
        bubbles: true,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.activeElement).toBe(bar);
    document.body.removeChild(input);
  });

  it("Enter in bar input returns focus to the previous element", async () => {
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    const previous = document.createElement("button");
    document.body.appendChild(previous);
    previous.focus();

    // Alt+B to focus bar
    previous.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "KeyB",
        altKey: true,
        bubbles: true,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement).toBe(bar);

    // Type and press Enter
    bar.value = "50";
    bar.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "Enter",
        key: "Enter",
        bubbles: true,
      })
    );
    bar.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(document.activeElement).toBe(previous);
    document.body.removeChild(previous);
  });

  it("Alt+B pauses playback before focusing bar input", async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    controls.play();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(controls.isPlaying()).toBe(true);

    document.body.focus();
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "KeyB",
        altKey: true,
        bubbles: true,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(controls.isPlaying()).toBe(false);
  });
});
