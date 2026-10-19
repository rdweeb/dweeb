# DWEEB RECORDS

hi!! this is the source code for [rdweeb.xyz](https://rdweeb.xyz), my little website dedicated to me, it has a music player, some games, a chat bot with feelings, a few of trophies and a few things i am not going to tell you about. you will find them or you will not.

it is a plain static site so that means no build step, no framework, no backend you, yes you can put the files on GitHub Pages and it runs.

## finding your way around the code

the longer developer notes are in [`DEVELOPING.md`](DEVELOPING.md). they explain
which file does what, why script order matters, and how to make changes without
accidentally breaking the player, games, settings or secrets.

the short version: start with `js/config.js` for the stuff you are meant to change,
then read the matching feature file before changing how it works.

## license

the original code and other original material in this project by RDweeb are
licensed under the **Creative Commons Attribution 4.0 International (CC BY 4.0)**.

you can use, copy, remix, modify, redistribute, and use the covered material
commercially, as long as you give appropriate credit, link to the license, and
say if you made changes. please don't imply that RDweeb endorses you or your work.

**Suggested credit:**
`Made by RDweeb (https://rdweeb.xyz/), licensed under CC BY 4.0`

- [Read the license summary](https://creativecommons.org/licenses/by/4.0/)
- [Read the full legal code](https://creativecommons.org/licenses/by/4.0/legalcode)

this license only covers material that I made and have the right to license. Third-party
artwork, music, video, fonts, libraries, and other assets may have separate terms.
check their individual notices before reusing them.

## can i use this for my own site?

yes, honestly please do. if you like how it is put together, take the structure and make it yours.

- a little credit or a link back to rdweeb.xyz would make my day, and is required by the license
- you can see how everything works in the code, i tried to keep the settings in `js/config.js` so you do not have to dig around much but this is my first time coding an actual site, so it might suck

## what is not free to take

the code is yours to borrow. the stuff that makes it *mine* is not:

- **the name and branding.** DWEEB RECORDS, DWEEB//OS and RDweeb are me. please do not use them for your own site, your own project or your own domain, and please do not pretend to be me (unless you really really like my work)
- **the art.** icons, covers, season pictures, videos and sounds are not in the license and are not in this repo for taking. make your own, it is the fun part
- **the music.** every song on the playlist belongs to the artist who made it. i only show them with credit, as a playlist of stuff i like. do not rip them. if you are an artist on there and want your song gone, tell me and I will make it gone, no hard feelings
  
## privacy

this site does not collect anything about you. no accounts, no cookies, no ads. your trophies, scores and settings live in your own browser and go nowhere. the only outside thing is an optional visitor counter (GoatCounter) that just counts visits, and you can turn it off by leaving its code blank in `js/config.js`.

## making your own copy

1. get the files and put them in your own GitHub Pages repo
2. open `js/config.js` and change the menu, the playlist and the chat bot lines to be yours
3. drop in your own icons, covers, audio and videos (the folders are `icons/`, `covers/`, `audio/`, `video/` and `seasons/`)
4. swap the name, description and links in `index.html`, `robots.txt` and `sitemap.xml`, and delete `CNAME` unless you have your own domain
5. write your own `js/changelog.js` and change the trophies in `js/trophies.js`

missing pictures just show up as nothing instead of breaking, so you can start small.

## found a bug?

contact me on discord by using rdweeb, or find more contact info on rdweeb.xyz. be nice to the chat bot, it is trying its best.

