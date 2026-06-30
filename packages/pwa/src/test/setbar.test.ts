import { describe, it, expect, beforeAll, vi } from "vitest";
import { MusicControls } from "../ts/MusicControls";
import { MusicScore } from "../ts/MusicScore";
import { MusicCanvas } from "../ts/MusicCanvas";
import { setupIntegrationFixture } from "./helpers";

describe("setBar boundary wrapping", () => {
  beforeAll(async () => {
    await setupIntegrationFixture();
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
