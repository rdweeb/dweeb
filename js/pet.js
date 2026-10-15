(function () {
  var DW = window.DW, St = DW.store, P = (DW.pet = {});
  var NS = 'http://www.w3.org/2000/svg';
  var svg, wrap, img, eyes = [], awake = false, mode = 'idle', px = -1, py = -1, raf = 0, rect = null, rectAt = 0;
  var lastInput = Date.now(), blinkT = 0, lookT = 0, modeT = 0, recent = [], zz;
  var CX = [6, 18];

  function cfg() {
    var c = DW.eyesPet || {};
    return { after: c.after >= 1 ? c.after : 15, chance: c.chance >= 0 && c.chance <= 1 ? c.chance : 0.04 };
  }
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  function T() { return DW.trophy; }

  function build() {
    svg = mk('svg', { viewBox: '0 0 24 12', id: 'pet', 'shape-rendering': 'crispEdges' });
    CX.forEach(function (cx) {
      var g = mk('g', {}, svg);
      var frame = mk('rect', { x: cx - 5, y: 2, width: 10, height: 8, fill: '#12042b' }, g);
      var white = mk('rect', { x: cx - 4, y: 3, width: 8, height: 6, fill: '#fff' }, g);
      var pupil = mk('rect', { x: cx - 1.5, y: 4, width: 3, height: 4, fill: '#7a35ff' }, g);
      var shine = mk('rect', { x: cx - 1.5, y: 4, width: 1, height: 1, fill: '#fff' }, g);
      var lid = mk('rect', { x: cx - 4, y: 3, width: 8, height: 0, fill: '#3b1783' }, g);
      var happy = mk('path', { d: 'M' + (cx - 3) + ' 8L' + cx + ' 4L' + (cx + 3) + ' 8', fill: 'none', stroke: '#fff', 'stroke-width': 1.4, visibility: 'hidden' }, g);
      var cross = mk('path', { d: 'M' + (cx - 2) + ' 4L' + (cx + 2) + ' 8M' + (cx + 2) + ' 4L' + (cx - 2) + ' 8', fill: 'none', stroke: '#ff6bd6', 'stroke-width': 1.2, visibility: 'hidden' }, g);
      eyes.push({ cx: cx, white: white, pupil: pupil, shine: shine, lid: lid, happy: happy, cross: cross, frame: frame });
    });
    zz = mk('text', { x: 20, y: 2, 'font-size': 5, fill: '#fff', visibility: 'hidden' }, svg);
    zz.textContent = 'z';
    svg.addEventListener('pointerdown', function () {});
  }

  function look(dx, dy) {
    eyes.forEach(function (e) {
      var x = e.cx - 1.5 + dx, y = 4 + dy;
      e.pupil.setAttribute('x', x);
      e.pupil.setAttribute('y', y);
      e.shine.setAttribute('x', x);
      e.shine.setAttribute('y', y);
    });
  }
  function lids(h) { eyes.forEach(function (e) { e.lid.setAttribute('height', h); }); }
  function face(m) {
    eyes.forEach(function (e) {
      var happy = m === 'happy', dizzy = m === 'dizzy';
      e.happy.setAttribute('visibility', happy ? 'visible' : 'hidden');
      e.cross.setAttribute('visibility', dizzy ? 'visible' : 'hidden');
      var vis = happy || dizzy ? 'hidden' : 'visible';
      e.white.setAttribute('visibility', vis);
      e.pupil.setAttribute('visibility', vis);
      e.shine.setAttribute('visibility', vis);
      e.lid.setAttribute('visibility', vis);
    });
    zz.setAttribute('visibility', m === 'sleep' ? 'visible' : 'hidden');
  }
  function surprised(on) {
    eyes.forEach(function (e) {
      e.pupil.setAttribute('width', on ? 2 : 3);
      e.pupil.setAttribute('height', on ? 3 : 4);
    });
  }

  function setMode(m, ms, next) {
    clearTimeout(modeT);
    mode = m;
    face(m);
    lids(m === 'sleep' ? 5 : 0);
    surprised(m === 'wake');
    if (m === 'sleep') look(0, 1.2);
    if (m === 'idle') aim();
    if (ms) modeT = setTimeout(function () { setMode(next || 'idle'); }, ms);
  }

  function off() { return !!(DW.set && DW.set.get('pet') === false); }
  function aim() {
    if (off() || !awake || mode === 'sleep' || mode === 'happy' || mode === 'dizzy') return;
    var now = performance.now();
    if (!rect || now - rectAt > 400) { rect = svg.getBoundingClientRect(); rectAt = now; }
    if (px < 0) return;
    var mx = rect.left + rect.width / 2, my = rect.top + rect.height / 2;
    var dx = px - mx, dy = py - my, dist = Math.hypot(dx, dy) || 1, k = Math.min(1, dist / 160);
    look(dx / dist * 1.7 * k, dy / dist * 1.1 * k);
  }

  function schedAim() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; aim(); });
  }

  function nap() {
    clearTimeout(P.sleepT);
    P.sleepT = setTimeout(function () {
      if (awake && mode === 'idle') setMode('sleep');
      nap();
    }, 28000);
  }

  function activity() {
    lastInput = Date.now();
    if (!awake) return;
    if (mode === 'sleep') setMode('wake', 700, 'idle');
    clearTimeout(P.sleepT);
    nap();
  }

  function blink() {
    clearTimeout(blinkT);
    blinkT = setTimeout(function () {
      if (awake && mode === 'idle') {
        lids(6);
        setTimeout(function () { if (mode === 'idle') lids(0); }, 120);
      }
      blink();
    }, 2200 + Math.random() * 3800);
  }
  function wander() {
    clearTimeout(lookT);
    lookT = setTimeout(function () {
      if (awake && mode === 'idle' && Date.now() - lastInput > 4000) look((Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 2);
      wander();
    }, 2500 + Math.random() * 3000);
  }

  function heart() {
    var r = svg.getBoundingClientRect(), h = document.createElement('div');
    h.className = 'hearts';
    h.textContent = '<3';
    h.style.left = r.left + r.width / 2 - 8 + (Math.random() * 16 - 8) + 'px';
    h.style.top = r.bottom + 'px';
    document.body.appendChild(h);
    setTimeout(function () { h.remove(); }, 1200);
  }

  function petIt() {
    if (mode === 'dizzy') return;
    var now = Date.now();
    recent = recent.filter(function (t) { return now - t < 2000; });
    recent.push(now);
    if (recent.length >= 6) { recent = []; setMode('dizzy', 1600, 'idle'); return; }
    if (mode === 'sleep') { setMode('wake', 700, 'idle'); return; }
    setMode('happy', 1100, 'idle');
    heart();
  }

  function wake() {
    if (off()) return;
    awake = true;
    St.d.pet = 1;
    St.save();
    img.hidden = true;
    wrap.classList.add('pet');
    if (!svg.parentNode) wrap.insertBefore(svg, wrap.firstChild);
    svg.style.display = 'block';
    setMode('wake', 1200, 'idle');
    blink();
    wander();
    nap();
    px = innerWidth / 2; py = innerHeight / 2;
  }

  P.state = function () { return mode; };

  P.init = function () {
    wrap = document.getElementById('views-wrap');
    img = document.getElementById('eyes');
    if (!wrap || !img) return;
    build();
    svg.style.display = 'none';
    wrap.insertBefore(svg, img);

    addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; if (awake) { schedAim(); if (Date.now() - lastInput > 2000 || mode === 'sleep') activity(); lastInput = Date.now(); } }, { passive: true });
    addEventListener('pointerdown', function (e) { px = e.clientX; py = e.clientY; activity(); schedAim(); }, true);
    addEventListener('keydown', activity, true);
    addEventListener('resize', function () { rect = null; });

    wrap.addEventListener('click', function () {
      if (off()) return;
      if (awake) { petIt(); return; }
      var c = St.d.c, k = cfg();
      c.eyeClicks = (+c.eyeClicks || 0) + 1;
      St.save();
      img.classList.remove('poked');
      void img.offsetWidth;
      img.classList.add('poked');
      if (c.eyeClicks >= k.after && T()) T().award('poke');
      if (c.eyeClicks > k.after && Math.random() < k.chance) {
        wake();
        if (T()) T().award('alive');
        DW.toast('...the eyes are looking at you');
      }
    });

    function missing() {
      if (awake) return;
      img.hidden = true;
      wrap.classList.add('pet');
      svg.style.display = 'block';
      setMode('idle');
    }
    img.addEventListener('error', missing);
    if (img.complete && !img.naturalWidth) missing();

    P.apply = function () {
      if (off()) {
        awake = false;
        clearTimeout(blinkT); clearTimeout(lookT); clearTimeout(modeT); clearTimeout(P.sleepT);
        if (img.naturalWidth || !img.complete) { svg.style.display = 'none'; wrap.classList.remove('pet'); img.hidden = false; }
        else setMode('idle');
      } else if (St.d.pet) wake();
    };
    if (St.d.pet) wake();
    if (off()) P.apply();
  };
})();
