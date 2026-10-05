const CACHE_NAME = 'track-cache-smart';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// સ્માર્ટ હેન્ડલિંગ: એપ તરત ખુલશે, નેટ હોય તો બેકગ્રાઉન્ડમાં ચેક થશે
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // બેકગ્રાઉન્ડ નેટવર્ક ચેક
      const networkFetch = fetch(event.request, { cache: 'no-cache' })
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // જો index.html હોય, તો ચેક કરો કે કોડ બદલાયો છે?
            if (event.request.mode === 'navigate' || event.request.url.includes('index.html')) {
              const newHtml = await networkResponse.clone().text();
              const oldHtml = cachedResponse ? await cachedResponse.clone().text() : '';

              // જો ગિટહબ પર નવો કોડ મળ્યો તો જ કેશ બદલો અને એપ રિલોડ કરાવો
              if (oldHtml && newHtml !== oldHtml) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, networkResponse.clone());
                
                // એપને આપમેળે રિફ્રેશ કરવાનો મેસેજ મોકલો
                const clients = await self.clients.matchAll();
                clients.forEach((client) => {
                  client.postMessage({ action: 'AUTO_UPDATE_RELOAD' });
                });
                return networkResponse;
              }
            }

            // અન્ય ફાઈલો કેશમાં સેવ કરી લો
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // નેટ બંધ હોય ત્યારે શાંતિથી કેશ વાપરો
        });

      // કેશ હોય તો તરત ડિસ્પ્લે કરો, ના હોય તો નેટમાંથી લાવો
      return cachedResponse || networkFetch;
    })
  );
});
