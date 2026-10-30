// SignalSafe Campus Service Worker v2
const CACHE_NAME = 'signalsafe-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache pre-fill partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 1. Never intercept non-GET requests (e.g. POST /api/v1/scan/*, POST /api/v1/incidents)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Only handle http and https requests (ignore chrome-extension://, etc.)
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return;
  }

  // 3. Keep all API requests strictly network-only (never stale-cache authenticated or scan results)
  if (request.url.includes('/api/')) {
    return;
  }

  // 4. Safe cache-first for static assets with robust fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          // If valid response and same origin, we can cache it
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic' &&
            !request.url.includes('/@vite/') &&
            !request.url.includes('node_modules')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback for SPA navigations
          if (request.mode === 'navigate') {
            return caches.match('/index.html').then((indexCached) => {
              return (
                indexCached ||
                new Response('<h1>SignalSafe Offline</h1><p>Please check your network connection.</p>', {
                  status: 503,
                  headers: { 'Content-Type': 'text/html' },
                })
              );
            });
          }

          // Return a valid fallback Response to prevent "Failed to convert value to Response"
          return new Response(null, {
            status: 504,
            statusText: 'Gateway Timeout / Offline',
          });
        });
    })
  );
});
