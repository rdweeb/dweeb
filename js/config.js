window.DW = window.DW || {};
var DW = window.DW;

DW.siteName = 'DWEEB RECORDS';

DW.low = matchMedia('(max-width: 700px), (pointer: coarse)').matches;
if (DW.low) document.documentElement.classList.add('low');

DW.respectReducedMotion = false;

DW.counter = { code: 'rdweeb', skipKey: 'dweeb-skip' };

DW.trophyCfg = { sfx: 'audio/trophy.mp3', volume: 0.8 };

DW.eyesPet = { after: 15, chance: 0.04 };

DW.seasons = { on: true };

DW.icons = { games: 'icons/games.png', trophies: '', changelog: '', settings: '' };

DW.eggs = { birthday: { m: 7, d: 1 } };;

DW.menu = [
  { id: 'identity', subs: { bio: '', manifesto: '', persona: '' } },
  { id: 'projects', subs: { portfolio: '', archive: '', stack: '' } },
  { id: 'gallery',  subs: { art: '', audio: '', clips: '' } },
  { id: 'writing',  subs: { essays: '', notes: '' } },
  { id: 'media',    subs: { library: '', games: '', reviews: '' } },
  { id: 'curation', subs: { favorites: '', playlists: '', inspirations: '' } },
  { id: 'ideas',    subs: { concepts: '', wishlists: '' } },
  { id: 'mindset',  subs: { opinions: '', lore: '' } },
  { id: 'contact',  subs: { 'reach-out': '', faq: '' } },
  { id: 'locked', label: 'NEXT CATEGORY FINNA BE CRAZY #GATEKEEPING', subs: {} }
];

DW.intro = { src: 'video/intro.mp4', gate: true, skip: true };

DW.playlist = {
  'music1.mp3': {
    title: 'JAMS!', artist: 'ISSBROKIE', album: 'Single / 2024',
    lyrics: [
      "[0:09] Oh yeah, I got the beats and the jams... wait..",
      "[0:14] I swear ISSBROKIE sings here...",
      "[0:18] Maybe its an extended version",
      "[0:40] Nope. Don't think its extended."
    ]
  },
  'music2.mp3': { title: 'DANCE', artist: 'RomancePlanet', album: 'Single / 2024' },
  'music3.mp3': {
    title: 'Plug Me In', artist: 'Lil Soda Boi', album: 'Eco / 2018',
    lyrics: [
      "[0:13] I wanna be a 3D ghost in your dream...",
      "[0:16] The smell of burning flesh and sweat and chlorine..",
      "[0:20] I feel like heavy eyes and beep and smokescreens",
      "[0:23] I feel like telling lies and love and morphine",
      "[0:27] Hell yeah I love Lil Soda Boi!"
    ]
  },
  'music4.mp3': { title: 'tbh i dont like being social', artist: 'luvlxckdown', album: 'Single / 2020' },
  'music5.mp3': { title: 'Bloody Daisies', artist: 'Yung Kage, Yumi, Soft...', album: 'Single / 2023' },
  'music6.mp3': {
    title: 'just sayin (づ￣ ³￣)づ', artist: 'Deko, RJ Pasin', album: 'Nu Genesis / 2023',
    lyrics: [
      "[0:21] Gas bacon? What?"
    ]
  },
  'music7.mp3': { title: 'driving with my eyes closed', artist: 'rouri404, Vaeo', album: 'GORE / 2022' },
  'music8.mp3': {
    title: 'Stupid (Can’t run from the urge)', artist: 'underscores', album: 'Wallsocket (Directors Cut) / 2024',
    lyrics: [
      "[0:14] Stupid, stupid, stupid, girl just",
      "[0:17] traveled 'cross the country,",
      "[0:18] Just to do exactly what she does at home, uh",
      "[0:22] Stupid, stupid, stupid, girl",
      "[0:23] is tweaking at the party,"
    ]
  },
  'music9.mp3': { title: 'Plastic You', artist: 'Outdate Techno', album: 'Single / 2026' }
};
DW.defaultArtist = 'Unknown Artist';

DW.splash = {
  on: true,
  email: '',
  boss: 'that one guy',
  lines: [
    'Did you know?',
    'Woah look i can speak mom!',
    'Eat the frog. Now.',
    'HELLO <angry>WORLD',
    'Hello <shy>world... <wait>sorry',
    'I have <sad>never<n> seen the sun <sleepy>zzz',
    'Look at <rich>my gold<n> and <love>my heart',
    'This is <spooky>a very serious<n> website'
  ],
  scolds: [
    'AY! LANGUAGE BUDDY!',
    'I saw what you typed.',
    'Stop swearing or you have to eat your veggies'
  ],
  every: [9, 18],
  singChance: 0.25,
  mailChance: 0.08
};
