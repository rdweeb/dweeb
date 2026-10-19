// Optional visitor-counter display.

(function(){
var DW = window.DW;
var C = DW.counter;
var out = document.getElementById('views');
if (!out) { return; }

// 12345 -> 12.3k
function shorten(n){
  if (n < 10000) { return n.toLocaleString('en'); }
  var k = n / 1000;
  var txt;
  if (n >= 100000) { txt = k.toFixed(0); }
  else { txt = k.toFixed(1); }
  txt = txt.replace(/\.0$/, '');
  return txt + 'k';
}

// counts up from 0 to the number over about a second
function countUp(n){
  var target = parseInt(String(n).replace(/\D/g, ''), 10) || 0;
  var start = performance.now();

  function step(now){
    var p = (now - start) / 900;
    if (p > 1) { p = 1; }
    var eased = 1 - Math.pow(1 - p, 3);
    out.textContent = shorten(Math.round(target * eased));
    if (p < 1) { requestAnimationFrame(step); }
  }
  step(start);
}

out.textContent = '0';
if (!C || !C.code) { return; }
if (!/^[a-z0-9-]+$/i.test(C.code)) { return; }

var base = 'https://' + C.code + '.goatcounter.com';
var skipKey = C.skipKey || 'dw-skip';
var skip = false;

// stopping my own visits from counting so i can have more swag
try {
  if (/[?&]me=1/.test(location.search)) { localStorage.setItem(skipKey, '1'); }
  if (/[?&]me=0/.test(location.search)) { localStorage.removeItem(skipKey); }
  if (localStorage.getItem(skipKey)) { skip = true; }
} catch(e) {}

if (skip == false) {
  var hit = new Image();
  hit.src = base + '/count?p=' + encodeURIComponent('/') +
    '&t=' + encodeURIComponent(document.title) +
    '&rnd=' + Date.now();
}

var req = fetch(base + '/counter/TOTAL.json', { credentials: 'omit' });
req.then(function(r){
  if (r.ok) { return r.json(); }
  return { count: '0' };
}).then(function(data){
  countUp(data.count);
}).catch(function(){});
})();
