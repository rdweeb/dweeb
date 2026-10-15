(function () {
  var DW = window.DW, A = (DW.audio = {});
  var el = new Audio(), ctx, src, an, gain;
  var vol = 0.8, muted = false, idx = 0, loopOne = false, shuf = false, past = [], errs = 0, want = false, subs = {};
  var blobs = {}, tried = {}, busy = {};

  A.el = el;
  A.playing = false;
  A.analyser = null;
  A.userPaused = false;
  el.preload = 'auto';

  try {
    var sv = parseFloat(localStorage.getItem('dw-vol'));
    if (sv >= 0 && sv <= 1) vol = sv;
    shuf = localStorage.getItem('dw-shuf') === '1';
  } catch (e) {}
  el.volume = vol;

  A.on = function (n, f) { (subs[n] = subs[n] || []).push(f); };
  function emit(n, a) { (subs[n] || []).forEach(function (f) { f(a); }); }

  A.cover = function (t) { return 'covers/' + t.file.replace(/\.[^.]+$/, '') + '.png'; };
  A.index = function () { return idx; };
  A.current = function () { return DW.tracks[idx]; };
  A.loop = function (v) { if (v !== undefined) loopOne = !!v; return loopOne; };
  A.shuffle = function (v) {
    if (v !== undefined) {
      shuf = !!v;
      past = [];
      try { localStorage.setItem('dw-shuf', shuf ? '1' : '0'); } catch (e) {}
      emit('shuffle');
    }
    return shuf;
  };

  function apply() {
    var v = muted ? 0 : vol;
    if (gain) gain.gain.value = v; else el.volume = v;
  }
  A.volume = function (v) {
    if (v === undefined) return vol;
    vol = Math.max(0, Math.min(1, v));
    apply();
    try { localStorage.setItem('dw-vol', vol); } catch (e) {}
    emit('vol');
  };
  A.mute = function (v) {
    if (v === undefined) return muted;
    muted = !!v;
    apply();
    emit('vol');
    return muted;
  };

  function mk() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }

  function connect() {
    if (src || !ctx) return;
    src = ctx.createMediaElementSource(el);
    an = ctx.createAnalyser();
    an.fftSize = DW.low ? 512 : 1024;
    an.smoothingTimeConstant = 0.35;
    gain = ctx.createGain();
    gain.gain.value = muted ? 0 : vol;
    el.volume = 1;
    src.connect(an); an.connect(gain); gain.connect(ctx.destination);
    A.analyser = an;
  }

  function wire() {
    mk();
    if (!ctx) return Promise.resolve();
    var wait = new Promise(function (r) { setTimeout(r, 350); });
    return Promise.race([ctx.resume().catch(function () {}), wait]).then(function () {
      if (ctx.state === 'running') {
        try { connect(); } catch (e) { console.warn('no analyser', e); }
      }
    });
  }
  A.wire = wire;
  A.state = function () { return ctx ? ctx.state : 'none'; };

  A.play = function () {
    A.userPaused = false;
    want = true;
    return wire().then(function () { return el.play(); }).catch(function (e) {
      var n = e && e.name;
      if (n === 'NotAllowedError') emit('blocked', e);
      else if (n === 'NotSupportedError') broke();
      else if (n !== 'AbortError') console.warn('[dweeb] play failed', e);
    });
  };
  A.pause = function () { A.userPaused = true; want = false; el.pause(); };
  A.toggle = function () { if (el.paused) A.play(); else A.pause(); };

  A.unlock = function () {
    wire();
    if (!el.paused) return;
    var m = el.muted;
    el.muted = true;
    var p = el.play();
    if (p && p.then) p.then(function () {
      if (!want) { el.pause(); el.currentTime = 0; }
      el.muted = m;
    }).catch(function () { el.muted = m; });
    else el.muted = m;
  };

  A.saved = function () {
    try {
      var f = localStorage.getItem('dw-track');
      for (var i = 0; i < DW.tracks.length; i++) if (DW.tracks[i].file === f) return i;
    } catch (e) {}
    return 0;
  };

  A.load = function (i, go) {
    var n = DW.tracks.length;
    if (!n) return;
    idx = ((i % n) + n) % n;
    var t = DW.tracks[idx];
    try { localStorage.setItem('dw-track', t.file); } catch (e) {}
    el.src = blobs[t.file] || 'audio/' + t.file;
    emit('track', t);
    media(t);
    if (go) A.play();
  };

  function pick() {
    var n = DW.tracks.length, j;
    if (n < 2) return idx;
    do { j = Math.floor(Math.random() * n); } while (j === idx);
    return j;
  }
  A.next = function () {
    if (shuf) { past.push(idx); if (past.length > 50) past.shift(); A.load(pick(), true); }
    else A.load(idx + 1, true);
  };
  A.prev = function () {
    if (el.currentTime > 3) el.currentTime = 0;
    else if (shuf && past.length) A.load(past.pop(), true);
    else A.load(idx - 1, true);
  };
  A.seek = function (f) {
    if (isFinite(el.duration)) el.currentTime = Math.max(0, Math.min(1, f)) * el.duration;
  };
  A.skip = function (sec) {
    if (isFinite(el.duration)) el.currentTime = Math.max(0, Math.min(el.duration, el.currentTime + sec));
  };

  el.addEventListener('play', function () { A.playing = true; emit('state'); });
  el.addEventListener('pause', function () { A.playing = false; emit('state'); });
  el.addEventListener('playing', function () { errs = 0; });
  el.addEventListener('timeupdate', function () { emit('time'); });
  el.addEventListener('loadedmetadata', function () { emit('time'); });
  el.addEventListener('ended', function () {
    if (loopOne) { el.currentTime = 0; el.play(); }
    else A.next();
  });
  el.addEventListener('error', function () { broke(); });

  function sniff(b) {
    var s = String.fromCharCode.apply(null, [].slice.call(b, 0, 12));
    if (s.slice(0, 3) === 'ID3' || (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0)) return 'mp3';
    if (s.slice(4, 8) === 'ftyp') return 'm4a';
    if (s.slice(0, 4) === 'RIFF') return 'wav';
    if (s.slice(0, 4) === 'fLaC') return 'flac';
    if (s.slice(0, 4) === 'OggS') return 'ogg';
    if (/^\s*</.test(s)) return 'html';
    return 'unknown';
  }

  function why(t) {
    var f = t.file;
    if (t.http) return f + ' not found in audio/ (HTTP ' + t.http + '), check the name';
    if (t.kind === 'html') return 'audio/' + f + ' gives back a web page, not music. wrong name or folder?';
    if (t.kind && t.kind !== 'mp3') return f + ' is really a ' + t.kind.toUpperCase() + ' file renamed to .mp3. re-export it as a real mp3';
    return "this browser can't play " + f + '. re-export it as a normal mp3';
  }

  function fail(t, msg) {
    if (t.deadAt && Date.now() - t.deadAt < 2000) return;
    t.deadAt = Date.now();
    errs++;
    console.error('[dweeb] ' + msg);
    emit('error', msg);
    if (DW.tracks.length > 1 && errs < DW.tracks.length) {
      setTimeout(function () { A.load(idx + 1, want); }, 700);
    }
  }

  function broke() {
    var t = A.current();
    if (!t || busy[t.file]) return;
    if (tried[t.file]) return fail(t, why(t));
    tried[t.file] = busy[t.file] = 1;
    var mine = idx;
    fetch('audio/' + t.file)
      .then(function (r) {
        if (!r.ok) { t.http = r.status; throw 0; }
        return r.arrayBuffer();
      })
      .then(function (ab) {
        t.kind = sniff(new Uint8Array(ab, 0, Math.min(12, ab.byteLength)));

        blobs[t.file] = URL.createObjectURL(new Blob([ab]));
        busy[t.file] = 0;
        if (idx !== mine) return;
        el.src = blobs[t.file];
        if (want) A.play();
      })
      .catch(function () { busy[t.file] = 0; if (idx === mine) fail(t, why(t)); });
  }

  function media(t) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title,
        artist: t.artist || DW.defaultArtist || '',
        album: t.album || '',
        artwork: [{ src: A.cover(t), sizes: '512x512', type: 'image/png' }]
      });
    } catch (e) {}
  }
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', A.play);
      navigator.mediaSession.setActionHandler('pause', A.pause);
      navigator.mediaSession.setActionHandler('previoustrack', A.prev);
      navigator.mediaSession.setActionHandler('nexttrack', A.next);
    } catch (e) {}
  }

  A.arm = function () {
    var evs = ['pointerdown', 'keydown', 'touchend'];
    function go() {
      evs.forEach(function (e) { removeEventListener(e, go, true); });
      if (A.userPaused) return;
      if (A.playing) wire(); else A.play();
    }
    evs.forEach(function (e) { addEventListener(e, go, true); });
  };
})();

