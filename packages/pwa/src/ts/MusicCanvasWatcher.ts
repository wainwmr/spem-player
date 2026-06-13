// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import config from "./config";
import { MusicElement } from "./MusicElement";

export class MusicCanvasWatcher extends MusicElement {
  choiroutput: HTMLSpanElement | null = null;
  partoutput: HTMLSpanElement | null = null;
  baroutput: HTMLSpanElement | null = null;

  async connectedCallback() {
    super.connectedCallback();

    this.choiroutput = document.createElement("span");
    this.choiroutput.setAttribute("id", "choir-output");
    this.append(this.choiroutput);

    this.partoutput = document.createElement("span");
    this.partoutput.setAttribute("id", "part-output");
    this.append(this.partoutput);

    this.baroutput = document.createElement("span");
    this.baroutput.setAttribute("id", "bar-output");
    this.append(this.baroutput);

    const canvi = document.querySelectorAll("music-canvas");
    canvi.forEach((c) => {
      c.addEventListener(
        "music-canvas-hover",
        this.handleCanvasHover.bind(this) as (e: Event) => void
      );
    });
  }

  intId: ReturnType<typeof setTimeout> | null = null;

  handleCanvasHover(e: CustomEvent) {
    if (!this.choiroutput || !this.partoutput || !this.baroutput) return;
    const pos = e.detail.position;

    this.choiroutput.textContent = "Choir " + (pos.choir + 1);
    if (pos.part != "all") {
      this.partoutput.textContent = config.parts[pos.part];
    }
    this.baroutput.textContent = "Bar " + Math.floor(pos.bar);
    this.classList.remove("hide");
    if (this.intId) clearTimeout(this.intId);
    const self = this;
    this.intId = setTimeout(function () {
      self.classList.add("hide");
    }, 1500);
  }
}
