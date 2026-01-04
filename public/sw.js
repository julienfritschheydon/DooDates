// DooDates PWA Service Worker - DÉSACTIVÉ
// TODO Phase 5 (Mois 9-12): Réactiver pour PWA/Mobile Native
// Voir Docs/2. Planning.md ligne 1043

console.log("DooDates: Service Worker désactivé (Phase 5)");

// Désinstaller le service worker existant
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("DooDates: Deleting cache", cacheName);
            return caches.delete(cacheName);
          }),
        );
      })
      .then(() => {
        console.log("DooDates: Service Worker désactivé, caches supprimés");
        return self.clients.claim();
      }),
  );
});

// Pas de fetch listener = pas de cache = pas d'offline
// Le SW se désinstalle automatiquement au prochain chargement
