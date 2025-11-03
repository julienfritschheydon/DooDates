// DooDates PWA Service Worker
const CACHE_NAME = 'doodates-v2'; // Bump version to force refresh
// Base path pour GitHub Pages
const BASE_PATH = self.location.pathname.includes('/DooDates') ? '/DooDates' : '';

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('DooDates: Service Worker installing...');
  // Skip waiting pour activer immédiatement
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('DooDates: Cache opened');
      // Cache seulement index.html, les autres assets seront cachés à la demande
      return cache.add(`${BASE_PATH}/`).catch((err) => {
        console.warn('Failed to cache root:', err);
      });
    })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('DooDates: Service Worker activating...');
  // Claim tous les clients immédiatement
  event.waitUntil(
    Promise.all([
      // Supprimer les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('DooDates: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Prendre le contrôle immédiatement
      self.clients.claim()
    ])
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  // Skip caching for development mode and external requests
  if (event.request.url.includes('localhost') || 
      event.request.url.includes('127.0.0.1') ||
      event.request.url.includes('chrome-extension') ||
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si déjà en cache, retourner
      if (cachedResponse) {
        return cachedResponse;
      }

      // Sinon, fetch et cache à la demande (cache-first strategy)
      return fetch(event.request).then((networkResponse) => {
        // Clone pour pouvoir l'utiliser ET le mettre en cache
        const responseToCache = networkResponse.clone();
        
        // Cache les assets statiques (js, css, images, fonts)
        if (event.request.method === 'GET' && 
            (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf)$/i) ||
             event.request.url.includes(BASE_PATH))) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch((err) => {
              console.warn('Failed to cache:', event.request.url, err);
            });
          });
        }
        
        return networkResponse;
      }).catch(() => {
        // Fallback offline : retourner index si navigation
        if (event.request.mode === 'navigate') {
          return caches.match(`${BASE_PATH}/`);
        }
        return new Response('Offline', { 
          status: 503, 
          statusText: 'Service Unavailable' 
        });
      });
    })
  );
});

// Gestion des notifications push (pour Phase 3)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification DooDates',
    icon: '/logo-doodates.svg',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Voir le sondage',
        icon: '/logo-doodates.svg'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DooDates', options)
  );
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(`${BASE_PATH}/`)
    );
  }
});
