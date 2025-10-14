// Высокопроизводительный API клиент с агрессивным кэшированием

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private requestsInFlight = new Map<string, Promise<any>>()

  // Агрессивное кэширование - 5 минут для большинства данных
  private defaultTTL = 5 * 60 * 1000 // 5 минут
  
  // Долгосрочное кэширование для статичных данных
  private longTTL = 30 * 60 * 1000 // 30 минут

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    })
  }

  // Предотвращение дублирующих запросов
  async getOrFetch<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Проверяем кэш
    const cached = this.get<T>(key)
    if (cached !== null) return cached

    // Проверяем, нет ли запроса в полете
    const inFlight = this.requestsInFlight.get(key)
    if (inFlight) return inFlight

    // Делаем запрос
    const promise = fetcher().then(data => {
      this.set(key, data, ttl)
      this.requestsInFlight.delete(key)
      return data
    }).catch(error => {
      this.requestsInFlight.delete(key)
      throw error
    })

    this.requestsInFlight.set(key, promise)
    return promise
  }

  // Предзагрузка данных
  prefetch<T>(key: string, fetcher: () => Promise<T>, ttl: number = this.defaultTTL): void {
    if (!this.get(key)) {
      this.getOrFetch(key, fetcher, ttl).catch(() => {
        // Игнорируем ошибки предзагрузки
      })
    }
  }

  // Инвалидация кэша
  invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Принудительная инвалидация всех кэшей, связанных с промтами
  invalidatePromptsCache(): void {
    this.invalidate('prompts:')
    this.invalidate('prompt:')
    this.invalidate('counts:')
  }

  // Очистка устаревших записей
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Глобальный экземпляр кэша
export const apiCache = new APICache()

// Автоматическая очистка каждые 10 минут
if (typeof window !== 'undefined') {
  setInterval(() => apiCache.cleanup(), 10 * 60 * 1000)
}

// Хук для простого использования
export function useAPICache() {
  return apiCache
}