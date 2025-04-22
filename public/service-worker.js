// Namn för statiskt cache (HTML, manifest, bilder m.m.)
const CACHE_NAME = "ff-cache-v2";

// Filer som ska cachas direkt vid installation
const urlsToCache = [
  "/index.html",
  "./",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/offline.html",
];

// Namn för dynamisk cache (API-svar, m.m.)
const CACHE_DYNAMIC_NAME = "dynamic-v1";
const API_CACHE_NAME = "ff-api-cache-v1";

// Installera service worker och cacha grundläggande filer
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching app shell and assets");
      return cache.addAll(urlsToCache);
    })
  );
});

// Aktivera och rensa gamla cacher
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName !== CACHE_DYNAMIC_NAME
          )
          .map((cacheName) => {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );

  return self.clients.claim();
});

// Lyssna på alla fetch-anrop (nätverksförfrågningar)
self.addEventListener("fetch", (event) => {
  // Undvik att hantera Vite-filer och hot reload
  if (
    event.request.url.includes("@vite") ||
    event.request.url.includes("hot") ||
    event.request.url.includes("react-refresh")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Returnera cache om tillgänglig
      if (cachedResponse) {
        return cachedResponse;
      }

      // Annars, försök hämta från nätet och cacha svaret
      return fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Om det misslyckas och det är en HTML-sida, visa offline.html
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/offline.html");
          }
        });
    })
  );
});
