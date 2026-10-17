(function () {
  var DW = window.DW;

  function byId(id) { return document.getElementById(id); }

  var WAIT_ASSET = 15000;
  var WAIT_AUDIO = 5000;
  var WAIT_VIDEO = 90000;

  var SKIP_DELAY = 1200;

  var STALL_TICKS = 8;

  DW.boot = function (cb) {
    var intro = DW.intro || {};
    var intro2 = DW.intro2 || {};
    var tracks = DW.tracks || [];

    var screen = byId('boot');
    var video = byId('intro');
    var gate = byId('gate');
    var skipBtn = byId('skip');
    var barFill = byId('load-fill');
    var barText = byId('load-txt');

    var total = 0;
    var done = 0;
    var armed = false;
    var ready = false;
    var finished = false;
    var videoURL = '';
    var stallTimer = 0;
    var skipTimer = 0;

    function paint() {
      var pct = total ? done / total : 0;
      barFill.style.transform = 'scaleX(' + pct.toFixed(3) + ')';
      barText.textContent = 'Downloading ' + done + '/' + total + ' content!';
    }

    function wait(timeout) {
      var settled = false;
      var timer = 0;
      total++;

      function settle() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        done++;
        paint();
        maybeReady();
      }

      if (timeout) timer = setTimeout(settle, timeout);
      return settle;
    }

    // images
    Array.prototype.forEach.call(document.querySelectorAll('#cats img, #top img'), function (img) {
      var settle = wait(WAIT_ASSET);
      if (img.complete) {
        settle();
      } else {
        img.addEventListener('load', settle);
        img.addEventListener('error', settle);
      }
    });

    // album covers
    tracks.forEach(function (track) {
      var settle = wait(WAIT_ASSET);
      var pic = new Image();
      pic.onload = settle;
      pic.onerror = settle;
      pic.src = DW.audio.cover(track);
    });

    // first audio
    if (tracks.length) {
      var settleAudio = wait(WAIT_AUDIO);
      var audioEl = DW.audio.el;
      if (audioEl.readyState >= 3) {
        settleAudio();
      } else {
        audioEl.addEventListener('canplaythrough', settleAudio, { once: true });
        audioEl.addEventListener('error', settleAudio, { once: true });
      }
    }

    // ---- intro video ----
    // chance for rare video
    function rollRare() {
      var rng = window.crypto;
      if (!rng || !rng.getRandomValues) return false;

      var forced = /[?&]force2=([^&]+)/.exec(location.search);
      if (forced && intro2.testKey) {
        try {
          if (decodeURIComponent(forced[1]) === intro2.testKey) return true;
        } catch (e) {}
      }

      var odds = +intro2.odds > 1 ? +intro2.odds : 1e9;
      var r = new Uint32Array(2);
      rng.getRandomValues(r);
      var n = (r[0] & 0x1FFFFF) * 4294967296 + r[1];
      return n / 9007199254740992 < 1 / odds;
    }

    // vidoe blob url
    function fetchVideo(src) {
      return fetch(src)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.blob();
        })
        .then(function (blob) { return URL.createObjectURL(blob); })
        .catch(function () { return ''; });
    }

    function gotRare() {
      if (DW.trophy) DW.trophy.award('rare');
      try {
        var n = +localStorage.getItem('dw-intro2') || 0;
        localStorage.setItem('dw-intro2', String(n + 1));
      } catch (e) { /* storage blocked */ }
    }

    function loadIntro() {
      var settle = wait(WAIT_VIDEO);
      var lucky = rollRare();
      var firstChoice = lucky ? (intro2.src || 'video/intro2.mp4') : intro.src;

      (firstChoice ? fetchVideo(firstChoice) : Promise.resolve(''))
        .then(function (url) {
          if (url) {
            if (lucky) gotRare();
            return url;
          }
          return (lucky && intro.src) ? fetchVideo(intro.src) : '';
        })
        .then(function (url) {
          if (ready) {
            if (url) URL.revokeObjectURL(url);
            return;
          }
          videoURL = url;
          settle();
        });
    }

    var skipSetting = !!(DW.set && DW.set.get('skipIntro'));
    if ((intro.src || intro2.src) && !skipSetting) loadIntro();

    // ---- flow ----
    function maybeReady() {
      if (!armed || ready || done < total) return;
      ready = true;
      barText.textContent = 'Download complete!';
      setTimeout(afterDownload, 500);
    }

    function afterDownload() {
      if (!videoURL) return finish();
      if (!intro.gate) return play(false);

      // waiting for a tap/key first
      var events = ['pointerup', 'touchend', 'click', 'keydown'];
      function onGesture() {
        events.forEach(function (name) { removeEventListener(name, onGesture, true); });
        play(true);
      }
      gate.hidden = false;
      events.forEach(function (name) { addEventListener(name, onGesture, true); });
    }

    function play(fromGesture) {
      if (fromGesture && DW.audio.unlock) DW.audio.unlock();
      gate.hidden = true;
      byId('dl').hidden = true;

      video.src = videoURL;
      video.hidden = false;
      video.muted = false;
      video.addEventListener('ended', finish);
      video.addEventListener('error', finish);

      var started = video.play();
      if (started && started.catch) {
        started.catch(function () {
          // if autoplay sound was blocked
          video.muted = true;
          video.play().catch(finish);
        });
      }

      if (intro.skip) {
        skipBtn.hidden = false;
        skipTimer = setTimeout(function () {
          addEventListener('pointerdown', finish, true);
          addEventListener('keydown', finish, true);
        }, SKIP_DELAY);
      }

      // watchdog holy shit thats a cool name
      var lastTime = -1;
      var stuck = 0;
      stallTimer = setInterval(function () {
        stuck = (video.currentTime === lastTime) ? stuck + 1 : 0;
        lastTime = video.currentTime;
        if (stuck >= STALL_TICKS) finish();
      }, 1000);
    }

    function finish() {
      if (finished) return;
      finished = true;

      clearInterval(stallTimer);
      clearTimeout(skipTimer);
      removeEventListener('pointerdown', finish, true);
      removeEventListener('keydown', finish, true);

      screen.classList.add('gone');
      cb();

      // cool fade out
      setTimeout(function () {
        screen.classList.add('dead');
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
          video.remove();
        } catch (e) { /* already gone */ }
        if (videoURL) URL.revokeObjectURL(videoURL);
      }, 1200);
    }

    paint();
    armed = true;
    maybeReady();
  };
})();
