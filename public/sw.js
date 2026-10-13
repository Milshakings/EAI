const CACHE_NAME = "evaluaai-shell-v1";
const APP_SHELL = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: nunca cachear /api/* (datos de estudiantes, siempre frescos y
// locales). Para el resto, "network first, cache fallback": si el
// establecimiento pierde internet pero el servidor local sigue arriba en la
// red Wi-Fi/LAN, la app sigue funcionando igual porque el fetch va a la IP
// local, no a internet.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.url.includes("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request))
  );
});
