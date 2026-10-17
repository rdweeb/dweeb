(function () {
  var DW = window.DW, C = DW.counter;
  var out = document.getElementById('views');

  function short(n) {
    if (n < 10000) return n.toLocaleString('en');
    return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  }
  function show(n) {
    var num = parseInt(String(n).replace(/\D/g, ''), 10) || 0, t0 = performance.now();
    (function f(t) {
      var k = Math.min(1, (t - t0) / 900);
      out.textContent = short(Math.round(num * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }

  out.textContent = '0';
  if (!C || !C.code || !/^[a-z0-9-]+$/i.test(C.code)) return;

  var base = 'https://' + C.code + '.goatcounter.com';

  var skip = false;
  try {
    if (/[?&]me=1/.test(location.search)) localStorage.setItem(C.skipKey, '1');
    if (/[?&]me=0/.test(location.search)) localStorage.removeItem(C.skipKey);
    skip = !!localStorage.getItem(C.skipKey);
  } catch (e) {}

  if (!skip) {
    new Image().src = base + '/count?p=' + encodeURIComponent('/') + '&t=' + encodeURIComponent(document.title) + '&rnd=' + Date.now();
  }

  fetch(base + '/counter/TOTAL.json', { credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : { count: '0' }; })
    .then(function (j) { show(j.count); })
    .catch(function () {});
})();

