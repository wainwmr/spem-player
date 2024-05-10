
// TODO: bar positions should come from model
import { scorebars_modern, scorebars_early } from "./barlines";
import { config, colors, HDSQTIME } from "./common";
import { MusicElement } from "./MusicElement";


export class MusicScore extends MusicElement {
  static observedAttributes = ["choir", "part", "bar", "playing", "score-type"];

  svg: SVGGraphicsElement | null = null;

  scoreType: string = "modern";

  scorebars = (this.scoreType == "early" ? scorebars_early : scorebars_modern);

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
    super.attributeChangedCallback(name, _oldValue, newValue);
  }

  // var pt;
  // function scoreClicked(e) {
  //   console.log("score clicked");
  //   pt.x = e.clientX;
  //   pt.y = e.clientY;

  //   // The cursor point, translated into svg coordinates
  //   var cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
  //   console.log("(" + cursorpt.x + ", " + cursorpt.y + ")");

  //   var result = scorebars.find(x => x > cursorpt.x);
  //   console.log(scorebars.indexOf(result));
  //   setBar(scorebars.indexOf(result));
  // }


  async #loadScore() {
    const filename = config.svg_prefix + this.scoreType + "/Choir " + (this.choir + 1) + ".svg";
    console.log("MusicScore: fetching", filename);
    await fetch(filename)
      .then(r => r.text())
      .then(text => {
        this.innerHTML = text;
      })
      .catch(console.error.bind(console));
    this.svg = document.querySelector("#music-score svg");

    if (this.svg) {
      this.svg.prepend(this.highlightPosition);
      this.svg.prepend(this.highlightBar);
    }
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
    intbar = Math.min(intbar, this.scorebars[this.choir].length);
    const idealBarPercentage = 0.25;
    const frameWidth = this.offsetWidth; // the width of the visible score on the screen
    const scoreWidth = this.svg.getBoundingClientRect().width; // the total width of the score
    const svgWidth = this.svg.getBBox().width; // the width of the score in SVG unit
    const barstartpct = intbar <= 0 ? 0 : this.scorebars[this.choir][intbar - 1] / svgWidth; // % along the score of this bar
    const barendpct = intbar >= this.scorebars[this.choir].length ? 1 : this.scorebars[this.choir][intbar] / svgWidth; // % along the score of the next bar
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
    const size = this.scorebars[this.choir].length;
    if (intbar > 0 && intbar <= size) {
      const bw = (intbar >= size ? 
        this.svg.getBBox().width - this.scorebars[this.choir][size - 1] : 
        this.scorebars[this.choir][intbar] - this.scorebars[this.choir][intbar - 1]);
        this.highlightBar.setAttribute("x", String(this.scorebars[this.choir][intbar - 1]));
        this.highlightBar.setAttribute("width", String(bw));
    }
  }

  highlight() {
    if (this.playing) {
      this.highlightPosition.style.fillOpacity = this.bar > 1 ? "0.1" : "0";
      this.highlightBar.style.fillOpacity = "0";
    }
    else {
      this.highlightBar.style.fillOpacity = "0.1";
      this.highlightPosition.style.fillOpacity = "0";
    }
  }

  setScoreType(s: string) {
    this.scoreType = s;
    if (config.scores.indexOf(s) < 0) {
      this.scoreType = config.scores[0];
    }

    // HACK: Ugh
    if (this.scoreType === "modern") {
      this.scorebars = scorebars_modern;
    }
    else {
      this.scorebars = scorebars_early;
    }
    this.#loadScore();
  }
}

MusicScore.define("music-score");