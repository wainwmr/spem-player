
// TODO: Perhaps locations = { json: <String>, defaultaudio: <String>, audio: <String>[8][5] }?
let defaultaudiofile = '/audio/spem.mp3';
let jsonFilename = '/assets/spem.json';

var spemaudio = new Audio();

// storing the definition of all the voice parts
var json;

// const beattime = 0.97; // seconds per beat
const beattime = 0.967;

let timerId = 0;

const container = document.getElementById("spemFrame");
const canvas = document.getElementById("spemCanvas");
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

const allparts = ['soprano', 'alto', 'tenor', 'baritone', 'bass'];

let canvasPadding = 5;  // padding in px of the canvas
let barWidth = 0;
let choirHeight = 0;
let partHeight = 0;

// All the colors are defined in the style sheet
var style = getComputedStyle(document.body);
const backgroundColor = style.getPropertyValue('--color-background');
const lineColor = style.getPropertyValue('--color-text');
const choirColors = [
  style.getPropertyValue('--color-c1'),
  style.getPropertyValue('--color-c2'),
  style.getPropertyValue('--color-c3'),
  style.getPropertyValue('--color-c4'),
  style.getPropertyValue('--color-c5'),
  style.getPropertyValue('--color-c6'),
  style.getPropertyValue('--color-c7'),
  style.getPropertyValue('--color-c8')
 ];

// Parse "21.75-25.5" into two floats
function getRange(s) {
  if (!s) return [999, 999]; 
  return s.split("-").map(numStr => parseFloat(numStr));
}

function getPartName(n) {
  return allparts[n - 1];
}

// use changed to know whether we need to redraw or not
var changed = true;

function setChoir(c) {
  const oldChoir = choirselect.value;
  if (c != oldChoir) {
    if (isNaN(c)) {
      c = 0;  
    }
    choirselect.value = c;
    changed = true;
  }
}

function setPart(p) {
  const oldPart = partselect.value;
  if (p != oldPart) {
    if (isNaN(p)) {
      p = 0;  
    }
    partselect.value = p;
    changed = true;
  }
}

function setBar(b) {
  const oldBar = barinput.value;
  if (b != oldBar) {
    if (isNaN(b)) {
      b = 0;  
    }
    if (b > 140) {
      playpauseicon.classList.add("paused");
      window.clearInterval(timerId);
      b  = 0;
    }
    else if (b < 0) {
      b = 139;
    }
    barinput.value = b;
    changed = true;
  }
}

function parseURL() {
  const url = window.location.search.substring(1);
  const parms = url.split("&");
  
  for (let i=0; i < parms.length;i++) {
    const p = parms[i].split("=");
    if (p[0] == "choir") {
      setChoir(p[1]);
    }
    else if (p[0] == "part") {
      setPart(p[1]);
    }
    else if (p[0] == "bar") {
      setBar(Number(p[1]));
    }
  }
}

function calculateCanvasSize() {
  canvas.width = container.clientWidth * 4;
  canvas.height = 300 * 2;

  barWidth = (canvas.width - (2 * canvasPadding)) / 140;
  choirHeight = (canvas.height - (2 * canvasPadding)) / 8;
  partHeight = choirHeight / 5;

  // console.log(`calculateCanvasSize(): canvas.width= ${canvas.width}, canvas.height=${canvas.height}, barWidth=${barWidth}, choirHeight=${choirHeight}, partHeight=${partHeight}`)

  changed = true;
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

function paintCanvas() {

  if (!changed || barWidth === 0) {
    return;
  }
  changed = false;

  // Blank out the whole canvas
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw background line if there is a selected choir & part
  if (choirselect.value != 0 && partselect.value != 0) {
    const c = Number(choirselect.value) - 1;
    const p = Number(partselect.value) - 1;
    const startY = canvasPadding + (c * choirHeight) + (p * partHeight);
    ctx.beginPath();
    ctx.moveTo(canvasPadding + barWidth, startY + (partHeight / 2));
    ctx.lineTo(canvasPadding + (140 * barWidth) - barWidth, startY + (partHeight / 2));
    ctx.lineWidth = partHeight * 1.4;
    ctx.strokeStyle = '#f6f3a8';
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Draw each of the 40 voice parts
  ctx.lineWidth = 0.9 * partHeight;
  ctx.lineCap = "round";
  for (let c = 0; c < 8; c++) {
    const parts = json.choirs[c].parts;
    for (let p = 0; p < 5; p++) {
      const startY = canvasPadding + (c * choirHeight) + (p * partHeight);

      const ranges = parts[p].ranges;
      ranges.forEach(r => {
        const [from, to] = getRange(r);
        ctx.beginPath();
        // The weird 0.3 is because we're using rounded lines
        const startX = canvasPadding + ((from + 0.3) * barWidth);
        const endX = canvasPadding + ((to - 0.3) * barWidth);
        const Y = startY + (partHeight / 2);
        ctx.moveTo(startX, Y);
        ctx.lineTo(endX, Y);
        ctx.strokeStyle = `hsl(${choirColors[c]}, 50%, ${67 - (5 * p)}%)`;
        ctx.stroke();
      });
    }
  }

  ctx.save();
  let b = barinput.value;
  ctx.lineWidth = Math.max(barWidth / 3, 8);
  ctx.strokeStyle = lineColor;
  ctx.beginPath();
  ctx.moveTo(canvasPadding + (b * barWidth), canvasPadding);
  ctx.lineTo(canvasPadding + (b * barWidth), canvas.height - canvasPadding);
  ctx.setLineDash([0.8 * partHeight, 1.6 * partHeight]);
  ctx.stroke();
  ctx.restore();
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
  let newfile = defaultaudiofile;
  if (c != '0' && p != '0') {
    newfile = `/audio/spem-${c}-${getPartName(p)}.mp3`;
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

    playpauseicon.style.display = "none";
    spinner.style.display="block";

    await spemaudio.play();

    playpauseicon.style.display = "block";
    spinner.style.display="none";

    playpauseicon.classList.remove("paused");
    window.clearInterval(timerId);
    timerId = setInterval(() => {
      setBar(Math.floor(spemaudio.currentTime / (beattime * 4)));
      paintCanvas();
    }, beattime * 100);
  }
}

function pauseSpem() {
  if (!spemaudio.paused) {
    spemaudio.pause();
    playpauseicon.classList.add("paused");
    window.clearInterval(timerId);
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

function pauseAndRepaint(load = true) {
  pauseSpem();
  if (load) {
    loadAudio(choirselect.value, partselect.value, barinput.value);
  }
  changed = true;
  // If Choir or Part is All, then set the other to All
  if (choirselect.value === '0') {
    setPart(0);
    partselect.disabled = true;
  }
  else {
    if (partselect.value === '0') {
      setPart(1); // Soprano
    }
    partselect.disabled = false;
  }
  paintCanvas();
}

// -----------------------------------------------------
// Keyboard events (wasd)
// -----------------------------------------------------

let lastPart = 0;
let lastChoir = 0;
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
  if (e.code == 'Enter') {
    playpause();
    return;
  }
  if (e.code === 'KeyD') {
    setBar(Number(barinput.value) + 1);
    pauseAndRepaint();
  }
  else if (e.code === 'KeyA') {
    setBar(Number(barinput.value) - 1);
    pauseAndRepaint();
  }
  else if (e.code === 'KeyS') {
    if ((choirselect.value === '8') && (partselect.value === '5')) {
      setChoir(0);
      setPart(0);
    }
    else {
      const p = (Number(partselect.value) % 5) + 1;  // zero-index, add 1, mod 5 and then one-index the parts
      setPart(p);
      if (p === 1) {
        const c = (Number(choirselect.value) % 8) + 1;  // mod 8 and one-index the choirs
        setChoir(c);
      }
    }
    pauseAndRepaint();
  }
  else if (e.code === 'KeyW') {
    if ((choirselect.value === '0') && (partselect.value === '0')) {
      setChoir(8);
      setPart(5);
    }
    else {
      const p = (4 + Number(partselect.value)) % 5;
      setPart(p);
      if (p === 0) {
        setPart(5);
        const c = ((7 + Number(choirselect.value)) % 8);
        setChoir(c);
      }
    }
    pauseAndRepaint();
  }
  // Toggle between ALL choirs and selected choir
  else if (e.code === 'KeyX') {
    if (choirselect.value != 0 || partselect.value != 0) {
      lastChoir = choirselect.value;
      lastPart = partselect.value;
      setChoir(0);
      setPart(0);
    }
    else {
      setChoir(lastChoir);
      setPart(lastPart);
    }
    pauseAndRepaint();
  }
}

// -----------------------------------------------------
// Touch events (mobible, iPad)
// -----------------------------------------------------

// TODO: Not convinced the Maths for getTouchPos() is right...
function getTouchPos(evt) {
  return (evt.targetTouches[0].pageX * 140 / canvas.clientWidth);
}

// BUG: on mobile, touch to move bar to half-way and play
// and it starts from bar 0.
function touchStarted(evt) {
  setBar(parseInt(getTouchPos(evt)));
  pauseAndRepaint(false);

  // BUG: [Violation] Added non-passive event listener to a scroll-blocking <some> event.
  // Can we use no bubble thing instead of preventDefault()?  Don't want gestures on canvas
  // to move the screen around when on mobile.
  evt.preventDefault();

  canvas.addEventListener("touchmove", (e) => {
    setBar(parseInt(getTouchPos(e)));
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


// -----------------------------------------------------
// Setup page
// -----------------------------------------------------

window.addEventListener("load", async () => {
  calculateCanvasSize();
  showLoadingOnCanvas();
  const response = await fetch(jsonFilename);
  json = await response.json();

  // read choir, part and bar from the URL
  parseURL();
  pauseAndRepaint();

  playpausebutton.addEventListener('click', playpause);

  canvas.addEventListener('click', canvasClicked);
  canvas.addEventListener('mousemove', canvasMoved, false);
  [choirselect,
    partselect,
    barinput].forEach(el => el.addEventListener('change', pauseAndRepaint));
  document.addEventListener("keydown", keyboardTapped);
  canvas.addEventListener("touchstart", touchStarted, { passive: false });
  info.addEventListener("click", () => showHelp(true));
  backdrop.addEventListener("click", () => showHelp(false));

  // Next line not really necessary, but will make it look clearer on browser resize
  // window.addEventListener("resize", () => {calculateCanvasSize(); paintCanvas(json); });
});
