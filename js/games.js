(function () {
  var DW = window.DW, St = DW.store, G = (DW.games = { list: [] });

  var PAL = { bg: '#760ead', bg2: '#8516bd', grid: '#bb37db', p1: '#d743e6', p2: '#fb5aff', p3: '#f3b5f6', pk: '#6a9ff2', ink: '#75099a', gold: '#ffd34d', white: '#ffffff' };
  G.pal = PAL;
  G.add = function (def) { G.list.push(def); };

  G.bevel = function (c, x, y, w, h, col) {
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
  G.text = function (c, s, x, y, size, col, align) {
    c.font = 'bold ' + size + 'px Tahoma, Verdana, sans-serif';
    c.textAlign = align || 'left';
    c.textBaseline = 'top';
    c.fillStyle = col || '#ffffff';
    c.fillText(s, x, y);
  };

  var KEYS = {
    arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
    ' ': 'drop', x: 'a', z: 'b', enter: 'enter'
  };

  var win, menuEl, modeEl, stageEl, hdTitle, hudL, hudR, wrap, cv, ctx, ovEl, ovT, ovS, ovB, layer, padEl, helpEl, pauseBtn, fsBtn;
  var cur = null, raf = 0, last = 0, running = false, paused = false, ovFn = null, fx = [], shakeT = 0, shakeM = 0;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function rec(key) {
    var g = St.d.g;
    if (!g[key] || typeof g[key] !== 'object') g[key] = { best: 0, plays: 0 };
    return g[key];
  }
  function key(def, mode) { return mode ? def.id + ':' + mode : def.id; }
  function lastMode(def) {
    var m = St.d.g.modes && St.d.g.modes[def.id];
    return def.modes.some(function (x) { return x.id === m; }) ? m : def.modes[0].id;
  }

  function fit() {
    if (!cur) return;
    var d = cur.def, pl = document.getElementById('player');
    var coarse = matchMedia('(pointer: coarse)').matches;
    var below = pl ? pl.offsetHeight + 20 : 0, availW = Math.max(120, win.body.clientWidth - 24);
    win.body.style.paddingBottom = below + 'px';
    var reserve = 22 + 24 + 30 + 24 + 30 + (coarse && d.pad ? 58 : 0) + below;
    var availH = Math.max(120, window.innerHeight - reserve);
    var sc = Math.min(availW / d.w, availH / d.h);
    var cssW = Math.floor(d.w * sc), cssH = Math.floor(d.h * sc);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.width = wrap.style.width = cssW + 'px';
    cv.style.height = wrap.style.height = cssH + 'px';
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(cssH * dpr);
    ctx.setTransform(cv.width / d.w, 0, 0, cv.height / d.h, 0, 0);
    if (cur.game.draw) cur.game.draw(ctx);
  }

  function say(title, sub, btn, fn) {
    ovT.textContent = title || '';
    ovS.textContent = sub || '';
    ovB.textContent = btn || '';
    ovB.hidden = !btn;
    ovFn = fn || null;
    ovEl.hidden = false;
    if (cur && cur.game && cur.game.draw) cur.game.draw(ctx);
  }
  function clearSay() { ovEl.hidden = true; ovFn = null; }

  function stepFx(dt) {
    for (var i = fx.length - 1; i >= 0; i--) {
      var p = fx[i];
      p.life -= dt;
      if (p.life <= 0) { fx.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      ctx.globalAlpha = Math.min(1, p.life / p.max * 1.6);
      ctx.fillStyle = p.col;
      ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (!cur || document.hidden) return;
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    var g = cur.game;
    if (!running && !fx.length) return;
    if (!running && paused) return;
    var d = cur.def;
    ctx.save();
    ctx.clearRect(0, 0, d.w, d.h);
    if (shakeT > 0) {
      shakeT -= dt;
      ctx.translate((Math.random() - 0.5) * shakeM, (Math.random() - 0.5) * shakeM);
    }
    if (running) g.frame(dt, ctx, t);
    else if (g.draw) g.draw(ctx);
    stepFx(dt);
    ctx.restore();
  }

  function setPaused(v) {
    if (!cur || !running && !paused || v === paused) return;
    paused = v;
    running = !v;
    pauseBtn.textContent = v ? 'RESUME' : 'PAUSE';
    if (v) {
      say('PAUSED', 'press P or tap to continue', 'RESUME', function () { setPaused(false); });
      if (cur.game.onpause) cur.game.onpause();
    } else {
      clearSay();
      last = performance.now();
      if (cur.game.onresume) cur.game.onresume();
    }
  }

  function makeEnv(def, mode) {
    var k = key(def, mode);
    return {
      w: def.w, h: def.h, ctx: ctx, layer: layer, pal: PAL, bevel: G.bevel, text: G.text,
      mode: mode, say: say, clear: clearSay, fit: fit,
      hud: function (l, r) { hudL.textContent = l == null ? '' : l; hudR.textContent = r == null ? '' : r; },
      best: function () { return rec(k).best || 0; },
      start: function () { running = true; paused = false; pauseBtn.textContent = 'PAUSE'; pauseBtn.hidden = false; last = performance.now(); },
      end: function () { running = false; pauseBtn.hidden = true; },
      report: function (score, lower) {
        var r = rec(k), had = r.plays > 0 && r.best > 0, nb = lower ? !had || score < r.best : score > (r.best || 0);
        if (nb && score > 0) r.best = score; else nb = false;
        St.save();
        return nb;
      },
      played: function () {
        rec(k).plays++;
        if (k !== def.id) rec(def.id).plays++;
        St.save();
        if (DW.trophy) DW.trophy.mark('arcade', def.id);
      },
      award: function (id) { if (DW.trophy) DW.trophy.award(id); },
      burst: function (x, y, col, n, speed, size) {
        for (var i = 0; i < n && fx.length < 160; i++) {
          var a = Math.random() * 6.283, v = (speed || 80) * (0.35 + Math.random() * 0.65), life = 0.35 + Math.random() * 0.4;
          fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 120, life: life, max: life, col: col, s: size || 2.5 });
        }
      },
      shake: function (m, t) { shakeM = m; shakeT = t || 0.18; },
      menu: function () { G.back(); }
    };
  }

  function action(k, down, rep) { if (cur && running && cur.game.key) cur.game.key(k, down, rep); }

  function onKey(e, down) {
    if (!cur) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = (e.key || '').toLowerCase();
    if (k === 'escape') {
      if (!down) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      G.back();
      return;
    }
    if (k === 'p') {
      if (down && !e.repeat) setPaused(!paused);
      e.preventDefault();
      return;
    }
    var km = cur.def.keymap;
    var a = ((typeof km === 'function' ? km(cur.mode) : km) || KEYS)[k];
    if (!a) {
      if (k === ' ' || k === 'enter' || k.indexOf('arrow') === 0) e.preventDefault();
      return;
    }
    e.preventDefault();
    if (!ovEl.hidden) {
      if (down && !e.repeat && ovFn && (a === 'enter' || a === 'drop')) ovFn();
      return;
    }
    action(a, down, e.repeat);
  }

  function buildPad(def) {
    padEl.textContent = '';
    padEl.hidden = !def.pad;
    if (!def.pad) return;
    def.pad.forEach(function (p) {
      var b = el('button', 'gm-pb', p[1]), tm = 0;
      b.type = 'button';
      b.setAttribute('aria-label', p[0]);
      function stop() { clearInterval(tm); tm = 0; action(p[0], false); }
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (!ovEl.hidden) { if (ovFn) ovFn(); return; }
        action(p[0], true);
        if (p[2]) tm = setInterval(function () { action(p[0], true, true); }, 105);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { b.addEventListener(n, stop); });
      padEl.appendChild(b);
    });
  }

  function bindPointer(def) {
    var sx = 0, sy = 0, down = false, moved = false;
    function pos(e) {
      var r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * def.w, (e.clientY - r.top) / r.height * def.h];
    }
    cv.onpointerdown = function (e) {
      if (!ovEl.hidden || !running) return;
      down = true; moved = false; sx = e.clientX; sy = e.clientY;
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      var p = pos(e);
      if (cur.game.pointer) cur.game.pointer('down', p[0], p[1]);
    };
    cv.onpointermove = function (e) {
      if (!down || !running) return;
      if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 10) moved = true;
      var p = pos(e);
      if (cur.game.pointer) cur.game.pointer('move', p[0], p[1]);
    };
    cv.onpointerup = function (e) {
      if (!down) return;
      down = false;
      if (!running) return;
      var p = pos(e), dx = e.clientX - sx, dy = e.clientY - sy;
      if (cur.game.pointer) cur.game.pointer('up', p[0], p[1]);
      if (def.swipe && Math.max(Math.abs(dx), Math.abs(dy)) > 24) {
        var a = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        action(a, true);
        action(a, false);
      } else if (def.swipe && !moved && cur.game.tap) cur.game.tap();
    };
    cv.onpointercancel = function () { down = false; };
  }

  function closeGame() {
    if (!cur) return;
    cancelAnimationFrame(raf);
    raf = 0;
    try { if (cur.game.stop) cur.game.stop(); } catch (e) { console.error('[dweeb] game stop', e); }
    cur = null;
    running = paused = false;
    fx = [];
    shakeT = 0;
    DW.gaming = false;
    document.body.classList.remove('gaming');
    win.el.classList.remove('full');
    win.body.style.paddingBottom = '';
    layer.textContent = '';
    layer.hidden = true;
    clearSay();
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
  }

  function show(which) {
    menuEl.hidden = which !== 'menu';
    modeEl.hidden = which !== 'modes';
    stageEl.hidden = which !== 'stage';
    if (which !== 'stage') win.titleEl.textContent = 'GAMES';
  }

  G.back = function () {
    if (!cur && !modeEl.hidden) { buildMenu(); show('menu'); return; }
    if (!cur) { win.close(); return; }
    closeGame();
    buildMenu();
    show('menu');
  };

  function byId(id) {
    for (var i = 0; i < G.list.length; i++) if (G.list[i].id === id) return G.list[i];
    return null;
  }

  G.pick = function (id) {
    var def = byId(id);
    if (!def) return;
    if (!def.modes) return G.play(id);
    modeEl.textContent = '';
    modeEl.appendChild(el('h3', null, def.name + ' - CHOOSE A MODE'));
    var grid = el('div', 'gm-menu');
    def.modes.forEach(function (m) {
      var b = el('button', 'gm-card');
      b.type = 'button';
      b.appendChild(el('b', null, m.name));
      b.appendChild(el('span', null, m.desc));
      var r = St.d.g[key(def, m.id)];
      if (r && r.best) b.appendChild(el('i', null, m.low ? 'BEST ' + r.best + 's' : 'BEST ' + r.best));
      b.addEventListener('click', function () { G.play(id, m.id); });
      grid.appendChild(b);
    });
    modeEl.appendChild(grid);
    var back = el('button', 'tab-go', 'BACK');
    back.type = 'button';
    back.addEventListener('click', G.back);
    modeEl.appendChild(back);
    show('modes');
  };

  G.play = function (id, mode) {
    var def = byId(id);
    if (!def) return;
    closeGame();
    if (def.modes) {
      mode = mode || lastMode(def);
      St.d.g.modes = St.d.g.modes || {};
      St.d.g.modes[id] = mode;
    }
    show('stage');
    var mdef = def.modes && def.modes.filter(function (m) { return m.id === mode; })[0];
    win.titleEl.textContent = def.name;
    hdTitle.textContent = def.name + (mdef ? '  -  ' + mdef.name : '');
    helpEl.textContent = def.help || '';
    pauseBtn.hidden = true;
    layer.textContent = '';
    layer.hidden = true;
    clearSay();
    fx = [];
    DW.gaming = true;
    document.body.classList.add('gaming');
    win.el.classList.add('full');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    cur = { def: def, mode: mode, game: null };
    cur.game = def.make(makeEnv(def, mode));
    buildPad(def);
    bindPointer(def);
    fit();
    last = performance.now();
    raf = requestAnimationFrame(loop);
    cur.game.start();
    win.el.firstChild.focus();
  };

  function buildMenu() {
    menuEl.textContent = '';
    G.list.forEach(function (d) {
      var b = el('button', 'gm-card'), r = St.d.g[d.id];
      b.type = 'button';
      b.appendChild(el('b', null, d.name));
      b.appendChild(el('span', null, d.blurb));
      if (r && r.plays) b.appendChild(el('i', null, r.plays + ' PLAYS'));
      b.addEventListener('click', function () { G.pick(d.id); });
      menuEl.appendChild(b);
    });
  }

  G.init = function () {
    win = DW.win('games', 'GAMES');
    menuEl = el('div', 'gm-menu');
    modeEl = el('div', 'gm-modes');
    stageEl = el('div', 'gm-stage');
    modeEl.hidden = stageEl.hidden = true;

    var hd = el('div', 'gm-hd'), back = el('button', 'tab-go', 'BACK'), right = el('div', 'gm-hr');
    back.type = 'button';
    back.addEventListener('click', G.back);
    hdTitle = el('b');
    pauseBtn = el('button', 'tab-go', 'PAUSE');
    pauseBtn.type = 'button';
    pauseBtn.hidden = true;
    pauseBtn.addEventListener('click', function () { setPaused(!paused); pauseBtn.blur(); });
    fsBtn = el('button', 'tab-go', 'FULLSCREEN');
    fsBtn.type = 'button';
    fsBtn.hidden = !document.documentElement.requestFullscreen;
    fsBtn.addEventListener('click', function () {
      var p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(function () {});
      fsBtn.blur();
    });
    right.appendChild(fsBtn);
    right.appendChild(pauseBtn);
    hd.appendChild(back);
    hd.appendChild(hdTitle);
    hd.appendChild(right);

    var hud = el('div', 'gm-hud');
    hudL = el('span');
    hudR = el('span');
    hud.appendChild(hudL);
    hud.appendChild(hudR);

    wrap = el('div', 'gm-cv');
    cv = el('canvas');
    ctx = cv.getContext('2d');
    ovEl = el('div', 'gm-ov');
    ovEl.hidden = true;
    ovT = el('b');
    ovS = el('span');
    ovB = el('button', 'cm-go', '');
    ovB.type = 'button';
    ovB.addEventListener('click', function () { if (ovFn) ovFn(); });
    ovEl.appendChild(ovT);
    ovEl.appendChild(ovS);
    ovEl.appendChild(ovB);
    layer = el('div', 'gm-layer');
    layer.hidden = true;
    wrap.appendChild(cv);
    wrap.appendChild(layer);
    wrap.appendChild(ovEl);

    padEl = el('div', 'gm-pad');
    padEl.hidden = true;
    helpEl = el('div', 'gm-help');
    [hd, hud, wrap, padEl, helpEl].forEach(function (n) { stageEl.appendChild(n); });
    [menuEl, modeEl, stageEl].forEach(function (n) { win.body.appendChild(n); });
    win.body.classList.add('gm-body');

    win.onopen = function () { if (!cur) { buildMenu(); show('menu'); } };
    win.onclose = function () { closeGame(); show('menu'); };

    addEventListener('keydown', function (e) { onKey(e, true); }, true);
    addEventListener('keyup', function (e) { onKey(e, false); }, true);
    addEventListener('resize', fit);
    function away() { if (cur && running && cur.def.autopause !== false) setPaused(true); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) away(); });
    addEventListener('blur', away);

    var btn = el('button', 'tbtn'), ic = new Image();
    btn.id = 'b-games';
    btn.type = 'button';
    btn.title = 'games';
    var gsrc = (DW.icons || {}).games;
    ic.alt = '';
    if (gsrc) { ic.src = gsrc; btn.appendChild(ic); }
    else btn.classList.add('noic');
    var gl = el('span', null, 'GAMES');
    gl.setAttribute('data-s', 'PLAY');
    btn.appendChild(gl);
    btn.addEventListener('click', function () { win.toggle(); btn.blur(); });
    var bar = document.getElementById('status');
    bar.insertBefore(btn, document.getElementById('b-trophy') || document.getElementById('b-help') || document.getElementById('views-wrap'));
  };
})();
