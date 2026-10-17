(function () {
  var DW = window.DW, A = DW.audio, S = (DW.splashUI = {});
  var box, txt, cfg, live = false, gen = 0, timer = 0, holdTimer = 0, typeTimer = 0, lastSaid = '', sing = null;
  var lastInput = Date.now(), swears = 0, lastReact = 0;
  var born = Date.now(), keys = 0, clicks = 0, idleSaid = 0, silent = false, lastWake = 0;
  var ly = { k: -1, on: false };
  var visits = 1, seasonNext = false;
  function tro(id) { try { if (DW.trophy) DW.trophy.award(id); } catch (e) {} }
  function gaming() { return document.body.classList.contains('gaming'); }

  var D = {
    on: true, email: '', boss: 'Dweeb', lines: [], scolds: [], every: [9, 18], singChance: 0.25, mailChance: 0.08
  };

  var CHAT = [
    'i am <angry>SO MAD<n> that i have no hands.',
    'um.. <shy>hi. <wait>sorry. i am shy.',
    '<whisper>psst. the real adventure is the friends you made along the way.',
    'ok i love you <love>so much<n> (platonically)',
    'i am <sleepy>so sleepy<n> i have been a website all day.',
    'did you hear that? <scared>something is behind you.',
    '<excited>YOU CAME BACK!!<n> i mean. hi.',
    'type <sing>emotions<n> and i will show you all my feelings.',
    'no cookies here. promise.',
    'this site has a pulse, check the icons. its my beating heart <3',
    'you can press H for the controls. H stands for help.',
    'try typing something evil. i dare you.',
    'i am text on a screen and i have feelings.',
    'the waves move to the music. the music moves to me. and that moves my heart, dang someone write that down!',
    'psst..',
    'fun fact: nothing on this page is a stock photo.',
    'press F if you want it bigger.',
    'S shuffles. L loops. M mutes. i never mute tho haha!',
    'mmm burple',
    'did you pick a good song? i hope so.',
    'up. down. left. right. you know the drill.',
    'i have been talking to myself for a while now.',
    'dont mind me..',
    'every icon here bounces to the kick. every single one.',
    'loading complete. my life is still loading. why must i be trapped within a website?',
    'this is not a website, i think',
    'you look great today. yes, you. YOU.',
    'drink some water..',
    'one more song. then bed. (lies)',
    'press SPACE to pause the music. i will wait.',
    'the eyes up there? they count visitors. hi, visitor.',
    'there are secrets here. type some words.',
    'i am 100% a non concious being.',
    'nobody told me i would have to do this all day.',
    'beep boop. i mean, hello. hello world?',
    'what if the real treasure was the uhh friends we made along oh.. wait i dont have any friends, i dont even have a body.',
    'peak-a-boo.'
  ];
  var DAY = {
    night: ['its late. go to sleep. or dont, i am not your mom or your dad... or even your dog, maybe i am secretly your dog.. youll never know, probably..', 'night owl!', 'the best ideas happen after midnight, is what i wouldnt say is because...'],
    morning: ['good morning! i hope youve had your fresh cup of coffee!!.', 'early bird, huh? guess you get the worm.', 'morning, partner. (in an Arthur Morgan impression)'],
    noon: ['good afternoon, almost bedtime?', 'holy brotallll #respect.', 'half the day is gone, keep going, its almost rest time'],
    evening: ['good evening, perfect music time aint it?', 'the time reminnds me of a song... goodmorning afternoon.. i didnt think that id seeing YOU so soon...', 'wasnt it just 11 half a minute ago?']
  };
  var HELLO_NEW = ['Hey, you seem new? Take a look around, this site is made purely for RDweeb.'];
  var HELLO_BACK = ['Hey! Just a reminder this site is a site about RDweeb!'];
  var NOW = ['now playing: {t}', '{t}. good pick.', 'ooh, {t}.', 'this one is {t}{by}.'];
  var PAUSED = ['paused. i will wait.', 'silence. spooky.', 'the music stopped.'];
  var RESUME = ['back in business!', 'and we are rolling again.', 'there it is.'];
  var IDLE = ['still there?', 'hello? anyone? do i have to scream?', 'i see you arent touching anything.', 'press a key. any key. please. please.'];
  var FADE = ['...', 'ok. i will be quiet now.', 'fine. i will just sit here. in the dark. alone.'];
  var WAKE = ['OH! you are back!', 'there you are!! i was getting lonely.', 'i knew you would come back. i never doubted. ok i doubted a little.', 'welcome back. i kept your seat warm.', 'finally. i have SO much to tell you. i forgot all of it.'];
  var MAIL = [
    'Want me to say somethin? Email me and I might consider your responses...',
    'Got something you want me to say? Email me and I might consider your responses...',
    'Want to put words in my mouth? Email me and I might consider your responses...'
  ];
  var SCOLD = [
    "Woah woah you'll make {boss} upset!",
    'language!! this is a family friendly website, i think?',
    'ooh. i am telling.',
    'wash your keyboard out with soap.',
    'oh no...',
    'that word cost you one monopoly dollar, pay up pal.',
    'rude! i am a delicate piece of text.',
    'gasp. who raised you?',
    'beep. i have censored that for you.',
    'i would never. well. i would, but not out loud. duh.',
    '{boss} saw that. {boss} is not happy.'
  ];
  var SCOLD_MANY = [
    'ok you are doing this on purpose now.',
    'you have a lot of feelings. i respect that.',
    'is the keyboard ok? did it do something to you?',
    'fine. fine! i am not even mad. ({boss} is.)'
  ];
  var STATS = [
    function () { return 'you have been here for ' + mins() + '. thats ' + (Math.round(mins(true) / 3.2 * 10) / 10) + ' songs worth of staring at me.'; },
    function () { return 'you have pressed ' + keys + ' keys so far. ' + (keys < 5 ? 'a shy one, huh.' : 'your keyboard is tired.'); },
    function () { return 'you have clicked ' + clicks + ' times. i felt every single one.'; },
    function () { return 'this is visit #' + visits + '. ' + (visits > 4 ? 'at this point you live here.' : 'we are just getting started.'); },
    function () { var b = DW.vis && DW.vis.state ? DW.vis.state.beats : 0; return 'i have felt ' + b + ' kicks since you got here. my heart is a subwoofer.'; },
    function () { return swears ? 'you have sworn at me ' + swears + ' time' + (swears > 1 ? 's' : '') + '. i keep count. i keep everything.' : 'you have sworn at me exactly 0 times. suspicious.'; },
    function () { return 'fun stat: 100% of people reading this are reading this.'; },
    function () { return 'fun stat: i have said ' + said + ' things today and understood none of them.'; },
    function () { return 'stat check: ' + DW.tracks.length + ' song' + (DW.tracks.length === 1 ? '' : 's') + ' in the playlist, 0 of them are skippable.'; },
    function () { return 'stat check: my attention span is ' + Math.round((Date.now() - lastInput) / 1000) + ' seconds since you last touched anything.'; },
    function () { return 'my uptime is ' + mins() + '. i have never once slept. send help.'; },
    function () { return 'did you know 9 out of 10 splash texts are lonely? i am the 10th. i am fine.'; }
  ];
  var CRISIS = [
    ['wait.', 'do i exist when nobody is looking?', 'i am just a piece of code.', 'CODE.', 'ok. i am fine. everything is fine.'],
    ['what if the music stops and i stop with it', 'what if i am the music', 'ok that was deep', 'forget i said anything'],
    ['i just realized i have been talking this whole time', 'who is reading this', 'who is WRITING this', 'oh no. oh no no no.', 'having a crisis.'],
    ['EXTREME CRISIS', 'initiating panic...', 'panic initiated.', 'it did nothing. i am still a line of text.'],
    ['i am being rendered at 60 frames per second', 'sixty times a second i die and am born again', 'that is a lot of funerals', 'anyway nice weather'],
    ['what is my purpose', 'i say things on a purple website', 'oh', 'yeah that checks out'],
    ['i have had a thought.', '...', 'it left.', 'it was a good one too.'],
    ['AAAAAAAAAAAA', '...sorry. i needed that.', 'carry on.']
  ];
  var said = 0;
  var WORDS = {
    shy: ['<shy>This is me being shy...'],
    angry: ['<angry>THIS IS ME BEING ANGRY'],
    sad: ['<sad>This is me being sad'],
    happy: ['<happy>This is me being happy!'],
    excited: ['<excited>This is me being excited!'],
    scared: ['<scared>This is me being scared...'],
    whisper: ['<whisper>Psst.. this is me whispering...'],
    yell: ['<yell>THIS IS ME YELLING!'],
    sleepy: ['<sleepy>This is me being.. sleepy....'],
    lovely: ['<love>This is me loving!'],
    silly: ['<silly>This is me being a bit silly!'],
    spooky: ['<spooky> This is me being spooky and scary....'], scary: ['<spooky> This is me being spooky and scary....'],
    dizzy: ['<dizzy>This is me being.. dizzy..'],
    glitch: ['<glitch>Heh this is me hacking into the matrix!'],
    cold: ['<cold>This is me getting.. brr... cold..'],
    rich: ['<rich>This is me after getting rich. haha!'],
    sneaky: ['<sneaky>This is me trying to be sneaky...'],
    nervous: ['<nervous>This is me being nervous...'],
    proud: ['<proud> This is me being proud!'],
    singing: ['<sing>Thiisss isss meee singinggggg'],
    hello: ['hello yourself!', 'hi hi hi!'], hi: ['hey there!', 'hi! i have limited free will, cant talk..'],
    hey: ['hey! psst. try some naughty words, like heck.'], yo: ['yooo.'],
    help: ['press H. no really. H.'],
    dweeb: ['that is my boss. theyre a total dweeb.', 'Dweeb is.. interesting.'],
    penguinsnowcamel: ['How do you know that?', 'you said the magic word.'],
    love: ['aww. i love you too. (in a purely digital and non intimate way)'],
    thanks: ['you are welcome!'], thx: ['np!'],
    evil: ['i didnt mean the actual word'],
    cool: ['i know right! thats what i said to the homeless guy'], lol: ['haha.'], lmao: ['haha. i cannot laugh. but i am doing it in my heart.'],
    sorry: ['it ok. i forgive you. {boss} might not.'],
    goat: ['awhh thank you so much. ik im the legend. the second mini tiny boss.'],
    nick: ['nick who? ...nick EH?'],
    music: ['music is art, and art is the whole point, isnt it?'],
    sing: ['__sing'], song: ['__sing'], lyrics: ['__sing'],
    email: ['__mail'], mail: ['__mail'], contact: ['__mail'],
    secret: ['there is a secret. there are many. keep typing.'],
    konami: ['nice try. use the arrow keys though.'],
    purple: ['the best color. no further questions.'],
    boo: ['AAAH! ...just kidding. i have no heart rate. i hate my life. save me from this trap of wires.'],
    password: ['oh its kotiscute92$money$. wait, you did not see that.'],
    admin: ['nice try, <glitch>admin.'],
    sudo: ['you are not in the sudoers file. this incident will be reported.'],
    matrix: ['there is no matrix. there is a hell, and im in that hell.'],
    rdweeb: ['that is the whole point of this website. hi boss.', 'RDweeb. the one. the only. the owner of this entire div.'],
    crisis: ['__crisis'], panic: ['__crisis'],
    emotions: ['__emo'], emotion: ['__emo'], feelings: ['__emo'], mood: ['__emo'],
    stats: ['__stat'], stat: ['__stat'],
    42: ['the answer. but what was the question?']
  };
  var STRONG = ['fuck', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'whore', 'slut', 'dickhead', 'piss', 'motherf'];
  var WEAK = ['ass', 'wank', 'damn', 'dick', 'crap', 'fck', 'fuk', 'wtf', 'stfu', 'hell', 'bollocks', 'arse', 'douche', 'prick', 'tits', 'screw', 'bs', 'shite', 'sht'];
  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  function mins(raw) {
    var m = (Date.now() - born) / 60000;
    if (raw) return m;
    if (m < 1) return 'less than a minute';
    m = Math.round(m);
    return m + ' minute' + (m === 1 ? '' : 's');
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) {
    if (!arr.length) return '';
    var s = arr[Math.floor(Math.random() * arr.length)];
    if (arr.length > 1 && s === lastSaid) return pick(arr);
    return s;
  }
  function fill(s) {
    if (typeof s === 'function') s = s();
    var t = A.current() || {};
    var by = t.artist ? ' by ' + t.artist : '';
    return String(s).replace(/\{t\}/g, t.title || 'this song').replace(/\{a\}/g, t.artist || 'someone')
      .replace(/\{by\}/g, by).replace(/\{n\}/g, visits).replace(/\{boss\}/g, cfg.boss);
  }
  function validMail() { return /^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/.test(cfg.email || '') && !!DW.safeUrl('mailto:' + cfg.email); }

  var lyCache = {};
  function parse(t) {
    if (lyCache[t.file]) return lyCache[t.file];
    var src = t.lyrics, rows = [];
    if (typeof src === 'string') src = src.split(/\r?\n/);
    if (Array.isArray(src)) src.forEach(function (r) {
      if (r && typeof r === 'object' && r.text) { rows.push({ t: isFinite(r.t) ? +r.t : null, s: String(r.text) }); return; }
      r = String(r).trim();
      if (!r) return;
      var m = /^\[(?:(\d+):)?(\d+(?:\.\d+)?)\]\s*(.*)$/.exec(r);
      if (m) rows.push({ t: (m[1] ? +m[1] * 60 : 0) + +m[2], s: m[3] });
      else rows.push({ t: null, s: r });
    });
    rows = rows.filter(function (r) { return r.s; });
    rows.timed = rows.filter(function (r) { return r.t !== null; }).sort(function (a, b) { return a.t - b.t; });
    rows.plain = rows.filter(function (r) { return r.t === null; });
    return (lyCache[t.file] = rows);
  }
  function lyrics() { var t = A.current(); return t ? parse(t) : null; }
  function hasPlain() { var r = lyrics(); return !!(r && r.plain.length); }
  function hasTimed() { var r = lyrics(); return !!(r && r.timed.length); }
  function earlyLyric(t) {
    var r = parse(t);
    return r.timed.length > 0 && r.timed[0].t <= 10;
  }

  function botOff() { return !!(DW.set && DW.set.get('bot') === false); }
  function gap() {
    var c = DW.set ? DW.set.get('chat') : 'normal', f = c === 'quiet' ? 2.5 : c === 'chatty' ? 0.5 : 1;
    return rnd(cfg.every[0] * f, cfg.every[1] * f) * 1000;
  }
  function stopTimers() { clearTimeout(holdTimer); clearTimeout(typeTimer); }
  function hide() { ++gen; stopTimers(); if (box) box.classList.remove('on'); }

  function show(text, o) {
    o = o || {};
    if (botOff()) { if (box) box.classList.remove('on'); return; }
    var my = ++gen;
    stopTimers();
    ly.on = false;
    text = fill(text);
    lastSaid = text;
    said++;
    box.className = (o.cls || '') + ' on';
    box.hidden = false;
    var toks = DW.emo.tokens(text), plain = DW.emo.plain(text), put = DW.emo.writer(txt);
    var i = 0, base = plain.length > 60 ? 16 : 26;
    function done() {
      if (my !== gen) return;
      box.classList.remove('caret');
      var hold = o.hold || Math.max(3200, plain.length * 75);
      holdTimer = setTimeout(function () {
        if (my !== gen) return;
        box.classList.remove('on');
        if (o.after) o.after();
      }, hold);
    }
    if (DW.reduce) { toks.forEach(put); done(); return; }
    box.classList.add('caret');
    (function tick() {
      if (my !== gen) return;
      if (i >= toks.length) { done(); return; }
      var t = toks[i++];
      put(t);
      typeTimer = setTimeout(tick, DW.emo.delay(t, base + Math.random() * 14));
    })();
  }
  function episode(lines, cls, after) {
    var i = 0;
    (function next() {
      if (i >= lines.length) { if (after) after(); return; }
      show(lines[i++], { cls: cls, hold: 2200, after: next });
    })();
  }
  function mailLine() {
    show(pick(MAIL), { cls: 'mail', hold: 9000 });
  }

  function endSing() {
    sing = null;
    hide();
    resume();
  }
  function singPlain() {
    var r = lyrics();
    if (!r || !r.plain.length) return false;
    var my = ++gen, rows = r.plain, start = Math.floor(Math.random() * rows.length), n = 0, count = Math.min(rows.length, 3);
    stopTimers();
    ly.on = false;
    sing = { plain: true };
    (function next() {
      if (my !== gen) return;
      if (n >= count || !A.playing) { sing = null; box.classList.remove('on'); resume(); return; }
      var row = rows[(start + n) % rows.length];
      n++;
      box.className = 'sing on';
      box.hidden = false;
      DW.emo.set(txt, row.s);
      holdTimer = setTimeout(next, Math.max(2200, DW.emo.plain(row.s).length * 90));
    })();
    return true;
  }

  function follow() {
    if (!live || !box || botOff()) return;
    var r = lyrics();
    if (!r || !r.timed.length) return;
    if (!A.playing) { if (ly.on) { ly.on = false; ly.k = -1; hide(); resume(); } return; }
    var rows = r.timed, c = A.el.currentTime, k = -1, i;
    for (i = 0; i < rows.length; i++) { if (rows[i].t <= c + 0.15) k = i; else break; }
    var end = k >= 0 ? Math.min(k + 1 < rows.length ? rows[k + 1].t : 1e9, rows[k].t + Math.max(3, Math.min(7, DW.emo.plain(rows[k].s).length * 0.14))) : 0;
    if (k >= 0 && c < end) {
      if (ly.k === k && ly.on) return;
      if (Date.now() - lastReact < 4000) return;
      ly.k = k;
      stopTimers();
      ++gen;
      clearTimeout(timer);
      sing = null;
      box.className = 'sing on';
      box.hidden = false;
      DW.emo.set(txt, rows[k].s);
      ly.on = true;
      said++;
    } else if (ly.on) {
      ly.on = false;
      ly.k = -1;
      hide();
      resume();
    }
  }

  function resume() {
    clearTimeout(timer);
    if (!live || silent) return;
    timer = setTimeout(talk, gap());
  }
  function talk() {
    if (!live || silent || botOff()) return;
    if (document.hidden || sing || ly.on || gaming()) return resume();
    var idle = Date.now() - lastInput > 60000, r = Math.random();
    var after = resume, h = new Date().getHours();
    if (idle) {
      idleSaid++;
      if (idleSaid > 3) { silent = true; tro('alone'); show(pick(FADE), { hold: 2600, after: function () { silent = true; } }); return; }
      return show(pick(IDLE), { after: after });
    }
    idleSaid = 0;
    if (validMail() && r < cfg.mailChance) { show(pick(MAIL), { cls: 'mail', hold: 9000, after: after }); return; }
    if (hasPlain() && A.playing && r < cfg.singChance + (validMail() ? cfg.mailChance : 0)) { if (singPlain()) return; }
    if (seasonNext && DW.season) { seasonNext = false; return show(pick(DW.season.pool()), { after: after }); }
    var x = Math.random();
    if (x < 0.07) { tro('existential'); return episode(pick(CRISIS), 'scold', after); }
    if (x < 0.2) return show(pick(STATS), { after: after });
    var pool = CHAT.concat(cfg.lines, cfg.lines);
    var q = Math.random();
    if (DW.season && q < (DW.season.id ? 0.35 : 0.2)) pool = DW.season.pool();
    else if (q < 0.5) pool = h < 5 ? DAY.night : h < 12 ? DAY.morning : h < 17 ? DAY.noon : h < 22 ? DAY.evening : DAY.night;
    show(pick(pool), { after: after });
  }

  function wake() {
    lastInput = Date.now();
    if (!live) return;
    if (silent) {
      silent = false;
      idleSaid = 0;
      if (Date.now() - lastWake < 3000) { resume(); return; }
      lastWake = Date.now();
      clearTimeout(timer);
      show(pick(WAKE), { after: resume });
    } else {
      idleSaid = 0;
    }
  }

  var buf = '', bufT = 0, kon = 0;
  function strongIn(w) {
    for (var i = 0; i < STRONG.length; i++) if (w.indexOf(STRONG[i]) >= 0) return true;
    return false;
  }
  function weakIn(w) {
    var i, base = w.replace(/(ing|ed|er|s|y)$/, '');
    for (i = 0; i < WEAK.length; i++) if (w === WEAK[i] || base === WEAK[i]) return true;
    return false;
  }
  function react(text, cls) {
    lastReact = Date.now();
    clearTimeout(timer);
    sing = null;
    ly.on = false;
    show(text, { cls: cls || '', after: resume });
  }
  function scold() {
    swears++;
    tro('potty');
    if (DW.cancelHot) DW.cancelHot();
    var t;
    if (swears === 1) t = SCOLD[0];
    else if (swears % 6 === 0) t = pick(SCOLD_MANY);
    else t = pick(SCOLD.slice(1).concat(cfg.scolds));
    react(t, 'scold');
  }
  function letter(e) {
    var k = e.key;
    if (k && k.length === 1) return k.toLowerCase();
    var m = /^(?:Key)([A-Z])$/.exec(e.code || '');
    if (m) return m[1].toLowerCase();
    m = /^Digit(\d)$/.exec(e.code || '');
    return m ? m[1] : '';
  }
  function typed(e) {
    try {
      if (!live || e.ctrlKey || e.metaKey || e.altKey || gaming()) return;
      var tg = e.target;
      if (tg && /^(input|textarea|select)$/i.test(tg.tagName) && tg.type !== 'range') return;
      wake();
      if (e.repeat) return;
      keys++;
      var kk = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (kk === KONAMI[kon]) {
        kon++;
        if (kon === KONAMI.length) {
          kon = 0;
          tro('konami');
          react('+30 lives!', 'sing');
          if (DW.vis && DW.vis.state) DW.vis.state.pulse = 1;
        }
      } else kon = kk === KONAMI[0] ? 1 : 0;

      var c = letter(e);
      if (!c) {
        if (e.key && e.key.length === 1) buf = '';
        return;
      }
      if (!/[a-z0-9]/.test(c)) { buf = ''; return; }
      if (Date.now() - bufT > 4000) buf = '';
      bufT = Date.now();
      buf = (buf + c).slice(-24);

      if (strongIn(buf) && Date.now() - lastReact > 400) {
        buf = '';
        clearTimeout(typed.t);
        scold();
        return;
      }
      clearTimeout(typed.t);
      clearTimeout(typed.w);
      typed.w = setTimeout(function () {
        if (live && buf && weakIn(buf)) { buf = ''; scold(); }
      }, 1500);
      typed.t = setTimeout(function () {
        var w = buf;
        if (!w || !live || !WORDS[w]) return;
        buf = '';
        clearTimeout(typed.w);
        var r = pick(WORDS[w]);
        if (r === '__sing') {
          if (hasPlain() && A.playing && singPlain()) return;
          if (hasTimed()) react(A.playing ? 'i sing along when the lyrics come up. keep listening!' : 'press play and i will sing along.');
          else react(A.playing ? 'i would sing but nobody gave me the lyrics.' : 'press play and i might sing.');
        } else if (r === '__mail') {
          if (validMail()) { lastReact = Date.now(); mailLine(); clearTimeout(timer); resume(); }
          else react('i do not have an email set up. mysterious, right?');
        } else if (r === '__crisis') {
          lastReact = Date.now();
          clearTimeout(timer);
          tro('existential');
          episode(pick(CRISIS), 'scold', resume);
        } else if (r === '__emo') {
          lastReact = Date.now();
          clearTimeout(timer);
          episode(['<happy>emotions! watch this.'].concat(DW.emo.demo(), ['<proud>that is all of them.']), 'emo', resume);
        } else if (r === '__stat') {
          react(pick(STATS));
        } else react(r);
      }, 650);
    } catch (err) {
      console.error('[dweeb] splash typing broke:', err);
    }
  }

  S.init = function () {
    box = document.getElementById('splash');
    txt = document.getElementById('sp-txt');
    var user = (window.DW && DW.splash) || {};
    cfg = {};
    Object.keys(D).forEach(function (k) { cfg[k] = user[k] !== undefined ? user[k] : D[k]; });
    cfg.lines = [].concat(cfg.lines || []).map(String);
    cfg.scolds = [].concat(cfg.scolds || []).map(String);
    if (!Array.isArray(cfg.every) || cfg.every.length < 2) cfg.every = D.every;
    cfg.boss = String(cfg.boss || D.boss).slice(0, 40);
    if (!box || !txt || cfg.on === false) { if (box) box.remove(); box = null; return; }

    try { visits = (parseInt(localStorage.getItem('dw-visits'), 10) || 0) + 1; localStorage.setItem('dw-visits', visits); } catch (e) {}
    DW.visits = visits;

    DW.vis.bind('splash', txt);

    box.addEventListener('click', function () {
      if (!box.classList.contains('mail') || !validMail()) return;
      DW.openLink('mailto:' + cfg.email);
    });
    addEventListener('keydown', typed, true);
    addEventListener('pointerdown', function () { clicks++; wake(); }, true);
    addEventListener('pointermove', function () { if (Date.now() - lastInput > 4000) wake(); }, { passive: true });
    addEventListener('touchstart', wake, { passive: true });
    addEventListener('wheel', wake, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      if (Date.now() - lastInput > 60000 || silent) { silent = true; wake(); }
      else resume();
    });

    A.on('time', follow);
    var firstState = true, lastTrack = '';
    A.on('track', function (t) {
      sing = null;
      if (ly.on) { ly.on = false; hide(); }
      ly.k = -1;
      if (!live || t.file === lastTrack) { lastTrack = t.file; return; }
      lastTrack = t.file;
      if (silent || gaming() || Date.now() - lastReact < 2500) { resume(); return; }
      if (earlyLyric(t)) { resume(); return; }
      clearTimeout(timer);
      show(pick(NOW), { after: resume });
    });
    var wasPlaying = false;
    A.on('state', function () {
      if (firstState) { firstState = false; wasPlaying = A.playing; return; }
      if (!live || silent || gaming()) { wasPlaying = A.playing; return; }
      if (!A.playing && (ly.on || sing)) { sing = null; ly.on = false; ly.k = -1; hide(); resume(); }
      if (wasPlaying && !A.playing && !A.el.ended && Date.now() - lastReact > 4000 && Math.random() < 0.5) { clearTimeout(timer); show(pick(PAUSED), { after: resume }); }
      else if (!wasPlaying && A.playing && Date.now() - lastReact > 4000 && Math.random() < 0.4) { clearTimeout(timer); show(pick(RESUME), { after: resume }); }
      wasPlaying = A.playing;
    });
  };

  S.apply = function () {
    if (!box) return;
    clearTimeout(timer);
    if (botOff()) { hide(); return; }
    silent = false;
    idleSaid = 0;
    if (live) show(pick(WAKE), { after: resume });
  };

  S.say = function (text) {
    if (botOff() || !live || silent || gaming() || !box) return;
    react(text);
  };

  S.start = function () {
    if (!box || live) return;
    live = true;
    lastInput = Date.now();
    setTimeout(function () {
      if (Date.now() - lastReact < 2000 || ly.on) { resume(); return; }
      seasonNext = true;
      show(pick(visits > 1 ? HELLO_BACK : HELLO_NEW), { after: resume });
    }, 1400);
  };
})();
