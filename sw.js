const PREFIX = 'jx2like:' + self.registration.scope + ':';
const CACHE = PREFIX + '83da3ff56c3c';
const PRECACHE = ["./","./index.html","./manifest.webmanifest?v=83da3ff56c3c","./src/style.css?v=83da3ff56c3c","./src/data.js?v=83da3ff56c3c","./src/rules.js?v=83da3ff56c3c","./src/engine.js?v=83da3ff56c3c","./src/expedition.js?v=83da3ff56c3c","./src/art.js?v=83da3ff56c3c","./src/world-map.js?v=83da3ff56c3c","./src/journey-ui.js?v=83da3ff56c3c","./src/mobile.js?v=83da3ff56c3c","./src/app.js?v=83da3ff56c3c","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./jx2-like-交付/设计规格-v0.1/data/items-v0.1.json?v=83da3ff56c3c","./jx2-like-交付/设计规格-v0.1/data/region-bianjing-east.json?v=83da3ff56c3c"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE.map(url => new Request(url, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request, {cache: 'no-cache'}).catch(() => caches.open(CACHE).then(cache => cache.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? cache.match(new URL('./', self.location.href)) : Response.error())))));
});
