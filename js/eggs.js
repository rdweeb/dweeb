// Hidden interactions and their related unlocks.

(function(){
var DW = window.DW;
if (!DW.eggs) { DW.eggs = {}; }
var E = DW.eggs;
var birthdayInfo = E.birthday;
var started = false;

function giveTrophy(id){
  try { if (DW.trophy) { DW.trophy.award(id); } } catch(e) {}
}

function say(text){
  try { if (DW.splashUI) { DW.splashUI.say(text); } } catch(e) {}
}

function randomOf(list){
  return list[Math.floor(Math.random() * list.length)];
}

function gaming(){
  return document.body.classList.contains('gaming');
}

// calls cb when target gets tapped n times within ms
function multiTap(target, n, ms, cb){
  var hits = [];
  target.addEventListener('pointerdown', function(){
    var now = Date.now();
    var recent = [];
    for (var i = 0; i < hits.length; i++) {
      if (now - hits[i] < ms) { recent.push(hits[i]); }
    }
    recent.push(now);
    hits = recent;
    if (hits.length >= n) {
      hits = [];
      cb();
    }
  });
}

/* konami (swipe version) */
var SEQ = ['u', 'u', 'd', 'd', 'l', 'r', 'l', 'r'];
var seen = [];
var startX = 0;
var startY = 0;

function swipes(){
  addEventListener('touchstart', function(e){
    var t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });

  addEventListener('touchend', function(e){
    var t = e.changedTouches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;
    var ax = Math.abs(dx);
    var ay = Math.abs(dy);
    if (Math.max(ax, ay) < 40) { return; }

    var dir;
    if (ax > ay) {
      if (dx > 0) { dir = 'r'; } else { dir = 'l'; }
    } else {
      if (dy > 0) { dir = 'd'; } else { dir = 'u'; }
    }

    seen.push(dir);
    seen = seen.slice(-SEQ.length);
    if (seen.join('') == SEQ.join('')) {
      seen = [];
      giveTrophy('konami');
      say('+30 lives!');
    }
  }, { passive: true });
}

/* hold the album cover */
function cover(){
  var btn = document.getElementById('pl-covbtn');
  var timer = 0;
  var fired = false;
  if (!btn) { return; }

  btn.addEventListener('pointerdown', function(){
    fired = false;
    clearTimeout(timer);
    timer = setTimeout(function(){
      fired = true;
      btn.classList.add('egg-spin');
      setTimeout(function(){ btn.classList.remove('egg-spin'); }, 1400);
      giveTrophy('spin');
      say(randomOf(['<dizzy>wheeeeeee', '<dizzy>i am the album now', 'round and round. like a record.']));
    }, 1200);
  });

  var stops = ['pointerup', 'pointerleave', 'pointercancel'];
  for (var i = 0; i < stops.length; i++) {
    btn.addEventListener(stops[i], function(){ clearTimeout(timer); });
  }

  // the click after a long hold shouldnt count as a normal click
  btn.addEventListener('click', function(e){
    if (fired) {
      e.stopPropagation();
      e.preventDefault();
      fired = false;
    }
  }, true);
}

/* poke the chat bot */
function poke(){
  var count = 0;
  var lastPoke = 0;

  addEventListener('pointerdown', function(e){
    var splash = document.getElementById('splash');
    if (!splash) { return; }
    if (!splash.classList.contains('on')) { return; }
    if (gaming()) { return; }

    var box = splash.getBoundingClientRect();
    if (e.clientX < box.left || e.clientX > box.right) { return; }
    if (e.clientY < box.top || e.clientY > box.bottom) { return; }

    var now = Date.now();
    if (now - lastPoke > 5000) { count = 1; }
    else { count = count + 1; }
    lastPoke = now;

    if (count == 3) { say('hey. i can feel that.'); }
    else if (count == 6) { say('<angry>that is my FACE'); }
    else if (count == 9) {
      say('<scared>ok ok ok i am sorry');
      giveTrophy('ouch');
    }
  }, true);
}

/* mute button */
function mute(){
  var btn = document.getElementById('pl-mute');
  if (!btn) { return; }
  multiTap(btn, 8, 6000, function(){
    giveTrophy('mutiny');
    say(randomOf(['<sneaky>make up your mind', 'is it on or is it off. i am getting dizzy.', 'mute. unmute. mute. i am not a lightswitch.']));
  });
}

/* lopped songs */
function loops(){
  var A = DW.audio;
  var lastFile = '';
  var plays = 0;
  if (!A || !A.el) { return; }

  A.on('track', function(t){
    if (t.file != lastFile) {
      lastFile = t.file;
      plays = 0;
    }
  });

  A.el.addEventListener('ended', function(){
    if (!A.loop || !A.loop()) {
      plays = 0;
      return;
    }
    plays = plays + 1;
    if (plays >= 3) {
      plays = 0;
      giveTrophy('onemore');
      say('<love>one more time! i am not tired of it either.');
    }
  });
}

/* birthday */
function birthday(){
  var b = birthdayInfo;
  var today = new Date();
  if (!b || !b.m || !b.d) { return; }
  if (Number(b.m) != today.getMonth() + 1) { return; }
  if (Number(b.d) != today.getDate()) { return; }

  setTimeout(function(){
    giveTrophy('birthday');
    say(b.line || '<excited>HAPPY BIRTHDAY!!<n> go eat some cake.');
  }, 6500);
}

E.init = function(){
  if (started) { return; }  // dont add everything twice
  started = true;
  swipes();
  cover();
  poke();
  mute();
  loops();
  birthday();
};
})();
