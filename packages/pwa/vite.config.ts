import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
// Per-worktree dev/preview ports. The offset comes from the
// SPEM_PORT_OFFSET env var (default 0); see `worktree-ports.ts`. This
// import never throws — an unset or invalid value falls back to the
// default ports, so config-eval is safe in CI, forks, and clones.
import { DEV_PORT, PREVIEW_PORT } from "./worktree-ports.ts";
import { escapeHtml } from "./src/ts/escapeHtml";

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
  resolve: {
    alias: {
      // The PWA consumes the precomputed note data (lilyData.json) and the
      // loader/types from the sibling @spem/scores package (#693). We resolve it
      // with this build-time alias rather than a tracked symlink: a git symlink
      // checks out as a plain text file on Windows (core.symlinks = false by
      // default), which breaks Vite resolution and the PWA test suite there. The
      // alias resolves identically on every OS with no per-clone setup.
      "@scores": resolve(__dirname, "../scores/src"),
    },
  },
  server: {
    // Dev tolerates port collisions: `strictPort: false` lets Vite
    // auto-increment from DEV_PORT when running `npm run dev` —
    // human ergonomics, not a test contract.
    port: DEV_PORT,
    strictPort: false,
    fs: {
      // Allow serving files from outside the PWA package: the precomputed data
      // resolved via the @scores alias (see resolve.alias) lives in the sibling
      // @spem/scores package.
      allow: ["..", "../.."],
    },
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
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    maxWorkers: 4,
    testTimeout: 10000,
    coverage: {
      exclude: [
        "**/*.svg",
        "**/*.scss",
        "**/test/**",
        "**/node_modules/**",
      ],
    },
  },

  plugins: [
    {
      name: "html-version",
      transformIndexHtml(html) {
        return html
          .replace(/%VERSION%/g, escapeHtml(versionWithBranch))
          .replace(/%YEAR%/g, new Date().getFullYear().toString())
          .replace(
            /data-branch="%BRANCH%"/g,
            branch && branch !== "main"
              ? `data-branch="${escapeHtml(branch)}"`
              : ""
          );
      },
    },
    {
      name: "manifest-version",
      writeBundle() {
        const manifestPath = resolve(__dirname, "dist", "site.webmanifest");
        const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        manifest.version = versionWithBranch;
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
      },
    },
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      manifest: false,
      useCredentials: true,
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\.(mp3|ogg|wav)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "audio-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
              matchOptions: { ignoreSearch: true },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-static",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Precache the app shell but NOT the audio files.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json,webmanifest}"],
        navigateFallback: "index.html",
        // Must stay false. `registerType: "prompt"` (above) plus the update
        // toast in src/ts/pwa-update.ts give the user control over when a new
        // service worker activates (the Refresh click calls updateSW(true),
        // which does the skip-waiting handshake). `true` here are the
        // autoUpdate-recipe defaults: they would silently self-activate and
        // claim open tabs, defeating the prompt model (#710). Do not restore.
        clientsClaim: false,
        skipWaiting: false,
      },
    }),
  ],
});
