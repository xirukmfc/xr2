import type React from "react"
import type {Metadata} from "next"
import {GeistSans} from "geist/font/sans"
import {GeistMono} from "geist/font/mono"
import {ThemeProvider} from "next-themes"
import ClientLayout from "./client-layout"
import {PromptsProvider} from '@/components/prompts-context'
import {WorkspaceProvider} from "@/components/workspace-context"
import {CountsProvider} from '@/components/counts-context'
import {AuthProvider} from "@/contexts/auth-context"
import {DataPreloader} from "@/lib/preload-data"
import "./globals.css"

// Service Worker for caching - register on client
if (typeof window !== 'undefined') {
  import('@/lib/sw-register').then(({ registerServiceWorker }) => {
    registerServiceWorker()
  })
}

export const metadata: Metadata = {
    title: "xR2",
    description: "Advanced prompt editor for AI workflows",
    generator: "xR2",
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <head>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
              // Handler for ResizeObserver errors
              window.addEventListener('error', function(e) {
                if (e.message && e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
                  e.stopImmediatePropagation();
                  return false;
                }
              });

              // Handler for Monaco cancelation errors
              window.addEventListener('unhandledrejection', function(event) {
                try {
                  // Safer check for Monaco cancelation errors
                  if (event && event.reason) {
                    const reason = event.reason;
                    
                    // Check different types of cancelation errors
                    if (
                      (typeof reason === 'object' && reason !== null && reason.type === 'cancelation') ||
                      (typeof reason === 'string' && reason.includes('cancelation')) ||
                      (reason && typeof reason.message === 'string' && reason.message.includes('cancelation')) ||
                      (reason && typeof reason.msg === 'string' && reason.msg.includes('operation is manually canceled')) ||
                      // Additional checks for Monaco errors
                      (reason && typeof reason === 'object' && reason.name === 'Canceled') ||
                      (reason && typeof reason === 'object' && reason.code === 'Canceled') ||
                      // Check stack trace for Monaco errors
                      (reason && reason.stack && reason.stack.includes('monaco-editor'))
                    ) {
                      console.log('Monaco error ignored');
                      event.preventDefault();
                      return;
                    }

                    // Special handling for [object Object] errors - Next.js error boundaries
                    if (reason && (
                      reason.toString() === '[object Object]' ||
                      (reason.constructor && reason.constructor.name === 'Object' && !reason.message)
                    )) {
                      console.log('Next.js object error ignored (likely Monaco or navigation related)');
                      event.preventDefault();
                      return;
                    }
                  }
                } catch (err) {
                  // If error checking itself threw an error, ignore
                  console.log('Error handler failed, ignoring original error');
                  event.preventDefault();
                }
              });

              // Handler for console.error with Monaco errors and font warnings
              (function() {
                const originalConsoleError = console.error;
                const originalConsoleWarn = console.warn;
                
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('cancelation') && message.includes('operation is manually canceled')) {
                    console.log('Monaco cancelation console error ignored');
                    return;
                  }
                  // Игнорируем font preload предупреждения
                  if (message.includes('preloaded using link preload but not used')) {
                    return;
                  }
                  originalConsoleError.apply(console, args);
                };

                console.warn = function(...args) {
                  const message = args.join(' ');
                  // Ignore font preload warnings in warn too
                  if (message.includes('preloaded using link preload but not used')) {
                    return;
                  }
                  if (message.includes('_next/static/media/') && message.includes('.woff')) {
                    return;
                  }
                  originalConsoleWarn.apply(console, args);
                };
              })();
            `,
                }}
            />
        </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <WorkspaceProvider>
              <PromptsProvider>
                <CountsProvider>
                  <DataPreloader>
                    <ClientLayout>{children}</ClientLayout>
                  </DataPreloader>
                </CountsProvider>
              </PromptsProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
        </html>
    )
}

