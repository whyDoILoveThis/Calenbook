// Calenbook Service Worker
// Strategy: Cache-first for static assets, Network-first for pages/API calls

const CACHE_VERSION = "v1";
const STATIC_CACHE = `calenbook-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `calenbook-dynamic-${CACHE_VERSION}`;

// Assets to pre-cache during install (app shell)
const PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

// ─── INSTALL ────────────────────────────────────────────────
// Fired when the browser detects a new/updated service worker.
// We open the static cache and pre-cache the app shell so the
// app can load offline immediately after first visit.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Pre-caching app shell");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

// ─── ACTIVATE ───────────────────────────────────────────────
// Fired after install, once the old SW (if any) is gone.
// We clean up stale caches from previous versions to prevent
// unbounded storage growth (no infinite cache loops).
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete any cache that isn't our current version
            return (
              name.startsWith("calenbook-") &&
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE
            );
          })
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  // Claim all open tabs so the new SW controls them immediately
  self.clients.claim();
});

// ─── FETCH ──────────────────────────────────────────────────
// Intercepts every network request from the app.
// We use different strategies depending on the request type:
//
// 1. Static assets (JS, CSS, images, fonts) → Cache-first
//    Fast loads from cache; falls back to network if not cached.
//
// 2. Navigation requests (HTML pages) → Network-first
//    Always tries the network for fresh content; falls back to
//    cached version when offline.
//
// 3. API requests → Network-only (no caching)
//    Appointment data must always be fresh. Caching API responses
//    would show stale bookings.

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== "GET") return;

  // Skip cross-origin requests (Clerk auth, external APIs, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip API routes — data must always be fresh
  if (url.pathname.startsWith("/api/")) return;

  // Navigation requests (HTML pages) → Network-first
  if (request.mode === "navigate") {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets → Cache-first
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Everything else (Next.js chunks, etc.) → Cache-first
  event.respondWith(cacheFirstStrategy(request));
});

// ─── STRATEGIES ─────────────────────────────────────────────

/**
 * Network-first: Try network, fall back to cache.
 * Used for navigation so users always get the latest page,
 * but can still load the app when offline.
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    // Cache successful responses for offline fallback
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Network failed — try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    // If navigate request has no cache, return the cached root page
    // so the app shell can handle client-side routing
    if (request.mode === "navigate") {
      return caches.match("/");
    }
    // Nothing available
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * Cache-first: Try cache, fall back to network.
 * Used for static assets (JS, CSS, images) which rarely change.
 * When fetched from network, the response is cached for next time.
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// ─── HELPERS ────────────────────────────────────────────────

/** Check if a request is for a static asset based on URL pattern */
function isStaticAsset(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Next.js static files
  if (path.startsWith("/_next/static/")) return true;

  // Public directory assets
  if (
    path.match(
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/
    )
  ) {
    return true;
  }

  return false;
}
