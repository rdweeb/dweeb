// Shared game setup, palette, and helpers.

(function(){
var DW = window.DW;
var St = DW.store;
var G = { list: [] };
DW.games = G;

var PAL = {
  bg: '#760ead', bg2: '#8516bd', grid: '#bb37db', p1: '#d743e6', p2: '#fb5aff',
  p3: '#f3b5f6', pk: '#6a9ff2', ink: '#75099a', gold: '#ffd34d', white: '#ffffff'
};
G.pal = PAL;

G.add = function(def){ G.list.push(def); };

// chunky raised block, used for every tile/brick/paddle
G.bevel = function(c, x, y, w, h, col){
  var b = Math.max(1, Math.min(w, h) / 8);
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255, 255, 255,.38)';
  c.fillRect(x, y, w, b);
  c.fillRect(x, y, b, h);
  c.fillStyle = 'rgba(0, 0, 0,.34)';
  c.fillRect(x, y + h - b, w, b);
  c.fillRect(x + w - b, y, b, h);
};

G.text = function(c, s, x, y, size, col, align){
  c.font = 'bold ' + size + 'px Tahoma, Verdana, sans-serif';
  c.textAlign = align || 'left';
  c.textBaseline = 'top';
  c.fillStyle = col || '#ffffff';
  c.fillText(s, x, y);
};

// default keys a game can have its own with def.keymap
var KEYS = {
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right',
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  ' ': 'drop', x: 'a', z: 'b', enter: 'enter'
};

var win, menuEl, modeEl, stageEl, hdTitle, hudL, hudR, wrap, cv, ctx;
var ovEl, ovT, ovS, ovB, layer, padEl, helpEl, pauseBtn, fsBtn;
var cur = null;  // the game thats open: { def, mode, game }
var raf = 0;
var last = 0;
var running = false;
var paused = false;
var ovFn = null;  // what the overlay button does
var fx = [];  // particles
var shakeT = 0;
var shakeM = 0;

function makeEl(tag, cls, txt){
  var e = document.createElement(tag);
  if (cls) { e.className = cls; }
  if (txt !== undefined) { e.textContent = txt; }
  return e;
}

// saved scores for a game (or a game + mode)
function rec(k){
  var g = St.d.g;
  if (!g[k] || typeof g[k] != 'object') { g[k] = { best: 0, plays: 0 }; }
  return g[k];
}

function keyFor(def, mode){
  if (mode) { return def.id + ':' + mode; }
  return def.id;
}

function lastMode(def){
  var saved = null;
  if (St.d.g.modes) { saved = St.d.g.modes[def.id]; }
  for (var i = 0; i < def.modes.length; i++) {
    if (def.modes[i].id == saved) { return saved; }
  }
  return def.modes[0].id;
}

// scales the canvas to fit the window
function fit(){
  if (!cur || !cur.game) { return; }
  var d = cur.def;
  var player = document.getElementById('player');
  var coarse = matchMedia('(pointer: coarse)').matches;

  var below = 0;
  if (player) { below = player.offsetHeight + 20; }
  var availW = Math.max(120, win.body.clientWidth - 24);
  win.body.style.paddingBottom = below + 'px';

  var reserve = 22 + 24 + 30 + 24 + 30 + below;
  if (coarse && d.pad) { reserve += 58; }
  var availH = Math.max(120, window.innerHeight - reserve);

  var sc = Math.min(availW / d.w, availH / d.h);
  var cssW = Math.floor(d.w * sc);
  var cssH = Math.floor(d.h * sc);
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  cv.style.width = cssW + 'px';
  wrap.style.width = cssW + 'px';
  cv.style.height = cssH + 'px';
  wrap.style.height = cssH + 'px';
  cv.width = Math.round(cssW * dpr);
  cv.height = Math.round(cssH * dpr);
  ctx.setTransform(cv.width / d.w, 0, 0, cv.height / d.h, 0, 0);
  if (cur.game.draw) { cur.game.draw(ctx); }
}

// big message over the game (start, pause, game over)
function say(title, sub, btn, fn){
  ovT.textContent = title || '';
  ovS.textContent = sub || '';
  ovB.textContent = btn || '';
  ovB.hidden = !btn;
  ovFn = fn || null;
  ovEl.hidden = false;
  if (cur && cur.game && cur.game.draw) { cur.game.draw(ctx); }
}

function clearSay(){
  ovEl.hidden = true;
  ovFn = null;
}

function stepFx(dt){
  for (var i = fx.length - 1; i >= 0; i--) {
    var p = fx[i];
    p.life -= dt;
    if (p.life <= 0) {
      fx.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.g || 0) * dt;
    ctx.globalAlpha = Math.min(1, p.life / p.max * 1.6);
    ctx.fillStyle = p.col;
    ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
  }
  ctx.globalAlpha = 1;
}

function loop(t){
  raf = requestAnimationFrame(loop);
  if (!cur || document.hidden) { return; }

  var dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  var g = cur.game;
  if (!running && fx.length == 0) { return; }
  if (!running && paused) { return; }

  var d = cur.def;
  ctx.save();
  ctx.clearRect(0, 0, d.w, d.h);
  if (shakeT > 0) {
    shakeT -= dt;
    ctx.translate((Math.random() - 0.5) * shakeM, (Math.random() - 0.5) * shakeM);
  }
  if (running) { g.frame(dt, ctx, t); }
  else if (g.draw) { g.draw(ctx); }
  stepFx(dt);
  ctx.restore();
}

function setPaused(v){
  if (!cur) { return; }
  if (!running && !paused) { return; }  // nothing to pause
  if (v == paused) { return; }

  paused = v;
  running = !v;
  if (v) { pauseBtn.textContent = 'RESUME'; }
  else { pauseBtn.textContent = 'PAUSE'; }

  if (v) {
    say('PAUSED', 'press P or tap to continue', 'RESUME', function(){ setPaused(false); });
    if (cur.game.onpause) { cur.game.onpause(); }
  } else {
    clearSay();
    last = performance.now();
    if (cur.game.onresume) { cur.game.onresume(); }
  }
}

// the object each game gets to talk to the shell with
function makeEnv(def, mode){
  var k = keyFor(def, mode);
  return {
    w: def.w, h: def.h, ctx: ctx, layer: layer, pal: PAL, bevel: G.bevel, text: G.text,
    mode: mode, say: say, clear: clearSay, fit: fit,

    hud: function(l, r){
      if (l == null) { hudL.textContent = ''; } else { hudL.textContent = l; }
      if (r == null) { hudR.textContent = ''; } else { hudR.textContent = r; }
    },

    best: function(){ return rec(k).best || 0; },

    start: function(){
      running = true;
      paused = false;
      pauseBtn.textContent = 'PAUSE';
      pauseBtn.hidden = false;
      last = performance.now();
    },

    end: function(){
      running = false;
      pauseBtn.hidden = true;
    },

    // saves the score if its a new best. lower = true when smaller is better
    report: function(score, lower){
      var r = rec(k);
      var had = r.plays > 0 && r.best > 0;
      var newBest;
      if (lower) { newBest = !had || score < r.best; }
      else { newBest = score > (r.best || 0); }

      if (newBest && score > 0) { r.best = score; }
      else { newBest = false; }
      St.save();
      return newBest;
    },

    played: function(){
      rec(k).plays++;
      if (k != def.id) { rec(def.id).plays++; }
      St.save();
      if (DW.trophy) { DW.trophy.mark('arcade', def.id); }
    },

    award: function(id){
      if (DW.trophy) { DW.trophy.award(id); }
    },

    burst: function(x, y, col, n, speed, size){
      for (var i = 0; i < n && fx.length < 160; i++) {
        var a = Math.random() * 6.283;
        var v = (speed || 80) * (0.35 + Math.random() * 0.65);
        var life = 0.35 + Math.random() * 0.4;
        fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 120, life: life, max: life, col: col, s: size || 2.5 });
      }
    },

    shake: function(m, t){
      shakeM = m;
      shakeT = t || 0.18;
    },

    menu: function(){ G.back(); }
  };
}

function action(k, down, rep){
  if (cur && running && cur.game.key) { cur.game.key(k, down, rep); }
}

function onKey(e, down){
  if (!cur) { return; }
  if (e.ctrlKey || e.metaKey || e.altKey) { return; }
  var k = (e.key || '').toLowerCase();

  if (k == 'escape') {
    if (!down) { return; }
    e.stopImmediatePropagation();
    e.preventDefault();
    G.back();
    return;
  }

  if (k == 'p') {
    if (down && !e.repeat) { setPaused(!paused); }
    e.preventDefault();
    return;
  }

  var km = cur.def.keymap;
  var map = km;
  if (typeof km == 'function') { map = km(cur.mode); }
  if (!map) { map = KEYS; }

  var a = null;
  if (Object.prototype.hasOwnProperty.call(map, k)) { a = map[k]; }
  if (!a) {
    // still stop the page scrolling while playing
    if (k == ' ' || k == 'enter' || k.indexOf('arrow') == 0) { e.preventDefault(); }
    return;
  }
  e.preventDefault();

  // overlay is up enter/space press its button
  if (!ovEl.hidden) {
    if (down && !e.repeat && ovFn && (a == 'enter' || a == 'drop')) { ovFn(); }
    return;
  }
  action(a, down, e.repeat);
}

// one on screen button (phones). p = [action, label, repeats?]
function padButton(p){
  var b = makeEl('button', 'gm-pb', p[1]);
  var timer = 0;
  b.type = 'button';
  b.setAttribute('aria-label', p[0]);

  function release(){
    clearInterval(timer);
    timer = 0;
    action(p[0], false);
  }

  b.addEventListener('pointerdown', function(e){
    e.preventDefault();
    if (!ovEl.hidden) {
      if (ovFn) { ovFn(); }
      return;
    }
    action(p[0], true);
    clearInterval(timer);
    if (p[2]) {
      timer = setInterval(function(){ action(p[0], true, true); }, 105);
    }
  });

  var ends = ['pointerup', 'pointercancel', 'pointerleave'];
  for (var i = 0; i < ends.length; i++) {
    b.addEventListener(ends[i], release);
  }
  return b;
}

function buildPad(def){
  padEl.textContent = '';
  padEl.hidden = !def.pad;
  if (!def.pad) { return; }
  for (var i = 0; i < def.pad.length; i++) {
    padEl.appendChild(padButton(def.pad[i]));
  }
}

// touch / mouse on the canvas itself
function bindPointer(def){
  var startX = 0;
  var startY = 0;
  var down = false;
  var moved = false;

  function pos(e){
    var r = cv.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * def.w, (e.clientY - r.top) / r.height * def.h];
  }

  cv.onpointerdown = function(e){
    if (!ovEl.hidden || !running) { return; }
    down = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    try { cv.setPointerCapture(e.pointerId); } catch(err) {}
    var p = pos(e);
    if (cur.game.pointer) { cur.game.pointer('down', p[0], p[1]); }
  };

  cv.onpointermove = function(e){
    if (!down || !running) { return; }
    if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 10) { moved = true; }
    var p = pos(e);
    if (cur.game.pointer) { cur.game.pointer('move', p[0], p[1]); }
  };

  cv.onpointerup = function(e){
    if (!down) { return; }
    down = false;
    if (!running) { return; }

    var p = pos(e);
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (cur.game.pointer) { cur.game.pointer('up', p[0], p[1]); }

    if (def.swipe && Math.max(Math.abs(dx), Math.abs(dy)) > 24) {
      var a;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) { a = 'right'; } else { a = 'left'; }
      } else {
        if (dy > 0) { a = 'down'; } else { a = 'up'; }
      }
      action(a, true);
      action(a, false);
    } else if (def.swipe && !moved && cur.game.tap) {
      cur.game.tap();
    }
  };

  cv.onpointercancel = function(){ down = false; };
}

function closeGame(){
  if (!cur) { return; }
  cancelAnimationFrame(raf);
  raf = 0;
  try {
    if (cur.game && cur.game.stop) { cur.game.stop(); }
  } catch(e) {
    console.error('[dweeb] game stop', e);
  }
  cur = null;
  running = false;
  paused = false;
  fx = [];
  shakeT = 0;
  DW.gaming = false;
  document.body.classList.remove('gaming');
  win.el.classList.remove('full');
  win.body.style.paddingBottom = '';
  layer.textContent = '';
  layer.hidden = true;
  clearSay();
  if (document.fullscreenElement && document.exitFullscreen) {
    var p = document.exitFullscreen();
    if (p && p.catch) { p.catch(function(){}); }
  }
}

function show(which){
  menuEl.hidden = (which != 'menu');
  modeEl.hidden = (which != 'modes');
  stageEl.hidden = (which != 'stage');
  if (which != 'stage') { win.titleEl.textContent = 'GAMES'; }
}

G.back = function(){
  if (!cur && !modeEl.hidden) {
    buildMenu();
    show('menu');
    return;
  }
  if (!cur) {
    win.close();
    return;
  }
  closeGame();
  buildMenu();
  show('menu');
};

function byId(id){
  for (var i = 0; i < G.list.length; i++) {
    if (G.list[i].id == id) { return G.list[i]; }
  }
  return null;
}

function modeCard(def, m){
  var b = makeEl('button', 'gm-card');
  b.type = 'button';
  b.appendChild(makeEl('b', null, m.name));
  b.appendChild(makeEl('span', null, m.desc));
  var r = St.d.g[keyFor(def, m.id)];
  if (r && r.best) {
    if (m.low) { b.appendChild(makeEl('i', null, 'BEST ' + r.best + 's')); }
    else { b.appendChild(makeEl('i', null, 'BEST ' + r.best)); }
  }
  b.addEventListener('click', function(){ G.play(def.id, m.id); });
  return b;
}

// games with modes get a mode screen first
G.pick = function(id){
  var def = byId(id);
  if (!def) { return; }
  if (!def.modes) {
    G.play(id);
    return;
  }

  modeEl.textContent = '';
  modeEl.appendChild(makeEl('h3', null, def.name + ' - CHOOSE A MODE'));
  var grid = makeEl('div', 'gm-menu');
  for (var i = 0; i < def.modes.length; i++) {
    grid.appendChild(modeCard(def, def.modes[i]));
  }
  modeEl.appendChild(grid);

  var back = makeEl('button', 'tab-go', 'BACK');
  back.type = 'button';
  back.addEventListener('click', G.back);
  modeEl.appendChild(back);
  show('modes');
};

G.play = function(id, mode){
  var def = byId(id);
  if (!def) { return; }
  closeGame();

  var mdef = null;
  if (def.modes) {
    mode = mode || lastMode(def);
    if (!St.d.g.modes) { St.d.g.modes = {}; }
    St.d.g.modes[id] = mode;
    for (var i = 0; i < def.modes.length; i++) {
      if (def.modes[i].id == mode) { mdef = def.modes[i]; }
    }
  }

  show('stage');
  win.titleEl.textContent = def.name;
  hdTitle.textContent = def.name;
  if (mdef) { hdTitle.textContent = def.name + '  -  ' + mdef.name; }
  helpEl.textContent = def.help || '';
  pauseBtn.hidden = true;
  layer.textContent = '';
  layer.hidden = true;
  clearSay();
  fx = [];
  DW.gaming = true;
  document.body.classList.add('gaming');
  win.el.classList.add('full');
  if (document.activeElement && document.activeElement.blur) { document.activeElement.blur(); }

  cur = { def: def, mode: mode, game: null };
  try {
    cur.game = def.make(makeEnv(def, mode));
    buildPad(def);
    bindPointer(def);
    fit();
    last = performance.now();
    raf = requestAnimationFrame(loop);
    cur.game.start();
  } catch(err) {
    // a broken game shouldnt leave the window stuck on a blank canvas
    console.error('[dweeb] could not start ' + id, err);
    closeGame();
    buildMenu();
    show('menu');
    return;
  }

  // so the keyboard goes to the window and not whatever button user clicked
  var first = win.el.firstChild;
  if (first && first.focus) { first.focus(); }
};

function menuCard(d){
  var b = makeEl('button', 'gm-card');
  var r = St.d.g[d.id];
  b.type = 'button';
  b.appendChild(makeEl('b', null, d.name));
  b.appendChild(makeEl('span', null, d.blurb));
  if (r && r.plays) { b.appendChild(makeEl('i', null, r.plays + ' PLAYS')); }
  b.addEventListener('click', function(){ G.pick(d.id); });
  return b;
}

function buildMenu(){
  menuEl.textContent = '';
  for (var i = 0; i < G.list.length; i++) {
    menuEl.appendChild(menuCard(G.list[i]));
  }
}

G.init = function(){
  win = DW.win('games', 'GAMES');
  menuEl = makeEl('div', 'gm-menu');
  modeEl = makeEl('div', 'gm-modes');
  stageEl = makeEl('div', 'gm-stage');
  modeEl.hidden = true;
  stageEl.hidden = true;

  // header so like back, title, fullscreen + pause
  var hd = makeEl('div', 'gm-hd');
  var back = makeEl('button', 'tab-go', 'BACK');
  var right = makeEl('div', 'gm-hr');
  back.type = 'button';
  back.addEventListener('click', G.back);
  hdTitle = makeEl('b');

  pauseBtn = makeEl('button', 'tab-go', 'PAUSE');
  pauseBtn.type = 'button';
  pauseBtn.hidden = true;
  pauseBtn.addEventListener('click', function(){
    setPaused(!paused);
    pauseBtn.blur();
  });

  fsBtn = makeEl('button', 'tab-go', 'FULLSCREEN');
  fsBtn.type = 'button';
  fsBtn.hidden = !document.documentElement.requestFullscreen;
  fsBtn.addEventListener('click', function(){
    var p;
    if (document.fullscreenElement) { p = document.exitFullscreen(); }
    else { p = document.documentElement.requestFullscreen(); }
    if (p && p.catch) { p.catch(function(){}); }
    fsBtn.blur();
  });
  right.appendChild(fsBtn);
  right.appendChild(pauseBtn);
  hd.appendChild(back);
  hd.appendChild(hdTitle);
  hd.appendChild(right);

  // score line
  var hud = makeEl('div', 'gm-hud');
  hudL = makeEl('span');
  hudR = makeEl('span');
  hud.appendChild(hudL);
  hud.appendChild(hudR);

  // canvas + the layers on top of it
  wrap = makeEl('div', 'gm-cv');
  cv = makeEl('canvas');
  ctx = cv.getContext('2d');
  ovEl = makeEl('div', 'gm-ov');
  ovEl.hidden = true;
  ovT = makeEl('b');
  ovS = makeEl('span');
  ovB = makeEl('button', 'cm-go', '');
  ovB.type = 'button';
  ovB.addEventListener('click', function(){
    if (ovFn) { ovFn(); }
  });
  ovEl.appendChild(ovT);
  ovEl.appendChild(ovS);
  ovEl.appendChild(ovB);
  layer = makeEl('div', 'gm-layer');
  layer.hidden = true;
  wrap.appendChild(cv);
  wrap.appendChild(layer);
  wrap.appendChild(ovEl);

  padEl = makeEl('div', 'gm-pad');
  padEl.hidden = true;
  helpEl = makeEl('div', 'gm-help');

  stageEl.appendChild(hd);
  stageEl.appendChild(hud);
  stageEl.appendChild(wrap);
  stageEl.appendChild(padEl);
  stageEl.appendChild(helpEl);
  win.body.appendChild(menuEl);
  win.body.appendChild(modeEl);
  win.body.appendChild(stageEl);
  win.body.classList.add('gm-body');

  win.onopen = function(){
    if (!cur) {
      buildMenu();
      show('menu');
    }
  };
  win.onclose = function(){
    closeGame();
    show('menu');
  };

  addEventListener('keydown', function(e){ onKey(e, true); }, true);
  addEventListener('keyup', function(e){ onKey(e, false); }, true);
  addEventListener('resize', fit);

  // pause if switch tab
  function away(){
    if (cur && running && cur.def.autopause !== false) { setPaused(true); }
  }
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) { away(); }
  });
  addEventListener('blur', away);

  // status bar button
  var btn = makeEl('button', 'tbtn');
  btn.id = 'b-games';
  btn.type = 'button';
  btn.title = 'games';
  var iconSrc = (DW.icons || {}).games;
  if (iconSrc) {
    var icon = new Image();
    icon.alt = '';
    icon.src = iconSrc;
    btn.appendChild(icon);
  } else {
    btn.classList.add('noic');
  }
  var label = makeEl('span', null, 'GAMES');
  label.setAttribute('data-s', 'PLAY');
  btn.appendChild(label);
  btn.addEventListener('click', function(){
    win.toggle();
    btn.blur();
  });

  var bar = document.getElementById('status');
  if (bar) {
    var before = document.getElementById('b-trophy') || document.getElementById('b-help') || document.getElementById('views-wrap');
    bar.insertBefore(btn, before);
  }
};
})();
