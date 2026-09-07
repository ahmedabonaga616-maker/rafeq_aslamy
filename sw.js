const CACHE_NAME = 'islamic-site-v3';
const ASSETS = ['./', './index.html', './style.css', './script.js'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if(event.request.url.includes('aladhan.com') || event.request.url.includes('openstreetmap.org')){ return; }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).catch(()=>cached)));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('./index.html'));
});
