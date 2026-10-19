(function(){
var DW = window.DW;

// if this file loaded before the config, make DW ourselves and leave a note.
// main.js uses the note to warn about the script order
if (!DW) {
  DW = window.DW = {};
  DW.early = true;
}

// reduced motion (only if the config says to respect it)
DW.reduce = false;
if (DW.respectReducedMotion) {
  DW.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
}
if (DW.reduce) { document.documentElement.classList.add('reduce'); }

/* ---------- playlist ---------- */

// DW.playlist can be { 'song.mp3': 'Title' } or { 'song': { title, artist, album, lyrics } }
if (DW.playlist) {
  DW.tracks = [];
  var files = Object.keys(DW.playlist);
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var v = DW.playlist[f];
    var o = {};
    if (typeof v == 'string') { o = { title: v }; }
    else if (v) { o = v; }

    var file = f;
    if (!/\./.test(f)) { file = f + '.mp3'; }   // no extension = mp3
    DW.tracks.push({
      file: file,
      title: o.title || f.replace(/\.[^.]+$/, ''),
      artist: o.artist,
      album: o.album,
      lyrics: o.lyrics
    });
  }
}
DW.tracks = DW.tracks || [];

// "artist - album" text under the song title
DW.byline = function(t){
  var parts = [];
  var artist = t.artist || DW.defaultArtist || '';
  if (artist) { parts.push(artist); }
  if (t.album) { parts.push(t.album); }
  return parts.join(' - ');
};

/* ---------- links ---------- */

// only lets through web and mailto links. returns '' for anything else
DW.safeUrl = function(u){
  if (!u) { return ''; }
  try {
    var x = new URL(u, location.href);
    if (/^(https?:|mailto:)$/.test(x.protocol)) { return x.href; }
    return '';
  } catch(e) {
    return '';
  }
};

DW.openLink = function(u){
  if (!u) { return; }
  window.open(u, '_blank', 'noopener,noreferrer');
};

/* ---------- hotkeys that wait for you to stop typing ---------- */

// letter hotkeys (N, P, M, S...) would fire in the middle of typing a word for the chat bot.
// DW.later waits a moment, and skips the action if more letters came in meanwhile
var lastLetter = 0;
var hotTimer = 0;

addEventListener('keydown', function(e){
  if (e.key && e.key.length == 1 && /[a-z]/i.test(e.key)) { lastLetter = Date.now(); }
}, true);

DW.later = function(fn){
  clearTimeout(hotTimer);
  hotTimer = setTimeout(function(){
    if (Date.now() - lastLetter >= 260) { fn(); }
  }, 280);
};

// cancel a waiting hotkey (the chat bot does this when it catches a swear word)
DW.cancelHot = function(){ clearTimeout(hotTimer); };

/* ---------- popup windows ---------- */

var cur = null;   // the window thats open right now (only one at a time)

DW.win = function(id, title){
  // the dark overlay
  var ov = document.createElement('div');
  ov.className = 'win-ov';
  ov.id = 'win-' + id;
  ov.hidden = true;

  // the window itself
  var w = document.createElement('div');
  w.className = 'win';
  w.tabIndex = -1;
  w.setAttribute('role', 'dialog');
  w.setAttribute('aria-label', title);

  // title bar with the close button
  var tb = document.createElement('div');
  tb.className = 'win-tb';
  var t = document.createElement('span');
  t.textContent = title;
  var x = document.createElement('button');
  x.type = 'button';
  x.className = 'win-x';
  x.textContent = 'X';
  x.setAttribute('aria-label', 'close');
  tb.appendChild(t);
  tb.appendChild(x);

  var body = document.createElement('div');
  body.className = 'win-body';
  w.appendChild(tb);
  w.appendChild(body);
  ov.appendChild(w);
  (document.getElementById('app') || document.body).appendChild(ov);

  var o = { el: ov, body: body, titleEl: t, isOpen: false, onopen: null, onclose: null };

  o.open = function(){
    if (cur && cur !== o) { cur.close(); }
    cur = o;
    o.isOpen = true;
    ov.hidden = false;
    // restart the pop-in animation
    ov.classList.remove('show');
    void ov.offsetWidth;
    ov.classList.add('show');
    document.body.classList.add('modal');
    w.focus();
    if (o.onopen) { o.onopen(); }
  };

  o.close = function(){
    if (cur !== o) { return; }
    cur = null;
    o.isOpen = false;
    ov.hidden = true;
    ov.classList.remove('show');
    document.body.classList.remove('modal');
    if (document.activeElement && document.activeElement.blur) { document.activeElement.blur(); }
    if (o.onclose) { o.onclose(); }
  };

  o.toggle = function(){
    if (o.isOpen) { o.close(); } else { o.open(); }
  };

  x.addEventListener('click', function(){ o.close(); });
  // clicking the dark area (not the window) closes it too
  ov.addEventListener('click', function(e){
    if (e.target === ov) { o.close(); }
  });
  return o;
};

addEventListener('keydown', function(e){
  if (e.key == 'Escape' && cur) {
    cur.close();
    e.preventDefault();
  }
});
})();
