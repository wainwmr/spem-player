import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * #799 — pin the markup half of the third-party-stall fix, on every PR.
 *
 * The fix has two halves. The behavioural half (init() at module scope) is
 * PR-guarded already: src/test/helpers.ts no longer dispatches a synthetic
 * `load` event, so reverting init() to a load listener kills every integration
 * test. The MARKUP half had no PR-time guard at all: the e2e suite that pins it
 * (e2e/third-party-stall.spec.ts) runs nightly, not on pull requests (a settled
 * trade: e2e is slow, we accept the lag). So a PR re-adding the donation
 * vendor's parser-blocking script, or reverting the Cloudflare beacon to
 * `defer`, would go green, merge, and hand the #799 deadlock back to users
 * until the next morning's run. Same reasoning, same shape, same cost as
 * fouc-guard-markup.test.ts: read the source, pin the tags, milliseconds.
 *
 * This is also the order-independent defer-revert guard. The e2e stall test
 * catches a `defer` beacon only while Vite emits the app bundle BELOW the
 * beacon tag (the index.html comment says so itself); this test reads the
 * attribute in the source and does not care where the bundle lands.
 */
describe("third-party markup (#799)", () => {
  const html = readFileSync(resolve(__dirname, "../../index.html"), "utf-8");

  // A comment must not satisfy a PRESENCE pin. Disable-by-comment is an
  // established habit in this file (the unpkg polyfill sits commented out
  // today), and a commented-out beacon, button, or @import is exactly the
  // disabling each presence pin exists to catch — most of all the #839
  // premise pin, whose whole job is to go red when that block changes. The
  // ABSENCE pins keep the raw source deliberately: a commented-out vendor
  // script tripping them is the safe direction.
  const live = html.replace(/<!--[\s\S]*?-->/g, "");

  it("keeps the Cloudflare beacon async, never defer", () => {
    // A `defer` classic script shares one ordered queue with the module
    // scripts, so a stalled beacon emitted ahead of the app bundle holds the
    // whole player behind someone else's server. `async` keeps it out of that
    // queue entirely, whatever the emission order.
    const beaconTag = live.match(/<script[^>]*cloudflareinsights[^>]*>/i);
    expect(
      beaconTag,
      "the Cloudflare beacon script tag is missing"
    ).not.toBeNull();
    expect(beaconTag![0]).toMatch(/\basync\b/);
    expect(beaconTag![0]).not.toMatch(/\bdefer\b/);
  });

  it("references nothing from the donation vendor", () => {
    // #799 removed cdnjs.buymeacoffee.com's parser-blocking, document.writeln
    // embed and shipped what it rendered as our own markup. The page-errors
    // ALLOWLIST entry for the host went with it, deliberately: nothing
    // legitimately produces an error from that host any more. Re-adding the
    // script would resurrect the deadlock this whole ticket removes.
    expect(html).not.toMatch(/buymeacoffee\.com\/[^"']*\.js/i);
    expect(html).not.toMatch(/<script[^>]*buymeacoffee/i);
  });

  it("carries both first-party coffee buttons", () => {
    // One in the help footer, one in the feedback modal. The e2e spec proves
    // they are visible and readable; this pins that they exist at all, so a
    // template tidy-up cannot silently drop one at PR time.
    const anchors = live.match(/<a class="bmc-btn"/g) ?? [];
    expect(anchors).toHaveLength(2);
  });

  it("still imports the Google Fonts stylesheet from a blocking inline style (#839 premise)", () => {
    // e2e/third-party-stall.spec.ts declares its fonts.googleapis.com stall
    // tests `fixme` as a known failure: a pending stylesheet blocks paint and
    // the deferred-script queue, which no script-loading change can reach.
    // That knownFailure entry says "delete this when #839 lands" — but a
    // fixme'd test never runs, so nothing enforces the deletion. THIS does:
    // #839's fix must make the font stylesheet non-blocking, which means this
    // assertion goes red. When it does, delete the knownFailure in
    // e2e/third-party-stall.spec.ts (its three stall tests become #839's
    // regression guard) and then delete this case.
    expect(live).toMatch(
      /<style>[\s\S]{0,400}?@import url\('https:\/\/fonts\.googleapis\.com\/css2/
    );
  });
});
