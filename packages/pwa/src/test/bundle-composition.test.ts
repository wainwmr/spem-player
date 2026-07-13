import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

// Guards that the LilyPond parser and its Ohm dependency stayed out of the pwa
// runtime after #693 moved the parse to build time. If a future change re-imports
// ohm-js or the grammar into the app, the ~500 ms cold-load parse #693 removed
// would silently return; these checks fail first. Asserted at source + manifest
// level (deterministic, no dependency on a built dist/), which is sufficient: a
// module the runtime never imports cannot reach the production bundle.
describe("pwa bundle composition (#693)", () => {
  it("ohm-js is not a pwa dependency", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps["ohm-js"]).toBeUndefined();
    expect(deps["@ohm-js/cli"]).toBeUndefined();
  });

  it("no pwa source imports ohm-js or the grammar bundle", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name === "test") continue; // tests may reference names in prose
          walk(p);
        } else if (e.name.endsWith(".ts")) {
          const src = readFileSync(p, "utf-8");
          if (/from ["']ohm-js["']|ly-grammar\.ohm-bundle/.test(src)) {
            offenders.push(p);
          }
        }
      }
    };
    walk("src");
    expect(
      offenders,
      `runtime files still import Ohm: ${offenders.join(", ")}`
    ).toEqual([]);
  });
});
