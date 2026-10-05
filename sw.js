const CACHE_NAME = 'track-pwa-cache';

// ૧. નવી સર્વિસ તરત એક્ટિવેટ થશે
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ૨. જૂની બધી કૅશ ફાઈલો આપોઆપ સાફ થઈ જશે
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ૩. Network-First: હંમેશાં નેટ પરથી નવો કોડ લેશે, જેથી કોઈ દિવસ કૅશ ક્લિયર ના કરવું પડે
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // નેટ બંધ હોય ત્યારે જ સેવ કરેલી કૅશ ફાઈલ વાપરશે
        return caches.match(event.request);
      })
  );
});
