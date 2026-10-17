(function () {
  var DW = window.DW, A = DW.audio;

  var D = {
    master: 1, sensitivity: 1,
    bands: { bass: [35, 140], mid: [140, 2200], high: [2500, 9000] },
    icon:    { scale: 0.10, rot: 2.6, shift: 4,   breathe: 0.02,  sway: 1,   kick: 1,   hat: 0 },
    cats:    { scale: 0.06, rot: 1.8, shift: 3,   breathe: 0.012, sway: 1,   kick: 1,   hat: 0.2, ripple: 70 },
    catname: { scale: 0.05, rot: 0,   shift: 1.5, breathe: 0,     sway: 0.5, kick: 1,   hat: 0 },
    sub:     { scale: 0.08, rot: 3.2, shift: 3,   breathe: 0.015, sway: 1,   kick: 0.6, hat: 1 },
    subs:    { scale: 0.06, rot: 2.4, shift: 2.5, breathe: 0.01,  sway: 1,   kick: 0.7, hat: 0.8, ripple: 55 },
    names:   { scale: 0.04, rot: 0,   shift: 3,   breathe: 0.01,  sway: 0.6, kick: 0.8, hat: 0.6, ripple: 55 },
    top:     { scale: 0.04, rot: 0,   shift: 1.5, breathe: 0,     sway: 0.5, kick: 0.8, hat: 0.4, ripple: 80 },
    cover:   { scale: 0.08, rot: 2,   shift: 0,   breathe: 0.01,  sway: 0.6, kick: 1,   hat: 0 },
    play:    { scale: 0.10, rot: 0,   shift: 0,   breathe: 0,     sway: 0,   kick: 1,   hat: 0 },
    pbtn:    { scale: 0.08, rot: 0,   shift: 0,   breathe: 0,     sway: 0,   kick: 0,   hat: 1,   ripple: 60 },
    splash:  { scale: 0.03, rot: 0,   shift: 1.5, breathe: 0.01,  sway: 0.6, kick: 0.8, hat: 0.3 },
    speed: { tempo: 1.2, energy: 2 },
    wave: { speed: 3, surge: 5, amp: [0.30, 0.22, 0.16], idle: 1 },
    glow: { base: 0.45, pulse: 0.4 },
    particles: 1,
    fps: 0
  };
  function merge(a, b) {
    for (var k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) a[k] = merge(a[k] || {}, b[k]);
      else a[k] = b[k];
    }
    return a;
  }
  var R = (DW.react = merge(merge(D, DW.react || {}), DW.tuning || {}));

  var V = (DW.vis = {});
  V.frames = 0;
  V.lite = false;
  V.fps = 60;
  var S = (V.state = { pulse: 0, snap: 0, level: 0, bass: 0, mid: 0, high: 0, beats: 0, interval: 500, speed: 0 });

  var groups = {}, meter = [], waves = [], glow = null, root = null;
  var data = null, an = null, rng = null, hist = [];
  var avg = 0, prev = 0, fluxAvg = 0, hAvg = 0, hPrev = 0, lastBeat = 0, lastSnap = 0;
  var peak = 0, snapPk = 0, surge = 0, dir = 1, vx = 0, vy = 0, phase = 0;
  var last = 0, lastStep = 0, wasOn = false, lastWire = 0;
  var wx = [0, 0, 0], wh = [1, 1, 1], WBASE = [0.0021, -0.0013, 0.0009];

  V.bind = function (name, els, dist) {
    els = els ? [].concat(els) : [];
    var old = groups[name];
    if (old) old.els.forEach(function (e) { if (els.indexOf(e) < 0) { e.style.transform = ''; e.__s = ''; } });
    groups[name] = { els: els, d: dist || [] };
  };
  V.meter = function (l) { meter = l; };
  V.waves = function (l) { waves = l; };
  V.glow = function (e) { glow = e; };
  V.root = function (e) { root = e; };

  function setup() {
    an = A.analyser;
    data = new Uint8Array(an.frequencyBinCount);
    var hz = an.context.sampleRate / an.fftSize;
    function r(b) { return [Math.max(1, Math.round(b[0] / hz)), Math.max(2, Math.round(b[1] / hz))]; }
    rng = { b: r(R.bands.bass), m: r(R.bands.mid), h: r(R.bands.high) };
  }

  function band(x) {
    var s = 0, n = 0;
    for (var i = x[0]; i <= x[1] && i < data.length; i++) { s += data[i]; n++; }
    return n ? s / n / 255 : 0;
  }

  function at(now, ms) {
    var t = now - ms;
    for (var i = hist.length - 1; i >= 0; i--) if (hist[i].t <= t) return hist[i];
    return hist[0];
  }

  function put(name, cur, lv, lvs, now) {
    var g = groups[name], k = R[name];
    if (!g || !k) return;
    for (var i = 0; i < g.els.length; i++) {
      var d = g.d[i] || 0, h = d && k.ripple && hist.length ? at(now, d * k.ripple) : cur;
      var a = h.p * (k.kick == null ? 1 : k.kick) + h.s * (k.hat || 0);
      var sg = (i & 1) ? -1 : 1;
      var w = Math.sin(phase + i * 0.9) * lvs, c = Math.cos(phase * 0.8 + i * 1.3) * lvs;
      var s = 1 + a * k.scale + lv * k.breathe;
      var x = vx * a * k.shift + c * k.sway * k.shift * 0.5;
      var y = vy * a * k.shift + w * k.sway * k.shift * 0.5;
      var r = dir * sg * a * k.rot + w * k.sway * k.rot * 0.4;
      var str = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' + r.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')', el = g.els[i];
      if (el.__s !== str) { el.__s = str; el.style.transform = str; }
    }
  }

  function drawWaves(dt, M) {
    var W = R.wave, sp = S.speed * W.speed + surge * W.surge;
    var bands = [S.bass, S.mid, S.high];
    for (var i = 0; i < waves.length; i++) {
      wx[i] += dt * WBASE[i] * (W.idle + sp * M);
      var tgt = 1 + (bands[i] * 1.4 + S.pulse * (i === 0 ? 0.6 : 0.2)) * W.amp[i] * M;
      wh[i] += (tgt - wh[i]) * 0.35;
      var x = ((wx[i] % 50) + 50) % 50;
      var ws = 'translate3d(' + (-x).toFixed(3) + '%,0,0) scaleY(' + wh[i].toFixed(3) + ')';
      if (waves[i].__s !== ws) { waves[i].__s = ws; waves[i].style.transform = ws; }
    }
  }

  function drawMeter() {
    if (!meter.length) return;
    var v = [S.bass, S.mid, S.high];
    for (var i = 0; i < 3; i++) {
      var ms = 'scaleY(' + (0.18 + Math.min(1, v[i] * 1.3) * 0.82).toFixed(2) + ')';
      if (meter[i].__s !== ms) { meter[i].__s = ms; meter[i].style.transform = ms; }
    }
  }

  var act = 0, rawLast = 0, ema = 16, calm = 0;
  function touch() { act = performance.now(); }
  ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'].forEach(function (e) {
    addEventListener(e, touch, { passive: true, capture: true });
  });

  V.div = function () {
    var d = 1;
    if (V.lite) d = 2;
    if (DW.gaming) d = Math.max(d, 3);
    if (!document.hasFocus()) d = Math.max(d, 2);
    if (!A.playing && performance.now() - act > 30000) d = Math.max(d, 4);
    return d;
  };

  function watch(t) {
    var d = t - rawLast;
    rawLast = t;
    if (d <= 0 || d > 500) return;
    ema += (d - ema) * 0.03;
    V.fps = Math.round(1000 / ema);
    if (!V.lite && ema > 30 && V.frames > 180) { V.lite = true; calm = 0; document.documentElement.classList.add('lite'); }
    else if (V.lite) {
      if (ema < 19) calm++; else calm = 0;
      if (calm > 900) { V.lite = false; calm = 0; document.documentElement.classList.remove('lite'); }
    }
  }

  function tick(t) {
    requestAnimationFrame(tick);
    if (DW.gaming) return;
    V.frames++;
    watch(t);
    var gap = 1000 / (R.fps || (DW.low ? 30 : 45)) * V.div();
    if (t - lastStep < gap - 5) return;
    lastStep = t;
    try { step(t); }
    catch (e) { if (!V.err) { V.err = e.message; console.error('[dweeb] beat engine error:', e); } }
  }

  function step(t) {
    var dt = Math.min(64, t - last);
    last = t;

    if (A.playing && !A.analyser && t - lastWire > 1000) {
      lastWire = t;
      if (A.state() === 'running') A.wire();
    }

    if (A.analyser && A.playing) {
      if (an !== A.analyser) setup();
      an.getByteFrequencyData(data);
      var b = band(rng.b), m = band(rng.m), h = band(rng.h);
      S.bass = b; S.mid = m; S.high = h;

      var sens = R.sensitivity || 1, flux = Math.max(0, b - prev);
      var hit = (b > avg * (1 + 0.22 / sens) + 0.02 && flux > 0.012) || flux > Math.max(0.06 / sens, fluxAvg * 2.2);
      if (b > 0.15 && hit && t - lastBeat > 190) {
        var gap = t - lastBeat;
        lastBeat = t;
        if (gap < 1400) S.interval += (gap - S.interval) * 0.35;
        peak = Math.min(1, 0.55 + Math.max(b - avg, flux) * 2.5);
        surge = Math.min(1, surge + 0.6);
        dir = -dir;
        S.beats++;
        var a = S.beats * 2.4;
        vx = Math.cos(a); vy = Math.sin(a) * 0.7;
      }

      if (h > 0.1 && h > hAvg * 1.4 + 0.03 && h - hPrev > 0.02 && t - lastSnap > 100) {
        lastSnap = t;
        snapPk = Math.min(0.5, 0.25 + (h - hAvg));
      }

      avg += (b - avg) * Math.min(1, dt / Math.max(220, Math.min(900, S.interval * 0.8)));
      fluxAvg += (flux - fluxAvg) * Math.min(1, dt / 400);
      hAvg += (h - hAvg) * Math.min(1, dt / 700);
      prev = b; hPrev = h;
      S.level += ((b + m + h) / 3 - S.level) * 0.15;
      if (t - lastBeat > 2500) S.interval += (900 - S.interval) * Math.min(1, dt / 2000);
    } else {
      S.bass *= 0.9; S.mid *= 0.9; S.high *= 0.9; S.level *= 0.92;
    }

    var tau = Math.max(110, Math.min(520, S.interval * 0.45));
    peak *= Math.exp(-dt / tau);
    snapPk *= Math.exp(-dt / 130);
    surge *= Math.exp(-dt / 450);
    if (peak > S.pulse) S.pulse += (peak - S.pulse) * (1 - Math.exp(-dt / 28));
    else S.pulse = peak;
    S.snap = snapPk;

    var tempo = A.playing ? Math.max(0, Math.min(1.5, (60000 / S.interval - 60) / 100)) : 0;
    S.speed += (tempo * R.speed.tempo + S.level * R.speed.energy - S.speed) * Math.min(1, dt / 600);

    var M = R.master;
    var p = S.pulse * M, sn = S.snap * M, lv = S.level * M, lvs = Math.min(1, S.level * 3) * M;

    drawWaves(dt, M);
    if (glow) {
      var go = (R.glow.base + p * R.glow.pulse + lv * 0.15).toFixed(3);
      if (glow.__s !== go) { glow.__s = go; glow.style.opacity = go; }
    }

    var on = p + sn + lv > 0.002;
    if (!on && !wasOn) { drawMeter(); return; }
    wasOn = on;

    phase = (phase + dt * (0.0016 + S.speed * 0.0045)) % 31.41592653589793;
    var cur = { t: t, p: p, s: sn };
    hist.push(cur);
    if (hist.length > 48) hist.shift();
    for (var n in groups) put(n, cur, lv, lvs, t);
    if (root) {
      var ps = p.toFixed(3);
      if (root.__s !== ps) { root.__s = ps; root.style.setProperty('--p', ps); }
    }
    drawMeter();
  }

  V.start = function () {
    if (DW.reduce) { R.master = 0; R.wave.idle = 0; }
    requestAnimationFrame(tick);
  };
})();

