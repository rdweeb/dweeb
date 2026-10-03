const video = document.getElementById("intro-video");
const loadingImage = document.getElementById("loading-image");
const loadingScreen = document.getElementById("loading-screen");
const messageScreen = document.getElementById("message-screen");

const audioToggle = document.getElementById("audio-toggle");
const audioIcon = document.getElementById("audio-icon");

let muted = false;
let currentAudio = null;
let currentTrack = 0;

const audioFiles = [];

function wait(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

async function fileExists(filename) {
    try {
        const response = await fetch(filename, {
            method: "HEAD",
            cache: "no-store"
        });

        return response.ok;

    } catch {
        return false;
    }
}

async function findMusicFiles() {

    const checks = [];

    for (let number = 1; number <= 100; number++) {

        const filename = `music${number}.mp3`;

        checks.push(
            fileExists(filename).then(exists => {
                if (exists) {
                    audioFiles.push({
                        number: number,
                        filename: filename
                    });
                }
            })
        );
    }

    await Promise.all(checks);

    audioFiles.sort((a, b) => a.number - b.number);

    console.log(
        "Music files found:",
        audioFiles.map(track => track.filename)
    );
}

function playAudio(filename) {

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(filename);

    currentAudio.preload = "auto";
    currentAudio.loop = false;
    currentAudio.volume = 1;
    currentAudio.muted = muted;

    currentAudio.addEventListener("ended", playNextMusic);

    currentAudio.play().catch(() => {

    });
}

function playNextMusic() {

    if (audioFiles.length === 0) {
        return;
    }
    currentTrack++;

    if (currentTrack >= audioFiles.length) {
        currentTrack = 0;
    }
    playAudio(audioFiles[currentTrack].filename);
}

function startMusic() {

    if (audioFiles.length === 0) {
        console.log("No music files found. Continuing without music.");
        return;
    }
    currentTrack = 0;
    playAudio(audioFiles[currentTrack].filename);
}

async function showLoadingImage(imageNumber) {
    return new Promise(resolve => {
        const imageName = `loading${imageNumber}.png`;
        const audioName = `loading${imageNumber}.mp3`;
        loadingImage.src = imageName;
        loadingImage.onload = () => {
            loadingImage.classList.add("visible");
            const sound = new Audio(audioName);
            sound.muted = muted;
            sound.volume = 1;
            sound.play().catch(() => {});
            sound.addEventListener("ended", async () => {
                loadingImage.classList.remove("visible");
                await wait(700);
                resolve();
            }, {
                once: true
            });
        };

        loadingImage.onerror = async () => {
            console.warn(
                `${imageName} was not found. Skipping it.`
            );
            await wait(300);
            resolve();
        };

    });
}

async function playIntroVideo() {

    return new Promise(resolve => {

        video.classList.add("visible");

        video.muted = muted;

        video.play().catch(error => {

            console.warn(
                "Video autoplay was blocked:",
                error
            );

            setTimeout(resolve, 1000);
        });

        video.addEventListener("ended", async () => {

            video.classList.remove("visible");

            await wait(700);

            resolve();

        }, {
            once: true
        });

    });
}

async function finishIntro() {

    loadingScreen.classList.add("hidden");

    await wait(1200);

    messageScreen.classList.add("visible");

    await wait(2500);

    startMusic();
}

function updateAudioIcon() {

    if (muted) {
        audioIcon.src = "audio1.png";
    } else {
        audioIcon.src = "audio.png";
    }
}
audioToggle.addEventListener("click", () => {

    muted = !muted;

    updateAudioIcon();

    if (currentAudio) {
        currentAudio.muted = muted;

        if (!muted) {
            currentAudio.play().catch(() => {});
        }
    }

    video.muted = muted;
});

async function startSite() {

    const musicSearch = findMusicFiles();

    await playIntroVideo();

    await showLoadingImage(1);

    await showLoadingImage(2);

    await musicSearch;

    await finishIntro();
}

updateAudioIcon();

startSite();
