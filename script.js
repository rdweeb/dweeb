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
        steps: [
            { image: "loading1.png", audio: "loading1.mp3" },
            { image: "loading2.png", audio: "loading2.mp3" }
        ],
        musicFile: n => `music${n}.mp3`,
        musicMax: 50,
        imageOnlyMs: 3000,
        gapMs: 500,
        imageFadeMs: 700,
        screenFadeMs: 1200
    };

    const SILENCE =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

    const $ = id => document.getElementById(id);

    const video = $("intro-video");
    const loadingImage = $("loading-image");
    const loadingScreen = $("loading-screen");
    const messageScreen = $("message-screen");
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

    const assets = {
        video: null,
        steps: [],
        tracks: []
    };

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

    function createProgress(jobs) {
        const state = jobs.map(() => 0);
        const weights = jobs.map(job => job.weight);
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        const update = () => {
            const done = state.reduce((sum, v, i) => sum + v * weights[i], 0);
            const fraction = totalWeight ? done / totalWeight : 1;
            progressBar.style.transform = `scaleX(${fraction})`;
            enterButton.textContent = `Loading ${Math.floor(fraction * 100)}%`;
        };

        return {
            report: index => value => {
                state[index] = value;
                update();
            }
        };
    }

    async function preload() {
        const musicFiles = await findMusic();

        const jobs = [
            { key: "video", url: CONFIG.video, weight: 6 }
        ];

        CONFIG.steps.forEach((step, i) => {
            jobs.push({ key: `image${i}`, url: step.image, weight: 1 });
            jobs.push({ key: `audio${i}`, url: step.audio, weight: 2 });
        });

        if (musicFiles.length) {
            jobs.push({ key: "music", url: musicFiles[0], weight: 2 });
        }

        const progress = createProgress(jobs);

        const results = await Promise.all(
            jobs.map(async (job, i) => {
                const result = await download(job.url, progress.report(i));
                progress.report(i)(1);
                return [job.key, result];
            })
        );

        const byKey = Object.fromEntries(results);

        assets.video = byKey.video;
        assets.steps = CONFIG.steps.map((_, i) => ({
            image: byKey[`image${i}`],
            audio: byKey[`audio${i}`]
        }));
        assets.tracks = musicFiles.map((file, i) =>
            i === 0 && byKey.music ? byKey.music : file
        );
    }

    function setMuted(value) {
        muted = value;
        video.muted = voice.muted = bgm.muted = muted;

        audioIcon.src = muted ? "audio1.png" : "audio.png";
        audioToggle.setAttribute("aria-pressed", String(muted));
        audioToggle.setAttribute("aria-label", muted ? "Unmute audio" : "Mute audio");
    }

    function unlockAudio() {
        for (const el of [voice, bgm]) {
            el.src = SILENCE;
            el.play().then(() => el.pause()).catch(() => {});
        }
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

    async function playIntroVideo() {
        if (!assets.video) return;

        video.src = assets.video;
        video.muted = muted;

        const started = video.play();

        try {
            await started;
        } catch {
            return;
        }

        video.classList.add("visible");

        await new Promise(resolve => {
            video.onended = video.onerror = () => {
                video.onended = video.onerror = null;
                resolve();
            };
        });
    }

    async function playStep(step) {
        if (!step.image) return;

        loadingImage.src = step.image;
        try {
            await loadingImage.decode();
        } catch {
            return;
        }

        loadingImage.classList.add("visible");

        if (step.audio) {
            await playToEnd(voice, step.audio);
        } else {
            await wait(CONFIG.imageOnlyMs);
        }

        loadingImage.classList.remove("visible");
        await wait(CONFIG.imageFadeMs + CONFIG.gapMs);
    }

    function playMusic(index = 0, failures = 0) {
        const tracks = assets.tracks;
        if (!tracks.length || failures >= tracks.length) return;

        musicStarted = true;
        bgm.loop = tracks.length === 1;
        bgm.muted = muted;
        bgm.src = tracks[index];

        const next = () => playMusic((index + 1) % tracks.length, 0);
        bgm.onended = next;
        bgm.onerror = () => playMusic((index + 1) % tracks.length, failures + 1);

        bgm.play().catch(() => {});
    }

    async function run() {
        unlockAudio();
        const intro = playIntroVideo();
        gate.classList.add("leaving");

        await intro;
        video.classList.remove("visible");
        await wait(CONFIG.gapMs);

        for (const step of assets.steps) {
            await playStep(step);
        }

        loadingScreen.classList.add("hidden");
        await wait(CONFIG.screenFadeMs);

        document.title = "Under construction";
        messageScreen.classList.add("visible");
        playMusic();
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
