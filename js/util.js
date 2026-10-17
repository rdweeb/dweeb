(function () {
  var DW = window.DW;
  if (!DW) { DW = window.DW = {}; DW.early = true; }

  DW.reduce = !!DW.respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (DW.reduce) document.documentElement.classList.add('reduce');

  if (DW.playlist) {
    DW.tracks = Object.keys(DW.playlist).map(function (f) {
      var v = DW.playlist[f], o = typeof v === 'string' ? { title: v } : (v || {});
      return {
        file: /\./.test(f) ? f : f + '.mp3',
        title: o.title || f.replace(/\.[^.]+$/, ''),
        artist: o.artist,
        album: o.album,
        lyrics: o.lyrics
      };
    });
  }
  DW.tracks = DW.tracks || [];

  DW.byline = function (t) {
    return [t.artist || DW.defaultArtist || '', t.album || ''].filter(Boolean).join(' - ');
  };

  DW.safeUrl = function (u) {
    if (!u) return '';
    try {
      var x = new URL(u, location.href);
      return /^(https?:|mailto:)$/.test(x.protocol) ? x.href : '';
    } catch (e) { return ''; }
  };
  DW.openLink = function (u) { window.open(u, '_blank', 'noopener,noreferrer'); };

  var lastLetter = 0, hotTimer = 0;
  addEventListener('keydown', function (e) {
    if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) lastLetter = Date.now();
  }, true);
  DW.later = function (fn) {
    clearTimeout(hotTimer);
    hotTimer = setTimeout(function () { if (Date.now() - lastLetter >= 260) fn(); }, 280);
  };
  DW.cancelHot = function () { clearTimeout(hotTimer); };

  var cur = null;
  DW.win = function (id, title) {
    var ov = document.createElement('div');
    ov.className = 'win-ov';
    ov.id = 'win-' + id;
    ov.hidden = true;
    var w = document.createElement('div');
    w.className = 'win';
    w.tabIndex = -1;
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', title);
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
    o.open = function () {
      if (cur && cur !== o) cur.close();
      cur = o;
      o.isOpen = true;
      ov.hidden = false;
      ov.classList.remove('show');
      void ov.offsetWidth;
      ov.classList.add('show');
      document.body.classList.add('modal');
      w.focus();
      if (o.onopen) o.onopen();
    };
    o.close = function () {
      if (cur !== o) return;
      cur = null;
      o.isOpen = false;
      ov.hidden = true;
      ov.classList.remove('show');
      document.body.classList.remove('modal');
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      if (o.onclose) o.onclose();
    };
    o.toggle = function () { if (o.isOpen) o.close(); else o.open(); };
    x.addEventListener('click', o.close);
    ov.addEventListener('click', function (e) { if (e.target === ov) o.close(); });
    return o;
  };
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cur) { cur.close(); e.preventDefault(); }
  });
})();

