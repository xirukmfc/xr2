"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { apiCache } from './api-cache'
import { apiClient } from './api'

// Предзагрузчик данных для повышения производительности
export function useDataPreloader() {
  const router = useRouter()

  useEffect(() => {
    // Предзагрузка критических данных при загрузке приложения
    const preloadCriticalData = async () => {
      // Проверяем аутентификацию перед предзагрузкой
      if (!apiClient.isAuthenticated()) {
        console.debug('User not authenticated, skipping preload')
        return
      }

      try {
        // Сначала проверяем валидность токена с помощью простого запроса
        await apiClient.getCurrentUser()

        // Если токен валиден, делаем предзагрузку данных
        await Promise.allSettled([
          apiCache.getOrFetch('prompts:', () => apiClient.getPrompts(), 2 * 60 * 1000),
          apiCache.getOrFetch('counts:default', () => apiClient.getCounts(), 1 * 60 * 1000),
          apiCache.getOrFetch('user-limits', () => apiClient.getUserLimits(), 30 * 1000),
        ])
      } catch (error) {
        // Если ошибка 401/403 - очищаем токен и пропускаем предзагрузку
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          console.debug('Token invalid, clearing and skipping preload')
          apiClient.clearToken()
          return
        }
        // Игнорируем остальные ошибки предзагрузки - данные загрузятся по требованию
        console.debug('Preload failed:', error)
      }
    }

    // Запускаем предзагрузку с небольшой задержкой, чтобы не блокировать первичную загрузку
    const timeoutId = setTimeout(preloadCriticalData, 100)

    return () => clearTimeout(timeoutId)
  }, [])

  // Предзагрузка данных при hover на ссылки навигации
  const preloadPageData = (path: string) => {
    switch (path) {
      case '/prompts':
        apiCache.prefetch('prompts:', () => apiClient.getPrompts())
        break
      case '/api-keys':
        apiCache.prefetch('api-keys:', () => apiClient.getApiKeys())
        break
      case '/settings':
        apiCache.prefetch('user-limits', () => apiClient.getUserLimits())
        break
      default:
        break
    }
  }

  return { preloadPageData }
}

// Высокоуровневый компонент для автоматической предзагрузки
export function DataPreloader({ children }: { children: React.ReactNode }) {
  useDataPreloader()
  return children
}