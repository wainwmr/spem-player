import { defineConfig } from "vitest/config";
import commonjs from "vite-plugin-commonjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
// Per-worktree dev/preview ports. The offset comes from the
// SPEM_PORT_OFFSET env var (default 0); see `worktree-ports.ts`. This
// import never throws — an unset or invalid value falls back to the
// default ports, so config-eval is safe in CI, forks, and clones.
import { DEV_PORT, PREVIEW_PORT } from "./worktree-ports.ts";

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf-8")
);

let branch = process.env.BRANCH || "";
if (!branch) {
  try {
    branch = execSync("git branch --show-current", {
      encoding: "utf-8",
      cwd: __dirname,
    }).trim();
  } catch {
    branch = "";
  }
}
const versionWithBranch =
  branch && branch !== "main" ? `${pkg.version}-${branch}` : pkg.version;

export default defineConfig({
  assetsInclude: ["**/*.ohm", "**/*.ly"],
  server: {
    // Dev tolerates port collisions: `strictPort: false` lets Vite
    // auto-increment from DEV_PORT when running `npm run dev` —
    // human ergonomics, not a test contract.
    port: DEV_PORT,
    strictPort: false,
  },
  preview: {
    // Preview hard-fails on collision. `strictPort: true` is
    // load-bearing: Playwright's `webServer.port` polls the exact
    // PREVIEW_PORT (see playwright.config.ts), so silent
    // auto-increment would test the wrong server. Do NOT relax this
    // to match the dev block — the asymmetry is intentional.
    port: PREVIEW_PORT,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    exclude: ["e2e/**", "node_modules/**"],
    maxWorkers: 4,
    testTimeout: 10000,
    coverage: {
      exclude: [
        "**/*.svg",
        "**/*.scss",
        "**/*.ly",
        "**/ly-grammar.ohm-bundle.js",
        "**/test/**",
        "**/node_modules/**",
      ],
    },
  },

  // Ohmjs doesn't generate ES modules yet so we need to
  // convert the ohm-bundle.js from commonjs to ES modules
  // (npm run ohm)
  plugins: [
    commonjs({
      filter(id) {
        return id.match(/[/]src[/]ohmjs[/]ly-grammar.ohm-bundle.js/) !== null;
      },
    }),
    {
      name: "html-version",
      transformIndexHtml(html) {
        return html
          .replace(/%VERSION%/g, versionWithBranch)
          .replace(/%YEAR%/g, new Date().getFullYear().toString())
          .replace(
            /data-branch="%BRANCH%"/g,
            branch && branch !== "main" ? `data-branch="${branch}"` : ""
          );
      },
    },
  ],
});
