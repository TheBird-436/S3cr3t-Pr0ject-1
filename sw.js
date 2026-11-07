const CACHE_NAME = 'sp1-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './music/track2.mp3' // Add track1 and track3 if you have them!
];

// Install the Service Worker and cache files
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Fetch from cache if offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});