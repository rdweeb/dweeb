(function () {
  var DW = window.DW;
  function $(id) { return document.getElementById(id); }

  DW.boot = function (cb) {
    var I = DW.intro || {};
    var b = $('boot'), vid = $('intro'), gate = $('gate'), skip = $('skip');
    var fill = $('load-fill'), txt = $('load-txt');
    var total = 0, done = 0, armed = false, ready = false, over = false, introURL = '', wd = 0;

    function paint() {
      fill.style.transform = 'scaleX(' + (total ? done / total : 0).toFixed(3) + ')';
      txt.textContent = 'Downloading ' + done + '/' + total + ' content!';
    }

    function job(ms) {
      var d = false;
      total++;
      var f = function () {
        if (d) return;
        d = true; done++;
        paint(); check();
      };
      if (ms) setTimeout(f, ms);
      return f;
    }

    [].forEach.call(document.querySelectorAll('#cats img, #top img'), function (img) {
      var f = job(15000);
      if (img.complete) f();
      else { img.addEventListener('load', f); img.addEventListener('error', f); }
    });

    DW.tracks.forEach(function (t) {
      var f = job(15000), i = new Image();
      i.onload = i.onerror = f;
      i.src = DW.audio.cover(t);
    });

    if (DW.tracks.length) {
      var fa = job(5000), el = DW.audio.el;
      if (el.readyState >= 3) fa();
      else {
        el.addEventListener('canplaythrough', fa, { once: true });
        el.addEventListener('error', fa, { once: true });
      }
    }

    var I2 = DW.intro2 || {};
    function rare() {
      var c = window.crypto;
      if (!c || !c.getRandomValues) return false;
      var q = /[?&]force2=([^&]+)/.exec(location.search);
      if (q && I2.testKey && decodeURIComponent(q[1]) === I2.testKey) return true;
      var odds = +I2.odds > 1 ? +I2.odds : 1e9, u = new Uint32Array(2);
      c.getRandomValues(u);
      return ((u[0] & 0x1FFFFF) * 4294967296 + u[1]) / 9007199254740992 < 1 / odds;
    }
    function grab(src, fv, fallback, rare) {
      fetch(src)
        .then(function (r) { if (!r.ok) throw 0; return r.blob(); })
        .then(function (bl) { introURL = URL.createObjectURL(bl); if (rare && DW.trophy) DW.trophy.award('rare'); })
        .catch(function () {})
        .then(function () {
          if (!introURL && fallback) return grab(fallback, fv);
          fv();
        });
    }
    var skipIt = !!(DW.set && DW.set.get('skipIntro'));
    if ((I.src || I2.src) && !skipIt) {
      var fv = job(90000), lucky = rare();
      try { if (lucky) localStorage.setItem('dw-intro2', String((+localStorage.getItem('dw-intro2') || 0) + 1)); } catch (e) {}
      if (lucky) grab(I2.src || 'video/intro2.mp4', fv, I.src, true);
      else if (I.src) grab(I.src, fv);
      else fv();
    }

    function check() {
      if (!armed || ready || done < total) return;
      ready = true;
      txt.textContent = 'Download complete!';
      setTimeout(afterDownload, 500);
    }

    function afterDownload() {
      if (!introURL) return finish();
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
      vid.src = introURL;
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
        setTimeout(function () {
          addEventListener('pointerdown', finish, true);
          addEventListener('keydown', finish, true);
        }, 1200);
      }

      var last = -1, still = 0;
      wd = setInterval(function () {
        if (vid.currentTime === last) still++; else still = 0;
        last = vid.currentTime;
        if (still >= 8) finish();
      }, 1000);
    }

    function finish() {
      if (over) return;
      over = true;
      clearInterval(wd);
      removeEventListener('pointerdown', finish, true);
      removeEventListener('keydown', finish, true);
      b.classList.add('gone');
      cb();
      setTimeout(function () {
        b.classList.add('dead');
        try { vid.pause(); vid.removeAttribute('src'); vid.load(); vid.remove(); } catch (e) {}
        if (introURL) URL.revokeObjectURL(introURL);
      }, 1200);
    }

    paint();
    armed = true;
    check();
  };
})();

