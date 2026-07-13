import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/page-errors";
import {
  getComputedStyleValue,
  expectComputedStyle,
  expectComputedStyleNot,
  expectElementFromPointStyle,
  assertReadableInMode,
} from "./helpers/computed-style";

// Exercises the reusable computed-style assertion helper (#714). The helper is
// the test-of-record pattern for the #1074 rule: when a fix turns on a computed
// CSS property or the cascade, the proof must be a real-browser read, because
// jsdom does not compute the cascade.

test.describe("computed-style e2e helper", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto("/");
  });

  test("getComputedStyleValue / expectComputedStyle resolve a computed property", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "cs-fixture";
      el.style.color = "rgb(1, 2, 3)";
      document.body.appendChild(el);
    });

    expect(await getComputedStyleValue(page, "#cs-fixture", "color")).toBe(
      "rgb(1, 2, 3)"
    );
    await expectComputedStyle(page, "#cs-fixture", "color", "rgb(1, 2, 3)");
    await expectComputedStyleNot(
      page,
      "#cs-fixture",
      "color",
      "rgb(255, 255, 255)"
    );
  });

  test("expectComputedStyle reads a kebab-case property", async ({ page }) => {
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "bg-fixture";
      el.style.backgroundColor = "rgb(4, 5, 6)";
      document.body.appendChild(el);
    });

    // The bracket-index form would return undefined here; getPropertyValue
    // takes the CSS (kebab-case) name and returns the resolved string.
    await expectComputedStyle(
      page,
      "#bg-fixture",
      "background-color",
      "rgb(4, 5, 6)"
    );
  });

  test("expectElementFromPointStyle resolves the element under a point", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "pt-fixture";
      el.style.cssText =
        "position:fixed;left:0;top:0;width:60px;height:60px;" +
        "background-color:rgb(7, 8, 9);z-index:99999";
      document.body.appendChild(el);
    });

    await expectElementFromPointStyle(
      page,
      10,
      10,
      "background-color",
      "rgb(7, 8, 9)"
    );
  });

  test("assertReadableInMode passes when foreground and background differ in both modes", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "rm-fixture";
      el.textContent = "readable";
      el.style.color = "rgb(0, 0, 0)";
      el.style.backgroundColor = "rgb(255, 255, 255)";
      document.body.appendChild(el);
    });

    await assertReadableInMode(page, "#rm-fixture", "light");
    await assertReadableInMode(page, "#rm-fixture", "dark");
  });

  // Negative cases — prove the assertions discriminate (a test-of-record helper
  // that can only pass is worthless). getPropertyValue returns "" for an
  // unknown/misspelled/wrong-case property, which must be rejected, not let an
  // assertion pass vacuously.

  test("getComputedStyleValue rejects a misspelled / empty-resolving property", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "typo-fixture";
      el.style.color = "rgb(1, 2, 3)";
      document.body.appendChild(el);
    });

    // "colr" is not a CSS property -> getPropertyValue returns "" -> guard rejects.
    // Match the guard's message so the test cannot pass on an unrelated throw.
    await expect(
      getComputedStyleValue(page, "#typo-fixture", "colr")
    ).rejects.toThrow(/resolved ""/);
    // ...unless the caller opts in to an empty result.
    expect(
      await getComputedStyleValue(page, "#typo-fixture", "colr", {
        allowEmpty: true,
      })
    ).toBe("");
  });

  test("assertReadableInMode rejects a transparent background", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "transparent-fixture";
      el.textContent = "transparent";
      el.style.color = "rgb(0, 0, 0)";
      el.style.backgroundColor = "rgba(0, 0, 0, 0)";
      document.body.appendChild(el);
    });

    // A transparent background trivially differs from any foreground, so the
    // bare fg != bg check would pass without proving readability.
    await expect(
      assertReadableInMode(page, "#transparent-fixture", "light")
    ).rejects.toThrow(/transparent/);
  });

  test("assertReadableInMode rejects when foreground equals background", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "samecolour-fixture";
      el.textContent = "invisible";
      el.style.color = "rgb(10, 20, 30)";
      el.style.backgroundColor = "rgb(10, 20, 30)";
      document.body.appendChild(el);
    });

    await expect(
      assertReadableInMode(page, "#samecolour-fixture", "light")
    ).rejects.toThrow(/must differ/);
  });

  test("expectElementFromPointStyle rejects an empty-resolving property", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.id = "pt-typo-fixture";
      el.style.cssText =
        "position:fixed;left:0;top:0;width:60px;height:60px;" +
        "background-color:rgb(7, 8, 9);z-index:99999";
      document.body.appendChild(el);
    });

    // The point-read has its own getComputedStyle path; it must reject an empty
    // resolution too, so a typo'd property paired with `expected: ""` cannot
    // pass vacuously.
    await expect(
      expectElementFromPointStyle(page, 10, 10, "bg-colr", "")
    ).rejects.toThrow(/resolved ""/);
  });
});
