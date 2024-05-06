
import './src/scss/style.scss';

// TODO: bar positions should come from model
import { scorebars_modern, scorebars_early } from "./src/ts/barlines";

import { PartType, Ensemble, Config, Position, Colors } from "./src/ts/ensemble";

import { MusicCanvas } from "./src/ts/musicCanvas";

const canvas = document.getElementById("canvas") as MusicCanvas;
const score = document.getElementById("score") as HTMLDivElement;
const playpausebutton = document.getElementById('playpausebutton') as HTMLDivElement;
const playpauseicon = document.getElementById('playpauseicon') as HTMLSpanElement;
const choirselect = document.getElementById('choir-select') as HTMLSelectElement;
const partselect = document.getElementById('part-select') as HTMLSelectElement;
const barinput = document.getElementById('bar-field') as HTMLInputElement;
const statusarea = document.getElementById('statusarea') as HTMLDivElement;
const choiroutput = document.getElementById('choir-output') as HTMLSpanElement;
const partoutput = document.getElementById('part-output') as HTMLSpanElement;
const baroutput = document.getElementById('bar-output') as HTMLSpanElement;
const info = document.getElementById('info') as HTMLSpanElement;
const help = document.getElementById('help') as HTMLDivElement;
const backdrop = document.getElementById('backdrop') as HTMLDivElement;
type SvgInHtml = HTMLElement & SVGElement;
const spinner = document.getElementById('spinner') as SvgInHtml;
const darkswitch = document.getElementById('darkswitch') as SvgInHtml;
const scoreswitch = document.getElementById('scoreswitch') as SvgInHtml;

type Brightness = "dark" | "light";
type ScoreType = "early" | "modern";

type State = {
  viewmode: Brightness;
  period: ScoreType;
  choir: number;
  part: PartType;
  bar: number;
}

var current: State = {
  viewmode: "dark",
  period: "modern",
  choir: 0,
  part: "all",
  bar: 0
}

// HACK: this is also in /spem.json - make you your mind.
const config = {
  "choirs": 8,
  "parts": ["Soprano", "Alto", "Tenor", "Baritone", "Bass"],
  "scores": ["modern", "early"],
  "audio_prefix": "/audio/",
  "tempo": 4 * 60 / 62,  // (minim = 62) === (tempo = 4 * 0.9677)
  "svg_prefix": "/svg/",
  "lilypond": "/lilypond/spem notes.ly"
}

var scorebars = (current.period == "early" ? scorebars_early : scorebars_modern);

var svg; // the actual SVG
var audio = new Audio();

const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
if (prefersDarkScheme.matches) {
  document.body.classList.add('dark-theme');
  current.viewmode = "dark";
} else {
  document.body.classList.remove('dark-theme');
  current.viewmode = "light";
}

// All the colors are defined in the style sheet
var colors: Colors;
function loadColors() {
  var style = getComputedStyle(document.body);
  colors = {
    background: style.getPropertyValue('--color-background'),
    highlight: style.getPropertyValue('--color-highlight'),
    scoreHighlight: style.getPropertyValue('--color-score-highlight'),
    choir: [
      Number(style.getPropertyValue('--color-c1')),
      Number(style.getPropertyValue('--color-c2')),
      Number(style.getPropertyValue('--color-c3')),
      Number(style.getPropertyValue('--color-c4')),
      Number(style.getPropertyValue('--color-c5')),
      Number(style.getPropertyValue('--color-c6')),
      Number(style.getPropertyValue('--color-c7')),
      Number(style.getPropertyValue('--color-c8'))
    ]
  };
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
// TODO: index.html should not have part and choir names hard-coded.  Should come from config instead.

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

// where c = 1 to number of choirs  TODO: Need to zero index choir
async function setChoir(c: number, forceChange = false) {
  if (current.choir == c && !forceChange) {
    return;
  }
  current.choir = Math.min(Math.max(0, c), config.choirs - 1);

  // Update the input field
  if (choirselect != null && choirselect.value != String(current.choir)) {
    choirselect.value = String(current.choir);
  }

  // load the correct score for this choir
  const filename = config.svg_prefix + current.period + "/Choir " + (current.choir + 1) + ".svg";
  console.log("fetching", filename);
  await fetch(filename)
    .then(r => r.text())
    .then(text => {
      score.innerHTML = text;
    })
    .catch(console.error.bind(console));

  // set the border color to match
  score.style.borderColor = `hsla(${colors.choir[current.choir]}, 80%, 55%, 1)`;

  // scroll the score to match the new choir (with instant scrolling)
  setBar(current.bar, true);
}

function setPart(p: PartType) {
  if (current.part == p) {
    return;
  }
  current.part = p;

  // Update the input field
  if (partselect != null && partselect.value != String(current.part)) {
    partselect.value = String(current.part);
  }
}


var previousBarHighlight;

// where b = 0 to 139
function setBar(b: number, changedChoirs = false) {
  if (b == current.bar && !changedChoirs) {
    return;
  }
  if (b > 139) {
    playpauseicon.classList.add("paused");
    b = 0;
  }
  else if (b < 0) {
    b = 139;
  }
  current.bar = b;

  const intbar = Math.floor(current.bar);

  // update the input field
  if (barinput && barinput.value != String(intbar)) {
    barinput.value = String(intbar);
  }

  svg = document.querySelector("#score svg");

  if (previousBarHighlight != undefined) {
    if (svg.contains(previousBarHighlight)) {
      svg.removeChild(previousBarHighlight);
    }
  }

  // Highlight the current bar on the score
  if (intbar > 0 && intbar < 139) {
    var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
    newElement.setAttribute("x", String(scorebars[current.choir][intbar - 1]));
    newElement.setAttribute("y", "0");
    const bw = (intbar >= 138 ? svg.getBBox().width - scorebars[current.choir][137] : scorebars[current.choir][intbar] - scorebars[current.choir][intbar - 1]);
    newElement.setAttribute("width", String(bw));
    newElement.setAttribute("height", String(svg.getBBox().height * 2));  // HACK: why times two???
    newElement.style.fill = colors.scoreHighlight; //Set stroke colour
    newElement.style.fillOpacity = "0.1";
    newElement.style.strokeWidth = "5px"; //Set stroke width
    svg.appendChild(newElement);
    previousBarHighlight = newElement;
  }


  // scroll the the right place
  var pos = getScrollPosition(intbar);
  score.scrollTo({
    top: 0,
    left: pos,
    behavior: changedChoirs ? "instant" : "smooth"
  });
}

function getScrollPosition(bar) {
  if (svg == null) {
    return 0;
  }
  var idealBarPos = 0.25;
  var frameWidth = score.offsetWidth; // the width of the visible score on the screen
  var scoreWidth = svg.getBoundingClientRect().width; // the total width of the score
  var svgWidth = svg.getBBox().width; // the width of the score in SVG unit
  var pos = scorebars[current.choir][bar - 1] * scoreWidth / svgWidth; // current % along the score
  pos -= idealBarPos * frameWidth;
  return pos;
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
    loadColors();
  }
}

function getFilename(s) {
  return s.split("/").pop();
}

function loadAudio(c: number, p: PartType, b: number) {
  const newfile = config.audio_prefix + (p == "all" ? "default" : "Choir " + c + "-" + config.parts[p]) + ".mp3";
  console.log("audio:", newfile);

  // just compare the filename, not the whole URL, to see if we
  // need to load a new MP3
  if (getFilename(newfile) != getFilename(audio.currentSrc)) {
    audio.src = newfile;
    audio.load();
  }

  audio.currentTime = b * config.tempo;
}

async function play() {
  if (audio.paused) {

    // set the play button spinner while loading audio
    playpauseicon.style.display = "none";
    spinner.style.display = "block";

    await audio.play();

    // set the play button to pause again
    playpauseicon.style.display = "block";
    spinner.style.display = "none";
    playpauseicon.classList.remove("paused");

    // Animate while playing
    window.requestAnimationFrame(playLoop);
  }
}

let oldTimeStamp: number = 0;
let fps = 0;

function playLoop(timestamp) {

  // Calculate the frames per second
  const secondsPassed = (timestamp - oldTimeStamp) / 1000;
  oldTimeStamp = timestamp;
  fps = Math.round(1 / secondsPassed);

  // Calculate which bar we are on 
  const pos = audio.currentTime / config.tempo;

  setBar(pos);
  canvas.draw(current, fps);

  if (pos >= 140) {
    setBar(0);
    audio.currentTime = 0;
    pause();
  }
  else if (!audio.paused) {
    window.requestAnimationFrame(playLoop);
  }
}


function pause() {
  if (!audio.paused) {
    audio.pause();
    playpauseicon.classList.add("paused");
  }
}

function playpause() {
  if (audio.paused) {
    play();
  }
  else {
    pause();
  }
}


// -----------------------------------------------------
// Field events (chaning choir, part or bar)
// -----------------------------------------------------

function pauseAndRepaintNoLoad() {
  setChoir(Number(choirselect.value));
  setPart(Number(partselect.value));
  setBar(Number(barinput.value));

  // update the audio location 
  // HACK: this can't be the right place for this next line!
  audio.currentTime = current.bar * config.tempo;

  pauseAndRepaint(false);
}

function pauseAndRepaint(load = true) {
  pause();
  if (load) {
    loadAudio(current.choir, current.part, current.bar);
  }
  canvas.draw(current, fps);
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
        setBar(canvas.seek(current, +1));
        pauseAndRepaint();
        break;
      case 'ArrowLeft':
        setBar(canvas.seek(current, -1));
        pauseAndRepaint();
        break;
      default:
        break;
    }
    return;
  }
  if (e.code == 'Enter') {
    playpause();
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
      setChoir(e.key);
      pauseAndRepaint();
      break;
    case 'KeyS':
    case 'KeyA':
    case 'KeyT':
    case 'KeyR':
    case 'KeyB':
      setPart("satrb".indexOf(e.key));
      pauseAndRepaint();
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
      setBar(current.bar + 1);
      pauseAndRepaint();
      e.preventDefault();
      break;
    case 'ArrowLeft':
      setBar(current.bar - 1);
      pauseAndRepaint();
      e.preventDefault();
      break;
    case 'ArrowDown':
      setChoir(current.choir >= config.choirs - 1 ? 0 : current.choir + 1);
      pauseAndRepaint();
      break;
    case 'ArrowUp':
      setChoir(current.choir <= 0 ? config.choirs - 1 : current.choir - 1);
      pauseAndRepaint();
      break;
    case 'KeyX':
      setPart("all");
      pauseAndRepaint();
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
  loadColors();
  pauseAndRepaint();
}

function toggleScore(forceEarly = false) {
  if (current.period === "modern" || forceEarly) {
    current.period = "early";
    scorebars = scorebars_early;
  }
  else {
    current.period = "modern";
    scorebars = scorebars_modern;
  }
  setChoir(current.choir, true);
  pauseAndRepaint();
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

  pauseAndRepaint();
  play();
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

window.addEventListener("load", async () => {

  // On mobiles, 100vh sometimes is the total vertical space
  // of the browser, but we don't want to include the browser's
  // header and footer in that, so calculate using visible vertical space.
  setVH();

  loadColors();

  // canvas = new CanvasView() as CanvasView;
  canvas.color = colors;

  // read choir, part and bar from the URL
  parseURL();
  pauseAndRepaint();

  playpausebutton.addEventListener('click', playpause);

  // svgobject.addEventListener("click", scoreClicked);
  [choirselect,
    partselect,
    barinput].forEach(el => el.addEventListener('change', pauseAndRepaintNoLoad));
  document.addEventListener("keydown", keyboardTapped);
  info.addEventListener("click", () => showHelp(true));
  backdrop.addEventListener("click", () => showHelp(false));
  darkswitch.addEventListener("click", () => toggleDark());
  scoreswitch.addEventListener("click", () => toggleScore());
  canvas.addEventListener("music-canvas-click", handleCanvasClick as (e: Event) => void);
  canvas.addEventListener("music-canvas-hover", handleCanvasHover as (e: Event) => void);

  // watch for change in user's preference of color scheme
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    toggleDark();
    loadColors();
    pauseAndRepaint();
  });

  // Next line not really necessary, but will make it look clearer on browser resize
  // window.addEventListener("resize", () => {calculateCanvasSize(); draw(); });
  window.addEventListener('resize', () => setVH());
});