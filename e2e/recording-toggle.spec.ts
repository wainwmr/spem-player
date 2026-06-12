import { test, expect } from "@playwright/test";

// #237: the recording switch must propagate to the score, and the score must
// keep rendering when the (currently non-existent, #573) CotE SVG falls back to
// the ALC file. This exercises the two paths jsdom cannot: the index.ts wiring
// (setRecording -> score attribute) and the real Vite dynamic-import fallback.
test.describe("Recording switch propagates to the score (#237)", () => {
  test("toggling to CotE updates the score's recording and keeps it rendered", async ({
    page,
  }) => {
    await page.goto("/");

    const score = page.locator("music-score");

    // The score renders at the default (ALC) recording.
    await expect(score.locator("svg").first()).toBeVisible();
    await expect(score).toHaveAttribute("recording", "0");

    // Toggle the recording switch: ALC -> CotE.
    await page.locator("#recordingswitch").click();

    // The recording reaches the score (the wiring #237 adds), and the score is
    // still rendered: CotE-named SVGs do not exist (#573), so #loadSvg falls
    // back to the ALC file rather than leaving a blank panel.
    await expect(score).toHaveAttribute("recording", "1");
    await expect(score.locator("svg").first()).toBeVisible();

    // #237 removed the recording propagation from setChoir, so a choir change
    // must now leave the score's recording untouched (the score observes
    // recording independently). Change choir via the keyboard (digit n -> choir
    // n-1) and confirm CotE (recording 1) is retained.
    await page.keyboard.press("3");
    await expect(score).toHaveAttribute("choir", "2");
    await expect(score).toHaveAttribute("recording", "1");
    await expect(score.locator("svg").first()).toBeVisible();
  });
});
