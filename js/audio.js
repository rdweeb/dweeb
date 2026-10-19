(function(){
var DW = window.DW;
var A = {};
DW.audio = A;

var el = new Audio();
var ctx = null;
var src = null;
var an = null;
var gain = null;
var vol = 0.8;
var muted = false;
var idx = 0;
var loopOne = false;
var shuf = false;
var past = [];
var errs = 0;
var want = false;
var subs = {};
var blobs = {};
var tried = {};
var busy = {};

A.el = el;
A.playing = false;
A.analyser = null;
A.userPaused = false;
el.preload = "auto";

// get saved stuff
try {
  var sv = parseFloat(localStorage.getItem('dw-vol'));
  if (sv >= 0 && sv <= 1) { vol = sv; }
  if (localStorage.getItem('dw-shuf') == '1') { shuf = true; } else { shuf = false; }
} catch(e) {}
el.volume = vol;

function getTracks(){
  if (DW.tracks) { return DW.tracks; }
  return [];
}

A.on = function(name, f){
  if (!subs[name]) { subs[name] = []; }
  subs[name].push(f);
};

function fire(name, a){
  if (!subs[name]) { return; }
  for (var i = 0; i < subs[name].length; i++) {
    subs[name][i](a);
  }
}

A.cover = function(t){
  var n = t.file.replace(/\.[^.]+$/, '');
  return 'covers/' + n + '.png';
};
A.index = function(){ return idx; };
A.current = function(){ return getTracks()[idx]; };

A.loop = function(v){
  if (v !== undefined) { loopOne = v ? true : false; }
  return loopOne;
};

A.shuffle = function(v){
  if (v !== undefined) {
    shuf = v ? true : false;
    past = [];
    try {
      if (shuf == true) { localStorage.setItem('dw-shuf', '1'); }
      else { localStorage.setItem('dw-shuf', '0'); }
    } catch(e) {}
    fire('shuffle');
  }
  return shuf;
};

function setLevel(){
  var v = vol;
  if (muted == true) { v = 0; }
  if (gain) { gain.gain.value = v; }
  else { el.volume = v; }
}

A.volume = function(v){
  if (v === undefined) { return vol; }
  v = Number(v);
  if (isNaN(v)) { return vol; }
  if (v < 0) { v = 0; }
  if (v > 1) { v = 1; }
  vol = v;
  setLevel();
  try { localStorage.setItem('dw-vol', vol); } catch(e) {}
  fire('vol');
};

A.mute = function(v){
  if (v === undefined) { return muted; }
  muted = v ? true : false;
  setLevel();
  fire('vol');
  return muted;
};

function connect(){
  if (src || !ctx) { return; }
  src = ctx.createMediaElementSource(el);
  an = ctx.createAnalyser();
  if (DW.low) { an.fftSize = 512; } else { an.fftSize = 1024; }
  an.smoothingTimeConstant = 0.35;
  gain = ctx.createGain();
  if (muted) { gain.gain.value = 0; } else { gain.gain.value = vol; }
  el.volume = 1;
  src.connect(an);
  an.connect(gain);
  gain.connect(ctx.destination);
  A.analyser = an;
}

function wire(){
  var AC = window.AudioContext || window.webkitAudioContext;
  if (ctx == null && AC) { ctx = new AC(); }
  if (ctx == null) { return Promise.resolve(); }

  var wait = new Promise(function(r){ setTimeout(r, 350); });
  var resumed = ctx.resume().catch(function(){});
  return Promise.race([resumed, wait]).then(function(){
    if (ctx.state == 'running') {
      try { connect(); }
      catch(e) { console.warn('no analyser', e); }
    }
  });
}
A.wire = wire;

A.state = function(){
  if (ctx) { return ctx.state; }
  return 'none';
};

A.play = function(){
  A.userPaused = false;
  want = true;
  return wire().then(function(){
    return el.play();
  }).catch(function(e){
    var name = e && e.name;
    if (name == 'NotAllowedError') { fire('blocked', e); }
    else if (name == 'NotSupportedError') { broke(); }
    else if (name != 'AbortError') { console.warn('[dweeb] play failed', e); }
  });
};

A.pause = function(){
  A.userPaused = true;
  want = false;
  el.pause();
};

A.toggle = function(){
  if (el.paused) { A.play(); }
  else { A.pause(); }
};

A.unlock = function(){
  wire();
  if (!el.paused) { return; }
  var was = el.muted;
  el.muted = true;
  var p = el.play();
  if (p && p.then) {
    p.then(function(){
      if (!want) {
        el.pause();
        el.currentTime = 0;
      }
      el.muted = was;
    }).catch(function(){
      el.muted = was;
    });
  } else {
    el.muted = was;
  }
};

A.saved = function(){
  try {
    var f = localStorage.getItem('dw-track');
    var t = getTracks();
    for (var i = 0; i < t.length; i++) {
      if (t[i].file == f) { return i; }
    }
  } catch(e) {}
  return 0;
};

A.load = function(i, go){
  var n = getTracks().length;
  if (n == 0) { return; }
  idx = ((i % n) + n) % n;
  var t = getTracks()[idx];
  try { localStorage.setItem('dw-track', t.file); } catch(e) {}
  if (blobs[t.file]) { el.src = blobs[t.file]; }
  else { el.src = 'audio/' + t.file; }
  fire('track', t);
  media(t);
  if (go) { A.play(); }
};

A.next = function(){
  var n = getTracks().length;
  if (shuf && n > 1) {
    var r = idx;
    while (r == idx) {
      r = Math.floor(Math.random() * n);
    }
    past.push(idx);
    if (past.length > 50) { past.shift(); }
    A.load(r, true);
  } else {
    A.load(idx + 1, true);
  }
};

A.prev = function(){
  if (el.currentTime > 3) {
    el.currentTime = 0;
  } else if (shuf && past.length) {
    A.load(past.pop(), true);
  } else {
    A.load(idx - 1, true);
  }
};

A.seek = function(f){
  if (isFinite(el.duration)) {
    if (f < 0) { f = 0; }
    if (f > 1) { f = 1; }
    el.currentTime = f * el.duration;
  }
};

A.skip = function(sec){
  if (isFinite(el.duration)) {
    var t = el.currentTime + sec;
    if (t < 0) { t = 0; }
    if (t > el.duration) { t = el.duration; }
    el.currentTime = t;
  }
};

el.addEventListener('play', function(){
  A.playing = true;
  if (ctx && ctx.state == 'suspended') { ctx.resume().catch(function(){}); }
  fire('state');
});
el.addEventListener('pause', function(){
  A.playing = false;
  fire('state');
});
el.addEventListener('playing', function(){ errs = 0; });
el.addEventListener('timeupdate', function(){ fire('time'); });
el.addEventListener('loadedmetadata', function(){ fire('time'); });
el.addEventListener('ended', function(){
  if (loopOne) {
    el.currentTime = 0;
    var p = el.play();
    if (p && p.catch) { p.catch(function(){}); }
  } else {
    A.next();
  }
});
el.addEventListener('error', function(){ broke(); });

// check what kind of file it is
function sniff(b){
  var s = '';
  for (var i = 0; i < 12 && i < b.length; i++) {
    s = s + String.fromCharCode(b[i]);
  }
  if (s.slice(0, 3) == 'ID3') { return 'mp3'; }
  if (b[0] == 0xFF && (b[1] & 0xE0) == 0xE0) { return 'mp3'; }
  if (s.slice(4, 8) == 'ftyp') { return 'm4a'; }
  if (s.slice(0, 4) == 'RIFF') { return 'wav'; }
  if (s.slice(0, 4) == 'fLaC') { return 'flac'; }
  if (s.slice(0, 4) == 'OggS') { return 'ogg'; }
  if (s.trim().charAt(0) == '<') { return 'html'; }
  return 'unknown';
}

function why(t){
  var f = t.file;
  if (t.http) { return f + ' not found in audio/ (HTTP ' + t.http + '), check the name'; }
  if (t.kind == 'html') { return 'audio/' + f + ' gives back a web page, not music. wrong name or folder?'; }
  if (t.kind && t.kind != 'mp3') {
    return f + ' is really a ' + t.kind.toUpperCase() + ' file renamed to .mp3. re-export it as a real mp3';
  }
  return "this browser can't play " + f + '. re-export it as a normal mp3';
}

function fail(t, msg){
  if (t.deadAt && Date.now() - t.deadAt < 2000) { return; }
  t.deadAt = Date.now();
  errs = errs + 1;
  console.error('[dweeb] ' + msg);
  fire('error', msg);
  if (getTracks().length > 1 && errs < getTracks().length) {
    setTimeout(function(){
      A.load(idx + 1, want);
    }, 700);
  }
}

function broke(){
  var t = A.current();
  if (!t) { return; }
  if (busy[t.file]) { return; }
  if (tried[t.file]) {
    fail(t, why(t));
    return;
  }
  tried[t.file] = 1;
  busy[t.file] = 1;
  var mine = idx;

  var req = fetch('audio/' + t.file);
  req.then(function(r){
    if (!r.ok) {
      t.http = r.status;
      throw 0;
    }
    return r.arrayBuffer();
  }).then(function(ab){
    t.kind = sniff(new Uint8Array(ab, 0, Math.min(12, ab.byteLength)));
    blobs[t.file] = URL.createObjectURL(new Blob([ab]));
    busy[t.file] = 0;
    if (idx != mine) { return; }
    el.src = blobs[t.file];
    if (want) { A.play(); }
  }).catch(function(){
    busy[t.file] = 0;
    if (idx == mine) { fail(t, why(t)); }
  });
}

function media(t){
  if (!navigator.mediaSession) { return; }
  try {
    var artist = t.artist || DW.defaultArtist || '';
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: artist,
      album: t.album || '',
      artwork: [{ src: A.cover(t), sizes: '512x512', type: 'image/png' }]
    });
  } catch(e) {}
}

if (navigator.mediaSession) {
  try {
    navigator.mediaSession.setActionHandler('play', A.play);
    navigator.mediaSession.setActionHandler('pause', A.pause);
    navigator.mediaSession.setActionHandler('previoustrack', A.prev);
    navigator.mediaSession.setActionHandler('nexttrack', A.next);
  } catch(e) {}
}

// starts music on first click
A.arm = function(){
  var evs = ['pointerdown', 'keydown', 'touchend'];
  function go(){
    for (var i = 0; i < evs.length; i++) {
      removeEventListener(evs[i], go, true);
    }
    if (A.userPaused) { return; }
    if (A.playing) { wire(); }
    else { A.play(); }
  }
  for (var i = 0; i < evs.length; i++) {
    addEventListener(evs[i], go, true);
  }
};
})();
