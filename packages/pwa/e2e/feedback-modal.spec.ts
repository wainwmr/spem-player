import { test, expect } from "./helpers/page-errors";

test.describe("Feedback modal mobile viewport", () => {
  test("does not overflow horizontally on iPhone SE viewport (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await page.locator("#feedback-trigger").click();

    const modal = page.locator("#feedback-modal");
    await expect(modal).toBeVisible();

    const overflow = await modal.evaluate(
      (el) => (el as HTMLElement).scrollWidth <= (el as HTMLElement).clientWidth
    );
    expect(overflow).toBe(true);
  });

  test("does not overflow horizontally on Pixel 7 viewport (412px)", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto("/");

    await page.locator("#feedback-trigger").click();

    const modal = page.locator("#feedback-modal");
    await expect(modal).toBeVisible();

    const overflow = await modal.evaluate(
      (el) => (el as HTMLElement).scrollWidth <= (el as HTMLElement).clientWidth
    );
    expect(overflow).toBe(true);
  });

  test("Cancel button is visible and tappable on narrow viewports", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await page.locator("#feedback-trigger").click();

    const cancelButton = page.locator("#feedback-cancel");
    await expect(cancelButton).toBeVisible();

    const box = await cancelButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});
