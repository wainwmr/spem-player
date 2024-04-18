/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

// Make an dictionary of music positions (hemidemisemiquavers/128) to array of notes {choir, part, note}
const dict = {};

// a dictionary to hold the muic in the lilypond input file
var scores = {};



// TODO: Perhaps locations = { json: <String>, defaultaudio: <String>, audio: <String>[8][5] }?
const defaultaudiofile = '/audio/spem.mp3';
const lilypondfile = '/lilypond/spem notes.ly';

var spemaudio = new Audio();

// const beattime = 0.967; // old
// (minim = 124) === (beattime = 0.9677)
const beattime = 0.968;

// const container = document.getElementById("spemFrame");
const canvas = document.getElementById("spemCanvas");
const choirscore = document.getElementById("choirscore");
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

// where c = 1 to 8
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

const scorebars1 = [227.9274, 247.8609, 266.1329, 284.9909, 301.5745, 321.0416, 342.0884, 362.7282, 387.7805, 411.3344, 431.6417, 460.0088, 486.1238, 511.4708, 533.9893, 559.6953, 591.8550, 623.2721, 653.8041, 677.8106, 704.6601, 732.4069, 756.9599, 783.0814, 801.5971, 814.3452, 824.9752, 835.6052, 846.2352, 856.8652, 867.4952, 878.1252, 888.7552, 899.3852, 910.0152, 920.6452, 931.2752, 941.9052, 952.5352, 963.1652, 985.2644, 1011.1272, 1038.8366, 1063.2906, 1087.6552, 1111.6276, 1122.2576, 1132.8876, 1143.5176, 1154.1476, 1164.7776, 1175.4076, 1186.0376, 1196.6676, 1207.2976, 1217.9276, 1228.5576, 1239.1876, 1249.8176, 1260.4476, 1271.0776, 1281.7076, 1292.3376, 1302.9676, 1313.5976, 1326.3457, 1346.7032, 1365.1180, 1385.7331, 1403.5796, 1427.7132, 1454.3817, 1486.3269, 1516.5722, 1538.8876, 1564.8961, 1586.2409, 1596.8709, 1607.5009, 1618.1309, 1628.7609, 1648.8225, 1677.4602, 1704.3331, 1721.4459, 1742.8762, 1767.9153, 1789.1062, 1804.5048, 1815.1348, 1825.7648, 1843.3742, 1863.0341, 1881.2415, 1901.3696, 1924.1334, 1934.7634, 1945.3934, 1956.0234, 1966.6534, 1985.0229, 2009.2470, 2032.3832, 2052.5129, 2072.9693, 2095.9450, 2121.5240, 2148.6489, 2168.8466, 2186.8180, 2203.7581, 2214.3881, 2225.0181, 2235.6481, 2246.2781, 2256.9081, 2267.5381, 2282.8475, 2307.4266, 2329.5326, 2355.2208, 2372.5407, 2391.9844, 2412.9859, 2428.3473, 2452.6371, 2477.4349, 2503.1204, 2527.9460, 2551.6335, 2577.9665, 2598.4372, 2622.2343, 2649.0431, 2673.9936, 2696.9553, 2726.0319, 2744.6800];
const scorebars = [-0.8877, 4.2888, 25.7639, 41.5139, 57.2639, 71.4159, 92.6111, 114.2706, 137.0584, 158.2351, 181.4943, 206.2037, 233.3954, 260.1797, 289.3407, 321.8585, 351.2778, 377.1354, 406.5415, 436.2038, 470.8441, 503.3720, 535.3381, 564.3314, 596.8825, 628.7089, 648.3104, 664.0604, 679.8104, 695.5604, 711.3104, 727.0604, 742.8104, 758.5604, 774.3104, 790.0604, 805.8104, 821.5604, 837.3104, 853.0604, 868.8104, 892.1994, 919.8309, 950.1792, 982.1743, 1014.1621, 1045.2800, 1062.7673, 1078.5173, 1094.2673, 1110.0173, 1125.7673, 1141.5173, 1157.2673, 1173.0173, 1188.7673, 1204.5173, 1220.2673, 1236.0173, 1251.7673, 1267.5173, 1283.2673, 1299.0173, 1314.7673, 1330.5173, 1346.2673, 1360.4193, 1379.4334, 1400.1400, 1420.3356, 1439.1669, 1465.9533, 1492.6193, 1525.8471, 1561.6866, 1593.1154, 1624.8235, 1644.4706, 1660.2206, 1675.9706, 1691.7206, 1707.4706, 1735.9486, 1770.1472, 1807.3113, 1832.3096, 1860.8542, 1893.5158, 1921.8928, 1937.6428, 1953.3928, 1969.1428, 1998.8952, 2018.6574, 2045.9015, 2075.7056, 2099.4090, 2115.1590, 2130.9090, 2146.6590, 2162.4090, 2184.3179, 2218.7274, 2249.6411, 2275.4360, 2299.9777, 2331.5546, 2363.6167, 2395.7326, 2423.2950, 2444.5055, 2458.6575, 2474.4075, 2490.1575, 2505.9075, 2521.6575, 2537.4075, 2554.9044, 2583.4091, 2615.3516, 2642.3908, 2671.5575, 2694.4795, 2707.9931, 2725.7624, 2752.9690, 2781.1041, 2810.9157, 2841.9352, 2870.4187, 2902.4244, 2937.1922, 2968.0204, 2995.8971, 3024.6425, 3057.0204, 3089.4458, 3118.9462, 3144.2318];

function getViewBox(bar, width) {
  const ideal = 0.3;
  var left = Math.max(scorebars[0], scorebars[bar - 1] - (width * ideal));
  var right = Math.min(scorebars[137], scorebars[bar - 1] + (width * (1 - ideal)));
  if (left > scorebars[137] - width) {
    left = scorebars[137] - width;
  }
  if (right < scorebars[0] + width) {
    right = scorebars[0] + width;
  }
  return `${left - 5} 0 ${right - left} 55`;
}

var svg;
var pt;
function scoreClicked(e) {
  console.log('hello');
  pt.x = e.clientX;
  pt.y = e.clientY;

  // The cursor point, translated into svg coordinates
  var cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
  console.log("(" + cursorpt.x + ", " + cursorpt.y + ")");

  var result = scorebars.find(x => x > cursorpt.x);
  console.log(scorebars.indexOf(result));
  setBar(scorebars.indexOf(result));
}


var previousBarHighlight;

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

    const scorebarwidth = 200;  // HACK: this should be calculated as the width of the visible score
    const viewbox = getViewBox(b, scorebarwidth);
    console.log(viewbox);

    const scoresvg = document.querySelector(".emb");
    const subdoc = scoresvg.getSVGDocument();
    svg = subdoc.getElementsByTagName("svg")[0];

    svg.addEventListener("click", scoreClicked); // HACK: only register this when score first added
    pt = svg.createSVGPoint();  // HACK: Created once for document

    svg.setAttribute("viewBox", viewbox);
    var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect'); //Create a path in SVG's namespace
    newElement.setAttribute("x", scorebars[b]);
    newElement.setAttribute("y", "0");
    newElement.setAttribute("width", scorebars[b + 1] - scorebars[b]); // BUG: What if b is 138??
    newElement.setAttribute("height", "60"); // HACK
    newElement.style.fill = highlightColor; //Set stroke colour
    newElement.style.fillOpacity = 0.1;
    newElement.style.strokeWidth = "5px"; //Set stroke width
    svg.appendChild(newElement);

    if (previousBarHighlight != undefined) {
      svg.removeChild(previousBarHighlight);
    }
    previousBarHighlight = newElement;

    // bar 0 = scorebars[0] = 227 -> 0
    // bar 138 = scorebars[137] = 2745 -> 16808

    // const pos = ((scorebars[b-1] - scorebars[0])/(scorebars[137] - scorebars[0])) * 15500;

    // console.log("scrolling to bar " + b + " at " + pos);
    // choirscore.scrollTo({
    //   top: 0,
    //   left: pos, //b * scorebarwidth,
    //   behavior: "smooth"
    // });
    changed = true;
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
  canvas.width = canvas.clientWidth * 4;
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
      pulses[n.c][n.p] = easeOutCubic(pos % quant, 1.4, -0.4, n.n.duration.sfths / 128);
    }
  }

  setBar(bar);
}

function easeInCubic(t, b, c, d) {
  return c * (t /= d) * t * t + b;
}

function easeOutCubic(t, b, c, d) {
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


  // Draw highlight line for the selected choir or choir and part
  const selectedChoir = Number(choirselect.value);
  const selectedPart = Number(partselect.value);
  var startY, width;
  if (selectedPart != 0) {
    startY = canvasPadding + ((selectedChoir - 1) * choirHeight) + ((selectedPart - 1) * partHeight);
    width = partHeight * 1.4;
  }
  else {
    // center the highlight on the middle tenor line
    startY = canvasPadding + ((selectedChoir - 1) * choirHeight) + (2 * partHeight);
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
          lightness = (67 - (3 * p)) * pulses[c][p];
          saturation = 80;
          transparency = 1; // pulses[c][p];
        }
        // if current choir/part is highlighted
        else if (c == (selectedChoir - 1) && p == (selectedPart - 1)) {
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
      setPart(1);
      pauseAndRepaint();
      break;
    case 'KeyA':
      setPart(2);
      pauseAndRepaint();
      break;
    case 'KeyT':
      setPart(3);
      pauseAndRepaint();
      break;
    case 'KeyR':
      setPart(4);
      pauseAndRepaint();
      break;
    case 'KeyB':
      setPart(5);
      pauseAndRepaint();
      break;

    case 'ArrowRight':
      setBar(Number(barinput.value) + 1);
      pauseAndRepaint();
      break;
    case 'ArrowLeft':
      setBar(Number(barinput.value) - 1);
      pauseAndRepaint();
      break;
    case 'KeyX':
      setPart(0);
      pauseAndRepaint();
      break;
    default:
  }

  // if (e.code === 'KeyD') {
  //   setBar(Number(barinput.value) + 1);
  //   pauseAndRepaint();
  // }
  // else if (e.code === 'KeyA') {
  //   setBar(Number(barinput.value) - 1);
  //   pauseAndRepaint();
  // }
  // else if (e.code === 'KeyS') {
  //   if ((choirselect.value === '8') && (partselect.value === '5')) {
  //     setChoir(0);
  //     setPart(0);
  //   }
  //   else {
  //     const p = (Number(partselect.value) % 5) + 1;  // zero-index, add 1, mod 5 and then one-index the parts
  //     setPart(p);
  //     if (p === 1) {
  //       const c = (Number(choirselect.value) % 8) + 1;  // mod 8 and one-index the choirs
  //       setChoir(c);
  //     }
  //   }
  //   pauseAndRepaint();
  // }
  // else if (e.code === 'KeyW') {
  //   if ((choirselect.value === '0') && (partselect.value === '0')) {
  //     setChoir(8);
  //     setPart(5);
  //   }
  //   else {
  //     const p = (4 + Number(partselect.value)) % 5;
  //     setPart(p);
  //     if (p === 0) {
  //       setPart(5);
  //       const c = ((7 + Number(choirselect.value)) % 8);
  //       setChoir(c);
  //     }
  //   }
  //   pauseAndRepaint();
  // }
  // Toggle between ALL choirs and selected choir
  // else if (e.code === 'KeyX') {
  //   if (choirselect.value != '0' || partselect.value != '0') {
  //     lastChoir = Number(choirselect.value);
  //     lastPart = Number(partselect.value);
  //     setChoir(0);
  //     setPart(0);
  //   }
  //   else {
  //     setChoir(lastChoir);
  //     setPart(lastPart);
  //   }
  //   pauseAndRepaint();
  // }
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
    command(_, c) {
      const command = c.sourceString;
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

          pos += comp.duration.sfths / barsize;
        }
        else if (comp instanceof Rest) {
          if (from != undefined) {
            ranges[choir][part].push({ "from": from, "to": pos });
            from = undefined;
          }

          pos += comp.duration.sfths / barsize;
        }
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
