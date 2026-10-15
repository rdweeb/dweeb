(function () {
  var DW = window.DW, E = (DW.emo = {});

  var DEF = {
    angry:    { speed: 0.8,  alias: ['mad', 'rage', 'furious'] },
    shy:      { speed: 1.7,  alias: ['timid', 'bashful'] },
    sad:      { speed: 1.6,  alias: ['cry', 'down', 'blue'] },
    happy:    { speed: 0.9,  alias: ['joy', 'glad', 'yay'] },
    excited:  { speed: 0.6,  alias: ['hype', 'yippee'] },
    scared:   { speed: 1.0,  alias: ['afraid', 'fear', 'terrified'] },
    whisper:  { speed: 1.5,  alias: ['quiet', 'psst', 'secret'] },
    yell:     { speed: 0.7,  alias: ['loud', 'shout', 'scream'] },
    sleepy:   { speed: 2.0,  alias: ['tired', 'yawn', 'sleep'] },
    love:     { speed: 1.2,  alias: ['heart', 'crush', 'blush'] },
    silly:    { speed: 0.9,  alias: ['goofy', 'wacky', 'derp'] },
    spooky:   { speed: 1.4,  alias: ['ghost', 'creepy', 'eerie'] },
    dizzy:    { speed: 1.0,  alias: ['drunk', 'spin', 'wavy'] },
    glitch:   { speed: 0.7,  alias: ['error', 'bug', 'broken'] },
    cold:     { speed: 1.1,  alias: ['freeze', 'brr', 'chilly'] },
    rich:     { speed: 1.0,  alias: ['gold', 'fancy', 'shiny'] },
    sneaky:   { speed: 1.3,  alias: ['sly', 'plotting', 'smirk'] },
    nervous:  { speed: 1.2,  alias: ['anxious', 'worried', 'sweat'] },
    proud:    { speed: 1.1,  alias: ['smug', 'boast'] },
    sing:     { speed: 1.0,  alias: ['music', 'melody', 'la'] }
  };
  var MAP = {}, NAMES = Object.keys(DEF);
  NAMES.forEach(function (k) {
    MAP[k] = k;
    DEF[k].alias.forEach(function (a) { if (!MAP[a]) MAP[a] = k; });
  });
  var RESET = { n: 1, normal: 1, '/': 1, reset: 1, off: 1, end: 1 };

  E.names = NAMES;
  E.def = DEF;

  E.tokens = function (text) {
    var out = [], cur = null, re = /<(\/?)\s*([a-z0-9]+)\s*>/gi, last = 0, m, i, s = String(text);
    function lit(str) { for (i = 0; i < str.length; i++) out.push({ c: str.charAt(i), e: cur }); }
    while ((m = re.exec(s))) {
      var tag = (m[1] + m[2]).toLowerCase(), w = /^(wait|pause)(\d*)$/.exec(m[2].toLowerCase());
      if (!m[1] && w) {
        lit(s.slice(last, m.index));
        out.push({ wait: (+w[2] || 1) * 450 });
      } else if (RESET[m[2].toLowerCase()] || (m[1] && MAP[m[2].toLowerCase()])) {
        lit(s.slice(last, m.index));
        cur = null;
      } else if (!m[1] && MAP[m[2].toLowerCase()]) {
        lit(s.slice(last, m.index));
        cur = MAP[m[2].toLowerCase()];
      } else continue;
      last = m.index + m[0].length;
      void tag;
    }
    lit(s.slice(last));
    return out;
  };

  E.plain = function (text) {
    return E.tokens(text).map(function (t) { return t.c || ''; }).join('');
  };

  E.writer = function (el) {
    var st = { seg: null, e: undefined, word: null, n: 0 };
    el.textContent = '';
    return function put(t) {
      if (t.wait || !t.c) return;
      var e = t.e;
      if (st.e !== e) {
        st.e = e;
        st.word = null;
        if (e) {
          st.seg = document.createElement('span');
          st.seg.className = 'em em-' + e;
          el.appendChild(st.seg);
        } else st.seg = el;
      }
      if (!e) {
        var lc = el.lastChild;
        if (lc && lc.nodeType === 3) lc.data += t.c; else el.appendChild(document.createTextNode(t.c));
        return;
      }
      if (t.c === ' ') { st.seg.appendChild(document.createTextNode(' ')); st.word = null; return; }
      if (!st.word) { st.word = document.createElement('span'); st.word.className = 'em-w'; st.seg.appendChild(st.word); }
      var ch = document.createElement('span');
      ch.className = 'em-c';
      ch.textContent = t.c;
      ch.style.animationDelay = '-' + ((st.n++ * 83) % 1400) + 'ms';
      st.word.appendChild(ch);
    };
  };

  E.set = function (el, text) {
    var put = E.writer(el);
    E.tokens(text).forEach(put);
  };

  E.delay = function (t, base) {
    if (t.wait) return t.wait;
    var k = t.e ? DEF[t.e].speed : 1;
    return base * k;
  };

  E.demo = function () {
    return NAMES.map(function (k) { return 'this is <' + k + '>' + k + '<n> okay'; });
  };
})();
