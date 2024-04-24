
import './src/scss/style.scss';

import { scorebars } from "./src/js/barlines.js";
import { setupLilypondParser, processLilypond, dict, ranges } from "./src/js/lily.js";

import lilypondfile from "./src/lilypond/spem notes.ly?raw";

import { spemsvg, spemmp3array } from './src/js/svgmp3imports.js';

import spemmp3 from "./src/audio/spem.mp3";

// (minim = 62) === (beattime = 0.9677)
const beattime = 60 / 62;

// const container = document.getElementById("spemFrame");
const canvas = document.getElementById("spemCanvas");
const spemscore = document.getElementById("spemScore");
const playpausebutton = document.getElementById('playpausebutton');
const playpauseicon = document.getElementById('playpauseicon');
const choirselect = document.getElementById('choir-select');
const partselect = document.getElementById('part-select');
const barinput = document.getElementById('bar-field');
const statusarea = document.getElementById('statusarea');
const choiroutput = document.getElementById('choir-output');
const partoutput = document.getElementById('part-output');
const baroutput = document.getElementById('bar-output');
const info = document.getElementById('info');
const help = document.getElementById('help');
const backdrop = document.getElementById('backdrop');
const spinner = document.getElementById('spinner');
const darkswitch = document.getElementById('darkswitch');

const allparts = ['soprano', 'alto', 'tenor', 'baritone', 'bass']; // HACK: this is repeasted later

// State
var currentChoir;  // from 1 to 8
var currentPart;  // 0 means All parts; 1 is Soprano... 5 is Bass
var currentBar;



var svg; // the actual SVG
var spemaudio = new Audio();

let canvasPadding = 5;  // padding in px of the canvas

let barWidth = 0;
let choirHeight = 0;
let partHeight = 0;

const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
if (prefersDarkScheme.matches) {
  document.body.classList.add('dark-theme');
  darkswitch.checked = true;
} else {
  document.body.classList.remove('dark-theme');
  darkswitch.checked = false;
}

// All the colors are defined in the style sheet
var backgroundColor, highlightColor, scoreHighlightColor, choirColors;
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

function getPartName(n) {
  return allparts[n - 1];
}

// TODO: click on score should send you to bar.  And part?
// TODO: Change dark mode to moon/sun icons
// TODO: Add hide/show icon to remove score
// TODO: Visual effect for false relations
// TODO: switching dark mode should not stop play
// TODO: Better font/graphic for Spem Player title
// BUG: can scroll up and down a tiny bit in score
// BUG: [Violation] Forced reflow while executing JavaScript took 36ms  (this doesn't happen when you have already manually adjusted the height of the score - something to do with the flex: 1 after the reload?)
// TODO: build: minimise SVGs in build process
// TODO: build: minimse SVGs using <use> and <defs> elements
// TODO: build: generate SVG from lilypond as part of build process
// TODO: build: Automatically remove the height and width from the lilypond generate SVGs
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

// where c = 1 to 8
async function setChoir(c) {
  c = Number(c);
  if (currentChoir == c) {
    return;
  }
  currentChoir = Math.min(Math.max(1, c), 8);

  // Update the input field
  if (choirselect.value != currentChoir) {
    choirselect.value = currentChoir;
  }

  // load the correct score for this choir
  await fetch(spemsvg[currentChoir - 1])
    .then(r => r.text())
    .then(text => {
      spemscore.innerHTML = text;
    })
    .catch(console.error.bind(console));

  // set the border color to match
  spemscore.style.borderColor = `hsla(${choirColors[currentChoir - 1]}, 80%, 55%, 1)`;

  // scroll the score to match the new choir (with instant scrolling)
  setBar(currentBar, true);
}

// where p = 0 (for all parts) or 1 - 5 for SATBarB
function setPart(p) {
  if (currentPart == p) {
    return;
  }
  currentPart = Math.min(Math.max(0, p), 5); // 0 to 5 inclusive

  // Update the input field
  if (partselect.value != currentPart) {
    partselect.value = currentPart;
  }
}


var previousBarHighlight;

// where b = 0 to 139
function setBar(b, changedChoirs = false) {
  if (b == currentBar && !changedChoirs) {
    return;
  }
  if (b > 139) {
    playpauseicon.classList.add("paused");
    b = 0;
  }
  else if (b < 0) {
    b = 139;
  }
  currentBar = b;

  // update the input field
  if (barinput.value != currentBar) {
    barinput.value = currentBar;
  }

  // const subdoc = svgobject.getSVGDocument();  
  // HACK: get SVG in a better way than just the second SVG on the page!
  svg = document.getElementsByTagName("svg")[1];
  // pt = svg.createSVGPoint();  // HACK: Created once for document

  // Highlight the current bar on the score
  if (b > 0 && b < 139) {
    var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
    newElement.setAttribute("x", scorebars[currentChoir - 1][b - 1]);
    newElement.setAttribute("y", "0");
    const bw = (b >= 138 ? svg.getBBox().width - scorebars[currentChoir - 1][137] : scorebars[currentChoir - 1][b] - scorebars[currentChoir - 1][b - 1]);
    newElement.setAttribute("width", bw);
    newElement.setAttribute("height", svg.getBBox().height);
    newElement.style.fill = scoreHighlightColor; //Set stroke colour
    newElement.style.fillOpacity = 0.1;
    newElement.style.strokeWidth = "5px"; //Set stroke width
    svg.appendChild(newElement);
  }

  if (previousBarHighlight != undefined) {
    if (svg.contains(previousBarHighlight)) {
      svg.removeChild(previousBarHighlight);
    }
  }
  previousBarHighlight = newElement;

  // scroll the the right place
  var pos = getScrollPosition(b);
  spemscore.scrollTo({
    top: 0,
    left: pos, 
    behavior: changedChoirs ? "instant" : "smooth"
  });
}

function getScrollPosition(bar) {
  var idealBarPos = 0.25;
  var frameWidth = spemscore.offsetWidth; // the width of the visible score on the screen
  var scoreWidth = svg.getBoundingClientRect().width; // the total width of the score
  var svgWidth = svg.getBBox().width; // the width of the score in SVG unit
  var pos = scorebars[currentChoir - 1][bar - 1] * scoreWidth / svgWidth; // current % along the score
  pos -= idealBarPos * frameWidth;
  return pos;
}

function parseURL() {
  const url = window.location.search.substring(1);
  const parms = url.split("&");

  var choir = 1; // default choir
  var part = 0;
  var bar = 0;
  for (let i = 0; i < parms.length; i++) {
    const p = parms[i].split("=");
    if (p[0] == "choir") {
      choir = Number(p[1]);
    }
    else if (p[0] == "part") {
      part = Number(p[1]);
    }
    else if (p[0] == "bar") {
      bar = Number(p[1]);
    }
  }
  setChoir(choir);
  setPart(part);
  setBar(bar);
}

function calculateCanvasSize() {
  canvas.width = canvas.clientWidth * 4;
  canvas.height = 300 * 2;

  barWidth = (canvas.width - (2 * canvasPadding)) / 140;
  choirHeight = (canvas.height - (2 * canvasPadding)) / 8;
  partHeight = choirHeight / 5;
}

function showLoadingOnCanvas() {
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.font = "30px Arial";
  ctx.fillStyle = "white";
  ctx.scale(canvas.width / canvas.height, 1);
  ctx.fillText(`Loading...`, 0, canvas.height / 2);
  ctx.restore();
}

// define array pulses[choir][part] to be min transparency which
// will be pulsed when the choir is singing a note.
var pulses = [];
for (var c = 0; c < 8; c++) {
  pulses[c] = [];
  for (var p = 0; p < 5; p++) {
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
      pulses[n.c][n.p] = easeOutCubic(pos % quant, 1.4, -0.4, n.n.duration.sfths / 128);
    }
  }

  setBar(bar);
}

function easeOutCubic(t, b, c, d) {
  return c * ((t = t / d - 1) * t * t + 1) + b;
}

function draw(currentpos) {

  if (currentpos == undefined) {
    currentpos = currentBar;
  }

  // Blank out the whole canvas
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw FPS number to the screen
  if (!isNaN(fps)) {
    ctx.font = '25px Arial';
    ctx.fillStyle = '#CCC';
    ctx.fillText("FPS: " + fps, 10, canvas.height - 30);
  }

  // Draw bar highlight
  if (currentBar > 0 && currentBar <= 139) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(canvasPadding + (currentBar * barWidth), canvasPadding);
    ctx.lineTo(canvasPadding + (currentBar * barWidth), canvas.height - canvasPadding);
    ctx.lineWidth = barWidth * 1.4;
    ctx.strokeStyle = highlightColor;
    ctx.lineCap = "square";
    ctx.stroke();
    ctx.restore();
  }

  // Draw highlight line for the selected choir or choir and part
  var startY, width;
  if (currentPart != 0) {
    startY = canvasPadding + ((currentChoir - 1) * choirHeight) + ((currentPart - 1) * partHeight);
    width = partHeight * 1.4;
  }
  else {
    // center the highlight on the middle tenor line
    startY = canvasPadding + ((currentChoir - 1) * choirHeight) + (2 * partHeight);
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
  for (let c = 0; c < 8; c++) {
    for (let p = 0; p < 5; p++) {
      const startY = canvasPadding + (c * choirHeight) + (p * partHeight);

      const list = ranges[c][p];
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

        var lightness, saturation, transparency;

        // If current bar is highlighted
        if (currentpos >= from && currentpos < to) {
          saturation = 80;
          lightness = (67 - (3 * p)) * pulses[c][p];
          transparency = 1; // pulses[c][p];
        }
        // if current choir/part is highlighted
        else if (c == (currentChoir - 1) && (currentPart == 0 || p == (currentPart - 1))) {
          saturation = 80;
          lightness = 67 - (3 * p);
          transparency = 1;
        }
        // else if (c == (currentChoir - 1) && p == (currentPart - 1)) {
        //   lightness = 67 - (3 * p);
        //   saturation = 80;
        //   transparency = 1;
        // }
        else if (currentBar === 0 || currentBar > 138) {
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

function getMousePos(canv, evt) {
  const rect = canv.getBoundingClientRect();
  const y = (evt.offsetY * 8) / rect.height;
  return [
    Math.floor(y + 1),
    Math.floor(((y % 1) * 5) + 1),
    // Math.floor(((evt.offsetX * 138) / rect.width) + 1),
    Math.floor((evt.offsetX * 140) / rect.width),
  ];
}

function getFilename(s) {
  return s.split("/").pop();
}

function loadAudio(c, p, b) {
  // let newfile = defaultaudiofile
  let newfile = spemmp3;
  if (c != '0' && p != '0') {
    newfile = spemmp3array[c - 1][p - 1];
  }

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

  choiroutput.textContent = "Choir " + c;
  partoutput.textContent = getPartName(p);
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
  setChoir(choirselect.value);
  setPart(partselect.value);
  setBar(barinput.value);

  // update the audio location 
  // HACK: this can't be the right place for this next line!
  spemaudio.currentTime = currentBar * 4 * beattime;

  pauseAndRepaint(false);
}

function pauseAndRepaint(load = true) {
  pauseSpem();
  if (load) {
    loadAudio(currentChoir, currentPart, currentBar);
  }
  draw();
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
        setBar(seek(currentBar, +1));
        pauseAndRepaint();
        break;
      case 'ArrowLeft':
        setBar(seek(currentBar, -1));
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
      setPart("satrb".indexOf(e.key) + 1);
      pauseAndRepaint();
      break;

    case 'ArrowRight':
      setBar(currentBar + 1);
      pauseAndRepaint();
      e.preventDefault();
      break;
    case 'ArrowLeft':
      setBar(currentBar - 1);
      pauseAndRepaint();
      e.preventDefault();
      break;
    case 'ArrowDown':
      setChoir(currentChoir == 8 ? 1 : currentChoir + 1);
      pauseAndRepaint();
      break;
    case 'ArrowUp':
      setChoir(currentChoir == 1 ? 8 : currentChoir - 1);
      pauseAndRepaint();
      break;
    case 'KeyX':
      setPart(0);
      pauseAndRepaint();
      break;
    default:
  }

}

// -----------------------------------------------------
// Touch events (mobible, iPad)
// -----------------------------------------------------

// TODO: Not convinced the Maths for getTouchPos() is right...
function getTouchPos(evt) {
  var rect = canvas.getBoundingClientRect();
  var choir = Math.ceil(8 * ((evt.targetTouches[0].clientY - rect.top - (canvasPadding)) /
    (canvas.clientHeight - (2 * canvasPadding))));
  choir = Math.min(Math.max(1, choir), 8); // must be from 1 to 8
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


function seek(b, direction) {
  const choirnotes = dict[b].filter(x => x.c == currentChoir - 1);
  const singing = choirnotes.length != 0;

  // loop until we find a bar where choir is not doing what it's doing in currentBar

  var changed = false;
  do {
    b = b + direction;
    const newsinging = (dict[b].filter(x => x.c == currentChoir - 1).length != 0);
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

  // watch for change in user's preference of color scheme
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    darkswitch.checked = !darkswitch.checked;
    loadColors();
    pauseAndRepaint();
  });

  // Next line not really necessary, but will make it look clearer on browser resize
  // window.addEventListener("resize", () => {calculateCanvasSize(); draw(); });
  window.addEventListener('resize', () => setVH());
});