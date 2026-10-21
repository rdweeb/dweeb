// main customization

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

DW.eggs = { birthday: { m: 7, d: 1 } };

DW.links = {
  contact: 'https://rdweeb.github.io/contact/',
  discord: '',
  youtube: '',
  music: ''
};

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
  'music9.mp3': { title: 'Plastic You', artist: 'Outdate Techno', album: 'Single / 2026' },
  'music10.mp3': { title: 'Miss The Rage', artist: 'Trippie Redd, Playboi Carti', album: 'Trip At Knight / 2018' },
  'music11.mp3': { title: 'In Life Im in Love', artist: 'Reserv', album: 'In Life Im in Love / 2023' },
  'music12.mp3': { title: 'serialkilled', artist: 'Osquinn', album: 'Single / 2019' },
  'music13.mp3': { 
    title: 'love urself', artist: 'Kurtains', album: 'the songs i sing at night / 2022',
    lyrics: [
      "[0:01] Listen up, bro",
      "[0:02] Like listen, listen (what?)",
      "[0:04] <angry>Fuck off",
      "[0:10] biddle-di-biddle-di-biddle-di.. I can sing guitar, impressive.",
      "[0:18] Right now, I'm looking through my photos in my old phone",
      "[0:22] They're pretty silly, so I deleted every one",
      "[0:25] I just don't wanna see them, I just don't wanna know",
      "[0:29] Because of every other picture, I just think about",
      "[0:33] How could you say that to my face, knowing my reaction?",
      "[0:40] How could you say that to my face, knowing my reaction?",
      "[0:47] (Yeah, uh, uh)",
      "[0:49] Now I'm walking 'round, and I've been feeling like the G.O.A.T., uh",
      "[0:52] You be talking shit because you'll never really know, uh",
      "[0:55] How it really feel like, got the money and the clothes, yeah",
      "[0:59] I can do whatever, on the high and on the low, yeah",
      "[1:02] Now I'm walking 'round, and I've been feeling like the G.O.A.T., uh",
      "[1:06] You be talking shit because you'll never really know, uh",
      "[1:09] How it really feel like, got the money and the clothes, yeah",
      "[1:12] I can do whatever, on the high and on the low, yeah",
      "[1:17] Yeah, uh, uh",
      "[1:18] Oh yeah, yeah, yeah",
      "[1:33] Right now I'm flying back, back to where I was from",
      "[1:36] Don't really wanna go, but it's where I gotta go",
      "[1:40] It's where I feel it caving, where everything is lost",
      "[1:43] Where everything I feel is felt and there's no cover-up",
      "[1:47] How could you say that to my face, knowing my reaction?",
      "[1:54] How could you say that to my face, knowing my reaction?",
      "[2:01] (Yeah, uh, uh)",
      "[2:03] Now I'm walking 'round, and I've been feeling like the G.O.A.T., uh",
      "[2:06] You be talking shit because you'll never really know, uh",
      "[2:10] How it really feel like, got the money and the clothes, yeah",
      "[2:13] I can do whatever, on the high and on the low, yeah",
      "[2:16] Now I'm walking 'round, and I've been feeling like the G.O.A.T., uh",
      "[2:20] You be talking shit because you'll never really know, uh",
      "[2:23] How it really feel like, got the money and the clothes, yeah",
      "[2:27] I can do whatever, on the high and on the low, yeah",
      "[2:30] Don't you just love yourself?",
      "[2:33] Don't you just love yourself?",
      "[2:37] Don't you just love yourself?",
      "[2:40] Don't you just love yourself?",
      "[2:44] OH YEAH!!!"
    ]
  }
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
