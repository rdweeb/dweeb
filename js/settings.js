(function () {
  var DW = window.DW, S = (DW.set = {});
  var KEY = 'dw-set';

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

  var saved = {};
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (raw && typeof raw === 'object') Object.keys(DEF).forEach(function (k) {
      var v = raw[k], t = typeof DEF[k];
      if (t === 'boolean' && typeof v === 'boolean') saved[k] = v;
      else if (t === 'number' && typeof v === 'number' && isFinite(v) && LIM[k]) saved[k] = Math.max(LIM[k][0], Math.min(LIM[k][1], Math.round(v)));
      else if (t === 'string' && ENUM[k] && ENUM[k].indexOf(v) >= 0) saved[k] = v;
    });
  } catch (e) { saved = {}; }

  S.defaults = DEF;
  S.get = function (k) { return saved[k] !== undefined ? saved[k] : DEF[k]; };
  S.changed = function (k) { return saved[k] !== undefined && saved[k] !== DEF[k]; };

  var subs = [];
  S.on = function (f) { subs.push(f); };
  function store() {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }
  S.put = function (k, v) {
    if (!(k in DEF) || typeof v !== typeof DEF[k]) return;
    if (LIM[k]) v = Math.max(LIM[k][0], Math.min(LIM[k][1], Math.round(v)));
    if (ENUM[k] && ENUM[k].indexOf(v) < 0) return;
    if (v === DEF[k]) delete saved[k]; else saved[k] = v;
    store();
    subs.forEach(function (f) { try { f(k); } catch (e) {} });
  };
  S.reset = function () {
    saved = {};
    store();
    subs.forEach(function (f) { try { f('*'); } catch (e) {} });
  };

  var perf = S.get('perf');
  if (perf === 'on') { DW.low = true; document.documentElement.classList.add('low'); }
  else if (perf === 'off') { DW.low = false; document.documentElement.classList.remove('low'); }

  if (S.get('skipIntro')) DW.intro = DW.intro || {};
  
  var items = null;
  var COL = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)/g;

  function collect() {
    items = [];
    function walk(rules) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.style) {
          for (var j = 0; j < r.style.length; j++) {
            var n = r.style[j], v = r.style.getPropertyValue(n);
            if (v && v.search(COL) >= 0) items.push({ st: r.style, n: n, v: v, p: r.style.getPropertyPriority(n) });
          }
        }
        if (r.cssRules) { try { walk(r.cssRules); } catch (e) {} }
      }
    }
    for (var s = 0; s < document.styleSheets.length; s++) {
      try { walk(document.styleSheets[s].cssRules); } catch (e) {}
    }
  }
  function toHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function toRgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    if (!s) { var k = Math.round(l * 255); return [k, k, k]; }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function c(t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    return [Math.round(c(h + 1 / 3) * 255), Math.round(c(h) * 255), Math.round(c(h - 1 / 3) * 255)];
  }
  function shift(rgb, dh, ds, db) {
    var a = toHsl(rgb[0], rgb[1], rgb[2]), h = a[0], s = a[1], l = a[2];
    if (s < 0.08) return rgb;
    if (s > 0.45 && (h <= 70 || h >= 335)) return rgb;
    h += dh;
    s = Math.min(1, s * ds);
    l = Math.min(0.97, l * db);
    return toRgb(h, s, l);
  }
  function hex2(n) { return (n < 16 ? '0' : '') + n.toString(16); }
  function recolor(str, dh, ds, db) {
    return str.replace(COL, function (m) {
      var rgb, a = null;
      if (m.charAt(0) === '#') {
        var x = m.slice(1);
        if (x.length === 3) x = x.charAt(0) + x.charAt(0) + x.charAt(1) + x.charAt(1) + x.charAt(2) + x.charAt(2);
        rgb = [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
        if (x.length === 8) a = parseInt(x.slice(6, 8), 16) / 255;
      } else {
        var n = m.slice(m.indexOf('(') + 1, -1).split(/[ ,\/]+/).map(parseFloat);
        if (n.length < 3 || n.slice(0, 3).some(isNaN)) return m;
        rgb = n.slice(0, 3);
        if (n.length > 3 && !isNaN(n[3])) a = n[3];
      }
      var o = shift(rgb, dh, ds, db);
      return a === null || a >= 1 ? '#' + hex2(o[0]) + hex2(o[1]) + hex2(o[2]) : 'rgba(' + o[0] + ', ' + o[1] + ', ' + o[2] + ', ' + (+a.toFixed(3)) + ')';
    });
  }
  var paintQ = 0;
  function paintNow() {
    paintQ = 0;
    var dh = S.get('hue'), ds = S.get('sat') / 100, db = S.get('bri') / 100;
    if (!items) { if (dh === 0 && ds === 1 && db === 1) return; collect(); }
    var plain = dh === 0 && ds === 1 && db === 1;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      try { it.st.setProperty(it.n, plain ? it.v : recolor(it.v, dh, ds, db), it.p); } catch (e) {}
    }
    if (DW.particles && DW.particles.recolor) DW.particles.recolor();
  }
  S.paint = function () { if (!paintQ) paintQ = requestAnimationFrame(paintNow); };
  S.tint = function (hex) {
    var x = hex.replace('#', ''), o = shift([parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)], S.get('hue'), S.get('sat') / 100, S.get('bri') / 100);
    return '#' + hex2(o[0]) + hex2(o[1]) + hex2(o[2]);
  };
  S.swatch = function (dh, ds, db) {
    var o = shift([222, 55, 228], dh, ds / 100, db / 100);
    return '#' + hex2(o[0]) + hex2(o[1]) + hex2(o[2]);
  };

  // reactivity
  var base = null;
  function react() {
    var R = DW.react;
    if (!R) return;
    if (!base) base = { master: R.master, sens: R.sensitivity, parts: R.particles, gb: R.glow.base, gp: R.glow.pulse, idle: R.wave.idle };
    var still = S.get('still') || DW.reduce;
    R.master = still ? 0 : base.master * S.get('master') / 100;
    R.wave.idle = still ? 0 : base.idle;
    R.sensitivity = base.sens * S.get('sens') / 100;
    R.particles = still ? 0 : base.parts * S.get('parts') / 100;
    R.glow.base = base.gb * S.get('glow') / 100;
    R.glow.pulse = still ? 0 : base.gp * S.get('glow') / 100;
  }

  // the window
  var PRESETS = [
    ['PURPLE', 0, 100, 100], ['PINK', 25, 100, 105], ['RED', 65, 100, 100], ['ORANGE', 100, 100, 100],
    ['GREEN', 170, 90, 100], ['TEAL', -130, 95, 100], ['BLUE', -80, 100, 105], ['DARK', 0, 85, 72]
  ];
  var NEED = { skipIntro: 1, perf: 1 };
  var note;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function sec(win, title) {
    var s = el('section', 'set-sec');
    s.appendChild(el('h3', null, title));
    win.body.appendChild(s);
    return s;
  }
  function row(s, label, hint) {
    var r = el('div', 'set-row'), t = el('div', 'set-t');
    t.appendChild(el('b', null, label));
    if (hint) t.appendChild(el('span', null, hint));
    r.appendChild(t);
    s.appendChild(r);
    return r;
  }
  function changed(k) {
    if (DW.trophy) DW.trophy.mark('tinker', k);
    if (NEED[k]) note.hidden = false;
  }
  var refreshers = [];

  function toggle(s, key, label, hint) {
    var r = row(s, label, hint), b = el('button', 'set-tg');
    b.type = 'button';
    b.setAttribute('role', 'switch');
    function paint() { var on = !!S.get(key); b.setAttribute('aria-checked', on ? 'true' : 'false'); b.textContent = on ? 'ON' : 'OFF'; b.classList.toggle('on', on); }
    b.addEventListener('click', function () { S.put(key, !S.get(key)); paint(); changed(key); b.blur(); });
    b.setAttribute('aria-label', label);
    paint();
    refreshers.push(paint);
    r.appendChild(b);
  }
  function slider(s, key, label, hint, step, suffix) {
    var r = row(s, label, hint), w = el('div', 'set-sl'), i = el('input'), v = el('output');
    i.type = 'range';
    i.min = LIM[key][0]; i.max = LIM[key][1]; i.step = step || 5;
    i.setAttribute('aria-label', label);
    function paint() {
      i.value = S.get(key);
      v.textContent = S.get(key) + (suffix || '%');
      i.style.setProperty('--v', ((i.value - i.min) / (i.max - i.min) * 100) + '%');
    }
    i.addEventListener('input', function () { S.put(key, +i.value); paint(); });
    i.addEventListener('change', function () { changed(key); i.blur(); });
    paint();
    refreshers.push(paint);
    w.appendChild(i); w.appendChild(v);
    r.appendChild(w);
  }
  function seg(s, key, label, hint, opts) {
    var r = row(s, label, hint), g = el('div', 'set-seg'), bs = [];
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', label);
    opts.forEach(function (o) {
      var b = el('button', null, o[1]);
      b.type = 'button';
      b.addEventListener('click', function () { S.put(key, o[0]); paint(); changed(key); b.blur(); });
      bs.push([o[0], b]);
      g.appendChild(b);
    });
    function paint() { bs.forEach(function (p) { p[1].classList.toggle('on', S.get(key) === p[0]); p[1].setAttribute('aria-pressed', S.get(key) === p[0] ? 'true' : 'false'); }); }
    paint();
    refreshers.push(paint);
    r.appendChild(g);
  }

  S.init = function () {
    var win = DW.win('settings', 'SETTINGS');

    note = el('div', 'set-note');
    note.hidden = true;
    note.appendChild(el('span', null, 'some changes apply after a refresh'));
    var rl = el('button', null, 'REFRESH');
    rl.type = 'button';
    rl.addEventListener('click', function () { try { if (DW.store) DW.store.flush(); } catch (e) {} location.reload(); });
    note.appendChild(rl);
    win.body.appendChild(note);

    var s = sec(win, 'COLOURS');
    var pr = el('div', 'set-pre'), pb = [];
    PRESETS.forEach(function (p) {
      var b = el('button', null, p[0]);
      b.type = 'button';
      var sw = el('i');
      sw.style.background = S.swatch(p[1], p[2], p[3]);
      b.insertBefore(sw, b.firstChild);
      b.addEventListener('click', function () {
        S.put('hue', p[1]); S.put('sat', p[2]); S.put('bri', p[3]);
        refreshers.forEach(function (f) { f(); });
        changed('theme');
        b.blur();
      });
      pb.push([p, b]);
      pr.appendChild(b);
    });
    function presetPaint() {
      pb.forEach(function (x) { x[1].classList.toggle('on', S.get('hue') === x[0][1] && S.get('sat') === x[0][2] && S.get('bri') === x[0][3]); });
    }
    refreshers.push(presetPaint);
    s.appendChild(pr);
    slider(s, 'hue', 'Colour', 'slide through every colour', 5, '°');
    slider(s, 'sat', 'Intensity', 'how strong the colours are', 5);
    slider(s, 'bri', 'Brightness', 'lighter or darker', 5);
    S.on(function () { presetPaint(); });
    presetPaint();

    s = sec(win, 'REACTIVITY');
    slider(s, 'master', 'Beat reaction', 'how much everything bounces to the music', 10);
    slider(s, 'sens', 'Sensitivity', 'how easily it picks up the beat', 10);
    slider(s, 'parts', 'Floating dots', '0 turns them off', 10);
    slider(s, 'glow', 'Background glow', 'how bright the glow pulses', 10);
    toggle(s, 'still', 'Calm mode', 'no bouncing, no waves, no dots');

    s = sec(win, 'MUSIC');
    toggle(s, 'muteStart', 'Start muted', 'the site always opens with the music muted');
    toggle(s, 'autoplay', 'Autoplay', 'start the music on your first tap or key');
    toggle(s, 'skipIntro', 'Skip intro', 'go straight into the site, no intro video');

    s = sec(win, 'CHAT BOT');
    toggle(s, 'bot', 'Chat bot', 'the little text that talks to you');
    seg(s, 'chat', 'Chattiness', 'how often it speaks up', [['quiet', 'QUIET'], ['normal', 'NORMAL'], ['chatty', 'CHATTY']]);

    s = sec(win, 'EXTRAS');
    toggle(s, 'seasonfx', 'Seasonal decorations', 'spiders, trees and so on, in their season');
    toggle(s, 'scare', 'Jump scares', 'turn off if you scare easily');
    toggle(s, 'pet', 'Eyes follow you', 'the visitor eyes react to your cursor');
    toggle(s, 'sfx', 'Trophy sound', 'the little jingle when you unlock one');
    seg(s, 'perf', 'Power mode', 'on = lighter effects, better for slow phones', [['auto', 'AUTO'], ['on', 'LIGHT'], ['off', 'FULL']]);

    var foot = el('div', 'set-foot');
    var rs = el('button', null, 'RESET ALL');
    rs.type = 'button';
    rs.addEventListener('click', function () {
      S.reset();
      refreshers.forEach(function (f) { f(); });
      note.hidden = false;
      rs.blur();
    });
    foot.appendChild(rs);
    foot.appendChild(el('p', null, 'saved on this device only. nothing here is sent anywhere.'));
    win.body.appendChild(foot);

    var btn = el('button', 'tbtn');
    btn.id = 'b-set';
    btn.type = 'button';
    btn.title = 'settings';
    var src = (DW.icons || {}).settings;
    if (src) {
      var ic = new Image();
      ic.src = src; ic.alt = '';
      btn.appendChild(ic);
    } else btn.classList.add('noic');
    var lb = el('span', null, 'SETTINGS');
    lb.setAttribute('data-s', 'SET');
    btn.appendChild(lb);
    btn.addEventListener('click', function () { win.toggle(); btn.blur(); });
    var bar = document.getElementById('status');
    bar.insertBefore(btn, document.getElementById('b-help') || document.getElementById('views-wrap'));

    S.on(function (k) {
      if (k === '*' || k === 'hue' || k === 'sat' || k === 'bri') S.paint();
      if (k === '*' || k === 'master' || k === 'sens' || k === 'parts' || k === 'glow' || k === 'still') react();
    });
    S.on(function (k) {
      if (k === '*' || k === 'bot' || k === 'chat') { if (DW.splashUI && DW.splashUI.apply && (k !== 'chat')) DW.splashUI.apply(); }
      if (k === '*' || k === 'pet') { if (DW.pet && DW.pet.apply) DW.pet.apply(); }
      if (k === '*' || k === 'seasonfx') {
        var F = DW.seasonfx, id = DW.season && DW.season.id;
        if (F) { if (S.get('seasonfx') === false) F.stop(); else if (id) F.start(id); }
      }
    });
    S.paint();
    react();
  };
})();
