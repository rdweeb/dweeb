// The intro and loading sequence.

(function () {
  var DW = window.DW;
  var $ = function (id) { return document.getElementById(id); };

  DW.boot = function (cb) {
    var I = DW.intro || {}, I2 = DW.intro2 || {}, tracks = DW.tracks || [];
    var b = $('boot'), vid = $('intro'), gate = $('gate'), skip = $('skip');
    var fill = $('load-fill'), txt = $('load-txt');
    var total = 0, done = 0, armed, ready, over, url = '', wd, st;

    function paint() {
      fill.style.transform = 'scaleX(' + (total ? done / total : 0) + ')';
      txt.textContent = 'Downloading ' + done + '/' + total + ' content!';
    }

    function job(ms) {
      var d, t;
      total++;
      if (ms) t = setTimeout(f, ms);
      function f() {
        if (d) return;
        d = 1; done++;
        clearTimeout(t);
        paint(); check();
      }
      return f;
    }

    [].forEach.call(document.querySelectorAll('#cats img, #top img'), function (img) {
      var f = job(15000);
      if (img.complete) f();
      else { img.addEventListener('load', f); img.addEventListener('error', f); }
    });

    tracks.forEach(function (t) {
      var f = job(15000), i = new Image();
      i.onload = i.onerror = f;
      i.src = DW.audio.cover(t);
    });

    if (tracks.length) {
      var fa = job(5000), el = DW.audio.el;
      if (el.readyState >= 3) fa();
      else {
        el.addEventListener('canplaythrough', fa, { once: true });
        el.addEventListener('error', fa, { once: true });
      }
    }

    function rare() {
      var c = window.crypto, q = /[?&]force2=([^&]+)/.exec(location.search);
      if (!c || !c.getRandomValues) return false;
      try { if (q && I2.testKey && decodeURIComponent(q[1]) === I2.testKey) return true; } catch (e) {}
      var odds = +I2.odds > 1 ? +I2.odds : 1e9, u = new Uint32Array(2);
      c.getRandomValues(u);
      return ((u[0] & 0x1FFFFF) * 4294967296 + u[1]) / 9007199254740992 < 1 / odds;
    }

    // blob url or '' if anything goes wrong
    function grab(src) {
      return fetch(src)
        .then(function (r) { if (!r.ok) throw 0; return r.blob(); })
        .then(function (bl) { return URL.createObjectURL(bl); }, function () { return ''; });
    }

    if ((I.src || I2.src) && !(DW.set && DW.set.get('skipIntro'))) {
      var fv = job(90000), lucky = rare();
      var first = lucky ? (I2.src || 'video/intro2.mp4') : I.src;

      (first ? grab(first) : Promise.resolve('')).then(function (u) {
        if (u && lucky) {
          if (DW.trophy) DW.trophy.award('rare');
          try { localStorage.setItem('dw-intro2', (+localStorage.getItem('dw-intro2') || 0) + 1); } catch (e) {}
          return u;
        }
        return u || (lucky && I.src ? grab(I.src) : '');
      }).then(function (u) {
        if (ready) { if (u) URL.revokeObjectURL(u); return; }
        url = u;
        fv();
      });
    }

    function check() {
      if (!armed || ready || done < total) return;
      ready = true;
      txt.textContent = 'Download complete!';
      setTimeout(afterDownload, 500);
    }

    function afterDownload() {
      if (!url) return finish();
      if (!I.gate) return play(false);
      gate.hidden = false;
      var evs = ['pointerup', 'touchend', 'click', 'keydown'];
      function go() {
        evs.forEach(function (e) { removeEventListener(e, go, true); });
        play(true);
      }
      evs.forEach(function (e) { addEventListener(e, go, true); });
    }

    function play(gesture) {
      if (gesture && DW.audio.unlock) DW.audio.unlock();
      gate.hidden = true;
      $('dl').hidden = true;
      vid.src = url;
      vid.hidden = false;
      vid.muted = false;
      vid.addEventListener('ended', finish);
      vid.addEventListener('error', finish);
      var p = vid.play();
      if (p && p.catch) p.catch(function () {
        vid.muted = true;
        vid.play().catch(finish);
      });

      if (I.skip) {
        skip.hidden = false;
        st = setTimeout(function () {
          addEventListener('pointerdown', finish, true);
          addEventListener('keydown', finish, true);
        }, 1200);
      }

      // frozen video bail after 8s of nothing
      var last = -1, still = 0;
      wd = setInterval(function () {
        still = vid.currentTime === last ? still + 1 : 0;
        last = vid.currentTime;
        if (still >= 8) finish();
      }, 1000);
    }

    function finish() {
      if (over) return;
      over = 1;
      clearInterval(wd);
      clearTimeout(st);
      removeEventListener('pointerdown', finish, true);
      removeEventListener('keydown', finish, true);
      b.classList.add('gone');
      cb();
      setTimeout(function () {
        b.classList.add('dead');
        try { vid.pause(); vid.removeAttribute('src'); vid.load(); vid.remove(); } catch (e) {}
        if (url) URL.revokeObjectURL(url);
      }, 1200);
    }

    paint();
    armed = 1;
    check();
  };
})();
