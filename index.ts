
import './src/scss/style.scss';

import { scorebars_modern, scorebars_early } from "./src/ts/barlines";
import { PartType, Ensemble } from "./src/ts/ensemble";

import { setupLilypondParser, processLilypond, dict, ranges } from "./src/ts/lily.ts";
import { spemsvg_early, spemsvg_modern, spemmp3array } from './src/ts/svgmp3imports.ts';

const lilypondfile = "/lilypond/spem notes.ly";

// (minim = 62) === (beattime = 0.9677)
const beattime = 60 / 62;


// const container = document.getElementById("spemFrame");
const canvas = document.getElementById("spemCanvas") as HTMLCanvasElement;
const spemscore = document.getElementById("spemScore") as HTMLDivElement;
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

// const allparts = ['soprano', 'alto', 'tenor', 'baritone', 'bass']; // HACK: this is repeasted later
const ens = new Ensemble(8, ["Soprano", "Alto", "Tenor", "Baritone", "Bass"]);

// const allparts = ens.parts();

type Brightness = "dark" | "light";
type ScoreType = "early" | "modern";

type State = {
  viewmode: Brightness;
  period: ScoreType;
  choir: number;
  part: PartType;
  position: number;
}

var current: State = {
  viewmode: "dark",
  period: "modern",
  choir: 0,
  part: "all",
  position: 0
}

var spemsvg = (current.period === "early" ? spemsvg_early : spemsvg_modern);
var scorebars = (current.period == "early" ? scorebars_early : scorebars_modern);

var svg; // the actual SVG
var spemaudio = new Audio();

let canvasPadding = 5;  // padding in px of the canvas

let barWidth = 0;
let choirHeight = 0;
let partHeight = 0;

const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
if (prefersDarkScheme.matches) {
  document.body.classList.add('dark-theme');
  current.viewmode = "dark";
} else {
  document.body.classList.remove('dark-theme');
  current.viewmode = "light";
}

// All the colors are defined in the style sheet
var backgroundColor: string, highlightColor: string, scoreHighlightColor: string, choirColors: string[];
function loadColors() {
  var style = getComputedStyle(document.body);
  backgroundColor = style.getPropertyValue('--color-background');
  highlightColor = style.getPropertyValue('--color-highlight');
  scoreHighlightColor = style.getPropertyValue('--color-score-highlight');
  choirColors = [
    style.getPropertyValue('--color-c1'),
    style.getPropertyValue('--color-c2'),
    style.getPropertyValue('--color-c3'),
    style.getPropertyValue('--color-c4'),
    style.getPropertyValue('--color-c5'),
    style.getPropertyValue('--color-c6'),
    style.getPropertyValue('--color-c7'),
    style.getPropertyValue('--color-c8')
  ];
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
  current.choir = Math.min(Math.max(0, c), ens.choirs.length - 1);

  // Update the input field
  if (choirselect != null && choirselect.value != String(current.choir)) {
    choirselect.value = String(current.choir);
  }

  // load the correct score for this choir
  await fetch(spemsvg[current.choir])
    .then(r => r.text())
    .then(text => {
      spemscore.innerHTML = text;
    })
    .catch(console.error.bind(console));

  // set the border color to match
  spemscore.style.borderColor = `hsla(${choirColors[current.choir]}, 80%, 55%, 1)`;

  // scroll the score to match the new choir (with instant scrolling)
  setBar(current.position, true);
}

// where p = "all" or 0 -> (ens.part.length-1) for SATB
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
  if (b == current.position && !changedChoirs) {
    return;
  }
  if (b > 139) {
    playpauseicon.classList.add("paused");
    b = 0;
  }
  else if (b < 0) {
    b = 139;
  }
  current.position = b;

  // update the input field
  if (barinput != null && barinput.value != String(current.position)) {
    barinput.value = String(current.position);
  }

  svg = document.querySelector("#spemScore svg");

  if (previousBarHighlight != undefined) {
    if (svg.contains(previousBarHighlight)) {
      svg.removeChild(previousBarHighlight);
    }
  }

  // Highlight the current bar on the score
  if (b > 0 && b < 139) {
    var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
    newElement.setAttribute("x", String(scorebars[current.choir][b - 1]));
    newElement.setAttribute("y", "0");
    const bw = (b >= 138 ? svg.getBBox().width - scorebars[current.choir][137] : scorebars[current.choir][b] - scorebars[current.choir][b - 1]);
    newElement.setAttribute("width", String(bw));
    newElement.setAttribute("height", String(svg.getBBox().height * 2));  // HACK: why times two???
    newElement.style.fill = scoreHighlightColor; //Set stroke colour
    newElement.style.fillOpacity = "0.1";
    newElement.style.strokeWidth = "5px"; //Set stroke width
    svg.appendChild(newElement);
    previousBarHighlight = newElement;
  }


  // scroll the the right place
  var pos = getScrollPosition(b);
  spemscore.scrollTo({
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
  var frameWidth = spemscore.offsetWidth; // the width of the visible score on the screen
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
      if (n >= 0 && n < ens.parts.length) part = n;
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
  setChoir(choir);
  setPart(part);
  setBar(bar);
  toggleScore(early);
  if (dark) {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
    current.viewmode = "dark"; 
    loadColors();
  }
}

function calculateCanvasSize() {
  canvas.width = canvas.clientWidth * 4;
  canvas.height = 300 * 2;

  barWidth = (canvas.width - (2 * canvasPadding)) / 140;
  choirHeight = (canvas.height - (2 * canvasPadding)) / ens.choirs.length;
  partHeight = choirHeight / ens.parts.length;
}

function showLoadingOnCanvas() {
  const ctx = canvas.getContext("2d");
  if (ctx != null) {
    ctx.save();
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.scale(canvas.width / canvas.height, 1);
    ctx.fillText(`Loading...`, 0, canvas.height / 2);
    ctx.restore();
  }
}

// define array pulses[choir][part] to be min transparency which
// will be pulsed when the choir is singing a note.
var pulses: number[][] = [];
for (var c of ens.choirs) {
  pulses[c] = [];
  for (var p of ens.parts) {
    pulses[c][p] = 1;
  }
}

function update(pos = 0) {

  const bar = Math.floor(pos);

  // find who has a note that starts in this current quaver (16th of a bar)
  const quant = Math.floor(pos * 16) / 16;
  const notes = dict[quant];

  // 
  if (notes != undefined && notes.length > 0) {
    for (var n of notes) {
      if (n.n.duration != null) {
        pulses[n.c][n.p] = easeOutCubic(pos % quant, 1.4, -0.4, n.n.duration.sfths / 128);
      }
    }
  }

  setBar(bar);
}

function easeOutCubic(t, b, c, d) {
  return c * ((t = t / d - 1) * t * t + 1) + b;
}

function draw(currentpos: number) {

  if (currentpos == undefined) {
    currentpos = current.position;
  }

  // Blank out the whole canvas
  const ctx = canvas.getContext("2d");
  if (ctx == null) return;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw FPS number to the screen
  if (!isNaN(fps)) {
    ctx.font = '25px Arial';
    ctx.fillStyle = '#CCC';
    ctx.fillText("FPS: " + fps, 10, canvas.height - 30);
  }

  // Draw bar highlight
  if (current.position > 0 && current.position <= 139) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(canvasPadding + (current.position * barWidth), canvasPadding);
    ctx.lineTo(canvasPadding + (current.position * barWidth), canvas.height - canvasPadding);
    ctx.lineWidth = barWidth * 1.4;
    ctx.strokeStyle = highlightColor;
    ctx.lineCap = "square";
    ctx.stroke();
    ctx.restore();
  }

  // Draw highlight line for the selected choir or choir and part
  var startY: number, width: number;
  if (current.part != "all") {
    startY = canvasPadding + (current.choir * choirHeight) + (current.part * partHeight);
    width = partHeight * 1.4;
  }
  else {
    // center the highlight on the middle tenor line
    startY = canvasPadding + (current.choir * choirHeight) + (2 * partHeight);
    width = (partHeight * 5.8);
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(canvasPadding + barWidth, startY + (partHeight / 2));
  ctx.lineTo(canvasPadding + (140 * barWidth) - barWidth, startY + (partHeight / 2));
  ctx.lineWidth = width;
  ctx.strokeStyle = highlightColor;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();

  // Draw each of the 40 voice parts
  ctx.lineWidth = 0.9 * partHeight;
  ctx.lineCap = "round";
  for (var c of ens.choirs) {
    for (var p of ens.parts) {
      const startY = canvasPadding + (c * choirHeight) + (p * partHeight);

      const list: { "from": number, "to": number }[] = ranges[c][p];
      list.forEach(r => {
        const from = r.from;
        const to = r.to;

        ctx.beginPath();
        // The weird 0.3 is because we're using rounded lines
        const startX = canvasPadding + ((from + 0.3) * barWidth);
        const endX = canvasPadding + ((to - 0.3) * barWidth);
        const Y = startY + (partHeight / 2);
        ctx.moveTo(startX, Y);
        ctx.lineTo(endX, Y);

        var lightness: number, saturation: number, transparency: number;

        // If current bar is highlighted
        if (currentpos >= from && currentpos < to) {
          saturation = 80;
          lightness = (67 - (3 * p)) * pulses[c][p];
          transparency = 1; // pulses[c][p];
        }
        // if current choir/part is highlighted
        else if (c == current.choir && (current.part == "all" || p == current.part)) {
          saturation = 80;
          lightness = 67 - (3 * p);
          transparency = 1;
        }
        // else if (c == currentChoir && p == currentPart) {
        //   lightness = 67 - (3 * p);
        //   saturation = 80;
        //   transparency = 1;
        // }
        else if (current.position === 0 || current.position > 138) {
          saturation = 50;
          lightness = 67 - (3 * p);
          transparency = 1;
        }
        else {
          saturation = 50;
          lightness = 67 - (3 * p);
          transparency = 0.5;
        }

        ctx.strokeStyle = `hsla(${choirColors[c]}, ${saturation}%, ${lightness}%, ${transparency})`;
        ctx.stroke();
      });
    }
  }
}

// BUG: what happens if you click in the canvas padding?
function getMousePos(canv, evt) {
  const rect = canv.getBoundingClientRect();
  const y = ((evt.offsetY - canvasPadding) * ens.choirs.length) / (rect.height - (2 * canvasPadding));
  return [
    Math.min(ens.choirs.length - 1, Math.max(0, Math.floor(y))),
    Math.floor((y % 1) * ens.parts.length),
    // Math.floor(((evt.offsetX * 138) / rect.width) + 1),
    Math.floor((evt.offsetX * 140) / rect.width),
  ];
}

function getFilename(s) {
  return s.split("/").pop();
}

function loadAudio(c: number, p: PartType, b: number) {
  const newfile = ens.getMP3filename(c, p, "/audio/");
  console.log(newfile);

  // just compare the filename, not the whole URL, to see if we
  // need to load a new MP3
  if (getFilename(newfile) != getFilename(spemaudio.currentSrc)) {
    spemaudio.src = newfile;
    spemaudio.load();
  }

  spemaudio.currentTime = b * 4 * beattime;
}

async function playSpem() {
  if (spemaudio.paused) {

    // set the play button spinner while loading audio
    playpauseicon.style.display = "none";
    spinner.style.display = "block";

    await spemaudio.play();

    // set the play button to pause again
    playpauseicon.style.display = "block";
    spinner.style.display = "none";
    playpauseicon.classList.remove("paused");

    // Animate while playing
    window.requestAnimationFrame(playLoop);
  }
}

let oldTimeStamp;
let fps;  // frames per second

function playLoop(timestamp) {

  // Calculate the frames per second
  const secondsPassed = (timestamp - oldTimeStamp) / 1000;
  oldTimeStamp = timestamp;
  fps = Math.round(1 / secondsPassed);

  // Calculate which bar we are on 
  const pos = spemaudio.currentTime / (beattime * 4);

  update(pos);
  draw(pos);

  if (pos >= 140) {
    setBar(0);
    spemaudio.currentTime = 0;
    pauseSpem();
  }
  else if (!spemaudio.paused) {
    window.requestAnimationFrame(playLoop);
  }
}


function pauseSpem() {
  if (!spemaudio.paused) {
    spemaudio.pause();
    playpauseicon.classList.add("paused");
  }
}

function playpause() {
  if (spemaudio.paused) {
    playSpem();
  }
  else {
    pauseSpem();
  }
}

// -----------------------------------------------------
// Mouse events
// -----------------------------------------------------

function canvasClicked(e) {
  const [c, p, b] = getMousePos(canvas, e);

  setChoir(c);
  setPart(p);
  setBar(b);

  pauseAndRepaint();
  playSpem();
}


let intId = 0;
function canvasMoved(e) {
  const [c, p, b] = getMousePos(canvas, e);

  choiroutput.textContent = ens.getChoirName(c);
  partoutput.textContent = ens.getPartName(p);
  baroutput.textContent = "Bar " + b;
  statusarea.classList.remove("hide");
  clearInterval(intId);
  intId = setInterval(function () {
    statusarea.classList.add("hide");
  }, 1500);

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
  spemaudio.currentTime = current.position * 4 * beattime;

  pauseAndRepaint(false);
}

function pauseAndRepaint(load = true) {
  pauseSpem();
  if (load) {
    loadAudio(current.choir, current.part, current.position);
  }
  draw(current.position);
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
        setBar(seek(current.position, +1));
        pauseAndRepaint();
        break;
      case 'ArrowLeft':
        setBar(seek(current.position, -1));
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
      setBar(current.position + 1);
      pauseAndRepaint();
      e.preventDefault();
      break;
    case 'ArrowLeft':
      setBar(current.position - 1);
      pauseAndRepaint();
      e.preventDefault();
      break;
    case 'ArrowDown':
      setChoir(current.choir >= ens.choirs.length - 1 ? 0 : current.choir + 1);
      pauseAndRepaint();
      break;
    case 'ArrowUp':
      setChoir(current.choir <= 0 ? ens.choirs.length - 1 : current.choir - 1);
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

// -----------------------------------------------------
// Touch events (mobible, iPad)
// -----------------------------------------------------

// TODO: Not convinced the Maths for getTouchPos() is right...
function getTouchPos(evt) {
  var rect = canvas.getBoundingClientRect();
  var choir = Math.ceil(ens.choirs.length * ((evt.targetTouches[0].clientY - rect.top - (canvasPadding)) /
    (canvas.clientHeight - (2 * canvasPadding))));
  choir = Math.min(Math.max(1, choir), ens.choirs.length); 
  var bar = Math.round(140 * ((evt.targetTouches[0].clientX - rect.left - (canvasPadding)) /
    (canvas.clientWidth - (2 * canvasPadding))));
  bar = Math.min(Math.max(0, bar), 139); // must be from 0 to 139
  return [choir, bar];
}


// BUG: on mobile, touch to move bar to half-way and play
// and it starts from bar 0.
function touchStarted(evt) {
  const [c, b] = getTouchPos(evt);
  setChoir(c);
  setBar(b);
  pauseAndRepaint(false);

  // BUG: [Violation] Added non-passive event listener to a scroll-blocking <some> event.
  // Can we use no bubble thing instead of preventDefault()?  Don't want gestures on canvas
  // to move the screen around when on mobile.
  evt.preventDefault();

  canvas.addEventListener("touchmove", (evt) => {
    const [c, b] = getTouchPos(evt);
    setChoir(c);
    setBar(b);
    pauseAndRepaint(false);
  });
  canvas.addEventListener("touchend", () => {
    pauseAndRepaint();
    // playSpem();
  });
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
    spemsvg = spemsvg_early;
    scorebars = scorebars_early;
  }
  else {
    current.period = "modern";
    spemsvg = spemsvg_modern;
    scorebars = scorebars_modern;
  }
  setChoir(current.choir, true);
  pauseAndRepaint();
}


function seek(b, direction) {
  const choirnotes = dict[b].filter(x => x.c == current.choir);
  const singing = choirnotes.length != 0;

  // loop until we find a bar where choir is not doing what it's doing in currentBar

  var changed = false;
  do {
    b = b + direction;
    const newsinging = (dict[b].filter(x => x.c == current.choir).length != 0);
    changed = (singing != newsinging)
  } while (!changed && b > 0 && b < 139);
  return b;
}

function setVH() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
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
  calculateCanvasSize();
  showLoadingOnCanvas();

  await setupLilypondParser();
  await processLilypond(lilypondfile);

  // read choir, part and bar from the URL
  parseURL();
  pauseAndRepaint();

  playpausebutton.addEventListener('click', playpause);

  // svgobject.addEventListener("click", scoreClicked);
  canvas.addEventListener('click', canvasClicked);
  canvas.addEventListener('mousemove', canvasMoved, false);
  [choirselect,
    partselect,
    barinput].forEach(el => el.addEventListener('change', pauseAndRepaintNoLoad));
  document.addEventListener("keydown", keyboardTapped);
  canvas.addEventListener("touchstart", touchStarted, { passive: false });
  info.addEventListener("click", () => showHelp(true));
  backdrop.addEventListener("click", () => showHelp(false));
  darkswitch.addEventListener("click", () => toggleDark());
  scoreswitch.addEventListener("click", () => toggleScore());

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