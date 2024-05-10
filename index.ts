import './src/scss/style.scss';

import { PartType, State, colors, config, toNum, HDSQTIME } from "./src/ts/common";

import { MusicCanvas } from "./src/ts/musicCanvas";
import { AudioControls } from "./src/ts/audioControls";
import { ScoreSVG } from "./src/ts/scoreSVG";

const canvas = document.getElementById("canvas") as MusicCanvas;
const controls = document.getElementById("audio-controls") as AudioControls;
const score = document.getElementById("score") as ScoreSVG;

const statusarea = document.getElementById('statusarea') as HTMLDivElement;
const choiroutput = document.getElementById('choir-output') as HTMLSpanElement;
const partoutput = document.getElementById('part-output') as HTMLSpanElement;
const baroutput = document.getElementById('bar-output') as HTMLSpanElement;
const info = document.getElementById('info') as HTMLSpanElement;
const help = document.getElementById('help') as HTMLDivElement;
const backdrop = document.getElementById('backdrop') as HTMLDivElement;
type SvgInHtml = HTMLElement & SVGElement;
const darkswitch = document.getElementById('darkswitch') as SvgInHtml;
const scoreswitch = document.getElementById('scoreswitch') as SvgInHtml;

var current: State = {
  viewmode: "dark",
  period: "modern",
  choir: 0,
  part: "all",
  bar: 0,
  status: "paused"
}




// TODO: click on score should send you to bar.  And part?
// TODO: Change dark mode to moon/sun icons
// TODO: Visual effect for false relations
// TODO: switching dark mode should not stop play
// TODO: Better font/graphic for Spem Player title
// BUG: can scroll up and down a tiny bit in score
// BUG: [Violation] Forced reflow while executing JavaScript took 36ms  (this doesn't happen when you have already manually adjusted the height of the score - something to do with the flex: 1 after the reload?)
// TODO: build: minimse SVGs using <use> and <defs> elements
// TODO: build: generate SVG from lilypond as part of build process
// TODO: CMD-B to type in bar number
// TODO: highlight part on score?
// TODO: Add lyrics to footer
// BUG: Bass in choir 7 between bars 50 and 68 - rests not showing correctly.
// BUG: Tenor in choir 4 bar 22. Audio has c natural.  Score has c sharp.
// BUG: Soprano in choir 1 bar 13.  Breve or Longa?
// TODO: index.html should not have part and choir names hard-coded.  Should come from config instead.
// TODO: Get AudioControls to generate Choirs and Parts from config (rather than hard-coded in index.html

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

async function setChoir(c: number, forceChange = false) {
  if (current.choir == c && !forceChange) {
    return;
  }
  current.choir = Math.min(Math.max(0, c), config.choirs - 1);

  // Update the input field
  controls.setAttribute("choir", String(current.choir));

  // Update the score for this choir
  score.setAttribute("choir", String(current.choir));

  // Update the canvas
  canvas.setAttribute("choir", String(current.choir));
}

function setPart(p: PartType) {
  if (current.part == p) {
    return;
  }
  current.part = p;

  // Update the input field
  controls.setAttribute("part", String(current.part));

  // Update the score
  score.setAttribute("part", String(current.part));

  // Update the canvas
  canvas.setAttribute("part", String(current.part));
}


// where b = 0 to 139
function setBar(b: number) {
  b = toNum(b, false);
  if (b > 140) {
    controls.pause();
    b = 0;
  }
  else if (b < 0) {
    b = 139;
  }
  current.bar = b;

  // update the input field
  controls.setAttribute("bar", String(b));

  // Highlight the bar on the score
  score.setAttribute("bar", String(b));

  // Update the canvas
  canvas.setAttribute("bar", String(b));
}

function parseURL() {
  const url = window.location.search.substring(1);
  const parms = url.split("&");

  var choir = 0; // choir 1
  var part: PartType = "all";
  var bar = 0;
  var dark = false;
  var early = false;
  for (let i = 0; i < parms.length; i++) {
    const parm = parms[i].split("=");
    if (parm[0] == "choir") {
      choir = Number(parm[1]);
    }
    else if (parm[0] == "part") {
      const n: number = Number(parm[1]);
      if (n >= 0 && n < config.parts.length) part = n;
    }
    else if (parm[0] == "bar") {
      bar = Number(parm[1]);
    }
    else if (parm[0] == "dark") {
      dark = true;
    }
    else if (parm[0] == "score") {
      early = (parm[1] == "early");
    }
  }
  setChoir(choir, true);
  setPart(part);
  setBar(bar);
  if (early) {
    toggleScore();
  }
  if (dark) {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
    current.viewmode = "dark";
    colors(true);
  }
}

// -----------------------------------------------------
// Field events (chaning choir, part or bar)
// -----------------------------------------------------

function handleControlChange(e: CustomEvent) {
  const pos = e.detail.position;
  setChoir(Number(pos.choir));
  setPart(pos.part == "all" ? "all" : Number(pos.part));
  setBar(Number(pos.bar));
}

// -----------------------------------------------------
// Keyboard events (wasd)
// -----------------------------------------------------

function keyboardTapped(e) {
  // don't handle keyboard events on the four control widgets
  // cos it messes with the UI interaction
  const classes = [...e.target.classList];
  if (classes.includes('control')) {
    return;
  }
  if (e.isComposing || e.keyCode === 229) {
    return;
  }
  if (e.metaKey || e.ctrlKey) {
    console.log('meta or ctrl pressed');
    switch (e.code) {
      case 'ArrowRight':
        controls.pause();
        setBar(canvas.seek(current, +1));
        break;
      case 'ArrowLeft':
        controls.pause();
        setBar(canvas.seek(current, -1));
        break;
      default:
        break;
    }
    return;
  }
  if (e.code == 'Enter') {
    controls.isPlaying() ? controls.pause() : controls.play();
    return;
  }
  switch (e.code) {
    case 'Digit1':
    case 'Digit2':
    case 'Digit3':
    case 'Digit4':
    case 'Digit5':
    case 'Digit6':
    case 'Digit7':
    case 'Digit8':
      setChoir(e.key - 1);
      break;
    case 'KeyS':
    case 'KeyA':
    case 'KeyT':
    case 'KeyR':
    case 'KeyB':
      setPart("satrb".indexOf(e.key));
      break;
    case 'KeyM':
      toggleScore();
      break;
    case 'KeyD':
      toggleDark();
      break;
    case 'Slash':
      if (e.shiftKey) {
        showHelp();
      }
      break;
    case 'Escape':
      showHelp(false);
      break;
    case 'ArrowRight':
      controls.pause();
      setBar(Math.floor(current.bar + HDSQTIME) + 1);
      e.preventDefault();
      break;
    case 'ArrowLeft':
      controls.pause();
      setBar(Math.floor(current.bar + HDSQTIME) - 1);
      e.preventDefault();
      break;
    case 'ArrowDown':
      setChoir(current.choir >= config.choirs - 1 ? 0 : current.choir + 1);
      break;
    case 'ArrowUp':
      setChoir(current.choir <= 0 ? config.choirs - 1 : current.choir - 1);
      break;
    case 'KeyX':
      setPart("all");
      break;
    default:
      console.log("key pressed: ", e.code);
  }

}

function showHelp(show = true) {
  if (show) {
    backdrop.style.display = 'block';
    help.style.display = 'block';
  }
  else {
    backdrop.style.display = 'none';
    help.style.display = 'none';
  }
}

function toggleDark() {
  if (prefersDarkScheme.matches) {
    document.body.classList.toggle("light-theme");
  } else {
    document.body.classList.toggle("dark-theme");
  }
  colors(true); // reload the colors from the stylesheet
  canvas.draw();
}

function toggleScore(forceEarly = false) {
  if (current.period === "modern" || forceEarly) {
    console.log("Toggle SCORE");
    current.period = "early";
    score.setAttribute("score-type", "early");
  }
  else {
    current.period = "modern";
    score.setAttribute("score-type", "modern");
  }
}


function setVH() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function handleCanvasClick(e: CustomEvent) {
  const pos = e.detail.position;

  setChoir(pos.choir);
  setPart(pos.part);
  setBar(pos.bar);
}

function handleAudioPlaying() {
  canvas.setAttribute("playing", "true");
}

function handleAudioPaused() {
  canvas.setAttribute("playing", "false");
}

var intId;
function handleCanvasHover(e: CustomEvent) {
  const pos = e.detail.position;

  choiroutput.textContent = "Choir " + (pos.choir + 1);
  if (pos.part != 'all') {
    partoutput.textContent = config.parts[pos.part];
  }
  baroutput.textContent = "Bar " + Math.floor(pos.bar);
  statusarea.classList.remove("hide");
  clearInterval(intId);
  intId = setInterval(function () {
    statusarea.classList.add("hide");
  }, 1500);
}

// -----------------------------------------------------
// Setup page
// -----------------------------------------------------

window.addEventListener("load", init);

function init(): void {

  // On mobiles, 100vh sometimes is the total vertical space
  // of the browser, but we don't want to include the browser's
  // header and footer in that, so calculate using visible vertical space.
  setVH();
  setColorScheme();

  // read choir, part and bar from the URL
  parseURL();

  controls.addEventListener("audio-controls-changed", handleControlChange as (e: Event) => void);
  controls.addEventListener("audio-controls-playing", handleAudioPlaying as (e: Event) => void);
  controls.addEventListener("audio-controls-paused", handleAudioPaused as (e: Event) => void);

  canvas.addEventListener("music-canvas-click", handleCanvasClick as (e: Event) => void);
  canvas.addEventListener("music-canvas-touchend", handleCanvasClick as (e: Event) => void);
  canvas.addEventListener("music-canvas-hover", handleCanvasHover as (e: Event) => void);

  document.addEventListener("keydown", keyboardTapped);
  info.addEventListener("click", () => showHelp(true));
  backdrop.addEventListener("click", () => showHelp(false));
  darkswitch.addEventListener("click", () => toggleDark());
  scoreswitch.addEventListener("click", () => toggleScore());

  // watch for change in user's preference of color scheme
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    setColorScheme();
  });
  window.addEventListener('resize', () => setVH());
}

var prefersDarkScheme;
function setColorScheme() {
  prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  if (prefersDarkScheme.matches) {
    console.log("preferred color scheme is dark");
    document.body.classList.add('dark-theme');
    current.viewmode = "dark";
  } else {
    console.log("preferred color scheme is light");
    document.body.classList.remove('dark-theme');
    current.viewmode = "light";
  }
  colors(true);
  canvas.draw();
}
