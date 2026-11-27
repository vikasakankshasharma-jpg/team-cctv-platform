const CACHE_NAME = 'cctvquotation-v14';
const OFFLINE_URL = '/offline';
const URLS_TO_CACHE = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/manifest-admin.json',
  '/manifest-installer.json',
  '/manifest-partner.json',
  '/manifest-salesperson.json',
  '/manifest-delivery.json',
  '/favicon.ico',
  '/og-image.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/data/india-locations.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache-first for wizard API
  if (url.pathname.startsWith('/api/wizard')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(event.request).then((networkResponse) => {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              if (event.request.url.startsWith("http")) cache.put(event.request, clone);
            });
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => { if (event.request.url.startsWith("http")) cache.put(event.request, clone); });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Bypass service worker entirely for API routes, auth, Next.js internal RSC requests, and admin
  if (
    url.pathname.startsWith('/_next/') ||
    url.search.includes('_rsc=') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/login')
  ) {
    return; // Fall through to direct network
  }

  // Cache-first for firebase storage images
  if (url.hostname === 'firebasestorage.googleapis.com') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // For HTML navigation requests, try network first, then cache, then offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match(OFFLINE_URL).then((offlineRes) => {
              return offlineRes || Response.error();
            });
          });
        })
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith("http")) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        if (cachedResponse) return cachedResponse;
        return Response.error();
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// ── Web Push Notification Listeners ──────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'TEAM CCTV Notification',
        body: event.data.text() || 'New operational update.'
      };
    }
  }

  const title = data.title || 'TEAM CCTV Update';
  const options = {
    body: data.body || 'You have a new update in your dashboard.',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/favicon-32x32.png',
    tag: data.tag || 'team-cctv-alert',
    renotify: true,
    data: {
      url: data.url || '/',
      role: data.role || 'general',
      timestamp: Date.now()
    },
    vibrate: [200, 100, 200],
    actions: data.actions || [
      { action: 'open', title: 'Open Dashboard' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  // Update native app badge on desktop taskbar / mobile home screen
  if ('setAppBadge' in self.navigator) {
    self.navigator.setAppBadge().catch(() => {});
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Clear app badge when notification is interacted with
  if ('clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge().catch(() => {});
  }

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

