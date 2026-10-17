(function () {
  var DW = window.DW, A = DW.audio, X = (DW.extras = {});

  var KEYS = [
    ['<  >', 'previous / next category'],
    ['UP  DOWN', 'move through the list'],
    ['HOME  END', 'first / last item'],
    ['ENTER', 'open the selected link'],
    ['SPACE', 'play / pause'],
    ['N  P', 'next / previous song'],
    ['[  ]', 'back / forward 10 seconds'],
    ['-  +', 'volume down / up'],
    ['M', 'mute'],
    ['S', 'shuffle'],
    ['L', 'loop this song'],
    ['F', 'fullscreen'],
    ['H  ?', 'this window'],
    ['ESC', 'close a window']
  ];
  var TOUCH = [
    ['SWIPE', 'left / right = category, up / down = list'],
    ['TAP', 'an icon opens it'],
    ['TAP', 'the cover opens the song list']
  ];

  function section(win, head, rows) {
    var h = document.createElement('h3');
    h.textContent = head;
    win.body.appendChild(h);
    var g = document.createElement('div');
    g.className = 'keys';
    rows.forEach(function (r) {
      var k = document.createElement('b');
      k.textContent = r[0];
      var d = document.createElement('span');
      d.textContent = r[1];
      g.appendChild(k);
      g.appendChild(d);
    });
    win.body.appendChild(g);
  }

  function fullscreen() {
    var d = document, e = d.documentElement, p;
    try { p = d.fullscreenElement ? d.exitFullscreen() : (e.requestFullscreen && e.requestFullscreen()); } catch (x) {}
    if (p && p.catch) p.catch(function () {});
  }

  X.init = function () {

    var help = DW.win('help', 'CONTROLS');
    section(help, 'KEYBOARD', KEYS);
    section(help, 'TOUCH', TOUCH);
    var tip = document.createElement('p');
    tip.className = 'tip';
    tip.textContent = 'the address bar remembers where you are (like #work/music).';
    help.body.appendChild(tip);

    var hb = document.createElement('button');
    hb.id = 'b-help';
    hb.type = 'button';
    hb.className = 'tbtn';
    hb.textContent = '?';
    hb.title = 'controls (H)';
    hb.addEventListener('click', function () { help.toggle(); hb.blur(); });
    var bar = document.getElementById('status');
    bar.insertBefore(hb, document.getElementById('views-wrap'));

    addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!document.body.classList.contains('live') || document.body.classList.contains('gaming')) return;
      var tg = e.target;
      if (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) && tg.type !== 'range') return;
      var k = e.key, hit = true;
      if (k === 'h' || k === 'H' || k === '?') { if (k === '?') help.toggle(); else DW.later(help.toggle); }
      else if (k === 'm' || k === 'M') DW.later(DW.player.toggleMute);
      else if (k === 's' || k === 'S') DW.later(DW.player.toggleShuffle);
      else if (k === 'l' || k === 'L') DW.later(DW.player.toggleLoop);
      else if (k === 'f' || k === 'F') DW.later(fullscreen);
      else if (k === '[') A.skip(-10);
      else if (k === ']') A.skip(10);
      else if (k === '-' || k === '_') { if (A.mute()) A.mute(false); A.volume(A.volume() - 0.05); }
      else if (k === '=' || k === '+') { if (A.mute()) A.mute(false); A.volume(A.volume() + 0.05); }
      else hit = false;
      if (hit) e.preventDefault();
    });

    var base = document.title;
    function title() {
      var t = A.current();
      document.title = A.playing && t ? '♪ ' + t.title + (t.artist ? ' - ' + t.artist : '') : base;
    }
    A.on('state', title);
    A.on('track', title);
  };
})();


