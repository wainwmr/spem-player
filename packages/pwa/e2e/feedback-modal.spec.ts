import { test, expect } from "./helpers/page-errors";
import {
  getComputedStyleValue,
  expectComputedStyle,
} from "./helpers/computed-style";

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

/**
 * A failed send must not destroy what the user typed (#798).
 *
 * These are e2e rather than jsdom because the fix turns on the cascade: the
 * failure message is the same #feedback-result element as the confirmation,
 * distinguished only by a class that changes its computed height and colour.
 * jsdom reads the inline write, not the rendered result, so it cannot tell a
 * legible error from an invisible one (the #1074 rule; see helpers/computed-style).
 */
test.describe("Feedback send failure (#798)", () => {
  const MESSAGE = "Bar 42 will not scroll on the early score";

  /**
   * Fail the send the way an offline browser does: a rejected fetch.
   *
   * Deliberately a fetch stub rather than `route.abort()`; `doc/TESTING.md`
   * (Page-error capture) carries the reason. This rejects with the same TypeError
   * a genuinely offline fetch rejects with, and issues no request.
   */
  async function failTheSend(page: import("@playwright/test").Page) {
    await page.addInitScript(() => {
      // bind: fetch throws "Illegal invocation" if called detached from window.
      const realFetch = window.fetch.bind(window);
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "POST"
          ? Promise.reject(new TypeError("Failed to fetch"))
          : realFetch(input, init);
    });
  }

  async function submitFailingFeedback(page: import("@playwright/test").Page) {
    await page.locator("#feedback-trigger").click();
    await page.locator("#feedback-message").fill(MESSAGE);
    await page.locator("label[for='star4']").click();
    await page.locator("#feedback-submit").click();
    // toBeVisible, not just toHaveText: getComputedStyle answers happily on a
    // display:none element, so every style assertion below would pass on a page
    // where the user is shown nothing at all (#798).
    await expect(page.locator("#feedback-result")).toBeVisible();
    await expect(page.locator("#feedback-result")).toHaveText(
      "Couldn't send, please try later"
    );
  }

  test("keeps the modal open with the message and rating intact", async ({
    page,
  }) => {
    await failTheSend(page);
    await page.goto("/");
    await submitFailingFeedback(page);

    // The modal stays up, the form stays with it, and nothing the user typed is
    // gone: they can press Send again without retyping a word.
    await expect(page.locator("#feedback-modal")).toBeVisible();
    await expect(page.locator("#feedback-form")).toBeVisible();
    await expect(page.locator("#feedback-message")).toHaveValue(MESSAGE);
    await expect(page.locator("#star4")).toBeChecked();

    // The success path's 1500 ms auto-close must not be running. There is no
    // web-first way to assert that nothing happens within a window, so the wait is
    // the assertion, not a substitute for one.
    await page.waitForTimeout(1800);
    await expect(page.locator("#feedback-modal")).toBeVisible();
    await expect(page.locator("#feedback-message")).toHaveValue(MESSAGE);

    // Press Send AGAIN, through the real button. This is the only layer that can
    // catch a Send left disabled: every jsdom test dispatches a synthetic submit
    // event on the form, which never consults the button. Playwright auto-waits for
    // an enabled element, so a dead button fails here by timing out.
    await page.locator("#feedback-submit").click();
    await expect(page.locator("#feedback-result")).toHaveText(
      "Couldn't send, please try later"
    );
  });

  // Only a real browser can see this: it is a cascade fact (the :hover rule sits at
  // equal specificity below :disabled, so without :not(:disabled) a hovered disabled
  // Send renders identically to a live one) and jsdom has no cascade and no hover.
  // Playwright leaves the pointer on the element after click(), so hover is live.
  test("greys Send out while the POST is in flight, even under the pointer", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const realFetch = window.fetch.bind(window);
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "POST"
          ? new Promise<Response>(() => {}) // never settles
          : realFetch(input, init);
    });
    await page.goto("/");

    await page.locator("#feedback-trigger").click();
    await page.locator("#feedback-message").fill("hangs forever");
    await page.locator("#feedback-submit").click();

    await expect(page.locator("#feedback-submit")).toBeDisabled();
    await expectComputedStyle(page, "#feedback-submit", "opacity", "0.55");
  });

  test("announces the error to assistive technology", async ({ page }) => {
    await failTheSend(page);
    await page.goto("/");
    await submitFailingFeedback(page);

    // The failure no longer closes the modal, so nothing about the page's shape tells
    // a screen-reader user it failed. The live region is the announcement. Asserted
    // here, against the real index.html: the jsdom fixture builds its own
    // #feedback-result and would pass without the attribute.
    await expect(page.locator("#feedback-result")).toHaveAttribute(
      "role",
      "alert"
    );
  });

  // The modal's background (--color-background-lighter) is light blue in BOTH themes,
  // so the error colour is fixed rather than theme-dependent. A red chosen for the
  // dark page background would land at ~1.6:1 here, which is the defect #569 already
  // fixed once for the buttons in this same modal.
  //
  // Both themes therefore measure the same two colours today, and the light case
  // looks like a duplicate. It is not. It fails the day someone overrides
  // --color-error in body.light-theme (the colour is pinned exactly below), or
  // overrides --color-background-lighter in a way that drops the error below AA.
  // Do not delete it as redundant.
  for (const theme of ["dark", "light"] as const) {
    test(`error text meets WCAG AA against the modal in ${theme} mode`, async ({
      page,
    }) => {
      await failTheSend(page);
      await page.goto("/");

      // Prove the theme actually flipped. Without this, a silently-failed click
      // would measure dark mode twice and the light-mode case would pass vacuously.
      const body = page.locator("body");
      if (theme === "light") {
        await page.locator("#darkswitch").click();
        await expect(body).toHaveClass(/light-theme/);
      } else {
        await expect(body).not.toHaveClass(/light-theme/);
      }

      await submitFailingFeedback(page);

      const ratio = await page
        .locator("#feedback-result")
        .evaluate((el: HTMLElement) => {
          const parse = (c: string) =>
            (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
          const luminance = (rgb: number[]) => {
            const [r, g, b] = rgb.map((v) => {
              const s = v / 255;
              return s <= 0.03928
                ? s / 12.92
                : Math.pow((s + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
          };
          const modal = document.getElementById("feedback-modal")!;
          const fg = luminance(parse(getComputedStyle(el).color));
          const bg = luminance(
            parse(getComputedStyle(modal).backgroundColor)
          );
          const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg];
          return (hi! + 0.05) / (lo! + 0.05);
        });

      expect(ratio).toBeGreaterThanOrEqual(4.5);

      // The ratio alone does not pin that --color-error is applied: delete the rule
      // and #feedback-result inherits --color-text, which in LIGHT mode still clears
      // 4.5:1 against the modal, so the light case would pass with the fix gone
      // (#798). Pin the resolved colour too.
      await expectComputedStyle(
        page,
        "#feedback-result",
        "color",
        "rgb(156, 22, 22)"
      );
    });
  }

  test("the error does not claim the confirmation's full height", async ({
    page,
  }) => {
    await failTheSend(page);
    await page.goto("/");
    await submitFailingFeedback(page);

    // The confirmation is a 140px panel that replaces the form. The error sits
    // beneath a form that is still on screen, so it must not reserve that block.
    const minHeight = await getComputedStyleValue(
      page,
      "#feedback-result",
      "min-height"
    );
    expect(minHeight).toBe("0px");
  });
});
