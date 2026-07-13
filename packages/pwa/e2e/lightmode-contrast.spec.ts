import { test, expect } from "./helpers/page-errors";
import {
  getComputedStyleValue,
  expectComputedStyleNot,
} from "./helpers/computed-style";

const selectors = [
  ["#test-help-link", "help link"],
  ['#feedback-submit[type="submit"]', "feedback submit button"],
  ['#feedback-cancel[type="button"]', "feedback cancel button"],
  ["label[for='star1']", "star rating label"],
] as const;

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
      await expect(page.locator(selector).first()).toBeVisible();
      // Real-browser computed read (#714 helper): jsdom would not resolve the
      // `#help a` cascade. `name` scopes the failure in the trace.
      await test.step(`${name} colour in light mode`, () =>
        expectComputedStyleNot(page, selector, "color", "rgb(255, 255, 255)"));
    }
  });

  test("help links and feedback controls use the same colour in both modes", async ({
    page,
  }) => {
    const body = page.locator("body");
    const readColours = () =>
      Promise.all(
        selectors.map(([s]) => getComputedStyleValue(page, s, "color"))
      );

    // Guard before the bulk read so a dropped fixture fails fast and names the
    // selector, rather than waiting out a generic locator timeout.
    for (const [selector, name] of selectors) {
      await expect(page.locator(selector).first(), name).toBeVisible();
    }

    const darkColours = await readColours();

    await page.locator("#darkswitch").click();
    await expect(body).toHaveClass(/light-theme/);

    const lightColours = await readColours();

    expect(lightColours).toEqual(darkColours);
  });
});
