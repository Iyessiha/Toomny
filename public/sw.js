// Toomny Service Worker — cache stratégique pour réseau lent (UEMOA)
const CACHE = "toomny-v1";

// Assets statiques : cache-first (changent uniquement au déploiement)
const STATIC_EXTS = [".png", ".jpg", ".webp", ".avif", ".svg", ".woff2", ".ico"];

// Pages à pré-cacher au premier chargement
const PRECACHE = ["/", "/dashboard", "/offline"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(PRECACHE).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET, les API Supabase et les routes /api/
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co")
  ) {
    return;
  }

  const isStatic = STATIC_EXTS.some((ext) => url.pathname.endsWith(ext));
  const isNextStatic = url.pathname.startsWith("/_next/static/");

  if (isStatic || isNextStatic) {
    // Cache-first : immédiatement depuis le cache, mise à jour en arrière-plan
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Network-first pour les pages : tente le réseau, fallback cache, puis /offline
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.headers.get("accept")?.includes("text/html")) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached ?? caches.match("/offline")
        )
      )
  );
});
