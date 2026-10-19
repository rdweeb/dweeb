(function(){
var DW = window.DW;
var A = DW.audio;
var St = DW.store;
var T = {};
DW.trophy = T;

var DM = 'DM me this achievement being unlocked and I might give you a prize';

// goal = how many of something it takes (a number, or a function that works it out)
// secret = hidden in the list until you get it
var DEFS = [
  { id: 'welcome', name: 'HELLO WORLD', desc: 'Enter the site.', tier: 'bronze' },
  { id: 'dj', name: 'FULL ALBUM', desc: 'Listen to every song on the playlist.', tier: 'gold', goal: function(){ return DW.tracks.length; } },
  { id: 'tourist', name: 'TOURIST', desc: 'Open every site in the menu.', tier: 'gold', goal: function(){ return subCount(); } },
  { id: 'hopper', name: 'CHANNEL SURFER', desc: 'Visit every category.', tier: 'silver', goal: function(){ return DW.menu.length; } },
  { id: 'regular', name: 'REGULAR', desc: 'Visit the site 5 times.', tier: 'silver', goal: 5 },
  { id: 'devoted', name: 'DEVOTED', desc: 'Visit the site 20 times.', tier: 'gold', goal: 20 },
  { id: 'longhaul', name: 'SETTLE IN', desc: 'Stay for 30 minutes in one visit.', tier: 'silver', goal: 30 },
  { id: 'arcade', name: 'ARCADE KID', desc: 'Play every game in the games tab.', tier: 'silver', goal: function(){ return DW.games ? DW.games.list.length : 6; } },
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

// birthday trophy only exists if a birthday is set in the config (goes in before platinum)
var BD = (DW.eggs && DW.eggs.birthday) || null;
if (BD && BD.m && BD.d) {
  DEFS.splice(DEFS.length - 1, 0, { id: 'birthday', name: 'CAKE DAY', desc: 'Visit on a very special day.', tier: 'gold', secret: true });
}

var TIERS = { bronze: 'BRONZE', silver: 'SILVER', gold: 'GOLD', plat: 'PLATINUM', rare: 'RARE' };
var byId = {};
for (var i = 0; i < DEFS.length; i++) {
  if (!TIERS[DEFS[i].tier]) { DEFS[i].tier = 'bronze'; }
  byId[DEFS[i].id] = DEFS[i];
}
T.defs = DEFS;
T.tiers = TIERS;

// how many links there are in the whole menu
function subCount(){
  var n = 0;
  for (var k = 0; k < DW.menu.length; k++) {
    n += Object.keys(DW.menu[k].subs || {}).length;
  }
  return n;
}

function goalOf(d){
  if (typeof d.goal == 'function') { return d.goal(); }
  return d.goal;
}

function data(){
  if (!St.d.t || !St.d.c || !St.d.s) { ensure(); }
  return St.d;
}

function makeEl(tag, cls, txt){
  var e = document.createElement(tag);
  if (cls) { e.className = cls; }
  if (txt !== undefined) { e.textContent = txt; }
  return e;
}

// make sure the saved data has everything we read from it
function ensure(){
  var d = St.d;
  if (!d.t) { d.t = {}; }
  if (!d.c) { d.c = {}; }
  if (!d.g) { d.g = {}; }
  if (!d.s) { d.s = {}; }
  var s = d.s;
  if (!s.first) { s.first = 0; }
  if (!s.time) { s.time = 0; }
  if (!s.keys) { s.keys = 0; }
  if (!s.clicks) { s.clicks = 0; }
  if (!s.plays) { s.plays = {}; }
  if (!s.sec) { s.sec = {}; }
}

// trophy picture. falls back to other files, then hides if none work
function icon(d, locked){
  var i = new Image();
  var tries;
  if (locked) { tries = ['icons/locked.png']; }
  else if (d.tier == 'plat') { tries = ['icons/plat.png', 'icons/platinum.png']; }
  else { tries = ['icons/' + d.tier + '.png']; }
  i.className = 'tr-ic';
  i.alt = '';
  i.addEventListener('error', function(){
    tries.shift();
    if (tries.length) { i.src = tries[0]; }
    else { i.style.visibility = 'hidden'; }
  });
  i.src = tries[0];
  return i;
}

T.has = function(id){
  return data().t[id] ? true : false;
};

T.count = function(){
  return Object.keys(data().t).length;
};

// got everything (except platinum itself and the rare one)? then platinum
function platCheck(){
  if (T.has('plat')) { return; }
  for (var i = 0; i < DEFS.length; i++) {
    var d = DEFS[i];
    if (d.id != 'plat' && d.id != 'rare' && !T.has(d.id)) { return; }
  }
  T.award('plat');
}

var queue = [];       // trophies waiting to pop up
var showing = false;
var toastEl;

T.award = function(id){
  var d = byId[id];
  if (!d || T.has(id)) { return false; }
  data().t[id] = Date.now();
  St.save();
  queue.push(d);
  pump();
  refresh();
  platCheck();
  return true;
};

// for "do this with N different things" trophies. keeps a set of the things done
function setOf(id){
  var c = data().c;
  if (!c[id] || typeof c[id] != 'object') { c[id] = {}; }
  return c[id];
}

T.mark = function(id, key){
  var d = byId[id];
  if (!d || T.has(id)) { return; }
  var s = setOf(id);
  key = String(key);
  if (s[key]) { return; }
  s[key] = 1;
  St.save();
  if (Object.keys(s).length >= goalOf(d)) { T.award(id); }
  else { refresh(); }
};

// for "do this N times" trophies
T.bump = function(id, n){
  var d = byId[id];
  if (!d || T.has(id)) { return; }
  var c = data().c;
  c[id] = (Number(c[id]) || 0) + (n || 1);
  St.save();
  if (c[id] >= goalOf(d)) { T.award(id); }
  else { refresh(); }
};

// "3/10" style text, or null if it has no goal
T.progress = function(id){
  var d = byId[id];
  var v = data().c[id];
  if (!d || !goalOf(d)) { return null; }
  if (T.has(id)) { return goalOf(d) + '/' + goalOf(d); }
  var n;
  if (v && typeof v == 'object') { n = Object.keys(v).length; }
  else { n = Number(v) || 0; }
  return Math.min(n, goalOf(d)) + '/' + goalOf(d);
};

/* ---------- the unlock sound ---------- */

var sfx = null;
var wanted = 0;      // time a sound was blocked by autoplay rules, to play on the next tap
var warned = false;

function warn(msg){
  if (!warned) {
    warned = true;
    console.warn('[dweeb] trophy sound: ' + msg);
  }
}

function prep(){
  var cfg = DW.trophyCfg || {};
  if (sfx || !cfg.sfx) { return; }
  sfx = new Audio();
  sfx.preload = 'auto';
  // if it wont load, check why so the message is useful
  sfx.addEventListener('error', function(){
    fetch(cfg.sfx, { cache: 'no-store' }).then(function(r){
      if (r.ok) { warn(cfg.sfx + ' is there but the browser cannot play it. re-export it as a real mp3 (not a renamed wav/m4a)'); }
      else { warn(cfg.sfx + ' not found (HTTP ' + r.status + '). it must be at exactly ' + cfg.sfx); }
    }).catch(function(){});
  });
  sfx.src = cfg.sfx;
  try { sfx.load(); } catch(e) {}
}

function fire(){
  var cfg = DW.trophyCfg || {};
  if (!sfx) { return; }
  try {
    if (cfg.volume >= 0 && cfg.volume <= 1) { sfx.volume = cfg.volume; }
    else { sfx.volume = 0.8; }
    if (sfx.readyState > 0) { sfx.currentTime = 0; }
    var p = sfx.play();
    if (p && p.catch) { p.catch(function(){ wanted = Date.now(); }); }
  } catch(e) {
    wanted = Date.now();
  }
}

function sound(){
  if (DW.set && DW.set.get('sfx') === false) { return; }
  prep();
  fire();
}

// the first tap or key lets us load the sound, and play one that was blocked
function gesture(){
  prep();
  if (wanted && Date.now() - wanted < 8000) {
    wanted = 0;
    fire();
  }
}
addEventListener('pointerdown', gesture, true);
addEventListener('keydown', gesture, true);

/* ---------- the popup ---------- */

function pump(){
  if (showing || !queue.length || !toastEl) { return; }
  // wait until the intro is over
  if (!document.body.classList.contains('live')) {
    setTimeout(pump, 600);
    return;
  }
  showing = true;
  var d = queue.shift();
  toastEl.textContent = '';
  toastEl.className = 'tier-' + d.tier;

  var ic = makeEl('div', 'tt-ic');
  ic.appendChild(icon(d, false));
  var tx = makeEl('div', 'tt-tx');
  tx.appendChild(makeEl('small', null, TIERS[d.tier] + ' TROPHY UNLOCKED'));
  tx.appendChild(makeEl('b', null, d.name));
  tx.appendChild(makeEl('span', null, d.desc));
  if (d.note) { tx.appendChild(makeEl('em', null, d.note)); }
  toastEl.appendChild(ic);
  toastEl.appendChild(tx);
  toastEl.hidden = false;
  void toastEl.offsetWidth;   // lets the slide-in animation restart
  toastEl.classList.add('show');
  sound();

  var stay = 4800;
  if (d.note) { stay = 11000; }
  setTimeout(function(){
    toastEl.classList.remove('show');
    setTimeout(function(){
      showing = false;
      toastEl.hidden = true;
      pump();
    }, 500);
  }, stay);
}

/* ---------- the window ---------- */

var win, listEl, sumEl, barEl, saveEl;
var tabs = {};
var curTab = 'trophies';

function fmtTime(sec){
  sec = Math.round(sec);
  var h = Math.floor(sec / 3600);
  var m = Math.floor(sec / 60) % 60;
  if (h) { return h + 'h ' + m + 'm'; }
  return m + 'm ' + (sec % 60) + 's';
}

function fmtDate(ts){
  try {
    return new Date(ts).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  } catch(e) {
    return '';
  }
}

function row(d){
  var got = T.has(d.id);
  var hidden = d.secret && !got;
  var cls = 'tr';
  if (got) { cls = cls + ' got'; }
  if (hidden) { cls = cls + ' sec'; }
  var r = makeEl('div', cls);

  var ic = makeEl('div', 'tr-i');
  ic.appendChild(icon(d, !got));
  var tx = makeEl('div', 'tr-t');
  tx.appendChild(makeEl('b', null, hidden ? '???' : d.name));
  tx.appendChild(makeEl('span', null, hidden ? '???' : d.desc));
  if (got && d.note) { tx.appendChild(makeEl('em', null, d.note)); }

  var side = makeEl('div', 'tr-s');
  if (got) { side.textContent = fmtDate(data().t[d.id]); }
  else if (!hidden && goalOf(d)) { side.textContent = T.progress(d.id); }

  r.appendChild(ic);
  r.appendChild(tx);
  r.appendChild(side);
  return r;
}

// got first, then normal locked ones, then secret ones
function sortRank(d){
  if (T.has(d.id)) { return 0; }
  if (d.secret) { return 2; }
  return 1;
}

function buildTrophies(){
  var n = T.count();
  var total = DEFS.length;

  var per = [];
  var order = ['bronze', 'silver', 'gold', 'plat', 'rare'];
  for (var t = 0; t < order.length; t++) {
    var inTier = 0;
    var gotTier = 0;
    for (var j = 0; j < DEFS.length; j++) {
      if (DEFS[j].tier == order[t]) {
        inTier++;
        if (T.has(DEFS[j].id)) { gotTier++; }
      }
    }
    per.push(TIERS[order[t]] + ' ' + gotTier + '/' + inTier);
  }
  sumEl.textContent = n + ' / ' + total + ' TROPHIES  -  ' + per.join('  ');
  barEl.firstChild.style.width = Math.round(n / total * 100) + '%';

  listEl.textContent = '';
  var list = DEFS.slice().sort(function(a, b){ return sortRank(a) - sortRank(b); });
  for (var k = 0; k < list.length; k++) { listEl.appendChild(row(list[k])); }
}

function stat(label, value){
  var r = makeEl('div', 'sv');
  r.appendChild(makeEl('span', null, label));
  r.appendChild(makeEl('b', null, String(value)));
  return r;
}

function buildSave(){
  var s = data().s;
  var g = data().g;
  var top = '-';
  var topN = 0;
  var plays = 0;
  saveEl.textContent = '';

  for (var i = 0; i < DW.tracks.length; i++) {
    var t = DW.tracks[i];
    var n = s.plays[t.file] || 0;
    plays += n;
    if (n > topN) {
      topN = n;
      top = t.title;
    }
  }

  // best score for each game that was played
  var best = [];
  if (DW.games) {
    for (var j = 0; j < DW.games.list.length; j++) {
      var gm = DW.games.list[j];
      var e = g[gm.id];
      if (e && e.plays) { best.push([gm.name, (e.best || 0) + '  (' + e.plays + ' plays)']); }
    }
  }

  var grid = makeEl('div', 'sv-grid');
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

  saveEl.appendChild(makeEl('h3', null, 'GAME SCORES'));
  if (!best.length) {
    saveEl.appendChild(makeEl('div', 'empty', 'no games played yet'));
  } else {
    var grid2 = makeEl('div', 'sv-grid');
    for (var b = 0; b < best.length; b++) { grid2.appendChild(stat(best[b][0], best[b][1])); }
    saveEl.appendChild(grid2);
  }

  var mem = makeEl('div', 'mem');
  mem.appendChild(makeEl('span', null, 'MEMORY STICK'));
  var bar = makeEl('div', 'bar2');
  bar.appendChild(makeEl('i'));
  bar.firstChild.style.width = Math.round(T.count() / DEFS.length * 100) + '%';
  mem.appendChild(bar);
  saveEl.appendChild(mem);

  // delete button needs two clicks
  var rs = makeEl('button', 'tab-go warn', 'DELETE SAVE DATA');
  rs.type = 'button';
  var armed = false;
  rs.addEventListener('click', function(){
    if (!armed) {
      armed = true;
      rs.textContent = 'REALLY DELETE EVERYTHING? CLICK AGAIN';
      setTimeout(function(){
        armed = false;
        rs.textContent = 'DELETE SAVE DATA';
      }, 4000);
      return;
    }
    St.reset();
    ensure();
    DW.toast('save data deleted');
    refresh();
  });
  saveEl.appendChild(rs);
  saveEl.appendChild(makeEl('p', 'tip', 'everything above is stored only in this browser. nothing is sent anywhere.'));
}

function refresh(){
  if (!win || !win.isOpen) { return; }
  if (curTab == 'trophies') { buildTrophies(); } else { buildSave(); }
}

function pickTab(name){
  curTab = name;
  var names = Object.keys(tabs);
  for (var i = 0; i < names.length; i++) {
    tabs[names[i]].classList.toggle('on', names[i] == name);
  }
  listEl.parentNode.hidden = (name != 'trophies');
  saveEl.hidden = (name != 'save');
  if (name == 'trophies') { buildTrophies(); } else { buildSave(); }
}

/* ---------- time on the site ---------- */

var sessionSec = 0;
T.session = function(){ return sessionSec; };

// runs every 10 seconds
function tickTime(){
  if (document.hidden || !document.body.classList.contains('live')) { return; }
  data().s.time += 10;
  sessionSec += 10;
  St.save();
  if (sessionSec >= 1800) { T.award('longhaul'); }
}

T.open = function(tab){
  win.open();
  pickTab(tab || curTab);
};

function tabButton(name, label, bar){
  var b = makeEl('button', 'tab', label);
  b.type = 'button';
  b.addEventListener('click', function(){
    pickTab(name);
    b.blur();
  });
  tabs[name] = b;
  bar.appendChild(b);
}

T.init = function(){
  ensure();

  toastEl = makeEl('div');
  toastEl.id = 'trophy';
  toastEl.hidden = true;
  toastEl.setAttribute('role', 'status');
  (document.getElementById('app') || document.body).appendChild(toastEl);

  // window with two tabs
  win = DW.win('trophies', 'TROPHIES');
  var tb = makeEl('div', 'tabs');
  tabButton('trophies', 'TROPHIES', tb);
  tabButton('save', 'SAVE DATA', tb);
  win.body.appendChild(tb);

  var wrap = makeEl('div', 'tr-wrap');
  sumEl = makeEl('div', 'tr-sum');
  barEl = makeEl('div', 'bar2');
  barEl.appendChild(makeEl('i'));
  listEl = makeEl('div', 'tr-list');
  wrap.appendChild(sumEl);
  wrap.appendChild(barEl);
  wrap.appendChild(listEl);
  win.body.appendChild(wrap);

  saveEl = makeEl('div', 'sv');
  saveEl.hidden = true;
  win.body.appendChild(saveEl);
  win.onopen = function(){ pickTab(curTab); };

  // status bar button
  var btn = makeEl('button', 'tbtn');
  btn.id = 'b-trophy';
  btn.type = 'button';
  btn.title = 'trophies and save data';
  var bsrc = (DW.icons || {}).trophies;
  if (bsrc) {
    var bi = new Image();
    bi.src = bsrc;
    bi.alt = '';
    btn.appendChild(bi);
  } else {
    btn.classList.add('noic');
  }
  var tl = makeEl('span', null, 'TROPHIES');
  tl.setAttribute('data-s', 'TRO');
  btn.appendChild(tl);
  btn.addEventListener('click', function(){
    win.toggle();
    btn.blur();
  });
  var bar = document.getElementById('status');
  if (bar) {
    bar.insertBefore(btn, document.getElementById('b-help') || document.getElementById('views-wrap'));
  }

  // counting keys, clicks and time
  var s = data().s;
  if (!s.first) { s.first = Date.now(); }
  addEventListener('keydown', function(e){
    if (!e.repeat) {
      data().s.keys++;
      St.save();
    }
  }, true);
  addEventListener('pointerdown', function(){
    data().s.clicks++;
    St.save();
  }, true);
  setInterval(tickTime, 10000);

  // visit trophies
  var vis = DW.visits || 1;
  data().c.regular = Math.max(Number(data().c.regular) || 0, vis);
  data().c.devoted = Math.max(Number(data().c.devoted) || 0, vis);
  if (vis >= 5) { T.award('regular'); }
  if (vis >= 20) { T.award('devoted'); }
  var hr = new Date().getHours();
  if (hr >= 2 && hr < 5) { T.award('night'); }

  // listening to songs: a song counts once you heard 70% of it (or 90s)
  var last = 0;
  var counted = false;
  var prevPlaying = false;
  A.on('track', function(t){
    last = 0;
    counted = false;
  });
  A.on('time', function(){
    var t = A.current();
    var now = A.el.currentTime;
    if (!t || !A.playing) {
      last = now;
      return;
    }
    var dt = now - last;
    last = now;
    // a jump (seeking) is not listening
    if (dt > 0 && dt < 1.6) {
      var sec = data().s.sec;
      sec[t.file] = (sec[t.file] || 0) + dt;
      var dur = A.el.duration;
      if (!counted && isFinite(dur) && dur > 0 && sec[t.file] >= Math.min(dur * 0.7, 90)) {
        counted = true;
        data().s.plays[t.file] = (data().s.plays[t.file] || 0) + 1;
        sec[t.file] = 0;
        T.mark('dj', t.file);
      }
    }
  });
  A.on('state', function(){
    if (prevPlaying && !A.playing && !A.el.ended && !document.body.classList.contains('gaming')) {
      T.bump('commit', 1);
    }
    prevPlaying = A.playing;
  });

  if (DW.season && DW.season.trophy && !DW.season.forced) { T.award(DW.season.trophy); }
  T.award('welcome');
};
})();
