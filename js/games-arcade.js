// Arcade games. Shared colors and helpers come from DW.games.

(function(){
var DW = window.DW;
var G = DW.games;
var P = G.pal;
var text = G.text;

function same(a, b){ return a.x == b.x && a.y == b.y; }
function rnd(n){ return Math.floor(Math.random() * n); }
function ease(t){ return 1 - Math.pow(1 - t, 3); }
function clamp(n, lo, hi){
  if (n < lo) { return lo; }
  if (n > hi) { return hi; }
  return n;
}

/*  SNAKE  */
G.add({
  id: 'snake', name: 'SNAKE', blurb: 'eat the apples. dont bite yourself.', w: 320, h: 320, swipe: true,
  help: 'ARROWS / WASD to turn. swipe on a phone. P pauses.',
  modes: [
    { id: 'classic', name: 'CLASSIC', desc: 'walls are deadly.' },
    { id: 'wrap', name: 'WRAP', desc: 'walk through the walls.' },
    { id: 'speed', name: 'SPEED', desc: 'starts fast and gets silly.' },
    { id: 'rocks', name: 'ROCKS', desc: 'dodge the rocks too.' }
  ],
  make: function(env){
    var N = 20;  // cells across
    var C = 16;  // pixels per cell
    var mode = env.mode;
    var snake, prev, dir, queue, food, rocks, score, acc, over;
    var clock = 0;

    function copySnake(){
      var out = [];
      for (var i = 0; i < snake.length; i++) {
        out.push({ x: snake[i].x, y: snake[i].y });
      }
      return out;
    }

    function isFree(x, y){
      var p = { x: x, y: y };
      for (var i = 0; i < snake.length; i++) {
        if (same(snake[i], p)) { return false; }
      }
      for (var j = 0; j < rocks.length; j++) {
        if (same(rocks[j], p)) { return false; }
      }
      return true;
    }

    // picks a random empty cell, false if the board is full
    function spawnFood(){
      var spots = [];
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          if (isFree(x, y)) { spots.push({ x: x, y: y }); }
        }
      }
      if (spots.length == 0) { return false; }
      food = spots[rnd(spots.length)];
      return true;
    }

    function hud(){
      env.hud('APPLES ' + score, 'BEST ' + Math.max(env.best(), score));
    }

    function reset(){
      snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      prev = copySnake();
      dir = { x: 1, y: 0 };
      queue = [];
      rocks = [];
      score = 0;
      acc = 0;
      over = false;

      if (mode == 'rocks') {
        while (rocks.length < 9) {
          var r = { x: rnd(N), y: rnd(N) };
          // keep the starting lane clear
          if (Math.abs(r.y - 10) <= 1 && r.x < 17) { continue; }
          var dupe = false;
          for (var i = 0; i < rocks.length; i++) {
            if (same(rocks[i], r)) { dupe = true; }
          }
          if (!dupe) { rocks.push(r); }
        }
      }
      spawnFood();
      hud();
    }

    function begin(){
      reset();
      env.clear();
      env.start();
      env.played();
    }

    function interval(){
      if (mode == 'speed') { return Math.max(45, 90 - score * 2.5); }
      return Math.max(65, 135 - score * 3);
    }

    function die(){
      over = true;
      env.end();
      env.shake(7, 0.3);
      env.burst(snake[0].x * C + 8, snake[0].y * C + 8, P.p3, 22, 120, 3);
      var newBest = env.report(score);
      hud();
      var sub = score + ' apples';
      if (newBest) { sub = sub + '  -  NEW BEST!'; }
      env.say('GAME OVER', sub, 'PLAY AGAIN', begin);
    }

    function step(){
      prev = copySnake();
      if (queue.length) { dir = queue.shift(); }

      var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (mode == 'wrap') {
        h.x = (h.x + N) % N;
        h.y = (h.y + N) % N;
      } else if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N) {
        die();
        return;
      }

      var eat = same(h, food);

      // the tail moves out of the way if we didnt eat, so dont count it
      var bodyLen = snake.length - 1;
      if (eat) { bodyLen = snake.length; }
      for (var i = 0; i < bodyLen; i++) {
        if (same(snake[i], h)) { die(); return; }
      }
      for (var j = 0; j < rocks.length; j++) {
        if (same(rocks[j], h)) { die(); return; }
      }

      snake.unshift(h);
      if (eat) {
        score++;
        env.burst(food.x * C + 8, food.y * C + 8, P.pk, 12, 90);
        if (score >= 15) { env.award('snake15'); }
        hud();
        if (!spawnFood()) { die(); }
      } else {
        snake.pop();
      }
    }

    function draw(c, f){
      c.fillStyle = P.bg;
      c.fillRect(0, 0, 320, 320);

      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          if ((x + y) % 2 == 1) {
            c.fillStyle = P.bg2;
            c.fillRect(x * C, y * C, C, C);
          }
        }
      }
      if (!snake) { return; }

      for (var r = 0; r < rocks.length; r++) {
        G.bevel(c, rocks[r].x * C + 1, rocks[r].y * C + 1, C - 2, C - 2, '#7c4d7f');
      }

      var pulse = 1 + Math.sin(clock * 9) * 0.12;
      var fs = (C - 4) * pulse;
      G.bevel(c, food.x * C + 8 - fs / 2, food.y * C + 8 - fs / 2, fs, fs, P.pk);

      // tail first so the head ends up on top
      for (var i = snake.length - 1; i >= 0; i--) {
        var s = snake[i];
        var o = prev[Math.min(i, prev.length - 1)];
        var px = s.x;
        var py = s.y;
        // slide between old and new spot
        if (Math.abs(o.x - s.x) <= 1 && Math.abs(o.y - s.y) <= 1) {
          px = o.x + (s.x - o.x) * f;
          py = o.y + (s.y - o.y) * f;
        }
        var col = P.p2;
        if (i == 0) { col = P.p3; }
        G.bevel(c, px * C + 1, py * C + 1, C - 2, C - 2, col);

        if (i == 0) {
          c.fillStyle = P.ink;
          c.fillRect(px * C + 4 + dir.x * 2, py * C + 4 + dir.y * 2, 3, 3);
          c.fillRect(px * C + 9 + dir.x * 2, py * C + 9 + dir.y * 2, 3, 3);
        }
      }
    }

    return {
      start: function(){
        reset();
        env.say('SNAKE', 'press ENTER or tap to start', 'START', begin);
      },
      draw: function(c){ draw(c, 1); },
      frame: function(dt, c){
        clock += dt;
        acc += dt * 1000;
        var ms = interval();
        while (acc >= ms && !over) {
          acc -= ms;
          step();
        }
        var f = 1;
        if (!over) { f = Math.min(1, acc / ms); }
        draw(c, f);
      },
      key: function(k, down){
        if (!down) { return; }
        var dirs = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
        var d = dirs[k];
        if (!d || over) { return; }

        // compare against the last turn queued, not the current direction
        var ref = dir;
        if (queue.length) { ref = queue[queue.length - 1]; }
        if (d[0] == -ref.x && d[1] == -ref.y) { return; }
        if (d[0] == ref.x && d[1] == ref.y) { return; }
        if (queue.length < 2) { queue.push({ x: d[0], y: d[1] }); }
      }
    };
  }
});

/*  PONG  */

G.add({
  id: 'pong', name: 'PONG', blurb: 'first to 5 wins.', w: 320, h: 240, bestLabel: 'BEST LEAD',
  help: 'UP / DOWN or W / S to move. drag on a phone. 2 PLAYER: W / S and the arrow keys. P pauses.',
  keymap: function(mode){
    if (mode != '2p') { return null; }
    return { w: 'lu', s: 'ld', arrowup: 'ru', arrowdown: 'rd', enter: 'enter', ' ': 'drop' };
  },
  modes: [
    { id: 'easy', name: 'EASY', desc: 'a sleepy cpu.' },
    { id: 'normal', name: 'NORMAL', desc: 'a fair fight.' },
    { id: 'hard', name: 'HARD', desc: 'a cpu that never blinks.' },
    { id: '2p', name: '2 PLAYER', desc: 'W / S against the arrow keys.' }
  ],
  make: function(env){
    var cpu = null;
    if (env.mode == 'easy') { cpu = { sp: 95, err: 34 }; }
    else if (env.mode == 'normal') { cpu = { sp: 135, err: 22 }; }
    else if (env.mode == 'hard') { cpu = { sp: 195, err: 8 }; }

    var two = (env.mode == '2p');
    var PH = 40;  // paddle height
    var PW = 6;  // paddle width
    var B = 6;  // ball size
    var py, cy, bx, by, vx, vy, sp, myPts, cpuPts, wait, over, aim;
    var ptr = null;
    var held = {};
    var trail = [];
    var flash = [0, 0];

    function serve(dir){
      bx = 160;
      by = 120;
      sp = 170;
      var a = (Math.random() - 0.5) * 0.7;
      vx = Math.cos(a) * sp * dir;
      vy = Math.sin(a) * sp;
      wait = 0.9;
      aim = 0;
      trail = [];
    }

    function hud(){
      var left, right;
      if (two) {
        left = 'P1 ' + myPts + '  :  ' + cpuPts + ' P2';
        right = '';
      } else {
        left = 'YOU ' + myPts + '  :  ' + cpuPts + ' CPU';
        right = 'BEST LEAD ' + env.best();
      }
      env.hud(left, right);
    }

    function reset(){
      py = 100;
      cy = 100;
      myPts = 0;
      cpuPts = 0;
      over = false;
      if (Math.random() < 0.5) { serve(1); } else { serve(-1); }
      hud();
    }

    function begin(){
      reset();
      env.clear();
      env.start();
      env.played();
    }

    function point(me){
      if (me) { myPts++; } else { cpuPts++; }
      env.shake(3.5, 0.15);
      if (me) { env.burst(316, by, P.p3, 16, 130); }
      else { env.burst(4, by, P.pk, 16, 130); }
      hud();

      if (myPts >= 5 || cpuPts >= 5) {
        over = true;
        env.end();
        var win = myPts > cpuPts;
        if (!two && win) {
          env.award('pongwin');
          env.report(myPts - cpuPts);
          hud();
        }
        var title;
        if (two) { title = win ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS'; }
        else { title = win ? 'YOU WIN' : 'CPU WINS'; }
        env.say(title, myPts + ' - ' + cpuPts, 'REMATCH', begin);
        return;
      }
      if (me) { serve(-1); } else { serve(1); }
    }

    // ball hit a paddle. left = true for the left one
    function hit(paddleY, left){
      var rel = clamp((by + B / 2 - (paddleY + PH / 2)) / (PH / 2), -1, 1);
      sp = Math.min(380, sp * 1.06);
      var way = -1;
      if (left) { way = 1; }
      vx = Math.cos(rel * 0.95) * sp * way;
      vy = Math.sin(rel * 0.95) * sp;
      if (left) {
        flash[0] = 0.14;
        env.burst(20, by + B / 2, '#ffffff', 6, 70);
      } else {
        flash[1] = 0.14;
        env.burst(300, by + B / 2, '#ffffff', 6, 70);
        if (!two) { aim = (Math.random() - 0.5) * cpu.err * 1.4; }
      }
    }

    function draw(c){
      c.fillStyle = P.bg;
      c.fillRect(0, 0, 320, 240);
      c.fillStyle = P.grid;
      for (var y = 0; y < 240; y += 14) {
        c.fillRect(159, y, 2, 8);
      }
      if (py == null) { return; }

      for (var i = 0; i < trail.length; i++) {
        c.globalAlpha = (i + 1) / trail.length * 0.35;
        c.fillStyle = P.p3;
        c.fillRect(trail[i][0], trail[i][1], B, B);
      }
      c.globalAlpha = 1;

      var leftCol = P.p3;
      if (flash[0]) { leftCol = '#ffffff'; }
      var rightCol = P.pk;
      if (flash[1]) { rightCol = '#ffffff'; }
      G.bevel(c, 12 - flash[0] * 20, py, PW + flash[0] * 20, PH, leftCol);
      G.bevel(c, 302, cy, PW + flash[1] * 20, PH, rightCol);
      G.bevel(c, bx, by, B, B, '#ffffff');

      text(c, String(myPts), 130, 10, 22, P.p3, 'center');
      text(c, String(cpuPts), 190, 10, 22, P.pk, 'center');
    }

    return {
      start: function(){
        reset();
        env.say('PONG', 'press ENTER or tap to start', 'START', begin);
      },
      draw: draw,
      frame: function(dt, c){
        flash[0] = Math.max(0, flash[0] - dt);
        flash[1] = Math.max(0, flash[1] - dt);

        // left paddle (you / player 1)
        var d = 0;
        if (held.down || held.ld) { d = d + 1; }
        if (held.up || held.lu) { d = d - 1; }
        if (ptr != null) {
          var maxMove = 420 * dt;
          py += clamp(ptr - PH / 2 - py, -maxMove, maxMove);
        } else {
          py += d * 240 * dt;
        }
        py = clamp(py, 0, 240 - PH);

        // right paddle (player 2 or the cpu)
        if (two) {
          var d2 = 0;
          if (held.rd) { d2 = d2 + 1; }
          if (held.ru) { d2 = d2 - 1; }
          cy += d2 * 240 * dt;
        } else {
          var target = 120;
          var speed = cpu.sp * 0.6;
          if (vx > 0) {
            target = by + B / 2 + aim;
            speed = cpu.sp;
          }
          speed = speed * dt;
          cy += clamp(target - (cy + PH / 2), -speed, speed);
        }
        cy = clamp(cy, 0, 240 - PH);

        if (wait > 0) {
          wait -= dt;
        } else {
          trail.push([bx, by]);
          if (trail.length > 7) { trail.shift(); }
          bx += vx * dt;
          by += vy * dt;

          if (by < 0) { by = 0; vy = Math.abs(vy); }
          if (by > 240 - B) { by = 240 - B; vy = -Math.abs(vy); }

          if (vx < 0 && bx <= 12 + PW && bx >= 6 && by + B >= py && by <= py + PH) {
            bx = 12 + PW;
            hit(py, true);
          }
          if (vx > 0 && bx + B >= 302 && bx + B <= 312 && by + B >= cy && by <= cy + PH) {
            bx = 302 - B;
            hit(cy, false);
          }

          if (bx < -B) { point(false); }
          else if (bx > 320) { point(true); }
        }
        draw(c);
      },
      key: function(k, down){
        if (down) { held[k] = 1; } else { held[k] = 0; }
        if (down && (k == 'up' || k == 'down')) { ptr = null; }
      },
      pointer: function(t, x, y){
        if (t == 'up') { ptr = null; } else { ptr = y; }
      },
      stop: function(){
        held = {};
        ptr = null;
      }
    };
  }
});

/*  TETRIS  */
var SHAPES = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]]
};
var TCOL = { I: '#5a87d0', O: '#ffd34d', T: '#de37e4', S: '#6cf0a0', Z: '#ff5c8a', J: '#9db8e6', L: '#ff9a5c' };
var LETTERS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

G.add({
  id: 'tetris', name: 'TETRIS', blurb: 'stack the blocks, clear the lines.', w: 240, h: 320,
  help: 'LEFT / RIGHT move, DOWN falls faster, UP or X rotate, Z rotates back, SPACE slams down. P pauses.',
  pad: [['left', '◀', 1], ['right', '▶', 1], ['down', '▼', 1], ['b', '↶'], ['a', '↷'], ['drop', 'DROP']],
  modes: [
    { id: 'marathon', name: 'MARATHON', desc: 'endless. it keeps speeding up.' },
    { id: 'sprint', name: 'SPRINT', desc: 'clear 40 lines as fast as you can.', low: true },
    { id: 'ultra', name: 'ULTRA', desc: 'two minutes. biggest score wins.' }
  ],
  make: function(env){
    var W = 10;  // board width in cells
    var H = 20;  // board height in cells
    var S = 16;  // pixels per cell
    var mode = env.mode;
    var grid, piece, next, bag, score, lines, level, acc, over, clearing, time;
    var hudS = '';

    function emptyRow(){
      var row = [];
      for (var i = 0; i < W; i++) { row.push(0); }
      return row;
    }

    // 7 bag so you dont get the same piece 5 times in a row
    function fillBag(){
      bag = LETTERS.slice();
      for (var i = bag.length - 1; i > 0; i--) {
        var j = rnd(i + 1);
        var tmp = bag[i];
        bag[i] = bag[j];
        bag[j] = tmp;
      }
    }

    function fromBag(){
      if (!bag || bag.length == 0) { fillBag(); }
      return bag.pop();
    }

    function collide(cells, x, y){
      for (var i = 0; i < cells.length; i++) {
        var cx = cells[i][0] + x;
        var cy = cells[i][1] + y;
        if (cx < 0 || cx >= W || cy >= H) { return true; }
        if (cy >= 0 && grid[cy][cx]) { return true; }
      }
      return false;
    }

    function spawn(){
      var t = next || fromBag();
      next = fromBag();

      var cells = [];
      for (var i = 0; i < SHAPES[t].length; i++) {
        cells.push([SHAPES[t][i][0], SHAPES[t][i][1]]);
      }
      var size = 3;
      if (t == 'I' || t == 'O') { size = 4; }
      piece = { t: t, c: cells, x: 3, y: 0, size: size };

      if (collide(piece.c, piece.x, piece.y)) { finish(false); }
    }

    function rotate(way){
      if (piece.t == 'O') { return; }
      var n = piece.size;
      var cells = [];
      for (var i = 0; i < piece.c.length; i++) {
        var b = piece.c[i];
        if (way > 0) { cells.push([n - 1 - b[1], b[0]]); }
        else { cells.push([b[1], n - 1 - b[0]]); }
      }
      // try nudging sideways if it doesnt fit
      var kicks = [0, -1, 1, -2, 2];
      for (var k = 0; k < kicks.length; k++) {
        if (!collide(cells, piece.x + kicks[k], piece.y)) {
          piece.c = cells;
          piece.x += kicks[k];
          return;
        }
      }
    }

    function move(dx){
      if (!collide(piece.c, piece.x + dx, piece.y)) { piece.x += dx; }
    }

    function lock(){
      for (var i = 0; i < piece.c.length; i++) {
        var b = piece.c[i];
        var gy = b[1] + piece.y;
        if (gy >= 0) { grid[gy][b[0] + piece.x] = piece.t; }
        env.burst((b[0] + piece.x) * S + 8, (b[1] + piece.y) * S + 8, TCOL[piece.t], 2, 40, 2);
      }

      var rows = [];
      for (var y = 0; y < H; y++) {
        var full = true;
        for (var x = 0; x < W; x++) {
          if (!grid[y][x]) { full = false; }
        }
        if (full) { rows.push(y); }
      }
      piece = null;
      acc = 0;

      if (rows.length == 0) {
        spawn();
        return;
      }

      clearing = { rows: rows, t: 0 };
      for (var r = 0; r < rows.length; r++) {
        for (var cx = 0; cx < W; cx++) {
          env.burst(cx * S + 8, rows[r] * S + 8, TCOL[grid[rows[r]][cx]], 1, 110, 3);
        }
      }
      if (rows.length >= 4) { env.shake(6, 0.3); } else { env.shake(2, 0.12); }

      lines += rows.length;
      var pts = [0, 100, 300, 500, 800];
      score += pts[rows.length] * level;
      level = Math.floor(lines / 10) + 1;
      if (lines >= 10) { env.award('tetris10'); }
    }

    function collapse(){
      for (var i = 0; i < clearing.rows.length; i++) {
        grid.splice(clearing.rows[i], 1);
        grid.unshift(emptyRow());
      }
      clearing = null;
      if (mode == 'sprint' && lines >= 40) {
        finish(true);
        return;
      }
      spawn();
    }

    // one step down. false if it locked instead
    function dropOne(){
      if (!collide(piece.c, piece.x, piece.y + 1)) {
        piece.y++;
        return true;
      }
      lock();
      return false;
    }

    function finish(done){
      if (over) { return; }
      over = true;
      env.end();

      var title = 'GAME OVER';
      var sub = '';
      var newBest = false;
      if (mode == 'sprint') {
        if (done) {
          var secs = Math.round(time * 10) / 10;
          newBest = env.report(secs, true);
          sub = secs + ' seconds';
          if (newBest) { sub = sub + '  -  NEW BEST!'; }
          title = 'SPRINT CLEAR';
        } else {
          sub = lines + ' of 40 lines';
        }
      } else {
        newBest = env.report(score);
        sub = score + ' points, ' + lines + ' lines';
        if (newBest) { sub = sub + '  -  NEW BEST!'; }
        if (mode == 'ultra' && done) { title = 'TIME UP'; }
      }
      env.say(title, sub, 'PLAY AGAIN', begin);
    }

    function reset(){
      grid = [];
      for (var i = 0; i < H; i++) { grid.push(emptyRow()); }
      bag = null;
      next = null;
      piece = null;
      clearing = null;
      score = 0;
      lines = 0;
      level = 1;
      acc = 0;
      time = 0;
      over = false;
      hudS = '';
      spawn();
      paintHud(true);
    }

    function begin(){
      reset();
      env.clear();
      env.start();
      env.played();
    }

    function paintHud(force){
      var l, r;
      if (mode == 'sprint') {
        l = 'TIME ' + time.toFixed(1);
        r = 'LINES ' + lines + '/40';
      } else if (mode == 'ultra') {
        l = 'SCORE ' + score;
        r = 'TIME ' + Math.max(0, Math.ceil(120 - time));
      } else {
        l = 'SCORE ' + score;
        r = 'LINES ' + lines + '  LV ' + level;
      }
      // only touch the hud when the text changed
      if (force || l + r != hudS) {
        hudS = l + r;
        env.hud(l, r);
      }
    }

    function ghostY(){
      var y = piece.y;
      while (!collide(piece.c, piece.x, y + 1)) { y++; }
      return y;
    }

    function draw(c, f){
      c.fillStyle = P.bg;
      c.fillRect(0, 0, 240, 320);
      c.fillStyle = P.bg2;
      c.fillRect(0, 0, 160, 320);

      c.fillStyle = P.grid;
      for (var i = 1; i < W; i++) { c.fillRect(i * S, 0, 1, 320); }
      for (var j = 1; j < H; j++) { c.fillRect(0, j * S, 160, 1); }
      c.fillRect(160, 0, 2, 320);
      if (!grid) { return; }

      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          if (grid[y][x]) { G.bevel(c, x * S, y * S, S, S, TCOL[grid[y][x]]); }
        }
      }

      if (clearing) {
        var a = 0.35 + 0.5 * Math.abs(Math.sin(clearing.t * 28));
        c.fillStyle = 'rgba(255, 255, 255,' + a.toFixed(2) + ')';
        for (var r = 0; r < clearing.rows.length; r++) {
          c.fillRect(0, clearing.rows[r] * S, 160, S);
        }
      }

      if (piece && !over) {
        var gy = ghostY();
        c.fillStyle = 'rgba(255, 255, 255,.14)';
        for (var g = 0; g < piece.c.length; g++) {
          c.fillRect((piece.c[g][0] + piece.x) * S, (piece.c[g][1] + gy) * S, S, S);
        }
        // slide the piece down smoothly unless its resting on something
        var off = f;
        if (collide(piece.c, piece.x, piece.y + 1)) { off = 0; }
        for (var p = 0; p < piece.c.length; p++) {
          var b = piece.c[p];
          if (b[1] + piece.y >= 0) {
            G.bevel(c, (b[0] + piece.x) * S, (b[1] + piece.y + off) * S, S, S, TCOL[piece.t]);
          }
        }
      }

      text(c, 'NEXT', 200, 10, 11, P.p3, 'center');
      if (next) {
        var shift = 6;
        if (next == 'I') { shift = 0; }
        for (var n = 0; n < SHAPES[next].length; n++) {
          var nb = SHAPES[next][n];
          G.bevel(c, 176 + nb[0] * 12 + shift, 34 + nb[1] * 12, 12, 12, TCOL[next]);
        }
      }
      text(c, 'SCORE', 200, 100, 11, P.p3, 'center');
      text(c, String(score), 200, 116, 14, '#ffffff', 'center');
      text(c, 'LINES', 200, 150, 11, P.p3, 'center');
      text(c, String(lines), 200, 166, 14, '#ffffff', 'center');
      if (mode == 'ultra') {
        text(c, 'TIME', 200, 200, 11, P.p3, 'center');
        text(c, String(Math.max(0, Math.ceil(120 - (time || 0)))), 200, 216, 14, '#ffffff', 'center');
      } else {
        text(c, 'LEVEL', 200, 200, 11, P.p3, 'center');
        text(c, String(level), 200, 216, 14, '#ffffff', 'center');
      }
    }

    return {
      start: function(){
        reset();
        env.say('TETRIS', 'press ENTER or tap to start', 'START', begin);
      },
      draw: function(c){ draw(c, 0); },
      frame: function(dt, c){
        time += dt;
        var ms = Math.max(70, 800 * Math.pow(0.85, level - 1));

        if (clearing) {
          clearing.t += dt;
          if (clearing.t >= 0.26) { collapse(); }
        } else if (piece) {
          acc += dt * 1000;
          while (acc >= ms && piece && !over) {
            acc -= ms;
            dropOne();
          }
        }

        if (mode == 'ultra' && time >= 120 && !over) { finish(true); }
        paintHud(false);

        var f = 0;
        if (piece) { f = Math.min(1, acc / ms); }
        draw(c, f);
      },
      key: function(k, down, rep){
        if (!down || over || !piece || clearing) { return; }
        if (k == 'left') { move(-1); }
        else if (k == 'right') { move(1); }
        else if (k == 'down') {
          if (dropOne()) { score += 1; }
          acc = 0;
        }
        else if (rep) { return; }
        else if (k == 'up' || k == 'a') { rotate(1); }
        else if (k == 'b') { rotate(-1); }
        else if (k == 'drop') {
          var n = 0;
          while (!collide(piece.c, piece.x, piece.y + 1)) {
            piece.y++;
            n++;
          }
          score += n * 2;
          env.shake(2.5, 0.1);
          lock();
        }
      }
    };
  }
});

/*  BREAKOUT  */
  
G.add({
  id: 'breakout', name: 'BREAKOUT', blurb: 'bounce the ball, smash the wall.', w: 320, h: 240,
  help: 'LEFT / RIGHT or drag to move. SPACE or tap launches the ball. P pauses.',
  modes: [
    { id: 'classic', name: 'CLASSIC', desc: 'three lives.' },
    { id: 'hard', name: 'HARD', desc: 'fast ball, small paddle, two lives.' },
    { id: 'zen', name: 'ZEN', desc: 'no lives. just smash.' }
  ],
  make: function(env){
    var mode = env.mode;
    var PW = 48;       // paddle width
    var base = 185;   // ball speed
    if (mode == 'hard') { PW = 38; base = 235; }

    var bricks, px, ball, lives, score, level, over, stuck;
    var held = {};
    var ptr = null;
    var squash = 0;
    var trail = [];
    var banner = 0;
    var ROW = ['#de37e4', '#ff9a8a', '#ffd34d', '#6cf0a0', '#5a87d0', '#9a2ea3'];

    function build(){
      bricks = [];
      var rows = Math.min(8, 5 + level);
      for (var r = 0; r < rows; r++) {
        for (var col = 0; col < 10; col++) {
          bricks.push({ x: 10 + col * 30, y: 28 + r * 12, w: 28, h: 10, col: ROW[r % ROW.length], pts: (rows - r) * 5 });
        }
      }
    }

    // ball sits on the paddle until you launch it
    function ready(){
      stuck = true;
      trail = [];
      ball = { x: px + PW / 2, y: 219, vx: 0, vy: 0, r: 3 };
    }

    function launch(){
      if (!stuck) { return; }
      stuck = false;
      var sp = base + level * 12;
      var a = Math.random() * 0.8 - 0.4;
      ball.vx = Math.sin(a) * sp;
      ball.vy = -Math.cos(a) * sp;
    }

    function hud(){
      var left = 'SCORE ' + score;
      if (mode != 'zen') { left = left + '   LIVES ' + lives; }
      env.hud(left, 'BEST ' + Math.max(env.best(), score));
    }

    function reset(){
      px = 136;
      level = 1;
      score = 0;
      over = false;
      squash = 0;
      banner = 0;
      if (mode == 'classic') { lives = 3; }
      else if (mode == 'hard') { lives = 2; }
      else { lives = 1; }
      build();
      ready();
      hud();
    }

    function begin(){
      reset();
      env.clear();
      env.start();
      env.played();
    }

    function lose(){
      env.shake(4, 0.2);
      env.burst(ball.x, 226, '#ffffff', 10, 100);
      if (mode != 'zen') { lives--; }
      hud();
      if (lives <= 0) {
        over = true;
        env.end();
        var newBest = env.report(score);
        hud();
        var sub = score + ' points';
        if (newBest) { sub = sub + '  -  NEW BEST!'; }
        env.say('GAME OVER', sub, 'PLAY AGAIN', begin);
      } else {
        ready();
      }
    }

    function stepBall(dt){
      // split fast movement into small steps so it cant skip through bricks
      var n = Math.ceil(Math.hypot(ball.vx, ball.vy) * dt / 3) || 1;
      for (var i = 0; i < n; i++) {
        ball.x += ball.vx * dt / n;
        ball.y += ball.vy * dt / n;

        if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
        if (ball.x > 320 - ball.r) { ball.x = 320 - ball.r; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }

        // paddle
        if (ball.vy > 0 && ball.y + ball.r >= 222 && ball.y - ball.r <= 228 && ball.x >= px - 2 && ball.x <= px + PW + 2) {
          var rel = (ball.x - (px + PW / 2)) / (PW / 2);
          var sp = Math.min(400, Math.hypot(ball.vx, ball.vy) * 1.015);
          ball.vx = Math.sin(rel * 1.05) * sp;
          ball.vy = -Math.cos(rel * 1.05) * sp;
          ball.y = 222 - ball.r;
          squash = 0.12;
          env.burst(ball.x, 222, P.p3, 5, 60);
        }

        // bricks, one per step
        for (var k = 0; k < bricks.length; k++) {
          var b = bricks[k];
          if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
            var ox = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
            var oy = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
            if (ox < oy) { ball.vx = -ball.vx; } else { ball.vy = -ball.vy; }
            bricks.splice(k, 1);
            score += b.pts;
            env.burst(b.x + 14, b.y + 5, b.col, 9, 100, 3);
            hud();
            break;
          }
        }

        if (bricks.length == 0) {
          env.award('breakout');
          level++;
          banner = 1.4;
          build();
          ready();
          return;
        }
        if (ball.y > 244) {
          lose();
          return;
        }
      }
    }

    function draw(c){
      c.fillStyle = P.bg;
      c.fillRect(0, 0, 320, 240);
      if (!bricks) { return; }

      for (var i = 0; i < bricks.length; i++) {
        var b = bricks[i];
        G.bevel(c, b.x, b.y, b.w, b.h, b.col);
      }

      for (var t = 0; t < trail.length; t++) {
        c.globalAlpha = (t + 1) / trail.length * 0.3;
        c.fillStyle = '#ffffff';
        c.fillRect(trail[t][0] - 2, trail[t][1] - 2, 4, 4);
      }
      c.globalAlpha = 1;

      var sq = squash / 0.12;
      G.bevel(c, px - sq * 4, 222 + sq * 2, PW + sq * 8, 6 - sq * 2, P.p3);
      G.bevel(c, ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2, '#ffffff');

      if (stuck && !over) { text(c, 'SPACE / TAP TO LAUNCH', 160, 150, 10, P.p3, 'center'); }
      if (banner > 0) {
        var alpha = Math.min(1, banner).toFixed(2);
        text(c, 'LEVEL ' + level, 160, 120, 22, 'rgba(255, 255, 255,' + alpha + ')', 'center');
      }
    }

    return {
      start: function(){
        reset();
        env.say('BREAKOUT', 'press ENTER or tap to start', 'START', begin);
      },
      draw: draw,
      frame: function(dt, c){
        squash = Math.max(0, squash - dt);
        banner = Math.max(0, banner - dt);

        var d = 0;
        if (held.right) { d = d + 1; }
        if (held.left) { d = d - 1; }
        if (ptr != null) {
          var maxMove = 520 * dt;
          px += clamp(ptr - PW / 2 - px, -maxMove, maxMove);
        } else {
          px += d * 260 * dt;
        }
        px = clamp(px, 0, 320 - PW);

        if (stuck) {
          ball.x = px + PW / 2;
        } else {
          trail.push([ball.x, ball.y]);
          if (trail.length > 6) { trail.shift(); }
          stepBall(dt);
        }
        draw(c);
      },
      key: function(k, down){
        if (k == 'left' || k == 'right') {
          if (down) { held[k] = 1; } else { held[k] = 0; }
          if (down) { ptr = null; }
        } else if (down && (k == 'drop' || k == 'up' || k == 'a')) {
          launch();
        }
      },
      pointer: function(t, x){
        if (t == 'up') {
          ptr = null;
          return;
        }
        ptr = x;
        if (t == 'down') { launch(); }
      },
      stop: function(){
        held = {};
        ptr = null;
        // leaving mid game still saves your score
        if (!over && score) { env.report(score); }
      }
    };
  }
});

/*  2048  */
G.add({
  id: 'g2048', name: '2048', blurb: 'slide and merge the numbers.', w: 320, h: 320, swipe: true, autopause: false,
  help: 'ARROWS / WASD slide the tiles. swipe on a phone. merge two equal tiles.',
  modes: [
    { id: 'classic', name: 'CLASSIC', desc: 'the normal 4 x 4 board.' },
    { id: 'big', name: 'BIG', desc: 'a roomy 5 x 5 board.' },
    { id: 'tiny', name: 'TINY', desc: 'a cramped 3 x 3 board.' }
  ],
  make: function(env){
    var n = 4;
    if (env.mode == 'big') { n = 5; }
    else if (env.mode == 'tiny') { n = 3; }
    var gap = 6;
    var cell = (320 - gap * (n + 1)) / n;
    var COL = {
      2: '#f3b5f6', 4: '#e98bee', 8: '#de37e4', 16: '#b52fc0', 32: '#8f4fc8', 64: '#5a87d0',
      128: '#ffd34d', 256: '#ffb83a', 512: '#6cf0a0', 1024: '#6fe3ff', 2048: '#ffffff'
    };
    var tiles, slides, score, over, won, anim, pop, queued, endAfter;

    function pos(i){ return gap + i * (cell + gap); }

    function at(x, y){
      for (var i = 0; i < tiles.length; i++) {
        if (tiles[i].x == x && tiles[i].y == y) { return tiles[i]; }
      }
      return null;
    }

    function spawnTile(){
      var empty = [];
      for (var y = 0; y < n; y++) {
        for (var x = 0; x < n; x++) {
          if (!at(x, y)) { empty.push([x, y]); }
        }
      }
      if (empty.length == 0) { return; }
      var spot = empty[rnd(empty.length)];
      var v = 2;
      if (Math.random() >= 0.9) { v = 4; }
      tiles.push({ v: v, x: spot[0], y: spot[1], fresh: true });
    }

    function hud(){
      env.hud('SCORE ' + score, 'BEST ' + Math.max(env.best(), score));
    }

    function reset(){
      tiles = [];
      slides = null;
      score = 0;
      over = false;
      won = false;
      anim = 0;
      pop = 0;
      queued = null;
      endAfter = null;
      spawnTile();
      spawnTile();
      hud();
    }

    function begin(){
      reset();
      env.clear();
      env.start();
      env.played();
    }

    function canMove(){
      if (tiles.length < n * n) { return true; }
      for (var i = 0; i < tiles.length; i++) {
        var t = tiles[i];
        var right = at(t.x + 1, t.y);
        var down = at(t.x, t.y + 1);
        if (right && right.v == t.v) { return true; }
        if (down && down.v == t.v) { return true; }
      }
      return false;
    }

    // gives the board cell
    function cellOf(i, j, dx, dy){
      var x, y;
      if (dx != 0) {
        if (dx > 0) { x = n - 1 - j; } else { x = j; }
        y = i;
      } else {
        x = i;
        if (dy > 0) { y = n - 1 - j; } else { y = j; }
      }
      return { x: x, y: y };
    }

    function move(dir){
      var dx = 0;
      var dy = 0;
      if (dir == 'left') { dx = -1; }
      else if (dir == 'right') { dx = 1; }
      else if (dir == 'up') { dy = -1; }
      else if (dir == 'down') { dy = 1; }

      var after = [];
      var sl = [];
      var gain = 0;
      var moved = false;

      for (var i = 0; i < n; i++) {
        // grab the tiles in this line, nearest the wall first
        var line = [];
        for (var j = 0; j < n; j++) {
          var spot = cellOf(i, j, dx, dy);
          var t = at(spot.x, spot.y);
          if (t) { line.push(t); }
        }

        var slot = 0;
        var k = 0;
        while (k < line.length) {
          var a = line[k];
          var b = line[k + 1];
          var dest = cellOf(i, slot, dx, dy);

          if (b && b.v == a.v) {
            sl.push({ v: a.v, fx: a.x, fy: a.y, tx: dest.x, ty: dest.y });
            sl.push({ v: b.v, fx: b.x, fy: b.y, tx: dest.x, ty: dest.y });
            after.push({ v: a.v * 2, x: dest.x, y: dest.y, merged: true });
            gain += a.v * 2;
            moved = true;
            k += 2;
          } else {
            sl.push({ v: a.v, fx: a.x, fy: a.y, tx: dest.x, ty: dest.y });
            after.push({ v: a.v, x: dest.x, y: dest.y });
            if (a.x != dest.x || a.y != dest.y) { moved = true; }
            k++;
          }
          slot++;
        }
      }
      if (!moved) { return; }

      score += gain;
      tiles = after;
      slides = sl;
      anim = 0;
      pop = 0;
      spawnTile();

      var max = 0;
      for (var m = 0; m < tiles.length; m++) {
        if (tiles[m].v > max) { max = tiles[m].v; }
      }
      if (max >= 512) { env.award('fivetwelve'); }
      if (max >= 2048) {
        env.award('twentyfortyeight');
        if (!won) {
          won = true;
          DW.toast('2048! keep going if you want');
        }
      }
      hud();
      if (!canMove()) { endAfter = true; }
    }

    function tile(c, v, x, y, s){
      var w = cell * s;
      var o = (cell - w) / 2;
      var color = COL[v] || '#ffffff';
      G.bevel(c, pos(x) + o, pos(y) + o, w, w, color);

      if (s > 0.5) {
        var big = (v > 999);
        var offY = 11;
        if (big) { offY = 8; }
        var fontSize = 32;
        if (v > 999) { fontSize = 20; }
        else if (v > 99) { fontSize = 26; }

        var yScale = 1;
        var fScale = 1;
        if (n == 5) { yScale = 0.8; fScale = 0.8; }
        else if (n == 3) { fScale = 1.15; }

        var textCol = '#ffffff';
        if (v < 8) { textCol = P.ink; }
        text(c, String(v), pos(x) + cell / 2, pos(y) + cell / 2 - offY * s * yScale, fontSize * s * fScale, textCol, 'center');
      }
    }

    function draw(c){
      c.fillStyle = P.bg;
      c.fillRect(0, 0, 320, 320);
      if (!tiles) { return; }

      for (var y = 0; y < n; y++) {
        for (var x = 0; x < n; x++) {
          G.bevel(c, pos(x), pos(y), cell, cell, '#57105b');
        }
      }

      // mid slide then draw the moving tiles only
      if (slides && anim < 1) {
        var e = ease(anim);
        for (var i = 0; i < slides.length; i++) {
          var s = slides[i];
          tile(c, s.v, s.fx + (s.tx - s.fx) * e, s.fy + (s.ty - s.fy) * e, 1);
        }
        return;
      }

      for (var j = 0; j < tiles.length; j++) {
        var t = tiles[j];
        var size = 1;
        if (t.merged || t.fresh) {
          var kk = Math.min(1, pop);
          if (t.fresh) { size = ease(kk); }
          else { size = 1 + Math.sin(kk * Math.PI) * 0.22; }
        }
        tile(c, t.v, t.x, t.y, size);
      }
    }

    return {
      start: function(){
        reset();
        env.say('2048', 'press ENTER or tap to start', 'START', begin);
      },
      draw: draw,
      frame: function(dt, c){
        if (slides && anim < 1) {
          anim += dt / 0.1;
          if (anim >= 1) {
            anim = 1;
            pop = 0;
            for (var i = 0; i < tiles.length; i++) {
              var t = tiles[i];
              if (t.merged) {
                env.burst(pos(t.x) + cell / 2, pos(t.y) + cell / 2, COL[t.v] || '#ffffff', 7, 90, 3);
              }
            }
            // a key was pressed during the slide, do it now
            if (queued) {
              var q = queued;
              queued = null;
              draw(c);
              move(q);
              return;
            }
          }
        } else if (pop < 1) {
          pop += dt / 0.14;
          if (pop >= 1) {
            pop = 1;
            for (var j = 0; j < tiles.length; j++) {
              tiles[j].merged = false;
              tiles[j].fresh = false;
            }
            if (endAfter && !over) {
              over = true;
              env.end();
              var newBest = env.report(score);
              hud();
              var sub = score + ' points';
              if (newBest) { sub = sub + '  -  NEW BEST!'; }
              env.say('NO MOVES LEFT', sub, 'PLAY AGAIN', begin);
            }
          }
        }
        draw(c);
      },
      key: function(k, down, rep){
        if (!down || over || rep) { return; }
        if (k != 'left' && k != 'right' && k != 'up' && k != 'down') { return; }
        if (slides && anim < 1) { queued = k; }
        else { move(k); }
      },
      stop: function(){
        if (!over && score) { env.report(score); }
      }
    };
  }
});
})();
