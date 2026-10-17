(function(){
var DW = window.DW;
var St = DW.store;
var P = {};
DW.pet = P;

var NS = 'http://www.w3.org/2000/svg';
var svg, wrap, img, zz;
var eyes = [];  // both eyes, each one a bunch of svg bits
var awake = false;  // true once the eyes have come alive
var mode = 'idle';  // idle, sleep, wake, happy, dizzy
var px = -1;  // last pointer position
var py = -1;
var raf = 0;
var rect = null;  // cached position of the eyes on screen
var rectAt = 0;
var lastInput = Date.now();
var blinkT = 0;
var lookT = 0;
var modeT = 0;
var sleepT = 0;
var recent = [];  // recent pets, for the dizzy thing
var CX = [6, 18];  // x centre of each eye in the svg

// how many clicks before it can wake up, and how likely each click is after that
function cfg(){
  var c = DW.eyesPet || {};
  var after = 15;
  if (c.after >= 1) { after = c.after; }
  var chance = 0.04;
  if (c.chance >= 0 && c.chance <= 1) { chance = c.chance; }
  return { after: after, chance: chance };
}

function makeSvg(tag, attrs, parent){
  var e = document.createElementNS(NS, tag);
  var names = Object.keys(attrs || {});
  for (var i = 0; i < names.length; i++) {
    e.setAttribute(names[i], attrs[names[i]]);
  }
  if (parent) { parent.appendChild(e); }
  return e;
}

function trophies(){ return DW.trophy; }

function build(){
  svg = makeSvg('svg', { viewBox: '0 0 24 12', id: 'pet', 'shape-rendering': 'crispEdges' });

  for (var i = 0; i < CX.length; i++) {
    var cx = CX[i];
    var g = makeSvg('g', {}, svg);
    var frame = makeSvg('rect', { x: cx - 5, y: 2, width: 10, height: 8, fill: '#12042b' }, g);
    var white = makeSvg('rect', { x: cx - 4, y: 3, width: 8, height: 6, fill: '#fff' }, g);
    var pupil = makeSvg('rect', { x: cx - 1.5, y: 4, width: 3, height: 4, fill: '#7a35ff' }, g);
    var shine = makeSvg('rect', { x: cx - 1.5, y: 4, width: 1, height: 1, fill: '#fff' }, g);
    var lid = makeSvg('rect', { x: cx - 4, y: 3, width: 8, height: 0, fill: '#3b1783' }, g);
    // happy ^ eyes
    var happy = makeSvg('path', {
      d: 'M' + (cx - 3) + ' 8L' + cx + ' 4L' + (cx + 3) + ' 8',
      fill: 'none', stroke: '#fff', 'stroke-width': 1.4, visibility: 'hidden'
    }, g);
    // dizzy x eyes
    var cross = makeSvg('path', {
      d: 'M' + (cx - 2) + ' 4L' + (cx + 2) + ' 8M' + (cx + 2) + ' 4L' + (cx - 2) + ' 8',
      fill: 'none', stroke: '#ff6bd6', 'stroke-width': 1.2, visibility: 'hidden'
    }, g);
    eyes.push({ cx: cx, white: white, pupil: pupil, shine: shine, lid: lid, happy: happy, cross: cross, frame: frame });
  }

  zz = makeSvg('text', { x: 20, y: 2, 'font-size': 5, fill: '#fff', visibility: 'hidden' }, svg);
  zz.textContent = 'z';

  // empty on purpose
  svg.addEventListener('pointerdown', function(){});
}

// move both pupils (and their shine) by dx, dy
function look(dx, dy){
  for (var i = 0; i < eyes.length; i++) {
    var e = eyes[i];
    var x = e.cx - 1.5 + dx;
    var y = 4 + dy;
    e.pupil.setAttribute('x', x);
    e.pupil.setAttribute('y', y);
    e.shine.setAttribute('x', x);
    e.shine.setAttribute('y', y);
  }
}

// eyelid height 0 = open
function lids(h){
  for (var i = 0; i < eyes.length; i++) {
    eyes[i].lid.setAttribute('height', h);
  }
}

function showHide(node, on){
  if (on) { node.setAttribute('visibility', 'visible'); }
  else { node.setAttribute('visibility', 'hidden'); }
}

// which bits of the face are visible in each mode
function face(m){
  var happy = (m == 'happy');
  var dizzy = (m == 'dizzy');
  var normal = !happy && !dizzy;
  for (var i = 0; i < eyes.length; i++) {
    var e = eyes[i];
    showHide(e.happy, happy);
    showHide(e.cross, dizzy);
    showHide(e.white, normal);
    showHide(e.pupil, normal);
    showHide(e.shine, normal);
    showHide(e.lid, normal);
  }
  showHide(zz, m == 'sleep');
}

// smaller pupils when startled
function surprised(on){
  for (var i = 0; i < eyes.length; i++) {
    if (on) {
      eyes[i].pupil.setAttribute('width', 2);
      eyes[i].pupil.setAttribute('height', 3);
    } else {
      eyes[i].pupil.setAttribute('width', 3);
      eyes[i].pupil.setAttribute('height', 4);
    }
  }
}

// switch mode if ms is given it goes to "next" (or idle) after that long
function setMode(m, ms, next){
  clearTimeout(modeT);
  mode = m;
  face(m);
  if (m == 'sleep') { lids(5); } else { lids(0); }
  surprised(m == 'wake');
  if (m == 'sleep') { look(0, 1.2); }
  if (m == 'idle') { aim(); }
  if (ms) {
    modeT = setTimeout(function(){ setMode(next || 'idle'); }, ms);
  }
}

function off(){
  if (DW.set && DW.set.get('pet') === false) { return true; }
  return false;
}

// point the pupils at the mouse / finger
function aim(){
  if (off() || !awake) { return; }
  if (mode == 'sleep' || mode == 'happy' || mode == 'dizzy') { return; }
  var now = performance.now();
  if (!rect || now - rectAt > 400) {
    rect = svg.getBoundingClientRect();
    rectAt = now;
  }
  if (px < 0) { return; }

  var mx = rect.left + rect.width / 2;
  var my = rect.top + rect.height / 2;
  var dx = px - mx;
  var dy = py - my;
  var dist = Math.hypot(dx, dy) || 1;
  var k = Math.min(1, dist / 160);  // looks less far when the mouse is close
  look(dx / dist * 1.7 * k, dy / dist * 1.1 * k);
}

// at most one aim per frame
function schedAim(){
  if (raf) { return; }
  raf = requestAnimationFrame(function(){
    raf = 0;
    aim();
  });
}

// falls asleep after a while of nothing happening
function nap(){
  clearTimeout(sleepT);
  sleepT = setTimeout(function(){
    if (awake && mode == 'idle') { setMode('sleep'); }
    nap();
  }, 28000);
}

// any input then wake up if asleep, restart the sleep timer
function activity(){
  lastInput = Date.now();
  if (!awake) { return; }
  if (mode == 'sleep') { setMode('wake', 700, 'idle'); }
  clearTimeout(sleepT);
  nap();
}

function blink(){
  clearTimeout(blinkT);
  blinkT = setTimeout(function(){
    if (awake && mode == 'idle') {
      lids(6);
      setTimeout(function(){
        if (mode == 'idle') { lids(0); }
      }, 120);
    }
    blink();
  }, 2200 + Math.random() * 3800);
}

// looks around by itself when nobody is touching anything
function wander(){
  clearTimeout(lookT);
  lookT = setTimeout(function(){
    if (awake && mode == 'idle' && Date.now() - lastInput > 4000) {
      look((Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 2);
    }
    wander();
  }, 2500 + Math.random() * 3000);
}

function heart(){
  var r = svg.getBoundingClientRect();
  var h = document.createElement('div');
  h.className = 'hearts';
  h.textContent = '<3';
  h.style.left = r.left + r.width / 2 - 8 + (Math.random() * 16 - 8) + 'px';
  h.style.top = r.bottom + 'px';
  document.body.appendChild(h);
  setTimeout(function(){ h.remove(); }, 1200);
}

function petIt(){
  if (mode == 'dizzy') { return; }
  var now = Date.now();

  // only keep the pets from the last 2 seconds
  var keep = [];
  for (var i = 0; i < recent.length; i++) {
    if (now - recent[i] < 2000) { keep.push(recent[i]); }
  }
  keep.push(now);
  recent = keep;

  // too many pets too fast makes it dizzy
  if (recent.length >= 6) {
    recent = [];
    setMode('dizzy', 1600, 'idle');
    return;
  }
  if (mode == 'sleep') {
    setMode('wake', 700, 'idle');
    return;
  }
  setMode('happy', 1100, 'idle');
  heart();
}

// the picture turns into the live svg eyes
function wake(){
  if (off()) { return; }
  awake = true;
  St.d.pet = 1;
  St.save();
  img.hidden = true;
  wrap.classList.add('pet');
  if (!svg.parentNode) { wrap.insertBefore(svg, wrap.firstChild); }
  svg.style.display = 'block';
  setMode('wake', 1200, 'idle');
  blink();
  wander();
  nap();
  px = innerWidth / 2;
  py = innerHeight / 2;
}

P.state = function(){ return mode; };

// called by settings when the pet toggle changes
P.apply = function(){
  if (!svg || !wrap || !img) { return; }  // init hasnt run
  if (off()) {
    awake = false;
    clearTimeout(blinkT);
    clearTimeout(lookT);
    clearTimeout(modeT);
    clearTimeout(sleepT);
    if (img.naturalWidth || !img.complete) {
      svg.style.display = 'none';
      wrap.classList.remove('pet');
      img.hidden = false;
    } else {
      setMode('idle');  // no picture to go back to, so keep the svg
    }
  } else if (St.d.pet) {
    wake();
  }
};

P.init = function(){
  wrap = document.getElementById('views-wrap');
  img = document.getElementById('eyes');
  if (!wrap || !img) { return; }
  build();
  svg.style.display = 'none';
  wrap.insertBefore(svg, img);

  addEventListener('pointermove', function(e){
    px = e.clientX;
    py = e.clientY;
    if (awake) {
      schedAim();
      if (Date.now() - lastInput > 2000 || mode == 'sleep') { activity(); }
      lastInput = Date.now();
    }
  }, { passive: true });

  addEventListener('pointerdown', function(e){
    px = e.clientX;
    py = e.clientY;
    activity();
    schedAim();
  }, true);

  addEventListener('keydown', activity, true);
  addEventListener('resize', function(){ rect = null; });

  wrap.addEventListener('click', function(){
    if (off()) { return; }
    if (awake) {
      petIt();
      return;
    }

    // still just a picture. count the pokes
    if (!St.d.c) { St.d.c = {}; }
    var c = St.d.c;
    var k = cfg();
    c.eyeClicks = (Number(c.eyeClicks) || 0) + 1;
    St.save();

    // restart the poke animation
    img.classList.remove('poked');
    void img.offsetWidth;
    img.classList.add('poked');

    if (c.eyeClicks >= k.after && trophies()) { trophies().award('poke'); }
    if (c.eyeClicks > k.after && Math.random() < k.chance) {
      wake();
      if (trophies()) { trophies().award('alive'); }
      DW.toast('...the eyes are looking at you');
    }
  });

  // no picture file? use the svg eyes from the start
  function missing(){
    if (awake) { return; }
    img.hidden = true;
    wrap.classList.add('pet');
    svg.style.display = 'block';
    setMode('idle');
  }
  img.addEventListener('error', missing);
  if (img.complete && !img.naturalWidth) { missing(); }

  if (St.d.pet) { wake(); }
  if (off()) { P.apply(); }
};
})();
