// utils/monaco-error-handler.ts
// Утилита для обработки ошибок Monaco Editor

export function setupMonacoErrorHandler() {
  // Глобальный обработчик для необработанных promise rejection
  if (typeof window === 'undefined') return

  const originalHandler = window.onunhandledrejection

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // Проверяем, это ли ошибка Monaco cancelation
    if (
      event.reason &&
      typeof event.reason === 'object' &&
      event.reason.type === 'cancelation'
    ) {
      // Игнорируем ошибки cancelation от Monaco
      console.log('Monaco cancelation error ignored:', event.reason.msg)
      event.preventDefault()
      return
    }

    // Для других ошибок вызываем оригинальный обработчик
    if (originalHandler) {
      originalHandler.call(window, event)
    }
  }

  window.addEventListener('unhandledrejection', handleUnhandledRejection)

  // Возвращаем функцию для очистки
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    if (originalHandler) {
      window.onunhandledrejection = originalHandler
    }
  }
}

// Хук для использования в React компонентах
export function useMonacoErrorHandler() {
  if (typeof window === 'undefined') return

  const cleanup = setupMonacoErrorHandler()
  return cleanup
}

// Использование в компоненте:
//
// useEffect(() => {
//   const cleanup = setupMonacoErrorHandler()
//   return cleanup
// }, [])