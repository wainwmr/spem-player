import { describe, it, expect, beforeAll, vi } from "vitest";
import { MusicControls } from "../ts/MusicControls";
import { setupIntegrationFixture } from "./helpers";

describe("keyboard shortcuts", () => {
  beforeAll(async () => {
    await setupIntegrationFixture();
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

  it("NumpadEnter toggles play/pause when focus is on the document body (#711)", async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    controls.playing = false;

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { code: "NumpadEnter", bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(controls.isPlaying()).toBe(true);

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { code: "NumpadEnter", bubbles: true })
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

  it("Space does not toggle play/pause when the play/pause button is focused (#634)", () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    const button = document.getElementById("playpausebutton");
    expect(button).not.toBeNull();

    controls.playing = false;
    // The button carries class="control", so the global keydown handler returns
    // early and never toggles. The native button click that would toggle once is
    // not synthesised by jsdom from a dispatched keydown, so isPlaying stays put.
    // This pins the no-double-toggle invariant the <button> change relies on.
    button!.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true })
    );
    expect(controls.isPlaying()).toBe(false);
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

    // Alt+Left/Right is the fine seek (1/16 bar) — must preventDefault
    // so the browser Back/Forward shortcut on Windows does not fire
    // simultaneously.
    it.each([["ArrowLeft"], ["ArrowRight"]])(
      "preventDefaults Alt+%s (app handles 1/16-bar seek)",
      (code) => {
        expect(
          dispatchKeydown(document.body, { code, altKey: true })
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

  describe("Part shortcuts with non-Latin keyboard layouts (#522)", () => {
    it.each([
      ["KeyS", "ы", "0"],
      ["KeyA", "ф", "1"],
      ["KeyT", "е", "2"],
      ["KeyR", "к", "3"],
      ["KeyB", "и", "4"],
    ])(
      "%s with Cyrillic e.key selects part %s",
      async (code, key, expectedPart) => {
        const controls = document.querySelector(
          "music-controls"
        ) as MusicControls;
        controls.setAttribute("part", "all");
        document.body.dispatchEvent(
          new KeyboardEvent("keydown", { code, key, bubbles: true })
        );
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(controls.getAttribute("part")).toBe(expectedPart);
      }
    );
  });

  describe("Auto-repeat (held-key) handling", () => {
    // Tests that exercise async setChoir need to yield to the
    // microtask queue (await new Promise + setTimeout 0) so the
    // attribute writes flush before assertion. The yield is
    // included in every test in this block for symmetry; it is a
    // no-op for the sync paths (Space, Enter, KeyD).

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

    it("held NumpadEnter does not toggle play/pause (#711)", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.playing = false;
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "NumpadEnter",
          bubbles: true,
          repeat: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.isPlaying()).toBe(false);
    });

    it("held ArrowDown changes choir forward", async () => {
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
      expect(controls.getAttribute("choir")).toBe("1");
    });

    it("held ArrowUp changes choir backward", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.setAttribute("choir", "1");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "ArrowUp",
          bubbles: true,
          repeat: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.getAttribute("choir")).toBe("0");
    });

    // ArrowLeft and ArrowRight are exempt from the auto-repeat guard
    // because holding them is the fast-seek gesture (move through
    // bars while held). These two tests assert the bar actually
    // advances on a repeat — not just that preventDefault ran — so
    // a future regression that swallows the seek silently would
    // fail loudly.
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

    // Alt+Left/Right is the fine seek (1/16 bar). These assert the bar
    // actually moves by the fractional step — not just that preventDefault
    // ran — so a regression that swallowed the default but broke the seek
    // (or vice versa) would fail loudly. Mirrors the held-Arrow tests above.
    it("Alt+ArrowRight fine-seeks forward by 1/16 bar", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.setAttribute("bar", "5");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "ArrowRight",
          bubbles: true,
          altKey: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(Number(controls.getAttribute("bar"))).toBeCloseTo(5.0625, 4);
    });

    it("Alt+ArrowLeft fine-seeks backward by 1/16 bar", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.setAttribute("bar", "5");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "ArrowLeft",
          bubbles: true,
          altKey: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(Number(controls.getAttribute("bar"))).toBeCloseTo(4.9375, 4);
    });

    // The Cmd/Ctrl+Arrow seek branch returns BEFORE the e.repeat
    // guard, so held Cmd+Arrow continues to auto-repeat its seek.
    // The invariant is structural — if a future edit hoists the
    // guard above the modifier branch, or adds an e.repeat check
    // inside it, this test pins the regression.
    it("held Ctrl+ArrowRight is exempt and seeks forward by section", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.setAttribute("bar", "5");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "ArrowRight",
          bubbles: true,
          repeat: true,
          ctrlKey: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(Number(controls.getAttribute("bar"))).toBeGreaterThan(5);
    });

    // The default-deny posture above the new guard is meant to
    // cover Digit and Letter shortcuts (the motivating examples in
    // the production comment). Without these, a future narrowing of
    // the exempt list could regress choir/part state on key-hold
    // with no test failure.
    it("held Digit2 does not change choir", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      controls.setAttribute("choir", "0");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Digit2",
          key: "2",
          bubbles: true,
          repeat: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.getAttribute("choir")).toBe("0");
    });

    it("held KeyD does not toggle dark mode", async () => {
      const wasLight = document.body.classList.contains("light-theme");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "KeyD",
          key: "d",
          bubbles: true,
          repeat: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(document.body.classList.contains("light-theme")).toBe(wasLight);
    });
  });

  // #654: pin the ~15 user-facing shortcuts keyboardTapped (index.ts ~243-389)
  // handles but the suite never exercised. Assertions are on observable state,
  // following the established dispatch-and-assert-state pattern. Tests only;
  // no production change. setChoir is async, so the choir paths keep a microtask
  // yield before asserting; the yield is defensive, not load-bearing (the
  // attribute writes are synchronous), and a harmless no-op on the sync paths
  // (setPart, recording, period, modals), kept for symmetry with the blocks above.
  describe("Untested shortcut coverage (#654)", () => {
    it("KeyV toggles the recording", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      const before = controls.getAttribute("recording");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyV", key: "v", bubbles: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      // recording cycles ALC(0) <-> CotE(1); a regression that stops KeyV
      // toggling recording fails here.
      expect(controls.getAttribute("recording")).not.toBe(before);
      expect(["0", "1"]).toContain(controls.getAttribute("recording"));
    });

    it("KeyM toggles the score period", async () => {
      const score = document.querySelector("music-score");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyM", key: "m", bubbles: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      const first = score!.getAttribute("score-type");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyM", key: "m", bubbles: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      const second = score!.getAttribute("score-type");
      // modern <-> early flip; a regression that stops KeyM toggling fails here.
      expect(first).not.toBe(second);
      expect(["modern", "early"]).toContain(first);
      expect(["modern", "early"]).toContain(second);
    });

    it("KeyF shows the feedback panel", () => {
      const feedbackModal = document.getElementById(
        "feedback-modal"
      ) as HTMLDivElement;
      const backdrop = document.getElementById("backdrop") as HTMLDivElement;
      feedbackModal.style.display = "none";
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyF", key: "f", bubbles: true })
      );
      expect(feedbackModal.style.display).toBe("block");
      expect(backdrop.style.display).toBe("block");
    });

    it("Shift+Slash shows the help panel", () => {
      const help = document.getElementById("help") as HTMLDivElement;
      help.style.display = "none";
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Slash",
          key: "?",
          shiftKey: true,
          bubbles: true,
        })
      );
      expect(help.style.display).toBe("block");
    });

    it("Slash without Shift does not show help", () => {
      const help = document.getElementById("help") as HTMLDivElement;
      help.style.display = "none";
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code: "Slash", key: "/", bubbles: true })
      );
      // The e.shiftKey guard: plain `/` (Firefox quick-find) must not open help.
      expect(help.style.display).toBe("none");
    });

    it("Escape closes the open help and feedback panels", () => {
      const help = document.getElementById("help") as HTMLDivElement;
      const feedbackModal = document.getElementById(
        "feedback-modal"
      ) as HTMLDivElement;
      help.style.display = "block";
      feedbackModal.style.display = "block";
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Escape",
          key: "Escape",
          bubbles: true,
        })
      );
      expect(help.style.display).toBe("none");
      expect(feedbackModal.style.display).toBe("none");
    });

    // Digit1, Digit3-Digit8 set the choir directly. Digit2 -> choir 1 is the
    // off-target reset, since every target below differs from 1. Previously only
    // Digit2 was touched, and only negatively (in a focused input).
    it.each([
      ["Digit1", "1", "0"],
      ["Digit3", "3", "2"],
      ["Digit4", "4", "3"],
      ["Digit5", "5", "4"],
      ["Digit6", "6", "5"],
      ["Digit7", "7", "6"],
      ["Digit8", "8", "7"],
    ])("%s sets choir to index %s", async (code, key, expected) => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Digit2",
          key: "2",
          bubbles: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      // Positively pin Digit2 (the reset key) -> choir 1, so a Digit2-only
      // regression cannot hide behind the post-set assertion below.
      expect(controls.getAttribute("choir")).toBe("1");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code, key, bubbles: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.getAttribute("choir")).toBe(expected);
    });

    // KeyS/A/T/R/B set the part. setPart keys off e.code, so the Cyrillic block
    // above already pins this code path; this standard-layout case documents the
    // Latin mapping explicitly. Part is reset to "all" (KeyX) before each case.
    it.each([
      ["KeyS", "s", "0"],
      ["KeyA", "a", "1"],
      ["KeyT", "t", "2"],
      ["KeyR", "r", "3"],
      ["KeyB", "b", "4"],
    ])("%s sets part to index %s", async (code, key, expected) => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyX", key: "x", bubbles: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code, key, bubbles: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.getAttribute("part")).toBe(expected);
    });

    it("KeyX sets part to all", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyS", key: "s", bubbles: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyX", key: "x", bubbles: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.getAttribute("part")).toBe("all");
    });
  });

  // #654 items 2-3: the early-return guards in keyboardTapped that block
  // shortcuts. Each asserts no state change (recording is the probe shortcut).
  // The positive control below anchors those no-change assertions, so they
  // cannot pass merely because the probe shortcut is itself dead.
  describe("Shortcut guards (#654)", () => {
    it("positive control: an unguarded KeyV does flip recording", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      const before = controls.getAttribute("recording");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyV", key: "v", bubbles: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.getAttribute("recording")).not.toBe(before);
    });

    it("a control-class element blocks shortcuts (item 2)", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      const el = document.createElement("div");
      el.classList.add("control");
      document.body.appendChild(el);
      const before = controls.getAttribute("recording");
      el.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyV", key: "v", bubbles: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      // keyboardTapped's classes.includes("control") guard returns early for
      // control-class targets (non-Escape).
      expect(controls.getAttribute("recording")).toBe(before);
      document.body.removeChild(el);
    });

    it("isComposing ignores a non-Space shortcut (item 3)", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      const before = controls.getAttribute("recording");
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "KeyV",
          key: "v",
          isComposing: true,
          bubbles: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.getAttribute("recording")).toBe(before);
    });

    it("keyCode 229 ignores a shortcut (IME, item 3)", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      const before = controls.getAttribute("recording");
      const event = new KeyboardEvent("keydown", {
        code: "KeyV",
        key: "v",
        bubbles: true,
      });
      // jsdom may not honour keyCode via the init dict; force it.
      if (event.keyCode !== 229) {
        Object.defineProperty(event, "keyCode", { value: 229 });
      }
      document.body.dispatchEvent(event);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.getAttribute("recording")).toBe(before);
    });

    it("a non-Element event target does not throw and is ignored", async () => {
      const controls = document.querySelector(
        "music-controls"
      ) as MusicControls;
      const before = controls.getAttribute("recording");
      // Dispatching on `document` (a Document node, not an Element) hits the
      // listener with a non-Element target, exercising keyboardTapped's
      // `e.target instanceof Element` guard.
      expect(() =>
        document.dispatchEvent(
          new KeyboardEvent("keydown", { code: "KeyV", key: "v" })
        )
      ).not.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(controls.getAttribute("recording")).toBe(before);
    });
  });
});
