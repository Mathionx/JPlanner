// Service Worker (sw.js) for Joseph Planner

const CACHE_NAME = 'joseph-planner-v2'; // Updated cache name
const ASSETS_TO_CACHE = [
    '/index.html', // Cache the main HTML file
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2'
];

// 1. Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching app shell');
                // Use addAll for atomic caching
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(err => {
                console.error('Service Worker: Failed to cache app shell', err);
            })
    );
});

// 2. Activate Event (Clean up old caches)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Fetch Event (Serve from cache first, then network)
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Not in cache - go to network
                return fetch(event.request).then(
                    (response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // IMPORTANT: Don't cache opaque responses (like from FontAwesome CDN)
                        // as we can't check their validity. We've pre-cached them in 'install'.
                        if (response.type === 'opaque') {
                            return response;
                        }
                        
                        // We don't cache other network requests by default,
                        // only the ones in ASSETS_TO_CACHE.
                        
                        return response;
                    }
                ).catch(() => {
                    // Network failed, and it wasn't in cache.
                    // This is where you might return a generic offline fallback page
                    // but for a single-page app, if index.html is cached, this is less of an issue.
                });
            })
    );
});
