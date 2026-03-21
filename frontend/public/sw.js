// Service Worker for offline support and caching
const CACHE_NAME = 'team-iran-vs-usa-v3';
const CACHE_VERSION = '1.0.2';
const API_BASE_URL = 'http://localhost:3000/api';

// Cache configuration
const CACHE_CONFIG = {
  // Static assets - cache for 30 days
  static: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    patterns: [
      '/',
      '/index.html',
      '/manifest.json',
      '/static/**',
      '/*.js',
      '/*.css',
      '/*.png',
      '/*.jpg',
      '/*.jpeg',
      '/*.gif',
      '/*.svg',
      '/*.ico'
    ]
  },
  
  // API responses - cache for 5 minutes
  api: {
    maxAge: 5 * 60 * 1000,
    patterns: [
      '/api/profile',
      '/api/leaderboard',
      '/api/territories',
      '/api/guilds',
      '/api/marketplace',
      '/api/tournaments',
      '/api/staking/pools'
    ]
  },
  
  // User data - cache for 1 hour
  userData: {
    maxAge: 60 * 60 * 1000,
    patterns: [
      '/api/user/**'
    ]
  }
};

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  // Force cache refresh by updating cache name
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('Service Worker installation complete, old caches cleared');
      self.skipWaiting();
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('Service Worker activation complete');
      
      // Force immediate refresh by updating cache version and notifying clients
      self.clients.matchAll({
        includeUncontrolled: true
      }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_BUST',
            version: Date.now().toString()
          });
        });
      });
      
      self.skipWaiting();
    });
  });
});
});

// Fetch event - main caching logic
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for API endpoints
  if (url.pathname.startsWith('/api/') && request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== self.location.origin && !url.hostname.includes('localhost')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Handle requests with caching strategy
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Network-first strategy for API requests
    if (pathname.startsWith('/api/')) {
      return await networkFirst(request);
    }
    
    // Cache-first strategy for static assets
    if (isStaticAsset(pathname)) {
      return await cacheFirst(request);
    }
    
    // Stale-while-revalidate for user data
    if (isUserData(pathname)) {
      return await staleWhileRevalidate(request);
    }
    
    // Network-first for everything else
    return await networkFirst(request);
  } catch (error) {
    console.error('Request handling error:', error);
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached response immediately
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(CACHE_NAME);
        cache.put(request, networkResponse);
      }
    }).catch(() => {
      // Ignore background update errors
    });
    
    return cachedResponse;
  }
  
  // No cache, try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  // Always try to update cache
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Return offline response if network fails
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  });
  
  // Return cached response if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network
  return await fetchPromise;
}

// Check if request is for static asset
function isStaticAsset(pathname) {
  return CACHE_CONFIG.static.patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(pathname);
    }
    return pathname === pattern;
  });
}

// Check if request is for user data
function isUserData(pathname) {
  return CACHE_CONFIG.userData.patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(pathname);
    }
    return pathname.startsWith(pattern);
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processOfflineQueue());
  }
});

// Process offline queue
async function processOfflineQueue() {
  try {
    const queue = getOfflineQueue();
    
    if (queue.length === 0) {
      return;
    }
    
    console.log(`Processing ${queue.length} offline actions`);
    
    for (const action of queue) {
      try {
        await fetch(action.url, action.options);
        console.log('Offline action processed:', action);
      } catch (error) {
        console.error('Failed to process offline action:', error);
      }
    }
    
    clearOfflineQueue();
    
    // Notify all clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { processed: queue.length }
      });
    });
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Offline queue management
function getOfflineQueue() {
  return JSON.parse(localStorage.getItem('offlineQueue') || '[]');
}

function clearOfflineQueue() {
  localStorage.removeItem('offlineQueue');
}

// Push notification support
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data?.body || 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'team-iran-vs-usa',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(
      event.data?.title || 'Team Iran vs USA',
      options
    )
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic cache cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(cleanupCache());
  }
});

// Clean up expired cache entries
async function cleanupCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const now = Date.now();
    
    for (const request of requests) {
      const response = await cache.match(request);
      
      if (response) {
        const dateHeader = response.headers.get('date');
        const responseDate = dateHeader ? new Date(dateHeader).getTime() : 0;
        const age = now - responseDate;
        
        // Remove expired entries
        const maxAge = getMaxAge(request.url);
        if (age > maxAge) {
          await cache.delete(request);
          console.log('Deleted expired cache entry:', request.url);
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}

// Get max age for URL
function getMaxAge(url) {
  const pathname = new URL(url).pathname;
  
  if (isStaticAsset(pathname)) {
    return CACHE_CONFIG.static.maxAge;
  }
  
  if (isUserData(pathname)) {
    return CACHE_CONFIG.userData.maxAge;
  }
  
  if (pathname.startsWith('/api/')) {
    return CACHE_CONFIG.api.maxAge;
  }
  
  return CACHE_CONFIG.static.maxAge;
}

// Cache statistics
async function getCacheStats() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const stats = {
      total: requests.length,
      size: 0,
      entries: []
    };
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const size = await getResponseSize(response);
        stats.size += size;
        
        stats.entries.push({
          url: request.url,
          size,
          timestamp: response.headers.get('date')
        });
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Cache stats error:', error);
    return { total: 0, size: 0, entries: [] };
  }
}

// Get response size
async function getResponseSize(response) {
  const clone = response.clone();
  const blob = await clone.blob();
  return blob.size;
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    event.waitUntil(
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', data: stats });
      })
    );
  }
});

console.log('Service Worker loaded successfully');
