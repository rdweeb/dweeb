(function () {
  var DW = window.DW;
  var Changelog = (DW.changelog = {});
  // wow changelog
  Changelog.entries = [
    {
      version: '1.1',
      date: '17 OCT 2026',
      title: 'Known issues, fixing them now',
      items: [
        "I found a few errors in my code and I'm working on fixing them right now.",
        "Sorry for any inconvenience! If the site doesn't work properly for you, that's why.",
        'Thanks for being patient, I will update this changelog as soon as things are sorted.'
      ]
    },
    {
      version: '1.0',
      date: '15 OCT 2026',
      title: 'DWEEB RECORDS is open',
      items: [
        "There's a music player with a reactive background, a few lyrics from the chat bot and a menu of categories, no links yet tho.",
        'GAMES!! Rhythm is basically just guitar hero, snake, pong, tetris, breakout and 2048, each with modes',
        'TROPHIES in five tiers, bronze, silver, gold, platinum and rare. Some are secret, and there is a save data screen',
        'Settings let you change the colours, how much the site reacts to the music, mute the music on start, skip the intro and more. It is saved on your device!',
        'A chat bot with 20 emotions, type "emotions" to see them all, and watch what it says. This feature only works for keyboard users tho, soz.',
        'Seasons last the whole month!',
        'The visitor eyes can wake up and follow your cursor, if you click/tap it a lot',
        "A few secrets, no spoilers. There is a famous code that works on phones too, the album cover does not like being held, the chat bot hates being poked, and the mute button hates being smashed, and a few others.. that I won't give hints to!",
        'So yeah, there are more. Go look around, tap things, hold things, type things',
        'No links yet sadly, I will update the changelog when I add the rest of the sites!! HELL YEAH!!'
      ]
    }
  ];
  // Small helpers
  // Make an element with an optional class and text.
  function makeEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  // Remember which version the visitor last opened.
  // localStorage can throw (private mode, blocked storage), so wrap it.
  var SEEN_KEY = 'dw-cl-seen';

  function getSeenVersion() {
    try {
      return localStorage.getItem(SEEN_KEY) || '';
    } catch (err) {
      return '';
    }
  }

  function setSeenVersion(version) {
    try {
      localStorage.setItem(SEEN_KEY, version);
    } catch (err) {
      // Not saved, no big deal.
    }
  }

  // Build one entry (heading, title, bullet list) for the window.
  function buildEntry(entry) {
    var section = makeEl('section', 'cl-entry');

    var heading = 'v' + entry.version + (entry.date ? '  -  ' + entry.date : '');
    section.appendChild(makeEl('h3', null, heading));

    if (entry.title) {
      section.appendChild(makeEl('div', 'cl-title', entry.title));
    }

    var list = makeEl('ul', 'cl-list');
    (entry.items || []).forEach(function (text) {
      list.appendChild(makeEl('li', null, text));
    });
    section.appendChild(list);

    return section;
  }

  // Build the CHANGELOG button for the status bar.
  function buildButton() {
    var button = makeEl('button', 'tbtn');
    button.id = 'b-log';
    button.type = 'button';
    button.title = 'changelog: what is new';

    var iconSrc = (DW.icons || {}).changelog;
    if (iconSrc) {
      var icon = new Image();
      icon.src = iconSrc;
      icon.alt = '';
      button.appendChild(icon);
    } else {
      button.classList.add('noic'); // no icon available
    }

    var label = makeEl('span', null, 'CHANGELOG');
    label.setAttribute('data-s', 'LOG'); // short label for small screens
    button.appendChild(label);

    return button;
  }

  // ---------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------
  Changelog.init = function () {
    var entries = Changelog.entries || [];
    if (!entries.length) return;

    var latestVersion = String(entries[0].version);

    // Window with all the entries inside.
    var win = DW.win('changelog', 'CHANGELOG');
    entries.forEach(function (entry) {
      win.body.appendChild(buildEntry(entry));
    });

    // Status bar button.
    var button = buildButton();

    // Glow if the visitor hasn't seen the newest version yet.
    if (getSeenVersion() !== latestVersion) {
      button.classList.add('fresh');
    }

    button.addEventListener('click', function () {
      win.toggle();
      button.blur();
    });

    // Opening the window marks the newest version as seen.
    win.onopen = function () {
      setSeenVersion(latestVersion);
      button.classList.remove('fresh');
    };

    // Put the button before the help button (or the views wrap as a fallback).
    var statusBar = document.getElementById('status');
    var anchor = document.getElementById('b-help') || document.getElementById('views-wrap');
    statusBar.insertBefore(button, anchor);
  };
})();
