"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/notification-provider"
import { Sidebar, useSidebarCollapse } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { usePathname } from "next/navigation"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isEditorPage = pathname.startsWith("/editor/")
  const isLoginPage = pathname === "/login"
  const isLandingPage = pathname === "/"
  const isSharePage = pathname.startsWith("/share/")
  const isSidebarCollapsed = useSidebarCollapse()

  // If it's the login page, landing page, or share page, don't show sidebar and render full width
  if (isLoginPage || isLandingPage || isSharePage) {
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
