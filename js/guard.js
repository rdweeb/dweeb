// Runs early, before the rest of the page is initialized.

(function(){

// dont let other sites put this page in an iframe cause uhhh
if (window.top !== window.self) {
  try {
    window.top.location.href = window.self.location.href;
  } catch(e) {
    document.documentElement.innerHTML = '';
  }
}

// the boot screen reads these to show what went wrong
window.__miss = [];  // script files that never loaded
window.__err = {};  // first error from each file

// a script crashed
addEventListener('error', function(e){
  if (!e.filename || !e.message) { return; }
  var file = e.filename.replace(/\?.*$/, '');
  file = file.replace(/^.*\/(js\/[^\/]+)$/, '$1');
  if (!window.__err[file]) {
    window.__err[file] = e.message + ' (line ' + e.lineno + ')';
  }
});

// a script file failed to load (404 etc). load errors dont bubble,
// so this one has to listen in capture mode (the true at the end)
addEventListener('error', function(e){
  var t = e.target;
  if (!t || t.tagName !== 'SCRIPT') { return; }
  var src = (t.getAttribute('src') || '').replace(/\?.*$/, '');
  if (/^js\/[\w.-]+\.js$/.test(src)) { window.__miss.push(src); }
}, true);

// offline cache so service workers only run on https or localhost
var secure = location.protocol == 'https:' || location.hostname == 'localhost' || location.hostname == '127.0.0.1';
if ('serviceWorker' in navigator && secure) {
  var registerWorker = function(){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  };
  // if the page already finished loading the load event wont fire again
  if (document.readyState == 'complete') { registerWorker(); }
  else { addEventListener('load', registerWorker); }
}

})();
