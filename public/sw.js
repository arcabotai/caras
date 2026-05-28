const CACHE_VERSION = 'v1';
const CACHE_NAME = `talkie-latam-${CACHE_VERSION}`;

// Static assets to cache on install (app shell)
const APP_SHELL = [
  '/',
  '/discover',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Stale-while-revalidate patterns (JS, CSS, fonts, images)
const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.ico$/,
];

// Network-first patterns (HTML pages — fallback to cache)
const PAGE_PATTERNS = [
  /^\/$/,
  /^\/discover/,
  /^\/chat\//,
];

// API routes to skip entirely (never cache)
const SKIP_API_PATTERNS = [
  /^\/api\/chat/,
  /^\/api\/auth/,
  /^\/api\//,
];

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge stale caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n !== CACHE_NAME)
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategy ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Skip API routes (never cache sensitive data)
  if (SKIP_API_PATTERNS.some((p) => p.test(url.pathname))) {
    return;
  }

  // 2. Static assets → Cache-first
  if (STATIC_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 3. App pages → Network-first with offline fallback
  if (PAGE_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // 4. Everything else → Network-first (default)
  event.respondWith(networkFirst(request));
});

// ── Cache-first: serve from cache, refresh in background ───────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match('/offline');
  }
}

// ── Network-first: try network, fallback to cache, then offline page ─────────
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline');
  }
}

// ── Network-first: try network, fallback to cache only (no offline page) ────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request);
  }
}