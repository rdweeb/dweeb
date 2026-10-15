(function () {
  var DW = window.DW, G = DW.games, P = G.pal, A = DW.audio, St = DW.store;

  var LANES = 4, LW = 70, LX = 20, HIT = 372, TOP = -16;
  var LCOL = ['#de37e4', '#5a87d0', '#f3b5f6', '#ffd34d'];
  var KEYS = { d: 'l0', f: 'l1', j: 'l2', k: 'l3', arrowleft: 'l0', arrowdown: 'l1', arrowup: 'l2', arrowright: 'l3', enter: 'enter', ' ': 'enter' };
  var DIFF = {
    easy: { gap: 0.36, lead: 1.7, mult: 1.9 },
    normal: { gap: 0.23, lead: 1.4, mult: 1.5 },
    hard: { gap: 0.15, lead: 1.15, mult: 1.2 }
  };
  var cache = {};

  function decode(file) {
    return fetch('audio/' + file).then(function (r) {
      if (!r.ok) throw new Error('missing ' + file);
      return r.arrayBuffer();
    }).then(function (buf) {
      var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OC) throw new Error('no audio decoder');
      var oc;
      try { oc = new OC(1, 1, 22050); } catch (e) { oc = new OC(1, 1, 44100); }
      return new Promise(function (res, rej) {
        var p = oc.decodeAudioData(buf, res, rej);
        if (p && p.then) p.then(res, rej);
      });
    });
  }

  function analyse(buf, progress) {
    return new Promise(function (resolve) {
      var sr = buf.sampleRate, n = buf.length, c0 = buf.getChannelData(0), c1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
      var hop = 256, frames = Math.floor(n / hop);
      var a1 = 1 - Math.exp(-2 * Math.PI * 200 / sr), a2 = 1 - Math.exp(-2 * Math.PI * 2000 / sr);
      var lo = new Float32Array(frames), mi = new Float32Array(frames), hi = new Float32Array(frames);
      var l1 = 0, l2 = 0, f = 0, pos = 0, CH = 300000;
      (function chunk() {
        var end = Math.min(frames * hop, pos + CH);
        while (pos < end) {
          var sl = 0, sm = 0, sh = 0, stop = pos + hop;
          for (; pos < stop; pos++) {
            var x = c1 ? (c0[pos] + c1[pos]) * 0.5 : c0[pos];
            l1 += a1 * (x - l1);
            l2 += a2 * (x - l2);
            var m = l2 - l1, h = x - l2;
            sl += l1 * l1; sm += m * m; sh += h * h;
          }
          lo[f] = Math.sqrt(sl / hop); mi[f] = Math.sqrt(sm / hop); hi[f] = Math.sqrt(sh / hop);
          f++;
        }
        progress(pos / (frames * hop));
        if (pos < frames * hop) setTimeout(chunk, 0);
        else resolve({ lo: lo, mi: mi, hi: hi, frames: frames, hop: hop, sr: sr, dur: n / sr });
      })();
    });
  }

  function flux(e) {
    var n = e.length, out = new Float32Array(n), i;
    for (i = 2; i < n; i++) out[i] = Math.max(0, Math.log(1 + e[i] * 60) - Math.log(1 + e[i - 2] * 60));
    return out;
  }

  function candidates(fl, band, mult, fh) {
    var n = fl.length, win = 43, out = [], sum = 0, i;
    for (i = 0; i < Math.min(n, win); i++) sum += fl[i];
    for (i = 0; i < n; i++) {
      var a = i + win, b = i - win - 1;
      if (a < n) sum += fl[a];
      if (b >= 0) sum -= fl[b];
      var cnt = Math.min(n - 1, i + win) - Math.max(0, i - win) + 1, thr = sum / cnt * mult + 0.015;
      var v = fl[i];
      if (v > thr && v >= fl[i - 1] && v >= fl[i + 1] && v >= (fl[i - 2] || 0) && v >= (fl[i + 2] || 0)) out.push({ t: i * fh, band: band, s: v / thr });
    }
    return out;
  }

  function chart(an, diff) {
    var d = DIFF[diff], fh = an.hop / an.sr, fl = [flux(an.lo), flux(an.mi), flux(an.hi)], notes = [], mult = d.mult, tries = 0;
    do {
      var cand = [];
      for (var b = 0; b < 3; b++) cand = cand.concat(candidates(fl[b], b, mult, fh));
      cand = cand.filter(function (c) { return c.t > 1.2 && c.t < an.dur - 1.5; });
      cand.sort(function (x, y) { return y.s - x.s; });
      var occ = new Uint8Array(Math.ceil(an.dur * 100) + 200), acc = [], span = Math.round(d.gap * 100);
      cand.forEach(function (c) {
        var k = Math.round(c.t * 100);
        if (occ[k]) return;
        for (var j = Math.max(0, k - span + 1); j < k + span; j++) occ[j] = 1;
        acc.push(c);
      });
      acc.sort(function (x, y) { return x.t - y.t; });
      notes = acc;
      mult *= 0.75;
      tries++;
    } while (notes.length < Math.min(40, an.dur / 4) && tries < 5);
    var last = -1, seed = 7;
    return notes.map(function (c, i) {
      var opts = c.band === 0 ? [0, 1] : c.band === 1 ? [1, 2] : [2, 3];
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      var lane = opts[seed % 2];
      if (lane === last) lane = opts[0] === lane ? opts[1] : opts[0];
      if (lane === last) lane = (lane + 1) % LANES;
      last = lane;
      return { t: c.t, lane: lane, hit: 0 };
    });
  }

  function ownCache(file, diff) { return cache[file + '|' + diff]; }

  function rank(acc) { return acc >= 95 ? 'S' : acc >= 85 ? 'A' : acc >= 70 ? 'B' : acc >= 55 ? 'C' : 'D'; }

  function text(c, s, x, y, size, col, align) {
    c.font = 'bold ' + size + 'px Tahoma, Verdana, sans-serif';
    c.textAlign = align || 'left';
    c.textBaseline = 'top';
    c.fillStyle = col || '#ffffff';
    c.fillText(s, x, y);
  }

  G.add({
    id: 'rhythm', name: 'RHYTHM', blurb: 'hit the notes to your own songs.', w: 320, h: 440, keymap: KEYS, bestLabel: 'BEST SCORE',
    help: 'D F J K (or the arrow keys) hit the lanes. on a phone tap the lanes. P pauses.',
    make: function (env) {
      var ui = env.layer, diff = 'normal', notes = [], state = 'menu', gt = 0, lastCt = 0, lastPerf = 0, leadStart = 0, audioOn = false;
      var score = 0, combo = 0, maxCombo = 0, cnt, ghosts = 0, lit = [0, 0, 0, 0], lastPress = [0, 0, 0, 0], rings = [], bump = 0, flashT = 0, pop = null, trackIdx = 0, prev = null, token = 0, nextIdx = 0, offset = 0, total = 0;

      function savedOffset() { var o = St.d.g.rhythmOffset; return typeof o === 'number' ? o : 0; }
      function setOffset(v) { offset = Math.max(-300, Math.min(300, v)); St.d.g.rhythmOffset = offset; St.save(); }

      function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }

      function bestKey(file) { return file + '|' + diff; }
      function bestOf(file) { var b = St.d.g.rhythmBest || {}; return b[bestKey(file)]; }

      function menu() {
        var was = state;
        state = 'menu';
        token++;
        if (was === 'play' || was === 'done') stopAudio();
        env.clear();
        env.end();
        ui.hidden = false;
        ui.textContent = '';
        ui.className = 'gm-layer rh-menu';
        ui.appendChild(el('b', null, 'PICK A SONG'));
        var dr = el('div', 'rh-row');
        ['easy', 'normal', 'hard'].forEach(function (k) {
          var b = el('button', 'tab' + (k === diff ? ' on' : ''), k.toUpperCase());
          b.type = 'button';
          b.addEventListener('click', function () { diff = k; menu(); });
          dr.appendChild(b);
        });
        ui.appendChild(dr);
        var list = el('div', 'rh-list');
        DW.tracks.forEach(function (t, i) {
          var b = el('button', 'rh-song');
          b.type = 'button';
          b.appendChild(el('b', null, t.title));
          var bs = bestOf(t.file);
          b.appendChild(el('span', null, bs ? bs.rank + '  ' + bs.score : (t.artist || '')));
          b.addEventListener('click', function () { choose(i); });
          list.appendChild(b);
        });
        ui.appendChild(list);
        var cal = el('div', 'rh-row rh-cal');
        var minus = el('button', 'tab', '-10'), plus = el('button', 'tab', '+10'), val = el('span', null, 'TIMING ' + offset + 'ms');
        minus.type = plus.type = 'button';
        minus.addEventListener('click', function () { setOffset(offset - 10); val.textContent = 'TIMING ' + offset + 'ms'; });
        plus.addEventListener('click', function () { setOffset(offset + 10); val.textContent = 'TIMING ' + offset + 'ms'; });
        cal.appendChild(minus);
        cal.appendChild(val);
        cal.appendChild(plus);
        ui.appendChild(cal);
        ui.appendChild(el('small', null, 'notes feel late? raise it. early? lower it.'));
        env.hud('', '');
      }

      function stopAudio() {
        audioOn = false;
        try { A.el.pause(); } catch (e) {}
      }

      function choose(i) {
        trackIdx = i;
        var t = DW.tracks[i], my = ++token;
        state = 'load';
        ui.textContent = '';
        ui.className = 'gm-layer rh-menu';
        var msg = el('b', null, 'ANALYSING ' + t.title.toUpperCase());
        var bar = el('div', 'bar2');
        bar.appendChild(el('i'));
        var sub = el('small', null, 'finding the beat. this takes a few seconds.');
        ui.appendChild(msg);
        ui.appendChild(bar);
        ui.appendChild(sub);
        var have = ownCache(t.file, diff);
        if (have) return launch(have);
        decode(t.file).then(function (buf) {
          if (my !== token) return;
          return analyse(buf, function (p) { if (my === token) bar.firstChild.style.width = Math.round(p * 100) + '%'; });
        }).then(function (an) {
          if (!an || my !== token) return;
          var ch = chart(an, diff);
          cache[t.file + '|' + diff] = ch;
          launch(ch);
        }).catch(function (e) {
          if (my !== token) return;
          console.error('[dweeb] rhythm analysis failed', e);
          ui.textContent = '';
          ui.appendChild(el('b', null, 'COULD NOT LOAD THAT SONG'));
          ui.appendChild(el('small', null, 'this browser could not read the audio file.'));
          var b = el('button', 'cm-go', 'BACK');
          b.type = 'button';
          b.addEventListener('click', menu);
          ui.appendChild(b);
        });
      }

      function launch(ch) {
        notes = ch.map(function (n) { return { t: n.t, lane: n.lane, hit: 0 }; });
        total = notes.length;
        score = 0; combo = 0; maxCombo = 0;
        cnt = { perfect: 0, great: 0, ok: 0, miss: 0 };
        ghosts = 0; rings = []; bump = 0; flashT = 0;
        pop = null;
        ui.hidden = true;
        ui.textContent = '';
        env.played();
        env.start();
        state = 'play';
        if (!prev) prev = { idx: A.index(), playing: A.playing };
        A.load(trackIdx, false);
        stopAudio();
        try { A.el.currentTime = 0; } catch (e) {}
        leadStart = performance.now();
        audioOn = false;
        lastCt = 0;
        hud();
      }

      function hud() {
        var done = cnt.perfect + cnt.great + cnt.ok + cnt.miss;
        env.hud('SCORE ' + score + '   COMBO ' + combo, done ? Math.round(acc() * 10) / 10 + '%' : '');
      }
      function acc() {
        var done = cnt.perfect + cnt.great + cnt.ok + cnt.miss + ghosts;
        return done ? (cnt.perfect + cnt.great * 0.7 + cnt.ok * 0.4) / done * 100 : 100;
      }

      function clock(now) {
        if (!audioOn) {
          var g = (now - leadStart) / 1000 - 1.6;
          if (g >= 0) {
            audioOn = true;
            var p = A.el.play();
            if (p && p.catch) p.catch(function () {});
            lastCt = A.el.currentTime;
            lastPerf = now;
            return 0;
          }
          return g;
        }
        var ct = A.el.currentTime;
        if (ct !== lastCt) { lastCt = ct; lastPerf = now; }
        return lastCt + (A.el.paused ? 0 : (now - lastPerf) / 1000);
      }

      function judge(lane) {
        if (state !== 'play' || !audioOn) return;
        var now = performance.now();
        if (now - lastPress[lane] < 70) return;
        lastPress[lane] = now;
        lit[lane] = 1;
        var best = null, bd = 0.14, t = gt - offset / 1000;
        for (var i = 0; i < notes.length; i++) {
          var n = notes[i];
          if (n.hit || n.lane !== lane) continue;
          if (n.t - t > 0.2) break;
          var d = Math.abs(n.t - t);
          if (d < bd) { bd = d; best = n; }
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
        var q = bd <= 0.045 ? 'perfect' : bd <= 0.09 ? 'great' : 'ok';
        best.hit = 1;
        cnt[q]++;
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        score += Math.round({ perfect: 300, great: 200, ok: 100 }[q] * (1 + Math.min(combo, 50) / 50));
        pop = { q: q, t: now };
        bump = 1;
        rings.push({ x: x, t: 0, col: q === 'perfect' ? '#ffffff' : LCOL[lane] });
        env.burst(x, HIT, q === 'perfect' ? P.gold : LCOL[lane], q === 'perfect' ? 16 : 9, q === 'perfect' ? 150 : 100, 3);
        if (combo % 25 === 0) { flashT = 1; env.shake(4, 0.25); env.burst(160, HIT - 40, P.gold, 30, 220, 3); }
        hud();
      }

      function finish() {
        state = 'done';
        env.end();
        stopAudio();
        var a = acc(), r = rank(a), t = DW.tracks[trackIdx];
        env.award('rhythm');
        if (r === 'S') env.award('rhythmS');
        if (!cnt.miss && !ghosts) env.award('fullcombo');
        var b = St.d.g.rhythmBest = St.d.g.rhythmBest || {}, k = bestKey(t.file), old = b[k], nb = !old || score > old.score;
        if (nb) b[k] = { score: score, rank: r };
        env.report(score);
        St.save();
        ui.hidden = false;
        ui.textContent = '';
        ui.className = 'gm-layer rh-res';
        ui.appendChild(el('i', 'rk', r));
        ui.appendChild(el('b', null, t.title));
        ui.appendChild(el('span', null, 'SCORE ' + score + (nb ? '  NEW BEST!' : '')));
        ui.appendChild(el('span', null, 'PERFECT ' + cnt.perfect + '  GREAT ' + cnt.great + '  OK ' + cnt.ok));
        ui.appendChild(el('span', null, 'MISS ' + cnt.miss + '  WRONG TAPS ' + ghosts));
        ui.appendChild(el('span', null, 'ACCURACY ' + a.toFixed(1) + '%   MAX COMBO ' + maxCombo));
        var row = el('div', 'rh-row');
        var again = el('button', 'cm-go', 'RETRY'), songs = el('button', 'cm-go', 'SONGS');
        again.type = songs.type = 'button';
        again.addEventListener('click', function () { ui.hidden = true; launch(cache[t.file + '|' + diff]); });
        songs.addEventListener('click', menu);
        row.appendChild(again);
        row.appendChild(songs);
        ui.appendChild(row);
      }

      function draw(c) {
        c.fillStyle = P.bg;
        c.fillRect(0, 0, 320, 440);
        for (var i = 0; i < LANES; i++) {
          var x = LX + i * LW;
          c.fillStyle = i & 1 ? '#3a0b3d' : '#330935';
          c.fillRect(x, 0, LW, 440);
          c.fillStyle = P.grid;
          c.fillRect(x, 0, 1, 440);
          if (lit[i] > 0) {
            var g = c.createLinearGradient(0, HIT + 14, 0, 0);
            g.addColorStop(0, LCOL[i]);
            g.addColorStop(1, 'rgba(0, 0, 0,0)');
            c.globalAlpha = lit[i] * 0.45;
            c.fillStyle = g;
            c.fillRect(x + 1, 0, LW - 1, HIT + 14);
            c.globalAlpha = 1;
          }
        }
        c.fillStyle = P.grid;
        c.fillRect(LX + LANES * LW, 0, 1, 440);
        if (state !== 'play' && state !== 'done') return;
        var lead = DIFF[diff].lead, tt = gt - offset / 1000;
        for (i = 0; i < notes.length; i++) {
          var n = notes[i];
          if (n.hit === 1) continue;
          var y = HIT - (n.t - tt) / lead * (HIT - TOP);
          if (y < TOP - 14) break;
          if (y > 460) continue;
          if (n.hit === -1) { c.globalAlpha = 0.25; G.bevel(c, LX + n.lane * LW + 5, y - 7, LW - 10, 14, '#7a6a9a'); c.globalAlpha = 1; }
          else G.bevel(c, LX + n.lane * LW + 5, y - 7, LW - 10, 14, LCOL[n.lane]);
        }
        for (i = 0; i < rings.length; i++) {
          var rg = rings[i], k = rg.t / 0.35;
          c.globalAlpha = 1 - k;
          c.strokeStyle = rg.col;
          c.lineWidth = 3 * (1 - k) + 1;
          c.beginPath();
          c.arc(rg.x, HIT, 8 + k * 34, 0, 6.283);
          c.stroke();
        }
        c.globalAlpha = 1;
        for (i = 0; i < LANES; i++) {
          var rx = LX + i * LW, press = lit[i];
          c.fillStyle = press > 0.3 ? LCOL[i] : 'rgba(255, 255, 255,.18)';
          c.fillRect(rx + 4 + press * 3, HIT + 6, LW - 8 - press * 6, 4);
          c.fillStyle = LCOL[i];
          c.fillRect(rx + 4, HIT - 8, LW - 8, 2);
          text(c, ['D', 'F', 'J', 'K'][i], rx + LW / 2, HIT + 22, 14 + press * 3, LCOL[i], 'center');
        }
        if (combo > 2) {
          text(c, String(combo), 160, 140 - bump * 4, 34 + bump * 12, 'rgba(255, 255, 255,.85)', 'center');
          text(c, 'COMBO', 160, 190, 11, P.p3, 'center');
        }
        if (pop) {
          var age = performance.now() - pop.t;
          if (age < 480) {
            var sz = 16 + Math.max(0, 1 - age / 120) * 10, col = pop.q === 'perfect' ? P.gold : pop.q === 'great' ? P.pk : pop.q === 'ok' ? P.p3 : '#ff6b6b';
            c.globalAlpha = Math.min(1, (480 - age) / 200);
            text(c, pop.q === 'ghost' ? 'WRONG' : pop.q.toUpperCase(), 160, 235 - age / 28, sz, col, 'center');
            c.globalAlpha = 1;
          }
        }
        if (flashT > 0) { c.fillStyle = 'rgba(255, 255, 255,' + (flashT * 0.25).toFixed(2) + ')'; c.fillRect(0, 0, 320, 440); }
        if (!audioOn && state === 'play') text(c, 'GET READY', 160, 210, 16, '#ffffff', 'center');
      }

      return {
        start: function () {
          offset = savedOffset();
          prev = { idx: A.index(), playing: A.playing };
          menu();
          draw(env.ctx);
        },
        draw: draw,
        frame: function (dt, c) {
          for (var i = 0; i < LANES; i++) if (lit[i] > 0) lit[i] = Math.max(0, lit[i] - dt * 6);
          bump = Math.max(0, bump - dt * 6);
          flashT = Math.max(0, flashT - dt * 3);
          for (i = rings.length - 1; i >= 0; i--) { rings[i].t += dt; if (rings[i].t >= 0.35) rings.splice(i, 1); }
          if (state === 'play') {
            gt = clock(performance.now());
            var t = gt - offset / 1000;
            for (var k = 0; k < notes.length; k++) {
              var n = notes[k];
              if (n.hit) continue;
              if (n.t < t - 0.14) { n.hit = -1; cnt.miss++; combo = 0; pop = { q: 'miss', t: performance.now() }; hud(); }
              else if (n.t > t) break;
            }
            var lastN = notes[notes.length - 1];
            if (audioOn && lastN && t > lastN.t + 1.2) finish();
            else if (audioOn && A.el.ended) finish();
          }
          draw(c);
        },
        key: function (k, down, rep) {
          if (!down || rep) return;
          if (k.charAt(0) === 'l') judge(+k.charAt(1));
        },
        pointer: function (t, x) {
          if (t !== 'down') return;
          var lane = Math.floor((x - LX) / LW);
          if (lane >= 0 && lane < LANES) judge(lane);
        },
        onpause: function () { try { A.el.pause(); } catch (e) {} },
        onresume: function () {
          if (audioOn) { var p = A.el.play(); if (p && p.catch) p.catch(function () {}); lastPerf = performance.now(); }
          else leadStart = performance.now() - (1.6 + Math.min(0, gt)) * 1000;
        },
        stop: function () {
          token++;
          stopAudio();
          ui.className = 'gm-layer';
          if (prev) { A.load(prev.idx, prev.playing); prev = null; }
        }
      };
    }
  });
})();
