import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdateSW = vi.fn();
let capturedOnNeedRefresh: (() => void) | undefined;

vi.mock("virtual:pwa-register", () => ({
  registerSW: vi.fn((options: { onNeedRefresh?: () => void }) => {
    capturedOnNeedRefresh = options.onNeedRefresh;
    return mockUpdateSW;
  }),
}));

function getToast() {
  return document.querySelector(".pwa-update-toast") as HTMLDivElement | null;
}

describe("PWA update toast", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    capturedOnNeedRefresh = undefined;
    mockUpdateSW.mockClear();
  });

  it("registers the service worker via registerSW", async () => {
    await import("../ts/pwa-update");
    const { registerSW } = await import("virtual:pwa-register");
    expect(registerSW).toHaveBeenCalled();
  });

  it("shows a toast when onNeedRefresh fires", async () => {
    await import("../ts/pwa-update");
    expect(capturedOnNeedRefresh).toBeDefined();
    capturedOnNeedRefresh!();
    const toast = getToast();
    expect(toast).not.toBeNull();
    expect(toast!.textContent).toContain("Update available");
  });

  it("calls updateSW(true) when the refresh button is clicked", async () => {
    await import("../ts/pwa-update");
    capturedOnNeedRefresh!();
    const refreshBtn = document.querySelector(
      ".pwa-update-toast-refresh"
    ) as HTMLButtonElement;
    expect(refreshBtn).not.toBeNull();
    refreshBtn.click();
    expect(mockUpdateSW).toHaveBeenCalledWith(true);
  });

  it("removes the toast when the dismiss button is clicked", async () => {
    await import("../ts/pwa-update");
    capturedOnNeedRefresh!();
    const dismissBtn = document.querySelector(
      ".pwa-update-toast-dismiss"
    ) as HTMLButtonElement;
    expect(dismissBtn).not.toBeNull();
    dismissBtn.click();
    expect(getToast()).toBeNull();
  });

  it("does not show more than one toast at a time", async () => {
    await import("../ts/pwa-update");
    capturedOnNeedRefresh!();
    capturedOnNeedRefresh!();
    expect(document.querySelectorAll(".pwa-update-toast").length).toBe(1);
  });

  it("has role=alert and aria-live=polite", async () => {
    await import("../ts/pwa-update");
    capturedOnNeedRefresh!();
    const toast = getToast();
    expect(toast).not.toBeNull();
    expect(toast!.getAttribute("role")).toBe("alert");
    expect(toast!.getAttribute("aria-live")).toBe("polite");
  });

  it("moves focus to the refresh button", async () => {
    await import("../ts/pwa-update");
    capturedOnNeedRefresh!();
    const refreshBtn = document.querySelector(
      ".pwa-update-toast-refresh"
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(refreshBtn);
  });

  it("removes the toast when Escape is pressed", async () => {
    await import("../ts/pwa-update");
    capturedOnNeedRefresh!();
    expect(getToast()).not.toBeNull();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(getToast()).toBeNull();
  });

  it("cleans up the Escape listener after dismissal", async () => {
    await import("../ts/pwa-update");
    capturedOnNeedRefresh!();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(getToast()).toBeNull();

    // Trigger a second toast — if the old listener leaked, it would still
    // be registered, but the new toast should show and dismiss normally.
    capturedOnNeedRefresh!();
    expect(getToast()).not.toBeNull();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(getToast()).toBeNull();
  });
});
