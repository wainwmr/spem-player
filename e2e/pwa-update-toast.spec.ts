import { test, expect } from "@playwright/test";

test.describe("PWA update toast accessibility", () => {
  test("focus moves to the refresh button when the toast appears", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      (window as typeof window & { __pwaShowUpdateToast?: () => void }).__pwaShowUpdateToast?.();
    });

    const refreshBtn = page.locator(".pwa-update-toast-refresh");
    await expect(refreshBtn).toBeFocused();
  });

  test("Escape key dismisses the toast", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      (window as typeof window & { __pwaShowUpdateToast?: () => void }).__pwaShowUpdateToast?.();
    });

    const toast = page.locator(".pwa-update-toast");
    await expect(toast).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(toast).toBeHidden();
  });
});
