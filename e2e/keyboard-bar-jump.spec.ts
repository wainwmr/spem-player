import { test, expect } from "@playwright/test";

test.describe("Alt+B bar jump keyboard shortcut", () => {
  test("Alt+B focuses the bar input from document body", async ({ page }) => {
    await page.goto("/");

    const barInput = page.locator("#bar-field");

    await page.keyboard.press("Alt+b");

    await expect(barInput).toBeFocused();
  });

  test("typing bar number and Enter changes bar and returns focus to body", async ({
    page,
  }) => {
    await page.goto("/");

    const controls = page.locator("music-controls");
    const barInput = page.locator("#bar-field");

    await page.keyboard.press("Alt+b");
    await expect(barInput).toBeFocused();

    await barInput.fill("50");
    await barInput.press("Enter");

    await expect(controls).toHaveAttribute("bar", "50");
    await expect(barInput).not.toBeFocused();
  });

  test("focus returns to the play button after Enter", async ({ page }) => {
    await page.goto("/");

    const playButton = page.locator("#playpausebutton");
    const barInput = page.locator("#bar-field");

    await playButton.focus();
    await expect(playButton).toBeFocused();

    await page.keyboard.press("Alt+b");
    await expect(barInput).toBeFocused();

    await barInput.fill("25");
    await barInput.press("Enter");

    await expect(playButton).toBeFocused();
    await expect(barInput).not.toBeFocused();
  });

  test("focus returns to the canvas after Enter", async ({ page }) => {
    await page.goto("/");

    const canvas = page.locator("music-canvas");
    const barInput = page.locator("#bar-field");

    await canvas.click();
    await expect(canvas).toBeFocused();

    await page.keyboard.press("Alt+b");
    await expect(barInput).toBeFocused();

    await barInput.fill("10");
    await barInput.press("Enter");

    await expect(canvas).toBeFocused();
    await expect(barInput).not.toBeFocused();
  });

  test("focus returns to the score after Enter", async ({ page }) => {
    await page.goto("/");

    const score = page.locator("music-score");
    const barInput = page.locator("#bar-field");

    await score.click();
    await expect(score).toBeFocused();

    await page.keyboard.press("Alt+b");
    await expect(barInput).toBeFocused();

    await barInput.fill("15");
    await barInput.press("Enter");

    await expect(score).toBeFocused();
    await expect(barInput).not.toBeFocused();
  });

  test("focus returns to the choir select after Enter", async ({ page }) => {
    await page.goto("/");

    const choirSelect = page.locator("#choir-select");
    const barInput = page.locator("#bar-field");

    await choirSelect.focus();
    await expect(choirSelect).toBeFocused();

    await page.keyboard.press("Alt+b");
    await expect(barInput).toBeFocused();

    await barInput.fill("20");
    await barInput.press("Enter");

    await expect(choirSelect).toBeFocused();
    await expect(barInput).not.toBeFocused();
  });

  test("focus returns to the part select after Enter", async ({ page }) => {
    await page.goto("/");

    const partSelect = page.locator("#part-select");
    const barInput = page.locator("#bar-field");

    await partSelect.focus();
    await expect(partSelect).toBeFocused();

    await page.keyboard.press("Alt+b");
    await expect(barInput).toBeFocused();

    await barInput.fill("30");
    await barInput.press("Enter");

    await expect(partSelect).toBeFocused();
    await expect(barInput).not.toBeFocused();
  });

  test("Alt+B re-focuses bar input and selects text when already focused", async ({
    page,
  }) => {
    await page.goto("/");

    const barInput = page.locator("#bar-field");

    await barInput.focus();
    await barInput.fill("5");
    await expect(barInput).toBeFocused();

    await page.keyboard.press("Alt+b");
    await expect(barInput).toBeFocused();

    // After Alt+B, the text should be selected. Typing a new value should replace it.
    await barInput.fill("35");
    await barInput.press("Enter");

    const controls = page.locator("music-controls");
    await expect(controls).toHaveAttribute("bar", "35");
  });

  test("focus returns to the dark switch after Enter", async ({ page }) => {
    await page.goto("/");

    const darkSwitch = page.locator("#darkswitch");
    const barInput = page.locator("#bar-field");

    await darkSwitch.click();
    await expect(darkSwitch).toBeFocused();

    await page.keyboard.press("Alt+b");
    await expect(barInput).toBeFocused();

    await barInput.fill("40");
    await barInput.press("Enter");

    await expect(darkSwitch).toBeFocused();
    await expect(barInput).not.toBeFocused();
  });

  test("focus returns to the score switch after Enter", async ({ page }) => {
    await page.goto("/");

    const scoreSwitch = page.locator("#scoreswitch");
    const barInput = page.locator("#bar-field");

    await scoreSwitch.click();
    await expect(scoreSwitch).toBeFocused();

    await page.keyboard.press("Alt+b");
    await expect(barInput).toBeFocused();

    await barInput.fill("45");
    await barInput.press("Enter");

    await expect(scoreSwitch).toBeFocused();
    await expect(barInput).not.toBeFocused();
  });

  test("focus returns to the recording switch after Enter", async ({
    page,
  }) => {
    await page.goto("/");

    const recordingSwitch = page.locator("#recordingswitch");
    const barInput = page.locator("#bar-field");

    await recordingSwitch.click();
    await expect(recordingSwitch).toBeFocused();

    await page.keyboard.press("Alt+b");
    await expect(barInput).toBeFocused();

    await barInput.fill("55");
    await barInput.press("Enter");

    await expect(recordingSwitch).toBeFocused();
    await expect(barInput).not.toBeFocused();
  });
});
