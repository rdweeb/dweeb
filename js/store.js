(function () {
  var DW = window.DW, S = (DW.store = {});
  var KEY = 'dw-save', SALT = 'dweeb-os/save/1', timer = 0;

  function hash(s) {
    var h = 0x811c9dc5, i;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  }
  function blank() { return { v: 1, t: {}, c: {}, s: { time: 0, keys: 0, clicks: 0, plays: {}, sec: {}, first: Date.now() }, g: {}, pet: 0 }; }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var i = raw.lastIndexOf('.');
      if (i < 0 || hash(SALT + raw.slice(0, i)) !== raw.slice(i + 1)) return blank();
      var d = JSON.parse(raw.slice(0, i));
      if (!d || d.v !== 1 || !d.t || !d.c || !d.s || !d.g) return blank();
      d.s.plays = d.s.plays || {};
      d.s.sec = d.s.sec || {};
      return d;
    } catch (e) { return blank(); }
  }

  S.d = load();

  S.flush = function () {
    clearTimeout(timer);
    timer = 0;
    try {
      var body = JSON.stringify(S.d);
      localStorage.setItem(KEY, body + '.' + hash(SALT + body));
    } catch (e) {}
  };
  S.save = function () {
    if (timer) return;
    timer = setTimeout(S.flush, 500);
  };
  S.reset = function () {
    S.d = blank();
    S.flush();
  };

  addEventListener('pagehide', S.flush);
  document.addEventListener('visibilitychange', function () { if (document.hidden) S.flush(); });
})();
