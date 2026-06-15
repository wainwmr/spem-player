import { test, expect, type Page } from "@playwright/test";

const selectors = [
  ["#test-help-link", "help link"],
  ['#feedback-submit[type="submit"]', "feedback submit button"],
  ['#feedback-cancel[type="button"]', "feedback cancel button"],
  ["label[for='star1']", "star rating label"],
] as const;

async function elementColours(page: Page) {
  return page.evaluate(
    (sel) =>
      sel.map((s) => {
        const el = document.querySelector(s);
        if (!el) throw new Error(`selector matched nothing: ${s}`);
        return window.getComputedStyle(el).color;
      }),
    selectors.map(([s]) => s)
  );
}

test.describe("Light mode contrast", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Inject a help link with no inline colour so the `#help a` SCSS rule is
    // tested, not the Buy Me a Coffee script's injected anchor (its inline
    // colours would override the stylesheet). Fail loudly if the fixtures the
    // suite depends on are missing, rather than silently testing nothing.
    await page.evaluate(() => {
      const help = document.getElementById("help");
      const modal = document.getElementById("feedback-modal");
      if (!help || !modal) {
        throw new Error(
          "lightmode-contrast fixture drift: #help/#feedback-modal not found"
        );
      }
      const link = document.createElement("a");
      link.id = "test-help-link";
      link.href = "https://example.com";
      link.textContent = "Test help link";
      help.appendChild(link);
      help.style.display = "block";
      modal.style.display = "block";
    });
  });

  test("help links and feedback controls are not white in light mode", async ({
    page,
  }) => {
    const body = page.locator("body");
    await page.locator("#darkswitch").click();
    await expect(body).toHaveClass(/light-theme/);

    for (const [selector, name] of selectors) {
      const locator = page.locator(selector).first();
      await expect(locator).toBeVisible();

      const colour = await locator.evaluate(
        (el) => window.getComputedStyle(el).color
      );
      expect(colour, `${name} colour in light mode`).not.toBe(
        "rgb(255, 255, 255)"
      );
    }
  });

  test("help links and feedback controls use the same colour in both modes", async ({
    page,
  }) => {
    const body = page.locator("body");
    const darkColours = await elementColours(page);

    await page.locator("#darkswitch").click();
    await expect(body).toHaveClass(/light-theme/);

    const lightColours = await elementColours(page);

    expect(lightColours).toEqual(darkColours);
  });
});
