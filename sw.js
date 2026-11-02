const PREFIX = 'jx2like:' + self.registration.scope + ':';
const CACHE = PREFIX + '0.38.1';
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./src/style.css","./src/data.js","./src/rules.js","./src/engine.js","./src/expedition.js","./src/art.js","./src/world-map.js","./src/journey-ui.js","./src/mobile.js","./src/app.js","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./jx2-like-交付/设计规格-v0.1/data/items-v0.1.json","./jx2-like-交付/设计规格-v0.1/data/region-bianjing-east.json"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match(new URL('./', self.location.href)) : Response.error()))));
});
