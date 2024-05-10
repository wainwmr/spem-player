import { config, MusicElement } from "./common";

type SvgInHtml = HTMLElement & SVGElement;

export class AudioControls extends MusicElement {
  static observedAttributes = [ "choir", "part", "bar" ];

  audio = new Audio();

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
    this.barinput].forEach(el => el.addEventListener('change', this.#handleControlsChanged.bind(this)));
  };

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
      if (Number(self.barinput.value) != intbar) {
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
    this.choir = Number(this.choirselect.value);
    this.voicePart = this.partselect.value == "all" ? "all" : Number(this.partselect.value);
    this.bar = Number(this.barinput.value);
    this.fireEvent('audio-controls-changed');
  }

  setChoir(c: string | number) {
    super.setChoir(c);
    console.log(`AudioControls: changing choir to ${this.choir}`);

    this.choirselect.value = String(this.choir);
    if (this.isPlaying()) this.play();
  }

  setPart(p: string | number) {
    super.setPart(p);
    console.log(`AudioControls: changing part to ${this.part}`);

    this.partselect.value = String(p);
    if (this.isPlaying()) this.play();
  }

  setBar(b: string | number) {
    const intbar = Number(b);
    if (intbar === this.bar) return;
    super.setBar(b);
    console.log(`AudioControls: changing bar to ${b}`);

    this.bar = intbar;
    this.audio.currentTime = this.bar * config.tempo;
    this.barinput.value = String(this.bar);
  }
}

AudioControls.define("audio-controls");