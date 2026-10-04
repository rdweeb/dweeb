"use strict";

(() => {
    if (window.top !== window.self) {
        try {
            window.top.location.replace(window.location.href);
        } catch {
            document.documentElement.textContent = "";
        }
        return;
    }

    document.documentElement.classList.remove("no-js");

    const VERSION = "2026-10-04.1";

    const CONFIG = {
        video: "dweeb.mp4",
        cards: [
            { image: "loading1.png", audio: "loading1.mp3" },
            { image: "loading2.png", hold: 3000 }
        ],
        musicFile: n => `music${n}.mp3`,
        musicMax: 50,
        gapMs: 500,
        fadeInMs: 1500,
        fadeOutMs: 3500,
        trackGapMs: 1200,
        imageFadeMs: 700,
        screenFadeMs: 1200,
        beat: {
            kick: { from: 30, to: 150, floor: 2, range: 6, release: 0.16 },
            snare: { from: 180, to: 2500, floor: 2, range: 6, release: 0.12 },
            hat: { from: 4000, to: 12000, floor: 2, range: 7, release: 0.08 },
            trackMemory: 1.2,
            kickScale: 0.06,
            kickLift: 10,
            snareTilt: 0.8,
            sway: 4
        }
    };

    const versioned = file => `${file}?v=${VERSION}`;

    const $ = id => document.getElementById(id);

    const stage = $("intro-stage");
    const video = $("intro-video");
    const backdrop = $("intro-backdrop");
    const loadingImage = $("loading-image");
    const loadingScreen = $("loading-screen");
    const messageScreen = $("message-screen");
    const heading = messageScreen.querySelector("h1");
    const gate = $("gate");
    const enterButton = $("enter");
    const progressBar = $("progress-bar");
    const audioToggle = $("audio-toggle");
    const audioIcon = $("audio-icon");

    const voice = new Audio();
    const bgm = new Audio();
    voice.preload = bgm.preload = "auto";
    bgm.crossOrigin = "anonymous";

    const portrait = window.matchMedia("(orientation: portrait)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const state = {
        muted: false,
        musicStarted: false,
        started: false
    };

    const audio = {
        context: null,
        analyser: null,
        gain: null,
        fade: null,
        spectrum: null
    };

    let nextTimer = 0;
    let fadeTimer = 0;

    const assets = { video: null, cards: [], tracks: [] };

    let resetBeat = () => {};

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    function silentClip() {
        const bytes = new Uint8Array(46);
        const view = new DataView(bytes.buffer);
        const tag = (offset, text) => {
            for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
        };

        tag(0, "RIFF");
        view.setUint32(4, 38, true);
        tag(8, "WAVE");
        tag(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 8000, true);
        view.setUint32(28, 16000, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        tag(36, "data");
        view.setUint32(40, 2, true);

        return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
    }

    async function exists(file) {
        try {
            const res = await fetch(versioned(file), { method: "HEAD", cache: "no-cache" });
            return res.ok;
        } catch {
            return false;
        }
    }

    async function findMusic() {
        const found = [];
        for (let n = 1; n <= CONFIG.musicMax; n++) {
            const file = CONFIG.musicFile(n);
            if (!(await exists(file))) break;
            found.push(file);
        }
        return found;
    }

    async function download(file, onProgress) {
        try {
            const res = await fetch(versioned(file), { cache: "no-cache" });
            if (!res.ok) return null;

            const total = Number(res.headers.get("content-length")) || 0;
            const type = res.headers.get("content-type") || "";

            if (!res.body) {
                const blob = await res.blob();
                onProgress(1);
                return URL.createObjectURL(blob);
            }

            const reader = res.body.getReader();
            const chunks = [];
            let loaded = 0;

            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                if (total) onProgress(Math.min(loaded / total, 0.99));
            }

            onProgress(1);
            return URL.createObjectURL(new Blob(chunks, { type }));
        } catch {
            return null;
        }
    }

    function createProgress(weights) {
        const values = weights.map(() => 0);
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        const render = () => {
            const done = values.reduce((sum, v, i) => sum + v * weights[i], 0);
            const fraction = totalWeight ? done / totalWeight : 1;
            progressBar.style.transform = `scaleX(${fraction})`;
            enterButton.textContent = `Loading ${Math.floor(fraction * 100)}%`;
        };

        return index => value => {
            values[index] = value;
            render();
        };
    }

    async function preload() {
        const music = await findMusic();

        const jobs = [{ key: "video", file: CONFIG.video, weight: 6 }];

        CONFIG.cards.forEach((card, i) => {
            jobs.push({ key: `image${i}`, file: card.image, weight: 1 });
            if (card.audio) jobs.push({ key: `audio${i}`, file: card.audio, weight: 2 });
        });

        if (music.length) jobs.push({ key: "music", file: music[0], weight: 2 });

        const reporter = createProgress(jobs.map(job => job.weight));

        const results = await Promise.all(
            jobs.map(async (job, i) => {
                const report = reporter(i);
                const result = await download(job.file, report);
                report(1);
                return [job.key, result];
            })
        );

        const byKey = Object.fromEntries(results);

        assets.video = byKey.video;
        assets.cards = CONFIG.cards.map((card, i) => ({
            image: byKey[`image${i}`],
            audio: card.audio ? byKey[`audio${i}`] : null,
            hold: card.hold || 3000
        }));
        assets.tracks = music.map((file, i) =>
            i === 0 && byKey.music ? byKey.music : versioned(file)
        );
    }

    function applyMute() {
        video.muted = voice.muted = state.muted;

        if (audio.gain) {
            bgm.muted = false;
            audio.gain.gain.value = state.muted ? 0 : 1;
        } else {
            bgm.muted = state.muted;
        }
    }

    function setMuted(value) {
        state.muted = value;
        applyMute();

        audioIcon.src = versioned(value ? "audio1.png" : "audio.png");
        audioToggle.setAttribute("aria-pressed", String(value));
        audioToggle.setAttribute("aria-label", value ? "Unmute audio" : "Mute audio");
    }

    function prepareAudio() {
        const Context = window.AudioContext || window.webkitAudioContext;

        if (Context) {
            try {
                const context = new Context();
                const source = context.createMediaElementSource(bgm);
                const analyser = context.createAnalyser();
                const gain = context.createGain();
                const fade = context.createGain();

                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.35;

                source.connect(analyser);
                source.connect(fade);
                fade.connect(gain);
                gain.connect(context.destination);

                audio.context = context;
                audio.analyser = analyser;
                audio.gain = gain;
                audio.fade = fade;
                audio.spectrum = new Float32Array(analyser.frequencyBinCount);

                context.resume();
                applyMute();
            } catch {
                audio.context = audio.analyser = audio.gain = audio.fade = audio.spectrum = null;
            }
        }

        const clip = silentClip();
        for (const el of [voice, bgm]) {
            el.src = clip;
            el.play().then(() => el.pause()).catch(() => {});
        }
    }

    function startPulse() {
        const { analyser, context, spectrum } = audio;
        if (!analyser) return;

        const cfg = CONFIG.beat;
        const binHz = context.sampleRate / analyser.fftSize;

        const makeBand = spec => ({
            lo: Math.max(1, Math.round(spec.from / binHz)),
            hi: Math.max(2, Math.round(spec.to / binHz)),
            floor: spec.floor,
            range: spec.range,
            release: spec.release,
            average: null,
            level: 0
        });

        const kick = makeBand(cfg.kick);
        const snare = makeBand(cfg.snare);
        const hat = makeBand(cfg.hat);
        const body = { lo: kick.lo, hi: hat.hi, peak: -140 };

        const bandDb = band => {
            let power = 0;
            for (let i = band.lo; i <= band.hi; i++) {
                power += Math.pow(10, Math.max(spectrum[i], -140) / 10);
            }
            return 10 * Math.log10(power / (band.hi - band.lo + 1) + 1e-14);
        };

        const follow = (band, db, dt) => {
            if (band.average === null) band.average = db;
            const delta = db - band.average;
            band.average += (db - band.average) * (1 - Math.exp(-dt / cfg.trackMemory));
            return delta;
        };

        const advance = (band, db, dt) => {
            const delta = follow(band, db, dt);
            const strength = Math.min(Math.max((delta - band.floor) / band.range, 0), 1);
            const previous = band.level;
            band.level = Math.max(strength, band.level * Math.exp(-dt / band.release));
            return strength > previous + 0.25;
        };

        let tilt = 1;
        let loud = 0;
        let last = performance.now();
        let frameId = 0;

        resetBeat = () => {
            kick.average = snare.average = hat.average = null;
            body.peak = -140;
        };

        const frame = now => {
            const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
            last = now;

            analyser.getFloatFrequencyData(spectrum);

            advance(kick, bandDb(kick), dt);
            if (advance(snare, bandDb(snare), dt)) tilt = -tilt;
            advance(hat, bandDb(hat), dt);

            const overall = bandDb(body);
            body.peak = Math.max(overall, body.peak - dt * 2);
            const presence = Math.min(Math.max(1 - (body.peak - overall) / 18, 0), 1);
            loud += (presence - loud) * (1 - Math.exp(-dt / 0.4));

            const energy = audio.fade ? audio.fade.gain.value : 1;
            const t = now / 1000;
            const scale = 1 + (kick.level * cfg.kickScale + loud * 0.008) * energy;
            const x = Math.sin(t * 1.3) * loud * cfg.sway * energy;
            const y = (-kick.level * cfg.kickLift + Math.sin(t * 2.1) * loud * cfg.sway * 0.6) * energy;
            const angle = tilt * snare.level * cfg.snareTilt * energy;
            const glow = Math.min(kick.level * 0.6 + hat.level * 0.5, 1) * energy;

            heading.style.transform =
                `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${angle.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
            heading.style.textShadow =
                `0 0 ${(glow * 34).toFixed(1)}px rgba(255, 255, 255, ${(glow * 0.55).toFixed(2)})`;

            frameId = requestAnimationFrame(frame);
        };

        document.addEventListener("visibilitychange", () => {
            cancelAnimationFrame(frameId);
            if (document.hidden) return;
            last = performance.now();
            frameId = requestAnimationFrame(frame);
        });

        frameId = requestAnimationFrame(frame);
    }

    function playToEnd(el, src) {
        return new Promise(resolve => {
            let timer = null;

            const finish = () => {
                clearTimeout(timer);
                el.onended = el.onerror = el.onloadedmetadata = null;
                resolve();
            };

            el.onended = finish;
            el.onerror = finish;
            el.onloadedmetadata = () => {
                const length = Number.isFinite(el.duration) ? el.duration * 1000 : 60000;
                timer = setTimeout(finish, length + 3000);
            };

            el.src = src;
            el.muted = state.muted;
            el.play().catch(finish);
        });
    }

    function syncBackdrop() {
        if (!portrait.matches || video.paused) return;
        if (backdrop.paused) backdrop.play().catch(() => {});
        if (Math.abs(backdrop.currentTime - video.currentTime) > 0.25) {
            backdrop.currentTime = video.currentTime;
        }
    }

    function playIntro() {
        if (!assets.video) return Promise.resolve();

        return new Promise(resolve => {
            const done = () => {
                video.onended = video.onerror = video.ontimeupdate = null;
                backdrop.pause();
                resolve();
            };

            video.onended = done;
            video.onerror = done;
            video.ontimeupdate = syncBackdrop;

            backdrop.src = video.src = assets.video;
            backdrop.muted = true;
            video.muted = state.muted;

            if (portrait.matches) backdrop.play().catch(() => {});
            video.play().then(() => stage.classList.add("visible")).catch(done);
        });
    }

    async function playCards() {
        let shown = false;

        for (const card of assets.cards) {
            if (!card.image) continue;

            loadingImage.src = card.image;
            try {
                await loadingImage.decode();
            } catch {
                continue;
            }

            loadingImage.classList.toggle("cut", shown);
            loadingImage.classList.add("visible");
            shown = true;

            if (card.audio) {
                await playToEnd(voice, card.audio);
            } else {
                await wait(card.hold);
            }
        }

        loadingImage.classList.remove("cut", "visible");
        await wait(CONFIG.imageFadeMs);
    }

    function scheduleFade() {
        if (!state.musicStarted) return;

        const fadeIn = CONFIG.fadeInMs / 1000;
        const fadeOut = CONFIG.fadeOutMs / 1000;
        const { duration, currentTime } = bgm;
        const remaining = Number.isFinite(duration) ? duration - currentTime : Infinity;

        if (audio.fade) {
            const param = audio.fade.gain;
            const now = audio.context.currentTime;
            const rise = Math.min(fadeIn, Math.max(remaining, 0.05));

            param.cancelScheduledValues(now);
            param.setValueAtTime(currentTime > 0.05 ? 1 : 0, now);
            param.linearRampToValueAtTime(1, now + rise);

            if (Number.isFinite(remaining) && remaining > fadeIn + 0.5) {
                const end = now + remaining;
                param.setValueAtTime(1, Math.max(now + rise, end - fadeOut));
                param.linearRampToValueAtTime(0, end);
            }
            return;
        }

        clearInterval(fadeTimer);
        fadeTimer = setInterval(() => {
            const left = Number.isFinite(bgm.duration) ? bgm.duration - bgm.currentTime : Infinity;
            const level = Math.min(bgm.currentTime / fadeIn, left / fadeOut, 1);
            bgm.volume = Math.min(Math.max(level, 0), 1);
        }, 50);
    }

    function playMusic(index = 0, failures = 0) {
        const { tracks } = assets;
        clearTimeout(nextTimer);
        clearInterval(fadeTimer);
        if (!tracks.length || failures >= tracks.length) return;

        state.musicStarted = true;
        bgm.loop = false;
        bgm.muted = audio.gain ? false : state.muted;
        bgm.src = tracks[index];
        resetBeat();

        if (audio.fade) {
            audio.fade.gain.cancelScheduledValues(0);
            audio.fade.gain.value = 0;
        } else {
            bgm.volume = 0;
        }

        if (audio.context && audio.context.state !== "running") {
            audio.context.resume().catch(() => {});
        }

        const following = (failed = false) =>
            playMusic((index + 1) % tracks.length, failed ? failures + 1 : 0);

        bgm.onended = () => {
            nextTimer = setTimeout(following, CONFIG.trackGapMs);
        };
        bgm.onerror = () => following(true);

        bgm.play().catch(() => {});
    }

    bgm.addEventListener("playing", scheduleFade);

    async function run() {
        if (state.started) return;
        state.started = true;

        prepareAudio();

        const intro = playIntro();
        gate.classList.add("leaving");

        await intro;
        stage.classList.remove("visible");
        await wait(CONFIG.gapMs);

        await playCards();

        loadingScreen.classList.add("hidden");
        await wait(CONFIG.screenFadeMs);

        document.title = "Under construction";
        messageScreen.classList.add("visible");
        playMusic();
        startPulse();
    }

    audioToggle.addEventListener("click", () => {
        setMuted(!state.muted);
        if (!state.muted && state.musicStarted && bgm.paused && !bgm.ended) {
            bgm.play().catch(() => {});
        }
    });

    enterButton.addEventListener("click", run);

    async function boot() {
        setMuted(false);
        await preload();

        progressBar.style.transform = "scaleX(1)";
        enterButton.textContent = "Enter";
        enterButton.disabled = false;
        gate.classList.add("ready");
        enterButton.focus({ preventScroll: true });
    }

    boot();
})();
