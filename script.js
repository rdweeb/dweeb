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
            lowBin: 1,
            highBin: 4,
            sensitivity: 5,
            decay: 0.88,
            maxScale: 0.03
        }
    };

    const SILENCE =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

    const $ = id => document.getElementById(id);

    const video = $("intro-video");
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

    let muted = false;
    let musicStarted = false;
    let audioContext = null;
    let analyser = null;
    let spectrum = null;

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

    function setMuted(value) {
        muted = value;
        video.muted = voice.muted = bgm.muted = muted;

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
                analyser.fftSize = 1024;
                analyser.smoothingTimeConstant = 0.55;
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                spectrum = new Uint8Array(analyser.frequencyBinCount);
                audioContext.resume();
            } catch {
                analyser = null;
            }
        }

        for (const el of [voice, bgm]) {
            el.src = SILENCE;
            el.play().then(() => el.pause()).catch(() => {});
        }
    }

    function startPulse() {
        if (!analyser) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const { lowBin, highBin, sensitivity, decay, maxScale } = CONFIG.beat;
        let baseline = 0;
        let level = 0;

        const frame = () => {
            analyser.getByteFrequencyData(spectrum);

            let sum = 0;
            for (let i = lowBin; i <= highBin; i++) sum += spectrum[i];
            const energy = sum / (highBin - lowBin + 1) / 255;

            baseline += (energy - baseline) * 0.05;

            const hit = Math.min(Math.max((energy - baseline * 1.05) * sensitivity, 0), 1);
            level = Math.max(hit, level * decay);

            heading.style.transform = `scale(${1 + level * maxScale})`;
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

    function playIntro() {
        if (!assets.video) return Promise.resolve();

        return new Promise(resolve => {
            const done = () => {
                video.onended = video.onerror = null;
                resolve();
            };

            video.onended = done;
            video.onerror = done;
            video.src = assets.video;
            video.muted = muted;
            video.play().then(() => video.classList.add("visible")).catch(done);
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
        bgm.muted = muted;
        bgm.src = tracks[index];

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
        video.classList.remove("visible");
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
