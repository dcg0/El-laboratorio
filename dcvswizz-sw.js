const CACHE_PREFIX = 'dcvswizz-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const SHELL = [
  './dcvswizz.webmanifest',
  './game/game.html',
  './game/game.js',
  './assets/js/dcvswizz-pwa.js',
  './assets/app-icons/dcvswizz-icon-192.png',
  './assets/app-icons/dcvswizz-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
