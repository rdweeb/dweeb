// decorations per season
(function(){
var DW = window.DW;
var F = {};
DW.seasonfx = F;
var NS = 'http://www.w3.org/2000/svg';
var root;  // the div everything gets added to

function make(tag, cls, parent){
  var e = document.createElement(tag);
  if (cls) { e.className = cls; }
  if (parent) { parent.appendChild(e); }
  return e;
}

function makeSvg(w, h, parent, cls){
  var s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  s.setAttribute('shape-rendering', 'crispEdges');
  if (cls) { s.setAttribute('class', cls); }
  if (parent) { parent.appendChild(s); }
  return s;
}

function addRect(parent, x, y, w, h, fill, cls){
  var r = document.createElementNS(NS, 'rect');
  r.setAttribute('x', x);
  r.setAttribute('y', y);
  r.setAttribute('width', w);
  r.setAttribute('height', h);
  if (fill) { r.setAttribute('fill', fill); }
  if (cls) { r.setAttribute('class', cls); }
  parent.appendChild(r);
  return r;
}

// pixel art from rows of letters. pal says which letter is which colour
function pixels(rows, pal, parent, cls){
  var s = makeSvg(rows[0].length, rows.length, parent, cls);
  for (var y = 0; y < rows.length; y++) {
    for (var x = 0; x < rows[y].length; x++) {
      var color = pal[rows[y].charAt(x)];
      if (color) { addRect(s, x, y, 1, 1, color); }
    }
  }
  return s;
}

function giveTrophy(id){
  try { if (DW.trophy) { DW.trophy.award(id); } } catch(e) {}
}

function say(t){
  try { if (DW.splashUI && DW.splashUI.say) { DW.splashUI.say(t); } } catch(e) {}
}

function randomOf(list){
  return list[Math.floor(Math.random() * list.length)];
}

// the saved counters object, or null if the store isnt there
function counters(){
  if (!DW.store || !DW.store.d) { return null; }
  if (!DW.store.d.c) { DW.store.d.c = {}; }
  return DW.store.d.c;
}

var cfg = DW.seasonFx || {};
var DIR = cfg.dir || 'seasons/';

var SCARE_CHANCE = 9;  // 1 in this many spider pokes the spider runs away
if (cfg.runChance >= 1) { SCARE_CHANCE = cfg.runChance; }
var SCARE_SFX = 'audio/jumpscare.mp3';
if (cfg.jumpscare !== undefined) { SCARE_SFX = cfg.jumpscare; }
var SCARE_VOL = 0.9;
if (cfg.volume >= 0 && cfg.volume <= 1) { SCARE_VOL = cfg.volume; }

// an image from the seasons folder
function pic(name, cls, parent, fallback){
  var i = document.createElement('img');
  i.className = cls || '';
  i.alt = '';
  i.draggable = false;
  i.addEventListener('error', function(){
    if (fallback && i.getAttribute('src') !== DIR + fallback) {
      i.src = DIR + fallback;
      return;
    }
    i.style.visibility = 'hidden';
  });
  i.src = DIR + name;
  if (parent) { parent.appendChild(i); }
  return i;
}

// load an image again (so a gif plays from the start)
function restart(i, name, fallback){
  i.style.visibility = '';
  i.dataset.f = fallback || '';
  i.src = DIR + name + '?' + Date.now();
}

/* halloween */
function scareOff(){
  if (DW.set && DW.set.get('scare') === false) { return true; }
  return false;
}

function gaming(){
  return document.body.classList.contains('gaming');
}

function spider(){
  var wrap = make('div', 'sp-wrap', root);
  var thread = make('div', 'sp-thread', wrap);
  var body = make('div', 'sp-body', wrap);
  var im = pic('spider.png', 'sp-img', body);

  var rest = 54;  // thread length when hanging at the top
  var len = rest;
  var state = 'idle';  // idle, fall, bounce, hang, climb, run
  var t0 = 0;
  var from = 0;
  var to = 0;
  var dur = 0;
  var raf = 0;
  var runaway = false;  // true on the pokes where it breaks free

  function put(v){
    len = v;
    thread.style.height = v + 'px';
    body.style.top = v + 'px';
  }
  put(rest);

  function maxLen(){
    return Math.max(160, Math.min(innerHeight * 0.62, 420));
  }

  // start a move from a to b over ms
  function go(st, a, b, ms){
    state = st;
    from = a;
    to = b;
    dur = ms;
    t0 = performance.now();
    wrap.classList.toggle('climb', st == 'climb');
    if (!raf) { raf = requestAnimationFrame(tick); }
  }

  function home(){
    state = 'idle';
    wrap.classList.remove('climb', 'fallen');
    put(rest);
    body.style.visibility = '';
    thread.style.visibility = '';
    im.style.visibility = '';
  }

  function tick(now){
    raf = 0;
    // wait while a game is open
    if (gaming()) {
      raf = requestAnimationFrame(tick);
      t0 += 16;
      return;
    }

    var k = Math.min(1, (now - t0) / dur);
    var v;
    if (state == 'fall') {
      v = from + (to - from) * k * k;
      if (k >= 1) { go('bounce', to, to, 650); return; }
    } else if (state == 'bounce') {
      v = to - Math.abs(Math.sin(k * 9)) * (1 - k) * 46;
      if (k >= 1) { go('hang', to, to, 900); return; }
    } else if (state == 'hang') {
      v = to;
      if (k >= 1) {
        if (runaway) {
          runaway = false;
          if (!scareOff()) {
            breakFree();
            return;
          }
        }
        go('climb', to, rest, Math.max(3500, (to - rest) * 22));
        return;
      }
    } else if (state == 'climb') {
      v = from + (to - from) * k + Math.sin(k * 26) * 1.6;
      if (k >= 1) { home(); return; }
    } else {
      return;
    }
    put(v);
    raf = requestAnimationFrame(tick);
  }

  // the spider snaps its thread and runs around the screen
  function breakFree(){
    state = 'run';
    var r = body.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    body.style.visibility = 'hidden';
    wrap.classList.remove('fallen');
    put(rest);
    thread.style.visibility = 'visible';

    var run = make('div', 'sp-run', root);
    pic('spider.png', 'sp-runimg', run);
    var ang = Math.random() * 6.283;
    var sp = 2.6;
    var born = performance.now();
    var last = born;
    var fleeing = false;  // after 22s it runs off the top
    var dead = false;

    function place(){
      run.style.left = x + 'px';
      run.style.top = y + 'px';
      run.style.transform = 'translate(-50%, -50%) rotate(' + (ang + 1.5708) + 'rad)';
    }
    place();

    function step(now){
      if (dead) { return; }
      // season was switched off while it was running
      if (!document.body.contains(run)) {
        dead = true;
        return;
      }
      var dt = Math.min(3, (now - last) / 16.7);
      last = now;
      if (gaming()) {
        requestAnimationFrame(step);
        return;
      }

      if (!fleeing && now - born > 22000) { fleeing = true; }
      if (fleeing) { ang = Math.atan2(-1, 0); }
      else if (Math.random() < 0.03) { ang += (Math.random() - 0.5) * 2.2; }

      x += Math.cos(ang) * sp * dt;
      y += Math.sin(ang) * sp * dt;

      if (!fleeing) {
        // bounce off the edges
        if (x < 20) { x = 20; ang = Math.PI - ang; }
        else if (x > innerWidth - 20) { x = innerWidth - 20; ang = Math.PI - ang; }
        if (y < 50) { y = 50; ang = -ang; }
        else if (y > innerHeight - 20) { y = innerHeight - 20; ang = -ang; }
      } else if (y < -50) {
        dead = true;
        run.remove();
        home();
        return;
      }
      place();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    // catching it = jumpscare
    run.addEventListener('pointerdown', function(e){
      e.stopPropagation();
      if (dead) { return; }
      dead = true;
      run.remove();
      jumpscare(home);
    });
  }

  function poke(){
    if (state != 'idle') { return; }
    wrap.classList.add('fallen');
    runaway = !scareOff() && Math.random() < 1 / SCARE_CHANCE;
    go('fall', len, maxLen(), 420);

    var c = counters();
    if (c) {
      c.spider = (Number(c.spider) || 0) + 1;
      DW.store.save();
    }
    if (!runaway && Math.random() < 0.5) {
      say(randomOf([
        'AAAH! the spider! ...it is fine. it is just a guy.',
        'the spider is on a strict schedule. down, then back up.',
        'he does this every day. we do not talk about it.',
        '<scared>aaaaaah!<n> ...oh. it is just the spider.'
      ]));
    }
  }

  wrap.addEventListener('pointerdown', function(e){
    e.stopPropagation();
    poke();
  });
  return wrap;
}

var scaring = false;

function jumpscare(done){
  if (scaring) { return; }
  if (scareOff()) {
    if (done) { done(); }
    return;
  }
  scaring = true;

  var ov = make('div', 'scare', document.body);
  var im = pic('jumpscare.png', 'scare-img', ov, 'spider.png');
  im.addEventListener('error', function(){
    if (im.getAttribute('src') === DIR + 'spider.png') { im.style.visibility = 'hidden'; }
  });

  if (SCARE_SFX) {
    try {
      var a = new Audio(SCARE_SFX);
      a.volume = SCARE_VOL;
      var pr = a.play();
      if (pr && pr.catch) { pr.catch(function(){}); }
    } catch(e) {}
  }

  var c = counters();
  if (c) {
    c.scares = (Number(c.scares) || 0) + 1;
    DW.store.save();
  }
  giveTrophy('scare');

  setTimeout(function(){
    ov.remove();
    scaring = false;
    if (done) { done(); }
    // the bot laughs at you a bit later
    setTimeout(function(){
      say(randomOf([
        '<wait>HAHAHAHA<n> you should have seen your face!',
        '<yell>BOO!<n> <wait2><silly>hehehe. got you.',
        'ha. HA. <glitch>HAHAHAHAHA<n> i was in on it the whole time.',
        '<sneaky>i told you not to click it.<n> <silly>hahaha',
        'did you JUMP? <wait><silly>i saw that. hahahaha'
      ]));
    }, 500);
  }, 1700);
}

function ghost(){
  var w = make('div', 'gh-wrap', root);
  pixels([
    '..wwwwww..',
    '.wwwwwwww.',
    'wwwwwwwwww',
    'wwkkwwkkww',
    'wwkkwwkkww',
    'wwwwwwwwww',
    'wwwwkkwwww',
    'wwwwwwwwww',
    'wwwwwwwwww',
    'ww.ww.ww.w'
  ], { w: '#f3ecff', k: '#3a1450' }, w, 'gh');

  w.addEventListener('pointerdown', function(e){
    e.stopPropagation();
    w.style.visibility = 'hidden';
    giveTrophy('ghosted');
    say(randomOf([
      '<spooky>boo.',
      '<spooky>you caught me. i was just passing through.',
      'the ghost has left the building. (he was shy.)'
    ]));
  });
}

function webs(){
  var corners = ['tl', 'tr', 'bl', 'br'];
  for (var i = 0; i < corners.length; i++) {
    pic('web.png', 'web ' + corners[i], root);
  }
  var note = make('div', 'web-note', root);
  note.textContent = 'idk how to fix it, ignore for now, too lazy to remove';
}

function halloween(){
  webs();
  spider();
  if (!DW.low) { ghost(); }
}

/* christmas */
function tree(){
  var wrap = make('div', 'tree-wrap', root);
  var im = pic('tree.png', 'tree', wrap);
  var n = 0;  // which picture is showing
  var hugs = 0;
  var files = ['tree.png', 'tree1.gif', 'tree2.gif', 'tree3.gif'];

  wrap.addEventListener('pointerdown', function(e){
    e.stopPropagation();
    hugs++;
    if (hugs >= 10) { giveTrophy('treehug'); }
    n = (n + 1) % files.length;
    if (n) {
      restart(im, files[n], 'tree.png');
    } else {
      im.style.visibility = '';
      im.src = DIR + 'tree.png';
    }
    if (n == 1 && Math.random() < 0.5) {
      say(randomOf([
        '<happy>pretty lights!',
        'i would hug the tree but i have no arms.',
        'it is a very good tree. 10 out of 10.'
      ]));
    }
  });

  // a gif is missing go back to the plain tree
  im.addEventListener('error', function(){
    if (/\.gif/.test(im.src)) {
      n = 0;
      im.src = DIR + 'tree.png';
      im.style.visibility = '';
    }
  });
}

function xmas(){
  tree();
  make('div', 'snow-top', root);
}

/* valentine */

// one little <3 that floats up from the big heart
function floatHeart(r, i){
  var d = document.createElement('div');
  d.className = 'hearts';
  d.textContent = '<3';
  d.style.left = r.left + Math.random() * r.width + 'px';
  d.style.top = r.top + 'px';
  d.style.animationDelay = i * 70 + 'ms';
  document.body.appendChild(d);
  setTimeout(function(){ d.remove(); }, 1500);
}

function valentine(){
  var h = make('div', 'big-heart', root);
  pixels([
    '.rr...rr.',
    'rrrr.rrrr',
    'rrwrrrrrr',
    'rrrrrrrrr',
    '.rrrrrrr.',
    '..rrrrr..',
    '...rrr...',
    '....r....'
  ], { r: '#de37e4', w: '#ffd0f6' }, h, 'hrt');

  h.addEventListener('pointerdown', function(e){
    e.stopPropagation();
    var r = h.getBoundingClientRect();
    // restart the beat animation
    h.classList.remove('beat');
    void h.offsetWidth;
    h.classList.add('beat');
    for (var i = 0; i < 7; i++) { floatHeart(r, i); }
  });
  make('div', 'bunting', root);
}

/* new year */
function newyear(){
  var t = make('div', 'ny-banner', root);
  t.textContent = '★ HAPPY NEW YEAR ★';
  make('div', 'streamers', root);
}

var rockets = [];
var sparks = [];
var nextRocket = 0;
var FWC = ['#de37e4', '#ffd34d', '#5a87d0', '#6cf0a0', '#ffffff', '#ff6b8a'];

function fireworks(c, t, w, h, d){
  // launch a new one every now and then
  if (t > nextRocket && rockets.length < 3) {
    rockets.push({
      x: w * (0.15 + Math.random() * 0.7),
      y: h,
      ty: h * (0.15 + Math.random() * 0.35),
      col: FWC[Math.floor(Math.random() * FWC.length)]
    });
    nextRocket = t + 700 + Math.random() * 1300;
  }

  var i, p;
  for (i = rockets.length - 1; i >= 0; i--) {
    p = rockets[i];
    p.y -= 5.5 * d;
    c.globalAlpha = 1;
    c.fillStyle = '#ffffff';
    c.fillRect(p.x, p.y, 2, 6);

    // reached the top = explode
    if (p.y <= p.ty) {
      var n = 34;
      if (DW.low) { n = 18; }
      for (var a = 0; a < n; a++) {
        var v = 1.2 + Math.random() * 2.6;
        sparks.push({
          x: p.x, y: p.y,
          vx: Math.cos(a / n * 6.283) * v,
          vy: Math.sin(a / n * 6.283) * v,
          life: 1, col: p.col
        });
      }
      rockets.splice(i, 1);
    }
  }

  for (i = sparks.length - 1; i >= 0; i--) {
    p = sparks[i];
    p.x += p.vx * d;
    p.y += p.vy * d;
    p.vy += 0.045 * d;  // gravity
    p.vx *= 0.99;
    p.life -= 0.014 * d;
    if (p.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    c.globalAlpha = p.life;
    c.fillStyle = p.col;
    c.fillRect(p.x, p.y, 3, 3);
  }
  c.globalAlpha = 1;
}

F.fireworks = fireworks;

F.stop = function(){
  if (root) {
    root.remove();
    root = null;
  }
};

F.start = function(id){
  if (root) { return; }
  if (DW.set && DW.set.get('seasonfx') === false) { return; }
  var app = document.getElementById('app');
  if (!app) { return; }
  root = make('div', null, app);
  root.id = 'sfx';

  if (id == 'halloween') { halloween(); }
  else if (id == 'xmas') { xmas(); }
  else if (id == 'valentine') { valentine(); }
  else if (id == 'newyear') { newyear(); }
};
})();

// add the fireworks
(function(){
  var DW = window.DW;
  var S = DW.season;
  var F = DW.seasonfx;
  if (!S) { return; }
  var draw = S.draw;
  S.draw = function(c, t, w, h, d){
    draw(c, t, w, h, d);
    if (S.id == 'newyear') { F.fireworks(c, t, w, h, d); }
  };
})();
