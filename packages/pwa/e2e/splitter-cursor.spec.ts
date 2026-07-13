import { test, expect } from "@playwright/test";

/**
 * Regression test for #709 — while dragging the splitter, the resize cursor
 * must stay pinned even when the pointer outpaces the clamped splitter onto the
 * score area, which sets its own `cursor: crosshair`.
 *
 * The original fix set `document.body.style.cursor`, which a child element's own
 * cursor overrides whenever the pointer is over it — so the symptom survived. The
 * working fix toggles a `resizing-split` class on <body> with a
 * `cursor: row-resize !important` rule that beats the child cursor. jsdom cannot
 * model that cascade (it stores the inline string only), so this computed-cursor
 * check in a real browser is the genuine guard.
 */
test.describe("Splitter drag cursor (#709)", () => {
  test("pins row-resize over the score while dragging past the clamp", async ({
    page,
  }) => {
    await page.goto("/");

    const splitter = page.locator(".splitter");
    const score = page.locator("music-score");
    await expect(splitter).toBeVisible();
    await expect(score).toBeVisible();

    const sbox = await splitter.boundingBox();
    const scoreBox = await score.boundingBox();
    if (!sbox || !scoreBox) {
      throw new Error("splitter or score has no bounding box");
    }

    // Grab the splitter and drag up near the top of the score — the case where
    // the pointer outpaces the clamped splitter and used to show crosshair. The
    // score stays at least 100px tall (the clamp floor), so a point near its top
    // remains over the score throughout the drag.
    const pointX = scoreBox.x + scoreBox.width / 2;
    const pointY = scoreBox.y + 20;
    await page.mouse.move(sbox.x + sbox.width / 2, sbox.y + sbox.height / 2);
    await page.mouse.down();
    await page.mouse.move(pointX, pointY, { steps: 10 });

    // Read the cursor of the element actually under the pointer (what the user
    // sees), not just the host: the universal `body.resizing-split *` rule is
    // what pins the score's descendants, so assert against the real hit element.
    const cursorAtPointer = ({ x, y }: { x: number; y: number }) => {
      const el = document.elementFromPoint(x, y);
      return el ? getComputedStyle(el).cursor : null;
    };

    const during = await page.evaluate(cursorAtPointer, { x: pointX, y: pointY });
    expect(during).toBe("row-resize");

    await page.mouse.up();

    // After release the pin is gone; the element under the pointer is back to
    // its own cursor. Assert "not row-resize" to stay resilient to restyling.
    const after = await page.evaluate(cursorAtPointer, { x: pointX, y: pointY });
    expect(after).not.toBe("row-resize");
  });
});
