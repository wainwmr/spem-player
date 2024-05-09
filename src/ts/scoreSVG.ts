
// TODO: bar positions should come from model
import { scorebars_modern, scorebars_early } from "./barlines";
import { PartType, config, colors, toNum } from "./common";

export class ScoreSVG extends HTMLDivElement {
  static observedAttributes = ["choir", "part", "bar", "score-type"];

  svg: SVGGraphicsElement | null = null;

  choir: number = 0;
  bar: number = 0;
  voicePart: PartType = "all";
  scoreType: string = "modern";

  scorebars = (this.scoreType == "early" ? scorebars_early : scorebars_modern);


  constructor() {
    super();
  };

  async connectedCallback() {
    console.log("ScoreSVG added to page.");
  }

  disconnectedCallback() {
    console.log("ScoreSVG removed from page.");
  }

  adoptedCallback() {
    console.log("ScoreSVG moved to new page.");
  }

  async attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
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
      case "score-type":
        this.setScoreType(newValue);
        break;
      default:
        break;
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

  //   var result = scorebars.find(x => x > cursorpt.x);
  //   console.log(scorebars.indexOf(result));
  //   setBar(scorebars.indexOf(result));
  // }

  async #loadScore() {
    const filename = config.svg_prefix + this.scoreType + "/Choir " + (this.choir + 1) + ".svg";
    console.log("ScoreSVG: fetching", filename);
    await fetch(filename)
      .then(r => r.text())
      .then(text => {
        this.innerHTML = text;
      })
      .catch(console.error.bind(console));
    this.svg = document.querySelector("#score svg");
  }

  async setChoir(c: string | number) {
    this.choir = toNum(c, true, config.choirs - 1);

    // load the correct score for this choir
    await this.#loadScore();

    // set the border color to match
    this.style.borderColor = `hsla(${colors().choir[this.choir]}, 80%, 55%, 1)`;

    // Highlight and scroll to the current bar
    const intbar = Math.floor(this.bar);
    this.highlightBar(intbar);
    this.scrollToPosition(intbar, "instant");
  }

  setPart(p: string | number) {
    this.voicePart = toNum(p, true, config.parts.length - 1);
  }

  previousBarHighlight: SVGRectElement | null = null;
  setBar(b: string | number) {
    // const hackint = Number(b) + 0.01; // HACK: 0.01 needs to be a hemidemisemiquaver length of time
    // console.log("ScoreSVG: setting bar to", b, hackint);
    const intbar = toNum(b, true, 139); // HACK: 139 
    if (intbar == this.bar) {
      return;
    }
    this.bar = intbar;

    this.svg = document.querySelector("#score svg");

    // highlight the current bar
    this.highlightBar(intbar);

    // scroll the the right place
    this.scrollToPosition(intbar, "smooth");
  }

  highlightBar(intbar: number) {
    // Remove any previous bar highlighting
    if (this.previousBarHighlight != null) {
      if (this.svg && this.svg.contains(this.previousBarHighlight)) {
        this.svg.removeChild(this.previousBarHighlight);
      }
    }

    // Highlight the current bar on the score
    if (this.svg && intbar > 0 && intbar < 139) {
      var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
      newElement.setAttribute("x", String(this.scorebars[this.choir][intbar - 1]));
      newElement.setAttribute("y", "0");
      const bw = (intbar >= 138 ? this.svg.getBBox().width - this.scorebars[this.choir][137] : this.scorebars[this.choir][intbar] - this.scorebars[this.choir][intbar - 1]);
      newElement.setAttribute("width", String(bw));
      newElement.setAttribute("height", String(this.svg.getBBox().height * 2));  // HACK: why times two???
      newElement.style.fill = colors().scoreHighlight; //Set stroke colour
      newElement.style.fillOpacity = "0.1";
      newElement.style.strokeWidth = "5px"; //Set stroke width
      this.svg.appendChild(newElement);
      this.previousBarHighlight = newElement;
    }
  }

  scrollToPosition(intbar: number, type: "instant" | "smooth") {
    if (this.svg == null) {
      return 0;
    }
    var idealBarPos = 0.25;
    var frameWidth = this.offsetWidth; // the width of the visible score on the screen
    var scoreWidth = this.svg.getBoundingClientRect().width; // the total width of the score
    var svgWidth = this.svg.getBBox().width; // the width of the score in SVG unit
    var pos = this.scorebars[this.choir][intbar - 1] * scoreWidth / svgWidth; // current % along the score
    pos -= idealBarPos * frameWidth;

    this.scrollTo({
      top: 0,
      left: pos,
      behavior: type
    });

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

customElements.define("score-svg", ScoreSVG, { extends: "div" });