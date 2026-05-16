// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import "./src/scss/style.scss";

import config from "./src/ts/config";

import { PartType, State, colors, toNum } from "./src/ts/common";

import { MusicCanvas } from "./src/ts/MusicCanvas";
import { MusicCanvasWatcher } from "./src/ts/MusicCanvasWatcher";
import { MusicControls } from "./src/ts/MusicControls";
import { MusicScore } from "./src/ts/MusicScore";

import recordingswitchSvg from "./src/icons/recordingswitch.svg?raw";
import scoreswitchSvg from "./src/icons/scoreswitch.svg?raw";
import darkswitchSvg from "./src/icons/darkswitch.svg?raw";
import feedbackSvg from "./src/icons/feedback.svg?raw";

MusicCanvas.define("music-canvas");
MusicCanvasWatcher.define("music-canvas-watcher");
MusicControls.define("music-controls");
MusicScore.define("music-score");

const container = document.querySelector(".split-container");
const score = document.querySelector("music-score") as MusicScore;
const splitter = document.querySelector(".splitter") as HTMLDivElement;
const canvas = document.querySelector("music-canvas") as MusicCanvas;
const controls = document.querySelector("music-controls") as MusicControls;

const info = document.getElementById("info") as HTMLSpanElement;
const help = document.getElementById("help") as HTMLDivElement;
const backdrop = document.getElementById("backdrop") as HTMLDivElement;
const feedbackTrigger = document.getElementById("feedback-trigger") as HTMLSpanElement;
const feedbackIcon = document.getElementById("feedback-icon") as HTMLSpanElement;
const feedbackModal = document.getElementById("feedback-modal") as HTMLDivElement;
const feedbackCancel = document.getElementById("feedback-cancel") as HTMLButtonElement;
const feedbackMessage = document.getElementById("feedback-message") as HTMLTextAreaElement;
const feedbackResult = document.getElementById("feedback-result") as HTMLDivElement;
const feedbackForm = document.getElementById("feedback-form") as HTMLFormElement;
const hiddenFeedbackForm = document.querySelector('form[name="feedback"]') as HTMLFormElement;
const darkswitch = document.getElementById("darkswitch") as HTMLElement;
const scoreswitch = document.getElementById("scoreswitch") as HTMLElement;
const recordingswitch = document.getElementById(
  "recordingswitch"
) as HTMLElement;
const recordinglabel = document.getElementById(
  "recordinglabel"
) as HTMLSpanElement;

recordingswitch.innerHTML = recordingswitchSvg;
scoreswitch.innerHTML = scoreswitchSvg;
darkswitch.innerHTML = darkswitchSvg;
if (feedbackIcon) {
  feedbackIcon.innerHTML = feedbackSvg;
}

let isDragging = false;

var current: State = {
  recording: 0, // 0 = ALC, 1 = CotE
  viewmode: "dark",
  period: "modern",
  choir: 0,
  part: "all",
  bar: 0,
  status: "paused",
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
  document.body.style.cursor = "col.resize";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const containerRect = container?.getBoundingClientRect();
  if (!containerRect) return;
  let newHeight = e.clientY - containerRect.top;
  newHeight = Math.max(100, Math.min(newHeight, containerRect.height - 100));
  score.style.height = `${newHeight}px`;
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  document.body.style.cursor = "";
});

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
  const url = window.location.search.substring(1);
  const parms = url.split("&");

  var recording = 0; // ALC
  var choir = 0; // choir 1 because it is zero indexed
  var part: PartType = "all";
  var bar = 1 - config.intro_beats[recording] / 4;
  var dark = true; // dark mode by default
  var early = false;
  var r = 0; // ALC

  for (let i = 0; i < parms.length; i++) {
    const parm = parms[i].split("=");
    if (parm[0] == "choir") {
      choir = Number(parm[1]);
    } else if (parm[0] == "part") {
      const n: number = Number(parm[1]);
      if (n >= 0 && n < config.parts.length) part = n;
    } else if (parm[0] == "bar") {
      bar = Number(parm[1]);
    } else if (parm[0] == "dark") {
      dark = true;
    } else if (parm[0] == "recording") {
      if (parm[1] == "alc") r = 0;
      else r = 1;
    } else if (parm[0] == "score") {
      early = parm[1] == "early";
    }
  }
  setRecording(r);
  setChoir(choir, true);
  setPart(part);
  setBar(bar);
  if (early) {
    toggleScore();
  }
  if (!dark) {
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

function handleControlChange(e: CustomEvent) {
  const pos = e.detail.position;
  setChoir(Number(pos.choir));
  setPart(pos.part == "all" ? "all" : Number(pos.part));
  setBar(Number(pos.bar));
}

// -----------------------------------------------------
// Keyboard events (wasd)
// -----------------------------------------------------

function keyboardTapped(e: KeyboardEvent) {
  if (e === undefined || e.target === null) {
    return keyboardTapped;
  }

  // Ensure e.target is an Element before accessing classList
  if (!(e.target instanceof Element)) {
    return;
  }

  // don't handle keyboard events on the four control widgets
  // cos it messes with the UI interaction
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
  if (e.code == "Enter") {
    controls.isPlaying() ? controls.pause() : controls.play();
    return;
  }
  if (e.code == "Space") {
    controls.isPlaying() ? controls.pause() : controls.play();
    e.preventDefault();
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
    case "KeyB":
      setPart("satrb".indexOf(String(e.key).toLowerCase()));
      break;
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
      e.preventDefault();
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
      e.preventDefault();
      break;
    case "ArrowLeft":
      controls.pause();
      setBar(
        e.altKey ? toNum(current.bar, false) - 0.0625 : toNum(current.bar) - 1
      );
      e.preventDefault();
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

function showFeedback(show = true) {
  if (!feedbackModal) return;
  if (show) {
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

function resetFeedbackForm() {
  if (feedbackForm) {
    feedbackForm.style.display = "";
    feedbackForm.reset();
    syncFeedbackRating();
    syncFeedbackMessage();
  }
  if (feedbackResult) {
    feedbackResult.style.display = "none";
    feedbackResult.textContent = "";
  }
}

function showFeedbackResult(message: string) {
  if (feedbackForm) feedbackForm.style.display = "none";
  if (feedbackResult) {
    feedbackResult.textContent = message;
    feedbackResult.style.display = "flex";
  }
  setTimeout(() => showFeedback(false), 1500);
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
    status: current.status,
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
  r = toNum(r, false, config.recording.length - 1);

  current.recording = r;
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

function handleCanvasClick(e: CustomEvent) {
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

  score.addEventListener(
    "music-score-click",
    handleControlChange as (e: Event) => void
  );

  controls.addEventListener(
    "music-controls-changed",
    handleControlChange as (e: Event) => void
  );
  controls.addEventListener(
    "music-controls-playing",
    handleAudioPlaying as (e: Event) => void
  );
  controls.addEventListener(
    "music-controls-paused",
    handleAudioPaused as (e: Event) => void
  );

  canvas.addEventListener(
    "music-canvas-click",
    handleCanvasClick as (e: Event) => void
  );
  canvas.addEventListener(
    "music-canvas-touchstart",
    handleCanvasClick as (e: Event) => void
  );
  canvas.addEventListener(
    "music-canvas-touchmove",
    handleCanvasClick as (e: Event) => void
  );

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
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data.toString(),
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          showFeedbackResult("Thank you");
        })
        .catch(() => showFeedbackResult("Couldn't send, please try later"));
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
