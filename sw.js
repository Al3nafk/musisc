// Musisc service worker: network first, cached copy when offline.
// The offline reader (library/omr/, ~195 MB) lives in its own "musisc-omr-<version>" cache, filled by the
// page when the user agrees to download it; those files are served cache-first and never copied here.
const CACHE = 'musisc-v4';
const CORE = ['./', './index.html', './app.js', './abcjs-basic-min.js', './piano.json', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && !k.startsWith('musisc-omr-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.includes('/library/omr/')) {
    // the page checks for updates of manifest.json itself (cache: 'no-cache'); everything else is versioned by it
    if (url.pathname.endsWith('/manifest.json')) {
      e.respondWith(fetch(req).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || Response.error())));
    } else {
      e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
    }
    return;
  }
  const cacheable = url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com') || url.hostname === 'cdnjs.cloudflare.com';
  if (!cacheable) return;
  e.respondWith(
    fetch(req, url.origin === location.origin ? { cache: 'no-cache' } : {}).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
