import { test, expect } from "./helpers/page-errors";

test.describe("Spem Player smoke tests", () => {
  test("page loads with all custom elements", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("music-score")).toBeVisible();
    await expect(page.locator("music-canvas")).toBeVisible();
    await expect(page.locator("music-controls")).toBeVisible();
    await expect(page.locator("music-canvas-watcher")).toBeAttached();
  });

  test("dark mode toggle switches theme", async ({ page }) => {
    await page.goto("/");

    const body = page.locator("body");
    const darkSwitch = page.locator("#darkswitch");

    await expect(body).not.toHaveClass(/light-theme/);

    await darkSwitch.click();

    await expect(body).toHaveClass(/light-theme/);

    await darkSwitch.click();

    await expect(body).not.toHaveClass(/light-theme/);
  });

  test("help panel opens and closes", async ({ page }) => {
    await page.goto("/");

    const help = page.locator("#help");
    const backdrop = page.locator("#backdrop");

    await expect(help).toBeHidden();
    await expect(backdrop).toBeHidden();

    await page.locator("#info").click();

    await expect(help).toBeVisible();
    await expect(backdrop).toBeVisible();

    await backdrop.click();

    await expect(help).toBeHidden();
    await expect(backdrop).toBeHidden();
  });

  test("help panel does not overlap header (#249)", async ({ page }) => {
    await page.goto("/");

    const help = page.locator("#help");
    const header = page.locator("header");

    await page.locator("#info").click();
    await expect(help).toBeVisible();

    const helpBox = await help.boundingBox();
    const headerBox = await header.boundingBox();

    expect(helpBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(helpBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
  });

  test("URL parameters initialise state", async ({ page }) => {
    await page.goto("/?choir=3&part=2&bar=10");

    const controls = page.locator("music-controls");

    await expect(controls).toHaveAttribute("choir", "3");
    await expect(controls).toHaveAttribute("part", "2");
    await expect(controls).toHaveAttribute("bar", "10");
  });

  test("keyboard digits select choir", async ({ page }) => {
    await page.goto("/");

    const controls = page.locator("music-controls");
    await expect(controls).toHaveAttribute("choir", "0");

    await page.keyboard.press("4");

    await expect(controls).toHaveAttribute("choir", "3");
  });

  test("bar input typing does not change choir (#182)", async ({ page }) => {
    await page.goto("/");

    const controls = page.locator("music-controls");
    const barInput = page.locator("#bar-field");
    await expect(controls).toHaveAttribute("choir", "0");

    await barInput.fill("2");
    await barInput.blur();

    await expect(controls).toHaveAttribute("choir", "0");
    await expect(controls).toHaveAttribute("bar", "2");
  });

  test("bar input clamps out-of-range values (#184)", async ({ page }) => {
    await page.goto("/");

    const controls = page.locator("music-controls");
    const barInput = page.locator("#bar-field");

    await barInput.fill("999");
    await barInput.blur();
    await expect(controls).toHaveAttribute("bar", "139");

    await barInput.fill("-5");
    await barInput.blur();
    await expect(controls).toHaveAttribute("bar", "0");
  });

  test("initial scroll lands on the target bar (#92)", async ({ page }) => {
    // Regression guard for #92: `MusicScore.#loadScore()` previously called
    // `scrollSmooth()` synchronously after inserting the SVG, triggering a
    // Chrome forced-reflow violation. The fix defers `scrollSmooth()` via
    // `requestAnimationFrame`. This test guards the behavioural invariant
    // — wherever the deferral lives, the score must end up scrolled to the
    // target bar after the initial load. If a future change reverts the
    // defer in a way that swallows the call (rAF callback never runs),
    // the inner `.score-scroll-area` stays at scrollLeft 0 and this test
    // fails.
    await page.goto("/?bar=40");
    const scrollArea = page.locator("music-score .score-scroll-area");
    await expect(scrollArea).toBeVisible();
    await expect
      .poll(
        async () =>
          await scrollArea.evaluate((el) => (el as HTMLElement).scrollLeft),
        { timeout: 2000 },
      )
      .toBeGreaterThan(0);
  });
});
