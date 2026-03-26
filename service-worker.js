const CACHE_NAME = 'olli-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/pricing.html',
  '/saved.html',
  '/day.html',
  '/olli-face.png',
  '/olli-icon-192.png',
  '/olli-icon-512.png',
  '/olli-og-image.jpg',
  '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Predictive cache after itinerary generated
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_ITINERARY') {
    const { stops } = event.data;
    if (!stops || !stops.length) return;
    caches.open(CACHE_NAME).then(cache => {
      stops.forEach(stop => {
        if (stop.photo_url) {
          fetch(stop.photo_url)
            .then(res => { if (res.ok) cache.put(stop.photo_url, res); })
            .catch(() => {});
        }
      });
      ['saved.html', 'day.html'].forEach(page => {
        fetch('/' + page)
          .then(res => { if (res.ok) cache.put('/' + page, res); })
          .catch(() => {});
      });
    });
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('googleapis.com') && !event.request.url.includes('fonts')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('/index.html');
        });
      })
  );
});
