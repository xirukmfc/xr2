"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import { useLocale } from "@/contexts/locale-context"
import { usePathname } from "next/navigation"

// Routes that are part of the app (not landing page)
const APP_ROUTES = ['/prompts', '/editor', '/analytics', '/api-keys', '/settings', '/logs', '/docs']

export default function NotFound() {
  const { locale } = useLocale()
  const pathname = usePathname()

  // Check if we're in the app context (portal) vs landing page
  const isAppContext = APP_ROUTES.some(route => pathname?.startsWith(route))

  // App context: simple 404 without landing page elements
  if (isAppContext) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl font-bold text-secondary mb-4">404</div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {locale === 'ru' ? 'Страница не найдена' : 'Page not found'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {locale === 'ru'
              ? 'Запрашиваемая страница не существует.'
              : 'The requested page does not exist.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {locale === 'ru' ? 'Назад' : 'Back'}
            </Button>
            <Link href="/prompts">
              <Button size="sm">
                <Home className="h-4 w-4 mr-1.5" />
                {locale === 'ru' ? 'К промптам' : 'Go to Prompts'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const en = locale === 'en'
  const docsUrl = typeof window !== 'undefined' && window.location.hostname.includes('xr2.site') ? '/documentation/' : 'https://docs.xr2.uk'

  // Landing page context: full 404 page
  return (
    <div className="min-h-screen bg-background">
      {/* Header — pill-shaped nav (same as landing) */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 md:px-6 md:pt-5">
        <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-full border border-border/50 bg-card/90 backdrop-blur-lg px-4 py-2.5 shadow-sm md:px-6 md:py-3">
          <Link href={`/${locale}`} className="flex items-center z-50">
            <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-4 w-auto md:hidden" />
            <Image src="/tagline.svg" alt="xR2 — Prompt Management" width={250} height={30} className="h-5 w-auto hidden md:block dark:invert" />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link href={`/${locale}`} className="px-3 py-1.5 text-sm rounded-full transition-colors text-muted-foreground hover:text-foreground">
              {en ? 'Home' : 'Главная'}
            </Link>
            <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm rounded-full transition-colors text-muted-foreground hover:text-foreground">
              {en ? 'Docs' : 'Документация'}
            </a>
            <Link href="/login" className="ml-2 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
              {en ? 'Sign In' : 'Войти'}
            </Link>
          </div>

          <Link href={`/${locale}`} className="md:hidden rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
            {en ? 'Home' : 'Главная'}
          </Link>
        </nav>
      </header>

      {/* Content */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Number */}
          <div className="relative mb-8">
            <span className="text-[180px] sm:text-[240px] font-bold text-secondary leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E63355] to-[#c42847] rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-4xl">?</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {en ? 'Page not found' : 'Страница не найдена'}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            {en
              ? 'The page you are looking for doesn\'t exist or has been moved.'
              : 'Похоже, страница, которую вы ищете, не существует или была перемещена.'}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {en ? 'Go back' : 'Назад'}
            </Button>
            <Link href={`/${locale}`}>
              <Button size="lg" className="rounded-full bg-foreground text-background hover:opacity-90">
                <Home className="h-4 w-4 mr-2" />
                {en ? 'Home' : 'На главную'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer (same as landing) */}
      <footer className="bg-card">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between mb-10">
            <div>
              <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-6 w-auto mb-3" />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {en ? 'Prompt management platform for AI teams.' : 'Платформа управления промптами для AI-команд.'}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <a href="https://github.com/xirukmfc/n8n-nodes-xr2" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground" aria-label="GitHub">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <a href="https://www.linkedin.com/company/xr2-prompt-management/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground" aria-label="LinkedIn">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://www.producthunt.com/products/xr2-prompt-manager" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Product Hunt">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 0 0 0-3.6zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804a4.2 4.2 0 0 1 0 8.4z"/></svg>
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-12 md:gap-16 md:ml-auto">
              <div>
                <p className="text-sm font-semibold mb-3">{en ? 'Product' : 'Продукт'}</p>
                <div className="space-y-2.5">
                  <Link href={`/${locale}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{en ? 'Home' : 'Главная'}</Link>
                  <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{en ? 'Docs' : 'Документация'}</a>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-3">{en ? 'Company' : 'Компания'}</p>
                <div className="space-y-2.5">
                  <Link href="/legal/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{en ? 'Privacy' : 'Конфиденциальность'}</Link>
                  <Link href="/legal/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{en ? 'Terms' : 'Условия'}</Link>
                  <Link href="/legal/cookies" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{en ? 'Cookies' : 'Cookies'}</Link>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-3">{en ? 'Contact' : 'Контакты'}</p>
                <div className="space-y-2.5">
                  <a href="mailto:hello@xr2.uk" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">hello@xr2.uk</a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} xR2. {en ? 'All rights reserved.' : 'Все права защищены.'}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
