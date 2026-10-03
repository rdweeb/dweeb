javascript
const video = document.getElementById("intro-video");
const loadingImage = document.getElementById("loading-image");
const loadingScreen = document.getElementById("loading-screen");
const messageScreen = document.getElementById("message-screen");
const audioToggle = document.getElementById("audio-toggle");
const audioIcon = document.getElementById("audio-icon");
let muted = false;
let currentAudio = null;
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
    let number = 1;
    while (true) {
        const filename = `music${number}.mp3`;
        const exists = await fileExists(filename);
        if (!exists) {
            break;
        }
        audioFiles.push(filename);
        number++;
    }
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
let currentTrack = 0;
function playNextMusic() {
    if (audioFiles.length === 0) {
        return;
    }
    currentTrack++;
    if (currentTrack >= audioFiles.length) {
        currentTrack = 0;
    }
    playAudio(audioFiles[currentTrack]);
}
function startMusic() {
    if (audioFiles.length === 0) {
        return;
    }
    currentTrack = 0;
    playAudio(audioFiles[currentTrack]);
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
            });
        };
        loadingImage.onerror = () => {
            resolve();
        };
    });
}
async function playIntroVideo() {
    return new Promise(resolve => {
        video.classList.add("visible");
        video.muted = muted;
        video.play().catch(() => {});
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
    }
    video.muted = muted;
});
audioToggle.addEventListener("click", () => {
    if (!muted && currentAudio) {
        currentAudio.play().catch(() => {});
    }
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
