import { defineConfig, devices } from "@playwright/test";
import { PREVIEW_PORT } from "./worktree-ports.ts";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./playwright-output",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html"], ["github"]],
  use: {
    baseURL: `http://localhost:${PREVIEW_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run preview",
    // If `vite preview` cannot bind PREVIEW_PORT (e.g. a parallel
    // worktree already on the same offset, or any other process on
    // the port), it exits with EADDRINUSE — Playwright then times
    // out waiting for this port and reports "server did not start".
    // The underlying EADDRINUSE typically surfaces in the spawned
    // `npm run preview` output rather than in Playwright's own
    // timeout message; check both when this fails.
    port: PREVIEW_PORT,
    reuseExistingServer: false,
  },
});
