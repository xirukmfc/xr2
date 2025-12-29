import type React from "react"
import type {Metadata} from "next"
import {GeistSans} from "geist/font/sans"
import {GeistMono} from "geist/font/mono"
import {ThemeProvider} from "next-themes"
import Script from "next/script"
import ClientLayout from "./client-layout"
import {PromptsProvider} from '@/components/prompts-context'
import {WorkspaceProvider} from "@/components/workspace-context"
import {CountsProvider} from '@/components/counts-context'
import {AuthProvider} from "@/contexts/auth-context"
import {LocaleProvider} from "@/contexts/locale-context"
import {DataPreloader} from "@/lib/preload-data"
import "./globals.css"

export const metadata: Metadata = {
    title: "Prompt manager",
    description: "Advanced prompt editor for AI workflows",
    generator: "xR2",
    icons: {
        icon: "/favicon.ico",
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <head suppressHydrationWarning />
      <body suppressHydrationWarning>
        <Script
            id="error-handlers"
            strategy="afterInteractive"
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
                  if (event && event.reason) {
                    const reason = event.reason;

                    if (
                      (typeof reason === 'object' && reason !== null && reason.type === 'cancelation') ||
                      (typeof reason === 'string' && reason.includes('cancelation')) ||
                      (reason && typeof reason.message === 'string' && reason.message.includes('cancelation')) ||
                      (reason && typeof reason.msg === 'string' && reason.msg.includes('operation is manually canceled')) ||
                      (reason && typeof reason === 'object' && reason.name === 'Canceled') ||
                      (reason && typeof reason === 'object' && reason.code === 'Canceled') ||
                      (reason && reason.stack && reason.stack.includes('monaco-editor'))
                    ) {
                      event.preventDefault();
                      return;
                    }

                    if (reason && (
                      reason.toString() === '[object Object]' ||
                      (reason.constructor && reason.constructor.name === 'Object' && !reason.message)
                    )) {
                      event.preventDefault();
                      return;
                    }
                  }
                } catch (err) {
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
                    return;
                  }
                  if (message.includes('preloaded using link preload but not used')) {
                    return;
                  }
                  originalConsoleError.apply(console, args);
                };

                console.warn = function(...args) {
                  const message = args.join(' ');
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <LocaleProvider>
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
          </LocaleProvider>
        </ThemeProvider>
      </body>
        </html>
    )
}

