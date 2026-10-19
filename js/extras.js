// Small interface extras and keyboard-help information.

(function(){
var DW = window.DW;
var A = DW.audio;
var X = {};
DW.extras = X;

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

// heading + grid of key / description pairs
function addSection(win, heading, rows){
  var h = document.createElement('h3');
  h.textContent = heading;
  win.body.appendChild(h);

  var grid = document.createElement('div');
  grid.className = 'keys';
  for (var i = 0; i < rows.length; i++) {
    var key = document.createElement('b');
    key.textContent = rows[i][0];
    var desc = document.createElement('span');
    desc.textContent = rows[i][1];
    grid.appendChild(key);
    grid.appendChild(desc);
  }
  win.body.appendChild(grid);
}

function fullscreen(){
  var root = document.documentElement;
  var p;
  try {
    if (document.fullscreenElement) { p = document.exitFullscreen(); }
    else if (root.requestFullscreen) { p = root.requestFullscreen(); }
  } catch(err) {}
  if (p && p.catch) { p.catch(function(){}); }
}

function nudgeVolume(amount){
  if (A.mute()) { A.mute(false); }
  A.volume(A.volume() + amount);
}

X.init = function(){

  // help window
  var help = DW.win('help', 'CONTROLS');
  addSection(help, 'KEYBOARD', KEYS);
  addSection(help, 'TOUCH', TOUCH);

  var tip = document.createElement('p');
  tip.className = 'tip';
  tip.textContent = 'the address bar remembers where you are (like #work/music).';
  help.body.appendChild(tip);

  // the ? button in the status bar
  var helpBtn = document.createElement('button');
  helpBtn.id = 'b-help';
  helpBtn.type = 'button';
  helpBtn.className = 'tbtn';
  helpBtn.textContent = '?';
  helpBtn.title = 'controls (H)';
  helpBtn.addEventListener('click', function(){
    help.toggle();
    helpBtn.blur();
  });
  var bar = document.getElementById('status');
  if (bar) { bar.insertBefore(helpBtn, document.getElementById('views-wrap')); }

  // keyboard shortcuts
  addEventListener('keydown', function(e){
    if (e.ctrlKey || e.metaKey || e.altKey) { return; }

    var body = document.body;
    if (!body.classList.contains('live')) { return; }
    if (body.classList.contains('gaming')) { return; }

    // dont steal keys while typing (sliders are fine)
    var target = e.target;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) && target.type !== 'range') { return; }

    var k = e.key;
    var handled = true;

    if (k == 'h' || k == 'H' || k == '?') {
      if (!e.repeat) {
        if (k == '?') { help.toggle(); }
        else { DW.later(function(){ help.toggle(); }); }
      }
    }
    else if (k == 'm' || k == 'M') {
      if (!e.repeat) { DW.later(function(){ DW.player.toggleMute(); }); }
    }
    else if (k == 's' || k == 'S') {
      if (!e.repeat) { DW.later(function(){ DW.player.toggleShuffle(); }); }
    }
    else if (k == 'l' || k == 'L') {
      if (!e.repeat) { DW.later(function(){ DW.player.toggleLoop(); }); }
    }
    else if (k == 'f' || k == 'F') {
      if (!e.repeat) { DW.later(fullscreen); }
    }
    else if (k == '[') { A.skip(-10); }
    else if (k == ']') { A.skip(10); }
    else if (k == '-' || k == '_') { nudgeVolume(-0.05); }
    else if (k == '=' || k == '+') { nudgeVolume(0.05); }
    else { handled = false; }

    if (handled) { e.preventDefault(); }
  });

  // show the song in the tab title while playing
  var baseTitle = document.title;
  function updateTitle(){
    var t = A.current();
    if (A.playing && t) {
      var text = '♪ ' + t.title;
      if (t.artist) { text = text + ' - ' + t.artist; }
      document.title = text;
    } else {
      document.title = baseTitle;
    }
  }
  A.on('state', updateTitle);
  A.on('track', updateTitle);
};
})();
