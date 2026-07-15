import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * #829 — pin the two-node structure of the FOUC guard, on every PR.
 *
 * `index.html` carries TWO inline <style> nodes and the difference is load-bearing:
 *
 *   #fouc-guard    hides .viewportDiv, and the fallback script REMOVES this node to
 *                  reveal the app when the bundled stylesheet never arrives (#801).
 *   #fallback-hide keeps #help, #feedback-modal and the tooltips hidden, and the
 *                  fallback must NEVER remove it (#829). style.scss is otherwise the
 *                  only thing hiding those, so without it the failure screen shows an
 *                  expanded help panel, an expanded feedback dialog, and every tooltip
 *                  string inline down the page.
 *
 * "Tidy those two adjacent <style> blocks into one" is the tempting refactor, and it is
 * wrong: the fallback would remove both.
 *
 * e2e/fouc-fallback.spec.ts already catches that — but the e2e suite runs NIGHTLY, not
 * on pull requests (a settled trade: e2e is slow, we accept the lag). So the tidy-up PR
 * would go green, merge, and the regression would surface the following morning. This
 * test runs in the unit suite on every PR and costs milliseconds, which turns a
 * next-morning catch into a same-PR one.
 */
describe("FOUC guard markup (#801/#829)", () => {
  const html = readFileSync(resolve(__dirname, "../../index.html"), "utf-8");

  const styleBlock = (id: string): string => {
    const m = html.match(
      new RegExp(`<style id="${id}">([\\s\\S]*?)</style>`, "i")
    );
    expect(m, `<style id="${id}"> is missing from index.html`).not.toBeNull();
    return m![1];
  };

  it("keeps the guard and the persistent hide as two SEPARATE style nodes", () => {
    // Merge them and the fallback (which removes #fouc-guard by id) takes both.
    expect(html).toContain('<style id="fouc-guard">');
    expect(html).toContain('<style id="fallback-hide">');
  });

  it("puts .viewportDiv in the node the fallback REMOVES", () => {
    expect(styleBlock("fouc-guard")).toMatch(/\.viewportDiv/);
  });

  it("puts the three hidden elements in the node the fallback KEEPS", () => {
    const keep = styleBlock("fallback-hide");
    expect(keep).toMatch(/#help/);
    expect(keep).toMatch(/#feedback-modal/);
    expect(keep).toMatch(/\.tooltiptext/);

    // ...and NOT in the node that gets torn out, or they go with it.
    const removed = styleBlock("fouc-guard");
    expect(removed).not.toMatch(/#help/);
    expect(removed).not.toMatch(/#feedback-modal/);
    expect(removed).not.toMatch(/\.tooltiptext/);
  });

  it("scopes the tooltip mirror to header, exactly as style.scss does", () => {
    // A bare `.tooltiptext` would hide a tooltip placed OUTSIDE <header>, which the
    // header-scoped hover rule in style.scss could then never reveal: permanently
    // invisible, silently. The mirror must not reach further than its source.
    expect(styleBlock("fallback-hide")).toMatch(
      /header\s+\.tooltip\s+\.tooltiptext/
    );
  });

  it("removes the guard node by id, not by clearing its rules", () => {
    // The reveal is `guard.remove()`. If that ever became a style rewrite, it could
    // take the sibling's rules with it.
    expect(html).toMatch(/getElementById\(['"]fouc-guard['"]\)/);
  });
});
