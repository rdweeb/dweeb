if (window.top !== window.self) {
  try { window.top.location.href = window.self.location.href; }
  catch (e) { document.documentElement.innerHTML = ''; }
}

window.__miss = [];
window.__err = {};
addEventListener('error', function (e) {
  if (!e.filename || !e.message) return;
  var f = e.filename.replace(/\?.*$/, '').replace(/^.*\/(js\/[^\/]+)$/, '$1');
  if (!window.__err[f]) window.__err[f] = e.message + ' (line ' + e.lineno + ')';
});
addEventListener('error', function (e) {
  var t = e.target;
  if (!t || t.tagName !== 'SCRIPT') return;
  var src = (t.getAttribute('src') || '').replace(/\?.*$/, '');
  if (/^js\/[\w.-]+\.js$/.test(src)) window.__miss.push(src);
}, true);

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
}

