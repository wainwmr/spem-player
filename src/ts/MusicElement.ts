import { PartType, Position, config, toNum } from "./common";

export class MusicElement extends HTMLDivElement {

  // state
  choir: number = 0;
  voicePart: PartType = "all";
  bar: number = 0;
  playing: boolean = false;

  constructor() {
    super();
  }

  async connectedCallback() {
    console.log(this.constructor.name + ": added to page");
  }

  disconnectedCallback() {
    console.log(this.constructor.name + ": removed from page");
  }

  adoptedCallback() {
    console.log(this.constructor.name + ": moved to a new page");
  }

  async attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue == newValue) return;

    switch (name) {
      case "choir":
        this.setChoir(newValue);
        break;
      case "part":
        this.setPart(newValue);
        break;
      case "bar":
        this.setBar(newValue);
        break;
      case "playing":
        this.setPlaying(newValue);
        break;
      default:
        console.log("AudioControls: bad attribute: " + newValue);
        break;
    }
  }

  setChoir(c: string | number) {
    this.choir = toNum(c, true, config.choirs - 1);
  }

  setPart(p: string | number) {
    this.voicePart = typeof p == 'string' && p == 'all' ? 'all' : toNum(p, true, config.parts.length - 1);
  }

  setBar(b: string | number) {
    this.bar = toNum(b, false, 139); // HACK: 139
  }

  setPlaying(playing: string | boolean) {
    this.playing = typeof playing == 'string' && playing == 'true' || playing == true;
  }


  isPlaying(): boolean {
    return this.playing;
  }

  fireEvent(type: string, pos?: Position) {
    var position: Position = pos ? pos : {
      choir: this.choir,
      part: this.voicePart,
      bar: this.bar
    }
    const myEvent = new CustomEvent(type, {
      detail: { position: position },
      bubbles: true,
      cancelable: true,
      composed: false
    });
    this.dispatchEvent(myEvent);
  }

  static define(tag: string) {
    try {
      window.customElements.define(tag, this, { extends: "div" });
    } catch (err) {
      console.log(`Unable to (re)define ${tag}`);
    }
  }

}
