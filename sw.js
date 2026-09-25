const CACHE = 'part66-quiz-v24';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

// Install: pre-cache the app shell, then take over immediately.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: delete every cache that is not the current one. Without this,
// old caches survive forever and can keep answering requests.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: network first, cache only as an offline fallback.
// The old version used cache-first with an unscoped caches.match(), which
// searched ALL caches (including stale ones) and kept serving the previous
// build even after the version number was bumped.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.open(CACHE).then(c =>
          c.match(e.request).then(r => r || c.match('./index.html'))
        )
      )
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
