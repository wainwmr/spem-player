import { describe, it, expect, beforeAll, vi } from "vitest";
import { MusicControls } from "../ts/MusicControls";

describe("Space bar play/pause", () => {
  beforeAll(async () => {
    vi.resetModules();

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
    if (!HTMLElement.prototype.scrollTo) {
      HTMLElement.prototype.scrollTo = () => {};
    }

    document.body.innerHTML = `
      <div class="viewportDiv">
        <div id="backdrop"></div>
        <header class="header">
          <span class="title">Spem Player</span>
          <span id="info" class="tooltip"><span id="help-icon"></span></span>
          <div class="header-spacer"></div>
          <span id="recordinglabel"></span>
          <span id="recordingswitch"></span>
          <span id="scoreswitch"></span>
          <span id="darkswitch"></span>
        </header>
        <div id="help"></div>
        <div class="split-container">
          <music-score></music-score>
          <div class="splitter"></div>
          <music-canvas></music-canvas>
        </div>
        <div class="footer">
          <music-controls></music-controls>
          <music-canvas-watcher class="hide"></music-canvas-watcher>
        </div>
      </div>
    `;

    await import("../ts/MusicCanvas");
    await import("../ts/MusicScore");
    await import("../ts/MusicControls");
    await import("../ts/MusicCanvasWatcher");

    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockReturnThis();

    await import("../../index.ts");
    window.dispatchEvent(new Event("load"));
  }, 30000);

  afterAll(async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    if (controls) controls.pause();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    vi.restoreAllMocks();
  });

  it("Space toggles play/pause when focus is on the document body", async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    controls.playing = false;

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(controls.isPlaying()).toBe(true);

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(controls.isPlaying()).toBe(false);
  });

  it("Space does not toggle play/pause when an input element is focused", () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const input = document.createElement("input");
    document.body.appendChild(input);

    controls.playing = false;
    input.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    expect(controls.isPlaying()).toBe(false);

    document.body.removeChild(input);
  });

  it("Space does not toggle play/pause when a select element is focused", () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const select = document.createElement("select");
    document.body.appendChild(select);

    controls.playing = false;
    select.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    expect(controls.isPlaying()).toBe(false);

    document.body.removeChild(select);
  });

  it("Space does not toggle play/pause when a textarea is focused", () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    controls.playing = false;
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    expect(controls.isPlaying()).toBe(false);

    document.body.removeChild(textarea);
  });

  it("Digit2 in bar input does not change choir (#182)", async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    bar.focus();
    bar.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Digit2", key: "2", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(controls.getAttribute("choir")).toBe("0");
  });

  it("KeyD in choir select does not toggle dark mode (#182)", async () => {
    const select = document.getElementById("choir-select") as HTMLSelectElement;
    select.focus();
    const wasLight = document.body.classList.contains("light-theme");
    select.dispatchEvent(
      new KeyboardEvent("keydown", { code: "KeyD", key: "d", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.classList.contains("light-theme")).toBe(wasLight);
  });

  it("KeyD in textarea does not toggle dark mode (#175)", async () => {
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();
    const wasLight = document.body.classList.contains("light-theme");
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { code: "KeyD", key: "d", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.classList.contains("light-theme")).toBe(wasLight);
    document.body.removeChild(textarea);
  });

  it("Digit2 in textarea does not change choir (#175)", async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Digit2", key: "2", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(controls.getAttribute("choir")).toBe("0");
    document.body.removeChild(textarea);
  });

  describe("Keyboard event swallowing for iPad page-wiggle", () => {
    // Behavioural assertion via `defaultPrevented`, not by spying on
    // `preventDefault()`. The browser only cares whether the default was
    // actually prevented — that's the user-visible contract.
    function dispatchKeydown(
      target: EventTarget,
      init: KeyboardEventInit
    ): KeyboardEvent {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ...init,
      });
      target.dispatchEvent(event);
      return event;
    }

    // -- positive cases: scroll-causing keys are preventDefault'd --
    it.each([
      ["Space"],
      ["ArrowUp"],
      ["ArrowDown"],
      ["ArrowLeft"],
      ["ArrowRight"],
    ])(
      "preventDefaults %s on document body (iPad scroll prevention)",
      (code) => {
        expect(dispatchKeydown(document.body, { code }).defaultPrevented).toBe(
          true
        );
      }
    );

    // Cmd/Ctrl+Arrow is the "seek-by-section" handler — must preventDefault
    // so the OS shortcut (macOS Cmd+Arrow jump-word; on iPad, Cmd is the
    // modifier users press) doesn't fire.
    it.each([["ArrowLeft"], ["ArrowRight"]])(
      "preventDefaults Ctrl+%s (app handles section seek)",
      (code) => {
        expect(
          dispatchKeydown(document.body, { code, ctrlKey: true })
            .defaultPrevented
        ).toBe(true);
      }
    );
    it.each([["ArrowLeft"], ["ArrowRight"]])(
      "preventDefaults Cmd+%s on macOS/iPad (app handles section seek)",
      (code) => {
        expect(
          dispatchKeydown(document.body, { code, metaKey: true })
            .defaultPrevented
        ).toBe(true);
      }
    );

    // -- negative cases: browser shortcuts and non-scroll keys pass through --
    // Cmd+S, Cmd+F, Cmd+A etc. must NOT be swallowed; the user expects
    // browser/OS shortcuts to keep working when focus is on the body.
    it.each([
      ["KeyS"], // Cmd+S → save page
      ["KeyF"], // Cmd+F → find in page
      ["KeyA"], // Cmd+A → select all
      ["KeyR"], // Cmd+R → reload (browser-level)
      ["KeyP"], // Cmd+P → print
    ])("does not preventDefault Cmd+%s (browser shortcut)", (code) => {
      expect(
        dispatchKeydown(document.body, { code, metaKey: true }).defaultPrevented
      ).toBe(false);
      expect(
        dispatchKeydown(document.body, { code, ctrlKey: true }).defaultPrevented
      ).toBe(false);
    });

    // Enter on a focused button must NOT be swallowed — the synthetic
    // click that activates the button depends on the keydown default.
    it("does not preventDefault Enter on a focused <button>", () => {
      const button = document.createElement("button");
      document.body.appendChild(button);
      button.focus();
      expect(dispatchKeydown(button, { code: "Enter" }).defaultPrevented).toBe(
        false
      );
      document.body.removeChild(button);
    });

    // Plain `/` (no Shift) is not a help-modal trigger and must pass
    // through — Firefox uses it for quick-find.
    it("does not preventDefault Slash without Shift", () => {
      expect(
        dispatchKeydown(document.body, { code: "Slash" }).defaultPrevented
      ).toBe(false);
    });

    // Escape must stay native (cancel IME composition; macOS field revert).
    // The top-level swallow block must not call preventDefault for it;
    // the Escape switch case dismisses modals without preventDefault.
    it("does not preventDefault Escape on document body (no modal open)", () => {
      expect(
        dispatchKeydown(document.body, { code: "Escape" }).defaultPrevented
      ).toBe(false);
    });

    // Unhandled keys are never preventDefault'd — keeps focus navigation
    // (Tab), accessibility keys, and arbitrary printable input working.
    it.each([["KeyZ"], ["Tab"], ["F5"]])(
      "does not preventDefault %s (unhandled key)",
      (code) => {
        expect(dispatchKeydown(document.body, { code }).defaultPrevented).toBe(
          false
        );
      }
    );

    // The isInputLike guard skips swallowing when an input/textarea is
    // focused — typing in search/feedback fields must keep working.
    it("does not preventDefault Space when an <input> is focused", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();
      expect(dispatchKeydown(input, { code: "Space" }).defaultPrevented).toBe(
        false
      );
      document.body.removeChild(input);
    });

    // IME composition (e.g. Chinese/Japanese input) returns early before
    // the swallow block — a future refactor that moves the swallow earlier
    // would break non-Western input silently. This test pins the order.
    it("does not preventDefault Space during IME composition", () => {
      const event = new KeyboardEvent("keydown", {
        code: "Space",
        bubbles: true,
        cancelable: true,
        isComposing: true,
      });
      document.body.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("Auto-repeat (held-key) handling", () => {
    it("held Space does not toggle play/pause", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.playing = false;
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Space",
          bubbles: true,
          repeat: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.isPlaying()).toBe(false);
    });

    it("held Enter does not toggle play/pause", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.playing = false;
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Enter",
          bubbles: true,
          repeat: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.isPlaying()).toBe(false);
    });

    it("held ArrowDown does not change choir", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.setAttribute("choir", "0");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "ArrowDown",
          bubbles: true,
          repeat: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.getAttribute("choir")).toBe("0");
    });

    // ArrowLeft and ArrowRight are exempt from the auto-repeat guard
    // because holding them is the documented fast-seek gesture (move
    // through bars while held). These two tests assert the bar
    // actually advances on a repeat — not just that preventDefault
    // ran — so a future regression that swallows the seek silently
    // would fail loudly.
    it("held ArrowLeft is exempt and seeks backward", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.setAttribute("bar", "5");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "ArrowLeft",
          bubbles: true,
          repeat: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(Number(controls.getAttribute("bar"))).toBe(4);
    });

    it("held ArrowRight is exempt and seeks forward", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.setAttribute("bar", "5");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "ArrowRight",
          bubbles: true,
          repeat: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(Number(controls.getAttribute("bar"))).toBe(6);
    });
  });
});
