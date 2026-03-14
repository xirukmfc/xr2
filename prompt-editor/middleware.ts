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

function getLocaleByDomain(host: string): 'en' | 'ru' | null {
  if (host.includes('xr2.site')) return 'ru'
  if (host.includes('xr2.uk')) return 'en'
  return null // localhost or unknown — use fallback detection
}

function getPreferredLocale(request: NextRequest): 'en' | 'ru' {
  // 1. Check cookie (user's previous choice)
  const localeCookie = request.cookies.get('locale')?.value
  if (localeCookie === 'en' || localeCookie === 'ru') {
    return localeCookie
  }

  // 2. Check Accept-Language header
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
  const host = request.headers.get('host') || ''

  // Public routes that don't require authentication
  const publicRoutes = ['/login']

  // Check if it's a public share route
  if (pathname.startsWith('/share/')) {
    return NextResponse.next()
  }

  // Determine locale: domain-fixed or fallback for localhost
  const domainLocale = getLocaleByDomain(host)

  // Handle root path - rewrite to localized landing
  if (pathname === '/') {
    const locale = domainLocale || getPreferredLocale(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}`

    // For bots on localhost: rewrite to /en without redirect (for SEO)
    if (!domainLocale && isBot(request.headers.get('user-agent') || '')) {
      url.pathname = '/en'
    }

    return NextResponse.rewrite(url)
  }

  // On production domains: handle locale paths
  if (domainLocale && (pathname === '/en' || pathname === '/ru')) {
    const requestedLocale = pathname.slice(1) // 'en' or 'ru'

    // Cross-domain redirect: wrong locale for this domain
    if (requestedLocale !== domainLocale) {
      // xr2.uk/ru → xr2.site, xr2.site/en → xr2.uk
      const targetDomain = requestedLocale === 'ru' ? 'https://xr2.site' : 'https://xr2.uk'
      return NextResponse.redirect(targetDomain, 301)
    }

    // Same locale as domain: just redirect to / (clean URL)
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url, 301)
  }

  // Allow /en and /ru landing pages (localhost only)
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
    '/((?!api|og|_next/static|_next/image|favicon.ico).*)',
  ],
}
