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

  playpausebutton: HTMLDivElement | null = null;
  svgLoading: SVGElement | null = null;
  svgPlay: SVGElement | null = null;
  svgPause: SVGElement | null = null;

  #isLooping = false;

  constructor() {
    super();
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    // Build a DIV with the play, pause and loading SVG icons
    this.playpausebutton = document.createElement("div");
    this.playpausebutton.setAttribute("id", "playpausebutton");
    this.playpausebutton.setAttribute("tabindex", "0");
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
      this.svgLoading.style.display = "none";
      this.playpausebutton.append(this.svgLoading);
    }
    if (this.svgPause) {
      this.svgPause.style.display = "none";
      this.playpausebutton.append(this.svgPause);
    }
    if (this.svgPlay) {
      this.svgPlay.style.display = "block";
      this.playpausebutton.append(this.svgPlay);
    }
    this.append(this.playpausebutton);

    // Build the choirs drop-down list
    var label = document.createElement("label");
    label.appendChild(document.createTextNode("Choir"));
    this.choirselect = document.createElement("select");
    this.choirselect.setAttribute("name", "choir");
    this.choirselect.setAttribute("id", "choir-select");
    this.choirselect.setAttribute("class", "control");
    for (var c in config.choirs[0]) {
      const opt = document.createElement("option");
      opt.setAttribute("value", c);
      opt.appendChild(document.createTextNode(config.choirs[0][c]));
      this.choirselect.append(opt);
    }
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
        this.bar = Math.min(this.bar, barCount - 1);
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
    // Load the new audio if necessary
    const newfile = this.getMP3filename();
    if (!this.isSameAudio(newfile)) {
      // set the play button spinner while loading audio
      this.playing = false;
      if (this.svgPlay && this.svgLoading && this.svgPause) {
        this.svgPlay.style.display = "none";
        this.svgPause.style.display = "none";
        this.svgLoading.style.display = "block";
      }
      this.fireEvent("music-controls-loading");

      // load the new audio
      this.audio.src = newfile;
      this.audio.load();
      this.audio.currentTime = getTimeFromBar(this.bar, this.recording);
    }

    try {
      await this.audio.play();
    } catch {
      if (this.svgPlay && this.svgLoading && this.svgPause) {
        this.svgPlay.style.display = "block";
        this.svgPause.style.display = "none";
        this.svgLoading.style.display = "none";
      }
      this.playing = false;
      return;
    }

    this.playing = true;
    if (this.svgPlay && this.svgLoading && this.svgPause) {
      this.svgPlay.style.display = "none";
      this.svgPause.style.display = "block";
      this.svgLoading.style.display = "none";
    }
    this.fireEvent("music-controls-playing");

    if (this.#isLooping) return;
    this.#isLooping = true;

    const self = this;

    function loop() {
      self.bar = getBarFromTime(self.audio.currentTime, self.recording);

      const intbar = Math.floor(self.bar);
      if (self.barinput && Number(self.barinput.value) != intbar) {
        self.barinput.value = String(intbar);
      }
      self.fireEvent("music-controls-changed");

      if (self.isPlaying()) {
        window.requestAnimationFrame(loop);
      } else {
        self.#isLooping = false;
      }
    }
    window.requestAnimationFrame(loop);
  }

  pause() {
    this.playing = false;
    this.#isLooping = false;
    if (this.svgPlay && this.svgLoading && this.svgPause) {
      this.svgPlay.style.display = "block";
      this.svgPause.style.display = "none";
      this.svgLoading.style.display = "none";
    }
    this.audio.pause();
    this.fireEvent("music-controls-paused");
  }

  setChoir(c: string | number) {
    if (!this.choirselect) return;
    super.setChoir(c);

    this.choirselect.value = String(this.choir);
    if (this.isPlaying()) this.play();
  }

  setRecording(v: number | string): void {
    super.setRecording(v);
    this.audio.currentTime = getTimeFromBar(this.bar, this.recording);
    if (this.isPlaying()) this.play();
  }

  setPart(p: string | number) {
    if (!this.partselect) return;
    super.setPart(p);

    this.partselect.value = String(p);
    if (this.isPlaying()) this.play();
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
