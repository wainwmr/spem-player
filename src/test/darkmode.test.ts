import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

describe("Dark/light mode toggle", () => {
  // Captured after the load event, before any beforeEach reset can touch the
  // body class — test 1 asserts this value, not the post-reset DOM (#542).
  let defaultHadLightTheme: boolean;

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
    // Flush one macrotask so a future tick-deferred theme application is
    // still captured rather than silently missed (Vera 542 pass 2).
    await new Promise((resolve) => setTimeout(resolve, 0));
    defaultHadLightTheme = document.body.classList.contains("light-theme");
  }, 30000);

  // Reset to dark-mode state so each test is order-independent (#542). The
  // icon values mirror updateDarkIcon()'s dark branch in index.ts; the raw
  // SVG ships the opposite, so both attributes must be set explicitly.
  // current.viewmode is deliberately not reset — toggleDark re-derives it
  // from the body class, and no test here reads it.
  beforeEach(() => {
    document.body.classList.remove("light-theme");
    const darkswitch = document.getElementById("darkswitch");
    const moonIcon = darkswitch?.querySelector<SVGPathElement>("#moon-icon");
    const sunIcon = darkswitch?.querySelector<SVGPathElement>("#sun-icon");
    if (!darkswitch || !moonIcon || !sunIcon) {
      throw new Error(
        "darkmode fixture drift: #darkswitch/#moon-icon/#sun-icon not found"
      );
    }
    moonIcon.setAttribute("display", "none");
    sunIcon.setAttribute("display", "inline");
  });

  afterAll(async () => {
    const controls = document.querySelector(
      "music-controls"
    ) as HTMLMediaElement;
    if (controls) controls.pause();
    await new Promise((resolve) => setTimeout(resolve, 100));
    vi.restoreAllMocks();
  });

  it("defaults to dark mode without requiring a theme class", () => {
    // Asserts the state captured at load time, not the post-reset DOM —
    // beforeEach forces dark, so the live class can never fail here (#542).
    expect(defaultHadLightTheme).toBe(false);
  });

  it("toggles to light mode when the darkswitch is clicked", async () => {
    const darkswitch = document.getElementById("darkswitch") as HTMLElement;
    darkswitch.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.body.classList.contains("light-theme")).toBe(true);
  });

  it("toggles back to dark mode when the darkswitch is clicked again", async () => {
    const darkswitch = document.getElementById("darkswitch") as HTMLElement;

    // Click to light mode
    darkswitch.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.classList.contains("light-theme")).toBe(true);

    // Click back to dark mode
    darkswitch.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.classList.contains("light-theme")).toBe(false);
  });

  it("updates the icon when toggling", async () => {
    const darkswitch = document.getElementById("darkswitch") as HTMLElement;
    const moonIcon = darkswitch.querySelector("#moon-icon") as SVGPathElement;
    const sunIcon = darkswitch.querySelector("#sun-icon") as SVGPathElement;

    // Start dark (default)
    expect(moonIcon.getAttribute("display")).toBe("none");
    expect(sunIcon.getAttribute("display")).toBe("inline");

    // Toggle to light
    darkswitch.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(moonIcon.getAttribute("display")).toBe("inline");
    expect(sunIcon.getAttribute("display")).toBe("none");

    // Toggle back to dark
    darkswitch.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(moonIcon.getAttribute("display")).toBe("none");
    expect(sunIcon.getAttribute("display")).toBe("inline");
  });
});
