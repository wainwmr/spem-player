import config from "./config";
import { colors, HDSQTIME } from "./common";

import { MusicElement } from "./MusicElement";

export class MusicScore extends MusicElement {
  static observedAttributes = ["choir", "part", "bar", "playing", "score-type"];

  svg: SVGGraphicsElement | null = null;
  svgWidth: number = 0;

  scoreType: string = "modern";

  bars: number[] = [];

  highlightBar: SVGRectElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect')
  highlightPosition: SVGRectElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect')

  constructor() {
    super();
  };

  async connectedCallback() {
    super.connectedCallback();

    this.highlightPosition.setAttribute("id", "hPos");
    this.highlightPosition.setAttribute("x", "0");
    this.highlightPosition.setAttribute("y", "0");
    this.highlightPosition.setAttribute("width", "7");  // HACK: hard-coded!
    this.highlightPosition.setAttribute("height", "200");  // HACK: need to calc actual height of SVG
    this.highlightPosition.style.fill = colors().scoreHighlight; //Set stroke colour
    this.highlightPosition.style.fillOpacity = "0";  // initially invisible
    this.highlightPosition.style.strokeWidth = "5px"; //Set stroke width

    this.highlightBar.setAttribute("id", "hBar");
    this.highlightBar.setAttribute("x", "0");
    this.highlightBar.setAttribute("width", "0");
    this.highlightBar.setAttribute("height", "200");  // HACK: need to calc actual height of SVG
    this.highlightBar.style.fill = colors().scoreHighlight; //Set stroke colour
    this.highlightBar.style.fillOpacity = "0";  // initially invisible
    this.highlightBar.style.strokeWidth = "5px"; //Set stroke width
  }

  async attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name == "score-type") {
      this.setScoreType(newValue);
    }
    else {
      super.attributeChangedCallback(name, _oldValue, newValue);
    }
  }

  // var pt;
  // function scoreClicked(e) {
  //   console.log("score clicked");
  //   pt.x = e.clientX;
  //   pt.y = e.clientY;

  //   // The cursor point, translated into svg coordinates
  //   var cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
  //   console.log("(" + cursorpt.x + ", " + cursorpt.y + ")");

  //   var result = bars.find(x => x > cursorpt.x);
  //   console.log(bars.indexOf(result));
  //   setBar(bars.indexOf(result));
  // }

  #loadSvg = async (): Promise<string | null> => {
    try {
      const cname = "Choir " + (this.choir + 1);
      const svgModule = await import(`../scores/${this.scoreType}/${cname}.svg?raw`);
      this.fireEvent("music-score-loaded");
      return svgModule.default;
    } catch (error) {
      console.error(`Error loading SVG: ${error}`);
      return null;
    }
  };

  async #loadScore() {
    const filename = config.svg_prefix + this.scoreType + "/Choir " + (this.choir + 1) + ".svg";
    console.log("MusicScore: fetching", filename);
    var starttime = performance.now()

    const svgComp = await this.#loadSvg();
    if (svgComp) {
      this.innerHTML = svgComp;
    }

    var endtime = performance.now()
    console.log("SVG load time", endtime - starttime);
    this.svg = document.querySelector("music-score svg");

    if (!this.svg) {
      console.error("Could not load score for choir " + (this.choir + 1));
      return;
    }

    var viewBoxString = this.svg.getAttribute('viewBox');
    this.svgWidth = Number(viewBoxString?.split(" ")[2]);
    console.log("viewbox", this.svgWidth); // Example output: "0 0 65415 41616"



    this.svg.prepend(this.highlightPosition);
    this.svg.prepend(this.highlightBar);

    // determine what the bar positions are for this score
    var starttime = performance.now()
    this.bars = this.getBars();
    var endtime = performance.now();
    console.log("getBars() time taken:", endtime - starttime);
  }

  async setChoir(c: string | number) {
    super.setChoir(c);

    // load the correct score for this choir
    await this.#loadScore();

    // set the border color to match
    this.style.borderColor = `hsla(${colors().choir[this.choir]}, 80%, 55%, 1)`;

    // Highlight and scroll to the current bar
    this.highlight()
    this.scrollSmooth();
  }

  setBar(b: string | number) {
    super.setBar(b);

    // scroll smootlhy and highlight the current position
    this.highlight();
    this.scrollSmooth();
  }

  scrollSmooth() {
    if (this.svg == null) {
      return 0;
    }
    var intbar = Math.floor(this.bar + HDSQTIME);
    // we can't scroll past the last bar for this choir
    intbar = Math.min(intbar, this.bars.length);
    const idealBarPercentage = 0.25;
    const frameWidth = this.offsetWidth; // the width of the visible score on the screen
    const scoreWidth = this.svg.getBoundingClientRect().width; // the total width of the score
    const barstartpct = intbar <= 0 ? 0 : this.bars[intbar - 1] / this.svgWidth; // % along the score of this bar
    const barendpct = intbar >= this.bars.length ? 1 : this.bars[intbar] / this.svgWidth; // % along the score of the next bar
    const barcurrentpct = ((this.bar - intbar) * (barendpct - barstartpct)) + barstartpct; // % along the score of current position in the bar
    const idealPos = (barcurrentpct * scoreWidth) - (idealBarPercentage * frameWidth);

    this.scrollTo({
      top: 0,
      left: idealPos,
      behavior: "instant"
    });

    // set highlight the current position
    if (this.bar >= 1) {
      this.highlightPosition.setAttribute("x", String((barcurrentpct * this.svgWidth) - 2.5));
    }

    // set the highlight for the current bar
    var left = 0, width = 0;
    if (intbar < 1) {
      left = 0;
      width = 0;
    }
    else if (intbar >= 138) {
      left = this.bars[137];
      width = this.bars[138] - left;
    }
    else {
      left = this.bars[intbar - 1];
      width = this.bars[intbar] - left;
    }
    this.highlightBar.setAttribute("x", String(left));
    this.highlightBar.setAttribute("width", String(isNaN(width) ? this.svgWidth : width));
  }

  highlight() {
    if (this.playing) {
      this.highlightPosition.style.fillOpacity = this.bar > 1 ? "0.1" : "0";
      this.highlightBar.style.fillOpacity = "0";
      this.style.overflow = 'hidden'; // hide the scroll bar while playing
    }
    else {
      this.highlightBar.style.fillOpacity = "0.1";
      this.highlightPosition.style.fillOpacity = "0";
      this.style.overflow = 'auto';
    }
  }

  async setScoreType(s: string) {
    this.scoreType = s;
    if (config.scores.indexOf(s) < 0) {
      this.scoreType = config.scores[0];
    }
    await this.#loadScore();
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
    var bars: number[] = [...this.svg.querySelectorAll('tspan')]    // get all the tspans the SVG element
      .filter(tspan => !isNaN(Number(tspan.innerHTML)))     // keep only those containing a bar number 
      .map(tspan => {
        // e.g. transform = "translate(137.1800, 2.8299)"
        if (!tspan.parentElement || !tspan.parentElement.parentElement) return 0;
        const translate = tspan.parentElement.parentElement.getAttribute("transform");
        if (!translate) return 0;
        const commaPos = translate.indexOf(",")
        const x = Number(translate.substring(10, commaPos))
        return x
      })
      .sort((a, b) => a - b) // sort numerically
      .filter(bar => bar > 6);  // any supposed bars that are too close to the beginning 
    // of the score are probably part of the tenor clef and not proper bar numbers
    bars.unshift(0);  // Add the initial bar line                              
    bars.push(this.svgWidth); // Add the final bar line
    return bars;
  }
}