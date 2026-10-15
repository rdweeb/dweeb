var BUILD = 1;

self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(

    caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (r.headers.has('range')) return;
  if (u.pathname.slice(-6) === '/sw.js') return;
  e.respondWith(fresh(r));
});

function fresh(r) {
  return fetch(r.url, {
    cache: 'no-cache',
    credentials: 'same-origin',
    redirect: r.mode === 'navigate' ? 'manual' : 'follow'
  }).catch(function () {
    return fetch(r.url, { cache: 'force-cache' });
  });
}

