const CACHE = "sunrise-v1"

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, true))
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, false))
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})

async function networkFirst(request, isApi) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    if (isApi) {
      return new Response(JSON.stringify({ error: "Offline" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    }
    return (await caches.match("/index.html")) ?? Response.error()
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  const fetched = fetch(request)
    .then((response) => {
      if (response.ok) {
        void cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)

  return cached ?? fetched
}
