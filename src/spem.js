/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

// Make an dictionary of music positions (hemidemisemiquavers/128) to array of notes {choir, part, note}
const dict = {};

// a dictionary to hold the muic in the lilypond input file
var scores = {};



// TODO: Perhaps locations = { json: <String>, defaultaudio: <String>, audio: <String>[8][5] }?
const defaultaudiofile = '/audio/spem.mp3';
const lilypondfile = '/spem notes.ly';

var spemaudio = new Audio();

// const beattime = 0.967; // old
const beattime = 0.968;

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
const darkswitch = document.getElementById('darkswitch');

const allparts = ['soprano', 'alto', 'tenor', 'baritone', 'bass'];

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
var backgroundColor, textColor, highlightColor, choirColors;
function loadColors() {
  var style = getComputedStyle(document.body);
  backgroundColor = style.getPropertyValue('--color-background');
  textColor = style.getPropertyValue('--color-text');
  highlightColor = style.getPropertyValue('--color-highlight');
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

// use changed to know whether we need to redraw or not
// var changed = true;

function setChoir(c) {
  const oldChoir = choirselect.value;
  if (c != oldChoir) {
    if (isNaN(c)) {
      c = 0;
    }
    choirselect.value = c;
    // changed = true;
  }
}

function setPart(p) {
  const oldPart = partselect.value;
  if (p != oldPart) {
    if (isNaN(p)) {
      p = 0;
    }
    partselect.value = p;
    // changed = true;
  }
}

function setBar(b) {
  const oldBar = barinput.value;
  if (b != oldBar) {
    if (isNaN(b)) {
      b = 0;
    }
    if (b > 139) {
      playpauseicon.classList.add("paused");
      b = 0;
    }
    else if (b < 0) {
      b = 139;
    }
    barinput.value = b;
    // changed = true;
  }
}

function parseURL() {
  const url = window.location.search.substring(1);
  const parms = url.split("&");

  for (let i = 0; i < parms.length; i++) {
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

  // changed = true;
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

  const duration = 0.5;

  // find who has a note that starts in this current quaver (16th of a bar)
  const quant = Math.floor(pos * 16) / 16;
  const notes = dict[quant];

  // 
  if (notes != undefined && notes.length > 0) {
    for (var n of notes) {
      pulses[n.c][n.p] = easeOutCubic(pos % quant, 1.3, -0.3, n.n.duration.sfths / 128);
    }
  }

  setBar(bar);
}

function easeInCubic (t, b, c, d) {
  return c * (t /= d) * t * t + b;
}

function easeOutCubic (t, b, c, d) {
  return c * ((t = t / d - 1) * t * t + 1) + b;
}

function easeOutQuad(t, b, c, d) {
  return -c * (t /= d) * (t - 2) + b;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.stroke();
}

function draw(currentpos) {

  let b = Number(barinput.value);
  if (currentpos == undefined) {
    currentpos = b;
  }

  // if (!changed || barWidth === 0) {
  //   return;
  // }
  // changed = false;

  // Blank out the whole canvas
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw FPS number to the screen
  // if (!isNaN(fps)) {
  //   ctx.font = '25px Arial';
  //   ctx.fillStyle = '#CCC';
  //   ctx.fillText("FPS: " + fps, 10, canvas.height - 30);
  // }

  // Draw bar highlight
  // roundedRect(ctx, canvasPadding + (b * barWidth), canvasPadding, barWidth, canvas.height - canvasPadding, 10);
  if (b > 0 && b <= 139) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(canvasPadding + (b * barWidth), canvasPadding);
    ctx.lineTo(canvasPadding + (b * barWidth), canvas.height - canvasPadding);
    ctx.lineWidth = barWidth * 1.4;
    ctx.strokeStyle = highlightColor;
    ctx.lineCap = "square";
    ctx.stroke();
    ctx.restore();
  }


  // Draw background line if there is a selected choir & part
  const selectedChoir = Number(choirselect.value);
  const selectedPart = Number(partselect.value);
  if (selectedChoir != 0 && selectedPart != 0) {
    ctx.save();
    const startY = canvasPadding + ((selectedChoir - 1) * choirHeight) + ((selectedPart - 1) * partHeight);
    ctx.beginPath();
    ctx.moveTo(canvasPadding + barWidth, startY + (partHeight / 2));
    ctx.lineTo(canvasPadding + (140 * barWidth) - barWidth, startY + (partHeight / 2));
    ctx.lineWidth = partHeight * 1.4;
    ctx.strokeStyle = highlightColor;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }

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
          lightness = (67 - (3 * p)) * pulses[c][p];
          saturation = 80;
          transparency = 1; // pulses[c][p];
        }
        // if current choir/part is highlighted
        else if (c == (selectedChoir - 1) && p == ( selectedPart - 1)) {
          lightness = 67 - (3 * p);
          saturation = 80;
          transparency = 1;
        }
        else if (selectedChoir === 0 && selectedPart === 0 && b === 0) {
          lightness = 67 - (3 * p);
          saturation = 50;
          transparency = 1;
        }
        else {
          lightness = 67 - (3 * p);
          saturation = 50;
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
  pauseAndRepaint(false);
}

function pauseAndRepaint(load = true) {
  pauseSpem();
  if (load) {
    loadAudio(choirselect.value, partselect.value, barinput.value);
  }
  // changed = true;
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
  draw();
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
    if (choirselect.value != '0' || partselect.value != '0') {
      lastChoir = Number(choirselect.value);
      lastPart = Number(partselect.value);
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
  setBar(getTouchPos(evt));
  pauseAndRepaint(false);

  // BUG: [Violation] Added non-passive event listener to a scroll-blocking <some> event.
  // Can we use no bubble thing instead of preventDefault()?  Don't want gestures on canvas
  // to move the screen around when on mobile.
  evt.preventDefault();

  canvas.addEventListener("touchmove", (e) => {
    setBar(getTouchPos(e));
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


// -----------------------------------------------------
// Set up Lilypond parser
// -----------------------------------------------------

var lyGrammar, semantics;

async function setupLilypondParser() {

  // Load the OHM grammar for Lilypond 
  const promise = await fetch('/src/ly-grammar.ohm');
  const grammarString = await promise.text();
  lyGrammar = ohm.grammar(grammarString);

  // Create a parse for Lilypond
  semantics = lyGrammar.createSemantics();

  // If lilypond input has no duration, use lastDuration; use lastNote if note name is missing
  var lastNote, lastDuration;

  function getDuration(duration) {
    var d = duration.parse()[0];
    if (d == undefined) {
      d = lastDuration;
    }
    else {
      lastDuration = d;
    }
    return d;
  }


  var lilypondVersion;
  semantics.addOperation('parse', {
    Version(_, _2, v, _3) {
      lilypondVersion = v.sourceString;
    },
    RelativeClause(variable, _, _2, note, _3, music, _4) {
      const v = variable.parse();
      const n = note.parse();
      if (v[0] != undefined) {
        scores[v[0]] = music.parse();
      }
      return scores[v];
    },
    Component(comp) {
      const c = comp.parse();
      return c;
    },
    barline(_) {
      return new BarLine();
    },
    repeatedNote(duration, slur) {
      const d = duration.parse();
      const s = slur.sourceString.length == 0 ? undefined : slur.sourceString

      const note = new Note(lastNote.notename, lastNote.accidental, '', d, s);
      return note;
    },
    note(notename, accidental, octave, duration, slur) {
      const n = notename.sourceString;
      const a = accidental.sourceString.length == 0 ? undefined : accidental.sourceString;
      const o = octave.sourceString.length == 0 ? undefined : octave.sourceString;
      var d = getDuration(duration);
      const s = slur.sourceString.length == 0 ? undefined : slur.sourceString

      lastNote = new Note(n, a, o, d, s);
      return lastNote;
    },
    rest(restname, duration) {
      const r = restname.sourceString;
      var d = getDuration(duration);
      const rest = new Rest(r, d);
      return rest;
    },
    duration(duration, dotted) {
      const d = duration.sourceString;
      const dot = dotted.sourceString;
      const ret = new Duration(d, dot, 1);
      return ret;
    },
    durationScaled(duration, _, multiplier) {
      const x = duration.parse();
      const m = multiplier.parse()[0];

      return new Duration(x.duration, x.dotted, m);
    },
    fraction(a, _, b) {
      // HACK: we're ignoring the denominator altogether.  Let's hope it's not there
      return parseInt(a.sourceString);
    },
    variable(v) {
      return v.sourceString;
    },
    _iter(...children) {
      return children.map(c => c.parse());
    }
  });

}

var ranges = [];

async function processLilypond() {

  // Load the Spem lilypond file
  const promise = await fetch(lilypondfile);
  const spemly = await promise.text();

  // const spemly  = "choirVBaritone = \\relative { f2 f f}";
  // Parse it
  const result = lyGrammar.match(spemly);
  if (!result.succeeded()) {
    console.error('Bad Lilypond ' + result.message);
  }

  semantics(result).parse();

  const choirs = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const parts = ["Soprano", "Alto", "Tenor", "Baritone", "Bass"];

  // Read lilypond input into dict{ position -> [ {choir, part, note}], ... }
  // Read lilypond into ranges[choir][part] = [ {from, to}, ... ]
  for (var choir = 0; choir < 8; choir++) {
    ranges[choir] = [];
    for (var part = 0; part < 5; part++) {
      ranges[choir][part] = [];
      var key = "choir" + choirs[choir] + parts[part];
      var lilypond = scores[key];

      // console.log(lilypond.map(x => (typeof x == "undefined") ? "?" : x.toString()).join(" "));

      // Pretty print where we don't show repeated durations
      // TODO: Move this functionality inside classes/Component
      // var str = [];
      // var lastlen;
      // for (var c of lilypond) {
      //   // console.log(lastlen, c.duration.sfths);
      //   str.push(c.toString(lastlen !== c.duration.sfths));
      //   lastlen = c.duration.sfths;
      // }
      // console.log(str.join(" "));

      var from = undefined;

      var pos = 1; // in hemidemisemiquavers (64ths)
      const barsize = 128; // hemidemisemiquavers in a bar
      for (var comp of lilypond) {
        if (comp instanceof Note) {
          if (from == undefined) {
            from = pos;
          }

          if (dict[pos] == undefined) {
            dict[pos] = [];
          }
          dict[pos].push({ "c": choir, "p": part, "n": comp });
        }
        else if (comp instanceof Rest) {
          if (from != undefined) {
            ranges[choir][part].push({ "from": from, "to": pos });
            from = undefined;
          }
        }

        pos += comp.duration.sfths / barsize;
      }

      if (from != undefined) {
        ranges[choir][part].push({ "from": from, "to": pos });
        from = undefined;
      }

    }
  }
}


// -----------------------------------------------------
// Setup page
// -----------------------------------------------------

window.addEventListener("load", async () => {

  loadColors();
  calculateCanvasSize();
  showLoadingOnCanvas();

  await setupLilypondParser();
  await processLilypond();

  // read choir, part and bar from the URL
  parseURL();
  pauseAndRepaint();

  playpausebutton.addEventListener('click', playpause);

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
});
