const CACHE_NAME = "arbeitszeit-cache-v2";
const urlsToCache = [
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
];

// Beim Installieren: alles cachen
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Beim Aufruf: aus Cache laden oder neu holen
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
