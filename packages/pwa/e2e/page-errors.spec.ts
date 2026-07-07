import { test, expect } from "./helpers/page-errors";

// Self-test for the page-error capture fixture (#775).
//
// Capture-pinning cases are POSITIVE tests: inject one error class, poll the
// exposed capture array until the entry arrives (event delivery to the
// Playwright client is asynchronous; a fixed sleep raced on firefox), then
// clear the array so the fixture's teardown assertion passes. A dead capture
// channel times the poll out and fails its test red. Do NOT wrap these in
// test.fail(): it inverts ANY failure, including the poll timeout, which is
// exactly how a capture regression would hide (Vera 775-01).
//
// The final case pins the other direction — that a non-empty capture actually
// fails the test at teardown. It is test.fail()-annotated and deliberately
// never asserts in its body (its wait is a Node-side sleep, so a page crash
// cannot reject it), leaving the fixture's teardown assertion as the failure
// source — goto/evaluate infrastructure failures excepted, which every other
// spec would catch as a dead server. Healthy fixture -> teardown fails ->
// expected failure (green); capture or teardown regressed -> body and
// teardown both pass -> "unexpectedly passed" -> red.

// Deliberate bypass of the readonly exposure: the positive cases must reset
// the array after verifying capture so their teardown passes. Specs must
// never do this; the readonly type forbids it everywhere else. The flush
// round trip first (same trick as the fixture's teardown) delivers any
// correlated twin event still in transit — e.g. an aborted fetch raises both
// requestfailed and a console error — so the clear cannot slice between the
// pair and leave the twin to fail teardown.
async function flushAndClear(
  page: import("@playwright/test").Page,
  captured: readonly string[]
): Promise<void> {
  await page.evaluate(() => undefined).catch(() => {});
  (captured as string[]).length = 0;
}

test.describe("page-error capture fixture (self-test)", () => {
  test("captures an uncaught page exception", async ({
    page,
    pageErrorCapture,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error("page-errors self-test: injected exception");
      }, 0);
    });
    await expect
      .poll(() =>
        pageErrorCapture.some((e) => e.includes("injected exception"))
      )
      .toBe(true);
    await flushAndClear(page, pageErrorCapture);
  });

  test("captures an unhandled promise rejection", async ({
    page,
    pageErrorCapture,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      void Promise.reject(
        new Error("page-errors self-test: injected rejection")
      );
    });
    await expect
      .poll(() =>
        pageErrorCapture.some((e) => e.includes("injected rejection"))
      )
      .toBe(true);
    await flushAndClear(page, pageErrorCapture);
  });

  test("captures a console.error", async ({ page, pageErrorCapture }) => {
    await page.goto("/");
    await page.evaluate(() => {
      console.error("page-errors self-test: injected console error");
    });
    await expect
      .poll(() =>
        pageErrorCapture.some((e) => e.includes("injected console error"))
      )
      .toBe(true);
    await flushAndClear(page, pageErrorCapture);
  });

  test("does not capture an allowlisted message", async ({
    page,
    pageErrorCapture,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      console.error(
        "allowlist probe at https://static.cloudflareinsights.com/beacon.min.js"
      );
      console.error("page-errors self-test: sentinel after allowlisted");
    });
    // The sentinel arriving proves the console channel processed both
    // messages in order; the allowlisted one must have been filtered out,
    // not merely delayed.
    await expect
      .poll(() =>
        pageErrorCapture.some((e) => e.includes("sentinel after allowlisted"))
      )
      .toBe(true);
    expect(pageErrorCapture.some((e) => e.includes("allowlist probe"))).toBe(
      false
    );
    await flushAndClear(page, pageErrorCapture);
  });

  test("captures a missing audio file (SPA fallback serves non-audio)", async ({
    page,
    pageErrorCapture,
  }) => {
    // Under SPA hosting a missing mp3 returns 200 text/html (index.html
    // fallback), not 404 — verified against vite preview. The fixture flags
    // the wrong content-type, whatever the status.
    await page.goto("/");
    await page.evaluate(() =>
      fetch("/audio/__page-errors-self-test__.mp3").catch(() => undefined)
    );
    await expect
      .poll(() =>
        pageErrorCapture.some((e) =>
          e.includes("__page-errors-self-test__.mp3")
        )
      )
      .toBe(true);
    await flushAndClear(page, pageErrorCapture);
  });

  test("captures a network-failed /audio/ request", async ({
    page,
    pageErrorCapture,
  }) => {
    await page.goto("/");
    await page.route("**/audio/__page-errors-abort__.mp3", (route) =>
      route.abort()
    );
    await page.evaluate(() =>
      fetch("/audio/__page-errors-abort__.mp3").catch(() => undefined)
    );
    await expect
      .poll(() =>
        pageErrorCapture.some((e) => e.includes("__page-errors-abort__.mp3"))
      )
      .toBe(true);
    await flushAndClear(page, pageErrorCapture);
  });

  test("a non-empty capture fails the test at teardown", async ({
    page,
    pageErrorCapture,
  }) => {
    test.fail();
    await page.goto("/");
    await page.evaluate(() => {
      console.error("page-errors self-test: teardown pin");
    });
    // Non-throwing wait: give the entry time to arrive without asserting.
    // Node-side sleep, not page.waitForTimeout — the page-bound wait rejects
    // if the page crashes mid-wait, and test.fail() would invert that into a
    // green run without the teardown assertion ever being exercised.
    // See the header comment for the two directions this case closes.
    const deadline = Date.now() + 3000;
    while (pageErrorCapture.length === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  });
});
