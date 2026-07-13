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
 * Scope: listeners attach to the per-test `page` fixture only. Popups, pages
 * opened via context.newPage(), and dedicated workers are NOT captured. No
 * spec opens any of these today; a spec that does must wire its extra pages
 * explicitly. Service workers are blocked suite-wide (playwright.config.ts
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
 * If a spec ever legitimately produces one of these (none does today), add an
 * explicit, commented entry to ALLOWLIST rather than reverting its import —
 * silent suppression is the failure mode this fixture exists to remove.
 */

// Substrings of captured messages that are expected and must not fail a test.
// Keep each entry commented with the reason and keep it as narrow as the URL.
const ALLOWLIST: string[] = [
  // Third-party scripts loaded by index.html are routinely absent or
  // DNS-blocked in test environments (net::ERR_NAME_NOT_RESOLVED); their
  // load failure is environmental, not an app defect. Matched on the URL
  // suffix this fixture appends, so the entries are browser-agnostic.
  "at https://static.cloudflareinsights.com/",
  "at https://www.googletagmanager.com/",
  "at https://cdnjs.buymeacoffee.com/",
];

// "/audio/" mirrors config.audio_prefix (src/ts/config.ts, value pinned by
// src/test/config.test.ts). If that prefix ever changes — or if hosting ever
// implements SPA fallback by redirecting /audio/ off-path, whose final hop
// this filter would no longer match — update this too, or the audio channel
// guards a dead path silently.
function isAudioUrl(url: string): boolean {
  try {
    return new URL(url).pathname.startsWith("/audio/");
  } catch {
    return false;
  }
}

export const test = base.extend<{ pageErrorCapture: readonly string[] }>({
  pageErrorCapture: [
    async ({ page }, use) => {
      const captured: string[] = [];
      const record = (entry: string) => {
        if (!ALLOWLIST.some((allowed) => entry.includes(allowed))) {
          captured.push(entry);
        }
      };

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
        if (isAudioUrl(req.url())) {
          record(
            `audio request failed: ${req.url()} (${req.failure()?.errorText})`
          );
        }
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
        // one that gets content-type-checked.
        const contentType = res.headers()["content-type"] ?? "";
        if (
          res.status() >= 400 ||
          (res.status() < 300 && !contentType.startsWith("audio/"))
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
