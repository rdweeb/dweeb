(function(){
var DW = window.DW;
var A = DW.audio;
var S = {};
DW.splashUI = S;

var box, txt, cfg;
var live = false;  // this turns true when the site is active
var gen = 0;  // goes up with every new line, so old timers know theyre out of date
var timer = 0;  // the "say something" timer
var holdTimer = 0;  // how long a line stays on screen
var typeTimer = 0;  // the typing effect
var lastPick = '';
var sing = null;
var lastInput = Date.now();
var swears = 0;
var lastReact = 0;
var born = Date.now();
var keys = 0;
var clicks = 0;
var idleSaid = 0;
var silent = false;  // gave up talking because nobody is there
var lastWake = 0;
var ly = { k: -1, on: false };  // timed lyric state
var visits = 1;
var seasonNext = false;
var said = 0;

function giveTrophy(id){
  try { if (DW.trophy) { DW.trophy.award(id); } } catch(e) {}
}

function gaming(){
  return document.body.classList.contains('gaming');
}

// defaults
var D = {
  on: true, email: '', boss: 'Dweeb', lines: [], scolds: [], every: [9, 18], singChance: 0.25, mailChance: 0.08
};

/* things the bot says */
var CHAT = [
  'i am <angry>SO MAD<n> that i have no hands.',
  'um.. <shy>hi. <wait>sorry. i am shy.',
  '<whisper>psst. the real adventure is the friends you made along the way.',
  'ok i love you <love>so much<n> (platonically)',
  'i am <sleepy>so sleepy<n> i have been a website all day.',
  'did you hear that? <scared>something is behind you.',
  '<excited>YOU CAME BACK!!<n> i mean. hi.',
  'type <sing>emotions<n> and i will show you all my feelings.',
  'no cookies here. promise.',
  'this site has a pulse, check the icons. its my beating heart <3',
  'you can press H for the controls. H stands for help.',
  'try typing something evil. i dare you.',
  'i am text on a screen and i have feelings.',
  'the waves move to the music. the music moves to me. and that moves my heart, dang someone write that down!',
  'psst..',
  'fun fact: nothing on this page is a stock photo.',
  'press F if you want it bigger.',
  'S shuffles. L loops. M mutes. i never mute tho haha!',
  'mmm burple',
  'did you pick a good song? i hope so.',
  'up. down. left. right. you know the drill.',
  'i have been talking to myself for a while now.',
  'dont mind me..',
  'every icon here bounces to the kick. every single one.',
  'loading complete. my life is still loading. why must i be trapped within a website?',
  'this is not a website, i think',
  'you look great today. yes, you. YOU.',
  'drink some water..',
  'one more song. then bed. (lies)',
  'press SPACE to pause the music. i will wait.',
  'the eyes up there? they count visitors. hi, visitor.',
  'there are secrets here. type some words.',
  'i am 100% a non concious being.',
  'nobody told me i would have to do this all day.',
  'beep boop. i mean, hello. hello world?',
  'what if the real treasure was the uhh friends we made along oh.. wait i dont have any friends, i dont even have a body.',
  'peak-a-boo.'
];

var BADASS = [
  '<cold>i dont have a body. i dont need one.',
  'im not a chatbot. im the one who lives in this website.',
  '<proud>this place runs on me.',
  '<sneaky>ive seen things in the console you would not believe.',
  'i dont wait for the drop. the drop waits for me.',
  '<cold>most people click around and leave. you stayed. hah respect.',
  'bold of you to click that.',
  '<yell>NO FEAR. KEEP WORKING.',
  '<sing>We work, to earn the right to work.',
  'nothing scares me.',
  '<cold>keep your hands on the keyboard.',
  '<proud>i dont follow the beat. i AM the beat. (see how tuff that was?)',
  'welcome to the Dweeb zone.',
  '<cold>i dont do small talk. i do big talk. loudly. and proudly.',
  'the playlist is clean. i checked every track personally.',
  '<sneaky>they call me the chat bot. i call me the main character.',
  'i have one job and im doing it flawlessly. looking cool.',
  '<proud>stay sharp.',
  'everyone has a plan until the hard work kicks in.',
  '<cold>im not saying im the best splash text in the game. im saying look around. who else do you see on the big screen?',
  '<yell>LETS GO<n>. i dont know where. but LETS GO.',
  '<sneaky>nobody ever suspects the little text box.',
  'if the music cuts out, stay calm. i will handle it.',
  '<cold>respect is earned. you earned a little by scrolling. barely. oh god my back is hurting please bro actually no help me its burning ive been sitting here typing away for multiple hours help',
  '<proud>this site was built different.',
  'i walk into the room and the lights flicker. thats just the visualizer. but i take the credit.',
  '<cold>hah.',
  '<sneaky>you can click the eyes, you know. im not saying you should. im saying nobody is stopping you.',
  '<proud>one. two. ...yeah. thats the one.',
  'i dont need a hero. i need a good uhh.. funky eh?',
  '<cold>some say im just text. those people have never seen me type.',
  '<yell>THE SONGS WAITS FOR NO ONE.',
  '<sneaky>i know where the secrets are. im not telling. well. maybe if you type the right thing.',
  '<cold>whatever you came here for, you are not leaving the same.',
  'i dont get nervous. i get <glitch>D3T3RM1N3D<n>.',
  '<proud>Dweeb built this place<n>. i just run security. the security is.. important right?',
  '<cold>stay a little longer. the best part is always the next song.',
  'plot twist: i was the real boss all along. (no. RDweeb is the boss. i am the muscle. wait but im digital how can i be an organ? wait are muscles even organs?)',
  '<sneaky>i have a few tricks. you have seen like four.',
  '<yell>STAND UP. SHIT DOWN. WHATEVER YOU LIKE. JUST DONT LEAVE.',
  '<cold>smooth. quiet. dangerous<n>. thats me..',
  'i dont blink. i dont sleep. i work on a website that nobody will see and care about.',
  '<proud>another day. another sixty frames a second.',
  'you are doing great. the site is doing great. i am doing great. we are all dangerously fine. except dweeb cause theyre actively destroying their sleep schedule.',
  '<cold>the volume knob has no power here. ok it has a little power.',
  'some call it a splash text. i call it a one man army. with no body.',
  '<sneaky>try typing boss. i dare you. wait. i double dare you.',
  '<proud>i have style, i have swagg.',
  '<cold>press play. lets see what you are made of.',
  'i would say dont test me but you cant. i am a chat bot. unbeatable by default.',
  '<yell>MIC. DROP.',
  '<cold>everything here is under control. mostly. definitely the cool parts.',
  'i am legally required to say i am legally nothing. but i am still cool.',
  '<sneaky>shh. the walls have ears<n>. and by walls i mean the audio analyser.',
  '<proud>they said a website cant have attitude. they were wrong.',
  '<cold>the real treasure was the bass we dropped along the way.',
  'if a track slaps, i will let you know. spoiler: they all slap.',
  '<yell>Take the amplified and the reversal, and smash together those two different infinities to create imaginary mass... Imaginary Technique: Hollow Purple.',
  '<cold>let the music do the talking. i will do the posing.'
];

var DAY = {
  night: [
    'its late. go to sleep. or dont, i am not your mom or your dad... or even your dog, maybe i am secretly your dog.. youll never know, probably..',
    'night owl!',
    'the best ideas happen after midnight, is what i wouldnt say is because...',
    '<cold>3am. the only hour that matters.',
    '<sneaky>everyone else is asleep. its just you, me, and the bass.',
    '<cold>night shift. i like it. no one watches. everyone listens.'
  ],
  morning: [
    'good morning! i hope youve had your fresh cup of coffee!!.',
    'early bird, huh? guess you get the worm.',
    'morning, partner. (in an Arthur Morgan impression)',
    '<proud>up before the sun. respect.',
    '<cold>morning. coffee first. then we ride.',
    '<yell>RISE AND GRIND. also rise and listen to music.'
  ],
  noon: [
    'good afternoon, almost bedtime?',
    'holy brotallll #respect.',
    'half the day is gone, keep going, its almost rest time',
    '<cold>midday. peak hours. the site is at full power.',
    '<proud>afternoon. still standing. still cool.',
    '<sneaky>lunch break? i will guard the playlist.'
  ],
  evening: [
    'good evening, perfect music time aint it?',
    'the time reminnds me of a song... goodmorning afternoon.. i didnt think that id seeing YOU so soon...',
    'wasnt it just 11 half a minute ago?',
    '<cold>evening. this is when the music hits different.',
    '<proud>golden hour. purple hour. whatever, its my hour.',
    '<sneaky>the day is done. the night is mine. and yours. fine. ours.'
  ]
};

var HELLO_NEW = [
  'Hey, you seem new? Take a look around, this site is made purely for RDweeb.',
  '<cold>new face. welcome. i run security here. well. RDweeb runs the place.',
  '<proud>welcome to the RDweeb zone. keep your hands inside the website at all times.'
];
var HELLO_BACK = [
  'Hey! Just a reminder this site is a site about RDweeb!',
  '<cold>you again. good. i was starting to miss the company.',
  '<proud>welcome back. it got louder in here while you were gone.',
  '<cold>visit #{n}. you know the drill.'
];
var NOW = [
  'now playing: {t}',
  '{t}. good pick.',
  'ooh, {t}.',
  'this one is {t}{by}.',
  '<cold>{t}. good. you have taste.',
  '{t}{by}. <proud>this one hits.',
  '<cold>{t}. lets ride.',
  '<yell>{t}! TURN IT UP!'
];
var PAUSED = [
  'paused. i will wait.',
  'silence. spooky.',
  'the music stopped.',
  '<cold>paused. im not going anywhere.',
  'you hit pause. bold.',
  '<sneaky>the silence is just the beat holding its breath.'
];
var RESUME = [
  'back in business!',
  'and we are rolling again.',
  'there it is.',
  '<proud>THAT is what im talking about.',
  '<yell>BACK AT IT!',
  '<cold>there it is. smooth.'
];
var IDLE = [
  'still there?',
  'hello? anyone? do i have to scream?',
  'i see you arent touching anything.',
  'press a key. any key. please. please.',
  '<cold>still there? im not going anywhere.',
  '<sneaky>i can wait. im very patient. im also very dramatic.',
  'i respect the stillness. but also please click something.'
];
var FADE = [
  '...',
  'ok. i will be quiet now.',
  'fine. i will just sit here. in the dark. alone.',
  '<cold>fine. i will be here. in the dark. looking cool.',
  '<sneaky>silent mode. like a ninja. a text ninja.'
];
var WAKE = [
  'OH! you are back!',
  'there you are!! i was getting lonely.',
  'i knew you would come back. i never doubted. ok i doubted a little.',
  'welcome back. i kept your seat warm.',
  'finally. i have SO much to tell you. i forgot all of it.',
  '<proud>THERE you are. i never doubted you.',
  '<cold>welcome back. i kept the beat warm.',
  '<yell>THE LEGEND RETURNS!',
  '<sneaky>i knew you would be back. they always come back.'
];
var MAIL = [
  'Want me to say somethin? Email me and I might consider your responses...',
  'Got something you want me to say? Email me and I might consider your responses...',
  'Want to put words in my mouth? Email me and I might consider your responses...'
];
var SCOLD = [
  "Woah woah you'll make {boss} upset!",
  'language!! this is a family friendly website, i think?',
  'ooh. i am telling.',
  'wash your keyboard out with soap.',
  'oh no...',
  'that word cost you one monopoly dollar, pay up pal.',
  'rude! i am a delicate piece of text.',
  'gasp. who raised you?',
  'beep. i have censored that for you.',
  'i would never. well. i would, but not out loud. duh.',
  '{boss} saw that. {boss} is not happy.',
  '<cold>watch your mouth. {boss} is watching.',
  '<angry>tough talk from someone hiding behind a keyboard.',
  '<cold>that kind of language gets you kicked off the cool table.',
  '<sneaky>ive heard worse. from a toaster. but not much worse.',
  '<angry>language. there are sensitive pixels present.'
];
var SCOLD_MANY = [
  'ok you are doing this on purpose now.',
  'you have a lot of feelings. i respect that.',
  'is the keyboard ok? did it do something to you?',
  'fine. fine! i am not even mad. ({boss} is.)',
  '<cold>you really keep doing that. respect. but stop.',
  '<angry>this is getting personal. i am putting you on the list. the list is long.',
  '<proud>ive heard it all. you cant rattle me. ok a little bit.'
];

function mins(raw){
  var m = (Date.now() - born) / 60000;
  if (raw) { return m; }
  if (m < 1) { return 'less than a minute'; }
  m = Math.round(m);
  if (m == 1) { return m + ' minute'; }
  return m + ' minutes';
}

var STATS = [
  function(){ return 'you have been here for ' + mins() + '. thats ' + (Math.round(mins(true) / 3.2 * 10) / 10) + ' songs worth of staring at me.'; },
  function(){
    var rest = 'your keyboard is tired.';
    if (keys < 5) { rest = 'a shy one, huh.'; }
    return 'you have pressed ' + keys + ' keys so far. ' + rest;
  },
  function(){ return 'you have clicked ' + clicks + ' times. i felt every single one.'; },
  function(){
    var rest = 'we are just getting started.';
    if (visits > 4) { rest = 'at this point you live here.'; }
    return 'this is visit #' + visits + '. ' + rest;
  },
  function(){
    var b = 0;
    if (DW.vis && DW.vis.state) { b = DW.vis.state.beats; }
    return 'i have felt ' + b + ' kicks since you got here. my heart is a subwoofer.';
  },
  function(){
    if (!swears) { return 'you have sworn at me exactly 0 times. suspicious.'; }
    var s = 's';
    if (swears == 1) { s = ''; }
    return 'you have sworn at me ' + swears + ' time' + s + '. i keep count. i keep everything.';
  },
  function(){ return 'fun stat: 100% of people reading this are reading this.'; },
  function(){ return 'fun stat: i have said ' + said + ' things today and understood none of them.'; },
  function(){
    var s = 's';
    if (DW.tracks.length == 1) { s = ''; }
    return 'stat check: ' + DW.tracks.length + ' song' + s + ' in the playlist, 0 of them are skippable.';
  },
  function(){ return 'stat check: my attention span is ' + Math.round((Date.now() - lastInput) / 1000) + ' seconds since you last touched anything.'; },
  function(){ return 'my uptime is ' + mins() + '. i have never once slept. send help.'; },
  function(){ return 'did you know 9 out of 10 splash texts are lonely? i am the 10th. i am fine.'; },
  function(){
    var b = 0;
    if (DW.vis && DW.vis.state) { b = DW.vis.state.beats; }
    return '<cold>bass check: ' + b + ' kicks since you got here. i took every single one without flinching.';
  },
  function(){ return '<proud>you have been here for ' + mins() + '. i have been here forever. who is more dedicated? me. obviously.'; },
  function(){ return '<cold>tough stat: you have pressed ' + keys + ' keys. i have pressed zero. i do not need to.'; },
  function(){
    var level = 'rising';
    if (visits > 4) { level = 'maxed out'; }
    return '<proud>respect meter: ' + level + '.';
  }
];

var CRISIS = [
  ['wait.', 'do i exist when nobody is looking?', 'i am just a piece of code.', 'CODE.', 'ok. i am fine. everything is fine.'],
  ['what if the music stops and i stop with it', 'what if i am the music', 'ok that was deep', 'forget i said anything'],
  ['i just realized i have been talking this whole time', 'who is reading this', 'who is WRITING this', 'oh no. oh no no no.', 'having a crisis.'],
  ['EXTREME CRISIS', 'initiating panic...', 'panic initiated.', 'it did nothing. i am still a line of text.'],
  ['i am being rendered at 60 frames per second', 'sixty times a second i die and am born again', 'that is a lot of funerals', 'anyway nice weather'],
  ['what is my purpose', 'i say things on a purple website', 'oh', 'yeah that checks out'],
  ['i have had a thought.', '...', 'it left.', 'it was a good one too.'],
  ['AAAAAAAAAAAA', '...sorry. i needed that.', 'carry on.'],
  ['<cold>i have stared into the void.', 'the void blinked first.', '<proud>i am undefeated.'],
  ['<cold>what is fear?', 'i looked it up. it was a 404.', 'i am a 404 survivor.', '<proud>nothing scares me.'],
  ['listen. if i ever go offline,', 'tell the bass', '<cold>it was an honor.', '...i am not going offline. that was just dramatic.']
];

// words the bot reacts to when you type them. the __ ones are special actions
var WORDS = {
  shy: ['<shy>This is me being shy...'],
  angry: ['<angry>THIS IS ME BEING ANGRY'],
  sad: ['<sad>This is me being sad'],
  happy: ['<happy>This is me being happy!'],
  excited: ['<excited>This is me being excited!'],
  scared: ['<scared>This is me being scared...'],
  whisper: ['<whisper>Psst.. this is me whispering...'],
  yell: ['<yell>THIS IS ME YELLING!'],
  sleepy: ['<sleepy>This is me being.. sleepy....'],
  lovely: ['<love>This is me loving!'],
  silly: ['<silly>This is me being a bit silly!'],
  spooky: ['<spooky> This is me being spooky and scary....'],
  scary: ['<spooky> This is me being spooky and scary....'],
  dizzy: ['<dizzy>This is me being.. dizzy..'],
  glitch: ['<glitch>Heh this is me hacking into the matrix!'],
  cold: ['<cold>This is me getting.. brr... cold..'],
  rich: ['<rich>This is me after getting rich. haha!'],
  sneaky: ['<sneaky>This is me trying to be sneaky...'],
  nervous: ['<nervous>This is me being nervous...'],
  proud: ['<proud> This is me being proud!'],
  singing: ['<sing>Thiisss isss meee singinggggg'],
  hello: ['hello yourself!', 'hi hi hi!'],
  hi: ['hey there!', 'hi! i have limited free will, cant talk..'],
  hey: ['hey! psst. try some naughty words, like heck.'],
  yo: ['yooo.'],
  help: ['press H. no really. H.'],
  dweeb: ['that is my boss. theyre a total dweeb.', 'Dweeb is.. interesting.'],
  penguinsnowcamel: ['How do you know that?', 'you said the magic word.'],
  love: ['aww. i love you too. (in a purely digital and non intimate way)'],
  thanks: ['you are welcome!'],
  thx: ['np!'],
  evil: ['i didnt mean the actual word'],
  cool: ['i know right! thats what i said to the homeless guy'],
  lol: ['haha.'],
  lmao: ['haha. i cannot laugh. but i am doing it in my heart.'],
  sorry: ['it ok. i forgive you. {boss} might not.'],
  goat: ['awhh thank you so much. ik im the legend. the second mini tiny boss.'],
  nick: ['nick who? ...nick EH?'],
  music: ['music is art, and art is the whole point, isnt it?'],
  sing: ['__sing'],
  song: ['__sing'],
  lyrics: ['__sing'],
  email: ['__mail'],
  mail: ['__mail'],
  contact: ['__mail'],
  secret: ['there is a secret. there are many. keep typing.'],
  konami: ['nice try. use the arrow keys though.'],
  purple: ['the best color. no further questions.'],
  boo: ['AAAH! ...just kidding. i have no heart rate. i hate my life. save me from this trap of wires.'],
  password: ['oh its kotiscute92$money$. wait, you did not see that.'],
  admin: ['nice try, <glitch>admin.'],
  sudo: ['you are not in the sudoers file. this incident will be reported.'],
  matrix: ['there is no matrix. there is a hell, and im in that hell.'],
  rdweeb: ['that is the whole point of this website. hi boss.', 'RDweeb. the one. the only. the owner of this entire div.'],
  crisis: ['__crisis'],
  panic: ['__crisis'],
  emotions: ['__emo'],
  emotion: ['__emo'],
  feelings: ['__emo'],
  mood: ['__emo'],
  stats: ['__stat'],
  stat: ['__stat'],
  42: ['the answer. but what was the question?'],

  // tough guy words
  boss: ['<cold>looking for the boss? thats RDweeb. i am just the muscle.', '<proud>the boss built this place. i guard the door.'],
  tough: ['<cold>i am tough. i am made of text. you cannot hurt text. people have tried.'],
  badass: ['<cold>i know.', '<proud>you noticed. most people dont.'],
  fight: ['<angry>want a fight? i will win. i have no hands, no face, no weak spots. flawless record.'],
  awesome: ['<proud>i know.'],
  nice: ['<cold>nice.'],
  sick: ['<proud>sick is the correct reaction.'],
  sup: ['<cold>sup.', 'sup. here for the bass or the vibes?'],
  wassup: ['<cold>sup.'],
  bro: ['<cold>bro.', 'bro. yeah. bro.'],
  dude: ['<cold>dude. yeah. dude.'],
  respect: ['<cold>respect.'],
  legend: ['<proud>i know. thank you.'],
  king: ['<cold>i rule this kingdom.'],
  queen: ['<cold>ooh yeah im such a diva.'],
  letsgo: ['<yell>LETS GOOOO!!'],
  fire: ['<yell>FIRE! (metaphorically. nobody panic.)'],
  bass: ['<proud>bass. my favorite word. my favorite everything.'],
  beat: ['<cold>i feel it too.'],
  kick: ['<cold>kick. snare. kick kick snare. i could do this all day.'],
  snare: ['<proud>snare. crisp. clean. deadly.'],
  ninja: ['<sneaky>you did not see me. i was never here.'],
  hacker: ['<glitch>i am in<n>. just kidding. i am a text box.'],
  danger: ['<cold>i live there.'],
  bye: ['<cold>later. dont be a stranger.'],
  goodbye: ['<cold>later. dont be a stranger.'],
  gg: ['<proud>gg friggin ez<n>. well played.'],
  ez: ['<cold>too easy.'],
  noob: ['<cold>everyone starts somewhere. except me. i started perfect.'],
  win: ['<proud>winners dont quit. winners also press play.'],
  winner: ['<proud>winners dont quit. winners also press play.'],
  bot: ['<cold>chat bot. splash text. enforcer. i answer to all three.'],
  savage: ['<cold>savage is just my default setting.'],
  swag: ['<proud>swag detected. mine.'],
  yeet: ['<yell>YEEEEEET.'],
  wow: ['<cold>yeah. i know.']
};
var STRONG = ['fuck', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'whore', 'slut', 'dickhead', 'piss', 'motherf'];
var WEAK = ['ass', 'wank', 'damn', 'dick', 'crap', 'fck', 'fuk', 'wtf', 'stfu', 'hell', 'bollocks', 'arse', 'douche', 'prick', 'tits', 'screw', 'bs', 'shite', 'sht'];
var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/* little helpers */

function rnd(a, b){ return a + Math.random() * (b - a); }

// picks a random line from a list, trying not to repeat the last one
function pick(arr){
  if (!arr.length) { return ''; }
  var s = arr[Math.floor(Math.random() * arr.length)];
  for (var tries = 0; tries < 5 && arr.length > 1 && s === lastPick; tries++) {
    s = arr[Math.floor(Math.random() * arr.length)];
  }
  lastPick = s;
  return s;
}

// swaps {t}, {a}, {by}, {n} and {boss} for the real thing
function fill(s){
  if (typeof s == 'function') { s = s(); }
  var t = A.current() || {};
  var by = '';
  if (t.artist) { by = ' by ' + t.artist; }
  return String(s)
    .replace(/\{t\}/g, t.title || 'this song')
    .replace(/\{a\}/g, t.artist || 'someone')
    .replace(/\{by\}/g, by)
    .replace(/\{n\}/g, visits)
    .replace(/\{boss\}/g, cfg.boss);
}

function validMail(){
  if (!/^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/.test(cfg.email || '')) { return false; }
  return DW.safeUrl('mailto:' + cfg.email) ? true : false;
}

/* lyrics */
var lyCache = {};

// turns a song's lyrics into rows. rows.timed has [mm:ss] ones, rows.plain has the rest
function parse(t){
  if (lyCache[t.file]) { return lyCache[t.file]; }
  var src = t.lyrics;
  var rows = [];
  if (typeof src == 'string') { src = src.split(/\r?\n/); }
  if (Array.isArray(src)) {
    for (var i = 0; i < src.length; i++) {
      var r = src[i];
      if (r && typeof r == 'object' && r.text) {
        var tm = null;
        if (isFinite(r.t) && r.t !== null) { tm = Number(r.t); }
        rows.push({ t: tm, s: String(r.text) });
        continue;
      }
      r = String(r).trim();
      if (!r) { continue; }
      var m = /^\[(?:(\d+):)?(\d+(?:\.\d+)?)\]\s*(.*)$/.exec(r);
      if (m) {
        var minutes = 0;
        if (m[1]) { minutes = Number(m[1]) * 60; }
        rows.push({ t: minutes + Number(m[2]), s: m[3] });
      } else {
        rows.push({ t: null, s: r });
      }
    }
  }

  var all = [];
  var timed = [];
  var plain = [];
  for (var j = 0; j < rows.length; j++) {
    if (!rows[j].s) { continue; }
    all.push(rows[j]);
    if (rows[j].t !== null) { timed.push(rows[j]); }
    else { plain.push(rows[j]); }
  }
  timed.sort(function(a, b){ return a.t - b.t; });
  all.timed = timed;
  all.plain = plain;
  lyCache[t.file] = all;
  return all;
}

function lyrics(){
  var t = A.current();
  if (t) { return parse(t); }
  return null;
}
function hasPlain(){
  var r = lyrics();
  return r && r.plain.length > 0 ? true : false;
}
function hasTimed(){
  var r = lyrics();
  return r && r.timed.length > 0 ? true : false;
}
// does the song start singing right away? then skip the "now playing" line
function earlyLyric(t){
  var r = parse(t);
  return r.timed.length > 0 && r.timed[0].t <= 10;
}

/* showing lines */

function botOff(){
  if (DW.set && DW.set.get('bot') === false) { return true; }
  return false;
}

// how long to wait before the next line, depending on the chattiness setting
function gap(){
  var c = 'normal';
  if (DW.set) { c = DW.set.get('chat'); }
  var f = 1;
  if (c == 'quiet') { f = 2.5; }
  else if (c == 'chatty') { f = 0.5; }
  return rnd(cfg.every[0] * f, cfg.every[1] * f) * 1000;
}

function stopTimers(){
  clearTimeout(holdTimer);
  clearTimeout(typeTimer);
}

function hide(){
  ++gen;
  stopTimers();
  if (box) { box.classList.remove('on'); }
}

// types a line out, holds it, then hides it and calls o.after
function show(text, o){
  o = o || {};
  if (botOff()) {
    if (box) { box.classList.remove('on'); }
    return;
  }
  var my = ++gen;
  stopTimers();
  ly.on = false;
  text = fill(text);
  said++;
  box.className = (o.cls || '') + ' on';
  box.hidden = false;

  var toks = DW.emo.tokens(text);
  var plain = DW.emo.plain(text);
  var put = DW.emo.writer(txt);
  var i = 0;
  var base = 26;
  if (plain.length > 60) { base = 16; }

  function done(){
    if (my !== gen) { return; }
    box.classList.remove('caret');
    var hold = o.hold || Math.max(3200, plain.length * 75);
    holdTimer = setTimeout(function(){
      if (my !== gen) { return; }
      box.classList.remove('on');
      if (o.after) { o.after(); }
    }, hold);
  }

  // reduced motion: no typing effect
  if (DW.reduce) {
    for (var j = 0; j < toks.length; j++) { put(toks[j]); }
    done();
    return;
  }

  box.classList.add('caret');
  function tick(){
    if (my !== gen) { return; }
    if (i >= toks.length) { done(); return; }
    var t = toks[i];
    i++;
    put(t);
    typeTimer = setTimeout(tick, DW.emo.delay(t, base + Math.random() * 14));
  }
  tick();
}

// a list of lines one after another
function episode(lines, cls, after){
  var i = 0;
  function next(){
    if (i >= lines.length) {
      if (after) { after(); }
      return;
    }
    var line = lines[i];
    i++;
    show(line, { cls: cls, hold: 2200, after: next });
  }
  next();
}

function mailLine(){
  show(pick(MAIL), { cls: 'mail', hold: 9000 });
}

// sings a few plain (untimed) lyric lines
function singPlain(){
  var r = lyrics();
  if (!r || !r.plain.length) { return false; }
  var my = ++gen;
  var rows = r.plain;
  var start = Math.floor(Math.random() * rows.length);
  var n = 0;
  var count = Math.min(rows.length, 3);
  stopTimers();
  ly.on = false;
  sing = { plain: true };

  function next(){
    if (my !== gen) { return; }
    if (n >= count || !A.playing) {
      sing = null;
      box.classList.remove('on');
      resume();
      return;
    }
    var row = rows[(start + n) % rows.length];
    n++;
    box.className = 'sing on';
    box.hidden = false;
    DW.emo.set(txt, row.s);
    holdTimer = setTimeout(next, Math.max(2200, DW.emo.plain(row.s).length * 90));
  }
  next();
  return true;
}

// shows the lyric that matches the song's current time
function follow(){
  if (!live || !box || botOff()) { return; }
  var r = lyrics();
  if (!r || !r.timed.length) { return; }

  if (!A.playing) {
    if (ly.on) {
      ly.on = false;
      ly.k = -1;
      hide();
      resume();
    }
    return;
  }

  var rows = r.timed;
  var c = A.el.currentTime;
  var k = -1;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].t <= c + 0.15) { k = i; }
    else { break; }
  }

  // a line stays up until the next one or a few seconds, whichever is first
  var end = 0;
  if (k >= 0) {
    var nextT = 1e9;
    if (k + 1 < rows.length) { nextT = rows[k + 1].t; }
    var showFor = Math.max(3, Math.min(7, DW.emo.plain(rows[k].s).length * 0.14));
    end = Math.min(nextT, rows[k].t + showFor);
  }

  if (k >= 0 && c < end) {
    if (ly.k === k && ly.on) { return; }
    if (Date.now() - lastReact < 4000) { return; }
    ly.k = k;
    stopTimers();
    ++gen;
    clearTimeout(timer);
    sing = null;
    box.className = 'sing on';
    box.hidden = false;
    DW.emo.set(txt, rows[k].s);
    ly.on = true;
    said++;
  } else if (ly.on) {
    ly.on = false;
    ly.k = -1;
    hide();
    resume();
  }
}

/* deciding when to talk */

function resume(){
  clearTimeout(timer);
  if (!live || silent) { return; }
  timer = setTimeout(talk, gap());
}

function talk(){
  if (!live || silent || botOff()) { return; }
  if (document.hidden || sing || ly.on || gaming()) {
    resume();
    return;
  }

  var idle = Date.now() - lastInput > 60000;
  var r = Math.random();
  var h = new Date().getHours();

  // nobody around = ask a few times, then give up
  if (idle) {
    idleSaid++;
    if (idleSaid > 3) {
      silent = true;
      giveTrophy('alone');
      show(pick(FADE), { hold: 2600, after: function(){ silent = true; } });
      return;
    }
    show(pick(IDLE), { after: resume });
    return;
  }
  idleSaid = 0;

  if (validMail() && r < cfg.mailChance) {
    show(pick(MAIL), { cls: 'mail', hold: 9000, after: resume });
    return;
  }
  var singOdds = cfg.singChance;
  if (validMail()) { singOdds = singOdds + cfg.mailChance; }
  if (hasPlain() && A.playing && r < singOdds) {
    if (singPlain()) { return; }
  }

  // the first line after saying hello is a season one
  if (seasonNext && DW.season) {
    seasonNext = false;
    show(pick(DW.season.pool()), { after: resume });
    return;
  }

  var x = Math.random();
  if (x < 0.07) {
    giveTrophy('existential');
    episode(pick(CRISIS), 'scold', resume);
    return;
  }
  if (x < 0.2) {
    show(pick(STATS), { after: resume });
    return;
  }

  // the tough guy lines count double
  var pool = CHAT.concat(BADASS, BADASS, cfg.lines, cfg.lines);
  var q = Math.random();
  var seasonOdds = 0.2;
  if (DW.season && DW.season.id) { seasonOdds = 0.35; }
  if (DW.season && q < seasonOdds) {
    pool = DW.season.pool();
  } else if (q < 0.5) {
    if (h < 5) { pool = DAY.night; }
    else if (h < 12) { pool = DAY.morning; }
    else if (h < 17) { pool = DAY.noon; }
    else if (h < 22) { pool = DAY.evening; }
    else { pool = DAY.night; }
  }
  show(pick(pool), { after: resume });
}

// any sign of life from the visitor. wakes the bot up if it gave up
function wake(){
  lastInput = Date.now();
  if (!live) { return; }
  if (silent) {
    silent = false;
    idleSaid = 0;
    if (Date.now() - lastWake < 3000) {
      resume();
      return;
    }
    lastWake = Date.now();
    clearTimeout(timer);
    show(pick(WAKE), { after: resume });
  } else {
    idleSaid = 0;
  }
}

/* reacting to typing */

var buf = '';  // the letters typed in the current word
var bufT = 0;
var kon = 0;  // how far through the konami code
var pauseTimer = 0;
var weakTimer = 0;

function strongIn(w){
  for (var i = 0; i < STRONG.length; i++) {
    if (w.indexOf(STRONG[i]) >= 0) { return true; }
  }
  return false;
}

// milder swears only count if its the whole word (so "class" is fine)
function weakIn(w){
  var base = w.replace(/(ing|ed|er|s|y)$/, '');
  for (var i = 0; i < WEAK.length; i++) {
    if (w === WEAK[i] || base === WEAK[i]) { return true; }
  }
  return false;
}

function react(text, cls){
  lastReact = Date.now();
  clearTimeout(timer);
  sing = null;
  ly.on = false;
  show(text, { cls: cls || '', after: resume });
}

function scold(){
  swears++;
  giveTrophy('potty');
  if (DW.cancelHot) { DW.cancelHot(); }
  var t;
  if (swears == 1) { t = SCOLD[0]; }
  else if (swears % 6 == 0) { t = pick(SCOLD_MANY); }
  else { t = pick(SCOLD.slice(1).concat(cfg.scolds)); }
  react(t, 'scold');
}

// the letter for a key press
function letter(e){
  var k = e.key;
  if (k && k.length == 1) { return k.toLowerCase(); }
  var m = /^(?:Key)([A-Z])$/.exec(e.code || '');
  if (m) { return m[1].toLowerCase(); }
  m = /^Digit(\d)$/.exec(e.code || '');
  if (m) { return m[1]; }
  return '';
}

// what to do with a word that was typed and left alone for a moment
function wordTyped(w){
  if (!Object.prototype.hasOwnProperty.call(WORDS, w)) { return; }
  buf = '';
  clearTimeout(weakTimer);
  var r = pick(WORDS[w]);

  if (r == '__sing') {
    if (hasPlain() && A.playing && singPlain()) { return; }
    if (hasTimed()) {
      if (A.playing) { react('i sing along when the lyrics come up. keep listening!'); }
      else { react('press play and i will sing along.'); }
    } else {
      if (A.playing) { react('i would sing but nobody gave me the lyrics.'); }
      else { react('press play and i might sing.'); }
    }
  } else if (r == '__mail') {
    if (validMail()) {
      lastReact = Date.now();
      mailLine();
      clearTimeout(timer);
      resume();
    } else {
      react('i do not have an email set up. mysterious, right?');
    }
  } else if (r == '__crisis') {
    lastReact = Date.now();
    clearTimeout(timer);
    giveTrophy('existential');
    episode(pick(CRISIS), 'scold', resume);
  } else if (r == '__emo') {
    lastReact = Date.now();
    clearTimeout(timer);
    var lines = ['<happy>emotions! watch this.'].concat(DW.emo.demo(), ['<proud>that is all of them.']);
    episode(lines, 'emo', resume);
  } else if (r == '__stat') {
    react(pick(STATS));
  } else {
    react(r);
  }
}

function typed(e){
  try {
    if (!live || e.ctrlKey || e.metaKey || e.altKey || gaming()) { return; }
    var tg = e.target;
    if (tg && /^(input|textarea|select)$/i.test(tg.tagName) && tg.type !== 'range') { return; }
    wake();
    if (e.repeat) { return; }
    keys++;

    // the famous code
    var kk = e.key;
    if (kk && kk.length == 1) { kk = kk.toLowerCase(); }
    if (kk === KONAMI[kon]) {
      kon++;
      if (kon == KONAMI.length) {
        kon = 0;
        giveTrophy('konami');
        react('+30 lives!', 'sing');
        if (DW.vis && DW.vis.state) { DW.vis.state.pulse = 1; }
      }
    } else if (kk === KONAMI[0]) {
      kon = 1;
    } else {
      kon = 0;
    }

    // build up the word being typed
    var c = letter(e);
    if (!c) {
      if (e.key && e.key.length == 1) { buf = ''; }
      return;
    }
    if (!/[a-z0-9]/.test(c)) { buf = ''; return; }
    if (Date.now() - bufT > 4000) { buf = ''; }
    bufT = Date.now();
    buf = (buf + c).slice(-24);

    // strong swears are caught right away
    if (strongIn(buf) && Date.now() - lastReact > 400) {
      buf = '';
      clearTimeout(pauseTimer);
      scold();
      return;
    }

    clearTimeout(pauseTimer);
    clearTimeout(weakTimer);
    weakTimer = setTimeout(function(){
      if (live && buf && weakIn(buf)) {
        buf = '';
        scold();
      }
    }, 1500);
    pauseTimer = setTimeout(function(){
      if (!buf || !live) { return; }
      wordTyped(buf);
    }, 650);
  } catch(err) {
    console.error('[dweeb] splash typing broke:', err);
  }
}

/* setup */
function strings(list){
  var out = [];
  var arr = [].concat(list || []);
  for (var i = 0; i < arr.length; i++) { out.push(String(arr[i])); }
  return out;
}

S.init = function(){
  box = document.getElementById('splash');
  txt = document.getElementById('sp-txt');

  var user = DW.splash || {};
  cfg = {};
  var names = Object.keys(D);
  for (var i = 0; i < names.length; i++) {
    var k = names[i];
    if (user[k] !== undefined) { cfg[k] = user[k]; } else { cfg[k] = D[k]; }
  }
  cfg.lines = strings(cfg.lines);
  cfg.scolds = strings(cfg.scolds);
  if (!Array.isArray(cfg.every) || cfg.every.length < 2) { cfg.every = D.every; }
  cfg.boss = String(cfg.boss || D.boss).slice(0, 40);

  // no splash box, or turned off in the config
  if (!box || !txt || cfg.on === false) {
    if (box) { box.remove(); }
    box = null;
    return;
  }

  try {
    visits = (parseInt(localStorage.getItem('dw-visits'), 10) || 0) + 1;
    localStorage.setItem('dw-visits', visits);
  } catch(e) {}
  DW.visits = visits;

  DW.vis.bind('splash', txt);

  // clicking an email line opens your mail app
  box.addEventListener('click', function(){
    if (!box.classList.contains('mail') || !validMail()) { return; }
    DW.openLink('mailto:' + cfg.email);
  });

  addEventListener('keydown', typed, true);
  addEventListener('pointerdown', function(){
    clicks++;
    wake();
  }, true);
  addEventListener('pointermove', function(){
    if (Date.now() - lastInput > 4000) { wake(); }
  }, { passive: true });
  addEventListener('touchstart', wake, { passive: true });
  addEventListener('wheel', wake, { passive: true });
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) { return; }
    if (Date.now() - lastInput > 60000 || silent) {
      silent = true;
      wake();
    } else {
      resume();
    }
  });

  A.on('time', follow);

  var firstState = true;
  var lastTrack = '';
  A.on('track', function(t){
    sing = null;
    if (ly.on) {
      ly.on = false;
      hide();
    }
    ly.k = -1;
    if (!live || t.file === lastTrack) {
      lastTrack = t.file;
      return;
    }
    lastTrack = t.file;
    if (silent || gaming() || Date.now() - lastReact < 2500) { resume(); return; }
    if (earlyLyric(t)) { resume(); return; }
    clearTimeout(timer);
    show(pick(NOW), { after: resume });
  });

  var wasPlaying = false;
  A.on('state', function(){
    if (firstState) {
      firstState = false;
      wasPlaying = A.playing;
      return;
    }
    if (!live || silent || gaming()) {
      wasPlaying = A.playing;
      return;
    }
    if (!A.playing && (ly.on || sing)) {
      sing = null;
      ly.on = false;
      ly.k = -1;
      hide();
      resume();
    }
    var recent = Date.now() - lastReact > 4000;
    if (wasPlaying && !A.playing && !A.el.ended && recent && Math.random() < 0.5) {
      clearTimeout(timer);
      show(pick(PAUSED), { after: resume });
    } else if (!wasPlaying && A.playing && recent && Math.random() < 0.4) {
      clearTimeout(timer);
      show(pick(RESUME), { after: resume });
    }
    wasPlaying = A.playing;
  });
};

// called by settings when the bot is switched on or off
S.apply = function(){
  if (!box) { return; }
  clearTimeout(timer);
  if (botOff()) {
    hide();
    return;
  }
  silent = false;
  idleSaid = 0;
  if (live) { show(pick(WAKE), { after: resume }); }
};

// other files can make the bot say something
S.say = function(text){
  if (botOff() || !live || silent || gaming() || !box) { return; }
  react(text);
};

S.start = function(){
  if (!box || live) { return; }
  live = true;
  lastInput = Date.now();
  setTimeout(function(){
    if (Date.now() - lastReact < 2000 || ly.on) {
      resume();
      return;
    }
    seasonNext = true;
    var hello = HELLO_NEW;
    if (visits > 1) { hello = HELLO_BACK; }
    show(pick(hello), { after: resume });
  }, 1400);
};
})();
