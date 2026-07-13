import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { MusicControls } from "../ts/MusicControls";
import { setupIntegrationFixture } from "./helpers";

describe("Feedback modal", () => {
  beforeAll(async () => {
    await setupIntegrationFixture(() => {
      const info = document.getElementById("info")!;
      info.insertAdjacentHTML(
        "afterend",
        `<span id="feedback-trigger" class="tooltip">
          <span id="feedback-icon"></span>
          <span class="tooltiptext">Send feedback</span>
        </span>`
      );

      const help = document.getElementById("help")!;
      help.setAttribute("style", "display: none;");
      help.insertAdjacentHTML(
        "afterend",
        `<div id="feedback-modal" style="display: none;">
          <h2>Feedback</h2>
          <form id="feedback-form">
            <div id="feedback-rating">
              <label><input type="radio" name="rating" value="1" /> 1</label>
              <label><input type="radio" name="rating" value="2" /> 2</label>
              <label><input type="radio" name="rating" value="3" /> 3</label>
              <label><input type="radio" name="rating" value="4" /> 4</label>
              <label><input type="radio" name="rating" value="5" /> 5</label>
            </div>
            <textarea id="feedback-message" name="message" placeholder="Tell us more..."></textarea>
            <div class="feedback-actions">
              <button type="submit" id="feedback-submit">Send</button>
              <button type="button" id="feedback-cancel">Cancel</button>
            </div>
          </form>
          <div id="feedback-result" style="display: none;"></div>
        </div>`
      );

      document.body.insertAdjacentHTML(
        "beforeend",
        `<form name="feedback" netlify netlify-honeypot="bot-field" hidden>
          <input type="hidden" name="bot-field" />
          <input type="number" name="rating" />
          <input type="hidden" name="context" />
          <textarea name="message"></textarea>
        </form>`
      );
    });
  }, 30000);

  afterAll(async () => {
    const controls = document.querySelector("music-controls") as MusicControls;
    if (controls) controls.pause();
    await new Promise((resolve) => setTimeout(resolve, 100));
    vi.restoreAllMocks();
  });

  it("has a feedback trigger button in the header", () => {
    const trigger = document.getElementById("feedback-trigger");
    expect(trigger).not.toBeNull();
  });

  it("opens the feedback modal when the trigger is clicked", () => {
    const trigger = document.getElementById("feedback-trigger");
    const modal = document.getElementById("feedback-modal");
    expect(modal?.style.display).toBe("none");
    trigger?.dispatchEvent(new Event("click"));
    expect(modal?.style.display).toBe("block");
  });

  it("closes the feedback modal when the cancel button is clicked", () => {
    const modal = document.getElementById("feedback-modal");
    const cancel = document.getElementById("feedback-cancel");
    modal!.style.display = "block";
    cancel?.dispatchEvent(new Event("click"));
    expect(modal?.style.display).toBe("none");
  });

  it("closes the feedback modal when the backdrop is clicked", () => {
    const modal = document.getElementById("feedback-modal");
    const backdrop = document.getElementById("backdrop");
    modal!.style.display = "block";
    backdrop?.dispatchEvent(new Event("click"));
    expect(modal?.style.display).toBe("none");
  });

  it("closes the feedback modal when Escape is pressed", () => {
    const modal = document.getElementById("feedback-modal");
    modal!.style.display = "block";
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Escape", bubbles: true })
    );
    expect(modal?.style.display).toBe("none");
  });

  it("closes the feedback modal when Escape is pressed from within the textarea", () => {
    const modal = document.getElementById("feedback-modal");
    const textarea = document.getElementById(
      "feedback-message"
    ) as HTMLTextAreaElement;
    modal!.style.display = "block";
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Escape", bubbles: true })
    );
    expect(modal?.style.display).toBe("none");
  });

  it("updates hidden form rating when a star is selected", () => {
    const stars = document.querySelectorAll<HTMLInputElement>(
      '#feedback-form input[name="rating"]'
    );
    const hiddenRating = document.querySelector<HTMLInputElement>(
      'form[name="feedback"] input[name="rating"]'
    );
    stars[3]!.checked = true;
    stars[3]!.dispatchEvent(new Event("change", { bubbles: true }));
    expect(hiddenRating?.value).toBe("4");
  });

  it("copies message to hidden form textarea on input", () => {
    const message = document.getElementById(
      "feedback-message"
    ) as HTMLTextAreaElement;
    const hiddenMessage = document.querySelector<HTMLTextAreaElement>(
      'form[name="feedback"] textarea[name="message"]'
    );
    message.value = "Test feedback message";
    message.dispatchEvent(new Event("input", { bubbles: true }));
    expect(hiddenMessage?.value).toBe("Test feedback message");
  });

  describe("form submission", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      form.style.display = "";
      result.style.display = "none";
      result.textContent = "";
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it("shows 'Thank you' and hides form on successful fetch", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true } as Response)
      );
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      form.dispatchEvent(new Event("submit", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
      expect(result.textContent).toBe("Thank you");
      expect(form.style.display).toBe("none");
    });

    it("shows error message on failed fetch", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      form.dispatchEvent(new Event("submit", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
      expect(result.textContent).toBe("Couldn't send, please try later");
    });

    it("shows error message when fetch returns non-ok status", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response)
      );
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      form.dispatchEvent(new Event("submit", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
      expect(result.textContent).toBe("Couldn't send, please try later");
    });
  });
});

describe("Feedback context playback status (derived)", () => {
  // Fresh app instance for this block. setupIntegrationFixture calls
  // vi.resetModules() and re-imports "../../index.ts"; we re-import the same
  // specifier for a cache hit on that live module so updateFeedbackContext()
  // reads the same `controls` instance we drive here.
  let idx: typeof import("../../index.ts");
  let audio: HTMLAudioElement;

  beforeAll(async () => {
    await setupIntegrationFixture(() => {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<form name="feedback" netlify netlify-honeypot="bot-field" hidden>
          <input type="hidden" name="bot-field" />
          <input type="number" name="rating" />
          <input type="hidden" name="context" />
          <textarea name="message"></textarea>
        </form>`
      );
    });
    idx = await import("../../index.ts");
    audio = (document.querySelector("music-controls") as MusicControls).audio;
  }, 30000);

  afterEach(() => {
    // Restore any per-test getter overrides on the shared audio element.
    for (const p of ["paused", "networkState"]) {
      delete (audio as unknown as Record<string, unknown>)[p];
    }
  });

  // The feedback status is derived from the audio element at read time, so drive
  // the element's own getters rather than dispatching control events.
  function stubAudio(
    props: Partial<Record<"paused" | "networkState", unknown>>
  ) {
    for (const [key, value] of Object.entries(props)) {
      Object.defineProperty(audio, key, {
        get: () => value,
        configurable: true,
      });
    }
  }

  function contextStatus(): string {
    idx.exportedForTesting.updateFeedbackContext();
    const contextInput = document.querySelector<HTMLInputElement>(
      'form[name="feedback"] input[name="context"]'
    );
    return JSON.parse(contextInput!.value).status as string;
  }

  it("defaults to paused when idle (nothing loaded)", () => {
    expect(contextStatus()).toBe("paused");
  });

  it("reports playing when the audio element is playing", () => {
    stubAudio({ paused: false, networkState: HTMLMediaElement.NETWORK_IDLE });
    expect(contextStatus()).toBe("playing");
  });

  it("reports paused when the audio element is paused", () => {
    stubAudio({ paused: true, networkState: HTMLMediaElement.NETWORK_IDLE });
    expect(contextStatus()).toBe("paused");
  });

  it("reports loading while the audio element is fetching a track", () => {
    stubAudio({
      paused: true,
      networkState: HTMLMediaElement.NETWORK_LOADING,
    });
    expect(contextStatus()).toBe("loading");
  });

  it("reports loading during mid-play buffering (networkState precedence)", () => {
    // play() flips audio.paused to false before its promise resolves, so the
    // real load window is (paused: false, NETWORK_LOADING) — the same signature
    // as buffering an already-playing track. networkState is checked first so
    // the load window reads "loading"; the cost is that mid-play buffering does
    // too. Pin that precedence so a reorder cannot silently regress the window.
    stubAudio({
      paused: false,
      networkState: HTMLMediaElement.NETWORK_LOADING,
    });
    expect(contextStatus()).toBe("loading");
  });
});
