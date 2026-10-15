(function () {
  var DW = window.DW, A = DW.audio, P = (DW.player = {});
  function $(id) { return document.getElementById(id); }

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), x = Math.floor(s % 60);
    return m + ':' + (x < 10 ? '0' : '') + x;
  }

  P.toggleLoop = function () {
    var on = A.loop(!A.loop());
    $('pl-loop').classList.toggle('on', on);
    DW.toast(on ? 'looping this track' : 'loop off');
  };
  P.toggleShuffle = function () { DW.toast(A.shuffle(!A.shuffle()) ? 'shuffle on' : 'shuffle off'); };
  P.toggleMute = function () { DW.toast(A.mute(!A.mute()) ? 'muted' : 'sound on'); };

  P.init = function () {
    var box = $('player'), cover = $('pl-cover'), title = $('pl-title'), artist = $('pl-artist'), state = $('pl-state');
    var time = $('pl-time'), fill = $('pl-fill'), bar = $('pl-bar'), list = $('tracklist'), vol = $('pl-vol');

    if (!DW.tracks.length) { box.hidden = true; return; }

    function tap(id, fn) {
      var b = $(id);
      b.addEventListener('click', function () { fn(); b.blur(); });
    }
    tap('pl-play', A.toggle);
    tap('pl-prev', A.prev);
    tap('pl-next', A.next);
    tap('pl-loop', P.toggleLoop);
    tap('pl-shuf', P.toggleShuffle);
    tap('pl-mute', P.toggleMute);
    function toggleList() { list.hidden = !list.hidden; }
    tap('pl-list', toggleList);
    tap('pl-covbtn', toggleList);

    DW.tracks.forEach(function (t, i) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      b.textContent = (i + 1) + '. ' + t.title + (t.artist ? '  -  ' + t.artist : '');
      b.addEventListener('click', function () { A.load(i, true); list.hidden = true; b.blur(); });
      li.appendChild(b);
      list.appendChild(li);
    });
    document.addEventListener('click', function (e) {
      if (!list.hidden && !e.target.closest('#player')) list.hidden = true;
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') list.hidden = true; });

    var drag = false;
    function seek(e) {
      var r = bar.getBoundingClientRect();
      A.seek((e.clientX - r.left) / r.width);
    }
    bar.addEventListener('pointerdown', function (e) { drag = true; bar.setPointerCapture(e.pointerId); seek(e); });
    bar.addEventListener('pointermove', function (e) { if (drag) seek(e); });
    bar.addEventListener('pointerup', function () { drag = false; });
    bar.addEventListener('pointercancel', function () { drag = false; });

    function paintVol() {
      vol.value = A.volume();
      vol.style.setProperty('--v', (A.volume() * 100) + '%');
      box.classList.toggle('muted', A.mute());
    }
    paintVol();
    vol.addEventListener('input', function () { if (A.mute()) A.mute(false); A.volume(+vol.value); });
    vol.addEventListener('change', function () { vol.blur(); });
    A.on('vol', paintVol);

    $('pl-loop').classList.toggle('on', A.loop());
    function paintShuf() { $('pl-shuf').classList.toggle('on', A.shuffle()); }
    paintShuf();
    A.on('shuffle', paintShuf);

    A.on('track', function (t) {
      title.textContent = t.title;
      artist.textContent = DW.byline(t);
      state.textContent = 'READY';
      cover.dataset.f = '';
      cover.src = A.cover(t);
      fill.style.transform = 'scaleX(0)';
      time.textContent = '0:00 / 0:00';
      [].forEach.call(list.children, function (li, i) { li.classList.toggle('cur', i === A.index()); });
      box.classList.remove('pop');
      void box.offsetWidth;
      box.classList.add('pop');
    });
    A.on('state', function () {
      box.classList.toggle('playing', A.playing);
      state.textContent = A.playing ? 'PLAYING' : 'PAUSED';
      if (A.playing) {
        box.classList.remove('wait');
        artist.textContent = DW.byline(A.current());
      }
    });
    A.on('time', function () {
      var d = A.el.duration, c = A.el.currentTime;
      fill.style.transform = 'scaleX(' + (d ? c / d : 0).toFixed(4) + ')';
      time.textContent = fmt(c) + ' / ' + fmt(d);
    });
    A.on('blocked', function () {
      box.classList.add('wait');
      artist.textContent = 'tap or press a key for music';
    });
    A.on('error', function (msg) {
      state.textContent = 'ERROR';
      DW.toast(typeof msg === 'string' ? msg : "couldn't load " + A.current().file);
    });

    DW.vis.bind('cover', cover);
    DW.vis.bind('play', $('pl-play'));
    DW.vis.bind('pbtn', [$('pl-prev'), $('pl-next'), $('pl-loop'), $('pl-shuf'), $('pl-list')], [1, 1, 2, 2, 3]);
  };
})();

