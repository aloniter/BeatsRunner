const CACHE_NAME = 'beat-runner-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './icon.png',
  './js/config.js',
  './js/state.js',
  './js/globals.js',
  './js/orbs.js',
  './js/top-distance.js',
  './js/skins.js',
  './js/scene.js',
  './js/gameplay.js',
  './js/audio.js',
  './js/controls.js',
  './js/gameflow.js',
  './js/loop.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
