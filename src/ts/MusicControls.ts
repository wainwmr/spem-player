import config from "./config";
import { MusicElement } from "./MusicElement";

type SvgInHtml = HTMLElement & SVGElement;

export class MusicControls extends MusicElement {
  static observedAttributes = ["choir", "part", "bar"];

  audio = new Audio();

  choirselect: HTMLSelectElement | null = null;
  partselect: HTMLSelectElement | null = null;
  barinput: HTMLInputElement | null = null;

  playpausebutton = document.getElementById('playpausebutton') as HTMLDivElement;
  playpauseicon = document.getElementById('playpauseicon') as HTMLSpanElement;
  spinner = document.getElementById('spinner') as SvgInHtml;

  constructor() {
    super();

    this.playpausebutton.addEventListener('click', this.playpause.bind(this));

  };

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    // Build the choirs drop-down list
    var label = document.createElement("label");
    label.appendChild(document.createTextNode("Choir"));
    this.choirselect = document.createElement("select");
    this.choirselect.setAttribute("name", "choir");
    this.choirselect.setAttribute("id", "choir-select");
    for (var c = 0; c < config.choirs; c++) {
      const opt = document.createElement("option");
      opt.setAttribute("value", String(c));
      opt.appendChild(document.createTextNode(String(c + 1)))
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
    const opt = document.createElement("option");
    opt.setAttribute("value", "all");
    opt.appendChild(document.createTextNode("All"));
    this.partselect.append(opt);
    for (var p = 0; p < config.parts.length; p++) {
      const opt = document.createElement("option");
      opt.setAttribute("value", String(p));
      opt.appendChild(document.createTextNode(config.parts[p]))
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
    this.barinput.setAttribute("max", "138"); // HACK : 138
    label.append(this.barinput);
    this.append(label);

    this.choirselect.addEventListener("change", this.#handleControlsChanged.bind(this));
    this.partselect.addEventListener("change", this.#handleControlsChanged.bind(this));
    this.barinput.addEventListener("change", this.#handleControlsChanged.bind(this));
  }

  playpause() {
    if (!this.playing) {
      this.play();
    }
    else {
      this.pause();
    }
  }

  // Returns true if the filename of the current audio source the same as that of the new (input) filename?
  isSameAudio(file: string): boolean {
    return (file.split("/").pop() == this.audio.currentSrc.split("/").pop());
  }

  getMP3filename() {
    var newfile = "default";
    if (this.choir >= 0 &&
      this.choir < config.choirs &&
      this.voicePart != "all") {
      newfile = "Choir " + (this.choir + 1) + "-" + config.parts[this.voicePart];
    }
    return config.audio_prefix + newfile + ".mp3";
  }


  async play() {
    // Load the new audio if necessary
    const newfile = this.getMP3filename();
    if (!this.isSameAudio(newfile)) {

      console.log("AudioControls: loading:", newfile);
      // set the play button spinner while loading audio
      this.playing = false;
      this.playpauseicon.style.display = "none";
      this.spinner.style.display = "block";
      this.fireEvent('audio-controls-loading');

      // load the new audio
      this.audio.src = newfile;
      this.audio.load();
      this.audio.currentTime = this.bar * config.tempo;
    }

    await this.audio.play();

    this.playing = true;
    this.spinner.style.display = "none";
    this.playpauseicon.classList.remove("paused");
    this.playpauseicon.style.display = "block";
    this.fireEvent('audio-controls-playing');

    const self = this;
    function loop() {
      self.bar = self.audio.currentTime / config.tempo;
      const intbar = Math.floor(self.bar);
      if (self.barinput && Number(self.barinput.value) != intbar) {
        self.barinput.value = String(intbar);
      }
      self.fireEvent('audio-controls-changed');

      if (self.isPlaying()) {
        window.requestAnimationFrame(loop);
        // setTimeout(frame, config.tempo / 10);
      }
    }
    window.requestAnimationFrame(loop);
    // setTimeout(frame, config.tempo / 10);
  }

  pause() {
    this.playing = false;
    this.spinner.style.display = "none";
    this.playpauseicon.style.display = "block";
    this.playpauseicon.classList.add("paused");
    this.audio.pause();
    this.fireEvent('audio-controls-paused');
  }

  #handleControlsChanged() {
    if (!this.barinput || !this.partselect || !this.choirselect) return;
    this.choir = Number(this.choirselect.value);
    this.voicePart = this.partselect.value == "all" ? "all" : Number(this.partselect.value);
    this.bar = Number(this.barinput.value);
    this.fireEvent('audio-controls-changed');
  }

  setChoir(c: string | number) {
    if (!this.choirselect) return;
    super.setChoir(c);
    console.log(`MusicControls: changing choir to ${this.choir}`);

    this.choirselect.value = String(this.choir);
    if (this.isPlaying()) this.play();
  }

  setPart(p: string | number) {
    if (!this.partselect) return;
    super.setPart(p);
    console.log(`MusicControls: changing part to ${this.part}`);
    
    this.partselect.value = String(p);
    if (this.isPlaying()) this.play();
  }
  
  setBar(b: string | number) {
    if (!this.barinput) return;
    const intbar = Number(b);
    if (intbar === this.bar) return;
    super.setBar(b);
    console.log(`MusicControls: changing bar to ${b}`);

    this.bar = intbar;
    this.audio.currentTime = this.bar * config.tempo;
    this.barinput.value = String(this.bar);
  }
}