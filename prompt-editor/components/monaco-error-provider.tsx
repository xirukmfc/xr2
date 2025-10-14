// components/monaco-error-provider.tsx
"use client"

import { useEffect } from 'react'

export function MonacoErrorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Дополнительная защита на уровне React компонента
    // (основная защита уже в layout через script)

    console.log('Monaco error provider initialized')

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        typeof event.reason === 'object' &&
        event.reason.type === 'cancelation'
      ) {
        console.log('Monaco cancelation error caught by React provider:', event.reason.msg)
        event.preventDefault()
        return
      }
    }

    // Добавляем дополнительный обработчик
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return <>{children}</>
}

// Опциональное использование в layout.tsx:
//
// import { MonacoErrorProvider } from '@/components/monaco-error-provider'
//
// export default function RootLayout({ children }) {
//   return (
//     <html>
//       <body>
//         <ThemeProvider>
//           <PromptsProvider>
//             <MonacoErrorProvider>
//               <ClientLayout>{children}</ClientLayout>
//             </MonacoErrorProvider>
//           </PromptsProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   )
// }