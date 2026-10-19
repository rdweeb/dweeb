(function(){
var DW = window.DW;
var N = {};
DW.nav = N;

var root = document.getElementById('cats');
var cats = [];      // every category, with its subs inside
var ci = 0;         // which category is selected
var memo = [];      // which sub is selected in each category
var maxd = 4;       // how many subs show below the selected one
var swiped = 0;     // time of the last swipe, so it doesnt also count as a click

function makeEl(tag, cls, txt){
  var e = document.createElement(tag);
  if (cls) { e.className = cls; }
  if (txt) { e.textContent = txt; }
  return e;
}

function makeImg(id){
  var i = new Image();
  i.src = 'icons/' + id + '.png';
  i.alt = '';
  i.draggable = false;
  i.className = 'ico';
  return i;
}

// little popup message at the bottom
var toastTimer;
DW.toast = function(msg){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){
    t.classList.remove('show');
  }, 2300 + msg.length * 45);
};

/* ---------- building the menu ---------- */

N.build = function(){
  for (var k = 0; k < DW.menu.length; k++) {
    var c = DW.menu[k];
    var cat = makeEl('div', 'cat');
    cat.dataset.k = k;
    cat.style.setProperty('--k', k);

    // the big icon
    var ico = makeEl('div', 'cat-ico');
    var fl = makeEl('div', 'fl');
    var catImg = makeImg(c.id);
    fl.appendChild(catImg);
    ico.appendChild(fl);

    // the list of links under it
    var subs = makeEl('div', 'subs');
    var list = [];
    var subMap = c.subs || {};
    var ids = Object.keys(subMap);
    for (var j = 0; j < ids.length; j++) {
      var id = ids[j];
      var s = makeEl('div', 'sub');
      s.dataset.j = j;
      s.style.setProperty('--j', j);

      var si = makeEl('div', 'sub-ico');
      var subImg = makeImg(id);
      si.appendChild(subImg);

      var sn = makeEl('div', 'sub-name');
      var nameSpan = makeEl('span', null, id.replace(/[-_]+/g, ' ').toUpperCase());
      sn.appendChild(nameSpan);

      s.appendChild(sn);
      s.appendChild(si);
      subs.appendChild(s);
      list.push({ el: s, id: id, url: subMap[id], img: subImg, nm: nameSpan });
    }

    var label = String(c.label || c.id).toUpperCase();
    var nameClass = 'cat-name';
    if (label.length > 14) { nameClass = nameClass + ' long'; }
    var catName = makeEl('div', nameClass, label);

    cat.appendChild(ico);
    cat.appendChild(catName);
    cat.appendChild(subs);
    root.appendChild(cat);
    cats.push({ el: cat, id: c.id, empty: list.length == 0, ico: ico, img: catImg, name: catName, subs: list });
    memo.push(0);
  }
  readMax();

  // start where the link says, or where they left off last time
  var start = location.hash.slice(1);
  if (!start) {
    try { start = localStorage.getItem('dw-spot') || ''; } catch(e) {}
  }
  if (!N.go(start)) { layout(); }
};

function readMax(){
  var v = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--maxd'), 10);
  if (v >= 0) { maxd = v; } else { maxd = 4; }
}

/* ---------- drawing it ---------- */

var raf = 0;

// asks for one repaint on the next frame, no matter how many times its called
function layout(){
  if (raf) { return; }
  raf = requestAnimationFrame(function(){
    raf = 0;
    paint();
  });
}

function paint(){
  if (cats.length == 0) { return; }

  for (var k = 0; k < cats.length; k++) {
    var c = cats[k];
    var d = k - ci;
    var ad = Math.abs(d);

    var opacity;
    if (d == 0) { opacity = 1; }
    else if (ad > 3) { opacity = 0; }
    else { opacity = (0.62 - ad * 0.08).toFixed(2); }

    c.el.style.setProperty('--d', d);
    c.el.style.setProperty('--o', opacity);
    c.el.classList.toggle('act', d == 0);
    c.el.classList.toggle('far', ad > 3);

    for (var j = 0; j < c.subs.length; j++) {
      var s = c.subs[j];
      var e = j - memo[k];

      var o;
      if (e < 0 || e > maxd) { o = 0; }
      else if (e == 0) { o = 1; }
      else { o = Math.max(0.35, 1 - e * 0.13); }

      var side = 0;
      if (e > 0) { side = 1; }
      else if (e < 0) { side = -1; }

      s.el.style.setProperty('--d', e);
      s.el.style.setProperty('--sg', side);
      s.el.style.setProperty('--o', o);
      s.el.classList.toggle('sel', e == 0);
      s.el.classList.toggle('hid', o == 0);
    }
  }
  react();
}

// remember the spot in the address bar + storage (after things settle for a moment)
var spotTimer = 0;
function saveSpot(){
  clearTimeout(spotTimer);
  spotTimer = setTimeout(function(){
    var c = cats[ci];
    var spot = c.id;
    if (!c.empty) { spot = spot + '/' + c.subs[memo[ci]].id; }
    if (DW.trophy) { DW.trophy.mark('hopper', c.id); }
    try { localStorage.setItem('dw-spot', spot); } catch(e) {}
    try { history.replaceState(null, '', '#' + spot); } catch(e) {}
  }, 220);
}

// jump to "category" or "category/sub". false if it doesnt exist
N.go = function(s){
  var p = String(s || '').replace(/^#/, '').split('/');
  var k = -1;
  for (var i = 0; i < cats.length; i++) {
    if (cats[i].id == p[0]) { k = i; }
  }
  if (k < 0) { return false; }

  ci = k;
  if (p[1]) {
    for (var j = 0; j < cats[k].subs.length; j++) {
      if (cats[k].subs[j].id == p[1]) { memo[k] = j; }
    }
  }
  layout();
  return true;
};

// tells the visualizer which icons and names should pulse with the music
function react(){
  var V = DW.vis;
  if (!V) { return; }
  var cur = cats[ci];
  var sel = cur.subs[memo[ci]] || null;

  var otherCats = [];
  var otherDist = [];
  for (var k = 0; k < cats.length; k++) {
    var d = Math.abs(k - ci);
    if (d && d < 4) {
      otherCats.push(cats[k].img);
      otherDist.push(d);
    }
  }

  var subImgs = [];
  var subDist = [];
  var names = [];
  var nameDist = [];
  for (var j = 0; j < cur.subs.length; j++) {
    var e = j - memo[ci];
    if (e < 0 || e > maxd) { continue; }
    names.push(cur.subs[j].nm);
    nameDist.push(e);
    if (e) {
      subImgs.push(cur.subs[j].img);
      subDist.push(e);
    }
  }

  V.bind('icon', cur.img);
  V.bind('cats', otherCats, otherDist);
  V.bind('catname', cur.name);
  V.bind('sub', sel ? sel.img : []);
  V.bind('subs', subImgs, subDist);
  V.bind('names', names, nameDist);
}

/* ---------- moving around ---------- */

// small nudge when you try to go past the end
function bump(axis, dir){
  if (cats.length == 0) { return; }
  var t;
  if (axis == 'x') { t = root; }
  else { t = cats[ci].el.querySelector('.subs'); }
  if (!t || !t.animate) { return; }

  var to;
  if (axis == 'x') { to = dir * 8 + 'px 0'; }
  else { to = '0 ' + dir * 8 + 'px'; }
  t.animate([{ translate: '0 0' }, { translate: to }, { translate: '0 0' }], { duration: 220, easing: 'ease-out' });
}

N.cat = function(dir){
  var n = ci + dir;
  if (n < 0 || n >= cats.length) {
    bump('x', dir);
    return;
  }
  ci = n;
  layout();
  saveSpot();
};

N.sub = function(dir){
  if (cats.length == 0) { return; }
  var n = memo[ci] + dir;
  if (n < 0 || n >= cats[ci].subs.length) {
    bump('y', dir);
    return;
  }
  memo[ci] = n;
  layout();
  saveSpot();
};

N.setSub = function(n){
  if (cats.length == 0) { return; }
  n = Math.max(0, Math.min(cats[ci].subs.length - 1, n));
  if (n == memo[ci]) { return; }
  memo[ci] = n;
  layout();
  saveSpot();
};

function openSub(s){
  if (DW.trophy) { DW.trophy.mark('tourist', s.id); }
  var u = DW.safeUrl(s.url);
  if (!u) {
    DW.toast(s.id.toUpperCase() + ' has no link yet');
    return;
  }
  s.el.classList.add('go');
  setTimeout(function(){ s.el.classList.remove('go'); }, 520);
  DW.openLink(u);
}

N.open = function(){
  if (cats.length == 0) { return; }
  var s = cats[ci].subs[memo[ci]];
  if (s) { openSub(s); }
};

/* ---------- input ---------- */

function inPlayer(e){
  return e.target.closest && e.target.closest('#player');
}

// dont steer the menu while the intro, a window or a game is up
function blocked(){
  var c = document.body.classList;
  if (!c.contains('live')) { return true; }
  if (c.contains('modal')) { return true; }
  if (c.contains('gaming')) { return true; }
  return false;
}

N.bind = function(){
  addEventListener('resize', function(){
    readMax();
    layout();
  });
  addEventListener('hashchange', function(){ N.go(location.hash); });

  // keyboard
  addEventListener('keydown', function(e){
    if (e.ctrlKey || e.metaKey || e.altKey) { return; }
    if (blocked() || inPlayer(e)) { return; }

    var k = e.key;
    var handled = true;

    if (k == 'ArrowLeft' || k == ',' || k == '<') { N.cat(-1); }
    else if (k == 'ArrowRight' || k == '.' || k == '>') { N.cat(1); }
    else if (k == 'ArrowUp') { N.sub(-1); }
    else if (k == 'ArrowDown') { N.sub(1); }
    else if (k == 'Home') { N.setSub(0); }
    else if (k == 'End') { N.setSub(9999); }
    else if (k == 'PageUp') { N.setSub(memo[ci] - 4); }
    else if (k == 'PageDown') { N.setSub(memo[ci] + 4); }
    else if (k == 'Enter') { if (!e.repeat) { N.open(); } }
    else if (k == ' ') { if (!e.repeat) { DW.audio.toggle(); } }
    else if (k == 'n' || k == 'N') { if (!e.repeat) { DW.later(function(){ DW.audio.next(); }); } }
    else if (k == 'p' || k == 'P') { if (!e.repeat) { DW.later(function(){ DW.audio.prev(); }); } }
    else { handled = false; }

    if (handled) { e.preventDefault(); }
  });

  // mouse wheel / trackpad
  var lastWheel = 0;
  addEventListener('wheel', function(e){
    if (inPlayer(e) || blocked()) { return; }
    var now = Date.now();
    if (now - lastWheel < 260) { return; }
    var ax = Math.abs(e.deltaX);
    var ay = Math.abs(e.deltaY);
    if (Math.max(ax, ay) < 8) { return; }
    lastWheel = now;
    if (ax > ay) {
      if (e.deltaX > 0) { N.cat(1); } else { N.cat(-1); }
    } else {
      if (e.deltaY > 0) { N.sub(1); } else { N.sub(-1); }
    }
  }, { passive: true });

  // swiping on a phone
  var startX = 0;
  var startY = 0;
  var startT = 0;
  var tracking = false;

  addEventListener('touchstart', function(e){
    if (e.touches.length !== 1 || inPlayer(e) || blocked()) {
      tracking = false;
      return;
    }
    tracking = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startT = Date.now();
  }, { passive: true });

  addEventListener('touchcancel', function(){ tracking = false; }, { passive: true });

  addEventListener('touchend', function(e){
    if (!tracking || blocked()) { return; }
    tracking = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;
    var ax = Math.abs(dx);
    var ay = Math.abs(dy);
    // too short or too slow is just a tap
    if (Math.max(ax, ay) < 36 || Date.now() - startT > 900) { return; }

    if (ax > ay * 1.3) {
      swiped = Date.now();
      if (dx < 0) { N.cat(1); } else { N.cat(-1); }
    } else if (ay > ax * 1.3) {
      swiped = Date.now();
      if (dy < 0) { N.sub(1); } else { N.sub(-1); }
    }
  }, { passive: true });

  // clicking / tapping
  root.addEventListener('click', function(e){
    if (Date.now() - swiped < 400 || blocked()) { return; }
    var cat = e.target.closest('.cat');
    if (!cat) { return; }

    // first tap on another category just selects it
    var k = Number(cat.dataset.k);
    if (k != ci) {
      ci = k;
      layout();
      saveSpot();
      return;
    }

    var sub = e.target.closest('.sub');
    if (!sub) { return; }
    memo[ci] = Number(sub.dataset.j);
    layout();
    saveSpot();
    N.open();
  });
};
})();
