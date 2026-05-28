// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import config from "./config";
import {
  PartType,
  Position,
  toNum,
  RecordingIndex,
  toRecordingIndex,
} from "./common";

export class MusicElement extends HTMLElement {
  // state
  recording: RecordingIndex = 0; // 0 = ALC, 1 = CotE
  choir: number = 0;
  voicePart: PartType = "all";
  bar: number = 0;
  playing: boolean = false;

  constructor() {
    super();
  }

  async connectedCallback() {}

  disconnectedCallback() {}

  adoptedCallback() {}

  async attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ) {
    if (oldValue == newValue) return;

    switch (name) {
      case "recording":
        this.setRecording(newValue);
        break;
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
        break;
    }
  }

  setChoir(c: string | number) {
    this.choir = toNum(c, true, config.choirs[0].length - 1);
    this.fireEvent("music-controls-changed");
  }

  setPart(p: string | number) {
    this.voicePart =
      typeof p == "string" && p == "all"
        ? "all"
        : toNum(p, true, config.parts.length - 1);
    this.fireEvent("music-controls-changed");
  }

  setBar(b: string | number) {
    this.bar = toNum(b, false);
    this.fireEvent("music-controls-changed");
  }

  setPlaying(playing: string | boolean) {
    this.playing =
      (typeof playing == "string" && playing == "true") || playing == true;
    this.fireEvent("music-controls-changed");
  }

  setRecording(v: number | string) {
    this.recording = toRecordingIndex(v);
    this.fireEvent("music-controls-changed");
  }

  isPlaying(): boolean {
    return this.playing;
  }

  fireEvent(type: string, pos?: Position) {
    var position: Position = pos
      ? pos
      : {
          choir: this.choir,
          part: this.voicePart,
          bar: this.bar,
        };
    const myEvent = new CustomEvent(type, {
      detail: { position: position },
      bubbles: true,
      cancelable: true,
      composed: false,
    });
    this.dispatchEvent(myEvent);
  }

  static define(tag: string) {
    try {
      window.customElements.define(tag, this);
      // window.customElements.define(tag, this, { extends: "div" });
    } catch {
      /* empty: custom element may already be defined */
    }
  }
}
