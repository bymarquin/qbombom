import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkOnly } from 'workbox-strategies'

cleanupOutdatedCaches()

// Ignora completamente requests cross-origin (R2, CDNs, etc.)
// O browser trata essas requests nativamente sem interferência do SW
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }
})

// Nunca cacheia chamadas de API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly()
)

// Precache dos assets do app (JS, CSS, HTML)
precacheAndRoute(self.__WB_MANIFEST)
