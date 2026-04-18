import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

self.skipWaiting()
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

cleanupOutdatedCaches()

// API nunca vai para cache — dados de pedidos devem ser sempre frescos
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly()
)

// Cache de imagens de produto no R2 (alivia rede/origem)
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' &&
    (url.hostname.endsWith('.r2.dev') || url.hostname.includes('r2.cloudflarestorage.com')),
  new CacheFirst({
    cacheName: 'product-images-r2-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// Precache dos assets do app (JS, CSS, HTML)
// Requests cross-origin (imagens R2, etc.) não são interceptadas pelo SW
precacheAndRoute(self.__WB_MANIFEST)
