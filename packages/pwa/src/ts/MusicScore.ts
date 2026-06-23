// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import config from "./config";
import { colors, toNum, TestSvgLoader } from "./common";

import { MusicElement } from "./MusicElement";

export class MusicScore extends MusicElement {
  static observedAttributes = ["choir", "part", "bar", "playing", "score-type"];

  /**
   * Test-only hook: when set, #loadSvg() bypasses the dynamic import and
   * uses this function instead. Tests set this to return fixture SVGs so
   * the suite can run without real score files on disk.
   *
   * There is a parallel `globalThis.__SPEM_TEST_SVG_LOADER` channel that
   * #loadSvg() checks as a fallback — used by `src/test/setup.ts` because
   * `vi.resetModules()` would otherwise lose this static. Both checks are
   * gated behind `import.meta.env.MODE === "test"` so production bundles
   * never invoke the hook (the slot remains as inert payload).
   */
  static testSvgLoader: TestSvgLoader | null = null;

  svg: SVGGraphicsElement | null = null;
  svgWidth: number = 0;
  svgHeight: number = 0;

  scoreType: string = "modern";

  /**
   * x-coordinates of the bar lines in the SVG, populated by `getBars()`.
   * `bars[0]` is always `0` (the intro bar's left edge); `bars[bars.length - 1]`
   * is always `svgWidth` (the score's right edge); interior values are the
   * x-coords of numbered bar labels parsed from `<tspan>` elements. The intro
   * region is `[0, bars[1])`; numbered bar N's label sits at `bars[N]`.
   */
  bars: number[] = [];

  highlightBar: SVGRectElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  highlightPosition: SVGRectElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  highlightPart: SVGRectElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  highlightMask: SVGMaskElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "mask"
  );
  maskRect!: SVGRectElement;
  maskLine!: SVGLineElement;
  scrollArea: HTMLDivElement | null = null;
  #loadGeneration = 0;
  clefOverlay: HTMLDivElement | null = null;

  // Cached layout dimensions, null until first validly measured. Reading these
  // avoids a per-frame forced reflow of the large score SVG during playback
  // (#692). #frameWidth (the visible frame width = offsetWidth) is measured at
  // connect (cached only once layout gives a non-zero width) and refreshed on
  // element resize. #scoreWidth (the rendered SVG width) is refreshed on score
  // load AND on element resize, and invalidated on score change: the SVG is
  // height:100% with no width, so its width is height-driven, and a splitter
  // drag changes the panel height. Both fall back to a live read while null, so
  // a 0 measurement (no layout yet) is never cached.
  #frameWidth: number | null = null;
  #scoreWidth: number | null = null;
  #resizeObserver: ResizeObserver | null = null;

  constructor() {
    super();
  }

  async connectedCallback() {
    super.connectedCallback();

    this.#measureFrameWidth();
    if (typeof ResizeObserver !== "undefined") {
      this.#resizeObserver = new ResizeObserver(() => {
        // A resize can change both the frame width (window resize) and the
        // score width (a splitter drag changes the panel height, hence the
        // height-driven SVG width — #692).
        this.#measureFrameWidth();
        this.#measureScoreWidth();
      });
      this.#resizeObserver.observe(this);
    }

    this.highlightPosition.setAttribute("id", "hPos");
    this.highlightPosition.setAttribute("x", "0");
    this.highlightPosition.setAttribute("y", "0");
    this.highlightPosition.setAttribute("width", "0");
    this.highlightPosition.setAttribute("height", "0"); // Will be set later when we know the height of the SVG
    this.highlightPosition.style.fill = colors().scoreHighlight;
    this.highlightPosition.style.fillOpacity = "0"; // initially invisible
    this.highlightPosition.style.strokeWidth = "5px"; //Set stroke width

    this.highlightMask.setAttribute("id", "hPosMask");
    this.highlightMask.setAttribute("maskUnits", "userSpaceOnUse");
    this.maskRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    this.maskRect.setAttribute("width", "7");
    this.maskRect.setAttribute("height", "0");
    this.maskRect.setAttribute("fill", "white");
    this.maskLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    this.maskLine.setAttribute("y1", "0");
    this.maskLine.setAttribute("y2", "0");
    this.maskLine.setAttribute("stroke", "black");
    this.maskLine.setAttribute("stroke-dasharray", "2 2");
    this.maskLine.setAttribute("stroke-width", "0.75");
    this.highlightMask.appendChild(this.maskRect);
    this.highlightMask.appendChild(this.maskLine);
    this.highlightPosition.setAttribute("mask", "url(#hPosMask)");

    this.highlightBar.setAttribute("id", "hBar");
    this.highlightBar.setAttribute("x", "0");
    this.highlightBar.setAttribute("width", "0");
    this.highlightBar.setAttribute("height", "0"); // Will be set later when we know the height of the SVG
    this.highlightBar.style.fill = colors().scoreHighlight;
    this.highlightBar.style.fillOpacity = "0"; // initially invisible
    this.highlightBar.style.strokeWidth = "5px"; //Set stroke width

    this.highlightPart.setAttribute("id", "hPart");
    this.highlightPart.setAttribute("x", "0");
    this.highlightPart.setAttribute("y", "0");
    this.highlightPart.setAttribute("width", "0");
    this.highlightPart.setAttribute("height", "0"); // Will be set later when we know the height of the SVG
    this.highlightPart.style.fillOpacity = "0"; // initially invisible

    this.addEventListener("click", this.scoreClicked);
    this.addEventListener("wheel", this.#preventVerticalScroll, {
      passive: false,
    });
    this.addEventListener("mousemove", this.#handleMouseMove);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("wheel", this.#preventVerticalScroll);
    this.removeEventListener("mousemove", this.#handleMouseMove);
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }
    if (this.clefOverlay) {
      this.clefOverlay.remove();
      this.clefOverlay = null;
    }
  }

  // Measure and cache the visible frame width, ignoring a 0 read (no layout
  // yet) so the cache never poisons the live-read fallback — #692.
  #measureFrameWidth() {
    const w = this.offsetWidth;
    if (w > 0) {
      this.#frameWidth = w;
    }
  }

  // Measure and cache the rendered score width. Guarded on the SVG existing, so
  // a load that yields no SVG retains the previous value; ignores a 0 read — #692.
  #measureScoreWidth() {
    if (this.svg) {
      const w = this.svg.getBoundingClientRect().width;
      if (w > 0) {
        this.#scoreWidth = w;
      }
    }
  }

  #preventVerticalScroll = (e: WheelEvent) => {
    if (e.deltaY !== 0 && this.scrollArea) {
      e.preventDefault();
      this.scrollArea.scrollLeft += e.deltaY;
    }
  };

  #handleMouseMove = (e: MouseEvent) => {
    if (this.clefOverlay) {
      const overlayRect = this.clefOverlay.getBoundingClientRect();
      this.style.cursor =
        e.clientX < overlayRect.right ? "default" : "crosshair";
    }
  };

  async attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string
  ) {
    if (name == "score-type") {
      this.setScoreType(newValue);
    } else {
      super.attributeChangedCallback(name, _oldValue, newValue);
    }
  }

  scoreClicked(e: MouseEvent) {
    if (!this.svg) return;

    // Ignore clicks on the overlay area
    if (this.clefOverlay) {
      const overlayRect = this.clefOverlay.getBoundingClientRect();
      if (e.clientX < overlayRect.right) return;
    }

    var pt: DOMPoint = new DOMPoint(e.clientX, e.clientY);

    // The cursor point, translated into svg coordinates
    const m = this.svg.getScreenCTM();
    var cursorpt = pt.matrixTransform(m?.inverse());

    var result = this.bars.find((x) => x > cursorpt.x);
    if (result) {
      const idx = this.bars.indexOf(result);
      // bars[1] is the x of bar 1's label; clicks left of it land in the
      // intro region and resolve to bar 0 (see `bars` field JSDoc).
      this.setBar(cursorpt.x < this.bars[1] ? 0 : idx);
      this.fireEvent("music-score-click");
    }
  }

  #loadSvg = async (): Promise<string | null> => {
    // Test-only seam. Gated behind `import.meta.env.MODE === "test"` so
    // the hook is tree-shaken from production bundles — see the JSDoc on
    // `static testSvgLoader` for the contract.
    if (import.meta.env?.MODE === "test") {
      const loader =
        MusicScore.testSvgLoader || globalThis.__SPEM_TEST_SVG_LOADER;
      if (loader) {
        // Await Promise.resolve so tests can supply either sync strings
        // or async Promises (e.g. to simulate network races, #391).
        const svg = await Promise.resolve(
          loader(this.scoreType, this.choir, this.recording)
        );
        // `typeof svg === "string"` covers both null (documented "fall
        // through" sentinel) and undefined (a stricter shape than the
        // type guarantees, but defensive against an `any`-typed fixture).
        if (typeof svg === "string") {
          this.fireEvent("music-score-loaded");
          return svg;
        }
      }
    }

    try {
      const choirName = config.choirs[this.recording][this.choir];
      const svgModule = await import(
        `../scores/Hugh Keyte/${this.scoreType}/Choir ${choirName}.svg?raw`
      );
      this.fireEvent("music-score-loaded");
      return svgModule.default;
    } catch (error) {
      console.error(`Error loading SVG: ${error}`);
      return null;
    }
  };

  async #loadScore() {
    const generation = ++this.#loadGeneration;
    const svgComp = await this.#loadSvg();

    // If a newer load has started since we began, abort this stale run
    // before it mutates DOM or state (#391).
    if (generation !== this.#loadGeneration) {
      return;
    }

    if (svgComp) {
      this.innerHTML = `<div class="score-scroll-area">${svgComp}</div>`;
    }
    this.scrollArea = this.querySelector(".score-scroll-area");
    this.svg = this.scrollArea?.querySelector("svg") ?? null;
    // The score just changed, so the cached width is stale until the rAF below
    // re-measures it. Invalidate now (before measuring) so any scrollSmooth in
    // the meantime falls back to a live read of the new score rather than the
    // previous score's width — #692.
    this.#scoreWidth = null;

    if (!this.svg) {
      console.error("Could not load score for choir " + (this.choir + 1));
      return;
    }

    var viewBoxString = this.svg.getAttribute("viewBox");
    const viewBoxParts = viewBoxString?.split(" ") ?? [];
    this.svgWidth = Number(viewBoxParts[2]);
    this.svgHeight = Number(viewBoxParts[3]);

    this.highlightPosition.setAttribute("height", String(this.svgHeight));
    this.highlightBar.setAttribute("height", String(this.svgHeight));
    this.maskRect.setAttribute("height", String(this.svgHeight));
    this.maskLine.setAttribute("y2", String(this.svgHeight));
    this.svg.prepend(this.highlightPosition);
    this.svg.prepend(this.highlightBar);
    this.svg.prepend(this.highlightPart);
    this.svg.prepend(this.highlightMask);

    this.#updatePartHighlight();

    this.#createClefOverlay();

    // determine what the bar positions are for this score
    this.bars = this.getBars();

    const indicatorWidth = this.svgWidth / 600;
    this.highlightPosition.setAttribute("width", String(indicatorWidth));
    this.maskRect.setAttribute("width", String(indicatorWidth));

    // Highlight and scroll to the current bar. Defer scrollSmooth() via
    // requestAnimationFrame so the layout reads inside it (offsetWidth,
    // getBoundingClientRect) happen against clean post-paint layout
    // rather than forcing a synchronous reflow on the freshly inserted
    // SVG — see #92.
    //
    // Two events fire in this method:
    //   - `music-score-loaded`: emitted by #loadSvg() once the SVG content
    //     is available (before the DOM updates here).
    //   - `music-score-ready`: emitted INSIDE the rAF below, after
    //     `scrollSmooth()` has applied the final post-paint layout.
    // Tests that read highlight x/width or scroll position must await
    // `music-score-ready`, not `loaded`, to avoid racing the rAF.
    this.highlight();
    requestAnimationFrame(() => {
      // Cache the rendered score width once per score load, when layout is
      // clean, so scrollSmooth() can read the cache instead of forcing a
      // reflow every frame — #692.
      this.#measureScoreWidth();
      this.scrollSmooth();
      this.fireEvent("music-score-ready");
    });
  }

  async setChoir(c: string | number) {
    super.setChoir(c);

    // load the correct score for this choir
    await this.#loadScore();

    // set the border color to match
    this.style.borderColor = `hsla(${colors().choir[this.choir]}, 80%, 55%, 1)`;
  }

  setBar(b: string | number) {
    super.setBar(b);

    // scroll smootlhy and highlight the current position
    this.highlight();
    this.scrollSmooth();
  }

  setPart(p: string | number) {
    super.setPart(p);
    this.#updatePartHighlight();
  }

  setPlaying(p: string | boolean) {
    super.setPlaying(p);

    this.highlight();
  }

  scrollSmooth() {
    if (this.svg == null) {
      return 0;
    }
    // we can't scroll past the last bar for this choir
    var intbar = toNum(this.bar, true, this.bars.length);
    const idealBarPercentage = 0.25;
    // Use cached widths when available so playback does not force a reflow of
    // the large score SVG every frame (#692). #frameWidth refreshes on resize;
    // #scoreWidth refreshes on score load and on resize. Both fall back to a
    // live read until first measured.
    const frameWidth = this.#frameWidth ?? this.offsetWidth;
    const scoreWidth =
      this.#scoreWidth ?? this.svg.getBoundingClientRect().width;
    const barstartpct = intbar <= 0 ? 0 : this.bars[intbar - 1] / this.svgWidth; // % along the score of this bar
    const barendpct =
      intbar >= this.bars.length ? 1 : this.bars[intbar] / this.svgWidth; // % along the score of the next bar
    const barcurrentpct =
      (this.bar - intbar) * (barendpct - barstartpct) + barstartpct; // % along the score of current position in the bar
    const idealPos =
      barcurrentpct * scoreWidth - idealBarPercentage * frameWidth;

    if (this.scrollArea) {
      this.scrollArea.scrollLeft = idealPos;
    }

    // set highlight the current position
    if (this.bar >= 1) {
      const indicatorWidth = Number(
        this.highlightPosition.getAttribute("width") || "0"
      );
      const xPos = barcurrentpct * this.svgWidth - indicatorWidth / 2;
      this.highlightPosition.setAttribute("x", String(xPos));
      this.maskRect.setAttribute("x", String(xPos));
      this.maskLine.setAttribute("x1", String(xPos + indicatorWidth / 2));
      this.maskLine.setAttribute("x2", String(xPos + indicatorWidth / 2));
    }

    // set the highlight for the current bar
    var left, width;
    if (intbar < 1) {
      left = 0;
      width = 0;
    } else if (intbar >= this.bars.length - 1) {
      left = this.bars[this.bars.length - 2];
      width = this.bars[this.bars.length - 1] - left;
    } else {
      left = this.bars[intbar - 1];
      width = this.bars[intbar] - left;
    }
    this.highlightBar.setAttribute("x", String(left));
    this.highlightBar.setAttribute(
      "width",
      String(isNaN(width) ? this.svgWidth : width)
    );
  }

  highlight() {
    const isFractional = Math.abs(this.bar - Math.round(this.bar)) > 0.001;
    if (this.playing || isFractional) {
      this.highlightPosition.style.fillOpacity = this.bar > 1 ? "0.05" : "0";
      this.highlightBar.style.fillOpacity = "0";
      if (this.scrollArea) {
        this.scrollArea.style.overflow = "hidden"; // hide the scroll bar while playing
      }
    } else {
      this.highlightBar.style.fillOpacity = "0.05";
      this.highlightPosition.style.fillOpacity = "0";
      if (this.scrollArea) {
        this.scrollArea.style.overflow = "auto";
      }
    }
  }

  #updatePartHighlight() {
    if (!this.svg) {
      this.highlightPart.style.fillOpacity = "0";
      return;
    }

    // Manage dimming style for non-selected parts
    let dimStyle = this.svg.querySelector("#part-dim-style");
    if (!dimStyle) {
      dimStyle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "style"
      );
      dimStyle.setAttribute("id", "part-dim-style");
      this.svg.prepend(dimStyle);
    }

    if (this.voicePart === "all") {
      this.highlightPart.style.fillOpacity = "0";
      dimStyle.textContent = "";
      return;
    }

    // Find all staff <line> elements and group by parent transform Y
    const lines = Array.from(this.svg.querySelectorAll("line"));
    const clusters: { minY: number; maxY: number }[] = [];

    for (const line of lines) {
      const parent = line.parentElement;
      if (!parent) continue;
      const transform = parent.getAttribute("transform");
      if (!transform) continue;
      const match = transform.match(/translate\([^,]+,\s*([0-9.]+)\)/);
      if (!match) continue;
      const y = parseFloat(match[1]);

      // Cluster lines that are within 2 units of each other
      let found = false;
      for (const cluster of clusters) {
        if (Math.abs(y - cluster.minY) < 2) {
          cluster.minY = Math.min(cluster.minY, y);
          cluster.maxY = Math.max(cluster.maxY, y);
          found = true;
          break;
        }
      }
      if (!found) {
        clusters.push({ minY: y, maxY: y });
      }
    }

    if (clusters.length !== 5) {
      console.warn("Expected 5 staff clusters, found", clusters.length);
      this.highlightPart.style.fillOpacity = "0";
      return;
    }

    clusters.sort((a, b) => a.minY - b.minY);
    const partIndex = typeof this.voicePart === "number" ? this.voicePart : 0;
    const cluster = clusters[partIndex];
    if (!cluster) {
      this.highlightPart.style.fillOpacity = "0";
      return;
    }

    const paddingTop = 2;
    const paddingBottom = 5;
    const y = Math.max(0, cluster.minY - paddingTop);
    const height = cluster.maxY - cluster.minY + paddingTop + paddingBottom;

    this.highlightPart.setAttribute("x", "0");
    this.highlightPart.setAttribute("width", String(this.svgWidth));
    this.highlightPart.setAttribute("y", String(y));
    this.highlightPart.setAttribute("height", String(height));
    this.highlightPart.style.fill = colors().scoreHighlight;
    this.highlightPart.style.fillOpacity = "0.05";

    dimStyle.textContent = `g[data-part]:not([data-part="${this.voicePart}"]) { opacity: 0.3; }`;
  }

  async setScoreType(s: string) {
    this.scoreType = s;
    if (config.scores.indexOf(s) < 0) {
      this.scoreType = config.scores[0];
    }
    await this.#loadScore();
  }

  #createClefOverlay() {
    if (!this.svg || !this.scrollArea) return;

    const overlay = document.createElement("div");
    overlay.className = "score-clef-overlay";

    const clone = this.svg.cloneNode(true) as SVGSVGElement;
    clone
      .querySelectorAll(
        "#hPos, #hBar, #hPart, #part-dim-style, [id='hPosMask']"
      )
      .forEach((el) => el.remove());

    const headerWidthSvg = 8;
    const scale = this.svg.clientWidth / this.svgWidth;
    let overlayWidth = headerWidthSvg * scale;
    if (overlayWidth < 10) {
      overlayWidth = 100;
    }

    overlay.style.width = `${overlayWidth}px`;
    overlay.appendChild(clone);
    this.appendChild(overlay);

    this.clefOverlay = overlay;
  }

  // Lilypond (currently) outputs SVG with bar numbers looking as follows.  The x position
  // of the translate is the beginning of each bar as long as the <tspan> contains a number
  // rather than lyrics.  Also, a pain in the arse: the tenor clef contains a <tspan>8</tspan>
  // underneath the treble clef, so we don't want that.
  //
  // <g transform="translate(164.5950, 2.8265)">
  //   <text font-family="serif" font-size="1.7461" text-anchor="start" fill="currentColor">
  //     <tspan>9</tspan>
  //   </text>
  // </g>
  getBars() {
    if (!this.svg) return [];
    var bars: number[] = [...this.svg.querySelectorAll("tspan")] // get all the tspans the SVG element
      .filter((tspan) => !isNaN(Number(tspan.innerHTML))) // keep only those containing a bar number
      .map((tspan) => {
        // e.g. transform = "translate(137.1800, 2.8299)"
        if (!tspan.parentElement || !tspan.parentElement.parentElement)
          return 0;
        const translate =
          tspan.parentElement.parentElement.getAttribute("transform");
        if (!translate) return 0;
        const commaPos = translate.indexOf(",");
        const x = Number(translate.substring(10, commaPos));
        return x;
      })
      .sort((a, b) => a - b) // sort numerically
      .filter((bar) => bar > 6); // any supposed bars that are too close to the beginning
    // of the score are probably part of the tenor clef and not proper bar numbers
    bars.unshift(0); // Add the initial bar line
    bars.push(this.svgWidth); // Add the final bar line
    return bars;
  }
}
