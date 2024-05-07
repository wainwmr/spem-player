import { Position, State, config } from "./ensemble";

type SvgInHtml = HTMLElement & SVGElement;

// HACK: this is also in /spem.json and index.ts - make you your mind.


export class AudioControls extends HTMLDivElement {
  static observedAttributes = ["choir", "part", "bar"];

  audio = new Audio();

  current: State = {
    viewmode: "dark",
    period: "modern",
    choir: 0,
    part: "all",
    bar: 0,
    status: "paused"
  }

  choirselect = document.getElementById('choir-select') as HTMLSelectElement;
  partselect = document.getElementById('part-select') as HTMLSelectElement;
  barinput = document.getElementById('bar-field') as HTMLInputElement;
  playpausebutton = document.getElementById('playpausebutton') as HTMLDivElement;
  playpauseicon = document.getElementById('playpauseicon') as HTMLSpanElement;
  spinner = document.getElementById('spinner') as SvgInHtml;

  constructor() {
    super();

    this.playpausebutton.addEventListener('click', this.playpause.bind(this));

    [this.choirselect,
    this.partselect,
    this.barinput].forEach(el => el.addEventListener('change', this.fireChangeEvent.bind(this)));
  };

  playpause() {
    if (this.current.status == "paused") {
      this.play();
    }
    else {
      this.pause();
    }
  }

  isPlaying(): boolean {
    return this.current.status == "playing";
  }

  // Returns true if the filename of the current audio source the same as that of the new (input) filename?
  isSameAudio(file: string): boolean {
    return (file.split("/").pop() == this.audio.currentSrc.split("/").pop());
  }

  getMP3filename() {
    var newfile = "default";
    if (this.current.choir >= 0 && 
      this.current.choir < config.choirs && 
      this.current.part != "all") {
      newfile = "Choir " + (this.current.choir + 1) + "-" + config.parts[this.current.part];
    }
    return config.audio_prefix + newfile + ".mp3";
  }


  async play() {
    // Load the new audio if necessary
    const newfile = this.getMP3filename();
    if (!this.isSameAudio(newfile)) {

      console.log("AudioControls: loading:", newfile);
      // set the play button spinner while loading audio
      this.current.status = "loading";
      this.playpauseicon.style.display = "none";
      this.spinner.style.display = "block";
      this.fireEvent('audio-controls-loading');

      // load the new audio
      this.audio.src = newfile;
      this.audio.load();
      this.audio.currentTime = this.current.bar * config.tempo;
    }

    await this.audio.play();

    this.current.status = "playing";
    this.spinner.style.display = "none";
    this.playpauseicon.classList.remove("paused");
    this.playpauseicon.style.display = "block";
    this.fireEvent('audio-controls-playing');

    const self = this;
    function frame() {
      self.current.bar = self.audio.currentTime / config.tempo;
      const intbar = Math.floor(self.current.bar);
      if (Number(self.barinput.value) != intbar) {
        self.barinput.value = String(intbar);
      }
      if (self.isPlaying()) {
        // window.requestAnimationFrame(frame);
        setTimeout(frame, config.tempo / 10);
      }
    }
    // window.requestAnimationFrame(frame);
    setTimeout(frame, config.tempo / 10);
  }

  pause() {
    this.current.status = "paused";
    this.spinner.style.display = "none";
    this.playpauseicon.style.display = "block";
    this.playpauseicon.classList.add("paused");
    this.audio.pause();
    this.fireEvent('audio-controls-paused');
  }

  fireChangeEvent() {
    this.current.choir = Number(this.choirselect.value);
    this.current.part = this.partselect.value == "all" ? "all" : Number(this.partselect.value);
    this.current.bar = Number(this.barinput.value);
    this.fireEvent('audio-controls-change');
  }

  fireEvent(type: string) {
    var position: Position = {
      choir: this.current.choir,
      part: this.current.part,
      bar: this.current.bar
    }
    console.log(`AudioControls firing ${type}`, position);
    const myEvent = new CustomEvent(type, {
      detail: { position: position },
      bubbles: true,
      cancelable: true,
      composed: false
    });
    this.dispatchEvent(myEvent);
  }

  async connectedCallback() {
    console.log("AudioControls: added to page.");
  }

  disconnectedCallback() {
    console.log("AudioControls: removed from page.");
  }

  adoptedCallback() {
    console.log("AudioControls: moved to new page.");
  }

  async attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue == newValue) return;

    console.log(`AudioControls: ${name} changed from ${oldValue} to ${newValue}`);
    switch (name) {
      case "choir":
        this.current.choir = Number(newValue);
        this.choirselect.value = newValue;
        if (this.isPlaying()) this.play();
        break;
      case "part":
        this.current.part = newValue == "all" ? "all" : Number(newValue);
        this.partselect.value = newValue;
        if (this.isPlaying()) this.play();
        break;
      case "bar":
        this.current.bar = Number(newValue);
        if (!this.isPlaying) {
          this.audio.currentTime = this.current.bar * config.tempo;
        }
        this.barinput.value = newValue;
        break;
      default:
        console.log("AudioControls: bad attribute: " + newValue);
        break;
    }
  }
}



customElements.define("audio-controls", AudioControls, { extends: "div" });