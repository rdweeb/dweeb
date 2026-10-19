# Working on DWEEB RECORDS

hi!! this is a map for anyone who wants to understand the site before changing it.

DWEEB RECORDS is a static website. The browser loads `index.html`, `css/style.css`,
and the JavaScript files in the order listed near the bottom of `index.html`. There
is no required build step for normal development.

## Before changing anything

1. Make a copy of the repository or create a Git branch.
2. Test through a local web server rather than relying on `file://`. Some browser
   features behave differently when a page is opened directly.
3. Change one feature at a time.
4. Refresh the page and test the feature you changed, plus nearby features.
5. Check the browser console for errors.

If Python is installed, run `python -m http.server 8000` from this folder and open
`http://localhost:8000`.

## Where things are

| File or folder | What it is for |
| --- | --- |
| `index.html` | Main page markup and the script loading order |
| `css/style.css` | Layout, visual design, animations, and responsive rules |
| `js/config.js` | Main customization point so like identity, menu, playlist, and feature settings |
| `js/settings.js` | User preferences and saving/loading those preferences |
| `js/util.js` | Shared helper functions |
| `js/audio.js` | Audio playback and audio analysis setup |
| `js/visualizer.js` | Music reactive effects |
| `js/tuning.js` | Values controlling how strongly things react to music |
| `js/navigation.js` | Category and subcategory menu |
| `js/player.js` | Music player controls and display |
| `js/games.js` | Shared game setup and helpers |
| `js/games-arcade.js` | Arcade games |
| `js/games-rhythm.js` | Rhythm game |
| `js/store.js` | Local save data |
| `js/trophies.js` | Achievement display and unlock behavior |
| `js/seasons.js` | Calendar based seasonal content |
| `js/seasonfx.js` | Seasonal visual decorations |
| `js/changelog.js` | Changelog window and unread-update indicator |
| `js/eggs.js` | Easter eggs and hidden interactions |
| `js/pet.js` | Visitor/pet interaction |
| `js/emotion.js` | Chatbot emotion behavior |
| `js/splash.js` | Chatbot interface |
| `js/particles.js` | Background particles |
| `js/boot.js` | Intro/loading sequence |
| `js/main.js` | Starts features and handles setup errors |
| `js/counter.js` | Optional visitor-counter display |
| `js/guard.js` | Early page-embedding guard |
| `audio/`, `covers/`, `icons/`, `video/`, `seasons/` | Media and artwork |

## How the JavaScript files communicate

These are regular browser scripts, not ES modules. They share a small namespace
on `window.DW`. A feature registers itself there, for example `DW.audio`, `DW.nav`,
or `DW.games`, so other files can use it without creating another global variable.

The script order in `index.html` matters. A file may expect an earlier file to have
already created part of `DW`. Keep configuration and shared helpers before the
features that use them, and keep `main.js` near the end because it starts the site.

## Making your own copy

Start with `js/config.js` for content meant to be customized. Then replace the
artwork and media with files you have permission to use. Search `index.html` for
the page title, description, social links, and canonical URL. Update `CNAME`,
`robots.txt`, and `sitemap.xml` if you use a different domain.

The code and the media do not all share the same license. Read `LICENSE` and the
README before reusing artwork, audio, video, or branding.

## A safe change routine

1. Find the feature's main file in the table above.
2. Read its configuration and shared helpers before editing.
3. Make the smallest change that solves the problem.
4. Check the browser console.
5. Test with mouse and keyboard, and on a narrow screen when relevant.
6. Check saved settings and trophies if your change touches storage.
7. If navigation, audio, or the intro changes, test a full reload too.

Comments are most useful when they explain why something is done, what another
file expects, or which surprising behavior should not be casually removed. They
do not need to describe every line. Keep personal notes and jokes when they help,
but explain tricky behavior clearly for the next person.

This guide describes the file layout; it does not mean every browser or interaction
has been tested. Test changes in the actual site before publishing them.
