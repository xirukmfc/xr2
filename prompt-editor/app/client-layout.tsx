"use client"

import type React from "react"
import dynamic from "next/dynamic"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/notification-provider"
import { useSidebarCollapse } from "@/lib/sidebar-state"
import { usePathname } from "next/navigation"

const Sidebar = dynamic(() => import("@/components/sidebar").then(mod => ({ default: mod.Sidebar })), { ssr: false })
const AuthGuard = dynamic(() => import("@/components/auth-guard").then(mod => ({ default: mod.AuthGuard })), { ssr: false })

// Routes that require authentication and show sidebar
const PROTECTED_ROUTES = [
  '/prompts',
  '/editor',
  '/analytics',
  '/api-keys',
  '/settings',
  '/logs',
  '/docs',
]

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isEditorPage = pathname.startsWith("/editor/")
  const isSidebarCollapsed = useSidebarCollapse()

  // Check if current path is a protected route (requires auth + sidebar)
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Protected routes: show sidebar and require authentication
  if (isProtectedRoute) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <NotificationProvider>
          <AuthGuard>
            <div className="h-screen bg-white flex">
              <Sidebar />
              <div
                className={`flex-1 flex flex-col transition-all duration-300 ${
                  isEditorPage ? "" : isSidebarCollapsed ? "ml-16" : "ml-64"
                }`}
              >
                {children}
              </div>
            </div>
          </AuthGuard>
        </NotificationProvider>
      </ThemeProvider>
    )
  }

  // Public routes: no sidebar, no auth required (landing, login, legal, share, 404, etc.)
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <NotificationProvider>
        <div className="min-h-screen bg-white">
          {children}
        </div>
      </NotificationProvider>
    </ThemeProvider>
  )
}
