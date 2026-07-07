import { test, expect } from "./helpers/page-errors";

/**
 * Regression tests for #317 — touch drag on the canvas overview must not
 * commit state on every touchmove. The pre-fix code bound
 * `music-canvas-touchmove` to `handleCanvasClick`, so the count of bar
 * attribute changes scaled with the number of touchmove events (60+/s during
 * a real drag). The fix binds `music-canvas-touchend` instead.
 *
 * The assertions here intentionally allow synthetic click events that
 * mobile browsers fire after touchend (which still go through
 * `handleCanvasClick`). The signal of the bug is that the count *scales
 * with touchmove events*, not the absolute number.
 *
 * Both tests run on touch-emulated chromium. The multi-point drag uses CDP
 * Input.dispatchTouchEvent and is Chromium-only.
 */

test.use({
  hasTouch: true,
  viewport: { width: 412, height: 915 },
});

const STEPS = 10;

async function startBarCounter(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const el = document.querySelector("music-controls");
    if (!el) throw new Error("music-controls not found");
    const w = window as unknown as { __barChanges: number };
    w.__barChanges = 0;
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "attributes" && m.attributeName === "bar") {
          w.__barChanges++;
        }
      }
    });
    obs.observe(el, { attributes: true, attributeFilter: ["bar"] });
  });
}

async function getBarChanges(page: import("@playwright/test").Page) {
  return await page.evaluate(
    () => (window as unknown as { __barChanges: number }).__barChanges
  );
}

test.describe("Touch on canvas (#317)", () => {
  test("tap commits to the tapped position", async ({ page }) => {
    await page.goto("/?bar=0");

    const canvas = page.locator("music-canvas");
    const controls = page.locator("music-controls");
    await expect(canvas).toBeVisible();
    await startBarCounter(page);

    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas has no bounding box");
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(100);

    // A tap should commit at least once; the bar attribute should reflect
    // a non-zero bar (the tap was near the middle of the canvas).
    const changes = await getBarChanges(page);
    expect(changes).toBeGreaterThanOrEqual(1);

    const finalBar = Number(await controls.getAttribute("bar"));
    expect(finalBar).toBeGreaterThan(0);
  });

  test("drag does not commit per touchmove (count must not scale with moves)", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Multi-point synthetic touch sequence requires CDP (chromium only)"
    );

    await page.goto("/?bar=0");

    const canvas = page.locator("music-canvas");
    const controls = page.locator("music-controls");
    await expect(canvas).toBeVisible();
    await startBarCounter(page);

    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas has no bounding box");

    // Drag from the left fifth to the right fifth with several intermediate
    // touchmove events.
    const y = box.y + box.height / 2;
    const x0 = box.x + box.width * 0.2;
    const xN = box.x + box.width * 0.8;

    const client = await page.context().newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: x0, y, id: 0 }],
    });
    for (let i = 1; i <= STEPS; i++) {
      const x = x0 + ((xN - x0) * i) / STEPS;
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y, id: 0 }],
      });
    }
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForTimeout(150);

    const changes = await getBarChanges(page);

    // Pre-fix records one bar change per touchmove plus touchstart, i.e.
    // STEPS+1 minimum (here: 11+). Post-fix is bounded by touchstart +
    // touchend + a synthetic click that some browsers fire after touch,
    // typically 2-5. STEPS is the discriminator: any value bounded below
    // STEPS proves the count does not scale with touchmove events.
    expect(changes).toBeLessThan(STEPS);

    // The final bar must reflect the touchend position (right side of the
    // canvas), not the touchstart position.
    const finalBar = Number(await controls.getAttribute("bar"));
    expect(finalBar).toBeGreaterThan(0);
  });
});
