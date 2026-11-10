const CACHE_CORE = 'xingce-pwa-core-v4.3-e356288d';
const CACHE_IMG = 'xingce-pwa-img-v4.2';
const CORE_ASSETS = [
  './',
  './index.html',
  './data.json?v=e356288d',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_CORE).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_CORE && k !== CACHE_IMG).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 图片采用 Cache-First，看过的图片永久秒开
  if (url.pathname.includes('/imgs/')) {
    event.respondWith(
      caches.open(CACHE_IMG).then(async cache => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const resp = await fetch(req);
        if (resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      })
    );
    return;
  }

  // 核心页面与题库采用带版本校验的缓存策略
  event.respondWith(
    caches.open(CACHE_CORE).then(async cache => {
      const cached = await cache.match(req);
      const netPromise = fetch(req).then(resp => {
        if (resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      }).catch(() => cached);
      return cached || netPromise;
    })
  );
});
