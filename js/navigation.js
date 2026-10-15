(function () {
  var DW = window.DW, N = (DW.nav = {});
  var root = document.getElementById('cats');
  var cats = [], ci = 0, memo = [], maxd = 4, swiped = 0;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    return e;
  }

  function img(id) {
    var i = new Image();
    i.src = 'icons/' + id + '.png';
    i.alt = '';
    i.draggable = false;
    i.className = 'ico';
    return i;
  }

  var tt;
  DW.toast = function (msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove('show'); }, 2300 + msg.length * 45);
  };

  N.build = function () {
    DW.menu.forEach(function (c, k) {
      var cat = el('div', 'cat');
      cat.dataset.k = k;
      cat.style.setProperty('--k', k);

      var ico = el('div', 'cat-ico'), fl = el('div', 'fl'), ci2 = img(c.id);
      fl.appendChild(ci2);
      ico.appendChild(fl);

      var subs = el('div', 'subs'), list = [];
      Object.keys(c.subs).forEach(function (id, j) {
        var s = el('div', 'sub');
        s.dataset.j = j;
        s.style.setProperty('--j', j);
        var si = el('div', 'sub-ico'), simg = img(id);
        si.appendChild(simg);
        var sn = el('div', 'sub-name'), span = el('span', null, id.replace(/[-_]+/g, ' ').toUpperCase());
        sn.appendChild(span);
        s.appendChild(sn);
        s.appendChild(si);
        subs.appendChild(s);
        list.push({ el: s, id: id, url: c.subs[id], img: simg, nm: span });
      });

      var label = String(c.label || c.id).toUpperCase(), cname = el('div', 'cat-name' + (label.length > 14 ? ' long' : ''), label);
      cat.appendChild(ico);
      cat.appendChild(cname);
      cat.appendChild(subs);
      root.appendChild(cat);
      cats.push({ el: cat, id: c.id, empty: !list.length, ico: ico, img: ci2, name: cname, subs: list });
      memo.push(0);
    });
    readMax();

    var start = location.hash.slice(1);
    if (!start) { try { start = localStorage.getItem('dw-spot') || ''; } catch (e) {} }
    if (!N.go(start)) layout();
  };

  function readMax() {
    var v = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--maxd'), 10);
    maxd = v >= 0 ? v : 4;
  }

  var raf = 0;
  function layout() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; paint(); });
  }

  function paint() {
    cats.forEach(function (c, k) {
      var d = k - ci, ad = Math.abs(d);
      c.el.style.setProperty('--d', d);
      c.el.style.setProperty('--o', d === 0 ? 1 : ad > 3 ? 0 : (0.62 - ad * 0.08).toFixed(2));
      c.el.classList.toggle('act', d === 0);
      c.el.classList.toggle('far', ad > 3);
      c.subs.forEach(function (s, j) {
        var e = j - memo[k];
        var o = e < 0 || e > maxd ? 0 : e === 0 ? 1 : Math.max(0.35, 1 - e * 0.13);
        s.el.style.setProperty('--d', e);
        s.el.style.setProperty('--sg', e > 0 ? 1 : e < 0 ? -1 : 0);
        s.el.style.setProperty('--o', o);
        s.el.classList.toggle('sel', e === 0);
        s.el.classList.toggle('hid', o === 0);
      });
    });
    react();
  }

  var spotT = 0;
  function saveSpot() {
    clearTimeout(spotT);
    spotT = setTimeout(function () {
      var c = cats[ci], s = c.id + (c.empty ? '' : '/' + c.subs[memo[ci]].id);
      if (DW.trophy) DW.trophy.mark('hopper', c.id);
      try { localStorage.setItem('dw-spot', s); } catch (e) {}
      try { history.replaceState(null, '', '#' + s); } catch (e) {}
    }, 220);
  }

  N.go = function (s) {
    var p = String(s || '').replace(/^#/, '').split('/'), k = -1, j, i;
    for (i = 0; i < cats.length; i++) if (cats[i].id === p[0]) k = i;
    if (k < 0) return false;
    ci = k;
    if (p[1]) for (j = 0; j < cats[k].subs.length; j++) if (cats[k].subs[j].id === p[1]) memo[k] = j;
    layout();
    return true;
  };

  function react() {
    var V = DW.vis, cur = cats[ci], sel = cur.subs[memo[ci]] || null;
    var oc = [], od = [], os = [], osd = [], nm = [], nd = [];
    cats.forEach(function (c, k) {
      var d = Math.abs(k - ci);
      if (d && d < 4) { oc.push(c.img); od.push(d); }
    });
    cur.subs.forEach(function (s, j) {
      var e = j - memo[ci];
      if (e < 0 || e > maxd) return;
      nm.push(s.nm); nd.push(e);
      if (e) { os.push(s.img); osd.push(e); }
    });
    V.bind('icon', cur.img);
    V.bind('cats', oc, od);
    V.bind('catname', cur.name);
    V.bind('sub', sel ? sel.img : []);
    V.bind('subs', os, osd);
    V.bind('names', nm, nd);
  }

  function bump(axis, dir) {
    var t = axis === 'x' ? root : cats[ci].el.querySelector('.subs');
    if (!t.animate) return;
    var to = axis === 'x' ? dir * 8 + 'px 0' : '0 ' + dir * 8 + 'px';
    t.animate([{ translate: '0 0' }, { translate: to }, { translate: '0 0' }], { duration: 220, easing: 'ease-out' });
  }

  N.cat = function (dir) {
    var n = ci + dir;
    if (n < 0 || n >= cats.length) return bump('x', dir);
    ci = n;
    layout();
    saveSpot();
  };
  N.sub = function (dir) {
    var n = memo[ci] + dir;
    if (n < 0 || n >= cats[ci].subs.length) return bump('y', dir);
    memo[ci] = n;
    layout();
    saveSpot();
  };

  N.setSub = function (n) {
    n = Math.max(0, Math.min(cats[ci].subs.length - 1, n));
    if (n === memo[ci]) return;
    memo[ci] = n;
    layout();
    saveSpot();
  };

  function go(s) {
    if (DW.trophy) DW.trophy.mark('tourist', s.id);
    var u = DW.safeUrl(s.url);
    if (!u) { DW.toast(s.id.toUpperCase() + ' has no link yet'); return; }
    s.el.classList.add('go');
    setTimeout(function () { s.el.classList.remove('go'); }, 520);
    DW.openLink(u);
  }
  N.open = function () { var s = cats[ci].subs[memo[ci]]; if (s) go(s); };

  function inPlayer(e) { return e.target.closest && e.target.closest('#player'); }
  function blocked() { var c = document.body.classList; return !c.contains('live') || c.contains('modal'); }

  N.bind = function () {
    addEventListener('resize', function () { readMax(); layout(); });
    addEventListener('hashchange', function () { N.go(location.hash); });

    addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (blocked() || inPlayer(e)) return;
      var k = e.key, hit = true;
      if (k === 'ArrowLeft' || k === ',' || k === '<') N.cat(-1);
      else if (k === 'ArrowRight' || k === '.' || k === '>') N.cat(1);
      else if (k === 'ArrowUp') N.sub(-1);
      else if (k === 'ArrowDown') N.sub(1);
      else if (k === 'Home') N.setSub(0);
      else if (k === 'End') N.setSub(9999);
      else if (k === 'PageUp') N.setSub(memo[ci] - 4);
      else if (k === 'PageDown') N.setSub(memo[ci] + 4);
      else if (k === 'Enter') { if (!e.repeat) N.open(); }
      else if (k === ' ') DW.audio.toggle();
      else if (k === 'n' || k === 'N') DW.later(DW.audio.next);
      else if (k === 'p' || k === 'P') DW.later(DW.audio.prev);
      else hit = false;
      if (hit) e.preventDefault();
    });

    var wt = 0;
    addEventListener('wheel', function (e) {
      if (inPlayer(e) || blocked()) return;
      var n = Date.now();
      if (n - wt < 260) return;
      var ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (Math.max(ax, ay) < 8) return;
      wt = n;
      if (ax > ay) N.cat(e.deltaX > 0 ? 1 : -1); else N.sub(e.deltaY > 0 ? 1 : -1);
    }, { passive: true });

    var sx = 0, sy = 0, st = 0, on = false;
    addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || inPlayer(e) || blocked()) { on = false; return; }
      on = true;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    }, { passive: true });
    addEventListener('touchcancel', function () { on = false; }, { passive: true });
    addEventListener('touchend', function (e) {
      if (!on || blocked()) return;
      on = false;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      var ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < 36 || Date.now() - st > 900) return;
      if (ax > ay * 1.3) { swiped = Date.now(); N.cat(dx < 0 ? 1 : -1); }
      else if (ay > ax * 1.3) { swiped = Date.now(); N.sub(dy < 0 ? 1 : -1); }
    }, { passive: true });

    root.addEventListener('click', function (e) {
      if (Date.now() - swiped < 400 || blocked()) return;
      var cat = e.target.closest('.cat');
      if (!cat) return;
      var k = +cat.dataset.k;
      if (k !== ci) { ci = k; layout(); saveSpot(); return; }
      var sub = e.target.closest('.sub');
      if (!sub) return;
      memo[ci] = +sub.dataset.j;
      layout();
      saveSpot();
      N.open();
    });
  };
})();

