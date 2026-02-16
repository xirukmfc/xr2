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
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {locale === 'ru' ? 'Страница не найдена' : 'Page not found'}
          </h1>
          <p className="text-gray-500 mb-6">
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

  // Landing page context: full 404 page
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-6 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <Link href={`/${locale}`}>
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  {locale === 'ru' ? 'На главную' : 'Home'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Number */}
          <div className="relative mb-8">
            <span className="text-[180px] sm:text-[240px] font-bold text-gray-100 leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E63355] to-[#c42847] rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-4xl">?</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {locale === 'ru' ? 'Страница не найдена' : 'Page not found'}
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
            {locale === 'ru'
              ? 'Похоже, страница, которую вы ищете, не существует или была перемещена.'
              : 'The page you are looking for doesn\'t exist or has been moved.'}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {locale === 'ru' ? 'Назад' : 'Go back'}
            </Button>
            <Link href={`/${locale}`}>
              <Button size="lg">
                <Home className="h-4 w-4 mr-2" />
                {locale === 'ru' ? 'На главную' : 'Home'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-6 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="xR2" width={40} height={16} className="h-4 w-auto opacity-50" />
              <span>© 2025</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href={`/${locale}/legal/privacy`} className="hover:text-gray-600 transition-colors">
                {locale === 'ru' ? 'Конфиденциальность' : 'Privacy'}
              </Link>
              <Link href={`/${locale}/legal/terms`} className="hover:text-gray-600 transition-colors">
                {locale === 'ru' ? 'Условия' : 'Terms'}
              </Link>
              <a href="https://docs.xr2.uk" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
                {locale === 'ru' ? 'Документация' : 'Docs'}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
