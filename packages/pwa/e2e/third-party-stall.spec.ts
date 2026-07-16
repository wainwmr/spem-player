import { test, expect } from "./helpers/page-errors";
import type { Page } from "@playwright/test";

// WCAG AA for normal text. The label is 28px, but its wrapper scales it to 0.75, so
// it renders at 21px (0.65 at narrow widths, ~18px, which only lowers it further) and
// does not clear WCAG's 24px large-text threshold. 4.5 is the level that actually
// applies, not a strict reading of a laxer one. The real ratio for #ffffff on #133354
// is about 12.9:1, so there is ample headroom either way.
const MIN_CONTRAST = 4.5;

/**
 * The real WCAG 2.x contrast ratio between an element's text colour and the first
 * opaque background behind it.
 *
 * Deliberately NOT `assertReadableInMode` from ./helpers/computed-style: despite its
 * name, that helper only asserts the two colours are not the *same string*, so text
 * at rgb(18,51,84) on a rgb(19,51,84) background passes it with a real contrast ratio
 * of 1.0012:1. That is exactly the bug this test exists to catch, and the helper waved
 * it through. Tracked as #840, which will move this computation into the helper and
 * have this spec import it back. Until then, do not "simplify" this into it.
 *
 * Two things it refuses to guess at, because guessing is how the first version of this
 * function became the very false-green it was written to remove:
 *
 * - A colour it cannot parse. It reads legacy `rgb()`/`rgba()` only, which is what
 *   browsers serialise computed colours as today. A modern colour function
 *   (`oklch()`, `color(display-p3 ...)`) would have its numbers scraped out and
 *   ranked as nonsense, so it throws instead.
 * - A see-through background. Text usually has none of its own, so a naive read
 *   returns `rgba(0, 0, 0, 0)`, whose first three numbers are *black*. White text
 *   would then measure a perfect 21:1 against a background it does not have. So the
 *   background is composited up the ancestor chain to the first opaque one, which is
 *   also what a human eye does.
 */
async function contrastRatio(page: Page, selector: string): Promise<number> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => {
      type Rgba = { r: number; g: number; b: number; a: number };

      const parse = (colour: string): Rgba => {
        const m = colour
          .trim()
          .match(
            /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/
          );
        if (!m) {
          throw new Error(
            `contrastRatio reads only rgb()/rgba(), and got "${colour}". A modern ` +
              `colour function would be parsed as nonsense, so this refuses rather ` +
              `than return a number it cannot justify.`
          );
        }
        return {
          r: Number(m[1]),
          g: Number(m[2]),
          b: Number(m[3]),
          a: m[4] === undefined ? 1 : Number(m[4]),
        };
      };

      // The first ancestor (self included) that actually paints something behind the
      // text. An element with no background of its own is see-through, not black.
      const backgroundBehind = (start: Element): Rgba => {
        let node: Element | null = start;
        while (node) {
          const colour = parse(getComputedStyle(node).backgroundColor);
          if (colour.a === 1) return colour;
          if (colour.a !== 0) {
            throw new Error(
              `a partly transparent background (${getComputedStyle(node).backgroundColor}) ` +
                `sits behind this text; the true ratio depends on what shows through, ` +
                `which this does not model.`
            );
          }
          node = node.parentElement;
        }
        throw new Error(
          "no opaque background anywhere behind this text, so its contrast is undefined"
        );
      };

      const luminance = ({ r, g, b }: Rgba): number => {
        const [lr, lg, lb] = [r, g, b].map((v) => {
          const channel = v / 255;
          return channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
      };

      const text = parse(getComputedStyle(el).color);
      if (text.a !== 1) {
        throw new Error(
          `the text colour is not opaque (${getComputedStyle(el).color}), so its ` +
            `effective contrast depends on the backdrop, which this does not model.`
        );
      }

      const fg = luminance(text);
      const bg = luminance(backgroundBehind(el));
      const [lighter, darker] = fg > bg ? [fg, bg] : [bg, fg];
      return (lighter + 0.05) / (darker + 0.05);
    });
}

/**
 * #799 — the app's render and interactivity must not depend on third-party hosts.
 *
 * Two mechanisms coupled the app to strangers. A parser-blocking classic script
 * (the donation embed) halted document construction, so the player elements never
 * existed. And `init()` hung off `window load`, which waits for every subresource,
 * so a painted page could still drop every click, key and deep link.
 *
 * Neither is reachable by an ordinary e2e run, which is why they survived so long:
 * in CI these hosts fail *fast* (DNS-blocked) or are stubbed, and a fast failure
 * lets parsing resume, so the app looks healthy. Only a *stall*, someone else's
 * server accepting the connection and then saying nothing, exposes it. The
 * generated tests below therefore hold the host's route open and never answer.
 * (The three hand-written tests at the end do not stall: they pin the donation
 * button, the absence of any parser-blocking classic script, and the
 * completeness of the host list.)
 *
 * `waitUntil: "commit"` is load-bearing IN THE STALL TESTS. Playwright's default
 * (`"load"`) waits for the window load event, which is the very thing this ticket is
 * about, so the navigation would hang rather than test anything.
 * `"domcontentloaded"` is no better: a stalled stylesheet blocks the deferred module
 * scripts, so DOMContentLoaded never fires either, and a regression that
 * reintroduced a parser-blocking script would hang the navigation instead of failing
 * an assertion. `"commit"` assumes no lifecycle event at all, which is exactly the
 * assumption under test. The hand-written tests stall nothing, so they navigate
 * normally and wait for the app, which is what lets them read computed styles and
 * press keys safely.
 */

/** A tracked, still-open defect: the ticket AND why this host in particular fails. */
type KnownFailure = {
  readonly ticket: number;
  /** Why THIS host's stall is not fixed. Never assume one host's reason fits another. */
  readonly why: string;
};

type ThirdPartyHost = {
  /**
   * The hostname. Also the test title, deliberately: a separate display name could
   * disagree with the host it claims to describe, and a test titled for one host
   * while stalling another is the confidently-mislabelled failure this file exists
   * to stamp out.
   */
  readonly host: string;
  /**
   * Set when this host's stall is a known, still-open failure. Its tests run as
   * `fixme`: declared, not deleted, so the suite states what it does not cover.
   */
  readonly knownFailure?: KnownFailure;
};

// The third-party hosts index.html references directly. The completeness of this
// list is itself tested, at the bottom of this file, because a spec that silently
// under-covers is worse than one that admits a gap.
const THIRD_PARTY_HOSTS: readonly ThirdPartyHost[] = [
  {
    host: "fonts.googleapis.com",
    knownFailure: {
      ticket: 839,
      why:
        "it is a STYLESHEET, not a script. A stylesheet that is still loading blocks " +
        "PAINT, and the deferred-script queue waits on it too, so the app's module " +
        "never executes and init() cannot run wherever it is put. That much no change " +
        "to script loading can reach. On top of it, and contingently, the parser also " +
        "halts at the first inline script BELOW the pending stylesheet (the gtag " +
        "config block, which sits ahead of every player element; the FOUC-fallback " +
        "script sits above the @import and runs before it can block), so the elements " +
        "are never even built; move that block and this leg goes away while the other " +
        "two remain. #839 makes the font stylesheet non-blocking. Delete this " +
        "knownFailure when it lands (src/test/third-party-markup.test.ts's premise " +
        "pin goes red to remind you), and these three cases become its regression " +
        "guard",
    },
  },
  { host: "googletagmanager.com" },
  { host: "cloudflareinsights.com" },
  // cdnjs.buymeacoffee.com is deliberately NOT here. #799 removed the donation
  // vendor's script from the page, so stalling that host would prove nothing: the
  // page never calls it. Its absence is guarded directly, and twice, by the tests at
  // the bottom of this file. Re-adding the vendor script fails both.
  //
  // fonts.gstatic.com is not here either, and that IS a gap worth naming. The font
  // FILES come from it, referenced from inside the fonts.googleapis.com stylesheet
  // rather than from our HTML, so the completeness check below (which reads the
  // served markup) structurally cannot see it. A stalled font file blocks neither
  // script execution nor paint, because the @import carries display=swap, so it is
  // not a #799 deadlock. It belongs to #839's territory.
];

/**
 * Does this URL belong to the host? Matched on the parsed HOSTNAME, not as a
 * substring of the whole URL, and used by both the router and the completeness check
 * so the two cannot disagree about what "this host" means.
 *
 * An empty or over-broad entry would otherwise stall the app's own origin, and every
 * test in this file would hang or pass vacuously. `""` is refused explicitly: WHATWG
 * URL preserves a trailing dot in a hostname, so `endsWith(".")` alone would let an
 * empty entry match one (and an empty entry also trips the completeness check below).
 */
function matchesHost(hostname: string, host: ThirdPartyHost): boolean {
  return (
    host.host !== "" &&
    (hostname === host.host || hostname.endsWith(`.${host.host}`))
  );
}

/**
 * Mark a host's tests `fixme` while its stall is a known open defect. The reason
 * travels with the ticket, so a second known-failing host cannot inherit the first
 * one's explanation.
 */
function fixmeIfKnownFailure(host: ThirdPartyHost): void {
  const known = host.knownFailure;
  if (!known) return;
  test.fixme(true, `known failure, tracked as #${known.ticket}: ${known.why}`);
}

/**
 * Hold every request to this host open forever: accept the route and never fulfil,
 * continue, or abort it. This reproduces a slow host, which is the failure this
 * ticket is about, rather than an unreachable one, which the app already survives.
 *
 * Registered inside the test on the PAGE, so it takes precedence over the Cloudflare
 * stub the page-errors fixture installs on the CONTEXT: page routes are consulted
 * before context routes, whatever the registration order (within one scope, the
 * last-registered route wins). That coupling is worth knowing: if a
 * pending stalled request ever starts producing a console error, the fixture will
 * fail the test at teardown for an environmental reason.
 */
async function stall(page: Page, host: ThirdPartyHost): Promise<void> {
  await page.route(
    (url) => matchesHost(url.hostname, host),
    () => new Promise(() => {})
  );
}

test.describe("third-party script stalls do not gate render or interactivity (#799)", () => {
  for (const host of THIRD_PARTY_HOSTS) {
    // Grouped per host, with the fixme in a beforeEach rather than repeated in each
    // test. A fourth test added to this group would otherwise inherit the stall but
    // not the fixme, and on a known-failing host it would HANG rather than fail.
    test.describe(host.host, () => {
      test.beforeEach(() => fixmeIfKnownFailure(host));

      test(`player renders while ${host.host} is stalled`, async ({ page }) => {
        await stall(page, host);

        await page.goto("/", { waitUntil: "commit" });

        // The DOM is constructed: a parser-blocking third-party script would have
        // halted document construction before these elements existed. On their own
        // these three assert only that the static markup parsed, which needs no
        // JavaScript at all, so they cannot be the whole test.
        await expect(page.locator("music-score")).toBeAttached();
        await expect(page.locator("music-canvas")).toBeAttached();
        await expect(page.locator("music-controls")).toBeAttached();

        // The elements were also UPGRADED, which means the app's module executed.
        // `:defined` is the honest probe. Do not swap it for toBeVisible(): an
        // un-upgraded <music-controls> is empty and `display: flex` with no
        // min-height, so it happens to have a zero-size box today and reads as
        // invisible. Give it a min-height in the stylesheet, as its two siblings
        // already have, and a visibility assertion would go green on a dead page.
        await expect(page.locator("music-controls:defined")).toBeAttached();

        // And it paints: the app's own stylesheet loaded and lifted the inline
        // .viewportDiv FOUC guard.
        await expect(page.locator("music-controls")).toBeVisible();
      });

      test(`controls respond while ${host.host} is stalled`, async ({
        page,
      }) => {
        await stall(page, host);

        await page.goto("/", { waitUntil: "commit" });

        const controls = page.locator("music-controls");
        await expect(controls).toBeAttached();

        // This is the line that makes the whole file non-vacuous, so protect it.
        // <music-controls> carries no attributes in index.html; `choir` is written
        // only by parseURL() inside init(). So this is a true "init() ran" probe,
        // not merely an "element upgraded" one. A painted-but-dead page passes every
        // visibility assertion and fails this, which is the entire defect.
        await expect(controls).toHaveAttribute("choir", "0");
        await page.keyboard.press("4");
        await expect(controls).toHaveAttribute("choir", "3");

        // Click: the header switches are wired by init() too. (The pre-click
        // assertion is a precondition, not a guard: dark is the default, so a dead
        // page would pass it too. The post-click one is what bites.)
        await expect(page.locator("body")).not.toHaveClass(/light-theme/);
        await page.locator("#darkswitch").click();
        await expect(page.locator("body")).toHaveClass(/light-theme/);
      });

      test(`deep-link params apply while ${host.host} is stalled`, async ({
        page,
      }) => {
        await stall(page, host);

        // parseURL() runs inside init(), so a shared deep link paints the wrong
        // state for as long as the slowest host takes to settle.
        await page.goto("/?choir=3&part=2&bar=10", { waitUntil: "commit" });

        const controls = page.locator("music-controls");
        await expect(controls).toHaveAttribute("choir", "3");
        await expect(controls).toHaveAttribute("part", "2");
        await expect(controls).toHaveAttribute("bar", "10");
      });
    });
  }

  test("the coffee button is our own markup, and the donation host is never fetched", async ({
    page,
  }) => {
    // The donation button used to come from a vendor script, and that script could
    // not be made non-blocking: it renders with `document.writeln`, which the browser
    // discards from any script that is not parser-inserted. So `async` deleted the
    // button outright, and silently, because the discarded write is a console
    // *warning* and nothing here records those; `defer` would have done the same.
    // Parser-blocking was the only mode it worked in, and a parser-blocking script
    // ahead of the player markup is precisely the defect #799 exists to remove.
    //
    // What it rendered was an anchor, a Cookie webfont link, and the CSS to style
    // them. We now supply all three ourselves (the markup here, the @import in
    // index.html, and .bmc-btn in style.scss), so the donation host has left the page
    // entirely. This test pins both halves: the button is really there and really
    // readable, and nothing is ever fetched from the vendor.
    const donationRequests: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("buymeacoffee.com")) donationRequests.push(r.url());
    });

    await page.goto("/");

    // Gate on the app actually running before reading a computed style or pressing a
    // key. Everything below would otherwise be satisfied by static markup with no CSS
    // and no JavaScript: the colours would read as an unstyled UA link, and a keypress
    // would land before init() had bound the keydown listener.
    await expect(page.locator("music-controls:defined")).toBeAttached();
    await expect(page.locator("music-controls")).toHaveAttribute("choir", "0");

    // One button per wrapper: the help footer and the feedback modal.
    const buttons = page.locator(".bmc-wrapper .bmc-btn");
    await expect(buttons).toHaveCount(2);
    for (const button of await buttons.all()) {
      await expect(button).toHaveAttribute(
        "href",
        "https://buymeacoffee.com/wainwmr"
      );
      // Reverse-tabnabbing guard on a target="_blank" link. Modern browsers imply it,
      // but the markup is ours now and says so.
      await expect(button).toHaveAttribute("rel", "noopener");
    }

    // Visible is not the same as READABLE, and the difference is not academic here:
    // the first cut of this button drew its label in the help panel's link colour,
    // which is the same dark blue as the button's own background. It was perfectly
    // "visible" and utterly unreadable, and only an eyeball caught it.
    //
    // BOTH buttons are measured. A container rule (`#help a`) outranks a bare
    // `.bmc-btn` class rule on specificity, and #feedback-modal is exactly such a
    // container too, so guarding one and not the other would leave the same bug a
    // home. And the LABEL is measured, not the anchor: the visible text is painted by
    // <span class="bmc-btn-text">, so a rule reaching the span would recolour it while
    // the anchor's own `color` stayed white.
    const labels = ["#help", "#feedback-modal"].map(
      (panel) => `${panel} .bmc-btn .bmc-btn-text`
    );

    for (const label of labels) {
      expect(
        await contrastRatio(page, label),
        `the coffee button's label is unreadable in ${label} (dark theme)`
      ).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }

    // And in light mode. The button's own colours are fixed, but the rule that
    // hijacked them uses --color-on-light, which stays dark in light mode too.
    await page.keyboard.press("d");
    await expect(page.locator("body")).toHaveClass(/light-theme/);
    for (const label of labels) {
      expect(
        await contrastRatio(page, label),
        `the coffee button's label is unreadable in ${label} (light theme)`
      ).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }
    await page.keyboard.press("d");
    await expect(page.locator("body")).not.toHaveClass(/light-theme/);

    // And it is genuinely visible to a user who opens the help panel, rather than
    // merely present in a hidden subtree.
    await page.locator("#info").click();
    await expect(page.locator("#help .bmc-btn")).toBeVisible();

    // The modal's twin too, and for the same reason: getComputedStyle happily
    // returns colours inside a display:none subtree, so the contrast loop above
    // passes on a hidden button. Only an open-and-look catches a collapsed
    // .bmc-wrapper or a stray display rule scoped to the modal. The open help
    // panel raised #backdrop over the header, so close it first, as a user
    // would, by clicking the backdrop.
    await page.locator("#backdrop").click();
    await expect(page.locator("#help .bmc-btn")).not.toBeVisible();
    await page.locator("#feedback-trigger").click();
    await expect(page.locator("#feedback-modal .bmc-btn")).toBeVisible();

    // Wait for the page to finish loading before ruling on what was requested, so a
    // late fetch cannot slip in after the last assertion resolved.
    await page.waitForLoadState("load");
    expect(
      donationRequests,
      "the page must not fetch anything from the donation vendor: the button is our own markup"
    ).toEqual([]);
  });

  test("no parser-blocking classic script sits on the page", async ({
    page,
  }) => {
    // The host list guards the hosts we know about. THIS guards the defect class
    // itself, and it cannot rot: a parser-blocking classic script anywhere halts
    // document construction, whoever serves it, and an unbuilt player is the worse
    // half of #799. A same-origin one, or one on a host already in the list, would
    // walk straight past every other test in this file.
    //
    // Module scripts are deferred by definition and so are exempt. The gtag config
    // block is inline and has no src, so it is not matched here; it IS a real parser
    // barrier, but only while a stylesheet is pending, which is #839.
    //
    // Read from the live DOM, so a script inserted at runtime (async by IDL
    // default, usually with no attribute) can be flagged on a networked dev run
    // where gtag.js actually loads and injects. Accepted: the false positive is
    // loud, CI is DNS-blocked so nothing injects there, and reading the live DOM
    // keeps the probe honest about everything the parser really saw.
    await page.goto("/");

    const blocking = await page.$$eval(
      "script[src]:not([type='module']):not([async]):not([defer])",
      (scripts) => scripts.map((s) => s.getAttribute("src"))
    );

    expect(
      blocking,
      "a parser-blocking classic script is back on the page, which is the #799 deadlock"
    ).toEqual([]);

    // The beacon must also still be async, asserted on its attributes directly.
    // The stall tests above catch a defer revert only while Vite emits the app
    // bundle BELOW the beacon tag (the index.html comment admits the
    // contingency); this check does not care where the bundle lands. Twinned
    // with src/test/third-party-markup.test.ts, which pins the same attribute
    // in the source at PR time.
    const beacon = await page.$eval(
      'script[src*="cloudflareinsights"]',
      (s) => ({ async: s.hasAttribute("async"), defer: s.hasAttribute("defer") })
    );
    expect(
      beacon,
      "the Cloudflare beacon must stay async: as defer it rejoins the ordered " +
        "queue the app's module scripts wait in"
    ).toEqual({ async: true, defer: false });
  });

  test("every third-party host NAMED in the served page is covered above", async ({
    page,
  }) => {
    // The value of this file is that it is COMPLETE, and completeness left to a
    // comment rots the first time someone adds an embed. So the list checks itself
    // against the page.
    //
    // Scope, stated honestly: this reads the hosts NAMED in the served markup. A host
    // reached transitively (fonts.gstatic.com, referenced from inside the Google Fonts
    // stylesheet) is invisible to it, which is why that one is called out in
    // THIRD_PARTY_HOSTS rather than silently missing.
    await page.goto("/");

    // Wait for the app before scraping. A bare `commit` would resolve while the
    // document is still only <head>: the inline gtag script is a parser barrier that
    // waits on the font stylesheet. The body is where the donation embeds lived, so a
    // scrape taken too early is blind at the exact site of the defect, and it fails
    // OPEN, because finding fewer tags means finding nothing uncovered.
    await expect(page.locator("music-controls:defined")).toBeAttached();

    const referenced: string[] = await page.evaluate(() => {
      const urls = new Set<string>();
      for (const el of document.querySelectorAll("script[src], link[href]")) {
        const url = el.getAttribute("src") ?? el.getAttribute("href");
        if (url) urls.add(url);
      }
      // The font @import lives inside an inline <style>, not on an element.
      for (const style of document.querySelectorAll("style")) {
        for (const m of (style.textContent ?? "").matchAll(
          /url\(['"]?([^'")]+)/g
        )) {
          urls.add(m[1]);
        }
      }
      return [...urls];
    });

    // Resolved against the document, so a protocol-relative URL (//unpkg.com/...) is
    // not silently skipped by an http-only filter. Anything off our own origin is
    // third-party. A URL that will not parse is NOT silently dropped: a mangled
    // third-party reference would otherwise vanish from coverage accounting, which
    // is the blindness this test exists to prevent.
    const ourHostname = new URL(page.url()).hostname;
    const unparseable: string[] = [];
    const externalHosts = [
      ...new Set(
        referenced
          .map((u) => {
            try {
              return new URL(u, page.url()).hostname;
            } catch {
              unparseable.push(u);
              return "";
            }
          })
          .filter((h) => h && h !== ourHostname)
      ),
    ];
    expect(
      unparseable,
      "a referenced URL could not be parsed, so its host escaped coverage " +
        "accounting entirely; fix the reference or the scrape"
    ).toEqual([]);

    const uncovered = externalHosts.filter(
      (h) => !THIRD_PARTY_HOSTS.some((known) => matchesHost(h, known))
    );
    expect(
      uncovered,
      "a third-party host is named in the page but is not in THIRD_PARTY_HOSTS, so " +
        "nothing here proves the app survives its stall. Add it to the list rather " +
        "than deleting this assertion."
    ).toEqual([]);

    // And the converse, which is what stops this test passing on an empty read. If the
    // scrape ever goes blind (a selector change, the @import moving into the compiled
    // CSS), `uncovered` would be [] and the test would go green while proving nothing.
    // Requiring every listed host to be FOUND makes that fail loudly. It also catches a
    // list entry left behind after its host has left the page, which is a test that
    // stalls nothing and claims coverage.
    const listedButNotFound = THIRD_PARTY_HOSTS.filter(
      (known) => !externalHosts.some((h) => matchesHost(h, known))
    ).map((known) => known.host);
    expect(
      listedButNotFound,
      "a host in THIRD_PARTY_HOSTS was not found in the served page. Either the page " +
        "stopped using it (remove it: stalling a host the page never calls proves " +
        "nothing), or this scrape has gone blind (fix the scrape)."
    ).toEqual([]);
  });
});
