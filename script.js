const video = document.getElementById("intro-video");
const loadingImage = document.getElementById("loading-image");
const loadingScreen = document.getElementById("loading-screen");
const messageScreen = document.getElementById("message-screen");

const audioToggle = document.getElementById("audio-toggle");
const audioIcon = document.getElementById("audio-icon");

const MUSIC_SEARCH_LIMIT = 100;

const FALLBACK_IMAGE_TIME = 3000;

const BETWEEN_ELEMENTS = 500;

let muted = false;

let backgroundAudio = null;

let musicTracks = [];

let currentMusicIndex = 0;

function wait(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

async function fileExists(filename) {

    try {

        const response = await fetch(
            filename,
            {
                method: "HEAD",
                cache: "no-store"
            }
        );

        return response.ok;

    } catch {

        return false;
    }
}

async function findMusicTracks() {

    const results = [];

    const checks = [];

    for (
        let number = 1;
        number <= MUSIC_SEARCH_LIMIT;
        number++
    ) {

        const filename = `music${number}.mp3`;

        checks.push(

            fileExists(filename).then(exists => {

                if (exists) {

                    results.push({
                        number: number,
                        filename: filename
                    });

                }

            })

        );
    }


    await Promise.all(checks);

    results.sort(
        (a, b) => a.number - b.number
    );


    musicTracks = results;


    console.log(
        "Music found:",
        musicTracks.map(track => track.filename)
    );
}

function preloadImage(filename) {

    return new Promise(resolve => {

        const image = new Image();

        image.onload = () => {
            resolve(true);
        };

        image.onerror = () => {
            console.warn(
                `Could not load ${filename}`
            );

            resolve(false);
        };

        image.src = filename;

    });
}


function preloadAudio(filename) {

    return new Promise(resolve => {

        const audio = new Audio();

        audio.preload = "auto";

        audio.addEventListener(
            "canplaythrough",
            () => resolve(true),
            { once: true }
        );

        audio.addEventListener(
            "error",
            () => resolve(false),
            { once: true }
        );

        audio.src = filename;

        audio.load();

    });
}

async function preloadIntroAssets() {

    await Promise.all([

        preloadImage("loading1.png"),

        preloadImage("loading2.png"),

        preloadAudio("loading1.mp3"),

        preloadAudio("loading2.mp3")

    ]);

}

async function playIntroVideo() {

    video.classList.add("visible");

    video.muted = muted;

    try {

        await video.play();

    } catch (error) {

        console.warn(
            "Video autoplay was blocked.",
            error
        );

        await wait(2000);

        video.classList.remove("visible");

        return;
    }

    await new Promise(resolve => {

        video.addEventListener(
            "ended",
            resolve,
            { once: true }
        );

    });

    video.classList.remove("visible");

    await wait(BETWEEN_ELEMENTS);
}

async function playLoadingElement(number) {

    const imageFilename =
        `loading${number}.png`;

    const audioFilename =
        `loading${number}.mp3`;

    const imageAvailable =
        await fileExists(imageFilename);

    if (!imageAvailable) {

        console.warn(
            `${imageFilename} not found. Skipping.`
        );

        return;
    }

    loadingImage.src = imageFilename;

    loadingImage.classList.add("visible");

    const audioAvailable =
        await fileExists(audioFilename);

    if (!audioAvailable) {

        await wait(FALLBACK_IMAGE_TIME);

        loadingImage.classList.remove("visible");

        await wait(BETWEEN_ELEMENTS);

        return;
    }

    const sound =
        new Audio(audioFilename);

    sound.preload = "auto";
    sound.muted = muted;

    await new Promise(resolve => {

        let finished = false;


        function finish() {

            if (finished) {
                return;
            }

            finished = true;

            resolve();
        }


        sound.addEventListener(
            "ended",
            finish,
            { once: true }
        );


        sound.addEventListener(
            "error",
            finish,
            { once: true }
        );


        const safetyTimer =
            setTimeout(() => {

                sound.pause();

                finish();

            }, 15000);


        sound.play().catch(() => {

            clearTimeout(safetyTimer);

            finish();

        });

    });

    loadingImage.classList.remove("visible");

    await wait(BETWEEN_ELEMENTS);
}

async function showFinalMessage() {

    loadingScreen.classList.add("hidden");

    await wait(1200);

    messageScreen.classList.add("visible");

    await wait(2500);
}

function playCurrentMusic() {

    if (musicTracks.length === 0) {

        console.log(
            "No background music found."
        );

        return;
    }

    if (backgroundAudio) {

        backgroundAudio.pause();

        backgroundAudio.currentTime = 0;
    }

    backgroundAudio =
        new Audio(
            musicTracks[currentMusicIndex].filename
        );


    backgroundAudio.preload = "auto";
    backgroundAudio.volume = 1;
    backgroundAudio.muted = muted;

    backgroundAudio.addEventListener(
        "ended",
        () => {

            currentMusicIndex++;

            if (
                currentMusicIndex >=
                musicTracks.length
            ) {

                currentMusicIndex = 0;
            }


            playCurrentMusic();

        }
    );

    backgroundAudio.play().catch(() => {

        console.warn(
            "Background music autoplay was blocked."
        );

    });

}

function updateAudioButton() {

    if (muted) {

        audioIcon.src = "audio1.png";

    } else {

        audioIcon.src = "audio.png";

    }
}


audioToggle.addEventListener(
    "click",
    () => {

        muted = !muted;

        updateAudioButton();

        if (backgroundAudio) {

            backgroundAudio.muted =
                muted;

            if (!muted) {

                backgroundAudio
                    .play()
                    .catch(() => {});

            }

        }

        video.muted = muted;

    }
);

async function startSite() {

    console.log(
        "Starting site..."
    );

    const musicSearch =
        findMusicTracks();

    await preloadIntroAssets();

    await playIntroVideo();

    await playLoadingElement(1);

    await playLoadingElement(2);

    await musicSearch;

    await showFinalMessage();

    playCurrentMusic();


    console.log(
        "Site ready."
    );
}

updateAudioButton();

startSite();
