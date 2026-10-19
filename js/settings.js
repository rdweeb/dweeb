// Default preferences and local settings storage.

(function(){
var DW = window.DW;
var S = {};
DW.set = S;
var KEY = 'dw-set';

// default
var DEF = {
  hue: 0, sat: 100, bri: 100,
  master: 100, sens: 100, parts: 100, glow: 100, still: false,
  muteStart: false, autoplay: true,
  skipIntro: false,
  bot: true, chat: 'normal',
  seasonfx: true, scare: true, pet: true, sfx: true, perf: 'auto'
};
var LIM = { hue: [-180, 180], sat: [30, 140], bri: [60, 120], master: [0, 200], sens: [50, 200], parts: [0, 200], glow: [0, 200] };
var ENUM = { chat: ['quiet', 'normal', 'chatty'], perf: ['auto', 'on', 'off'] };

function limit(k, v){
  return Math.max(LIM[k][0], Math.min(LIM[k][1], Math.round(v)));
}

// only the settings that differ from the defaults get saved
var saved = {};
try {
  var raw = JSON.parse(localStorage.getItem(KEY) || '{}');
  if (raw && typeof raw == 'object') {
    var names = Object.keys(DEF);
    for (var n = 0; n < names.length; n++) {
      var k = names[n];
      var v = raw[k];
      var t = typeof DEF[k];
      if (t == 'boolean' && typeof v == 'boolean') { saved[k] = v; }
      else if (t == 'number' && typeof v == 'number' && isFinite(v) && LIM[k]) { saved[k] = limit(k, v); }
      else if (t == 'string' && ENUM[k] && ENUM[k].indexOf(v) >= 0) { saved[k] = v; }
    }
  }
} catch(e) { saved = {}; }

S.defaults = DEF;

S.get = function(k){
  if (saved[k] !== undefined) { return saved[k]; }
  return DEF[k];
};

S.changed = function(k){
  return saved[k] !== undefined && saved[k] !== DEF[k];
};

// other files can listen for changes
var subs = [];
S.on = function(f){ subs.push(f); };

function tell(k){
  for (var i = 0; i < subs.length; i++) {
    try { subs[i](k); } catch(e) {}
  }
}

function store(){
  try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch(e) {}
}

S.put = function(k, v){
  if (!(k in DEF) || typeof v !== typeof DEF[k]) { return; }
  if (LIM[k]) { v = limit(k, v); }
  if (ENUM[k] && ENUM[k].indexOf(v) < 0) { return; }
  if (v === DEF[k]) { delete saved[k]; }
  else { saved[k] = v; }
  store();
  tell(k);
};

S.reset = function(){
  saved = {};
  store();
  tell('*');
};

// power mode is applied right away before anything
var perf = S.get('perf');
if (perf == 'on') {
  DW.low = true;
  document.documentElement.classList.add('low');
} else if (perf == 'off') {
  DW.low = false;
  document.documentElement.classList.remove('low');
}

if (S.get('skipIntro')) { DW.intro = DW.intro || {}; }

/* changing the colours of the whole site */
var items = null;  // every colour found in th stylesheets, so it can be shifted and put back
var COL = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)/g;

function collect(){
  items = [];

  function walk(rules){
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.style) {
        for (var j = 0; j < r.style.length; j++) {
          var name = r.style[j];
          var value = r.style.getPropertyValue(name);
          if (value && value.search(COL) >= 0) {
            items.push({ st: r.style, n: name, v: value, p: r.style.getPropertyPriority(name) });
          }
        }
      }
      // media queries etc have rules inside them
      if (r.cssRules) {
        try { walk(r.cssRules); } catch(e) {}
      }
    }
  }

  for (var s = 0; s < document.styleSheets.length; s++) {
    try { walk(document.styleSheets[s].cssRules); } catch(e) {}
  }
}

function toHsl(r, g, b){
  r = r / 255;
  g = g / 255;
  b = b / 255;
  var mx = Math.max(r, g, b);
  var mn = Math.min(r, g, b);
  var l = (mx + mn) / 2;
  var h = 0;
  var s = 0;
  var d = mx - mn;
  if (d) {
    if (l > 0.5) { s = d / (2 - mx - mn); }
    else { s = d / (mx + mn); }
    if (mx == r) {
      h = (g - b) / d;
      if (g < b) { h = h + 6; }
    } else if (mx == g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h = h * 60;
  }
  return [h, s, l];
}

function chan(p, q, t){
  if (t < 0) { t = t + 1; }
  if (t > 1) { t = t - 1; }
  if (t < 1 / 6) { return p + (q - p) * 6 * t; }
  if (t < 1 / 2) { return q; }
  if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
  return p;
}

function toRgb(h, s, l){
  h = ((h % 360) + 360) % 360 / 360;
  if (!s) {
    var grey = Math.round(l * 255);
    return [grey, grey, grey];
  }
  var q;
  if (l < 0.5) { q = l * (1 + s); }
  else { q = l + s - l * s; }
  var p = 2 * l - q;
  return [
    Math.round(chan(p, q, h + 1 / 3) * 255),
    Math.round(chan(p, q, h) * 255),
    Math.round(chan(p, q, h - 1 / 3) * 255)
  ];
}

// moves one colour by hue/saturation/brightness greys and strong reds are no
function shift(rgb, dh, ds, db){
  var a = toHsl(rgb[0], rgb[1], rgb[2]);
  var h = a[0];
  var s = a[1];
  var l = a[2];
  if (s < 0.08) { return rgb; }
  if (s > 0.45 && (h <= 70 || h >= 335)) { return rgb; }
  h = h + dh;
  s = Math.min(1, s * ds);
  l = Math.min(0.97, l * db);
  return toRgb(h, s, l);
}

function hex2(n){
  var pad = '';
  if (n < 16) { pad = '0'; }
  return pad + n.toString(16);
}

// finds every colour inside a css value and shifts it
function recolor(str, dh, ds, db){
  return str.replace(COL, function(m){
    var rgb;
    var a = null;

    if (m.charAt(0) == '#') {
      var x = m.slice(1);
      if (x.length == 3) {
        x = x.charAt(0) + x.charAt(0) + x.charAt(1) + x.charAt(1) + x.charAt(2) + x.charAt(2);
      }
      rgb = [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
      if (x.length == 8) { a = parseInt(x.slice(6, 8), 16) / 255; }
    } else {
      var bits = m.slice(m.indexOf('(') + 1, -1).split(/[ ,\/]+/);
      var nums = [];
      for (var i = 0; i < bits.length; i++) { nums.push(parseFloat(bits[i])); }
      if (nums.length < 3 || isNaN(nums[0]) || isNaN(nums[1]) || isNaN(nums[2])) { return m; }
      rgb = [nums[0], nums[1], nums[2]];
      if (nums.length > 3 && !isNaN(nums[3])) {
        a = nums[3];
        if (/%$/.test(bits[3])) { a = a / 100; }
      }
    }

    var o = shift(rgb, dh, ds, db);
    if (a === null || a >= 1) { return '#' + hex2(o[0]) + hex2(o[1]) + hex2(o[2]); }
    return 'rgba(' + o[0] + ', ' + o[1] + ', ' + o[2] + ', ' + Number(a.toFixed(3)) + ')';
  });
}

var paintQ = 0;

function paintNow(){
  paintQ = 0;
  var dh = S.get('hue');
  var ds = S.get('sat') / 100;
  var db = S.get('bri') / 100;
  var plain = (dh === 0 && ds === 1 && db === 1);

  if (!items) {
    if (plain) { return; }  // nothing to change yet
    collect();
  }
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var value = it.v;
    if (!plain) { value = recolor(it.v, dh, ds, db); }
    try { it.st.setProperty(it.n, value, it.p); } catch(e) {}
  }
  if (DW.particles && DW.particles.recolor) { DW.particles.recolor(); }
}

// repaint on the next frame
S.paint = function(){
  if (!paintQ) { paintQ = requestAnimationFrame(paintNow); }
};

function hexToRgb(hex){
  var x = hex.replace('#', '');
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
}

// a hex colour with the current theme applied
S.tint = function(hex){
  var o = shift(hexToRgb(hex), S.get('hue'), S.get('sat') / 100, S.get('bri') / 100);
  return '#' + hex2(o[0]) + hex2(o[1]) + hex2(o[2]);
};

// the main purple aka the default
S.swatch = function(dh, ds, db){
  var o = shift([222, 55, 228], dh, ds / 100, db / 100);
  return '#' + hex2(o[0]) + hex2(o[1]) + hex2(o[2]);
};

/* how much the site reacts to the music */

var base = null;  // the original values from the config

function react(){
  var R = DW.react;
  if (!R) { return; }
  if (!base) {
    base = { master: R.master, sens: R.sensitivity, parts: R.particles, gb: R.glow.base, gp: R.glow.pulse, idle: R.wave.idle };
  }
  var still = S.get('still') || DW.reduce;
  if (still) {
    R.master = 0;
    R.wave.idle = 0;
    R.particles = 0;
    R.glow.pulse = 0;
  } else {
    R.master = base.master * S.get('master') / 100;
    R.wave.idle = base.idle;
    R.particles = base.parts * S.get('parts') / 100;
    R.glow.pulse = base.gp * S.get('glow') / 100;
  }
  R.sensitivity = base.sens * S.get('sens') / 100;
  R.glow.base = base.gb * S.get('glow') / 100;
}

/* the settings window */

// [name, hue, saturation, brightness]
var PRESETS = [
  ['PURPLE', 0, 100, 100], ['PINK', 25, 100, 105], ['RED', 65, 100, 100], ['ORANGE', 100, 100, 100],
  ['GREEN', 170, 90, 100], ['TEAL', -130, 95, 100], ['BLUE', -80, 100, 105], ['DARK', 0, 85, 72]
];
var NEED = { skipIntro: 1, perf: 1 };  // these only apply after a refresh
var note;
var refreshers = [];  // functions that redraw the controls

function makeEl(tag, cls, text){
  var e = document.createElement(tag);
  if (cls) { e.className = cls; }
  if (text !== undefined) { e.textContent = text; }
  return e;
}

function section(win, title){
  var s = makeEl('section', 'set-sec');
  s.appendChild(makeEl('h3', null, title));
  win.body.appendChild(s);
  return s;
}

function row(s, label, hint){
  var r = makeEl('div', 'set-row');
  var t = makeEl('div', 'set-t');
  t.appendChild(makeEl('b', null, label));
  if (hint) { t.appendChild(makeEl('span', null, hint)); }
  r.appendChild(t);
  s.appendChild(r);
  return r;
}

function changed(k){
  if (DW.trophy) { DW.trophy.mark('tinker', k); }
  if (NEED[k]) { note.hidden = false; }
}

function toggle(s, key, label, hint){
  var r = row(s, label, hint);
  var b = makeEl('button', 'set-tg');
  b.type = 'button';
  b.setAttribute('role', 'switch');
  b.setAttribute('aria-label', label);

  function paint(){
    var on = S.get(key) ? true : false;
    if (on) { b.setAttribute('aria-checked', 'true'); b.textContent = 'ON'; }
    else { b.setAttribute('aria-checked', 'false'); b.textContent = 'OFF'; }
    b.classList.toggle('on', on);
  }
  b.addEventListener('click', function(){
    S.put(key, !S.get(key));
    paint();
    changed(key);
    b.blur();
  });
  paint();
  refreshers.push(paint);
  r.appendChild(b);
}

function slider(s, key, label, hint, step, suffix){
  var r = row(s, label, hint);
  var wrapper = makeEl('div', 'set-sl');
  var input = makeEl('input');
  var out = makeEl('output');
  input.type = 'range';
  input.min = LIM[key][0];
  input.max = LIM[key][1];
  input.step = step || 5;
  input.setAttribute('aria-label', label);

  function paint(){
    input.value = S.get(key);
    out.textContent = S.get(key) + (suffix || '%');
    // fill amount for the css track
    input.style.setProperty('--v', ((input.value - input.min) / (input.max - input.min) * 100) + '%');
  }
  input.addEventListener('input', function(){
    S.put(key, Number(input.value));
    paint();
  });
  input.addEventListener('change', function(){
    changed(key);
    input.blur();
  });
  paint();
  refreshers.push(paint);
  wrapper.appendChild(input);
  wrapper.appendChild(out);
  r.appendChild(wrapper);
}

// a row of buttons where one is selected
function segment(s, key, label, hint, opts){
  var r = row(s, label, hint);
  var group = makeEl('div', 'set-seg');
  var buttons = [];
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', label);

  function paint(){
    for (var i = 0; i < buttons.length; i++) {
      var on = (S.get(key) === buttons[i][0]);
      buttons[i][1].classList.toggle('on', on);
      buttons[i][1].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  function addButton(o){
    var b = makeEl('button', null, o[1]);
    b.type = 'button';
    b.addEventListener('click', function(){
      S.put(key, o[0]);
      paint();
      changed(key);
      b.blur();
    });
    buttons.push([o[0], b]);
    group.appendChild(b);
  }
  for (var i = 0; i < opts.length; i++) { addButton(opts[i]); }
  paint();
  refreshers.push(paint);
  r.appendChild(group);
}

function refreshAll(){
  for (var i = 0; i < refreshers.length; i++) { refreshers[i](); }
}

S.init = function(){
  var win = DW.win('settings', 'SETTINGS');

  // "refresh to apply" bar
  note = makeEl('div', 'set-note');
  note.hidden = true;
  note.appendChild(makeEl('span', null, 'some changes apply after a refresh'));
  var reloadBtn = makeEl('button', null, 'REFRESH');
  reloadBtn.type = 'button';
  reloadBtn.addEventListener('click', function(){
    try { if (DW.store) { DW.store.flush(); } } catch(e) {}
    location.reload();
  });
  note.appendChild(reloadBtn);
  win.body.appendChild(note);

  // colours
  var s = section(win, 'COLOURS');
  var presetRow = makeEl('div', 'set-pre');
  var presetButtons = [];

  function addPreset(p){
    var b = makeEl('button', null, p[0]);
    b.type = 'button';
    var swatch = makeEl('i');
    swatch.style.background = S.swatch(p[1], p[2], p[3]);
    b.insertBefore(swatch, b.firstChild);
    b.addEventListener('click', function(){
      S.put('hue', p[1]);
      S.put('sat', p[2]);
      S.put('bri', p[3]);
      refreshAll();
      changed('theme');
      b.blur();
    });
    presetButtons.push([p, b]);
    presetRow.appendChild(b);
  }
  for (var i = 0; i < PRESETS.length; i++) { addPreset(PRESETS[i]); }

  function presetPaint(){
    for (var j = 0; j < presetButtons.length; j++) {
      var p = presetButtons[j][0];
      var on = S.get('hue') === p[1] && S.get('sat') === p[2] && S.get('bri') === p[3];
      presetButtons[j][1].classList.toggle('on', on);
    }
  }
  refreshers.push(presetPaint);
  s.appendChild(presetRow);
  slider(s, 'hue', 'Colour', 'slide through every colour', 5, '°');
  slider(s, 'sat', 'Intensity', 'how strong the colours are', 5);
  slider(s, 'bri', 'Brightness', 'lighter or darker', 5);
  S.on(function(){ presetPaint(); });
  presetPaint();

  // reactivity
  s = section(win, 'REACTIVITY');
  slider(s, 'master', 'Beat reaction', 'how much everything bounces to the music', 10);
  slider(s, 'sens', 'Sensitivity', 'how easily it picks up the beat', 10);
  slider(s, 'parts', 'Floating dots', '0 turns them off', 10);
  slider(s, 'glow', 'Background glow', 'how bright the glow pulses', 10);
  toggle(s, 'still', 'Calm mode', 'no bouncing, no waves, no dots');

  // music
  s = section(win, 'MUSIC');
  toggle(s, 'muteStart', 'Start muted', 'the site always opens with the music muted');
  toggle(s, 'autoplay', 'Autoplay', 'start the music on your first tap or key');
  toggle(s, 'skipIntro', 'Skip intro', 'go straight into the site, no intro video');

  // chat bot
  s = section(win, 'CHAT BOT');
  toggle(s, 'bot', 'Chat bot', 'the little text that talks to you');
  segment(s, 'chat', 'Chattiness', 'how often it speaks up', [['quiet', 'QUIET'], ['normal', 'NORMAL'], ['chatty', 'CHATTY']]);

  // extras
  s = section(win, 'EXTRAS');
  toggle(s, 'seasonfx', 'Seasonal decorations', 'spiders, trees and so on, in their season');
  toggle(s, 'scare', 'Jump scares', 'turn off if you scare easily');
  toggle(s, 'pet', 'Eyes follow you', 'the visitor eyes react to your cursor');
  toggle(s, 'sfx', 'Trophy sound', 'the little jingle when you unlock one');
  segment(s, 'perf', 'Power mode', 'on = lighter effects, better for slow phones', [['auto', 'AUTO'], ['on', 'LIGHT'], ['off', 'FULL']]);

  // reset
  var foot = makeEl('div', 'set-foot');
  var resetBtn = makeEl('button', null, 'RESET ALL');
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', function(){
    S.reset();
    refreshAll();
    note.hidden = false;
    resetBtn.blur();
  });
  foot.appendChild(resetBtn);
  foot.appendChild(makeEl('p', null, 'saved on this device only. nothing here is sent anywhere.'));
  win.body.appendChild(foot);

  // status bar button
  var btn = makeEl('button', 'tbtn');
  btn.id = 'b-set';
  btn.type = 'button';
  btn.title = 'settings';
  var iconSrc = (DW.icons || {}).settings;
  if (iconSrc) {
    var icon = new Image();
    icon.src = iconSrc;
    icon.alt = '';
    btn.appendChild(icon);
  } else {
    btn.classList.add('noic');
  }
  var label = makeEl('span', null, 'SETTINGS');
  label.setAttribute('data-s', 'SET');
  btn.appendChild(label);
  btn.addEventListener('click', function(){
    win.toggle();
    btn.blur();
  });
  var bar = document.getElementById('status');
  if (bar) {
    bar.insertBefore(btn, document.getElementById('b-help') || document.getElementById('views-wrap'));
  }

  // react to changes
  S.on(function(k){
    if (k == '*' || k == 'hue' || k == 'sat' || k == 'bri') { S.paint(); }
    if (k == '*' || k == 'master' || k == 'sens' || k == 'parts' || k == 'glow' || k == 'still') { react(); }
  });
  S.on(function(k){
    if (k == '*' || k == 'bot') {
      if (DW.splashUI && DW.splashUI.apply) { DW.splashUI.apply(); }
    }
    if (k == '*' || k == 'pet') {
      if (DW.pet && DW.pet.apply) { DW.pet.apply(); }
    }
    if (k == '*' || k == 'seasonfx') {
      var F = DW.seasonfx;
      var id = DW.season && DW.season.id;
      if (F) {
        if (S.get('seasonfx') === false) { F.stop(); }
        else if (id) { F.start(id); }
      }
    }
  });
  S.paint();
  react();
};
})();
