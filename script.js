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

    const CONFIG = {
        video: "dweeb.mp4",
        cards: [
            { image: "loading1.png", audio: "loading1.mp3" },
            { image: "loading2.png", hold: 3000 }
        ],
        musicFile: n => `music${n}.mp3`,
        musicMax: 50,
        gapMs: 500,
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

    function silentClip() {
        const bytes = new Uint8Array(46);
        const view = new DataView(bytes.buffer);
        const write = (offset, text) => {
            for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
        };

        write(0, "RIFF");
        view.setUint32(4, 38, true);
        write(8, "WAVE");
        write(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 8000, true);
        view.setUint32(28, 16000, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        write(36, "data");
        view.setUint32(40, 2, true);

        return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
    }

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

    let muted = false;
    let musicStarted = false;
    let audioContext = null;
    let analyser = null;
    let masterGain = null;
    let spectrum = null;
    let resetBeat = () => {};

    const assets = { video: null, cards: [], tracks: [] };

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    async function exists(url) {
        try {
            const res = await fetch(url, { method: "HEAD", cache: "no-store" });
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

    async function download(url, onProgress) {
        try {
            const res = await fetch(url, { cache: "force-cache" });
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
        const state = weights.map(() => 0);
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        const render = () => {
            const done = state.reduce((sum, v, i) => sum + v * weights[i], 0);
            const fraction = totalWeight ? done / totalWeight : 1;
            progressBar.style.transform = `scaleX(${fraction})`;
            enterButton.textContent = `Loading ${Math.floor(fraction * 100)}%`;
        };

        return index => value => {
            state[index] = value;
            render();
        };
    }

    async function preload() {
        const music = await findMusic();

        const jobs = [{ key: "video", url: CONFIG.video, weight: 6 }];

        CONFIG.cards.forEach((card, i) => {
            jobs.push({ key: `image${i}`, url: card.image, weight: 1 });
            if (card.audio) jobs.push({ key: `audio${i}`, url: card.audio, weight: 2 });
        });

        if (music.length) jobs.push({ key: "music", url: music[0], weight: 2 });

        const reporter = createProgress(jobs.map(job => job.weight));

        const results = await Promise.all(
            jobs.map(async (job, i) => {
                const report = reporter(i);
                const result = await download(job.url, report);
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
        assets.tracks = music.map((file, i) => (i === 0 && byKey.music ? byKey.music : file));
    }

    function applyMute() {
        video.muted = voice.muted = muted;

        if (masterGain) {
            bgm.muted = false;
            masterGain.gain.value = muted ? 0 : 1;
        } else {
            bgm.muted = muted;
        }
    }

    function setMuted(value) {
        muted = value;
        applyMute();

        audioIcon.src = muted ? "audio1.png" : "audio.png";
        audioToggle.setAttribute("aria-pressed", String(muted));
        audioToggle.setAttribute("aria-label", muted ? "Unmute audio" : "Mute audio");
    }

    function prepareAudio() {
        const Context = window.AudioContext || window.webkitAudioContext;

        if (Context) {
            try {
                audioContext = new Context();
                const source = audioContext.createMediaElementSource(bgm);

                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.35;
                spectrum = new Float32Array(analyser.frequencyBinCount);

                masterGain = audioContext.createGain();

                source.connect(analyser);
                source.connect(masterGain);
                masterGain.connect(audioContext.destination);

                audioContext.resume();
                applyMute();
            } catch {
                analyser = null;
                masterGain = null;
            }
        }

        const clip = silentClip();
        for (const el of [voice, bgm]) {
            el.src = clip;
            el.play().then(() => el.pause()).catch(() => {});
        }
    }

    function startPulse() {
        if (!analyser) return;

        const cfg = CONFIG.beat;
        const binHz = audioContext.sampleRate / analyser.fftSize;
        const clampDb = db => (db > -140 ? db : -140);

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
        const body = { lo: kick.lo, hi: hat.hi, average: null, peak: -140 };

        const bandDb = band => {
            let power = 0;
            for (let i = band.lo; i <= band.hi; i++) {
                power += Math.pow(10, clampDb(spectrum[i]) / 10);
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
        let last = performance.now();
        let loud = 0;

        resetBeat = () => {
            kick.average = snare.average = hat.average = body.average = null;
            body.peak = -140;
        };

        const frame = now => {
            const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
            last = now;

            analyser.getFloatFrequencyData(spectrum);

            advance(kick, bandDb(kick), dt);
            const snareHit = advance(snare, bandDb(snare), dt);
            advance(hat, bandDb(hat), dt);
            if (snareHit) tilt = -tilt;

            const overall = bandDb(body);
            body.peak = Math.max(overall, body.peak - dt * 2);
            const presence = Math.min(Math.max(1 - (body.peak - overall) / 18, 0), 1);
            loud += (presence - loud) * (1 - Math.exp(-dt / 0.4));

            const t = now / 1000;
            const scale = 1 + kick.level * cfg.kickScale + loud * 0.008;
            const x = Math.sin(t * 1.3) * loud * cfg.sway;
            const y = -kick.level * cfg.kickLift + Math.sin(t * 2.1) * loud * cfg.sway * 0.6;
            const tiltDeg = tilt * snare.level * cfg.snareTilt;
            const glow = Math.min(kick.level * 0.6 + hat.level * 0.5, 1);

            heading.style.transform =
                `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${tiltDeg.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
            heading.style.textShadow =
                `0 0 ${(glow * 34).toFixed(1)}px rgba(255, 255, 255, ${(glow * 0.55).toFixed(2)})`;

            requestAnimationFrame(frame);
        };

        requestAnimationFrame(frame);
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
            el.muted = muted;
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
                video.onended = video.onerror = null;
                backdrop.pause();
                resolve();
            };

            video.onended = done;
            video.onerror = done;
            video.ontimeupdate = syncBackdrop;

            backdrop.src = video.src = assets.video;
            backdrop.muted = true;
            video.muted = muted;

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

    function playMusic(index = 0, failures = 0) {
        const tracks = assets.tracks;
        if (!tracks.length || failures >= tracks.length) return;

        musicStarted = true;
        bgm.loop = tracks.length === 1;
        bgm.muted = masterGain ? false : muted;
        bgm.src = tracks[index];
        resetBeat();

        if (audioContext && audioContext.state !== "running") {
            audioContext.resume().catch(() => {});
        }

        const next = (offset, count) => () => playMusic((index + offset) % tracks.length, count);
        bgm.onended = next(1, 0);
        bgm.onerror = next(1, failures + 1);

        bgm.play().catch(() => {});
    }

    async function run() {
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
        setMuted(!muted);
        if (!muted && musicStarted && bgm.paused) bgm.play().catch(() => {});
    });

    enterButton.addEventListener("click", run, { once: true });

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
