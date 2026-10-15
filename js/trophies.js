(function () {
  var DW = window.DW, A = DW.audio, St = DW.store, T = (DW.trophy = {});
  var DM = 'DM me this achievement being unlocked and I might give you a prize';

  var DEFS = [
    { id: 'welcome', name: 'HELLO WORLD', desc: 'Enter the site.', tier: 'bronze' },
    { id: 'dj', name: 'FULL ALBUM', desc: 'Listen to every song on the playlist.', tier: 'gold', goal: function () { return DW.tracks.length; } },
    { id: 'tourist', name: 'TOURIST', desc: 'Open every site in the menu.', tier: 'gold', goal: function () { return subCount(); } },
    { id: 'hopper', name: 'CHANNEL SURFER', desc: 'Visit every category.', tier: 'silver', goal: function () { return DW.menu.length; } },
    { id: 'regular', name: 'REGULAR', desc: 'Visit the site 5 times.', tier: 'silver', goal: 5 },
    { id: 'devoted', name: 'DEVOTED', desc: 'Visit the site 20 times.', tier: 'gold', goal: 20 },
    { id: 'longhaul', name: 'SETTLE IN', desc: 'Stay for 30 minutes in one visit.', tier: 'silver', goal: 30 },
    { id: 'arcade', name: 'ARCADE KID', desc: 'Play every game in the games tab.', tier: 'silver', goal: function () { return DW.games ? DW.games.list.length : 6; } },
    { id: 'snake15', name: 'SNAKE CHARMER', desc: 'Eat 15 apples in one Snake run.', tier: 'bronze' },
    { id: 'tetris10', name: 'LINE COOK', desc: 'Clear 10 lines in one Tetris game.', tier: 'bronze' },
    { id: 'pongwin', name: 'PONG PRO', desc: 'Beat your CPU in Pong.', tier: 'bronze' },
    { id: 'breakout', name: 'BRICK BREAKER', desc: 'Clear every brick in Breakout.', tier: 'silver' },
    { id: 'fivetwelve', name: 'FIVE TWELVE', desc: 'Make a 512 tile in 2048.', tier: 'silver' },
    { id: 'rhythm', name: 'ON BEAT', desc: 'Finish a song in the rhythm game.', tier: 'bronze' },
    { id: 'rhythmS', name: 'PERFECT TIMING', desc: 'Get an S rank in the rhythm game.', tier: 'gold' },

    { id: 'fullcombo', name: 'NOT A SINGLE MISS', desc: 'Finish a rhythm song without missing a note.', tier: 'gold', secret: true },
    { id: 'twentyfortyeight', name: 'THE BIG ONE', desc: 'Make a 2048 tile.', tier: 'gold', secret: true },
    { id: 'potty', name: 'POTTY MOUTH', desc: 'Swear at the little chat bot.', tier: 'bronze', secret: true },
    { id: 'tinker', name: 'TINKERER', desc: 'Change 5 different settings.', tier: 'bronze', goal: 5 },
    { id: 'konami', name: 'OLD SCHOOL', desc: 'Enter a very famous code.', tier: 'silver', secret: true },
    { id: 'alone', name: 'LEFT ON READ', desc: 'Make the chat bot give up on you.', tier: 'bronze', secret: true },
    { id: 'existential', name: 'EXISTENTIAL DREAD', desc: 'Watch the chat bot have a crisis.', tier: 'bronze', secret: true },
    { id: 'poke', name: 'POKE', desc: 'Poke the visitor eyes a lot.', tier: 'bronze', secret: true },
    { id: 'alive', name: 'IT IS ALIVE', desc: 'Wake up the eyes.', tier: 'gold', secret: true },
    { id: 'night', name: 'NIGHT OWL', desc: 'Visit between 2am and 5am.', tier: 'bronze', secret: true },
    { id: 'commit', name: 'COMMITMENT ISSUES', desc: 'Pause the music 10 times.', tier: 'bronze', secret: true, goal: 10 },
    { id: 'spooky', name: 'SPOOKY SEASON', desc: 'Visit on Halloween.', tier: 'silver', secret: true },
    { id: 'merry', name: 'MERRY VISITOR', desc: 'Visit on Christmas.', tier: 'silver', secret: true },
    { id: 'newyear', name: 'NEW YEAR NEW YOU', desc: 'Visit on New Year.', tier: 'silver', secret: true },
    { id: 'valentine', name: 'LOVE IS IN THE AIR', desc: 'Visit on Valentine’s Day.', tier: 'silver', secret: true },
    { id: 'spin', name: 'RIGHT ROUND', desc: 'Hold on to the album cover for a while.', tier: 'bronze', secret: true },
    { id: 'ouch', name: 'THAT IS MY FACE', desc: 'Poke the chat bot until it complains.', tier: 'bronze', secret: true },
    { id: 'mutiny', name: 'MAKE UP YOUR MIND', desc: 'Mute and unmute the music over and over.', tier: 'bronze', secret: true },
    { id: 'onemore', name: 'ONE MORE TIME', desc: 'Let one song loop three times.', tier: 'silver', secret: true },
    { id: 'ghosted', name: 'GHOSTED', desc: 'Catch the ghost in October.', tier: 'silver', secret: true },
    { id: 'scare', name: 'JUMPSCARED', desc: 'Catch the escaped spider in October.', tier: 'gold', secret: true },
    { id: 'treehug', name: 'TREE HUGGER', desc: 'Give the Christmas tree a lot of attention.', tier: 'silver', secret: true },
    { id: 'rare', name: 'ONE IN A BILLION', desc: 'See the second intro.', tier: 'rare', secret: true, note: DM },
    { id: 'plat', name: 'PLATINUM', desc: 'Earn every trophy (except the one in a billion).', tier: 'plat' }
  ];
  var BD = (DW.eggs && DW.eggs.birthday) || null;
  if (BD && BD.m && BD.d) DEFS.splice(DEFS.length - 1, 0, { id: 'birthday', name: 'CAKE DAY', desc: 'Visit on a very special day.', tier: 'gold', secret: true });
  var TIERS = { bronze: 'BRONZE', silver: 'SILVER', gold: 'GOLD', plat: 'PLATINUM', rare: 'RARE' };
  DEFS.forEach(function (d) { if (!TIERS[d.tier]) d.tier = 'bronze'; });
  var byId = {};
  DEFS.forEach(function (d) { byId[d.id] = d; });
  T.defs = DEFS;
  T.tiers = TIERS;

  function subCount() {
    var n = 0;
    DW.menu.forEach(function (c) { n += Object.keys(c.subs).length; });
    return n;
  }
  function goalOf(d) { return typeof d.goal === 'function' ? d.goal() : d.goal; }
  function D() { return St.d; }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function icon(d, locked) {
    var i = new Image(), tries = locked ? ['icons/locked.png'] : d.tier === 'plat' ? ['icons/plat.png', 'icons/platinum.png'] : ['icons/' + d.tier + '.png'];
    i.className = 'tr-ic';
    i.alt = '';
    i.addEventListener('error', function () {
      tries.shift();
      if (tries.length) i.src = tries[0]; else i.style.visibility = 'hidden';
    });
    i.src = tries[0];
    return i;
  }


  T.has = function (id) { return !!D().t[id]; };
  T.count = function () { return Object.keys(D().t).length; };

  function platCheck() {
    if (T.has('plat')) return;
    for (var i = 0; i < DEFS.length; i++) {
      var d = DEFS[i];
      if (d.id !== 'plat' && d.id !== 'rare' && !T.has(d.id)) return;
    }
    T.award('plat');
  }

  T.award = function (id) {
    var d = byId[id];
    if (!d || T.has(id)) return false;
    D().t[id] = Date.now();
    St.save();
    queue.push(d);
    pump();
    refresh();
    platCheck();
    return true;
  };

  function setOf(id) { var c = D().c; if (!c[id] || typeof c[id] !== 'object') c[id] = {}; return c[id]; }
  T.mark = function (id, key) {
    var d = byId[id];
    if (!d || T.has(id)) return;
    var s = setOf(id);
    key = String(key);
    if (s[key]) return;
    s[key] = 1;
    St.save();
    if (Object.keys(s).length >= goalOf(d)) T.award(id);
    else refresh();
  };
  T.bump = function (id, n) {
    var d = byId[id];
    if (!d || T.has(id)) return;
    var c = D().c;
    c[id] = (+c[id] || 0) + (n || 1);
    St.save();
    if (c[id] >= goalOf(d)) T.award(id);
    else refresh();
  };
  T.progress = function (id) {
    var d = byId[id], v = D().c[id];
    if (!d || !goalOf(d)) return null;
    if (T.has(id)) return goalOf(d) + '/' + goalOf(d);
    var n = v && typeof v === 'object' ? Object.keys(v).length : (+v || 0);
    return Math.min(n, goalOf(d)) + '/' + goalOf(d);
  };

  var sfx = null, wanted = 0, warned = false;
  function warn(msg) { if (!warned) { warned = true; console.warn('[dweeb] trophy sound: ' + msg); } }
  function prep() {
    var cfg = DW.trophyCfg || {};
    if (sfx || !cfg.sfx) return;
    sfx = new Audio();
    sfx.preload = 'auto';
    sfx.addEventListener('error', function () {
      fetch(cfg.sfx, { cache: 'no-store' }).then(function (r) {
        warn(r.ok ? cfg.sfx + ' is there but the browser cannot play it. re-export it as a real mp3 (not a renamed wav/m4a)' : cfg.sfx + ' not found (HTTP ' + r.status + '). it must be at exactly ' + cfg.sfx);
      }).catch(function () {});
    });
    sfx.src = cfg.sfx;
    try { sfx.load(); } catch (e) {}
  }
  function fire() {
    var cfg = DW.trophyCfg || {};
    if (!sfx) return;
    try {
      sfx.volume = cfg.volume >= 0 && cfg.volume <= 1 ? cfg.volume : 0.8;
      if (sfx.readyState > 0) sfx.currentTime = 0;
      var p = sfx.play();
      if (p && p.catch) p.catch(function () { wanted = Date.now(); });
    } catch (e) { wanted = Date.now(); }
  }
  function sound() { if (DW.set && DW.set.get('sfx') === false) return; prep(); fire(); }
  function gesture() { prep(); if (wanted && Date.now() - wanted < 8000) { wanted = 0; fire(); } }
  addEventListener('pointerdown', gesture, true);
  addEventListener('keydown', gesture, true);

  var queue = [], showing = false, toastEl;
  function pump() {
    if (showing || !queue.length || !toastEl) return;
    if (!document.body.classList.contains('live')) { setTimeout(pump, 600); return; }
    showing = true;
    var d = queue.shift();
    toastEl.textContent = '';
    toastEl.className = 'tier-' + d.tier;
    var ic = el('div', 'tt-ic');
    ic.appendChild(icon(d, false));
    var tx = el('div', 'tt-tx');
    tx.appendChild(el('small', null, TIERS[d.tier] + ' TROPHY UNLOCKED'));
    tx.appendChild(el('b', null, d.name));
    tx.appendChild(el('span', null, d.desc));
    if (d.note) tx.appendChild(el('em', null, d.note));
    toastEl.appendChild(ic);
    toastEl.appendChild(tx);
    toastEl.hidden = false;
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    sound();
    setTimeout(function () {
      toastEl.classList.remove('show');
      setTimeout(function () { showing = false; toastEl.hidden = true; pump(); }, 500);
    }, d.note ? 11000 : 4800);
  }

  var win, listEl, sumEl, barEl, saveEl, tabs = {}, curTab = 'trophies';

  function fmtTime(sec) {
    sec = Math.round(sec);
    var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60;
    return h ? h + 'h ' + m + 'm' : m + 'm ' + (sec % 60) + 's';
  }
  function fmtDate(ts) {
    try { return new Date(ts).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch (e) { return ''; }
  }

  function row(d) {
    var got = T.has(d.id), hidden = d.secret && !got;
    var r = el('div', 'tr' + (got ? ' got' : '') + (hidden ? ' sec' : ''));
    var ic = el('div', 'tr-i');
    ic.appendChild(icon(d, !got));
    var tx = el('div', 'tr-t');
    tx.appendChild(el('b', null, hidden ? '???' : d.name));
    tx.appendChild(el('span', null, hidden ? '???' : d.desc));
    if (got && d.note) tx.appendChild(el('em', null, d.note));
    var side = el('div', 'tr-s');
    if (got) side.textContent = fmtDate(D().t[d.id]);
    else if (!hidden && goalOf(d)) side.textContent = T.progress(d.id);
    r.appendChild(ic);
    r.appendChild(tx);
    r.appendChild(side);
    return r;
  }

  function buildTrophies() {
    var n = T.count(), total = DEFS.length;
    var per = ['bronze', 'silver', 'gold', 'plat', 'rare'].map(function (t) {
      var all = DEFS.filter(function (d) { return d.tier === t; });
      return TIERS[t] + ' ' + all.filter(function (d) { return T.has(d.id); }).length + '/' + all.length;
    });
    sumEl.textContent = n + ' / ' + total + ' TROPHIES  -  ' + per.join('  ');
    barEl.firstChild.style.width = Math.round(n / total * 100) + '%';
    listEl.textContent = '';
    var list = DEFS.slice().sort(function (a, b) {
      var ra = T.has(a.id) ? 0 : a.secret ? 2 : 1, rb = T.has(b.id) ? 0 : b.secret ? 2 : 1;
      return ra - rb;
    });
    list.forEach(function (d) { listEl.appendChild(row(d)); });
  }

  function stat(label, value) {
    var r = el('div', 'sv');
    r.appendChild(el('span', null, label));
    r.appendChild(el('b', null, String(value)));
    return r;
  }

  function buildSave() {
    var s = D().s, g = D().g, i, top = '-', topN = 0, plays = 0;
    saveEl.textContent = '';
    DW.tracks.forEach(function (t) {
      var n = s.plays[t.file] || 0;
      plays += n;
      if (n > topN) { topN = n; top = t.title; }
    });
    var best = [];
    if (DW.games) DW.games.list.forEach(function (gm) {
      var e = g[gm.id];
      if (e && e.plays) best.push([gm.name, (e.best || 0) + '  (' + e.plays + ' plays)']);
    });
    var grid = el('div', 'sv-grid');
    grid.appendChild(stat('VISITS', DW.visits || 1));
    grid.appendChild(stat('FIRST VISIT', fmtDate(s.first)));
    grid.appendChild(stat('TIME ON SITE', fmtTime(s.time)));
    grid.appendChild(stat('THIS VISIT', fmtTime(T.session())));
    grid.appendChild(stat('SONGS HEARD', plays));
    grid.appendChild(stat('MOST PLAYED', top.length > 22 ? top.slice(0, 21) + '…' : top));
    grid.appendChild(stat('KEYS PRESSED', s.keys));
    grid.appendChild(stat('CLICKS', s.clicks));
    grid.appendChild(stat('TROPHIES', T.count() + '/' + DEFS.length));
    saveEl.appendChild(grid);

    var h = el('h3', null, 'GAME SCORES');
    saveEl.appendChild(h);
    if (!best.length) saveEl.appendChild(el('div', 'empty', 'no games played yet'));
    else {
      var g2 = el('div', 'sv-grid');
      best.forEach(function (b) { g2.appendChild(stat(b[0], b[1])); });
      saveEl.appendChild(g2);
    }

    var mem = el('div', 'mem');
    mem.appendChild(el('span', null, 'MEMORY STICK'));
    var bar = el('div', 'bar2');
    bar.appendChild(el('i'));
    bar.firstChild.style.width = Math.round(T.count() / DEFS.length * 100) + '%';
    mem.appendChild(bar);
    saveEl.appendChild(mem);

    var rs = el('button', 'tab-go warn', 'DELETE SAVE DATA');
    rs.type = 'button';
    var armed = 0;
    rs.addEventListener('click', function () {
      if (!armed) {
        armed = 1;
        rs.textContent = 'REALLY DELETE EVERYTHING? CLICK AGAIN';
        setTimeout(function () { armed = 0; rs.textContent = 'DELETE SAVE DATA'; }, 4000);
        return;
      }
      St.reset();
      DW.toast('save data deleted');
      refresh();
    });
    saveEl.appendChild(rs);
    saveEl.appendChild(el('p', 'tip', 'everything above is stored only in this browser. nothing is sent anywhere.'));
  }

  function refresh() {
    if (!win || !win.isOpen) return;
    if (curTab === 'trophies') buildTrophies(); else buildSave();
  }

  function pick(name) {
    curTab = name;
    Object.keys(tabs).forEach(function (k) { tabs[k].classList.toggle('on', k === name); });
    listEl.parentNode.hidden = name !== 'trophies';
    saveEl.hidden = name !== 'save';
    if (name === 'trophies') buildTrophies(); else buildSave();
  }

  var born = Date.now(), sessionSec = 0;
  T.session = function () { return sessionSec; };

  function tickTime() {
    if (document.hidden || !document.body.classList.contains('live')) return;
    D().s.time += 10;
    sessionSec += 10;
    St.save();
    if (sessionSec >= 1800) T.award('longhaul');
  }

  T.open = function (tab) { win.open(); pick(tab || curTab); };

  T.init = function () {
    toastEl = el('div');
    toastEl.id = 'trophy';
    toastEl.hidden = true;
    toastEl.setAttribute('role', 'status');
    (document.getElementById('app') || document.body).appendChild(toastEl);

    win = DW.win('trophies', 'TROPHIES');
    var tb = el('div', 'tabs');
    [['trophies', 'TROPHIES'], ['save', 'SAVE DATA']].forEach(function (p) {
      var b = el('button', 'tab', p[1]);
      b.type = 'button';
      b.addEventListener('click', function () { pick(p[0]); b.blur(); });
      tabs[p[0]] = b;
      tb.appendChild(b);
    });
    win.body.appendChild(tb);
    var wrap = el('div', 'tr-wrap');
    sumEl = el('div', 'tr-sum');
    barEl = el('div', 'bar2');
    barEl.appendChild(el('i'));
    listEl = el('div', 'tr-list');
    wrap.appendChild(sumEl);
    wrap.appendChild(barEl);
    wrap.appendChild(listEl);
    win.body.appendChild(wrap);
    saveEl = el('div', 'sv');
    saveEl.hidden = true;
    win.body.appendChild(saveEl);
    win.onopen = function () { pick(curTab); };

    var btn = el('button', 'tbtn');
    btn.id = 'b-trophy';
    btn.type = 'button';
    btn.title = 'trophies and save data';
    var bsrc = (DW.icons || {}).trophies;
    if (bsrc) {
      var bi = new Image();
      bi.src = bsrc;
      bi.alt = '';
      btn.appendChild(bi);
    }
    else btn.classList.add('noic');
    var tl = el('span', null, 'TROPHIES');
    tl.setAttribute('data-s', 'TRO');
    btn.appendChild(tl);
    btn.addEventListener('click', function () { win.toggle(); btn.blur(); });
    var bar = document.getElementById('status');
    bar.insertBefore(btn, document.getElementById('b-help') || document.getElementById('views-wrap'));

    var s = D().s;
    if (!s.first) s.first = Date.now();
    addEventListener('keydown', function (e) { if (!e.repeat) { D().s.keys++; St.save(); } }, true);
    addEventListener('pointerdown', function () { D().s.clicks++; St.save(); }, true);
    setInterval(tickTime, 10000);

    var vis = DW.visits || 1;
    D().c.regular = Math.max(+D().c.regular || 0, vis);
    D().c.devoted = Math.max(+D().c.devoted || 0, vis);
    if (vis >= 5) T.award('regular');
    if (vis >= 20) T.award('devoted');
    var hr = new Date().getHours();
    if (hr >= 2 && hr < 5) T.award('night');

    var last = 0, lastFile = '', counted = false, prevPlaying = false;
    A.on('track', function (t) { last = 0; lastFile = t.file; counted = false; });
    A.on('time', function () {
      var t = A.current(), now = A.el.currentTime;
      if (!t || !A.playing) { last = now; return; }
      var dt = now - last;
      last = now;
      if (dt > 0 && dt < 1.6) {
        var sec = D().s.sec;
        sec[t.file] = (sec[t.file] || 0) + dt;
        var dur = A.el.duration;
        if (!counted && isFinite(dur) && dur > 0 && sec[t.file] >= Math.min(dur * 0.7, 90)) {
          counted = true;
          D().s.plays[t.file] = (D().s.plays[t.file] || 0) + 1;
          sec[t.file] = 0;
          T.mark('dj', t.file);
        }
      }
    });
    A.on('state', function () {
      if (prevPlaying && !A.playing && !A.el.ended && !document.body.classList.contains('gaming')) T.bump('commit', 1);
      prevPlaying = A.playing;
    });

    if (DW.season && DW.season.trophy && !DW.season.forced) T.award(DW.season.trophy);
    T.award('welcome');
  };
})();
