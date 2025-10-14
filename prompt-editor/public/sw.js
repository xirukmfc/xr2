// High-Performance Service Worker для кэширования статических ресурсов

const CACHE_NAME = 'xr2-cache-v1'
const RUNTIME_CACHE_NAME = 'xr2-runtime-v1'

// Статические ресурсы для кэширования
const STATIC_CACHE_URLS = [
  '/',
  '/prompts',
  '/api-keys', 
  '/logs',
  '/settings',
  '/manifest.json'
]

// Стратегии кэширования для разных типов ресурсов
const CACHE_STRATEGIES = {
  // Статические ресурсы - Cache First
  static: [
    /\/_next\/static\/.*/,
    /\.(?:js|css|woff|woff2|eot|ttf|otf)$/,
    /\/favicon\.ico$/
  ],
  
  // API запросы - Network First с коротким кэшем
  api: [
    /\/api\//,
    /\/internal\//
  ],
  
  // Страницы - Stale While Revalidate
  pages: [
    /\/prompts/,
    /\/api-keys/,
    /\/logs/,
    /\/settings/,
    /\/profile/
  ]
}

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static resources')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => self.skipWaiting())
  )
})

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activating...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Обработка fetch запросов
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Пропускаем не-GET запросы
  if (request.method !== 'GET') return

  // Пропускаем Chrome DevTools
  if (url.protocol === 'chrome-extension:') return

  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Определяем стратегию кэширования
  if (matchesPattern(url.pathname, CACHE_STRATEGIES.static)) {
    return handleStaticResource(request)
  }
  
  if (matchesPattern(url.pathname, CACHE_STRATEGIES.api)) {
    return handleApiRequest(request)
  }
  
  if (matchesPattern(url.pathname, CACHE_STRATEGIES.pages)) {
    return handlePageRequest(request)
  }
  
  // Fallback - Network First
  return handleNetworkFirst(request)
}

// Cache First стратегия для статических ресурсов
async function handleStaticResource(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log('[SW] Network failed for static resource:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network First с коротким кэшем для API
async function handleApiRequest(request) {
  try {
    const response = await fetch(request, {
      headers: {
        ...request.headers,
        'Cache-Control': 'max-age=60' // 1 минута
      }
    })
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log('[SW] Network failed for API, trying cache:', error)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    return new Response('{"error": "Offline"}', { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Stale While Revalidate для страниц
async function handlePageRequest(request) {
  const cachedResponse = await caches.match(request)
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(RUNTIME_CACHE_NAME)
      cache.then(c => c.put(request, response.clone()))
    }
    return response
  }).catch(() => null)
  
  if (cachedResponse) {
    fetchPromise // Update cache in background
    return cachedResponse
  }
  
  return fetchPromise || new Response('Offline', { status: 503 })
}

// Network First fallback
async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

// Утилита для проверки паттернов
function matchesPattern(pathname, patterns) {
  return patterns.some(pattern => pattern.test(pathname))
}