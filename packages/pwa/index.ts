// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import "./src/scss/style.scss";

import config from "./src/ts/config";

import {
  MusicEventDetail,
  PartType,
  State,
  Status,
  colors,
  toNum,
  toRecordingIndex,
} from "./src/ts/common";
import { parseURLSearch } from "./src/ts/url";

import { MusicCanvas } from "./src/ts/MusicCanvas";
import { MusicCanvasWatcher } from "./src/ts/MusicCanvasWatcher";
import { MusicControls } from "./src/ts/MusicControls";
import { MusicScore } from "./src/ts/MusicScore";

import recordingswitchSvg from "./src/icons/recordingswitch.svg?raw";
import scoreswitchSvg from "./src/icons/scoreswitch.svg?raw";
import darkswitchSvg from "./src/icons/darkswitch.svg?raw";
import feedbackSvg from "./src/icons/feedback.svg?raw";
import helpSvg from "./src/icons/help.svg?raw";

MusicCanvas.define("music-canvas");
MusicCanvasWatcher.define("music-canvas-watcher");
MusicControls.define("music-controls");
MusicScore.define("music-score");

console.log(`Spem Player ${config.version}`);

// Register service worker for PWA offline support and update prompt
import "./src/ts/pwa-update";

const container = document.querySelector(".split-container");
const score = document.querySelector("music-score") as MusicScore;
const splitter = document.querySelector(".splitter") as HTMLDivElement;
const canvas = document.querySelector("music-canvas") as MusicCanvas;
const controls = document.querySelector("music-controls") as MusicControls;

const info = document.getElementById("info") as HTMLSpanElement;
const help = document.getElementById("help") as HTMLDivElement;
const backdrop = document.getElementById("backdrop") as HTMLDivElement;
// Null in the jsdom fixtures that do not build the feedback markup (the darkmode,
// keyboard and setbar tests), so the guards on them are load-bearing rather than
// defensive; feedback.test.ts injects the markup, so they are non-null there.
// #feedback-modal is in the shared fixture, empty, because keyboard.test.ts's KeyF
// and Escape tests need it. Every use is already guarded or optional-chained, so
// typing them honestly costs nothing and stops the next unguarded write compiling.
// The elements above are a different case: the app asserts them and uses them
// unguarded, so typing them would force guards everywhere.
const feedbackTrigger = document.getElementById("feedback-trigger") as HTMLSpanElement | null;
const feedbackIcon = document.getElementById("feedback-icon") as HTMLSpanElement | null;
const feedbackModal = document.getElementById("feedback-modal") as HTMLDivElement | null;
const feedbackCancel = document.getElementById("feedback-cancel") as HTMLButtonElement | null;
const feedbackSubmit = document.getElementById("feedback-submit") as HTMLButtonElement | null;
const feedbackMessage = document.getElementById("feedback-message") as HTMLTextAreaElement | null;
const feedbackResult = document.getElementById("feedback-result") as HTMLDivElement | null;
const feedbackForm = document.getElementById("feedback-form") as HTMLFormElement | null;
const hiddenFeedbackForm = document.querySelector('form[name="feedback"]') as HTMLFormElement | null;
const darkswitch = document.getElementById("darkswitch") as HTMLElement;
const scoreswitch = document.getElementById("scoreswitch") as HTMLElement;
const helpIcon = document.getElementById("help-icon") as HTMLElement;
const recordingswitch = document.getElementById(
  "recordingswitch"
) as HTMLElement;
const recordinglabel = document.getElementById(
  "recordinglabel"
) as HTMLSpanElement;

helpIcon.innerHTML = helpSvg;
recordingswitch.innerHTML = recordingswitchSvg;
scoreswitch.innerHTML = scoreswitchSvg;
darkswitch.innerHTML = darkswitchSvg;
if (feedbackIcon) {
  feedbackIcon.innerHTML = feedbackSvg;
}

helpIcon.setAttribute("tabindex", "-1");
recordingswitch.setAttribute("tabindex", "-1");
scoreswitch.setAttribute("tabindex", "-1");
darkswitch.setAttribute("tabindex", "-1");

let isDragging = false;

var current: State = {
  recording: 0, // 0 = ALC, 1 = CotE
  viewmode: "dark",
  period: "modern",
  choir: 0,
  part: "all",
  bar: 0,
};

// TODO: Change dark mode to moon/sun icons
// TODO: Better font/graphic for Spem Player title
// BUG: can scroll up and down a tiny bit in score
// BUG: [Violation] Forced reflow while executing JavaScript took 36ms  (this doesn't happen when you have already manually adjusted the height of the score - something to do with the flex: 1 after the reload?)
// TODO: build: generate SVG from lilypond as part of build process
// TODO: CMD-B to type in bar number
// TODO: highlight part on score?
// TODO: Add lyrics to footer
// BUG: loop() never finishes after playing to the end of spem

// -----------------------------------------------------
// Splitter to resize score and canvas
// -----------------------------------------------------
splitter.addEventListener("mousedown", () => {
  isDragging = true;
  // Pin the resize cursor for the whole drag via a body class, not
  // document.body.style.cursor: the score and canvas set their own
  // `cursor: crosshair`, so they don't inherit the body cursor when the pointer
  // outpaces the clamped splitter onto them. The `.resizing-split` rule in
  // style.scss forces row-resize onto every element under the pointer (#709).
  document.body.classList.add("resizing-split");
});

// End a splitter drag: drop the flag and the cursor-pinning class. Called from
// mouseup, and from a button-less mousemove — a release outside the document
// never sends us a mouseup, so the next in-window move with no button held is
// our signal to clean up rather than leave the cursor stuck pinned (#709).
function endDrag() {
  isDragging = false;
  document.body.classList.remove("resizing-split");
}

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  if (e.buttons === 0) {
    endDrag();
    return;
  }
  const containerRect = container?.getBoundingClientRect();
  if (!containerRect) return;
  let newHeight = e.clientY - containerRect.top;
  newHeight = Math.max(100, Math.min(newHeight, containerRect.height - 100));
  score.style.height = `${newHeight}px`;
});

document.addEventListener("mouseup", endDrag);

async function setChoir(c: number, forceChange = false) {
  if (current.choir == c && !forceChange) {
    return;
  }
  current.choir = Math.min(Math.max(0, c), config.choirs[0].length - 1);

  // Update the input field
  controls.setAttribute("choir", String(current.choir));

  // Update the score for this choir
  score.setAttribute("choir", String(current.choir));

  // Set the recording of the audio to use
  score.setAttribute("recording", String(current.recording));

  // Update the canvas
  canvas.setAttribute("choir", String(current.choir));
}

function setPart(p: PartType) {
  if (current.part == p) {
    return;
  }
  current.part = p;

  // Update the input field
  controls.setAttribute("part", String(current.part));

  // Update the score
  score.setAttribute("part", String(current.part));

  // Update the canvas
  canvas.setAttribute("part", String(current.part));
}

// where b = 0 (the intro bar with intro_bar beats in it) to 139
function setBar(b: number) {
  b = toNum(b, false);
  if (b >= 140) {
    controls.pause();
    b = 0;
  } else if (b < 0) {
    b = 139;
  }
  current.bar = b;

  // update the input field
  controls.setAttribute("bar", String(b));

  // Highlight the bar on the score
  score.setAttribute("bar", String(b));

  // Update the canvas
  canvas.setAttribute("bar", String(b));
}

function parseURL() {
  const parsed = parseURLSearch(window.location.search);
  setRecording(parsed.recording);
  setChoir(parsed.choir, true);
  setPart(parsed.part);
  setBar(parsed.bar);
  if (parsed.early) {
    toggleScore();
  }
  if (!parsed.dark) {
    document.body.classList.add("light-theme");
    current.viewmode = "light";
  } else {
    document.body.classList.remove("light-theme");
    current.viewmode = "dark";
  }
  colors(true);
  updateDarkIcon();
}

// -----------------------------------------------------
// Field events (chaning choir, part or bar)
// -----------------------------------------------------

function handleControlChange(e: CustomEvent<MusicEventDetail>) {
  const pos = e.detail.position;
  setChoir(Number(pos.choir));
  setPart(pos.part == "all" ? "all" : Number(pos.part));
  setBar(Number(pos.bar));
}

// -----------------------------------------------------
// Keyboard event handling
// -----------------------------------------------------

// Keys whose browser default is to scroll the page. On iPad/Safari,
// letting these bubble up causes the page to wiggle/scroll while the
// app handles its own action (#10). We call preventDefault only when
// the key is plain (no Cmd/Ctrl) — browser shortcuts like Cmd+S /
// Cmd+F / Cmd+A / Ctrl+R must keep working. Cmd/Ctrl+ArrowLeft/Right
// is the one modifier combination the app DOES handle (seek-by-section);
// that case is special-cased via `isModifierSeek` below.
const SCROLL_KEYS = new Set([
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

// Default policy for held-key repeats: SUPPRESS. Most shortcuts
// (Space toggle, Digit/Letter mode-switches, KeyD dark-mode) would
// strobe or thrash state if they fired many times per second on a
// held key. Add to this set only if auto-repeating the action is
// *useful*, not just *noisy*. ArrowLeft/ArrowRight are exempt
// because holding them is the fast-seek gesture (advance through
// bars while held).
const REPEAT_EXEMPT_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
]);

function keyboardTapped(e: KeyboardEvent) {
  if (e === undefined || e.target === null) {
    return;
  }

  // Ensure e.target is an Element before accessing classList
  if (!(e.target instanceof Element)) {
    return;
  }

  // don't handle keyboard events on the four control widgets
  // cos it messes with the UI interaction. Escape is allowed through
  // so that the modal-close handlers below can still fire (e.g.
  // dismissing the feedback dialog while focused in its textarea).
  const classes = [...e.target.classList];
  const isInputLike =
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    e.target instanceof HTMLSelectElement;
  if (classes.includes("control") || isInputLike) {
    if (e.code !== "Escape") return;
  }
  // don't handle keyboard events if composing text (chinese characters)
  if (e.isComposing || e.keyCode === 229) {
    return;
  }

  // Swallow the browser-default for scroll-causing keys (iPad fix, #10).
  // Plain arrows and Space scroll the page — the app owns those gestures.
  // The app also owns these modifier+Left/Right combos for seeking:
  //   Cmd/Ctrl+Left/Right → seek by section
  //   Alt+Left/Right      → fine seek (1/16 bar)
  // Leave non-seek modifier combinations (Cmd+S, Cmd+F, etc.) to the browser.
  const isModifierSeek =
    (e.metaKey || e.ctrlKey || e.altKey) &&
    (e.code === "ArrowRight" || e.code === "ArrowLeft");
  const isPlainScrollKey =
    !e.metaKey && !e.ctrlKey && SCROLL_KEYS.has(e.code);
  if (isModifierSeek || isPlainScrollKey) {
    e.preventDefault();
  }

  if (e.metaKey || e.ctrlKey) {
    switch (e.code) {
      case "ArrowRight":
        controls.pause();
        setBar(canvas.seek(current, +1));
        break;
      case "ArrowLeft":
        controls.pause();
        setBar(canvas.seek(current, -1));
        break;
      default:
        break;
    }
    return;
  }

  // Default-deny on auto-repeat. Held keys fire many times per
  // second at the OS repeat rate; for most shortcuts that means
  // strobing (held Space toggling play/pause, held KeyD flipping
  // dark mode) or piling redundant attribute writes through
  // setChoir/setPart. The exemption list is REPEAT_EXEMPT_KEYS
  // above. Note the Cmd/Ctrl+Arrow branch already returned, so
  // held Cmd+Arrow keeps auto-repeating its seek on a separate
  // code path — covered by a test below.
  if (e.repeat && !REPEAT_EXEMPT_KEYS.has(e.code)) {
    return;
  }

  if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Space") {
    controls.isPlaying() ? controls.pause() : controls.play();
    return;
  }
  switch (e.code) {
    case "Digit1":
    case "Digit2":
    case "Digit3":
    case "Digit4":
    case "Digit5":
    case "Digit6":
    case "Digit7":
    case "Digit8":
      setChoir(Number(e.key) - 1);
      break;
    case "KeyS":
    case "KeyA":
    case "KeyT":
    case "KeyR":
    case "KeyB": {
      const partCodes = ["KeyS", "KeyA", "KeyT", "KeyR", "KeyB"];
      setPart(partCodes.indexOf(e.code));
      break;
    }
    case "KeyV":
      toggleRecording();
      break;
    case "KeyM":
      toggleScore();
      break;
    case "KeyD":
      toggleDark();
      break;
    case "KeyF":
      showFeedback();
      break;
    case "Slash":
      if (e.shiftKey) {
        showHelp();
      }
      break;
    case "Escape":
      showHelp(false);
      showFeedback(false);
      break;
    case "ArrowRight":
      controls.pause();
      setBar(
        e.altKey ? toNum(current.bar, false) + 0.0625 : toNum(current.bar) + 1
      );
      break;
    case "ArrowLeft":
      controls.pause();
      setBar(
        e.altKey ? toNum(current.bar, false) - 0.0625 : toNum(current.bar) - 1
      );
      break;
    case "ArrowDown":
      setChoir(
        current.choir >= config.choirs[0].length - 1 ? 0 : current.choir + 1
      );
      break;
    case "ArrowUp":
      setChoir(
        current.choir <= 0 ? config.choirs[0].length - 1 : current.choir - 1
      );
      break;
    case "KeyX":
      setPart("all");
      break;
    default:
  }
}

function showHelp(show = true) {
  if (show) {
    backdrop.style.display = "block";
    help.style.display = "block";
  } else {
    backdrop.style.display = "none";
    help.style.display = "none";
  }
}

// The modal's send state (#798). A pending close timer means a confirmation is on
// screen. The session stamps each submit, so a response whose modal is gone renders
// nothing. The in-flight flag admits one send at a time. There is no fetch timeout a
// page can rely on, so the deadline is what stops a hung POST holding the lock in
// silence.
//
// resetFeedbackForm bumps the session, aborts the request, clears the timer and
// releases the lock. The chain's .finally also releases the lock, guarded by the
// session, so the two cannot fight.
//
// The deadline is generous on purpose. It can only fire once the request is out and
// we are waiting on an answer, so a short one converts a merely-slow network into a
// reported failure, and the user then re-sends feedback Netlify has already filed.
const FEEDBACK_SEND_TIMEOUT_MS = 30_000;
let feedbackCloseTimer: ReturnType<typeof setTimeout> | undefined;
let feedbackAbort: AbortController | undefined;
let feedbackSession = 0;
let feedbackSending = false;

function showFeedback(show = true) {
  if (!feedbackModal) return;
  if (show) {
    // A pending close timer means a confirmation is on screen. Reopening adopts it:
    // hand the form back, rather than only cancelling the timer that would have done
    // so, or the modal is left showing "Thank you" with no form and no buttons (Send
    // and Cancel both live inside the form).
    //
    // Conditional on the timer, and only on the timer. Reopening an already-open
    // modal is routine (the icon, and KeyF once focus has left the textarea, where
    // keyboardTapped's input-guard would otherwise swallow it), so an unconditional
    // reset here would wipe a half-typed message: #798 by another route.
    if (feedbackCloseTimer !== undefined) resetFeedbackForm();
    backdrop.style.display = "block";
    feedbackModal.style.display = "block";
    updateFeedbackContext();
    setTimeout(() => feedbackMessage?.focus(), 0);
  } else {
    backdrop.style.display = "none";
    feedbackModal.style.display = "none";
    resetFeedbackForm();
  }
}

// The teardown: the only writer that ends a session. It must release the send lock
// as well as the rest, or a send the user walked away from leaves the next modal
// with a dead Send button.
function resetFeedbackForm() {
  // Cancel the request, not merely its result. An abandoned POST that has not yet
  // reached Netlify is dropped, so the user cannot file the same message twice by
  // reopening and sending again. One already delivered is still filed: abort stops
  // us waiting on it, it does not un-send it.
  feedbackAbort?.abort();
  feedbackAbort = undefined;
  feedbackSession++;
  feedbackSending = false;
  if (feedbackSubmit) feedbackSubmit.disabled = false;
  clearTimeout(feedbackCloseTimer);
  feedbackCloseTimer = undefined;
  if (feedbackForm) {
    feedbackForm.style.display = "";
    feedbackForm.reset();
    syncFeedbackRating();
    syncFeedbackMessage();
  }
  if (feedbackResult) {
    feedbackResult.style.display = "none";
    feedbackResult.textContent = "";
    feedbackResult.classList.remove("feedback-error");
  }
}

// Success only. The form has done its job, so replace it with the confirmation and
// tidy up. A failed send must NOT come through here: this teardown destroys the
// message the user is being asked to send again (#798).
//
// Both writers set every property they share, rather than relying on the state the
// other left behind, and both set the region's display before its text, so the live
// region (role="alert") is in the accessibility tree before its content lands.
function showFeedbackResult(message: string) {
  // Arm the close FIRST, so a throw while rendering below still closes the modal.
  // An empty modal closing is not a good outcome; it is the less bad one. It bounds
  // the window in which the user, left on an unchanged form, presses Send again and
  // files the same feedback twice, rather than leaving that window open.
  clearTimeout(feedbackCloseTimer);
  feedbackCloseTimer = setTimeout(() => showFeedback(false), 1500);
  if (feedbackResult) {
    feedbackResult.classList.remove("feedback-error");
    feedbackResult.style.display = "flex";
    feedbackResult.textContent = message;
  }
  if (feedbackForm) feedbackForm.style.display = "none";
}

// Failure. Leave the form, the message and the rating exactly as they are and show
// the error beneath them, so "please try later" costs the user nothing.
function showFeedbackError(message: string) {
  // No close timer may survive into a failure: it would auto-close the modal and
  // reset the very message the user is being asked to send again.
  clearTimeout(feedbackCloseTimer);
  feedbackCloseTimer = undefined;
  if (feedbackForm) feedbackForm.style.display = "";
  // After a CLICK, focus was on Send, and disabling it moved focus to <body>, where
  // Enter reaches the global key handler and toggles playback. Put it back in the
  // textarea. (Submitting with Enter never left the textarea, so this is a no-op
  // there.) Before the alert text lands, not after: a focus move after the write
  // would flush the screen reader's speech queue and cut the announcement off.
  feedbackMessage?.focus();
  if (feedbackResult) {
    feedbackResult.classList.add("feedback-error");
    feedbackResult.style.display = "flex";
    feedbackResult.textContent = message;
  }
}

// Derive the playback status from the audio element at read time, rather than
// mirroring it into a stored State field that every handler must remember to
// update (the field was the stale-status bug this replaces). networkState is
// checked first: it reports NETWORK_LOADING through the whole fetch, including
// the load window where play() has already flipped audio.paused to false, so a
// paused-first order would misreport a loading track as playing. The trade is
// that mid-play buffering (a not-yet-fully-fetched track that is audibly
// playing) also reads "loading"; the audio element alone cannot tell that from
// the pre-play load window. Distinguishing them needs MusicControls' own state
// (a status() getter) — deferred to a follow-up. Guard the controls read so a
// missing element degrades to a default rather than throwing and dropping a
// feedback submit, matching updateFeedbackContext's other null-guards.
function deriveFeedbackStatus(): Status {
  const audio = controls?.audio;
  if (!audio) return "paused";
  if (audio.networkState === HTMLMediaElement.NETWORK_LOADING) return "loading";
  return audio.paused ? "paused" : "playing";
}

function updateFeedbackContext() {
  if (!hiddenFeedbackForm) return;
  const contextInput = hiddenFeedbackForm.querySelector<HTMLInputElement>(
    'input[name="context"]'
  );
  if (!contextInput) return;
  const context = {
    recording: current.recording,
    choir: current.choir,
    part: current.part,
    bar: current.bar,
    viewmode: current.viewmode,
    period: current.period,
    status: deriveFeedbackStatus(),
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
  contextInput.value = JSON.stringify(context);
}

function syncFeedbackRating() {
  if (!feedbackForm || !hiddenFeedbackForm) return;
  const visible = feedbackForm.querySelector<HTMLInputElement>(
    'input[name="rating"]:checked'
  );
  const hidden = hiddenFeedbackForm.querySelector<HTMLInputElement>(
    'input[name="rating"]'
  );
  if (hidden) {
    hidden.value = visible ? visible.value : "";
  }
}

function syncFeedbackMessage() {
  if (!feedbackForm || !hiddenFeedbackForm) return;
  const visible = feedbackForm.querySelector<HTMLTextAreaElement>(
    'textarea[name="message"]'
  );
  const hidden = hiddenFeedbackForm.querySelector<HTMLTextAreaElement>(
    'textarea[name="message"]'
  );
  if (hidden && visible) {
    hidden.value = visible.value;
  }
}

function updateDarkIcon() {
  const isLight = document.body.classList.contains("light-theme");
  document
    .getElementById("moon-icon")
    ?.setAttribute("display", isLight ? "inline" : "none");
  document
    .getElementById("sun-icon")
    ?.setAttribute("display", isLight ? "none" : "inline");
}

function toggleDark() {
  document.body.classList.toggle("light-theme");
  current.viewmode = document.body.classList.contains("light-theme")
    ? "light"
    : "dark";
  colors(true); // reload the colors from the stylesheet
  canvas.draw();
  updateDarkIcon();
}

function toggleScore(forceEarly = false) {
  if (current.period === "modern" || forceEarly) {
    current.period = "early";
    score.setAttribute("score-type", "early");
    document.body.style.setProperty("--font", "Macondo Swash Caps");
  } else {
    current.period = "modern";
    score.setAttribute("score-type", "modern");
    document.body.style.setProperty("--font", "Alegreya");
  }
}

async function setRecording(r: number) {
  current.recording = toRecordingIndex(r);
  recordinglabel.textContent = config.recording_label[current.recording];

  // Update the input field
  controls.setAttribute("recording", String(current.recording));
}

function toggleRecording() {
  setRecording((current.recording + 1) % config.recording.length);
}

function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

function handleCanvasClick(e: CustomEvent<MusicEventDetail>) {
  const pos = e.detail.position;

  setChoir(pos.choir);
  setPart(pos.part);
  setBar(pos.bar);
}

function handleAudioPlaying() {
  canvas.setAttribute("playing", "true");
  score.setAttribute("playing", "true");
}

function handleAudioPaused() {
  canvas.setAttribute("playing", "false");
  score.setAttribute("playing", "false");
}

// -----------------------------------------------------
// Setup page
// -----------------------------------------------------

window.addEventListener("load", init);

function init(): void {
  // On mobiles, 100vh sometimes is the total vertical space
  // of the browser, but we don't want to include the browser's
  // header and footer in that, so calculate using visible vertical space.
  setVH();

  // read choir, part and bar from the URL
  parseURL();

  score.addEventListener("music-score-click", handleControlChange);

  controls.addEventListener("music-controls-changed", handleControlChange);
  controls.addEventListener("music-controls-playing", handleAudioPlaying);
  controls.addEventListener("music-controls-paused", handleAudioPaused);

  canvas.addEventListener("music-canvas-click", handleCanvasClick);
  canvas.addEventListener("music-canvas-touchstart", handleCanvasClick);
  canvas.addEventListener("music-canvas-touchend", handleCanvasClick);

  document.addEventListener(
    "keydown",
    keyboardTapped as (e: KeyboardEvent) => void
  );
  info.addEventListener("click", () => showHelp(true));
  backdrop.addEventListener("click", () => {
    showHelp(false);
    showFeedback(false);
  });
  darkswitch.addEventListener("click", () => toggleDark());
  scoreswitch.addEventListener("click", () => toggleScore());
  recordingswitch.addEventListener("click", () => toggleRecording());

  if (feedbackTrigger) {
    feedbackTrigger.addEventListener("click", () => showFeedback(true));
  }
  if (feedbackCancel) {
    feedbackCancel.addEventListener("click", () => showFeedback(false));
  }
  if (feedbackMessage) {
    feedbackMessage.addEventListener("keydown", (e) => {
      if (e.code === "Enter" && !e.shiftKey) {
        e.preventDefault();
        feedbackForm?.requestSubmit();
      }
    });
  }
  if (feedbackForm) {
    feedbackForm.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (target.getAttribute("name") === "rating") {
        syncFeedbackRating();
      }
    });
    feedbackForm.addEventListener("input", (e) => {
      const target = e.target as HTMLElement;
      if (target.getAttribute("name") === "message") {
        syncFeedbackMessage();
      }
    });
    feedbackForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (feedbackSending) return;
      syncFeedbackRating();
      syncFeedbackMessage();
      updateFeedbackContext();
      const rating =
        hiddenFeedbackForm?.querySelector<HTMLInputElement>('input[name="rating"]')?.value ?? "";
      const message =
        hiddenFeedbackForm?.querySelector<HTMLTextAreaElement>('textarea[name="message"]')?.value ?? "";
      const context =
        hiddenFeedbackForm?.querySelector<HTMLInputElement>('input[name="context"]')?.value ?? "";
      const data = new URLSearchParams({
        "form-name": "feedback",
        "bot-field": "",
        rating,
        message,
        context,
      });
      // The modal session this send belongs to. A response whose session is gone
      // renders nothing (#798).
      const session = feedbackSession;
      const onScreen = () => session === feedbackSession;
      // Blank the previous attempt's error before the lock, so a retry that fails the
      // same way is visible rather than rewriting an identical string into a region
      // already showing it. This makes the SIGHTED change reliable; whether a screen
      // reader re-announces an identical alert depends on the reader. Done
      // synchronously and before the lock: a throw here wedges nothing.
      if (feedbackResult) {
        feedbackResult.style.display = "none";
        feedbackResult.textContent = "";
        feedbackResult.classList.remove("feedback-error");
      }
      const controller = new AbortController();
      feedbackAbort = controller;
      let timedOut = false;
      const deadline = setTimeout(() => {
        timedOut = true;
        controller.abort(new Error("feedback send timed out"));
      }, FEEDBACK_SEND_TIMEOUT_MS);
      feedbackSending = true;
      if (feedbackSubmit) feedbackSubmit.disabled = true;
      // Disabling the button blurs it, so focus would otherwise fall to <body> for
      // the whole send, where Space and Enter reach the global key handler and
      // toggle playback behind the open modal. Park it in the textarea instead.
      feedbackMessage?.focus();
      // Everything from the fetch onward runs inside the chain, so a throw becomes a
      // rejection the handler below logs and the .finally releases. A synchronous throw
      // outside it would escape before the chain existed, leaving Send disabled until
      // the user dismissed the modal, losing what they typed.
      Promise.resolve()
        .then(() =>
          fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: data.toString(),
            signal: controller.signal,
          })
        )
        .then((res) => {
          // The status distinguishes an unregistered Netlify form's permanent 404
          // from a network blip.
          if (!res.ok) {
            throw new Error(`feedback POST failed: HTTP ${res.status}`);
          }
        })
        // Two sibling handlers, not then-catch: a throw inside the success
        // handler must not fall into the failure handler, which would tell the
        // user their feedback had not been sent when in fact it had.
        .then(
          () => {
            if (onScreen()) showFeedbackResult("Thank you");
          },
          (err: unknown) => {
            // The send log and the error render are wrapped, so a DOM throw while
            // rendering the error is logged here rather than mislabelled by the tail
            // catch.
            try {
              // The user walked away and we cancelled the request. That is not a
              // failure, and logging it as one makes a cancellation indistinguishable
              // from a real fault to anyone reading the console later.
              if (!onScreen() && controller.signal.aborted && !timedOut) return;
              console.error(
                timedOut ? "Feedback send timed out:" : "Feedback send failed:",
                err
              );
              if (onScreen()) {
                // On a timeout the request is out and we are waiting on an answer, so
                // "couldn't send" would assert the opposite of the likeliest truth and
                // invite the user to file the same feedback twice. Report the
                // observation, not a conclusion the code cannot support.
                showFeedbackError(
                  timedOut
                    ? "No answer from the server. Your feedback may already have been sent, so please check before sending it again."
                    : "Couldn't send, please try later"
                );
              }
            } catch (renderErr: unknown) {
              console.error("Feedback error failed to render:", renderErr);
            }
          }
        )
        // Reached when rendering the confirmation throws: the send succeeded, so log
        // it rather than report a failure that did not happen.
        .catch((err: unknown) =>
          console.error("Feedback confirmation failed to render:", err)
        )
        .finally(() => {
          clearTimeout(deadline);
          // Session-guarded: an abandoned send must not release the lock that a
          // send started in a later session is holding. The teardown that ended its
          // session already released the lock this send took.
          if (!onScreen()) return;
          feedbackAbort = undefined;
          feedbackSending = false;
          if (feedbackSubmit) feedbackSubmit.disabled = false;
        });
    });
  }

  window.addEventListener("resize", () => setVH());
}

export const exportedForTesting = {
  showFeedback,
  updateFeedbackContext,
  syncFeedbackRating,
  syncFeedbackMessage,
};
