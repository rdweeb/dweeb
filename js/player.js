(function(){
var DW = window.DW;
var A = DW.audio;
var P = {};
DW.player = P;

function $(id){ return document.getElementById(id); }

// seconds -> m:ss
function fmt(s){
  if (!isFinite(s) || s < 0) { s = 0; }
  var m = Math.floor(s / 60);
  var x = Math.floor(s % 60);
  var pad = '';
  if (x < 10) { pad = '0'; }
  return m + ':' + pad + x;
}

P.toggleLoop = function(){
  var on = A.loop(!A.loop());
  $('pl-loop').classList.toggle('on', on);
  if (on) { DW.toast('looping this track'); }
  else { DW.toast('loop off'); }
};

P.toggleShuffle = function(){
  var on = A.shuffle(!A.shuffle());
  if (on) { DW.toast('shuffle on'); }
  else { DW.toast('shuffle off'); }
};

P.toggleMute = function(){
  var on = A.mute(!A.mute());
  if (on) { DW.toast('muted'); }
  else { DW.toast('sound on'); }
};

P.init = function(){
  var box = $('player');
  var cover = $('pl-cover');
  var title = $('pl-title');
  var artist = $('pl-artist');
  var state = $('pl-state');
  var time = $('pl-time');
  var fill = $('pl-fill');
  var bar = $('pl-bar');
  var list = $('tracklist');
  var vol = $('pl-vol');

  // no songs, no player
  if (!DW.tracks || DW.tracks.length == 0) {
    box.hidden = true;
    return;
  }

  /* ---------- buttons ---------- */

  function tap(id, fn){
    var b = $(id);
    b.addEventListener('click', function(){
      fn();
      b.blur();
    });
  }
  function toggleList(){ list.hidden = !list.hidden; }

  tap('pl-play', A.toggle);
  tap('pl-prev', A.prev);
  tap('pl-next', A.next);
  tap('pl-loop', P.toggleLoop);
  tap('pl-shuf', P.toggleShuffle);
  tap('pl-mute', P.toggleMute);
  tap('pl-list', toggleList);
  tap('pl-covbtn', toggleList);

  /* ---------- song list ---------- */

  function trackItem(t, i){
    var li = document.createElement('li');
    var b = document.createElement('button');
    var label = (i + 1) + '. ' + t.title;
    if (t.artist) { label = label + '  -  ' + t.artist; }
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', function(){
      A.load(i, true);
      list.hidden = true;
      b.blur();
    });
    li.appendChild(b);
    return li;
  }
  for (var i = 0; i < DW.tracks.length; i++) {
    list.appendChild(trackItem(DW.tracks[i], i));
  }

  // clicking anywhere else closes the list
  document.addEventListener('click', function(e){
    if (!list.hidden && !e.target.closest('#player')) { list.hidden = true; }
  });
  addEventListener('keydown', function(e){
    if (e.key == 'Escape') { list.hidden = true; }
  });

  /* ---------- seek bar (click or drag) ---------- */

  var drag = false;
  function seek(e){
    var r = bar.getBoundingClientRect();
    A.seek((e.clientX - r.left) / r.width);
  }
  bar.addEventListener('pointerdown', function(e){
    drag = true;
    try { bar.setPointerCapture(e.pointerId); } catch(err) {}
    seek(e);
  });
  bar.addEventListener('pointermove', function(e){
    if (drag) { seek(e); }
  });
  bar.addEventListener('pointerup', function(){ drag = false; });
  bar.addEventListener('pointercancel', function(){ drag = false; });

  /* ---------- volume ---------- */

  function paintVol(){
    vol.value = A.volume();
    vol.style.setProperty('--v', (A.volume() * 100) + '%');
    box.classList.toggle('muted', A.mute());
  }
  paintVol();
  vol.addEventListener('input', function(){
    // read the slider first: un-muting repaints it with the old volume
    var v = Number(vol.value);
    if (A.mute()) { A.mute(false); }   // moving the slider un-mutes
    A.volume(v);
  });
  vol.addEventListener('change', function(){ vol.blur(); });
  A.on('vol', paintVol);

  $('pl-loop').classList.toggle('on', A.loop());
  function paintShuf(){
    $('pl-shuf').classList.toggle('on', A.shuffle());
  }
  paintShuf();
  A.on('shuffle', paintShuf);

  /* ---------- keeping the screen in sync with the audio ---------- */

  A.on('track', function(t){
    title.textContent = t.title;
    artist.textContent = DW.byline(t);
    state.textContent = 'READY';
    cover.dataset.f = '';
    cover.src = A.cover(t);
    fill.style.transform = 'scaleX(0)';
    time.textContent = '0:00 / 0:00';
    bar.setAttribute('aria-valuenow', 0);

    // highlight the current song in the list
    for (var j = 0; j < list.children.length; j++) {
      list.children[j].classList.toggle('cur', j == A.index());
    }

    // little pop animation (the void line restarts it)
    box.classList.remove('pop');
    void box.offsetWidth;
    box.classList.add('pop');
  });

  A.on('state', function(){
    box.classList.toggle('playing', A.playing);
    if (A.playing) { state.textContent = 'PLAYING'; }
    else { state.textContent = 'PAUSED'; }
    if (A.playing && A.current()) {
      box.classList.remove('wait');
      artist.textContent = DW.byline(A.current());
    }
  });

  A.on('time', function(){
    var d = A.el.duration;
    var c = A.el.currentTime;
    var frac = 0;
    if (d) { frac = c / d; }
    fill.style.transform = 'scaleX(' + frac.toFixed(4) + ')';
    bar.setAttribute('aria-valuenow', Math.round(frac * 100));
    time.textContent = fmt(c) + ' / ' + fmt(d);
  });

  // browser wont autoplay until the first tap
  A.on('blocked', function(){
    box.classList.add('wait');
    artist.textContent = 'tap or press a key for music';
  });

  A.on('error', function(msg){
    state.textContent = 'ERROR';
    if (typeof msg == 'string') { DW.toast(msg); }
    else { DW.toast("couldn't load " + A.current().file); }
  });

  if (DW.vis) {
    DW.vis.bind('cover', cover);
    DW.vis.bind('play', $('pl-play'));
    DW.vis.bind('pbtn', [$('pl-prev'), $('pl-next'), $('pl-loop'), $('pl-shuf'), $('pl-list')], [1, 1, 2, 2, 3]);
  }
};
})();
