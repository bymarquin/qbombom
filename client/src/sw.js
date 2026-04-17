import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkOnly } from 'workbox-strategies'

// Assume controle imediatamente ao ser instalado
self.skipWaiting()
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

cleanupOutdatedCaches()

// Nunca cacheia chamadas de API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly()
)

// Precache dos assets do app (JS, CSS, HTML)
// Requests cross-origin (R2, etc.) não são interceptadas — browser as trata nativamente
precacheAndRoute(self.__WB_MANIFEST)
