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


/* ==================================================
   GENERAL UTILITIES
================================================== */

function wait(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}


/* ==================================================
   FILE CHECKING
================================================== */

/*
 * We intentionally do NOT let a missing file
 * break the site.
 */
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


/* ==================================================
   MUSIC DISCOVERY
================================================== */

async function findMusicTracks() {

    const results = [];

    /*
     * Check all possible music files at the same time.
     *
     * Missing files are simply ignored.
     */
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


    /*
     * Sort numerically.
     */
    results.sort(
        (a, b) => a.number - b.number
    );


    musicTracks = results;


    console.log(
        "Music found:",
        musicTracks.map(track => track.filename)
    );
}


/* ==================================================
   PRELOADING
================================================== */

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


/*
 * Preload the two loading images and their sounds.
 *
 * This does NOT prevent the website from continuing
 * if something is missing.
 */
async function preloadIntroAssets() {

    await Promise.all([

        preloadImage("loading1.png"),

        preloadImage("loading2.png"),

        preloadAudio("loading1.mp3"),

        preloadAudio("loading2.mp3")

    ]);

}


/* ==================================================
   VIDEO
================================================== */

async function playIntroVideo() {

    /*
     * Show the video.
     */
    video.classList.add("visible");

    /*
     * Keep the video muted initially.
     *
     * This is important because browsers generally
     * allow muted autoplay but can block autoplay
     * with sound.
     */
    video.muted = muted;


    /*
     * Attempt playback.
     */
    try {

        await video.play();

    } catch (error) {

        console.warn(
            "Video autoplay was blocked.",
            error
        );

        /*
         * Don't freeze the website.
         */
        await wait(2000);

        video.classList.remove("visible");

        return;
    }


    /*
     * Wait until the video finishes.
     */
    await new Promise(resolve => {

        video.addEventListener(
            "ended",
            resolve,
            { once: true }
        );

    });


    /*
     * Fade the video out.
     */
    video.classList.remove("visible");

    await wait(BETWEEN_ELEMENTS);
}


/* ==================================================
   LOADING IMAGE + SOUND
================================================== */

async function playLoadingElement(number) {

    const imageFilename =
        `loading${number}.png`;

    const audioFilename =
        `loading${number}.mp3`;


    /*
     * Make sure the image is actually present.
     */
    const imageAvailable =
        await fileExists(imageFilename);


    /*
     * If the image doesn't exist, skip it.
     */
    if (!imageAvailable) {

        console.warn(
            `${imageFilename} not found. Skipping.`
        );

        return;
    }


    /*
     * Display the image.
     */
    loadingImage.src = imageFilename;

    loadingImage.classList.add("visible");


    /*
     * Check whether the audio exists.
     */
    const audioAvailable =
        await fileExists(audioFilename);


    /*
     * If there is no audio, simply keep the image
     * on screen for a few seconds.
     */
    if (!audioAvailable) {

        await wait(FALLBACK_IMAGE_TIME);

        loadingImage.classList.remove("visible");

        await wait(BETWEEN_ELEMENTS);

        return;
    }


    /*
     * Create the sound.
     */
    const sound =
        new Audio(audioFilename);

    sound.preload = "auto";
    sound.muted = muted;


    /*
     * We use a Promise with BOTH ended and error.
     *
     * This is important.
     *
     * If the audio fails, the sequence still continues.
     */
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


        /*
         * Safety timeout.
         *
         * Even if a browser behaves strangely,
         * the intro cannot get stuck forever.
         */
        const safetyTimer =
            setTimeout(() => {

                sound.pause();

                finish();

            }, 15000);


        sound.play().catch(() => {

            /*
             * Autoplay blocked.
             *
             * Don't freeze the intro.
             */
            clearTimeout(safetyTimer);

            finish();

        });

    });


    /*
     * Stop showing the image.
     */
    loadingImage.classList.remove("visible");

    await wait(BETWEEN_ELEMENTS);
}


/* ==================================================
   FINAL MESSAGE
================================================== */

async function showFinalMessage() {

    /*
     * Fade the loading layer away.
     */
    loadingScreen.classList.add("hidden");

    await wait(1200);


    /*
     * Fade in the text.
     */
    messageScreen.classList.add("visible");

    /*
     * Let the message sit there.
     */
    await wait(2500);
}


/* ==================================================
   BACKGROUND MUSIC
================================================== */

function playCurrentMusic() {

    /*
     * No music?
     *
     * That's completely valid.
     */
    if (musicTracks.length === 0) {

        console.log(
            "No background music found."
        );

        return;
    }


    /*
     * Stop previous track.
     */
    if (backgroundAudio) {

        backgroundAudio.pause();

        backgroundAudio.currentTime = 0;
    }


    /*
     * Create new track.
     */
    backgroundAudio =
        new Audio(
            musicTracks[currentMusicIndex].filename
        );


    backgroundAudio.preload = "auto";
    backgroundAudio.volume = 1;
    backgroundAudio.muted = muted;


    /*
     * When the track ends, advance to the
     * next available track.
     */
    backgroundAudio.addEventListener(
        "ended",
        () => {

            currentMusicIndex++;

            /*
             * Loop back to the beginning.
             */
            if (
                currentMusicIndex >=
                musicTracks.length
            ) {

                currentMusicIndex = 0;
            }


            playCurrentMusic();

        }
    );


    /*
     * Attempt playback.
     */
    backgroundAudio.play().catch(() => {

        console.warn(
            "Background music autoplay was blocked."
        );

    });

}


/* ==================================================
   AUDIO BUTTON
================================================== */

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


        /*
         * Background music.
         */
        if (backgroundAudio) {

            backgroundAudio.muted =
                muted;


            /*
             * Clicking the button counts as a
             * user interaction, so try playback.
             */
            if (!muted) {

                backgroundAudio
                    .play()
                    .catch(() => {});

            }

        }


        /*
         * Intro video.
         */
        video.muted = muted;

    }
);


/* ==================================================
   MAIN SEQUENCE
================================================== */

async function startSite() {

    console.log(
        "Starting site..."
    );


    /*
     * Begin looking for music immediately.
     *
     * This happens while the intro is loading.
     */
    const musicSearch =
        findMusicTracks();


    /*
     * Preload intro assets.
     *
     * Missing files do not stop anything.
     */
    await preloadIntroAssets();


    /*
     * ----------------------------------------------
     * 1. VIDEO
     * ----------------------------------------------
     */

    await playIntroVideo();


    /*
     * ----------------------------------------------
     * 2. LOADING IMAGE 1
     * ----------------------------------------------
     */

    await playLoadingElement(1);


    /*
     * ----------------------------------------------
     * 3. LOADING IMAGE 2
     * ----------------------------------------------
     */

    await playLoadingElement(2);


    /*
     * Make sure music discovery is finished.
     */
    await musicSearch;


    /*
     * ----------------------------------------------
     * 4. FINAL MESSAGE
     * ----------------------------------------------
     */

    await showFinalMessage();


    /*
     * ----------------------------------------------
     * 5. BACKGROUND MUSIC
     * ----------------------------------------------
     */

    playCurrentMusic();


    console.log(
        "Site ready."
    );
}


/* ==================================================
   INITIALIZATION
================================================== */

updateAudioButton();

startSite();
