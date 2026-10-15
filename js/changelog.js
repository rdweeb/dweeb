(function () {
  var DW = window.DW, C = (DW.changelog = {});

  C.entries = [
    { v: '1.0', date: '15 OCT 2026', title: 'DWEEB RECORDS is open', items: [
      'Theres a music player with a reactive background, a few lyrics from the chat bot and a menu of categories, no links yet tho.',
      'GAMES!! Rhythm is basically just guitar hero, snake, pong, tetris, breakout and 2048, each with modes',
      'TROPHIES in five tiers, bronze, silver, gold, platinum and rare. Some are secret, and there is a save data screen',
      'Settings let you change the colours, how much the site reacts to the music, mute the music on start, skip the intro and more, It is saved on your device!',
      'A chat bot with 20 emotions, type "emotions" to see them all, and watch what it says, this feature only works for keyboard users tho, soz.',
      'Seasons last the whole month!',
      'The visitor eyes can wake up and follow your cursor, if you click/tap it a lot',
      'A few secrets, no spoilers, there is a famous code that works on phones too, the album cover does not like being held, the chat bot hates being poked, and the mute button hates being smashed, and a few others.. that I wont give hints to!',
      'So yeah, there are more. Go look around, tap things, hold things, type things',
      'No links yet sadly, I will update the changelog when I add the rest of the sites!! HELL YEAH!!'
    ] }
  ];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function seenGet() { try { return localStorage.getItem('dw-cl-seen') || ''; } catch (e) { return ''; } }
  function seenSet(v) { try { localStorage.setItem('dw-cl-seen', v); } catch (e) {} }

  C.init = function () {
    var list = C.entries || [];
    if (!list.length) return;
    var win = DW.win('changelog', 'CHANGELOG'), latest = String(list[0].v);
    list.forEach(function (en) {
      var box = el('section', 'cl-entry');
      var hd = el('h3', null, 'v' + en.v + (en.date ? '  -  ' + en.date : ''));
      box.appendChild(hd);
      if (en.title) box.appendChild(el('div', 'cl-title', en.title));
      var ul = el('ul', 'cl-list');
      (en.items || []).forEach(function (t) { ul.appendChild(el('li', null, t)); });
      box.appendChild(ul);
      win.body.appendChild(box);
    });

    var btn = el('button', 'tbtn');
    btn.id = 'b-log';
    btn.type = 'button';
    btn.title = 'changelog: what is new';
    var src = (DW.icons || {}).changelog;
    if (src) {
      var ic = new Image();
      ic.src = src;
      ic.alt = '';
      btn.appendChild(ic);
    }
    else btn.classList.add('noic');
    var cl = el('span', null, 'CHANGELOG');
    cl.setAttribute('data-s', 'LOG');
    btn.appendChild(cl);
    if (seenGet() !== latest) btn.classList.add('fresh');
    btn.addEventListener('click', function () { win.toggle(); btn.blur(); });
    win.onopen = function () { seenSet(latest); btn.classList.remove('fresh'); };
    var bar = document.getElementById('status');
    bar.insertBefore(btn, document.getElementById('b-help') || document.getElementById('views-wrap'));
  };
})();
