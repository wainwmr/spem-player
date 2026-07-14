import { test, expect, isAllowlisted } from "./helpers/page-errors";
import type { BrowserContext, Page } from "@playwright/test";

// #801 — FOUC-guard fallback.
//
// index.html hides .viewportDiv behind an inline <style id="fouc-guard">, and
// the bundled stylesheet releases it (style.scss, `.viewportDiv { visibility:
// visible }`). A visit whose CSS request fails never got that release: the page
// stayed permanently blank. The fix removes the guard node instead, by either of
// two paths — the stylesheet link's `error` event, or a window-load backstop —
// and records which one fired in `data-fouc-fallback` on <html>.
//
// That marker is what lets these tests pin each path SEPARATELY. Asserting only
// "the app ends up visible" would pass with either path deleted, which is how
// the MutationObserver could rot unnoticed: it is the only thing that arms the
// error path in the built page, because Vite appends the stylesheet <link> at
// the end of <head>, after the inline script. The last test pins that build fact
// too, since the discrimination depends on it.
//
// Assertions read computed style, never the inline style string: a style-string
// assertion reads the write, not the rendered result, and has been falsely green
// before (#709).
//
// The failure-injection cases open their own page via context.newPage(), because
// a failed stylesheet legitimately logs console errors and the page-errors
// auto-fixture would fail the test on them. An own page inherits the fixture's
// context ROUTES but none of its LISTENERS, so `newInjectionPage` re-attaches
// both channels and `expectOnlyTheFoucDiagnostic` filters them: the FOUC
// diagnostic must be present, the injection's own resource error is allowed, and
// anything else fails. That keeps the escape from becoming a blind spot, and it
// is also what pins the Cloudflare stub being CONTEXT-scoped in
// helpers/page-errors.ts — were it page-scoped, this page would run the real
// beacon and its CORS failure would surface here as an unexpected console error.

interface InjectionPage {
  page: Page;
  pageErrors: string[];
  consoleErrors: string[];
}

/**
 * Opens a page outside the error-capture fixture, keeping both error channels.
 *
 * Own page: the injected stylesheet failure is the test's premise, so the console
 * errors it raises are expected and must not fail the test at the fixture's
 * teardown. See doc/TESTING.md, "Injecting a failure".
 */
async function newInjectionPage(
  context: BrowserContext
): Promise<InjectionPage> {
  const page = await context.newPage();
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const loc = msg.location().url;
      consoleErrors.push(`${msg.text()}${loc ? ` (at ${loc})` : ""}`);
    }
  });
  return { page, pageErrors, consoleErrors };
}

const FOUC_DIAGNOSTIC = "the stylesheet did not release the FOUC guard";

/**
 * Asserts the page raised no uncaught exception, logged the FOUC diagnostic for
 * `source`, and logged nothing else beyond messages matching `allow`.
 */
async function expectOnlyTheFoucDiagnostic(
  { page, pageErrors, consoleErrors }: InjectionPage,
  source: string,
  allow: RegExp[]
): Promise<void> {
  // The same flush the fixture does (helpers/page-errors.ts): event delivery to
  // the Playwright client is asynchronous, and this no-op round trip delivers
  // anything the browser had already raised.
  await page.evaluate(() => undefined).catch(() => {});

  expect(
    pageErrors,
    "an uncaught exception on the page (the guard script, or the app running unstyled)"
  ).toEqual([]);

  // The diagnostic is the app's ONLY signal that the fallback fired; there is no
  // error reporting anywhere else. Without this assertion it could be deleted as
  // noise and every test would stay green, which is the silent failure the whole
  // fallback exists to avoid.
  expect(
    consoleErrors.filter(
      (e) => e.includes(FOUC_DIAGNOSTIC) && e.includes(`(${source})`)
    ),
    `the FOUC diagnostic for "${source}" was not logged`
  ).toHaveLength(1);

  // Filter through the FIXTURE's allowlist, not a private copy: the third-party
  // script hosts it excuses (DNS-blocked in test environments) fail on this page
  // exactly as they do on any other, and a second copy of that list would drift.
  const unexpected = consoleErrors.filter(
    (e) =>
      !e.includes(FOUC_DIAGNOSTIC) &&
      !isAllowlisted(e) &&
      !allow.some((re) => re.test(e))
  );
  expect(unexpected, "unexpected console errors on the injection page").toEqual(
    []
  );
}

/** The browser's own resource error for the stylesheet we deliberately broke. */
const BROKEN_CSS = [/\/assets\/[^\s)]*\.css/];

const GUARD = "#fouc-guard";
const VIEWPORT = ".viewportDiv";

test.describe("FOUC-guard fallback (#801)", () => {
  test("an aborted stylesheet reveals the app via the error path", async ({
    context,
  }) => {
    const injection = await newInjectionPage(context);
    const { page } = injection;

    // Count the aborts. Without this the glob is unverified: if Vite's asset path
    // ever moves, route.abort() silently intercepts nothing, the stylesheet loads
    // normally, and this test passes green while exercising none of the fix.
    let aborted = 0;
    await page.route("**/assets/*.css", (route) => {
      aborted++;
      return route.abort();
    });

    await page.goto("/");

    expect(
      aborted,
      "no stylesheet was aborted: the route glob no longer matches the built CSS " +
        "path, so this test is not injecting the failure it claims to inject"
    ).toBeGreaterThan(0);

    await expect(page.locator(VIEWPORT)).toHaveCSS("visibility", "visible", {
      timeout: 5000,
    });
    // The guard node is removed, not merely overridden, so no inline-style residue
    // is left to outrank a later rule.
    await expect(page.locator(GUARD)).toHaveCount(0);
    // Pins the FAST path specifically. Remove the MutationObserver or the error
    // listener and the load backstop still reveals the app, so the visibility
    // assertion above still passes, but this one goes red with "load-backstop".
    await expect(page.locator("html")).toHaveAttribute(
      "data-fouc-fallback",
      "stylesheet-error"
    );

    await expectOnlyTheFoucDiagnostic(injection, "stylesheet-error", BROKEN_CSS);
    await page.close();
  });

  test("a missing stylesheet (404) reveals the app via the error path", async ({
    context,
  }) => {
    const injection = await newInjectionPage(context);
    const { page } = injection;

    // The realistic production trigger: a hashed asset that has gone, because a
    // deploy landed under an open tab. Netlify serves that as a 404 (the SPA
    // `[[redirects]]` block in netlify.toml is commented out), and a 404 fails the
    // stylesheet, so this takes the fast path.
    let served = 0;
    await page.route("**/assets/*.css", (route) => {
      served++;
      return route.fulfill({ status: 404, contentType: "text/plain", body: "" });
    });

    await page.goto("/");

    expect(
      served,
      "no stylesheet was intercepted: the route glob no longer matches the built CSS path"
    ).toBeGreaterThan(0);

    await expect(page.locator(VIEWPORT)).toHaveCSS("visibility", "visible", {
      timeout: 5000,
    });
    await expect(page.locator(GUARD)).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute(
      "data-fouc-fallback",
      "stylesheet-error"
    );

    await expectOnlyTheFoucDiagnostic(injection, "stylesheet-error", BROKEN_CSS);
    await page.close();
  });

  test("a stylesheet served as HTML reveals the app, whichever path the engine takes", async ({
    context,
  }) => {
    const injection = await newInjectionPage(context);
    const { page } = injection;

    // The other production shape: SPA-fallback hosting answers a missing hashed
    // asset with 200 text/html (the index page) rather than a 404.
    //
    // THIS IS WHY THE FIX HAS TWO PATHS, and the reason is empirical, not
    // theoretical. The engines do not agree about which event a wrong-MIME
    // stylesheet fires, and neither agrees fully with the spec (measured
    // 2026-07-14):
    //
    //   Chromium  refuses to apply the sheet but fires `load`  -> load-backstop
    //   Firefox   fires `error`                                -> stylesheet-error
    //   WebKit    fires `error`                                -> stylesheet-error
    //
    // So delete the backstop and this failure goes unhandled on Chromium; delete
    // the error path and it goes unhandled on Firefox and WebKit. Neither path
    // alone covers the most likely real-world failure on every engine. That is the
    // whole argument for keeping both, and it is the thing to read before
    // "simplifying" this fix.
    //
    // The assertion therefore pins what the FIX guarantees (the app is revealed, by
    // one of the two paths) rather than freezing one engine's quirk, which a
    // browser update could legitimately change with no defect in our code. The
    // per-path pinning is done deterministically by the abort/404 and empty-CSS
    // cases above and below.
    let served = 0;
    await page.route("**/assets/*.css", (route) => {
      served++;
      return route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!DOCTYPE html><html><body>index</body></html>",
      });
    });

    await page.goto("/");

    expect(
      served,
      "no stylesheet was intercepted: the route glob no longer matches the built CSS path"
    ).toBeGreaterThan(0);

    await expect(page.locator(VIEWPORT)).toHaveCSS("visibility", "visible", {
      timeout: 5000,
    });
    await expect(page.locator(GUARD)).toHaveCount(0);

    // The reveal has landed (the two assertions above waited for it), so the marker
    // is set. It must name one of the two paths: a null marker would mean the
    // fallback never ran and something else revealed the app.
    const marker = await page
      .locator("html")
      .getAttribute("data-fouc-fallback");
    expect(
      ["stylesheet-error", "load-backstop"],
      "the fallback did not fire on a stylesheet served as HTML"
    ).toContain(marker);

    // Engines log the MIME refusal differently (or not at all), so allow anything
    // naming the stylesheet we broke.
    await expectOnlyTheFoucDiagnostic(injection, marker as string, BROKEN_CSS);
    await page.close();
  });

  test("a stylesheet that loads but carries no rules reveals the app via the load backstop", async ({
    context,
  }) => {
    const injection = await newInjectionPage(context);
    const { page } = injection;

    // An empty body with a CSS content-type is the ONE construction that provably
    // cannot fire `error`: a valid stylesheet that simply applies no rules. That is
    // what isolates the backstop. It is an artificial shape, deliberately; it
    // stands in for the real cases the backstop uniquely covers (a truncated body,
    // or style.scss no longer carrying the release rule), both of which load
    // cleanly and raise nothing.
    let served = 0;
    await page.route("**/assets/*.css", (route) => {
      served++;
      return route.fulfill({ status: 200, contentType: "text/css", body: "" });
    });

    await page.goto("/");

    expect(
      served,
      "no stylesheet was intercepted: the route glob no longer matches the built CSS path"
    ).toBeGreaterThan(0);

    await expect(page.locator(VIEWPORT)).toHaveCSS("visibility", "visible", {
      timeout: 5000,
    });
    await expect(page.locator(GUARD)).toHaveCount(0);
    // Pins the BACKSTOP specifically: no error event can fire here, so if the
    // window-load handler is removed this goes red.
    await expect(page.locator("html")).toHaveAttribute(
      "data-fouc-fallback",
      "load-backstop"
    );

    // No resource error is expected: the response is a perfectly good (empty)
    // stylesheet.
    await expectOnlyTheFoucDiagnostic(injection, "load-backstop", []);
    await page.close();
  });

  // #829 — the fallback must reveal the APP, not everything the stylesheet hides.
  //
  // style.scss is the ONLY thing hiding three groups: #help (display: none),
  // #feedback-modal (display: none) and .tooltiptext (visibility: hidden). When it
  // fails, revealing .viewportDiv also exposes all three, so the failure screen
  // showed an expanded help panel, an expanded feedback dialog, and every tooltip
  // string dumped inline down the page.
  //
  // The fix is a SECOND inline <style id="fallback-hide"> that the fallback does not
  // remove, so those three stay hidden with no stylesheet. It cannot break the healthy
  // page: #help and #feedback-modal are opened by an inline style.display write
  // (index.ts), which outranks any stylesheet rule, and .tooltiptext is revealed by
  // `.tooltip:hover .tooltiptext`, which outranks it on specificity.
  test("the fallback does not expose the elements only the stylesheet hides (#829)", async ({
    context,
  }) => {
    const injection = await newInjectionPage(context);
    const { page } = injection;

    let aborted = 0;
    await page.route("**/assets/*.css", (route) => {
      aborted++;
      return route.abort();
    });

    await page.goto("/");

    expect(
      aborted,
      "no stylesheet was aborted: the route glob no longer matches the built CSS " +
        "path, so this test is not injecting the failure it claims to inject"
    ).toBeGreaterThan(0);

    // Premise: the fallback fired and the app IS revealed. Without this the
    // assertions below would pass on a page that never revealed anything.
    await expect(page.locator(VIEWPORT)).toHaveCSS("visibility", "visible", {
      timeout: 5000,
    });

    // The point of the ticket: revealed, but not undressed. Computed style, never
    // the inline style string (#709).
    await expect(page.locator("#help")).toHaveCSS("display", "none");
    await expect(page.locator("#feedback-modal")).toHaveCSS("display", "none");
    await expect(page.locator(".tooltiptext").first()).toHaveCSS(
      "visibility",
      "hidden"
    );

    await expectOnlyTheFoucDiagnostic(injection, "stylesheet-error", BROKEN_CSS);
    await page.close();
  });

  test("a successful stylesheet releases the guard via the cascade, not the fallback", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator(VIEWPORT)).toHaveCSS("visibility", "visible", {
      timeout: 5000,
    });

    // The control, and the reason this case is not a tautology. The fallback
    // supplies "visible" unconditionally, so asserting visibility alone would stay
    // green even if the stylesheet stopped releasing the guard. These assertions
    // say the release came from the CASCADE: the guard node is still in the DOM,
    // and the fallback never ran.
    //
    // This is what re-pins `.viewportDiv { visibility: visible }` in style.scss.
    // That declaration reads like a redundant no-op (`visible` is the initial
    // value) and is exactly the kind a tidy-up deletes; before this ticket,
    // deleting it produced an instant permanent blank page, the loudest signal
    // there is. The fallback now masks that, so without these assertions the signal
    // would have been silently replaced by nothing.
    //
    // This case runs on the FIXTURE's page, so reveal()'s console.error would fail
    // it at teardown too: a third pin on the same contract, and the only one with
    // no ordering dependency.
    await expect(page.locator(GUARD)).toHaveCount(1);
    expect(
      await page.locator("html").getAttribute("data-fouc-fallback"),
      "the fallback fired on a healthy stylesheet: the stylesheet is no longer " +
        "releasing the FOUC guard"
    ).toBeNull();
  });

  test("the built page arms the observer, not the initial scan", async ({
    page,
  }) => {
    // The error-path tests above discriminate only because Vite emits the
    // stylesheet <link> AFTER the inline script, so the script's initial
    // querySelectorAll finds nothing and the MutationObserver is the only thing
    // that arms the error listener. Nothing else pins that build fact: if Vite's
    // injection order changed, the initial scan would arm the path, the observer
    // would become dead code, and the tests above would stay green with it deleted.
    const html = await (await page.request.get("/")).text();
    const guardAt = html.indexOf('id="fouc-guard"');
    // Match the ELEMENT, not the bare attribute. The inline script's own
    // `querySelectorAll('link[rel="stylesheet"]')` contains the attribute text and
    // appears EARLIER in the document than the real link, so searching for
    // `rel="stylesheet"` alone finds the script's source and the ordering
    // assertion below passes while comparing against the wrong thing. (It did,
    // until this was caught.)
    const linkAt = html.indexOf('<link rel="stylesheet"');

    // Guard the lookups. A missing needle returns -1, and -1 is less than
    // anything, so an unguarded comparison would pass vacuously: the exact
    // false-green class this suite is about.
    expect(
      guardAt,
      'no id="fouc-guard" in the served HTML'
    ).toBeGreaterThanOrEqual(0);
    expect(
      linkAt,
      'no <link rel="stylesheet"> element in the served HTML'
    ).toBeGreaterThanOrEqual(0);
    expect(
      guardAt,
      "the bundled stylesheet <link> must come AFTER the inline guard script; if it " +
        "moves before it, the initial scan arms the error path and the " +
        "MutationObserver becomes untested dead code"
    ).toBeLessThan(linkAt);
  });
});
