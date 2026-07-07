import { test, expect } from "./helpers/page-errors";

test.describe("Header tooltip positioning", () => {
  test("tooltip is horizontally centred under its icon", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");
    await expect(header).toBeVisible();

    const tooltips = header.locator(".tooltip");
    const count = await tooltips.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const tooltip = tooltips.nth(i);
      await tooltip.hover();
      await page.waitForTimeout(300);

      const tooltiptext = tooltip.locator(".tooltiptext").first();
      await expect(tooltiptext).toBeVisible();

      const tooltipBox = await tooltip.boundingBox();
      const textBox = await tooltiptext.boundingBox();

      expect(tooltipBox).not.toBeNull();
      expect(textBox).not.toBeNull();

      const tooltipCenter = tooltipBox!.x + tooltipBox!.width / 2;
      const textCenter = textBox!.x + textBox!.width / 2;
      const offset = Math.abs(tooltipCenter - textCenter);

      expect(offset).toBeLessThanOrEqual(2);
    }
  });
});
