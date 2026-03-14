import type React from "react"
import type {Metadata} from "next"
import { Inter, Lato, JetBrains_Mono } from "next/font/google"

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" })
const lato = Lato({ weight: ["400", "700", "900"], subsets: ["latin", "latin-ext"], variable: "--font-lato", display: "swap" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-jetbrains" })
import {ThemeProvider} from "next-themes"
import Script from "next/script"
import {headers} from "next/headers"
import ClientLayout from "./client-layout"
import {PromptsProvider} from '@/components/prompts-context'
import {WorkspaceProvider} from "@/components/workspace-context"
import {CountsProvider} from '@/components/counts-context'
import {AuthProvider} from "@/contexts/auth-context"
import {LocaleProvider} from "@/contexts/locale-context"
import {DataPreloader} from "@/lib/preload-data"
import "./globals.css"

const GA_IDS: Record<string, string> = {
    'xr2.uk': 'G-GE84ZPSP20',
    'xr2.site': 'G-QWEELD19D3',
}

export const metadata: Metadata = {
    title: "Prompt manager",
    description: "Advanced prompt editor for AI workflows",
    generator: "xR2",
    icons: {
        icon: "/favicon.ico",
    },
}

export default async function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    const headersList = await headers()
    const host = headersList.get('host') || 'xr2.uk'
    const isRussian = host.includes('xr2.site')
    const gaId = isRussian ? GA_IDS['xr2.site'] : GA_IDS['xr2.uk']
    const serverLocale = isRussian ? 'ru' : 'en'

    return (
        <html lang={serverLocale} suppressHydrationWarning className={`${inter.variable} ${lato.variable} ${jetbrainsMono.variable}`}>
        <head suppressHydrationWarning />
      <body suppressHydrationWarning>
        {/* Google Analytics */}
        <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
        />
        <Script
            id="google-analytics"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
            }}
        />
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
          <LocaleProvider initialLocale={serverLocale}>
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

