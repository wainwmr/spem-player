import { test as base, expect } from "@playwright/test";

/**
 * Page-error capture fixture (#775).
 *
 * Playwright's default semantics ignore uncaught page exceptions, unhandled
 * rejections, and console errors — none fail a test. That is a false-green
 * channel here: MusicControls updates the asserted UI (the play/pause icon)
 * before firing its events, so an exception in a `music-controls-*` listener
 * silently kills that listener's per-frame updates (dispatchEvent does not
 * propagate listener exceptions), and an exception in the rAF callback kills
 * the playback loop outright — either way every icon assertion stays green.
 * The un-mocked audio load is likewise silent on a 404 or decode failure.
 *
 * Scope: the listeners attach to the per-test `page` fixture only, so popups,
 * pages opened via context.newPage(), and dedicated workers are NOT captured. A
 * spec that opens one must either wire the listeners onto it explicitly, or —
 * when the extra page deliberately produces captured-class errors, as a
 * failure-injection test does (e2e/fouc-fallback.spec.ts injects a stylesheet
 * failure as its premise) — say so in a comment at the open site, and re-attach the
 * channels with a filter rather than dropping them (see doc/TESTING.md). The ROUTES
 * below are registered on the context, not the page, so another page IN THIS CONTEXT
 * does still get them; only the listeners are lost.
 *
 * Service workers are blocked suite-wide (playwright.config.ts
 * `serviceWorkers: "block"`) — an active SW would intercept requests and
 * bypass page-level network events on Chromium, blinding the /audio/ channel.
 *
 * This module wraps `test` with an automatic per-test fixture that collects:
 *
 * - `pageerror` — uncaught exceptions and unhandled rejections in the page;
 * - `console.error` — error-level console messages;
 * - failed `/audio/` requests, and `/audio/` responses that are >=400, or 2xx
 *   without an `audio/*` content-type (SPA hosting serves index.html with 200
 *   for a missing file, so content-type, not status, is the reliable signal;
 *   3xx hops and 304 revalidations are exempt).
 *
 * and fails the test at teardown if any arrived. Every spec imports
 * `test`/`expect` from this module instead of `@playwright/test`.
 *
 * If a spec legitimately produces one of these, add an explicit, commented entry
 * to ALLOWLIST rather than reverting its import: silent suppression is the failure
 * mode this fixture exists to remove. The feedback failure specs drive a path that
 * logs deliberately (#798); their entry is below.
 */

// Substrings of captured messages that are expected and must not fail a test.
// Keep each entry commented with the reason, and narrow enough that only the
// expected message can match it (a URL, or a prefix only one call site emits).
const ALLOWLIST: string[] = [
  // Third-party scripts loaded by index.html are routinely absent or
  // DNS-blocked in test environments (net::ERR_NAME_NOT_RESOLVED); their
  // load failure is environmental, not an app defect. Matched on the URL
  // suffix this fixture appends, so the entries are browser-agnostic.
  // Cloudflare Web Analytics is not listed here: it is intercepted and
  // stubbed below (#822) so its beacon never reaches the network at all.
  "at https://www.googletagmanager.com/",
  "at https://cdnjs.buymeacoffee.com/",
  // The feedback-modal failure specs reject the POST by stubbing window.fetch in
  // the page (never route.abort(), which would make the browser log its own
  // resource error; see doc/TESTING.md). The submit handler then logs the cause
  // (#798) so an unregistered form is distinguishable from a network blip. That
  // log is an expected byproduct of the failure path those specs drive; it is
  // asserted in src/test/feedback.test.ts, not there. Kept to the exact prefix
  // index.ts emits, so a genuinely unexpected console error still fails the test.
  "console.error: Feedback send failed:",
];

// "/audio/" mirrors config.audio_prefix (src/ts/config.ts, value pinned by
// src/test/config.test.ts). If that prefix ever changes — or if hosting ever
// implements SPA fallback by redirecting /audio/ off-path, whose final hop
// this filter would no longer match — update this too, or the audio channel
// guards a dead path silently.
/**
 * True if a captured message is one the ALLOWLIST above expects.
 *
 * Exported so a spec that escapes the fixture (see the Scope note) filters its
 * own re-attached console channel through the SAME list, rather than
 * re-implementing it and diverging. A private copy immediately went out of step
 * with this one: it re-flagged the DNS-blocked third-party script hosts the
 * ALLOWLIST exists to excuse (#801).
 */
export function isAllowlisted(entry: string): boolean {
  return ALLOWLIST.some((allowed) => entry.includes(allowed));
}

function isAudioUrl(url: string): boolean {
  try {
    return new URL(url).pathname.startsWith("/audio/");
  } catch {
    return false;
  }
}

export const test = base.extend<{ pageErrorCapture: readonly string[] }>({
  pageErrorCapture: [
    async ({ page, context }, use) => {
      const captured: string[] = [];
      const record = (entry: string) => {
        if (!isAllowlisted(entry)) {
          captured.push(entry);
        }
      };

      // Stub Cloudflare Web Analytics so its beacon never fires in e2e (#822).
      // Under the preview server the cross-origin RUM POST to
      // cloudflareinsights.com/cdn-cgi/rum is CORS-blocked (ERR_FAILED), which
      // floods console.error and fails otherwise-unrelated tests. Fulfil with
      // an empty 204 rather than abort() so no "Failed to load resource" error
      // is logged — keeping the console-error gate strict with no allowlist.
      // Covers both the static.* script host and the bare RUM endpoint.
      //
      // Registered on the CONTEXT, not the page (#801): a page-scoped route
      // would leave a context.newPage() spec running the real beacon, and the
      // ALLOWLIST above deliberately carries no Cloudflare entry precisely
      // BECAUSE the beacon is stubbed. A spec that wired its own listeners onto
      // an unstubbed page would therefore hit the CORS flood with no allowlist
      // to fall back on. Context scope makes the stub true for every page here,
      // so that trap cannot be sprung.
      await context.route(/cloudflareinsights\.com/, (route) =>
        route.fulfill({ status: 204, body: "" })
      );

      page.on("pageerror", (err) => {
        record(`pageerror: ${err.message}`);
      });
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          // Include the source URL: resource-load failures ("Failed to load
          // resource") carry the failing URL only in location, not the text.
          const loc = msg.location().url;
          record(`console.error: ${msg.text()}${loc ? ` (at ${loc})` : ""}`);
        }
      });
      page.on("requestfailed", (req) => {
        if (!isAudioUrl(req.url())) return;
        const errorText = req.failure()?.errorText ?? "";
        // A load cancelled by a deliberate control change during the audio
        // load window (#805) is a legitimate outcome, not a broken audio path:
        // toggling pause mid-load aborts the in-flight fetch. Webkit surfaces
        // this as a requestfailed with "Load request cancelled" (and a
        // status-0 response, exempted below); chromium/firefox do not report
        // it at all. Exempt cancellations only — genuine failures (the
        // self-test's route.abort() → ERR_FAILED, DNS errors, decode failures)
        // still record. See #830.
        if (/cancel/i.test(errorText)) return;
        record(`audio request failed: ${req.url()} (${errorText})`);
      });
      page.on("response", (res) => {
        if (!isAudioUrl(res.url())) return;
        // A missing audio file does NOT 404 under SPA hosting: vite preview
        // (and Netlify) fall back to index.html with 200 text/html, so the
        // status check alone is blind to the main real-world failure class.
        // A non-audio/* body on a 2xx /audio/ response is wrong; 3xx hops and
        // 304 revalidations legitimately carry no content-type (probe-verified
        // against vite preview, which serves audio with ETag + no-cache) and
        // are exempt — the followed-to or originally-cached response is the
        // one that gets content-type-checked. A status-0 response is a
        // cancelled load (webkit emits one when a control change aborts the
        // in-flight fetch, #805/#830) — a legitimate outcome, exempt like the
        // matching requestfailed above.
        const contentType = res.headers()["content-type"] ?? "";
        if (
          res.status() >= 400 ||
          (res.status() > 0 &&
            res.status() < 300 &&
            !contentType.startsWith("audio/"))
        ) {
          record(
            `audio response ${res.status()} (${contentType || "no content-type"}): ${res.url()}`
          );
        }
      });

      await use(captured);

      // Flush in-transit events before asserting: event delivery from the
      // browser to the Playwright client is asynchronous, and protocol
      // responses are ordered after events already raised on the session, so
      // this no-op round trip delivers any events the browser had already
      // raised. The catch is deliberate — at teardown the page may already
      // be unusable, and a flush failure must not replace the real verdict.
      await page.evaluate(() => undefined).catch(() => {});

      expect(
        captured,
        "errors captured during the test (pageerror / console.error / audio " +
          "request) — see e2e/helpers/page-errors.ts; allowlist only what a " +
          "spec legitimately produces"
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
