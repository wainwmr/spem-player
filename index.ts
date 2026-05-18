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
  status: "paused",
};

// TODO: Change dark mode to moon/sun icons
// TODO: Better font/graphic for Spem Player title
// BUG: can scroll up and down a tiny bit in score
// BUG: [Violation] Forced reflow while executing JavaScript took 36ms  (this doesn't happen when you have already manually adjusted the height of the score - something to do with the flex: 1 after the reload?)
// TODO: build: minimse SVGs using <use> and <defs> elements
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
  if (classes.includes("control") && !e.altKey) {
    return;
  }
  // don't handle keyboard events if composing text (chinese characters)
  if (e.isComposing) {
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
  if (e.altKey && e.code === "KeyB") {
    e.preventDefault();
    const barInput = document.getElementById(
      "bar-field"
    ) as HTMLInputElement;
    if (barInput) {
      controls.pause();
      const active = document.activeElement;
      if (
        active &&
        active !== document.body &&
        active !== document.documentElement
      ) {
        controls.setReturnFocus(active);
      } else {
        controls.setReturnFocus(null);
      }
      barInput.focus();
      barInput.select();
    }
    return;
  }
  if (e.code == "Enter") {
    controls.isPlaying() ? controls.pause() : controls.play();
    return;
  }
  if (e.code == "Space") {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }
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
    case "Slash":
      if (e.shiftKey) {
        showHelp();
      }
      break;
    case "Escape":
      showHelp(false);
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
  backdrop.addEventListener("click", () => showHelp(false));
  darkswitch.addEventListener("click", () => toggleDark());
  scoreswitch.addEventListener("click", () => toggleScore());
  recordingswitch.addEventListener("click", () => toggleRecording());

  window.addEventListener("resize", () => setVH());
}
