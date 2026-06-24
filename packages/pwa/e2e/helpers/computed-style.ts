import { expect, type Page } from "@playwright/test";

/**
 * Reusable Playwright computed-style assertions (#714).
 *
 * jsdom stores inline style strings and does not compute the cascade, so
 * `style.*` assertions can pass while the rendered result is wrong. The only
 * reliable proof is a real-browser read. This is the test-of-record pattern
 * for the #1074 rule: when a fix turns on a computed CSS property or the
 * cascade (specificity, inheritance, `!important`), assert it here, not in a
 * jsdom unit test.
 *
 * All reads go through `getPropertyValue`, which takes the CSS (kebab-case)
 * property name and returns the resolved string — robust for properties like
 * `background-color` that the bracket/camelCase form would miss.
 */

/**
 * Read a computed CSS property from the first element matching `selector`.
 *
 * `getPropertyValue` returns `""` for an unknown, misspelled, or wrong-case
 * (camelCase) property name, and for a property that is genuinely unset. An
 * empty read is rejected by default so a typo cannot make an assertion pass
 * vacuously — the failure that would otherwise give a test-of-record false
 * confidence. Pass `{ allowEmpty: true }` to assert an empty value on purpose.
 *
 * @param page - the Playwright page.
 * @param selector - CSS selector; the first match is used.
 * @param property - CSS property name in kebab-case (e.g. `background-color`).
 * @param options - `allowEmpty` permits an empty (`""`) result.
 * @returns The resolved computed value as a string.
 */
export async function getComputedStyleValue(
  page: Page,
  selector: string,
  property: string,
  options: { allowEmpty?: boolean } = {}
): Promise<string> {
  const value = await page
    .locator(selector)
    .first()
    .evaluate(
      (el, prop) => window.getComputedStyle(el).getPropertyValue(prop),
      property
    );
  if (!options.allowEmpty) {
    expect(
      value,
      `getComputedStyle resolved "" for "${property}" on "${selector}" — ` +
        `unknown/misspelled property, wrong case (use kebab-case), or unset; ` +
        `pass { allowEmpty: true } to assert an empty value deliberately`
    ).not.toBe("");
  }
  return value;
}

/**
 * Assert that a computed CSS property equals `expected`.
 *
 * @param page - the Playwright page.
 * @param selector - CSS selector; the first match is used.
 * @param property - CSS property name in kebab-case.
 * @param expected - the expected resolved value (e.g. `rgb(0, 0, 0)`).
 */
export async function expectComputedStyle(
  page: Page,
  selector: string,
  property: string,
  expected: string
): Promise<void> {
  expect(await getComputedStyleValue(page, selector, property)).toBe(expected);
}

/**
 * Assert that a computed CSS property does NOT equal `notExpected`.
 *
 * @param page - the Playwright page.
 * @param selector - CSS selector; the first match is used.
 * @param property - CSS property name in kebab-case.
 * @param notExpected - the value the property must not resolve to.
 */
export async function expectComputedStyleNot(
  page: Page,
  selector: string,
  property: string,
  notExpected: string
): Promise<void> {
  expect(await getComputedStyleValue(page, selector, property)).not.toBe(
    notExpected
  );
}

/**
 * Assert the computed CSS property of the element under a viewport point.
 *
 * Resolves `document.elementFromPoint(x, y)` in the browser and reads the
 * property from it — a direct way to prove which element actually receives a
 * hit at a coordinate (e.g. an overlay covering a control).
 *
 * @param page - the Playwright page.
 * @param x - viewport x coordinate.
 * @param y - viewport y coordinate.
 * @param property - CSS property name in kebab-case.
 * @param expected - the expected resolved value.
 * @throws If no element is found at the point.
 */
export async function expectElementFromPointStyle(
  page: Page,
  x: number,
  y: number,
  property: string,
  expected: string
): Promise<void> {
  const actual = await page.evaluate(
    ({ px, py, prop }) => {
      const el = document.elementFromPoint(px, py);
      if (!el) throw new Error(`no element at (${px}, ${py})`);
      return window.getComputedStyle(el).getPropertyValue(prop);
    },
    { px: x, py: y, prop: property }
  );
  // This read does not flow through getComputedStyleValue, so it carries its
  // own non-empty guard: a typo'd/wrong-case/unset property resolves to "" and
  // must not pass vacuously against an `expected` of "".
  expect(
    actual,
    `getComputedStyle resolved "" for "${property}" at (${x}, ${y}) — ` +
      `unknown/misspelled property, wrong case (use kebab-case), or unset`
  ).not.toBe("");
  expect(actual).toBe(expected);
}

/**
 * Assert that an element is readable in the given theme: its foreground
 * `color` and its own (opaque) `background-color` differ. Toggles the theme
 * via `#darkswitch` if the requested mode is not already active. A fully
 * transparent background (the canonical `rgba(0, 0, 0, 0)`) is rejected — it
 * trivially differs from any foreground and so cannot prove readability; target
 * an element with a resolved opaque background.
 *
 * The dark theme is the default (no `light-theme` class on `body`); light mode
 * adds it. The toggle is bidirectional so the assertion holds regardless of
 * the mode the page is currently in.
 *
 * @param page - the Playwright page.
 * @param selector - CSS selector for the element to check; the first match is used.
 * @param mode - `"light"` or `"dark"`.
 */
export async function assertReadableInMode(
  page: Page,
  selector: string,
  mode: "light" | "dark"
): Promise<void> {
  const body = page.locator("body");
  const isLight = await body.evaluate((el) =>
    el.classList.contains("light-theme")
  );
  if (mode === "light") {
    if (!isLight) await page.locator("#darkswitch").click();
    await expect(body).toHaveClass(/light-theme/);
  } else {
    if (isLight) await page.locator("#darkswitch").click();
    await expect(body).not.toHaveClass(/light-theme/);
  }

  const foreground = await getComputedStyleValue(page, selector, "color");
  const background = await getComputedStyleValue(
    page,
    selector,
    "background-color"
  );
  // Canonical Chromium serialisation of a fully transparent background; this is
  // a fully-transparent check, not a general alpha test (a partial alpha would
  // pass). The suite is Chromium/WebKit and the themes use opaque colours.
  expect(
    background,
    `background is transparent in ${mode} mode — readability cannot be judged ` +
      `from this element's own background; target an opaque-background element`
  ).not.toBe("rgba(0, 0, 0, 0)");
  expect(
    foreground,
    `foreground and background must differ in ${mode} mode`
  ).not.toBe(background);
}
