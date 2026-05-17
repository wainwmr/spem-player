import { defineConfig } from "vitest/config";
import commonjs from "vite-plugin-commonjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

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
  test: {
    globals: true,
    environment: "jsdom",
    exclude: ["e2e/**", "node_modules/**"],
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
