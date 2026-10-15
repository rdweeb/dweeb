(function () {
  var DW = window.DW, S = (DW.season = { id: '', name: '', trophy: '', forced: false, kind: '', lines: [] });
  var cfg = DW.seasons || {};

  var DAYS = [
    { id: 'valentine', name: '<3 LOVE MONTH <3', from: 201, to: 229, kind: 'hearts', trophy: 'valentine', lines: [
      'happy valentines day. i love you. (platonically)',
      'roses are red, dweebs website is purple, you are looking at the website, and honestly thats perfectly normal.',
      'no date? thats ok, probably.'
    ] },
    { id: 'halloween', name: 'ITS HALLOWEEN!', from: 1001, to: 1031, kind: 'bats', trophy: 'spooky', lines: [
      'happy halloween! i am dressed as a website.',
      'boo! ...did that work? i have no way of seeing your face.',
      'the bats they live here now.',
      'trick or treat? i only have text to give.',
      'spooky season. my scariest feature is the spider.'
    ] },
    { id: 'xmas', name: 'MERRY XMAS!', from: 1201, to: 1230, kind: 'snow', trophy: 'merry', lines: [
      'merry christmas! i got you nothing. i am a text box.',
      'ho ho ho. that is all the christmas i know.',
      'it is snowing inside the website..',
      'santa is probably checking if you were naughty..',
      'happy holidays! the lights up top are blinking just for you.'
    ] },
    { id: 'newyear', name: 'HAPPY NEW YEAR!', from: 1231, to: 107, kind: 'confetti', trophy: 'newyear', lines: [
      'happy new year! new year, same dweeb.',
      'resolution: become someone youre proud of, yes you.',
      'confetti! it is falling because i said so.'
    ] }
  ];

  var MONTH = [
    ['january. fun fact: orthodox christmas is on the 7th. the tree stays up till the 14th.', 'it is minus thirty out there. stay in here with the music and some tea.', 'we get to celebrate twice. efficient.'],
    ['february. the shortest month, and still too long. also it is minus twenty.', 'the 23rd is defender of the fatherland day. i defend this website. barely probably.', 'I like february.'],
    ['march. the 8th is womens day. flowers for everyone. do not forget. i am watching. so dont do anything bad.', 'maslenitsa is soon blini with everything, i cannot eat but i support it.', 'march is still cold. the snow is thinking about leaving probably.'],
    ['april. the snow finally melted and it is just mud. beautiful mud. delicious mud.', 'i just deleted myself. oh wait, im still here.. <whisper>hah. april fools!!', 'time to look at the dacha and think about it.'],
    ['may. the 9th is victory day. the 1st is a day off. everybody goes to the dacha.', 'may holidays means shashlik. i have no mouth but i can smell it in spirit.', 'finally warm. well, plus fifteen. that is warm for us.'],
    ['june. the 12th is russia day. a day off, which is the best kind of day.', 'white nights in the north. it never gets dark. the website also never sleeps.', 'dacha season is open. tomatoes, cucumbers, and yeah.'],
    ['july. plus thirty and everyone is acting like it is the end of the world. #coolswagg', 'july is for kvass, watermelon and the river.', 'peak summer. the waves are extra wavy. bring a hat. any hat.'],
    ['august. last stretch of summer. the dacha harvest is coming in. so many cucumbers.', 'august is for pickling things. you can pickle anything. i have checked.', 'school is coming. on the 1st of september. i will pretend i did not say that.'],
    ['september. the 1st is day of knowledge. flowers. the leaves are turning gold. that reminds me of something... <proud>Ten feet twenty, the Flower Man!', 'sentyabr. the leaves are thinking about it. the first frost is thinking about it too.', 'new season. i have a good feeling. maybe a bit of borscht.'],
    ['october. the leaves fall and it gets cold fast. i am already scared.', 'perfect.', 'the first snow can come any day now. i can hear it getting ready.'],
    ['november. the 4th is unity day. it is dark at four. do not panic. drink tea.', 'i would say something about the cold, but it is only minus ten.'],
    ['december. new year is coming, the real holiday! olivier salad for everyone!', 'ded moroz is on his way. do not be naughty. he knows.', 'mandarins and champagne and the president on tv at midnight.']
  ];

  function val(m, d) { return (m + 1) * 100 + d; }
  function inRange(v, a, b) { return a <= b ? v >= a && v <= b : v >= a || v <= b; }

  S.month = function () { return new Date().getMonth(); };

  S.pool = function () {
    var p = MONTH[S.month()].slice();
    if (S.id) p = S.lines.concat(S.lines, p);
    return p;
  };

  function pick() {
    var now = new Date(), v = val(now.getMonth(), now.getDate()), i, d;
    if (cfg.force) {
      for (i = 0; i < DAYS.length; i++) if (DAYS[i].id === cfg.force) { S.forced = true; return DAYS[i]; }
    }
    for (i = 0; i < DAYS.length; i++) {
      d = DAYS[i];
      if (inRange(v, d.from, d.to)) return d;
    }
    return null;
  }

  var parts = [], made = 0, last = 0;
  var COL = ['#de37e4', '#ffd34d', '#5a87d0', '#6cf0a0', '#f3b5f6', '#ffffff'];

  function mk(first, w, h) {
    var k = S.kind, o = { x: Math.random() * w, y: first ? Math.random() * h : -12, ph: Math.random() * 6.28 };
    if (k === 'snow') { o.s = 1.5 + Math.random() * 2; o.vy = 0.35 + Math.random() * 0.6; o.vx = 0; }
    else if (k === 'confetti') { o.s = 3 + Math.random() * 3; o.vy = 0.5 + Math.random() * 0.9; o.col = COL[Math.floor(Math.random() * COL.length)]; }
    else if (k === 'hearts') { o.s = 5 + Math.random() * 5; o.vy = -(0.3 + Math.random() * 0.5); o.y = first ? Math.random() * h : h + 14; }
    else { o.s = 7 + Math.random() * 5; o.vy = 0; o.vx = (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.5); o.y = 60 + Math.random() * (h * 0.6); o.x = first ? Math.random() * w : (o.vx > 0 ? -20 : w + 20); }
    return o;
  }

  function heart(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * 0.35);
    c.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.2, y - s * 0.9, x, y - s * 0.3);
    c.bezierCurveTo(x + s * 0.2, y - s * 0.9, x + s, y - s * 0.4, x, y + s * 0.35);
    c.fill();
  }
  function bat(c, x, y, s, flap, dir) {
    var f = Math.sin(flap) * s * 0.5;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - s * dir * 0.2, y - s * 0.25);
    c.lineTo(x - s, y - s * 0.3 + f);
    c.lineTo(x - s * 0.55, y + s * 0.15);
    c.lineTo(x - s * 0.3, y + s * 0.05);
    c.lineTo(x, y + s * 0.3);
    c.lineTo(x + s * 0.3, y + s * 0.05);
    c.lineTo(x + s * 0.55, y + s * 0.15);
    c.lineTo(x + s, y - s * 0.3 + f);
    c.lineTo(x + s * dir * 0.2, y - s * 0.25);
    c.closePath();
    c.fill();
  }

  S.draw = function (c, t, w, h, d) {
    if (!S.kind) return;
    var n = DW.low ? 12 : S.kind === 'bats' ? 7 : S.kind === 'confetti' ? 46 : 32, i, p;
    if (DW.vis && DW.vis.lite) n = n >> 1;
    while (parts.length < n) parts.push(mk(true, w, h));
    for (i = 0; i < n; i++) {
      p = parts[i];
      if (S.kind === 'snow') {
        p.y += p.vy * d; p.x += Math.sin(t / 1400 + p.ph) * 0.4;
        if (p.y > h + 6) parts[i] = p = mk(false, w, h);
        c.globalAlpha = 0.85;
        c.fillStyle = '#ffffff';
        c.fillRect(p.x, p.y, p.s, p.s);
      } else if (S.kind === 'confetti') {
        p.y += p.vy * d; p.x += Math.sin(t / 900 + p.ph) * 0.6;
        if (p.y > h + 8) parts[i] = p = mk(false, w, h);
        c.globalAlpha = 0.9;
        c.fillStyle = p.col;
        c.fillRect(p.x, p.y, p.s, p.s * (0.5 + 0.5 * Math.abs(Math.sin(t / 300 + p.ph))));
      } else if (S.kind === 'hearts') {
        p.y += p.vy * d; p.x += Math.sin(t / 1100 + p.ph) * 0.5;
        if (p.y < -16) parts[i] = p = mk(false, w, h);
        c.globalAlpha = 0.7;
        c.fillStyle = '#de37e4';
        heart(c, p.x, p.y, p.s);
      } else {
        p.x += p.vx * d * 1.6; p.y += Math.sin(t / 500 + p.ph) * 0.5;
        if (p.x < -30 || p.x > w + 30) parts[i] = p = mk(false, w, h);
        c.globalAlpha = 0.8;
        c.fillStyle = '#1d041e';
        bat(c, p.x, p.y, p.s, t / 90 + p.ph, p.vx > 0 ? 1 : -1);
      }
    }
    c.globalAlpha = 1;
  };

  S.set = function (id, manual) {
    var i, d = null;
    for (i = 0; i < DAYS.length; i++) {
      document.body.classList.remove('s-' + DAYS[i].id);
      if (DAYS[i].id === id) d = DAYS[i];
    }
    if (DW.seasonfx) DW.seasonfx.stop();
    parts.length = 0;
    S.id = ''; S.name = ''; S.trophy = ''; S.kind = ''; S.lines = [];
    var small = document.querySelector('#sysname small');
    if (small) { if (!small.dataset.base) small.dataset.base = small.textContent; small.textContent = small.dataset.base; }
    if (!d) return false;
    S.id = d.id; S.name = d.name; S.trophy = d.trophy; S.kind = d.kind; S.lines = d.lines;
    S.forced = S.forced || !!manual;
    document.body.classList.add('s-' + d.id);
    if (small) small.textContent = d.name;
    if (DW.seasonfx) DW.seasonfx.start(d.id);
    return true;
  };
  S.list = DAYS;

  S.init = function () {
    if (cfg.on === false) return;
    var d = pick();
    if (d) S.set(d.id, S.forced);
  };
})();
