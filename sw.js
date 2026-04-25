const CACHE_NAME = 'iacademy-rfid-v1';

// Install event - caches nothing by default to keep your live data fresh
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event - cleans up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Fetch event - always goes to the internet first to ensure data is live
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});