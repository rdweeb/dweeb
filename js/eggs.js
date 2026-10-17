(function () {
  var DW = window.DW, E = (DW.eggs = DW.eggs || {});
  var cfg = {};
  var KEEP = { birthday: E.birthday };

  function tro(id) { try { if (DW.trophy) DW.trophy.award(id); } catch (e) {} }
  function say(t) { try { if (DW.splashUI) DW.splashUI.say(t); } catch (e) {} }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function gaming() { return document.body.classList.contains('gaming'); }

  function multiTap(target, n, ms, cb) {
    var hits = [];
    target.addEventListener('pointerdown', function () {
      var now = Date.now();
      hits = hits.filter(function (t) { return now - t < ms; });
      hits.push(now);
      if (hits.length >= n) { hits = []; cb(); }
    });
  }

  /* konami */
  var SEQ = ['u', 'u', 'd', 'd', 'l', 'r', 'l', 'r'], seen = [], tx = 0, ty = 0;
  function swipes() {
    addEventListener('touchstart', function (e) { var t = e.changedTouches[0]; tx = t.clientX; ty = t.clientY; }, { passive: true });
    addEventListener('touchend', function (e) {
      var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) return;
      seen.push(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u'));
      seen = seen.slice(-SEQ.length);
      if (seen.join('') === SEQ.join('')) {
        seen = [];
        tro('konami');
        say('+30 lives!');
      }
    }, { passive: true });
  }

  /* hold the album cover */
  function cover() {
    var b = document.getElementById('pl-covbtn'), timer = 0, fired = false;
    if (!b) return;
    b.addEventListener('pointerdown', function () {
      fired = false;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fired = true;
        b.classList.add('egg-spin');
        setTimeout(function () { b.classList.remove('egg-spin'); }, 1400);
        tro('spin');
        say(pick(['<dizzy>wheeeeeee', '<dizzy>i am the album now', 'round and round. like a record.']));
      }, 1200);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { clearTimeout(timer); }); });
    b.addEventListener('click', function (e) { if (fired) { e.stopPropagation(); e.preventDefault(); fired = false; } }, true);
  }

  /* poke the chat bot */
  function poke() {
    var n = 0, last = 0;
    addEventListener('pointerdown', function (e) {
      var s = document.getElementById('splash');
      if (!s || !s.classList.contains('on') || gaming()) return;
      var r = s.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      var now = Date.now();
      n = now - last > 5000 ? 1 : n + 1;
      last = now;
      if (n === 3) say('hey. i can feel that.');
      else if (n === 6) say('<angry>that is my FACE');
      else if (n === 9) { say('<scared>ok ok ok i am sorry'); tro('ouch'); }
    }, true);
  }

  /* mute button panic */
  function mute() {
    var b = document.getElementById('pl-mute');
    if (!b) return;
    multiTap(b, 8, 6000, function () { tro('mutiny'); say(pick(['<sneaky>make up your mind', 'is it on or is it off. i am getting dizzy.', 'mute. unmute. mute. i am not a lightswitch.'])); });
  }

  /* the same song three times in a row (loop on) */
  function loops() {
    var A = DW.audio, file = '', n = 0;
    if (!A || !A.el) return;
    A.on('track', function (t) { if (t.file !== file) { file = t.file; n = 0; } });
    A.el.addEventListener('ended', function () {
      if (A.loop && A.loop()) { n++; if (n >= 3) { n = 0; tro('onemore'); say('<love>one more time! i am not tired of it either.'); } }
    });
  }

  /* birthday */
  function birthday() {
    var b = KEEP.birthday, d = new Date();
    if (!b || !b.m || !b.d || b.m !== d.getMonth() + 1 || b.d !== d.getDate()) return;
    setTimeout(function () {
      tro('birthday');
      say(b.line || '<excited>HAPPY BIRTHDAY!!<n> go eat some cake.');
    }, 6500);
  }

  E.init = function () {
    swipes();
    cover();
    poke();
    mute();
    loops();
    birthday();
  };
})();
