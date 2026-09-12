const CACHE_NAME = 'islamic-site-v5';
const ASSETS = ['./', './index.html', './style.css', './script.js', './quran.html', './quran.css', './quran.js'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if(url.includes('aladhan.com') || url.includes('openstreetmap.org') || url.includes('quran.com') || url.includes('qurancdn.com') || url.includes('mp3quran.net')){ return; }
  // الشبكة أولًا: أي تحديث في ملفات الموقع (زخرفة، ألوان، إصلاحات) يوصل فورًا لكل الصفحات.
  // التخزين المؤقت بقى للطوارئ بس (لو النت مقطوع)، وبيتجدد لوحده مع كل طلب ناجح.
  event.respondWith(
    fetch(event.request)
      .then((res)=>{
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache)=> cache.put(event.request, copy)).catch(()=>{});
        return res;
      })
      .catch(()=> caches.match(event.request))
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('./index.html'));
});
