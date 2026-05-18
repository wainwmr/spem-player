import { test, expect } from "@playwright/test";

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
});
