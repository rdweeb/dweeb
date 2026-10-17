(function () {
  var DW = window.DW, G = DW.games, P = G.pal, text = G.text;

  function same(a, b) { return a.x === b.x && a.y === b.y; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  G.add({
    id: 'snake', name: 'SNAKE', blurb: 'eat the apples. dont bite yourself.', w: 320, h: 320, swipe: true,
    help: 'ARROWS / WASD to turn. swipe on a phone. P pauses.',
    modes: [
      { id: 'classic', name: 'CLASSIC', desc: 'walls are deadly.' },
      { id: 'wrap', name: 'WRAP', desc: 'walk through the walls.' },
      { id: 'speed', name: 'SPEED', desc: 'starts fast and gets silly.' },
      { id: 'rocks', name: 'ROCKS', desc: 'dodge the rocks too.' }
    ],
    make: function (env) {
      var N = 20, C = 16, mode = env.mode, snake, prev, dir, queue, food, rocks, score, acc, over, clock = 0;

      function free(x, y) {
        var p = { x: x, y: y };
        return !snake.some(function (s) { return same(s, p); }) && !rocks.some(function (r) { return same(r, p); });
      }
      function spawn() {
        var f;
        do { f = { x: rnd(N), y: rnd(N) }; } while (!free(f.x, f.y));
        food = f;
      }
      function reset() {
        snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        prev = snake.map(function (s) { return { x: s.x, y: s.y }; });
        dir = { x: 1, y: 0 };
        queue = [];
        rocks = [];
        score = 0;
        acc = 0;
        over = false;
        if (mode === 'rocks') {
          while (rocks.length < 9) {
            var r = { x: rnd(N), y: rnd(N) };
            if (Math.abs(r.y - 10) <= 1 && r.x < 17) continue;
            if (!rocks.some(function (o) { return same(o, r); })) rocks.push(r);
          }
        }
        spawn();
        hud();
      }
      function hud() { env.hud('APPLES ' + score, 'BEST ' + Math.max(env.best(), score)); }
      function begin() { reset(); env.clear(); env.start(); env.played(); }
      function interval() { return mode === 'speed' ? Math.max(45, 90 - score * 2.5) : Math.max(65, 135 - score * 3); }

      function die() {
        over = true;
        env.end();
        env.shake(7, 0.3);
        env.burst(snake[0].x * C + 8, snake[0].y * C + 8, P.p3, 22, 120, 3);
        var nb = env.report(score);
        hud();
        env.say('GAME OVER', score + ' apples' + (nb ? '  -  NEW BEST!' : ''), 'PLAY AGAIN', begin);
      }
      function step() {
        prev = snake.map(function (s) { return { x: s.x, y: s.y }; });
        if (queue.length) dir = queue.shift();
        var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (mode === 'wrap') { h.x = (h.x + N) % N; h.y = (h.y + N) % N; }
        else if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N) return die();
        var eat = same(h, food);
        if (snake.slice(0, eat ? snake.length : snake.length - 1).some(function (s) { return same(s, h); })) return die();
        if (rocks.some(function (r) { return same(r, h); })) return die();
        snake.unshift(h);
        if (eat) {
          score++;
          env.burst(food.x * C + 8, food.y * C + 8, P.pk, 12, 90);
          if (score >= 15) env.award('snake15');
          spawn();
          hud();
        } else snake.pop();
      }

      function draw(c, f) {
        c.fillStyle = P.bg;
        c.fillRect(0, 0, 320, 320);
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if ((x + y) & 1) { c.fillStyle = P.bg2; c.fillRect(x * C, y * C, C, C); }
        if (!snake) return;
        rocks.forEach(function (r) { G.bevel(c, r.x * C + 1, r.y * C + 1, C - 2, C - 2, '#7c4d7f'); });
        var pulse = 1 + Math.sin(clock * 9) * 0.12, fs = (C - 4) * pulse;
        G.bevel(c, food.x * C + 8 - fs / 2, food.y * C + 8 - fs / 2, fs, fs, P.pk);
        for (var i = snake.length - 1; i >= 0; i--) {
          var s = snake[i], o = prev[Math.min(i, prev.length - 1)], px = s.x, py = s.y;
          if (Math.abs(o.x - s.x) <= 1 && Math.abs(o.y - s.y) <= 1) { px = o.x + (s.x - o.x) * f; py = o.y + (s.y - o.y) * f; }
          G.bevel(c, px * C + 1, py * C + 1, C - 2, C - 2, i ? P.p2 : P.p3);
          if (!i) {
            c.fillStyle = P.ink;
            c.fillRect(px * C + 4 + dir.x * 2, py * C + 4 + dir.y * 2, 3, 3);
            c.fillRect(px * C + 9 + dir.x * 2, py * C + 9 + dir.y * 2, 3, 3);
          }
        }
      }

      return {
        start: function () { reset(); env.say('SNAKE', 'press ENTER or tap to start', 'START', begin); },
        draw: function (c) { draw(c, 1); },
        frame: function (dt, c) {
          clock += dt;
          acc += dt * 1000;
          var ms = interval();
          while (acc >= ms && !over) { acc -= ms; step(); }
          draw(c, over ? 1 : Math.min(1, acc / ms));
        },
        key: function (k, down) {
          if (!down) return;
          var d = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[k];
          if (!d || over) return;
          var ref = queue.length ? queue[queue.length - 1] : dir;
          if ((d[0] === -ref.x && d[1] === -ref.y) || (d[0] === ref.x && d[1] === ref.y)) return;
          if (queue.length < 2) queue.push({ x: d[0], y: d[1] });
        }
      };
    }
  });

  G.add({
    id: 'pong', name: 'PONG', blurb: 'first to 5 wins.', w: 320, h: 240, bestLabel: 'BEST LEAD',
    help: 'UP / DOWN or W / S to move. drag on a phone. 2 PLAYER: W / S and the arrow keys. P pauses.',
    keymap: function (mode) {
      if (mode !== '2p') return null;
      return { w: 'lu', s: 'ld', arrowup: 'ru', arrowdown: 'rd', enter: 'enter', ' ': 'drop' };
    },
    modes: [
      { id: 'easy', name: 'EASY', desc: 'a sleepy cpu.' },
      { id: 'normal', name: 'NORMAL', desc: 'a fair fight.' },
      { id: 'hard', name: 'HARD', desc: 'a cpu that never blinks.' },
      { id: '2p', name: '2 PLAYER', desc: 'W / S against the arrow keys.' }
    ],
    make: function (env) {
      var AI = { easy: { sp: 95, err: 34 }, normal: { sp: 135, err: 22 }, hard: { sp: 195, err: 8 } }[env.mode];
      var two = env.mode === '2p', PH = 40, PW = 6, B = 6;
      var py, cy, bx, by, vx, vy, sp, ms, mc, wait, over, aim, ptr = null, held = {}, trail = [], flash = [0, 0];

      function serve(dir) {
        bx = 160; by = 120; sp = 170;
        var a = (Math.random() - 0.5) * 0.7;
        vx = Math.cos(a) * sp * dir;
        vy = Math.sin(a) * sp;
        wait = 0.9;
        aim = 0;
        trail = [];
      }
      function hud() { env.hud((two ? 'P1 ' : 'YOU ') + ms + '  :  ' + mc + (two ? ' P2' : ' CPU'), two ? '' : 'BEST LEAD ' + env.best()); }
      function reset() { py = cy = 100; ms = mc = 0; over = false; serve(Math.random() < 0.5 ? 1 : -1); hud(); }
      function begin() { reset(); env.clear(); env.start(); env.played(); }

      function point(me) {
        if (me) ms++; else mc++;
        env.shake(3.5, 0.15);
        env.burst(me ? 316 : 4, by, me ? P.p3 : P.pk, 16, 130);
        hud();
        if (ms >= 5 || mc >= 5) {
          over = true;
          env.end();
          var win = ms > mc;
          if (!two && win) { env.award('pongwin'); env.report(ms - mc); hud(); }
          env.say(two ? (win ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS') : (win ? 'YOU WIN' : 'CPU WINS'), ms + ' - ' + mc, 'REMATCH', begin);
          return;
        }
        serve(me ? -1 : 1);
      }
      function hit(paddleY, left) {
        var rel = Math.max(-1, Math.min(1, (by + B / 2 - (paddleY + PH / 2)) / (PH / 2)));
        sp = Math.min(380, sp * 1.06);
        vx = Math.cos(rel * 0.95) * sp * (left ? 1 : -1);
        vy = Math.sin(rel * 0.95) * sp;
        flash[left ? 0 : 1] = 0.14;
        env.burst(left ? 20 : 300, by + B / 2, '#ffffff', 6, 70);
        if (!left && !two) aim = (Math.random() - 0.5) * AI.err * 1.4;
      }

      function draw(c) {
        c.fillStyle = P.bg;
        c.fillRect(0, 0, 320, 240);
        c.fillStyle = P.grid;
        for (var y = 0; y < 240; y += 14) c.fillRect(159, y, 2, 8);
        if (py == null) return;
        for (var i = 0; i < trail.length; i++) {
          c.globalAlpha = (i + 1) / trail.length * 0.35;
          c.fillStyle = P.p3;
          c.fillRect(trail[i][0], trail[i][1], B, B);
        }
        c.globalAlpha = 1;
        G.bevel(c, 12 - flash[0] * 20, py, PW + flash[0] * 20, PH, flash[0] ? '#ffffff' : P.p3);
        G.bevel(c, 302, cy, PW + flash[1] * 20, PH, flash[1] ? '#ffffff' : P.pk);
        G.bevel(c, bx, by, B, B, '#ffffff');
        text(c, String(ms), 130, 10, 22, P.p3, 'center');
        text(c, String(mc), 190, 10, 22, P.pk, 'center');
      }

      return {
        start: function () { reset(); env.say('PONG', 'press ENTER or tap to start', 'START', begin); },
        draw: draw,
        frame: function (dt, c) {
          flash[0] = Math.max(0, flash[0] - dt);
          flash[1] = Math.max(0, flash[1] - dt);
          var d = ((held.down || held.ld) ? 1 : 0) - ((held.up || held.lu) ? 1 : 0);
          if (ptr != null) py += Math.max(-420 * dt, Math.min(420 * dt, ptr - PH / 2 - py));
          else py += d * 240 * dt;
          py = Math.max(0, Math.min(240 - PH, py));
          if (two) cy += (((held.rd ? 1 : 0) - (held.ru ? 1 : 0)) * 240) * dt;
          else {
            var ta = vx > 0 ? by + B / 2 + aim : 120, mx = (vx > 0 ? AI.sp : AI.sp * 0.6) * dt;
            cy += Math.max(-mx, Math.min(mx, ta - (cy + PH / 2)));
          }
          cy = Math.max(0, Math.min(240 - PH, cy));
          if (wait > 0) wait -= dt;
          else {
            trail.push([bx, by]);
            if (trail.length > 7) trail.shift();
            bx += vx * dt;
            by += vy * dt;
            if (by < 0) { by = 0; vy = Math.abs(vy); }
            if (by > 240 - B) { by = 240 - B; vy = -Math.abs(vy); }
            if (vx < 0 && bx <= 12 + PW && bx >= 6 && by + B >= py && by <= py + PH) { bx = 12 + PW; hit(py, true); }
            if (vx > 0 && bx + B >= 302 && bx + B <= 312 && by + B >= cy && by <= cy + PH) { bx = 302 - B; hit(cy, false); }
            if (bx < -B) point(false);
            else if (bx > 320) point(true);
          }
          draw(c);
        },
        key: function (k, down) { held[k] = down ? 1 : 0; if (down && (k === 'up' || k === 'down')) ptr = null; },
        pointer: function (t, x, y) { ptr = t === 'up' ? null : y; },
        stop: function () { held = {}; ptr = null; }
      };
    }
  });

  var SHAPES = {
    I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]], T: [[1, 0], [0, 1], [1, 1], [2, 1]],
    S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]]
  };
  var TCOL = { I: '#5a87d0', O: '#ffd34d', T: '#de37e4', S: '#6cf0a0', Z: '#ff5c8a', J: '#9db8e6', L: '#ff9a5c' };

  G.add({
    id: 'tetris', name: 'TETRIS', blurb: 'stack the blocks, clear the lines.', w: 240, h: 320,
    help: 'LEFT / RIGHT move, DOWN falls faster, UP or X rotate, Z rotates back, SPACE slams down. P pauses.',
    pad: [['left', '◀', 1], ['right', '▶', 1], ['down', '▼', 1], ['b', '↶'], ['a', '↷'], ['drop', 'DROP']],
    modes: [
      { id: 'marathon', name: 'MARATHON', desc: 'endless. it keeps speeding up.' },
      { id: 'sprint', name: 'SPRINT', desc: 'clear 40 lines as fast as you can.', low: true },
      { id: 'ultra', name: 'ULTRA', desc: 'two minutes. biggest score wins.' }
    ],
    make: function (env) {
      var W = 10, H = 20, S = 16, mode = env.mode, grid, piece, next, bag, score, lines, level, acc, over, clearing, time, hudS = '';

      function fillBag() {
        bag = Object.keys(SHAPES);
        for (var i = bag.length - 1; i > 0; i--) { var j = rnd(i + 1), t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
      }
      function draw1() { if (!bag || !bag.length) fillBag(); return bag.pop(); }
      function collide(cells, x, y) {
        for (var i = 0; i < cells.length; i++) {
          var cx = cells[i][0] + x, cy = cells[i][1] + y;
          if (cx < 0 || cx >= W || cy >= H || (cy >= 0 && grid[cy][cx])) return true;
        }
        return false;
      }
      function spawn() {
        var t = next || draw1();
        next = draw1();
        piece = { t: t, c: SHAPES[t].map(function (b) { return [b[0], b[1]]; }), x: 3, y: 0, size: t === 'I' || t === 'O' ? 4 : 3 };
        if (collide(piece.c, piece.x, piece.y)) finish(false);
      }
      function rotate(dir) {
        if (piece.t === 'O') return;
        var n = piece.size, cells = piece.c.map(function (b) { return dir > 0 ? [n - 1 - b[1], b[0]] : [b[1], n - 1 - b[0]]; });
        var kicks = [0, -1, 1, -2, 2];
        for (var i = 0; i < kicks.length; i++) {
          if (!collide(cells, piece.x + kicks[i], piece.y)) { piece.c = cells; piece.x += kicks[i]; return; }
        }
      }
      function move(dx) { if (!collide(piece.c, piece.x + dx, piece.y)) piece.x += dx; }

      function lock() {
        piece.c.forEach(function (b) {
          var y = b[1] + piece.y;
          if (y >= 0) grid[y][b[0] + piece.x] = piece.t;
          env.burst((b[0] + piece.x) * S + 8, (b[1] + piece.y) * S + 8, TCOL[piece.t], 2, 40, 2);
        });
        var rows = [];
        for (var y = 0; y < H; y++) if (grid[y].every(Boolean)) rows.push(y);
        piece = null;
        acc = 0;
        if (!rows.length) { spawn(); return; }
        clearing = { rows: rows, t: 0 };
        rows.forEach(function (y) { for (var x = 0; x < W; x++) env.burst(x * S + 8, y * S + 8, TCOL[grid[y][x]], 1, 110, 3); });
        if (rows.length >= 4) env.shake(6, 0.3); else env.shake(2, 0.12);
        lines += rows.length;
        score += [0, 100, 300, 500, 800][rows.length] * level;
        level = Math.floor(lines / 10) + 1;
        if (lines >= 10) env.award('tetris10');
      }
      function collapse() {
        clearing.rows.forEach(function (y) { grid.splice(y, 1); grid.unshift(new Array(W).fill(0)); });
        clearing = null;
        if (mode === 'sprint' && lines >= 40) return finish(true);
        spawn();
      }
      function drop1() {
        if (!collide(piece.c, piece.x, piece.y + 1)) { piece.y++; return true; }
        lock();
        return false;
      }
      function finish(done) {
        if (over) return;
        over = true;
        env.end();
        var res, sub = '';
        if (mode === 'sprint') {
          if (done) { var t = Math.round(time * 10) / 10; res = env.report(t, true); sub = t + ' seconds' + (res ? '  -  NEW BEST!' : ''); }
          else sub = lines + ' of 40 lines';
        } else {
          res = env.report(score);
          sub = score + ' points, ' + lines + ' lines' + (res ? '  -  NEW BEST!' : '');
        }
        env.say(mode === 'ultra' && done ? 'TIME UP' : mode === 'sprint' && done ? 'SPRINT CLEAR' : 'GAME OVER', sub, 'PLAY AGAIN', begin);
      }
      function reset() {
        grid = [];
        for (var i = 0; i < H; i++) grid.push(new Array(W).fill(0));
        bag = next = piece = clearing = null;
        score = lines = 0; level = 1; acc = 0; time = 0; over = false; hudS = '';
        spawn();
        paintHud(true);
      }
      function begin() { reset(); env.clear(); env.start(); env.played(); }
      function paintHud(force) {
        var l, r;
        if (mode === 'sprint') { l = 'TIME ' + time.toFixed(1); r = 'LINES ' + lines + '/40'; }
        else if (mode === 'ultra') { l = 'SCORE ' + score; r = 'TIME ' + Math.max(0, Math.ceil(120 - time)); }
        else { l = 'SCORE ' + score; r = 'LINES ' + lines + '  LV ' + level; }
        if (force || l + r !== hudS) { hudS = l + r; env.hud(l, r); }
      }
      function ghostY() { var y = piece.y; while (!collide(piece.c, piece.x, y + 1)) y++; return y; }

      function draw(c, f) {
        c.fillStyle = P.bg;
        c.fillRect(0, 0, 240, 320);
        c.fillStyle = P.bg2;
        c.fillRect(0, 0, 160, 320);
        c.fillStyle = P.grid;
        for (var i = 1; i < W; i++) c.fillRect(i * S, 0, 1, 320);
        for (var j = 1; j < H; j++) c.fillRect(0, j * S, 160, 1);
        c.fillRect(160, 0, 2, 320);
        if (!grid) return;
        for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) if (grid[y][x]) G.bevel(c, x * S, y * S, S, S, TCOL[grid[y][x]]);
        if (clearing) {
          c.fillStyle = 'rgba(255, 255, 255,' + (0.35 + 0.5 * Math.abs(Math.sin(clearing.t * 28))).toFixed(2) + ')';
          clearing.rows.forEach(function (ry) { c.fillRect(0, ry * S, 160, S); });
        }
        if (piece && !over) {
          var gy = ghostY();
          c.fillStyle = 'rgba(255, 255, 255,.14)';
          piece.c.forEach(function (b) { c.fillRect((b[0] + piece.x) * S, (b[1] + gy) * S, S, S); });
          var off = collide(piece.c, piece.x, piece.y + 1) ? 0 : f;
          piece.c.forEach(function (b) { if (b[1] + piece.y >= 0) G.bevel(c, (b[0] + piece.x) * S, (b[1] + piece.y + off) * S, S, S, TCOL[piece.t]); });
        }
        text(c, 'NEXT', 200, 10, 11, P.p3, 'center');
        if (next) SHAPES[next].forEach(function (b) { G.bevel(c, 176 + b[0] * 12 + (next === 'I' ? 0 : 6), 34 + b[1] * 12, 12, 12, TCOL[next]); });
        text(c, 'SCORE', 200, 100, 11, P.p3, 'center');
        text(c, String(score), 200, 116, 14, '#ffffff', 'center');
        text(c, 'LINES', 200, 150, 11, P.p3, 'center');
        text(c, String(lines), 200, 166, 14, '#ffffff', 'center');
        text(c, mode === 'ultra' ? 'TIME' : 'LEVEL', 200, 200, 11, P.p3, 'center');
        text(c, mode === 'ultra' ? String(Math.max(0, Math.ceil(120 - (time || 0)))) : String(level), 200, 216, 14, '#ffffff', 'center');
      }

      return {
        start: function () { reset(); env.say('TETRIS', 'press ENTER or tap to start', 'START', begin); },
        draw: function (c) { draw(c, 0); },
        frame: function (dt, c) {
          time += dt;
          var ms = Math.max(70, 800 * Math.pow(0.85, level - 1));
          if (clearing) {
            clearing.t += dt;
            if (clearing.t >= 0.26) collapse();
          } else if (piece) {
            acc += dt * 1000;
            while (acc >= ms && piece && !over) { acc -= ms; drop1(); }
          }
          if (mode === 'ultra' && time >= 120 && !over) finish(true);
          paintHud(false);
          draw(c, piece ? Math.min(1, acc / ms) : 0);
        },
        key: function (k, down, rep) {
          if (!down || over || !piece || clearing) return;
          if (k === 'left') move(-1);
          else if (k === 'right') move(1);
          else if (k === 'down') { if (drop1()) score += 1; acc = 0; }
          else if (rep) return;
          else if (k === 'up' || k === 'a') rotate(1);
          else if (k === 'b') rotate(-1);
          else if (k === 'drop') {
            var n = 0;
            while (!collide(piece.c, piece.x, piece.y + 1)) { piece.y++; n++; }
            score += n * 2;
            env.shake(2.5, 0.1);
            lock();
          }
        }
      };
    }
  });

  G.add({
    id: 'breakout', name: 'BREAKOUT', blurb: 'bounce the ball, smash the wall.', w: 320, h: 240,
    help: 'LEFT / RIGHT or drag to move. SPACE or tap launches the ball. P pauses.',
    modes: [
      { id: 'classic', name: 'CLASSIC', desc: 'three lives.' },
      { id: 'hard', name: 'HARD', desc: 'fast ball, small paddle, two lives.' },
      { id: 'zen', name: 'ZEN', desc: 'no lives. just smash.' }
    ],
    make: function (env) {
      var mode = env.mode, PW = mode === 'hard' ? 38 : 48, base = mode === 'hard' ? 235 : 185;
      var bricks, px, ball, lives, score, level, over, held = {}, stuck, ptr = null, squash = 0, trail = [], banner = 0;
      var ROW = ['#de37e4', '#ff9a8a', '#ffd34d', '#6cf0a0', '#5a87d0', '#9a2ea3'];

      function build() {
        bricks = [];
        var rows = Math.min(8, 5 + level);
        for (var r = 0; r < rows; r++) for (var c = 0; c < 10; c++) bricks.push({ x: 10 + c * 30, y: 28 + r * 12, w: 28, h: 10, col: ROW[r % ROW.length], pts: (rows - r) * 5 });
      }
      function ready() { stuck = true; trail = []; ball = { x: px + PW / 2, y: 219, vx: 0, vy: 0, r: 3 }; }
      function launch() {
        if (!stuck) return;
        stuck = false;
        var sp = base + level * 12, a = Math.random() * 0.8 - 0.4;
        ball.vx = Math.sin(a) * sp;
        ball.vy = -Math.cos(a) * sp;
      }
      function hud() { env.hud('SCORE ' + score + (mode === 'zen' ? '' : '   LIVES ' + lives), 'BEST ' + Math.max(env.best(), score)); }
      function reset() {
        px = 136; level = 1; score = 0; over = false; squash = 0; banner = 0;
        lives = mode === 'classic' ? 3 : mode === 'hard' ? 2 : 1;
        build(); ready(); hud();
      }
      function begin() { reset(); env.clear(); env.start(); env.played(); }
      function lose() {
        env.shake(4, 0.2);
        env.burst(ball.x, 226, '#ffffff', 10, 100);
        if (mode !== 'zen') lives--;
        hud();
        if (lives <= 0) {
          over = true;
          env.end();
          var nb = env.report(score);
          hud();
          env.say('GAME OVER', score + ' points' + (nb ? '  -  NEW BEST!' : ''), 'PLAY AGAIN', begin);
        } else ready();
      }
      function stepBall(dt) {
        var n = Math.ceil(Math.hypot(ball.vx, ball.vy) * dt / 3) || 1;
        for (var i = 0; i < n; i++) {
          ball.x += ball.vx * dt / n;
          ball.y += ball.vy * dt / n;
          if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
          if (ball.x > 320 - ball.r) { ball.x = 320 - ball.r; ball.vx = -Math.abs(ball.vx); }
          if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
          if (ball.vy > 0 && ball.y + ball.r >= 222 && ball.y - ball.r <= 228 && ball.x >= px - 2 && ball.x <= px + PW + 2) {
            var rel = (ball.x - (px + PW / 2)) / (PW / 2), sp = Math.min(400, Math.hypot(ball.vx, ball.vy) * 1.015);
            ball.vx = Math.sin(rel * 1.05) * sp;
            ball.vy = -Math.cos(rel * 1.05) * sp;
            ball.y = 222 - ball.r;
            squash = 0.12;
            env.burst(ball.x, 222, P.p3, 5, 60);
          }
          for (var k = 0; k < bricks.length; k++) {
            var b = bricks[k];
            if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
              var ox = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r)), oy = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
              if (ox < oy) ball.vx = -ball.vx; else ball.vy = -ball.vy;
              bricks.splice(k, 1);
              score += b.pts;
              env.burst(b.x + 14, b.y + 5, b.col, 9, 100, 3);
              hud();
              break;
            }
          }
          if (!bricks.length) {
            env.award('breakout');
            level++;
            banner = 1.4;
            build();
            ready();
            return;
          }
          if (ball.y > 244) { lose(); return; }
        }
      }

      function draw(c) {
        c.fillStyle = P.bg;
        c.fillRect(0, 0, 320, 240);
        if (!bricks) return;
        bricks.forEach(function (b) { G.bevel(c, b.x, b.y, b.w, b.h, b.col); });
        for (var i = 0; i < trail.length; i++) {
          c.globalAlpha = (i + 1) / trail.length * 0.3;
          c.fillStyle = '#ffffff';
          c.fillRect(trail[i][0] - 2, trail[i][1] - 2, 4, 4);
        }
        c.globalAlpha = 1;
        var sq = squash / 0.12;
        G.bevel(c, px - sq * 4, 222 + sq * 2, PW + sq * 8, 6 - sq * 2, P.p3);
        G.bevel(c, ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2, '#ffffff');
        if (stuck && !over) text(c, 'SPACE / TAP TO LAUNCH', 160, 150, 10, P.p3, 'center');
        if (banner > 0) text(c, 'LEVEL ' + level, 160, 120, 22, 'rgba(255, 255, 255,' + Math.min(1, banner).toFixed(2) + ')', 'center');
      }

      return {
        start: function () { reset(); env.say('BREAKOUT', 'press ENTER or tap to start', 'START', begin); },
        draw: draw,
        frame: function (dt, c) {
          squash = Math.max(0, squash - dt);
          banner = Math.max(0, banner - dt);
          var d = (held.right ? 1 : 0) - (held.left ? 1 : 0);
          if (ptr != null) px += Math.max(-520 * dt, Math.min(520 * dt, ptr - PW / 2 - px));
          else px += d * 260 * dt;
          px = Math.max(0, Math.min(320 - PW, px));
          if (stuck) ball.x = px + PW / 2;
          else {
            trail.push([ball.x, ball.y]);
            if (trail.length > 6) trail.shift();
            stepBall(dt);
          }
          draw(c);
        },
        key: function (k, down) {
          if (k === 'left' || k === 'right') { held[k] = down ? 1 : 0; if (down) ptr = null; }
          else if (down && (k === 'drop' || k === 'up' || k === 'a')) launch();
        },
        pointer: function (t, x) { if (t === 'up') { ptr = null; return; } ptr = x; if (t === 'down') launch(); },
        stop: function () { held = {}; ptr = null; if (!over && score) env.report(score); }
      };
    }
  });

  G.add({
    id: 'g2048', name: '2048', blurb: 'slide and merge the numbers.', w: 320, h: 320, swipe: true, autopause: false,
    help: 'ARROWS / WASD slide the tiles. swipe on a phone. merge two equal tiles.',
    modes: [
      { id: 'classic', name: 'CLASSIC', desc: 'the normal 4 x 4 board.' },
      { id: 'big', name: 'BIG', desc: 'a roomy 5 x 5 board.' },
      { id: 'tiny', name: 'TINY', desc: 'a cramped 3 x 3 board.' }
    ],
    make: function (env) {
      var n = { classic: 4, big: 5, tiny: 3 }[env.mode], gap = 6, cell = (320 - gap * (n + 1)) / n;
      var COL = { 2: '#f3b5f6', 4: '#e98bee', 8: '#de37e4', 16: '#b52fc0', 32: '#8f4fc8', 64: '#5a87d0', 128: '#ffd34d', 256: '#ffb83a', 512: '#6cf0a0', 1024: '#6fe3ff', 2048: '#ffffff' };
      var tiles, slides, score, over, won, anim, pop, queued, endAfter;

      function pos(i) { return gap + i * (cell + gap); }
      function at(x, y) { for (var i = 0; i < tiles.length; i++) if (tiles[i].x === x && tiles[i].y === y) return tiles[i]; return null; }
      function spawnTile() {
        var e = [];
        for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (!at(x, y)) e.push([x, y]);
        if (!e.length) return;
        var p = e[rnd(e.length)];
        tiles.push({ v: Math.random() < 0.9 ? 2 : 4, x: p[0], y: p[1], fresh: true });
      }
      function reset() {
        tiles = []; slides = null; score = 0; over = won = false; anim = pop = 0; queued = endAfter = null;
        spawnTile(); spawnTile();
        hud();
      }
      function hud() { env.hud('SCORE ' + score, 'BEST ' + Math.max(env.best(), score)); }
      function begin() { reset(); env.clear(); env.start(); env.played(); }
      function canMove() {
        if (tiles.length < n * n) return true;
        for (var i = 0; i < tiles.length; i++) {
          var t = tiles[i], r = at(t.x + 1, t.y), d = at(t.x, t.y + 1);
          if ((r && r.v === t.v) || (d && d.v === t.v)) return true;
        }
        return false;
      }

      function move(dir) {
        var dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0, dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
        var next = [], sl = [], gain = 0, moved = false, i, j;
        for (i = 0; i < n; i++) {
          var line = [];
          for (j = 0; j < n; j++) {
            var x = dx ? (dx > 0 ? n - 1 - j : j) : i, y = dy ? (dy > 0 ? n - 1 - j : j) : i, t = at(x, y);
            if (t) line.push(t);
          }
          var slot = 0, k = 0;
          while (k < line.length) {
            var a = line[k], b = line[k + 1], tx = dx ? (dx > 0 ? n - 1 - slot : slot) : i, ty = dy ? (dy > 0 ? n - 1 - slot : slot) : i;
            if (b && b.v === a.v) {
              sl.push({ v: a.v, fx: a.x, fy: a.y, tx: tx, ty: ty }, { v: b.v, fx: b.x, fy: b.y, tx: tx, ty: ty });
              next.push({ v: a.v * 2, x: tx, y: ty, merged: true });
              gain += a.v * 2;
              moved = true;
              k += 2;
            } else {
              sl.push({ v: a.v, fx: a.x, fy: a.y, tx: tx, ty: ty });
              next.push({ v: a.v, x: tx, y: ty });
              if (a.x !== tx || a.y !== ty) moved = true;
              k++;
            }
            slot++;
          }
        }
        if (!moved) return;
        score += gain;
        tiles = next;
        slides = sl;
        anim = 0;
        pop = 0;
        spawnTile();
        var max = 0;
        tiles.forEach(function (t) { if (t.v > max) max = t.v; });
        if (max >= 512) env.award('fivetwelve');
        if (max >= 2048) { env.award('twentyfortyeight'); if (!won) { won = true; DW.toast('2048! keep going if you want'); } }
        hud();
        if (!canMove()) endAfter = true;
      }

      function tile(c, v, x, y, s) {
        var w = cell * s, o = (cell - w) / 2;
        G.bevel(c, pos(x) + o, pos(y) + o, w, w, COL[v] || '#ffffff');
        if (s > 0.5) text(c, String(v), pos(x) + cell / 2, pos(y) + cell / 2 - (v > 999 ? 8 : 11) * s * (n === 5 ? 0.8 : 1), (v > 999 ? 20 : v > 99 ? 26 : 32) * s * (n === 5 ? 0.8 : n === 3 ? 1.15 : 1), v < 8 ? P.ink : '#ffffff', 'center');
      }

      function draw(c) {
        c.fillStyle = P.bg;
        c.fillRect(0, 0, 320, 320);
        if (!tiles) return;
        for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) G.bevel(c, pos(x), pos(y), cell, cell, '#57105b');
        if (slides && anim < 1) {
          var e = ease(anim);
          slides.forEach(function (s) { tile(c, s.v, s.fx + (s.tx - s.fx) * e, s.fy + (s.ty - s.fy) * e, 1); });
          return;
        }
        tiles.forEach(function (t) {
          var s = 1;
          if (t.merged || t.fresh) {
            var k = Math.min(1, pop);
            s = t.fresh ? ease(k) : 1 + Math.sin(k * Math.PI) * 0.22;
          }
          tile(c, t.v, t.x, t.y, s);
        });
      }

      return {
        start: function () { reset(); env.say('2048', 'press ENTER or tap to start', 'START', begin); },
        draw: draw,
        frame: function (dt, c) {
          if (slides && anim < 1) {
            anim += dt / 0.1;
            if (anim >= 1) {
              anim = 1;
              pop = 0;
              tiles.forEach(function (t) { if (t.merged) env.burst(pos(t.x) + cell / 2, pos(t.y) + cell / 2, COL[t.v] || '#ffffff', 7, 90, 3); });
              if (queued) { var q = queued; queued = null; draw(c); move(q); return; }
            }
          } else if (pop < 1) {
            pop += dt / 0.14;
            if (pop >= 1) {
              pop = 1;
              tiles.forEach(function (t) { t.merged = t.fresh = false; });
              if (endAfter && !over) {
                over = true;
                env.end();
                var nb = env.report(score);
                hud();
                env.say('NO MOVES LEFT', score + ' points' + (nb ? '  -  NEW BEST!' : ''), 'PLAY AGAIN', begin);
              }
            }
          }
          draw(c);
        },
        key: function (k, down, rep) {
          if (!down || over || rep) return;
          if (k !== 'left' && k !== 'right' && k !== 'up' && k !== 'down') return;
          if (slides && anim < 1) queued = k; else move(k);
        },
        stop: function () { if (!over && score) env.report(score); }
      };
    }
  });
})();
