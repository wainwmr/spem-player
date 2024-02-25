
// TODO: Perhaps locations = { json: <String>, defaultaudio: <String>, audio: <String>[8][5] }?
let defaultaudiofile = '/audio/spem.mp3';
let jsonFilename = '/assets/spem.json';

// TODO: Wait for loading? Or disabled play till loaded?
var spemaudio = new Audio(defaultaudiofile);

// storing the definition of all the voice parts
var json;

// const beattime = 0.97; // seconds per beat
const beattime = 0.967;

let timerId = 0;

const container = document.getElementById("spemFrame");
const canvas = document.getElementById("spemCanvas");
const playpausebutton = document.getElementById('playpausebutton');
const choirselect = document.getElementById('choir-select');
const partselect = document.getElementById('part-select');
const barinput = document.getElementById('bar-field');
const statusarea = document.getElementById('statusarea');
const choiroutput = document.getElementById('choir-output');
const partoutput = document.getElementById('part-output');
const baroutput = document.getElementById('bar-output');

const allparts = ['soprano', 'alto', 'tenor', 'baritone', 'bass'];

let canvasPadding = 5;  // padding in px of the canvas
let barWidth = 0;
let choirHeight = 0;
let partHeight = 0;

// https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)#stackoverflow-archive-begin
// Version 4.1
const pSBC=(p,c0,c1,l)=>{
	let r,g,b,P,f,t,h,m=Math.round,a=typeof(c1)=="string";
	if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
	h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=pSBC.pSBCr(c0),P=p<0,t=c1&&c1!="c"?pSBC.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
	if(!f||!t)return null;
	if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
	else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
	a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
	if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
	else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
}

pSBC.pSBCr=(d)=>{
	const i=parseInt;
	let n=d.length,x={};
	if(n>9){
		const [r, g, b, a] = (d = d.split(','));
	        n = d.length;
		if(n<3||n>4)return null;
		x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
	}else{
		if(n==8||n==6||n<4)return null;
		if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
		d=i(d.slice(1),16);
		if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=Math.round((d&255)/0.255)/1000;
		else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
	}return x
};

// TODO: put these colours in a config object? or as
// SASS variables?
const backgroundColor = "#123456";
const lineColor = "#FFFFFF"
// BUG: Choir 8 blue is too dark for the background
const choirColors = [
  "#c1121f",
  "#ce6d8b",
  "#FF8531",
  "#FFA600",
  "#72B043",
  "#2B7654",
  "#13788D",
  "#003f88"
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

// TODO: Check if choir has changed (like for bar below)
function setChoir(c) {
  choirselect.value = c;
  changed = true;
}

// TODO: Check if part has changed (like for bar below)
function setPart(p) {
  partselect.value = p;
  changed = true;
}

function setBar(b) {
  const oldBar = barinput.value;
  if (b != oldBar) {
    barinput.value = b;
    changed = true;
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
        ctx.strokeStyle = pSBC(0.24 - (0.08 * p), choirColors[c]);
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
    newfile = `../audio/spem-${c}-${getPartName(p)}.mp3`;
  }

  // just compare the filename, not the whole URL, to see if we
  // need to load a new MP3
  if (getFilename(newfile) != getFilename(spemaudio.src)) {
    console.log("Loading new file");
    spemaudio.src = newfile;
  }
  // TODO: Wait for loading? Or disabled play till loaded?

  spemaudio.currentTime = b * 4 * beattime;
}

// TODO: Are you sure spemaudio is loaded?
function playSpem() {
  if (spemaudio.paused) {
    spemaudio.play();
    playpausebutton.classList.remove("paused");
    clearInterval(timerId);
    // BUG: at the end of the piece, the bar number climbs to 141 and the playpause 
    // button never reverts to play. Does the timer ever stop??
    timerId = setInterval(() => {
      setBar(Math.floor(spemaudio.currentTime / (beattime * 4)));
      paintCanvas();
    }, beattime * 100);
  }
}

function pauseSpem() {
  if (!spemaudio.paused) {
    spemaudio.pause();
    playpausebutton.classList.add("paused");
    clearInterval(timerId);
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
// BUG: Should not display this area when mouse not possible
// e.g. for mobile devices
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

// TODO: Need to tell user the keyboard controls somewhere
function keyboardTapped(e) {
  // don't handle keyboard events on the four control widgets
  // cos it messes with the UI interaction
  const classes = [...e.target.classList];
  if (classes.includes('control')) {
    return;
  }
  if (event.isComposing || event.keyCode === 229) {
    return;
  }
  if (event.code == 'Enter') {
    playpause();
    return;
  }
  if (event.code === 'KeyD') {
    setBar(Number(barinput.value) + 1);
    pauseAndRepaint();
  }
  else if (event.code === 'KeyA') {
    setBar(Number(barinput.value) - 1);
    pauseAndRepaint();
  }
  else if (event.code === 'KeyS') {
    if ((choirselect.value === '8') && (partselect.value === '5')) {
      setChoir(0);
      setPart(0);
    }
    else {
      p = (Number(partselect.value) % 5) + 1;  // zero-index, add 1, mod 5 and then one-index the parts
      setPart(p);
      if (p === 1) {
        c = (Number(choirselect.value) % 8) + 1;  // mod 8 and one-index the choirs
        setChoir(c);
      }
    }
    pauseAndRepaint();
  }
  else if (event.code === 'KeyW') {
    if ((choirselect.value === '0') && (partselect.value === '0')) {
      setChoir(8);
      setPart(5);
    }
    else {
      p = (4 + Number(partselect.value)) % 5;
      setPart(p);
      if (p === 0) {
        setPart(5);
        c = ((7 + Number(choirselect.value)) % 8);
        setChoir(c);
      }
    }
    pauseAndRepaint();
  }
  else if (event.code === 'KeyX') {
    setChoir(0);
    setPart(0);
    pauseAndRepaint();
  }
}

// -----------------------------------------------------
// Touch events (mobible, iPad)
// -----------------------------------------------------

// TODO: Not convinced the Maths for getTouchPos() is right...
function getTouchPos(evt) {
  // TODO: rect not used!
  const rect = canvas.getBoundingClientRect();
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
  canvas.addEventListener("touchend", (e) => {
    console.log("touchend");
    pauseAndRepaint();
    // playSpem();
  });
}


// -----------------------------------------------------
// Setup page
// -----------------------------------------------------

window.addEventListener("load", async () => {
  calculateCanvasSize();
  showLoadingOnCanvas();
  const response = await fetch(jsonFilename);
  json = await response.json();

  setChoir(0);
  setPart(0);
  setBar(0);
  pauseAndRepaint();

  playpausebutton.addEventListener('click', playpause);

  canvas.addEventListener('click', canvasClicked);
  canvas.addEventListener('mousemove', canvasMoved, false);
  [choirselect,
    partselect,
    barinput].forEach(el => el.addEventListener('change', pauseAndRepaint));
  document.addEventListener("keydown", keyboardTapped);
  canvas.addEventListener("touchstart", touchStarted, { passive: false });

  // Next line not really necessary, but will make it look clearer on browser resize
  // window.addEventListener("resize", () => {calculateCanvasSize(); paintCanvas(json); });
});