import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  vi,
  type MockInstance,
} from "vitest";
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
    // A failed send now logs, so capture console.error rather than letting the
    // failure tests spray real errors across the run.
    let errorLog: MockInstance<typeof console.error>;

    // Start each test from the app's OWN post-condition, not a hand-written
    // approximation of it. index.ts keeps its send state (the close timer, the
    // session, the in-flight lock, the abort handle) in module variables that no
    // DOM write can reach, and a test leaving a send unsettled would otherwise
    // poison every test after it: the next submit would return early at the
    // in-flight guard and every absence assertion would pass for the wrong reason.
    // A Cancel click routes through resetFeedbackForm, which is the teardown.
    beforeEach(() => {
      vi.useFakeTimers();
      errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
      document
        .getElementById("feedback-cancel")!
        .dispatchEvent(new Event("click"));
      document
        .getElementById("feedback-trigger")!
        .dispatchEvent(new Event("click"));
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      // Restore only what this describe installed. vi.restoreAllMocks() would also
      // tear down the rAF and HTMLMediaElement spies that setupIntegrationFixture
      // installs once in beforeAll, and nothing re-installs them (#798).
      errorLog.mockRestore();
    });

    // The submit handler is a promise chain, so its result lands several microtasks
    // after dispatch. Fake timers do not fake microtasks, so awaiting drains them.
    //
    // The count must exceed the chain's depth, which is an implementation detail of
    // index.ts, not of this file: adding one link there silently under-drains a
    // tightly-tuned count, and every absence assertion then passes for the wrong
    // reason. (That is not hypothetical. A `Promise.resolve()` added to index.ts
    // during this ticket broke a six-tick drain.) So drain generously, and let every
    // test anchor on a positive fact, so an under-drain fails loudly rather than
    // going green.
    async function settle() {
      for (let i = 0; i < 25; i++) await Promise.resolve();
    }

    function submit() {
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      form.dispatchEvent(new Event("submit", { bubbles: true }));
    }

    function typeFeedback(text: string, rating: string) {
      const message = document.getElementById(
        "feedback-message"
      ) as HTMLTextAreaElement;
      const star = document.querySelector<HTMLInputElement>(
        `#feedback-form input[name="rating"][value="${rating}"]`
      )!;
      message.value = text;
      star.checked = true;
      return { message, star };
    }

    it("shows 'Thank you' and hides form on successful fetch", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true } as Response)
      );
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      form.dispatchEvent(new Event("submit", { bubbles: true }));
      await settle();
      expect(result.textContent).toBe("Thank you");
      expect(form.style.display).toBe("none");
    });

    it("shows error message on failed fetch", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      form.dispatchEvent(new Event("submit", { bubbles: true }));
      await settle();
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
      await settle();
      expect(result.textContent).toBe("Couldn't send, please try later");
    });

    // Netlify silently discards a submission whose fields it does not recognise, so
    // a drift here is invisible at every layer: the POST returns 200 and the user is
    // thanked, while the feedback goes nowhere.
    //
    // This pins the CLIENT half only: what index.ts sends. The beforeAll fixture at
    // the top of this file builds its own hidden form, so a rename in the real
    // index.html (which is what Netlify registers) still passes. That gap is
    // "Source the fixture from production markup" in the project wiki's
    // refactor-feedback.test.ts.md.
    it("posts the Netlify form contract: url, method, encoding and fields", async () => {
      const send = vi.fn().mockResolvedValue({ ok: true } as Response);
      vi.stubGlobal("fetch", send);
      typeFeedback("Contract", "2");

      submit();
      await settle();

      expect(send).toHaveBeenCalledTimes(1);
      const [url, init] = send.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("/");
      expect(init.method).toBe("POST");
      expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/x-www-form-urlencoded"
      );

      const body = new URLSearchParams(init.body as string);
      expect(body.get("form-name")).toBe("feedback");
      expect(body.get("bot-field")).toBe("");
      expect(body.get("rating")).toBe("2");
      expect(body.get("message")).toBe("Contract");
      expect(JSON.parse(body.get("context")!)).toMatchObject({
        recording: expect.any(Number),
        choir: expect.any(Number),
        bar: expect.any(Number),
      });
    });

    // #798. The failure path used to share the success path's teardown, so the
    // message telling the user to retry was the same message that destroyed what
    // they had typed. The tests below cover both halves of the split, and the close
    // timer that the success path now holds, cancels and hands back.

    it("keeps the modal open with the message and rating intact when the send fails", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
      const modal = document.getElementById("feedback-modal")!;
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const { message, star } = typeFeedback("Bar 42 will not scroll", "4");

      submit();
      await settle();
      // The old code closed the modal and called form.reset() on this tick.
      vi.advanceTimersByTime(1500);

      expect(modal.style.display).toBe("block");
      expect(form.style.display).not.toBe("none");
      expect(message.value).toBe("Bar 42 will not scroll");
      expect(star.checked).toBe(true);
    });

    it("shows the failure message beside the form rather than replacing it", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      typeFeedback("Still here?", "3");

      submit();
      await settle();

      expect(result.textContent).toBe("Couldn't send, please try later");
      expect(result.style.display).not.toBe("none");
      expect(form.style.display).not.toBe("none");
    });

    it("logs the HTTP status when the server rejects the send", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response)
      );
      typeFeedback("An unregistered form is not a network blip", "5");

      submit();
      await settle();

      expect(errorLog).toHaveBeenCalledWith(
        "Feedback send failed:",
        expect.objectContaining({
          message: expect.stringContaining("HTTP 404"),
        })
      );
    });

    it("does not report a network failure when the send itself succeeded", async () => {
      // The catch used to sit downstream of the success branch, so a throw inside
      // the confirmation rendering was rebranded to the user as a failed send.
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true } as Response)
      );
      const result = document.getElementById("feedback-result")!;
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      let displayAtWrite: string | undefined;
      // Fault-inject the confirmation rendering. The property must be restored
      // even when an assertion below fails, or the poisoned setter leaks into
      // every test after this one.
      try {
        // Fire only on the CONFIRMATION render. A setter that throws on every write
        // would also trip the submit handler's clear-the-previous-error write, and
        // the throw would surface as a failed send, which is a different claim.
        Object.defineProperty(result, "textContent", {
          set(value: string) {
            if (value === "Thank you") {
              // Capture display AT the moment of the text write: the live region
              // must already be in the accessibility tree when its text lands.
              displayAtWrite = result.style.display;
              throw new Error("rendering blew up");
            }
          },
          get() {
            return "";
          },
          configurable: true,
        });

        submit();
        await settle();

        // Assert the DISCRIMINATING prefix, not just that something was logged.
        // Reverting to `.then().catch()` also logs "rendering blew up", via
        // "Feedback send failed:", so a bare toContain passes on the mutated code
        // (#798). The class is the DOM half of the same discrimination:
        // showFeedbackError adds it before the poisoned write, so it survives the
        // fault injection and is absent iff the failure path never ran.
        expect(errorLog).toHaveBeenCalledWith(
          "Feedback confirmation failed to render:",
          expect.objectContaining({ message: "rendering blew up" })
        );
        expect(result.classList.contains("feedback-error")).toBe(false);
        // The text is written before the form is hidden, so a throw mid-render
        // leaves the form on screen rather than an empty box.
        expect(form.style.display).not.toBe("none");
        // And the region was already visible when its text landed, so the live
        // region never carries a message nobody can see.
        expect(displayAtWrite).toBe("flex");
        // The close timer was armed BEFORE the render that threw, so the modal still
        // closes rather than stranding the user on an unchanged form (where a second
        // Send would file the same feedback twice).
        vi.advanceTimersByTime(1500);
        expect(document.getElementById("feedback-modal")!.style.display).toBe(
          "none"
        );
      } finally {
        delete (result as unknown as Record<string, unknown>).textContent;
      }
    });

    it("confirms, then closes and resets the form 1500 ms after a successful send", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true } as Response)
      );
      const modal = document.getElementById("feedback-modal")!;
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      const { message } = typeFeedback("Lovely, thank you", "5");

      submit();
      await settle();

      expect(result.textContent).toBe("Thank you");
      expect(form.style.display).toBe("none");

      vi.advanceTimersByTime(1500);

      expect(modal.style.display).toBe("none");
      expect(form.style.display).toBe("");
      expect(message.value).toBe("");
    });

    it("does not let the pending close timer shut a modal reopened within the window", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true } as Response)
      );
      const modal = document.getElementById("feedback-modal")!;
      const message = document.getElementById(
        "feedback-message"
      ) as HTMLTextAreaElement;
      typeFeedback("First note", "5");

      submit();
      await settle();
      // Anchor: the confirmation really rendered, so a close timer really was armed.
      expect(document.getElementById("feedback-result")!.textContent).toBe(
        "Thank you"
      );

      // The user dismisses the confirmation and reopens to add a second thought,
      // all inside the 1500 ms the close timer is still counting down.
      document
        .getElementById("feedback-cancel")!
        .dispatchEvent(new Event("click"));
      vi.advanceTimersByTime(500);
      document
        .getElementById("feedback-trigger")!
        .dispatchEvent(new Event("click"));
      message.value = "Second note";

      vi.advanceTimersByTime(1500);

      expect(modal.style.display).toBe("block");
      expect(message.value).toBe("Second note");
    });

    // The close is at 1500 ms, not "eventually". Advancing straight to 1500 also
    // passes if the delay were mutated to 1 ms, so walk the boundary (#598 is this
    // project's own recurring off-by-one class).
    it("holds the confirmation open until 1500 ms, then closes", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true } as Response)
      );
      const modal = document.getElementById("feedback-modal")!;
      typeFeedback("Boundary", "3");

      submit();
      await settle();

      vi.advanceTimersByTime(1499);
      expect(modal.style.display).toBe("block");

      vi.advanceTimersByTime(1);
      expect(modal.style.display).toBe("none");
    });

    // Both preservation tests used a REJECTED fetch, so the non-ok
    // branch (a permanent 404 from an unregistered Netlify form, which the submit
    // handler singles out as the likely real failure) could be routed back through
    // the success teardown with the whole suite green.
    it.each([
      ["a rejected fetch", () => Promise.reject(new Error("offline"))],
      ["a 404 response", () => Promise.resolve({ ok: false, status: 404 })],
      ["a 500 response", () => Promise.resolve({ ok: false, status: 500 })],
    ])("preserves the message and rating on %s", async (_label, respond) => {
      vi.stubGlobal("fetch", vi.fn().mockImplementation(respond));
      const modal = document.getElementById("feedback-modal")!;
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      const { message, star } = typeFeedback("Bar 42 will not scroll", "4");

      submit();
      await settle();
      vi.advanceTimersByTime(1500);

      // Anchor on the positive first: without it, every assertion below is also
      // true of a chain that never ran at all.
      expect(result.textContent).toBe("Couldn't send, please try later");
      expect(modal.style.display).toBe("block");
      expect(form.style.display).not.toBe("none");
      expect(message.value).toBe("Bar 42 will not scroll");
      expect(star.checked).toBe(true);
    });

    // Nothing pinned either `classList.remove("feedback-error")`.
    it("clears the error styling when a retry succeeds", async () => {
      const send = vi
        .fn()
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValueOnce({ ok: true } as Response);
      vi.stubGlobal("fetch", send);
      const result = document.getElementById("feedback-result")!;
      typeFeedback("Retry me", "4");

      submit();
      await settle();
      expect(result.classList.contains("feedback-error")).toBe(true);

      // The user presses Send again without retyping a word. That is the user
      // story of #798, and nothing executed it.
      submit();
      await settle();

      expect(result.textContent).toBe("Thank you");
      expect(result.classList.contains("feedback-error")).toBe(false);
    });

    it("clears the error styling when the modal is dismissed after a failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
      const result = document.getElementById("feedback-result")!;
      typeFeedback("Give up", "1");

      submit();
      await settle();
      expect(result.classList.contains("feedback-error")).toBe(true);

      document
        .getElementById("feedback-cancel")!
        .dispatchEvent(new Event("click"));

      expect(result.classList.contains("feedback-error")).toBe(false);
      expect(result.style.display).toBe("none");
      expect(result.textContent).toBe("");
    });

    // A send outlives the modal it was sent from: Escape, Cancel and the backdrop
    // all stay live while one is in flight, and on a dead connection the user has
    // every reason to use them. The response must not then render into a modal
    // they have walked away from (#798).
    //
    // Each of these anchors on a POSITIVE fact (the handler ran, or the button came
    // back) before asserting an absence. Without that anchor every assertion below
    // is also satisfied by a promise that never settled at all.
    it("does not write a failure into a modal the user already dismissed", async () => {
      const send = vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            // Reject with the signal's reason, as a real fetch does: rejecting with
            // an error of our own would leave the timeout's reason unpinned.
            init.signal?.addEventListener("abort", () =>
              reject(init.signal!.reason)
            );
          })
      );
      vi.stubGlobal("fetch", send);
      const result = document.getElementById("feedback-result")!;
      typeFeedback("Slow connection", "2");

      // Drain first: fetch is called inside the chain, so the signal is not handed
      // over until a microtask after dispatch.
      submit();
      await settle();

      // The send hangs. The user gives up and closes the modal.
      document
        .getElementById("feedback-cancel")!
        .dispatchEvent(new Event("click"));
      await settle();

      // The chain DID settle (the teardown aborted it), and still declined to render.
      const signal = (send.mock.calls[0]![1] as RequestInit).signal!;
      expect(signal.aborted).toBe(true);
      expect(result.textContent).toBe("");
      expect(result.classList.contains("feedback-error")).toBe(false);
      expect(result.style.display).toBe("none");
    });

    it("lets the user send again after abandoning a hung send", async () => {
      const send = vi
        .fn()
        .mockImplementationOnce(() => new Promise(() => {})) // never settles
        .mockResolvedValueOnce({ ok: true } as Response);
      vi.stubGlobal("fetch", send);
      const submitButton = document.getElementById(
        "feedback-submit"
      ) as HTMLButtonElement;
      typeFeedback("Hangs forever", "3");

      submit();
      await settle();
      expect(submitButton.disabled).toBe(true);

      // The user gives up and closes. The first send is STILL in flight, and its
      // .finally will never run, so the teardown must release the lock itself or
      // the next modal has a dead Send button and Enter is swallowed in silence.
      document
        .getElementById("feedback-cancel")!
        .dispatchEvent(new Event("click"));
      expect(submitButton.disabled).toBe(false);

      document
        .getElementById("feedback-trigger")!
        .dispatchEvent(new Event("click"));
      const result = document.getElementById("feedback-result")!;
      typeFeedback("Second attempt", "4");
      submit();
      await settle();

      expect(send).toHaveBeenCalledTimes(2);
      expect(result.textContent).toBe("Thank you");
    });

    // The success guard's real job is not a stranded panel; it is protecting a fresh
    // draft. Without it, an abandoned send's late "Thank you" hides the form the user
    // has started retyping into and arms a timer that resets it 1500 ms later. That is
    // #798 by another route, so the last assertion is the one that matters.
    it("does not overwrite a fresh draft when an abandoned send succeeds late", async () => {
      let resolveFirst: (value: unknown) => void = () => {};
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveFirst = resolve;
            })
        )
      );
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      const message = document.getElementById(
        "feedback-message"
      ) as HTMLTextAreaElement;
      typeFeedback("First", "3");

      submit();
      await settle();
      document
        .getElementById("feedback-cancel")!
        .dispatchEvent(new Event("click"));
      document
        .getElementById("feedback-trigger")!
        .dispatchEvent(new Event("click"));
      message.value = "Second thought, still typing";

      // The abandoned send lands in a session that is gone. Reading `ok` is the
      // liveness anchor: without it every assertion below is equally true of a chain
      // that never settled at all.
      let okRead = false;
      resolveFirst({
        get ok() {
          okRead = true;
          return true;
        },
      });
      await settle();
      expect(okRead).toBe(true);

      expect(result.textContent).toBe("");
      expect(form.style.display).not.toBe("none");
      vi.advanceTimersByTime(1500);
      expect(message.value).toBe("Second thought, still typing");
    });

    // The session guard on the .finally. Its only live moment is a SECOND send in
    // flight when the first one settles: without it, the abandoned send releases the
    // live send's lock and the user can file the same message twice.
    it("does not let an abandoned send unlock a modal that is sending again", async () => {
      let settleFirst: (value: unknown) => void = () => {};
      const send = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              settleFirst = resolve;
            })
        )
        .mockImplementationOnce(() => new Promise(() => {}));
      vi.stubGlobal("fetch", send);
      const submitButton = document.getElementById(
        "feedback-submit"
      ) as HTMLButtonElement;

      typeFeedback("First", "3");
      submit();
      await settle();
      document
        .getElementById("feedback-cancel")!
        .dispatchEvent(new Event("click"));
      document
        .getElementById("feedback-trigger")!
        .dispatchEvent(new Event("click"));
      typeFeedback("Second", "4");
      submit();
      await settle();
      expect(submitButton.disabled).toBe(true);

      let okRead = false;
      settleFirst({
        get ok() {
          okRead = true;
          return true;
        },
      });
      await settle();
      expect(okRead).toBe(true);

      expect(submitButton.disabled).toBe(true);
      submit();
      await settle();
      expect(send).toHaveBeenCalledTimes(2);

      // And the abandoned send must not have nulled the LIVE send's abort handle:
      // if it had, Cancel could no longer cancel B, and B would land at Netlify
      // behind the user's back. (Hoisting `feedbackAbort = undefined` above the
      // session guard in the .finally is exactly that mutation.)
      const liveSignal = (send.mock.calls[1]![1] as RequestInit).signal!;
      document
        .getElementById("feedback-cancel")!
        .dispatchEvent(new Event("click"));
      expect(liveSignal.aborted).toBe(true);
    });

    // Reopening an ALREADY-OPEN modal (KeyF and the icon both do) must not reset it.
    // Runs after a successful send, so feedbackCloseTimer is dirty: that also kills a
    // mutation that drops `feedbackCloseTimer = undefined` from the teardown.
    it("keeps a half-typed message when the modal is reopened over itself", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true } as Response)
      );
      typeFeedback("Sent", "5");
      submit();
      await settle();
      vi.advanceTimersByTime(1500);

      document
        .getElementById("feedback-trigger")!
        .dispatchEvent(new Event("click"));
      const message = document.getElementById(
        "feedback-message"
      ) as HTMLTextAreaElement;
      message.value = "Half a thought";

      document
        .getElementById("feedback-trigger")!
        .dispatchEvent(new Event("click"));

      expect(message.value).toBe("Half a thought");
    });

    it("blanks the previous error while a retry is in flight", async () => {
      let rejectSecond: (reason: Error) => void = () => {};
      const send = vi
        .fn()
        .mockRejectedValueOnce(new Error("offline"))
        .mockImplementationOnce(
          () =>
            new Promise((_resolve, reject) => {
              rejectSecond = reject;
            })
        );
      vi.stubGlobal("fetch", send);
      const result = document.getElementById("feedback-result")!;
      typeFeedback("Same failure twice", "2");

      submit();
      await settle();
      expect(result.textContent).toBe("Couldn't send, please try later");

      // Without the blank, the retry rewrites an identical string into a region
      // already showing it, and the user sees nothing happen at all.
      submit();
      await settle();
      expect(result.textContent).toBe("");
      expect(result.style.display).toBe("none");

      rejectSecond(new Error("offline"));
      await settle();
      expect(result.textContent).toBe("Couldn't send, please try later");
    });

    // A send the user walks away from is CANCELLED, not merely ignored. Without the
    // abort it stays on the wire and Netlify files it, so abandoning and resending
    // lodges the same feedback twice.
    it("aborts the request when the user dismisses a send in flight", async () => {
      const send = vi.fn().mockImplementation(() => new Promise(() => {}));
      vi.stubGlobal("fetch", send);
      typeFeedback("Cancel me", "1");

      submit();
      await settle();
      const signal = (send.mock.calls[0]![1] as RequestInit).signal!;
      expect(signal.aborted).toBe(false);

      document
        .getElementById("feedback-cancel")!
        .dispatchEvent(new Event("click"));

      expect(signal.aborted).toBe(true);
    });

    it("gives up on a hung send and tells the user, rather than sitting dead", async () => {
      const send = vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            // Reject with the signal's reason, as a real fetch does: rejecting with
            // an error of our own would leave the timeout's reason unpinned.
            init.signal?.addEventListener("abort", () =>
              reject(init.signal!.reason)
            );
          })
      );
      vi.stubGlobal("fetch", send);
      const result = document.getElementById("feedback-result")!;
      const submitButton = document.getElementById(
        "feedback-submit"
      ) as HTMLButtonElement;
      const { message } = typeFeedback("Hangs forever", "3");

      submit();
      await settle();
      expect(submitButton.disabled).toBe(true);
      expect(result.textContent).toBe("");

      // There is no fetch timeout a page can rely on, so without a deadline the button
      // stays greyed out and the app never says anything at all. Walk the boundary: a
      // SHORTENED deadline is its own regression, aborting slow-but-live sends.
      vi.advanceTimersByTime(29_999);
      await settle();
      expect(submitButton.disabled).toBe(true);
      expect(result.textContent).toBe("");

      vi.advanceTimersByTime(1);
      await settle();

      // NOT "couldn't send". A deadline can only fire once the request is out and we
      // are waiting on an answer, so claiming it failed asserts the opposite of the
      // likeliest truth, and invites the user to file the same feedback twice.
      expect(result.textContent).toContain("No answer from the server");
      expect(result.textContent).not.toContain("Couldn't send");
      expect(submitButton.disabled).toBe(false);
      expect(message.value).toBe("Hangs forever");
      expect(errorLog).toHaveBeenCalledWith(
        "Feedback send timed out:",
        expect.anything()
      );
    });

    // The modal stays open on failure, so the caret must come back to the textarea.
    // Clicking Send blurs it (disabling a focused control blurs it) and focus lands on
    // <body>, where the user's natural retry key reaches the global handler and starts
    // the music instead of resending.
    //
    // Do NOT advance timers before asserting: showFeedback(true) arms a 0 ms focus
    // timer, so the beforeEach leaves one pending, and flushing it would focus the
    // textarea anyway and make this pass with the fix deleted.
    it("puts the caret back in the message box after a failed send", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
      const message = document.getElementById(
        "feedback-message"
      ) as HTMLTextAreaElement;
      typeFeedback("Retry me with Enter", "3");
      (document.getElementById("feedback-submit") as HTMLButtonElement).focus();

      submit();
      await settle();

      expect(document.activeElement).toBe(message);
    });

    // A user who changes their mind has not experienced a failure. Logging the abort
    // as one makes a cancellation indistinguishable from a real fault to whoever reads
    // the console later, and silently widens the e2e allowlist to cover three events.
    it("does not log a cancelled send as a failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(
          (_url: string, init: RequestInit) =>
            new Promise((_resolve, reject) => {
              init.signal?.addEventListener("abort", () =>
                reject(new Error("aborted"))
              );
            })
        )
      );
      typeFeedback("Changed my mind", "4");

      submit();
      await settle();
      document
        .getElementById("feedback-cancel")!
        .dispatchEvent(new Event("click"));
      await settle();

      expect(errorLog).not.toHaveBeenCalled();
    });

    // Reopening DURING the confirmation window (KeyF works here, because the form
    // is hidden so focus falls to body and the input-guard does not bite). The
    // reopen must hand the form back: Send and Cancel both live inside it, so a
    // stranded "Thank you" leaves a modal with no controls at all.
    it("hands the form back when reopened during the confirmation", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true } as Response)
      );
      const form = document.getElementById("feedback-form") as HTMLFormElement;
      const result = document.getElementById("feedback-result")!;
      typeFeedback("Reopen on F", "5");

      submit();
      await settle();
      expect(result.textContent).toBe("Thank you");
      expect(form.style.display).toBe("none");

      vi.advanceTimersByTime(500);
      document
        .getElementById("feedback-trigger")!
        .dispatchEvent(new Event("click"));

      expect(form.style.display).not.toBe("none");
      expect(result.textContent).toBe("");
    });

    // Two clicks used to file two Netlify submissions. The guard is the in-flight
    // lock, so the test must submit again while the first send is genuinely
    // PENDING: two synchronous submits in one task would pass even if the lock were
    // released in the first .then rather than at the end of the chain.
    it("sends once when Send is clicked twice during a send", async () => {
      let resolveSend: (value: unknown) => void = () => {};
      const send = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSend = resolve;
          })
      );
      vi.stubGlobal("fetch", send);
      const submitButton = document.getElementById(
        "feedback-submit"
      ) as HTMLButtonElement;
      typeFeedback("Double tap", "5");

      submit();
      await settle();
      expect(submitButton.disabled).toBe(true);

      submit();
      await settle();
      expect(send).toHaveBeenCalledTimes(1);

      resolveSend({ ok: true });
      await settle();
      expect(submitButton.disabled).toBe(false);
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
