// Service Worker for Performance Optimization
const CACHE_NAME = 'realitology-cache-v1';
const ASSETS_CACHE = 'realitology-assets-v1';
const API_CACHE = 'realitology-api-v1';

// Assets to pre-cache
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/scripts/main.js',
    '/assets/images/logo.png',
    '/assets/fonts/main.woff2'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            // Cache core assets
            caches.open(CACHE_NAME).then(cache => {
                return cache.addAll(PRECACHE_ASSETS);
            }),
            // Cache assets separately
            caches.open(ASSETS_CACHE)
        ])
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            return cacheName.startsWith('realitology-') &&
                                   ![CACHE_NAME, ASSETS_CACHE, API_CACHE].includes(cacheName);
                        })
                        .map(cacheName => caches.delete(cacheName))
                );
            }),
            // Claim clients
            self.clients.claim()
        ])
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Handle different types of requests
    if (request.method === 'GET') {
        // API requests
        if (url.pathname.startsWith('/api/')) {
            event.respondWith(handleAPIRequest(request));
        }
        // Asset requests
        else if (isAsset(url.pathname)) {
            event.respondWith(handleAssetRequest(request));
        }
        // HTML requests
        else if (request.headers.get('Accept').includes('text/html')) {
            event.respondWith(handleHTMLRequest(request));
        }
        // Other requests
        else {
            event.respondWith(handleOtherRequest(request));
        }
    }
});

// Push event
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.message,
                icon: '/assets/images/logo.png',
                badge: '/assets/images/badge.png',
                data: data.data
            })
        );
    }
});

// Notification click event
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// Handle API requests
async function handleAPIRequest(request) {
    // Try network first
    try {
        const response = await fetch(request);
        const cache = await caches.open(API_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        // Fall back to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Handle asset requests
async function handleAssetRequest(request) {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        // Update cache in background
        updateAssetCache(request);
        return cachedResponse;
    }

    // Fall back to network
    try {
        const response = await fetch(request);
        const cache = await caches.open(ASSETS_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        // Return offline asset if available
        return caches.match('/offline.html');
    }
}

// Handle HTML requests
async function handleHTMLRequest(request) {
    // Try network first
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        // Fall back to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Return offline page
        return caches.match('/offline.html');
    }
}

// Handle other requests
async function handleOtherRequest(request) {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    // Fall back to network
    try {
        const response = await fetch(request);
        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return offline response
        return new Response('Offline', { status: 503 });
    }
}

// Update asset cache in background
async function updateAssetCache(request) {
    try {
        const cache = await caches.open(ASSETS_CACHE);
        const response = await fetch(request);
        await cache.put(request, response);
    } catch (error) {
        console.error('Error updating asset cache:', error);
    }
}

// Check if URL is an asset
function isAsset(pathname) {
    const assetExtensions = [
        '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
        '.woff', '.woff2', '.ttf', '.eot', '.ico'
    ];
    return assetExtensions.some(ext => pathname.endsWith(ext));
}

// Background sync event
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

// Sync data in background
async function syncData() {
    try {
        const cache = await caches.open(API_CACHE);
        const requests = await cache.keys();
        
        await Promise.all(
            requests.map(async request => {
                try {
                    const response = await fetch(request);
                    await cache.put(request, response);
                } catch (error) {
                    console.error('Error syncing data:', error);
                }
            })
        );
    } catch (error) {
        console.error('Error in background sync:', error);
    }
}
