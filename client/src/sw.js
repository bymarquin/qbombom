import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkOnly } from 'workbox-strategies'

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

// Precache dos assets do app (JS, CSS, HTML)
// Requests cross-origin (imagens R2, etc.) não são interceptadas pelo SW
precacheAndRoute(self.__WB_MANIFEST)
