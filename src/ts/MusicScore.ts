import config from "./config";
import { colors, HDSQTIME } from "./common";

import { MusicElement } from "./MusicElement";

// HACKy alternative
// import spem1 from '../svg/modern/Choir 1.svg?raw';
// import spem2 from '../svg/modern/Choir 2.svg?raw';
// import spem3 from '../svg/modern/Choir 3.svg?raw';
// import spem4 from '../svg/modern/Choir 4.svg?raw';
// import spem5 from '../svg/modern/Choir 5.svg?raw';
// import spem6 from '../svg/modern/Choir 6.svg?raw';
// import spem7 from '../svg/modern/Choir 7.svg?raw';
// import spem8 from '../svg/modern/Choir 8.svg?raw';
// const spem: any[] = [ spem1, spem2, spem3, spem4, spem5, spem6, spem7, spem8 ]


export class MusicScore extends MusicElement {
  static observedAttributes = ["choir", "part", "bar", "playing", "score-type"];

  svg: SVGGraphicsElement | null = null;

  scoreType: string = "modern";

  bars: number[] = [];

  highlightBar: SVGRectElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect')
  highlightPosition: SVGRectElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect')

  constructor() {
    super();
  };

  async connectedCallback() {
    super.connectedCallback();

    this.highlightPosition.setAttribute("x", "0");
    this.highlightPosition.setAttribute("y", "0");
    this.highlightPosition.setAttribute("width", "7");  // HACK: hard-coded!
    this.highlightPosition.setAttribute("height", "200");  // HACK: need to calc actual height of SVG
    this.highlightPosition.style.fill = colors().scoreHighlight; //Set stroke colour
    this.highlightPosition.style.fillOpacity = "0.1";
    this.highlightPosition.style.strokeWidth = "5px"; //Set stroke width

    this.highlightBar.setAttribute("x", "0");
    this.highlightBar.setAttribute("y", "0");
    this.highlightBar.setAttribute("width", "0");
    this.highlightBar.setAttribute("height", "200");  // HACK: need to calc actual height of SVG
    this.highlightBar.style.fill = colors().scoreHighlight; //Set stroke colour
    this.highlightBar.style.fillOpacity = "0.1";
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


  async #loadScore() {
    // this.innerHTML = spem[this.choir];

    const filename = config.svg_prefix + this.scoreType + "/Choir " + (this.choir + 1) + ".svg";
    console.log("MusicScore: fetching", filename);
    var starttime = performance.now()
    await fetch(filename)
    .then(r => r.text())
    .then(text => {
      this.innerHTML = text;
    })
    .catch(console.error.bind(console));
    var endtime = performance.now()
    console.log("SVG load time", endtime - starttime);
    this.svg = document.querySelector("#music-score svg");

    if (!this.svg) {
      console.error("Could not load score for choir " + (this.choir + 1));
      return;
    }

    this.svg.prepend(this.highlightPosition);
    this.svg.prepend(this.highlightBar);

    // determine what the bar positions are for this score
    var starttime = performance.now()
    this.bars = MusicScore.getBars(this.svg);
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
    const svgWidth = this.svg.getBBox().width; // the width of the score in SVG unit
    const barstartpct = intbar <= 0 ? 0 : this.bars[intbar - 1] / svgWidth; // % along the score of this bar
    const barendpct = intbar >= this.bars.length ? 1 : this.bars[intbar] / svgWidth; // % along the score of the next bar
    const barcurrentpct = ((this.bar - intbar) * (barendpct - barstartpct)) + barstartpct; // % along the score of current position in the bar
    const idealPos = (barcurrentpct * scoreWidth) - (idealBarPercentage * frameWidth);

    this.scrollTo({
      top: 0,
      left: idealPos,
      behavior: "instant"
    });

    // set highlight the current position
    if (this.bar >= 1) {
      this.highlightPosition.setAttribute("x", String((barcurrentpct * svgWidth) - 2.5));
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
    this.highlightBar.setAttribute("width", String(isNaN(width) ? this.svg.getBBox().width : width));
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

  setScoreType(s: string) {
    this.scoreType = s;
    if (config.scores.indexOf(s) < 0) {
      this.scoreType = config.scores[0];
    }
    this.#loadScore();
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
  static getBars(svg: SVGGraphicsElement) {
    var bars: number[] = [...svg.querySelectorAll('tspan')]    // get all the tspans the SVG element
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
      .filter(bar => bar > 5);  // any supposed bars that are too close to the beginning 
    // of the score are probably part of the tenor clef and not proper bar numbers
    bars.unshift(0);  // Add the initial bar line                              
    bars.push(svg.getBBox().width); // Add the final bar line
    return bars;
  }
}