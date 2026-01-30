import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Bot detection patterns
const BOT_PATTERNS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'applebot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'petalbot',
  'bytespider',
]

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return BOT_PATTERNS.some(bot => ua.includes(bot))
}

function getPreferredLocale(request: NextRequest): 'en' | 'ru' {
  // 1. Check cookie (user's previous choice)
  const localeCookie = request.cookies.get('locale')?.value
  if (localeCookie === 'en' || localeCookie === 'ru') {
    return localeCookie
  }

  // 2. Check Cloudflare geo header
  const country = request.headers.get('cf-ipcountry')
  if (country) {
    const russianSpeakingCountries = ['RU', 'BY', 'KZ', 'UA', 'KG', 'TJ', 'UZ', 'TM', 'AZ', 'AM', 'MD', 'GE']
    if (russianSpeakingCountries.includes(country.toUpperCase())) {
      return 'ru'
    }
  }

  // 3. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].trim().toLowerCase())
    for (const lang of languages) {
      if (lang.startsWith('ru')) {
        return 'ru'
      }
      if (lang.startsWith('en')) {
        return 'en'
      }
    }
  }

  // Default to English
  return 'en'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login']

  // Check if it's a public share route
  if (pathname.startsWith('/share/')) {
    return NextResponse.next()
  }

  // Handle root path - redirect to localized landing
  if (pathname === '/') {
    const userAgent = request.headers.get('user-agent') || ''

    // For bots: rewrite to /en without redirect (for SEO)
    if (isBot(userAgent)) {
      const url = request.nextUrl.clone()
      url.pathname = '/en'
      return NextResponse.rewrite(url)
    }

    // For users: redirect to preferred locale
    const locale = getPreferredLocale(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}`
    return NextResponse.redirect(url)
  }

  // Allow /en and /ru landing pages
  if (pathname === '/en' || pathname === '/ru') {
    return NextResponse.next()
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Since token is stored in localStorage (client-side), we can't check it in middleware
  // The authentication will be handled by AuthGuard component on the client side
  // This middleware mainly handles routing for known public routes

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
