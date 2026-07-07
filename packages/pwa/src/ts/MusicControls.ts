// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import config from "./config";
import { getBarFromTime, getTimeFromBar } from "./common";
import { MusicElement } from "./MusicElement";
import { barCount } from "./lily";

import loadingSVG from "../icons/loading.svg?raw";
import pauseSVG from "../icons/pause.svg?raw";
import playSVG from "../icons/play.svg?raw";

export class MusicControls extends MusicElement {
  static observedAttributes = ["choir", "part", "bar", "playing", "recording"];

  audio = new Audio();

  recordingselect: HTMLSelectElement | null = null;
  choirselect: HTMLSelectElement | null = null;
  partselect: HTMLSelectElement | null = null;
  barinput: HTMLInputElement | null = null;

  playpausebutton: HTMLButtonElement | null = null;
  svgLoading: SVGElement | null = null;
  svgPlay: SVGElement | null = null;
  svgPause: SVGElement | null = null;

  #isLooping = false;
  #loopId = 0;

  // #loading is true while a play() call is awaiting audio.play() (the audio is
  // not yet audible but the user intends playback); #playGeneration tags each
  // play() call so a superseded one no-ops on resolve instead of flipping the UI
  // back to the stale file/state (#764).
  #playGeneration = 0;
  #loading = false;

  #showIcon(state: "play" | "pause" | "loading"): void {
    if (!this.svgPlay || !this.svgPause || !this.svgLoading) return;
    this.svgPlay.style.display = state === "play" ? "block" : "none";
    this.svgPause.style.display = state === "pause" ? "block" : "none";
    this.svgLoading.style.display = state === "loading" ? "block" : "none";
  }

  constructor() {
    super();
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    // Build a BUTTON with the play, pause and loading SVG icons. A native
    // <button> is keyboard-activatable (Enter/Space fire the click handler) and
    // exposes the button role and accessible name, unlike the old <div> (#634).
    // Keep class="control" so the global key handler in packages/pwa/index.ts
    // returns early and does not toggle playback a second time via its
    // page-level keydown shortcut.
    this.playpausebutton = document.createElement("button");
    this.playpausebutton.setAttribute("id", "playpausebutton");
    this.playpausebutton.setAttribute("type", "button");
    this.playpausebutton.setAttribute("aria-label", "Play or pause");
    this.playpausebutton.setAttribute("class", "control");
    this.svgLoading = new DOMParser()
      .parseFromString(loadingSVG, "image/svg+xml")
      .querySelector("svg");
    this.svgPause = new DOMParser()
      .parseFromString(pauseSVG, "image/svg+xml")
      .querySelector("svg");
    this.svgPlay = new DOMParser()
      .parseFromString(playSVG, "image/svg+xml")
      .querySelector("svg");
    if (this.svgLoading) {
      this.playpausebutton.append(this.svgLoading);
    }
    if (this.svgPause) {
      this.playpausebutton.append(this.svgPause);
    }
    if (this.svgPlay) {
      this.playpausebutton.append(this.svgPlay);
    }
    this.#showIcon("play");
    this.append(this.playpausebutton);

    // Build the choirs drop-down list
    var label = document.createElement("label");
    label.appendChild(document.createTextNode("Choir"));
    this.choirselect = document.createElement("select");
    this.choirselect.setAttribute("name", "choir");
    this.choirselect.setAttribute("id", "choir-select");
    this.choirselect.setAttribute("class", "control");
    this.#buildChoirDropdown();
    label.append(this.choirselect);
    this.append(label);

    // Build the parts drop-down list
    label = document.createElement("label");
    label.appendChild(document.createTextNode("Part"));
    this.partselect = document.createElement("select");
    this.partselect.setAttribute("name", "part");
    this.partselect.setAttribute("id", "part-select");
    this.partselect.setAttribute("class", "control");
    const opt = document.createElement("option");
    opt.setAttribute("value", "all");
    opt.appendChild(document.createTextNode("All"));
    this.partselect.append(opt);
    for (var p = 0; p < config.parts.length; p++) {
      const opt = document.createElement("option");
      opt.setAttribute("value", String(p));
      opt.appendChild(document.createTextNode(config.parts[p]));
      this.partselect.append(opt);
    }
    label.append(this.partselect);
    this.append(label);

    // Build the bar input field
    label = document.createElement("label");
    label.appendChild(document.createTextNode("Bar"));
    this.barinput = document.createElement("input");
    this.barinput.setAttribute("name", "bar");
    this.barinput.setAttribute("type", "number");
    this.barinput.setAttribute("id", "bar-field");
    this.barinput.setAttribute("value", "0");
    this.barinput.setAttribute("min", "0");
    this.barinput.setAttribute("max", String(barCount));
    this.barinput.setAttribute("class", "control");
    label.append(this.barinput);
    this.append(label);

    this.choirselect.addEventListener(
      "change",
      this.#handleControlsChanged.bind(this)
    );
    this.partselect.addEventListener(
      "change",
      this.#handleControlsChanged.bind(this)
    );
    this.barinput.addEventListener(
      "change",
      this.#handleControlsChanged.bind(this)
    );
    this.barinput.addEventListener("keydown", (e) => {
      const allowed = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Tab",
        "Enter",
        "Escape",
        "Home",
        "End",
      ];
      if (allowed.includes(e.key) || /^[0-9]$/.test(e.key)) {
        return;
      }
      e.preventDefault();
    });
    if (this.playpausebutton)
      this.playpausebutton.addEventListener("click", this.playpause.bind(this));
    this.audio.addEventListener("ended", () => this.pause());
  }

  #buildChoirDropdown() {
    if (!this.choirselect) return;
    // Invariant: every recording's choir list is the same length, so the
    // selected index (`this.choir`, restored below via `.value`) is always a
    // valid option after a rebuild. All recordings have 8 choirs today; a
    // future recording with a different count would make `.value` silently
    // fail to select. A length-parity assertion is tracked in #504.
    this.choirselect.innerHTML = "";
    for (var c in config.choirs[this.recording]) {
      const opt = document.createElement("option");
      opt.setAttribute("value", c);
      opt.appendChild(
        document.createTextNode(config.choirs[this.recording][c])
      );
      this.choirselect.append(opt);
    }
    this.choirselect.value = String(this.choir);
  }

  async #handleControlsChanged() {
    if (!this.barinput || !this.partselect || !this.choirselect) return;
    this.choir = Number(this.choirselect.value);
    this.voicePart =
      this.partselect.value == "all" ? "all" : Number(this.partselect.value);

    const raw = this.barinput.value;
    const parsed = Number(raw);
    if (Number.isNaN(parsed) || raw === "") {
      this.bar = 0;
    } else {
      this.bar = Math.max(0, parsed);
      if (barCount > 0) {
        this.bar = Math.min(this.bar, barCount);
      }
    }
    this.barinput.value = String(this.bar);
    this.fireEvent("music-controls-changed");
  }

  playpause() {
    if (!this.playing) {
      this.play();
    } else {
      this.pause();
    }
  }

  // Returns true if the filename of the current audio source the same as that of the new (input) filename?
  isSameAudio(file: string): boolean {
    const thisrecording = this.audio.src.split("/").slice(-2, -1)[0];
    const thatrecording = file.split("/").slice(-2, -1)[0];
    if (thisrecording != thatrecording) return false; // different recordings, so definitely not the same audio

    const thisfile = this.audio.src.split("/").pop();
    const thatfile = file.split("/").pop();
    return thisfile == thatfile;
  }

  getMP3filename() {
    var newfile = "default";
    if (
      this.choir >= 0 &&
      this.choir < config.choirs[0].length &&
      this.voicePart != "all"
    ) {
      newfile =
        "Choir " + (this.choir + 1) + "-" + config.parts[this.voicePart];
    }
    return (
      config.audio_prefix +
      config.recording[this.recording] +
      "/" +
      newfile +
      ".mp3"
    );
  }

  async play() {
    // Tag this call so a later play() (or pause) can supersede it: a control
    // change arriving during the load window starts its own play(), and only
    // the latest call may update the UI when it resolves (#764).
    const gen = ++this.#playGeneration;

    // Load the new audio if necessary
    const newfile = this.getMP3filename();
    if (!this.isSameAudio(newfile)) {
      // set the play button spinner while loading audio
      this.playing = false;
      this.#showIcon("loading");
      this.fireEvent("music-controls-loading");

      // load the new audio
      this.audio.src = newfile;
      this.audio.load();
      this.audio.currentTime = getTimeFromBar(this.bar, this.recording);
    }

    this.#loading = true;

    try {
      await this.audio.play();
    } catch {
      // A superseded call (a mid-load control change bumped the generation)
      // leaves the UI to the newer call; only the current call resets on a
      // genuine reject (e.g. autoplay blocked).
      if (gen !== this.#playGeneration) return;
      this.#showIcon("play");
      this.playing = false;
      this.#loading = false;
      return;
    }

    // A control change (or pause) during the load window bumped the generation;
    // that newer call owns the state, so this stale resolution stops here.
    if (gen !== this.#playGeneration) return;
    this.playing = true;
    this.#showIcon("pause");
    this.fireEvent("music-controls-playing");
    this.#loading = false;

    if (this.#isLooping) return;
    this.#isLooping = true;

    const loop = () => {
      this.bar = getBarFromTime(this.audio.currentTime, this.recording);

      const intbar = Math.floor(this.bar);
      if (this.barinput && Number(this.barinput.value) != intbar) {
        this.barinput.value = String(intbar);
      }
      this.fireEvent("music-controls-changed");

      if (this.isPlaying()) {
        this.#loopId = window.requestAnimationFrame(loop);
      } else {
        this.#isLooping = false;
      }
    };
    this.#loopId = window.requestAnimationFrame(loop);
  }

  // The user intends playback either while audio is audible (playing) or while a
  // play() call is still awaiting audio.play() (#loading, not yet audible). The
  // reload guards fire on this, so a mid-load control change reloads (#764).
  #intendsToPlay(): boolean {
    return this.playing || this.#loading;
  }

  pause() {
    this.playing = false;
    // Bumping the generation makes any in-flight play()'s resolution guard fail,
    // so its await no-ops instead of flipping the UI back to "playing". Clearing
    // #loading separately resets #intendsToPlay() so a control change after this
    // pause does not restart playback (#764).
    this.#playGeneration++;
    this.#loading = false;
    this.#isLooping = false;
    window.cancelAnimationFrame(this.#loopId);
    this.#showIcon("play");
    this.audio.pause();
    this.fireEvent("music-controls-paused");
  }

  setChoir(c: string | number) {
    if (!this.choirselect) return;
    super.setChoir(c);

    this.choirselect.value = String(this.choir);
    if (this.#intendsToPlay()) this.play();
  }

  setRecording(v: number | string): void {
    super.setRecording(v);
    this.#buildChoirDropdown();
    this.audio.currentTime = getTimeFromBar(this.bar, this.recording);
    if (this.#intendsToPlay()) this.play();
  }

  setPart(p: string | number) {
    if (!this.partselect) return;
    super.setPart(p);

    this.partselect.value = String(p);
    if (this.#intendsToPlay()) this.play();
  }

  setBar(b: string | number) {
    if (!this.barinput) return;
    const intbar = Number(b);
    if (intbar === this.bar) return;
    super.setBar(b);

    this.bar = intbar;
    this.audio.currentTime = getTimeFromBar(this.bar, this.recording);

    this.barinput.value = String(Math.floor(this.bar));
  }

  setPlaying(playing: string | boolean) {
    super.setPlaying(playing);
    if (this.playing) {
      this.play();
    } else {
      this.pause();
    }
  }
}
