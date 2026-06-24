import { beforeEach, describe, expect, it, vi } from "vitest";

let capturedOptions: Record<string, unknown> | undefined;

vi.mock("vite-plugin-pwa", () => ({
  VitePWA: vi.fn((options: Record<string, unknown>) => {
    capturedOptions = options;
    return { name: "vite-plugin-pwa" };
  }),
}));

describe("vite.config.ts PWA update model (#710)", () => {
  beforeEach(() => {
    capturedOptions = undefined;
    vi.resetModules();
  });

  it("uses prompt registration and does not force skipWaiting or clientsClaim", async () => {
    await import("../../vite.config");

    expect(
      capturedOptions,
      "VitePWA was not called, so its options could not be inspected"
    ).toBeDefined();
    expect(capturedOptions!.registerType).toBe("prompt");
    const workbox = capturedOptions!.workbox as Record<string, unknown>;
    expect(workbox).toBeDefined();
    // `not.toBe(true)`, not `toBe(false)`: the contract is that prompt mode must
    // never force-activate; an absent key or an explicit `false` both satisfy it.
    expect(workbox.skipWaiting).not.toBe(true);
    expect(workbox.clientsClaim).not.toBe(true);
  });
});
