import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login']

  // Check if it's a public share route
  if (pathname.startsWith('/share/')) {
    return NextResponse.next()
  }

  // Root route - handled by page component
  if (pathname === '/') {
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