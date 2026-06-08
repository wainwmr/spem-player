import { beforeEach, describe, expect, it, vi } from "vitest";

const minimalHtml = `
  <div class="split-container">
    <music-score></music-score>
    <div class="splitter"></div>
    <music-canvas></music-canvas>
  </div>
  <music-controls></music-controls>
  <div id="backdrop"></div>
  <div id="help"></div>
  <span id="info">
    <span id="help-icon"></span>
  </span>
  <span id="feedback-trigger">
    <span id="feedback-icon"></span>
  </span>
  <div id="feedback-modal">
    <form id="feedback-form">
      <textarea id="feedback-message"></textarea>
      <button type="button" id="feedback-cancel">Cancel</button>
    </form>
    <div id="feedback-result"></div>
  </div>
  <form name="feedback" hidden>
    <input type="hidden" name="context" />
    <input type="number" name="rating" />
    <textarea name="message"></textarea>
  </form>
  <span id="darkswitch"></span>
  <span id="scoreswitch"></span>
  <span id="recordingswitch"></span>
  <span id="recordinglabel"></span>
`;

describe("PWA service worker registration", () => {
  let loadHandlers: Array<() => void> = [];
  let mockRegistration: {
    scope: string;
    addEventListener: ReturnType<typeof vi.fn>;
    installing: {
      addEventListener: ReturnType<typeof vi.fn>;
      state: string;
    } | null;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    document.body.innerHTML = minimalHtml;
    loadHandlers = [];

    const originalAddEventListener = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === "load" && typeof handler === "function") {
          loadHandlers.push(handler as () => void);
        } else {
          originalAddEventListener(event, handler);
        }
      }
    );

    mockRegistration = {
      scope: "/",
      addEventListener: vi.fn(),
      installing: null,
      update: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers the service worker on load when supported", async () => {
    const register = vi.fn().mockResolvedValue(mockRegistration);
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
      writable: true,
    });

    await import("../../index.ts");
    expect(loadHandlers.length).toBeGreaterThanOrEqual(1);
    loadHandlers.forEach((h) => h());
    await new Promise((r) => setTimeout(r, 0));

    expect(register).toHaveBeenCalledWith("/sw.js");
    expect(console.log).toHaveBeenCalledWith(
      "SW registered:",
      expect.any(String)
    );
  });

  it("warns when service worker registration fails", async () => {
    const register = vi.fn().mockRejectedValue(new Error("SecurityError"));
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
      writable: true,
    });

    await import("../../index.ts");
    loadHandlers.forEach((h) => h());
    await new Promise((r) => setTimeout(r, 0));

    expect(console.warn).toHaveBeenCalledWith(
      "SW registration failed:",
      expect.any(Error)
    );
  });

  it("does nothing when service worker is not supported", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    await expect(import("../../index.ts")).resolves.toBeDefined();
    // When SW is not supported, no register() call should be attempted
    // (the load handlers still include init(), but no SW registration)
    expect(loadHandlers.length).toBeGreaterThanOrEqual(1);
  });

  it("logs when a new service worker is installed and waiting", async () => {
    const stateHandlers: Array<() => void> = [];
    const installingWorker = {
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "statechange") stateHandlers.push(handler);
      }),
      state: "installing",
    };
    mockRegistration.installing = installingWorker;
    mockRegistration.addEventListener = vi.fn(
      (event: string, handler: () => void) => {
        if (event === "updatefound") {
          setTimeout(handler, 0);
        }
      }
    );

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        controller: {},
      },
      configurable: true,
      writable: true,
    });

    await import("../../index.ts");
    loadHandlers.forEach((h) => h());
    await new Promise((r) => setTimeout(r, 10));

    // Simulate state transition to installed
    installingWorker.state = "installed";
    stateHandlers.forEach((h) => h());
    await new Promise((r) => setTimeout(r, 0));

    expect(console.log).toHaveBeenCalledWith(
      "New version available; reload to update."
    );
  });
});
