(function(){
var DW = window.DW;
var G = DW.games;
var P = G.pal;
var A = DW.audio;
var St = DW.store;

var LANES = 4;
var LW = 70;      // lane width
var LX = 20;      // where the first lane starts
var HIT = 372;    // y of the hit line
var TOP = -16;    // where notes spawn
var LCOL = ['#de37e4', '#5a87d0', '#f3b5f6', '#ffd34d'];
var KEYS = {
  d: 'l0', f: 'l1', j: 'l2', k: 'l3',
  arrowleft: 'l0', arrowdown: 'l1', arrowup: 'l2', arrowright: 'l3',
  enter: 'enter', ' ': 'enter'
};
var DIFF = {
  easy: { gap: 0.36, lead: 1.7, mult: 1.9 },
  normal: { gap: 0.23, lead: 1.4, mult: 1.5 },
  hard: { gap: 0.15, lead: 1.15, mult: 1.2 }
};
var cache = {};

/* ---------- reading the song ---------- */

function decode(file){
  var req = fetch('audio/' + file);
  return req.then(function(r){
    if (!r.ok) { throw new Error('missing ' + file); }
    return r.arrayBuffer();
  }).then(function(buf){
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) { throw new Error('no audio decoder'); }
    var oc;
    try { oc = new OC(1, 1, 22050); }
    catch(e) { oc = new OC(1, 1, 44100); }
    return new Promise(function(resolve, reject){
      // old safari wants callbacks, everything else gives a promise
      var p = oc.decodeAudioData(buf, resolve, reject);
      if (p && p.then) { p.then(resolve, reject); }
    });
  });
}

// splits the song into low / mid / high energy, in small chunks so the page doesnt freeze
function analyse(buf, progress){
  return new Promise(function(resolve){
    var sr = buf.sampleRate;
    var n = buf.length;
    var left = buf.getChannelData(0);
    var right = null;
    if (buf.numberOfChannels > 1) { right = buf.getChannelData(1); }

    var hop = 256;
    var frames = Math.floor(n / hop);
    var total = frames * hop;
    var a1 = 1 - Math.exp(-2 * Math.PI * 200 / sr);
    var a2 = 1 - Math.exp(-2 * Math.PI * 2000 / sr);
    var lo = new Float32Array(frames);
    var mi = new Float32Array(frames);
    var hi = new Float32Array(frames);
    var l1 = 0;
    var l2 = 0;
    var f = 0;
    var pos = 0;
    var CHUNK = 300000;

    function chunk(){
      var end = Math.min(total, pos + CHUNK);
      while (pos < end) {
        var sumLo = 0;
        var sumMid = 0;
        var sumHi = 0;
        var stop = pos + hop;
        while (pos < stop) {
          var x;
          if (right) { x = (left[pos] + right[pos]) * 0.5; }
          else { x = left[pos]; }
          l1 += a1 * (x - l1);
          l2 += a2 * (x - l2);
          var m = l2 - l1;
          var h = x - l2;
          sumLo += l1 * l1;
          sumMid += m * m;
          sumHi += h * h;
          pos++;
        }
        lo[f] = Math.sqrt(sumLo / hop);
        mi[f] = Math.sqrt(sumMid / hop);
        hi[f] = Math.sqrt(sumHi / hop);
        f++;
      }
      if (total > 0) { progress(pos / total); }
      if (pos < total) { setTimeout(chunk, 0); }
      else { resolve({ lo: lo, mi: mi, hi: hi, frames: frames, hop: hop, sr: sr, dur: n / sr }); }
    }
    chunk();
  });
}

// how much louder each frame is than 2 frames ago
function flux(e){
  var n = e.length;
  var out = new Float32Array(n);
  for (var i = 2; i < n; i++) {
    out[i] = Math.max(0, Math.log(1 + e[i] * 60) - Math.log(1 + e[i - 2] * 60));
  }
  return out;
}

// finds the peaks that stick out above the local average
function candidates(fl, band, mult, frameTime){
  var n = fl.length;
  var win = 43;
  var out = [];
  var sum = 0;
  var i;
  for (i = 0; i < Math.min(n, win); i++) { sum += fl[i]; }
  for (i = 0; i < n; i++) {
    var add = i + win;
    var drop = i - win - 1;
    if (add < n) { sum += fl[add]; }
    if (drop >= 0) { sum -= fl[drop]; }
    var count = Math.min(n - 1, i + win) - Math.max(0, i - win) + 1;
    var thr = sum / count * mult + 0.015;
    var v = fl[i];
    if (v > thr && v >= fl[i - 1] && v >= fl[i + 1] && v >= (fl[i - 2] || 0) && v >= (fl[i + 2] || 0)) {
      out.push({ t: i * frameTime, band: band, s: v / thr });
    }
  }
  return out;
}

function chart(an, diff){
  var d = DIFF[diff];
  var frameTime = an.hop / an.sr;
  var fl = [flux(an.lo), flux(an.mi), flux(an.hi)];
  var notes = [];
  var mult = d.mult;
  var tries = 0;

  // not enough notes? lower the bar and try again
  do {
    var cand = [];
    for (var b = 0; b < 3; b++) {
      cand = cand.concat(candidates(fl[b], b, mult, frameTime));
    }
    var kept = [];
    for (var ci = 0; ci < cand.length; ci++) {
      if (cand[ci].t > 1.2 && cand[ci].t < an.dur - 1.5) { kept.push(cand[ci]); }
    }
    kept.sort(function(x, y){ return y.s - x.s; });

    // strongest first, skip anything too close to one we already took
    var occ = new Uint8Array(Math.ceil(an.dur * 100) + 200);
    var span = Math.round(d.gap * 100);
    var accepted = [];
    for (var ki = 0; ki < kept.length; ki++) {
      var k = Math.round(kept[ki].t * 100);
      if (occ[k]) { continue; }
      for (var j = Math.max(0, k - span + 1); j < k + span; j++) { occ[j] = 1; }
      accepted.push(kept[ki]);
    }
    accepted.sort(function(x, y){ return x.t - y.t; });
    notes = accepted;
    mult = mult * 0.75;
    tries++;
  } while (notes.length < Math.min(40, an.dur / 4) && tries < 5);

  // pick lanes. low sounds go left, high sounds go right
  var result = [];
  var last = -1;
  var seed = 7;
  for (var i = 0; i < notes.length; i++) {
    var opts;
    if (notes[i].band == 0) { opts = [0, 1]; }
    else if (notes[i].band == 1) { opts = [1, 2]; }
    else { opts = [2, 3]; }

    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    var lane = opts[(seed >> 16) % 2];
    if (lane == last) {
      if (opts[0] == lane) { lane = opts[1]; } else { lane = opts[0]; }
    }
    if (lane == last) { lane = (lane + 1) % LANES; }
    last = lane;
    result.push({ t: notes[i].t, lane: lane, hit: 0 });
  }
  return result;
}

function ownCache(file, diff){ return cache[file + '|' + diff]; }

function rank(acc){
  if (acc >= 95) { return 'S'; }
  if (acc >= 85) { return 'A'; }
  if (acc >= 70) { return 'B'; }
  if (acc >= 55) { return 'C'; }
  return 'D';
}

function text(c, s, x, y, size, col, align){
  c.font = 'bold ' + size + 'px Tahoma, Verdana, sans-serif';
  c.textAlign = align || 'left';
  c.textBaseline = 'top';
  c.fillStyle = col || '#ffffff';
  c.fillText(s, x, y);
}

/* ---------- the game ---------- */

G.add({
  id: 'rhythm', name: 'RHYTHM', blurb: 'hit the notes to your own songs.', w: 320, h: 440, keymap: KEYS, bestLabel: 'BEST SCORE',
  help: 'D F J K (or the arrow keys) hit the lanes. on a phone tap the lanes. P pauses.',
  make: function(env){
    var ui = env.layer;
    var diff = 'normal';
    var notes = [];
    var state = 'menu';   // menu, load, play, done
    var gt = 0;           // game time in seconds
    var lastCt = 0;
    var lastPerf = 0;
    var leadStart = 0;
    var audioOn = false;
    var score = 0;
    var combo = 0;
    var maxCombo = 0;
    var cnt = { perfect: 0, great: 0, ok: 0, miss: 0 };
    var ghosts = 0;       // wrong taps
    var lit = [0, 0, 0, 0];
    var lastPress = [0, 0, 0, 0];
    var rings = [];
    var bump = 0;
    var flashT = 0;
    var pop = null;
    var trackIdx = 0;
    var prev = null;
    var token = 0;
    var offset = 0;

    function savedOffset(){
      var o = St.d.g.rhythmOffset;
      if (typeof o == 'number') { return o; }
      return 0;
    }

    function setOffset(v){
      offset = Math.max(-300, Math.min(300, v));
      St.d.g.rhythmOffset = offset;
      St.save();
    }

    function makeEl(tag, cls, txt){
      var e = document.createElement(tag);
      if (cls) { e.className = cls; }
      if (txt !== undefined) { e.textContent = txt; }
      return e;
    }

    function bestKey(file){ return file + '|' + diff; }

    function bestOf(file){
      var b = St.d.g.rhythmBest || {};
      return b[bestKey(file)];
    }

    /* menu */

    function diffButton(k){
      var cls = 'tab';
      if (k == diff) { cls = 'tab on'; }
      var b = makeEl('button', cls, k.toUpperCase());
      b.type = 'button';
      b.addEventListener('click', function(){
        diff = k;
        menu();
      });
      return b;
    }

    function songButton(t, i){
      var b = makeEl('button', 'rh-song');
      b.type = 'button';
      b.appendChild(makeEl('b', null, t.title));
      var bs = bestOf(t.file);
      if (bs) { b.appendChild(makeEl('span', null, bs.rank + '  ' + bs.score)); }
      else { b.appendChild(makeEl('span', null, t.artist || '')); }
      b.addEventListener('click', function(){ choose(i); });
      return b;
    }

    function menu(){
      var was = state;
      state = 'menu';
      token++;
      if (was == 'play' || was == 'done') { stopAudio(); }
      env.clear();
      env.end();
      ui.hidden = false;
      ui.textContent = '';
      ui.className = 'gm-layer rh-menu';
      ui.appendChild(makeEl('b', null, 'PICK A SONG'));

      var diffRow = makeEl('div', 'rh-row');
      var levels = ['easy', 'normal', 'hard'];
      for (var i = 0; i < levels.length; i++) {
        diffRow.appendChild(diffButton(levels[i]));
      }
      ui.appendChild(diffRow);

      var list = makeEl('div', 'rh-list');
      for (var j = 0; j < DW.tracks.length; j++) {
        list.appendChild(songButton(DW.tracks[j], j));
      }
      ui.appendChild(list);

      // timing offset
      var cal = makeEl('div', 'rh-row rh-cal');
      var minus = makeEl('button', 'tab', '-10');
      var plus = makeEl('button', 'tab', '+10');
      var val = makeEl('span', null, 'TIMING ' + offset + 'ms');
      minus.type = 'button';
      plus.type = 'button';
      minus.addEventListener('click', function(){
        setOffset(offset - 10);
        val.textContent = 'TIMING ' + offset + 'ms';
      });
      plus.addEventListener('click', function(){
        setOffset(offset + 10);
        val.textContent = 'TIMING ' + offset + 'ms';
      });
      cal.appendChild(minus);
      cal.appendChild(val);
      cal.appendChild(plus);
      ui.appendChild(cal);
      ui.appendChild(makeEl('small', null, 'notes feel late? raise it. early? lower it.'));
      env.hud('', '');
    }

    function stopAudio(){
      audioOn = false;
      try { A.el.pause(); } catch(e) {}
    }

    function showError(title, sub){
      ui.textContent = '';
      ui.appendChild(makeEl('b', null, title));
      ui.appendChild(makeEl('small', null, sub));
      var back = makeEl('button', 'cm-go', 'BACK');
      back.type = 'button';
      back.addEventListener('click', function(){ menu(); });
      ui.appendChild(back);
    }

    function choose(i){
      trackIdx = i;
      var t = DW.tracks[i];
      token++;
      var my = token;   // if token changes while loading, the user left
      state = 'load';
      ui.textContent = '';
      ui.className = 'gm-layer rh-menu';

      var msg = makeEl('b', null, 'ANALYSING ' + t.title.toUpperCase());
      var bar = makeEl('div', 'bar2');
      bar.appendChild(makeEl('i'));
      var sub = makeEl('small', null, 'finding the beat. this takes a few seconds.');
      ui.appendChild(msg);
      ui.appendChild(bar);
      ui.appendChild(sub);

      var have = ownCache(t.file, diff);
      if (have) {
        launch(have);
        return;
      }

      decode(t.file).then(function(buf){
        if (my != token) { return null; }
        return analyse(buf, function(p){
          if (my == token) { bar.firstChild.style.width = Math.round(p * 100) + '%'; }
        });
      }).then(function(an){
        if (!an || my != token) { return; }
        var ch = chart(an, diff);
        if (ch.length == 0) {
          showError('NO BEAT FOUND', 'that song is too quiet or too flat to make notes from.');
          return;
        }
        cache[t.file + '|' + diff] = ch;
        launch(ch);
      }).catch(function(e){
        if (my != token) { return; }
        console.error('[dweeb] rhythm analysis failed', e);
        showError('COULD NOT LOAD THAT SONG', 'this browser could not read the audio file.');
      });
    }

    function launch(ch){
      notes = [];
      for (var i = 0; i < ch.length; i++) {
        notes.push({ t: ch[i].t, lane: ch[i].lane, hit: 0 });
      }
      score = 0;
      combo = 0;
      maxCombo = 0;
      cnt = { perfect: 0, great: 0, ok: 0, miss: 0 };
      ghosts = 0;
      rings = [];
      bump = 0;
      flashT = 0;
      pop = null;
      ui.hidden = true;
      ui.textContent = '';
      env.played();
      env.start();
      state = 'play';

      // remember what the player was listening to so we can put it back
      if (!prev) { prev = { idx: A.index(), playing: A.playing }; }
      A.load(trackIdx, false);
      stopAudio();
      try { A.el.currentTime = 0; } catch(e) {}
      leadStart = performance.now();
      audioOn = false;
      lastCt = 0;
      gt = -1.6;
      hud();
    }

    function acc(){
      var done = cnt.perfect + cnt.great + cnt.ok + cnt.miss + ghosts;
      if (!done) { return 100; }
      return (cnt.perfect + cnt.great * 0.7 + cnt.ok * 0.4) / done * 100;
    }

    function hud(){
      var done = cnt.perfect + cnt.great + cnt.ok + cnt.miss;
      var right = '';
      if (done) { right = Math.round(acc() * 10) / 10 + '%'; }
      env.hud('SCORE ' + score + '   COMBO ' + combo, right);
    }

    // song time. counts up from -1.6 before the music starts
    function clock(now){
      if (!audioOn) {
        var g = (now - leadStart) / 1000 - 1.6;
        if (g >= 0) {
          audioOn = true;
          var p = A.el.play();
          if (p && p.catch) { p.catch(function(){}); }
          lastCt = A.el.currentTime;
          lastPerf = now;
          return 0;
        }
        return g;
      }

      // currentTime only updates every so often, so fill the gaps in ourselves
      var ct = A.el.currentTime;
      if (ct != lastCt) {
        lastCt = ct;
        lastPerf = now;
      }
      if (A.el.paused || A.el.readyState < 3) {
        lastPerf = now;
        return lastCt;
      }
      return lastCt + (now - lastPerf) / 1000;
    }

    function judge(lane){
      if (state != 'play' || !audioOn) { return; }
      var now = performance.now();
      if (now - lastPress[lane] < 70) { return; }
      lastPress[lane] = now;
      lit[lane] = 1;

      // closest unhit note in this lane, within 0.14s
      var best = null;
      var bd = 0.14;
      var t = gt - offset / 1000;
      for (var i = 0; i < notes.length; i++) {
        var n = notes[i];
        if (n.hit || n.lane != lane) { continue; }
        if (n.t - t > 0.2) { break; }
        var d = Math.abs(n.t - t);
        if (d < bd) {
          bd = d;
          best = n;
        }
      }

      var x = LX + lane * LW + LW / 2;
      if (!best) {
        ghosts++;
        combo = 0;
        score = Math.max(0, score - 40);
        pop = { q: 'ghost', t: now };
        hud();
        return;
      }

      var q;
      if (bd <= 0.045) { q = 'perfect'; }
      else if (bd <= 0.09) { q = 'great'; }
      else { q = 'ok'; }

      best.hit = 1;
      cnt[q]++;
      combo++;
      if (combo > maxCombo) { maxCombo = combo; }

      var base = 100;
      if (q == 'perfect') { base = 300; }
      else if (q == 'great') { base = 200; }
      score += Math.round(base * (1 + Math.min(combo, 50) / 50));

      pop = { q: q, t: now };
      bump = 1;
      var ringCol = LCOL[lane];
      if (q == 'perfect') { ringCol = '#ffffff'; }
      rings.push({ x: x, t: 0, col: ringCol });

      if (q == 'perfect') { env.burst(x, HIT, P.gold, 16, 150, 3); }
      else { env.burst(x, HIT, LCOL[lane], 9, 100, 3); }

      if (combo % 25 == 0) {
        flashT = 1;
        env.shake(4, 0.25);
        env.burst(160, HIT - 40, P.gold, 30, 220, 3);
      }
      hud();
    }

    function finish(){
      state = 'done';
      env.end();
      stopAudio();
      var a = acc();
      var r = rank(a);
      var t = DW.tracks[trackIdx];
      env.award('rhythm');
      if (r == 'S') { env.award('rhythmS'); }
      if (!cnt.miss && !ghosts) { env.award('fullcombo'); }

      if (!St.d.g.rhythmBest) { St.d.g.rhythmBest = {}; }
      var b = St.d.g.rhythmBest;
      var k = bestKey(t.file);
      var old = b[k];
      var newBest = !old || score > old.score;
      if (newBest) { b[k] = { score: score, rank: r }; }
      env.report(score);
      St.save();

      ui.hidden = false;
      ui.textContent = '';
      ui.className = 'gm-layer rh-res';
      ui.appendChild(makeEl('i', 'rk', r));
      ui.appendChild(makeEl('b', null, t.title));
      var scoreLine = 'SCORE ' + score;
      if (newBest) { scoreLine = scoreLine + '  NEW BEST!'; }
      ui.appendChild(makeEl('span', null, scoreLine));
      ui.appendChild(makeEl('span', null, 'PERFECT ' + cnt.perfect + '  GREAT ' + cnt.great + '  OK ' + cnt.ok));
      ui.appendChild(makeEl('span', null, 'MISS ' + cnt.miss + '  WRONG TAPS ' + ghosts));
      ui.appendChild(makeEl('span', null, 'ACCURACY ' + a.toFixed(1) + '%   MAX COMBO ' + maxCombo));

      var row = makeEl('div', 'rh-row');
      var again = makeEl('button', 'cm-go', 'RETRY');
      var songs = makeEl('button', 'cm-go', 'SONGS');
      again.type = 'button';
      songs.type = 'button';
      again.addEventListener('click', function(){
        ui.hidden = true;
        launch(cache[t.file + '|' + diff]);
      });
      songs.addEventListener('click', function(){ menu(); });
      row.appendChild(again);
      row.appendChild(songs);
      ui.appendChild(row);
    }

    function draw(c){
      c.fillStyle = P.bg;
      c.fillRect(0, 0, 320, 440);

      // lanes
      var i;
      for (i = 0; i < LANES; i++) {
        var x = LX + i * LW;
        if (i % 2 == 1) { c.fillStyle = '#3a0b3d'; } else { c.fillStyle = '#330935'; }
        c.fillRect(x, 0, LW, 440);
        c.fillStyle = P.grid;
        c.fillRect(x, 0, 1, 440);

        if (lit[i] > 0) {
          var grad = c.createLinearGradient(0, HIT + 14, 0, 0);
          grad.addColorStop(0, LCOL[i]);
          grad.addColorStop(1, 'rgba(0, 0, 0,0)');
          c.globalAlpha = lit[i] * 0.45;
          c.fillStyle = grad;
          c.fillRect(x + 1, 0, LW - 1, HIT + 14);
          c.globalAlpha = 1;
        }
      }
      c.fillStyle = P.grid;
      c.fillRect(LX + LANES * LW, 0, 1, 440);

      if (state != 'play' && state != 'done') { return; }

      // notes
      var lead = DIFF[diff].lead;
      var tt = gt - offset / 1000;
      for (i = 0; i < notes.length; i++) {
        var n = notes[i];
        if (n.hit == 1) { continue; }
        var y = HIT - (n.t - tt) / lead * (HIT - TOP);
        if (y < TOP - 14) { break; }
        if (y > 460) { continue; }
        if (n.hit == -1) {
          c.globalAlpha = 0.25;
          G.bevel(c, LX + n.lane * LW + 5, y - 7, LW - 10, 14, '#7a6a9a');
          c.globalAlpha = 1;
        } else {
          G.bevel(c, LX + n.lane * LW + 5, y - 7, LW - 10, 14, LCOL[n.lane]);
        }
      }

      // hit rings
      for (i = 0; i < rings.length; i++) {
        var rg = rings[i];
        var k = rg.t / 0.35;
        c.globalAlpha = 1 - k;
        c.strokeStyle = rg.col;
        c.lineWidth = 3 * (1 - k) + 1;
        c.beginPath();
        c.arc(rg.x, HIT, 8 + k * 34, 0, 6.283);
        c.stroke();
      }
      c.globalAlpha = 1;

      // hit line + key letters
      var letters = ['D', 'F', 'J', 'K'];
      for (i = 0; i < LANES; i++) {
        var rx = LX + i * LW;
        var press = lit[i];
        if (press > 0.3) { c.fillStyle = LCOL[i]; }
        else { c.fillStyle = 'rgba(255, 255, 255,.18)'; }
        c.fillRect(rx + 4 + press * 3, HIT + 6, LW - 8 - press * 6, 4);
        c.fillStyle = LCOL[i];
        c.fillRect(rx + 4, HIT - 8, LW - 8, 2);
        text(c, letters[i], rx + LW / 2, HIT + 22, 14 + press * 3, LCOL[i], 'center');
      }

      if (combo > 2) {
        text(c, String(combo), 160, 140 - bump * 4, 34 + bump * 12, 'rgba(255, 255, 255,.85)', 'center');
        text(c, 'COMBO', 160, 190, 11, P.p3, 'center');
      }

      // PERFECT / GREAT / MISS popup
      if (pop) {
        var age = performance.now() - pop.t;
        if (age < 480) {
          var sz = 16 + Math.max(0, 1 - age / 120) * 10;
          var col;
          if (pop.q == 'perfect') { col = P.gold; }
          else if (pop.q == 'great') { col = P.pk; }
          else if (pop.q == 'ok') { col = P.p3; }
          else { col = '#ff6b6b'; }
          var label = pop.q.toUpperCase();
          if (pop.q == 'ghost') { label = 'WRONG'; }
          c.globalAlpha = Math.min(1, (480 - age) / 200);
          text(c, label, 160, 235 - age / 28, sz, col, 'center');
          c.globalAlpha = 1;
        }
      }

      if (flashT > 0) {
        c.fillStyle = 'rgba(255, 255, 255,' + (flashT * 0.25).toFixed(2) + ')';
        c.fillRect(0, 0, 320, 440);
      }
      if (!audioOn && state == 'play') { text(c, 'GET READY', 160, 210, 16, '#ffffff', 'center'); }
    }

    return {
      start: function(){
        offset = savedOffset();
        prev = { idx: A.index(), playing: A.playing };
        menu();
        draw(env.ctx);
      },
      draw: draw,
      frame: function(dt, c){
        var i;
        for (i = 0; i < LANES; i++) {
          if (lit[i] > 0) { lit[i] = Math.max(0, lit[i] - dt * 6); }
        }
        bump = Math.max(0, bump - dt * 6);
        flashT = Math.max(0, flashT - dt * 3);
        for (i = rings.length - 1; i >= 0; i--) {
          rings[i].t += dt;
          if (rings[i].t >= 0.35) { rings.splice(i, 1); }
        }

        if (state == 'play') {
          gt = clock(performance.now());
          var t = gt - offset / 1000;

          // notes that slid past the window count as misses
          for (var k = 0; k < notes.length; k++) {
            var n = notes[k];
            if (n.hit) { continue; }
            if (n.t < t - 0.14) {
              n.hit = -1;
              cnt.miss++;
              combo = 0;
              pop = { q: 'miss', t: performance.now() };
              hud();
            } else if (n.t > t) {
              break;
            }
          }

          var lastN = notes[notes.length - 1];
          if (audioOn && lastN && t > lastN.t + 1.2) { finish(); }
          else if (audioOn && A.el.ended) { finish(); }
        }
        draw(c);
      },
      key: function(k, down, rep){
        if (!down || rep) { return; }
        // only the lane keys (l0 to l3), not enter or anything else
        if (/^l[0-3]$/.test(k)) { judge(Number(k.charAt(1))); }
      },
      pointer: function(t, x){
        if (t != 'down') { return; }
        var lane = Math.floor((x - LX) / LW);
        if (lane >= 0 && lane < LANES) { judge(lane); }
      },
      onpause: function(){
        try { A.el.pause(); } catch(e) {}
      },
      onresume: function(){
        if (audioOn) {
          var p = A.el.play();
          if (p && p.catch) { p.catch(function(){}); }
          lastPerf = performance.now();
        } else {
          // still counting down, carry on from where it was
          leadStart = performance.now() - (1.6 + Math.min(0, gt)) * 1000;
        }
      },
      stop: function(){
        token++;
        stopAudio();
        ui.className = 'gm-layer';
        if (prev) {
          A.load(prev.idx, prev.playing);
          prev = null;
        }
      }
    };
  }
});
})();
