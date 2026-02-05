const CACHE_NAME = 'schedule-selector-v1';
const urlsToCache = [
    './',
    './index.html',
    './script.js',
    './manifest.json',
    './res/icon/icon-192.png',
    './res/icon/icon-512.png',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});