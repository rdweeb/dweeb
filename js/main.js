(function(){
var DW = window.DW;

function $(id){ return document.getElementById(id); }

// runs one setup step. if it crashes the rest of the site still loads
function safe(name, fn){
  try { fn(); }
  catch(e) { console.error('[dweeb] ' + name + ' broke:', e); }
}

/* ---------- warn about missing files ---------- */

safe('missing files', function(){
  var miss = (window.__miss || []).slice();
  if (!window.__miss) { miss.push('js/guard.js'); }

  if (DW.early) {
    var note = '';
    if (!(window.__err || {})['js/config.js']) {
      note = ' (did not run before util.js - check the script order in index.html)';
    }
    miss.push('js/config.js' + note);
  } else if (!DW.menu) {
    miss.push('js/config.js');
  }

  // [name on DW, file name] for every module the site needs
  var needed = [
    ['safeUrl', 'util'], ['audio', 'audio'], ['vis', 'visualizer'], ['nav', 'navigation'],
    ['player', 'player'], ['emo', 'emotion'], ['splashUI', 'splash'], ['store', 'store'],
    ['season', 'seasons'], ['trophy', 'trophies'], ['games', 'games'], ['changelog', 'changelog'],
    ['set', 'settings'], ['eggs', 'eggs'], ['pet', 'pet'], ['extras', 'extras'],
    ['particles', 'particles'], ['boot', 'boot']
  ];
  for (var i = 0; i < needed.length; i++) {
    var file = 'js/' + needed[i][1] + '.js';
    if (!DW[needed[i][0]] && miss.indexOf(file) < 0) { miss.push(file); }
  }
  if (miss.length == 0) { return; }

  var errors = window.__err || {};
  var parts = [];
  for (var j = 0; j < miss.length; j++) {
    if (errors[miss[j]]) { parts.push(miss[j] + ' [' + errors[miss[j]] + ']'); }
    else { parts.push(miss[j]); }
  }

  var warn = document.createElement('div');
  warn.id = 'warn';
  warn.textContent = 'FILES MISSING OR BROKEN ON YOUR SITE: ' + parts.join(', ') + ' - upload them again, then reload';
  document.body.appendChild(warn);
  setTimeout(function(){ warn.remove(); }, 40000);
});

/* ---------- console message ---------- */

safe('console', function(){
  if (!window.console || !console.log) { return; }
  console.log('%cDWEEB//OS', 'font:bold 20px monospace;color:#de37e4;background:#2c0a38;padding:4px 10px');
  console.log('hi!! you opened the console. thats very cool.\nthere is a file in js/ called spaghetti.js..\nnothing here is sketchy, i promise. go outside.');
});

/* ---------- clock in the top bar ---------- */

safe('clock', function(){
  function pad(n){
    if (n < 10) { return '0' + n; }
    return n;
  }
  function tick(){
    var d = new Date();
    $('clock').textContent = d.getDate() + '/' + (d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  tick();
  setInterval(tick, 15000);
});

/* ---------- setting everything up (order matters a bit) ---------- */

safe('visualizer', function(){
  var V = DW.vis;
  V.root($('player'));
  V.glow($('glow'));

  var waves = [];
  var selectors = ['.w1', '.w2', '.w3'];
  for (var i = 0; i < selectors.length; i++) {
    waves.push(document.querySelector(selectors[i]));
  }
  V.waves(waves);

  V.meter([].slice.call($('meter').children));
  V.bind('top', [$('sysname'), $('views-wrap'), $('clock')], [0, 1, 2]);
  V.start();
});

safe('menu', function(){
  DW.nav.build();
  DW.nav.bind();
});
safe('player', function(){ DW.player.init(); });
safe('splash', function(){ DW.splashUI.init(); });
safe('extras', function(){ DW.extras.init(); });
safe('seasons', function(){ DW.season.init(); });
safe('trophies', function(){ DW.trophy.init(); });
safe('games', function(){ DW.games.init(); });
safe('changelog', function(){ DW.changelog.init(); });
safe('settings', function(){ DW.set.init(); });
safe('eggs', function(){ DW.eggs.init(); });
safe('pet', function(){ DW.pet.init(); });
safe('audio', function(){
  DW.audio.load(DW.audio.saved(), false);
  if (DW.set.get('muteStart')) { DW.audio.mute(true); }
});
safe('particles', function(){ DW.particles.start(); });

/* ---------- ?debug overlay ---------- */

safe('debug', function(){
  if (!/[?&]debug/.test(location.search)) { return; }
  var box = document.createElement('pre');
  box.id = 'dbg';
  document.body.appendChild(box);

  function f(n){ return n.toFixed(2); }

  setInterval(function(){
    var S = DW.vis.state;
    var A = DW.audio;

    var heap = 'n/a';
    if (performance.memory) { heap = Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB'; }
    var helper = 'not active (yet)';
    if (navigator.serviceWorker && navigator.serviceWorker.controller) { helper = 'active'; }
    var motion = 'off';
    if (DW.reduce) { motion = 'ON'; }

    box.textContent =
      'playing  ' + A.playing +
      '\nengine   ' + A.state() +
      '\nanalyser ' + (A.analyser ? true : false) +
      '\nbass ' + f(S.bass) + '  mid ' + f(S.mid) + '  high ' + f(S.high) +
      '\nbeats ' + S.beats + '  bpm ' + Math.round(60000 / S.interval) + '  speed ' + f(S.speed) +
      '\nreduced-motion ' + motion + '  low-power ' + DW.low + '  master ' + (DW.react && DW.react.master) +
      '\nframes ' + DW.vis.frames + '  fps ' + DW.vis.fps + '  lite ' + DW.vis.lite + '  engine-error ' + (DW.vis.err || 'none') +
      '\nheap ' + heap +
      '\nupdate helper ' + helper;
  }, 250);
});

/* ---------- showing the site ---------- */

var shown = false;

// called when the intro is over (or skipped)
function reveal(){
  if (shown) { return; }
  shown = true;
  $('app').classList.add('on');
  document.body.classList.add('live');

  safe('music', function(){
    if (DW.set.get('autoplay') === false) { return; }
    DW.audio.arm();
    if (!DW.audio.userPaused) { DW.audio.play(); }
  });
  safe('splash start', function(){ DW.splashUI.start(); });

  setTimeout(function(){
    var hint = $('hint');
    if (hint) { hint.classList.add('fade'); }
  }, 9000);
}

// something went wrong, just get the boot screen out of the way
function bail(){
  reveal();
  var boot = $('boot');
  if (!boot) { return; }
  boot.classList.add('gone');
  setTimeout(function(){ boot.classList.add('dead'); }, 1200);
}

// if the boot screen is still up after 3 minutes, give up on it
setTimeout(function(){
  if (!shown) { bail(); }
}, 180000);

try { DW.boot(reveal); }
catch(e) {
  console.error('[dweeb] boot broke:', e);
  bail();
}

})();
