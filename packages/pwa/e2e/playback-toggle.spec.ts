import { test, expect } from "./helpers/page-errors";

test.describe("Playback keyboard toggle", () => {
  test("Space toggles play and pause", async ({ page }) => {
    await page.goto("/");

    // Mock audio.play() so autoplay policy does not block the test
    await page.evaluate(() => {
      HTMLAudioElement.prototype.play = function () {
        (this as HTMLAudioElement).dispatchEvent(new Event("play"));
        return Promise.resolve();
      };
    });

    const controls = page.locator("music-controls");
    const pauseIcon = controls.locator("#playpausebutton svg").nth(1);

    // Initially paused: play icon visible, pause icon hidden
    await expect(pauseIcon).toBeHidden();

    await page.keyboard.press("Space");

    // Now playing: pause icon visible
    await expect(pauseIcon).toBeVisible();

    await page.keyboard.press("Space");

    // Paused again
    await expect(pauseIcon).toBeHidden();
  });

  test("Enter toggles play and pause", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      HTMLAudioElement.prototype.play = function () {
        (this as HTMLAudioElement).dispatchEvent(new Event("play"));
        return Promise.resolve();
      };
    });

    const controls = page.locator("music-controls");
    const pauseIcon = controls.locator("#playpausebutton svg").nth(1);

    await expect(pauseIcon).toBeHidden();

    await page.keyboard.press("Enter");
    await expect(pauseIcon).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(pauseIcon).toBeHidden();
  });

  test("focused play/pause button activates on Enter (#634)", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      HTMLAudioElement.prototype.play = function () {
        (this as HTMLAudioElement).dispatchEvent(new Event("play"));
        return Promise.resolve();
      };
    });

    const controls = page.locator("music-controls");
    const pauseIcon = controls.locator("#playpausebutton svg").nth(1);

    await page.locator("#playpausebutton").focus();
    await expect(pauseIcon).toBeHidden();

    await page.keyboard.press("Enter");
    await expect(pauseIcon).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(pauseIcon).toBeHidden();
  });

  test("focused play/pause button activates on Space without scrolling (#634)", async ({
    page,
  }) => {
    await page.goto("/");

    await page.evaluate(() => {
      HTMLAudioElement.prototype.play = function () {
        (this as HTMLAudioElement).dispatchEvent(new Event("play"));
        return Promise.resolve();
      };
      // Make the page tall enough that a stray Space-scroll would move it.
      document.body.style.minHeight = "3000px";
      window.scrollTo(0, 0);
    });

    const controls = page.locator("music-controls");
    const pauseIcon = controls.locator("#playpausebutton svg").nth(1);

    await page.locator("#playpausebutton").focus();
    await expect(pauseIcon).toBeHidden();

    await page.keyboard.press("Space");
    await expect(pauseIcon).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.keyboard.press("Space");
    await expect(pauseIcon).toBeHidden();
  });

  test("play/pause button stays circular when the recording changes (#398)", async ({
    page,
  }) => {
    await page.goto("/");

    const button = page.locator("#playpausebutton");
    await expect(button).toBeVisible();

    // The button is border-radius:50%, so it only reads as a circle while its
    // width equals its height. Changing the recording rebuilds the choir
    // dropdown to a different label width, reflowing the controls row; the
    // button must not be resized by that reflow.
    const isSquare = async () => {
      const box = await button.boundingBox();
      if (!box) throw new Error("button has no bounding box");
      expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
    };

    await isSquare();
    await page.locator("#recordingswitch").click();
    await isSquare();
  });
});
