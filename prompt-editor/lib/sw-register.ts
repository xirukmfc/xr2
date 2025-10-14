"use client"

// Регистрация и управление Service Worker для оптимальной производительности

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  // Регистрируем SW после загрузки страницы для избежания блокировки
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Всегда проверяем обновления SW
      })

      console.log('[SW] Registered successfully:', registration.scope)

      // Проверяем обновления каждые 30 секунд
      setInterval(() => {
        registration.update()
      }, 30000)

      // Обработчик обновлений SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available')
              // Можно показать пользователю уведомление об обновлении
              showUpdateNotification()
            }
          })
        }
      })

    } catch (error) {
      console.log('[SW] Registration failed:', error)
    }
  })

  // Обработчик сообщений от SW
  navigator.serviceWorker.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data)
  })
}

// Уведомление пользователя об обновлении
function showUpdateNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('xR2 Updated!', {
      body: 'New version available. Refresh to apply updates.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'sw-update'
    })
  }
}

// Принудительное обновление SW и перезагрузка
export function forceSwUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister()
      })
    }).then(() => {
      window.location.reload()
    })
  }
}

// Проверка статуса SW
export function getSwStatus() {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, registered: false }
  }

  return {
    supported: true,
    registered: !!navigator.serviceWorker.controller,
    scope: navigator.serviceWorker.controller?.scriptURL
  }
}