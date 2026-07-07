import { test, expect } from "./helpers/page-errors";

test.describe("Bar navigation boundary wrapping", () => {
  test("ArrowRight from bar 139 wraps to bar 0", async ({ page }) => {
    await page.goto("/?bar=139");

    const controls = page.locator("music-controls");
    await expect(controls).toHaveAttribute("bar", "139");

    await page.keyboard.press("ArrowRight");

    await expect(controls).toHaveAttribute("bar", "0");
  });
});
