
"use client"

import { MessageSquare, Activity, Key, FileText, Users, Settings, User, LogOut, Zap, AlertTriangle, BarChart3, BookOpen } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useCountsContext } from "@/components/counts-context"
import { useAuth } from "@/contexts/auth-context"
import { UserLimitsDisplay } from "@/components/user-limits-display"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { getUserLimits } from "@/lib/api"
import { useDataPreloader } from "@/lib/preload-data"
import { useLocale } from "@/contexts/locale-context"

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

let sidebarCollapseListeners: ((collapsed: boolean) => void)[] = []

function getStoredCollapseState(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
  return stored === 'true'
}

function saveCollapseState(collapsed: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
}

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Initialize from localStorage
    setIsCollapsed(getStoredCollapseState())
    
    const listener = (collapsed: boolean) => setIsCollapsed(collapsed)
    sidebarCollapseListeners.push(listener)

    return () => {
      sidebarCollapseListeners = sidebarCollapseListeners.filter((l) => l !== listener)
    }
  }, [])

  return isCollapsed
}

function notifySidebarCollapse(collapsed: boolean) {
  saveCollapseState(collapsed)
  sidebarCollapseListeners.forEach((listener) => listener(collapsed))
}

interface UserLimits {
  user_id: string
  username: string
  is_superuser: boolean
  limits: {
    is_superuser: boolean
    prompts: {
      current: number
      max: number
      can_create: boolean
    }
    api_requests: {
      current: number
      max: number
      can_request: boolean
      reset_time: string
    }
  }
}

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { promptsCount, apiKeysCount } = useCountsContext()
  const { user, logout, isAuthenticated } = useAuth()
  const { preloadPageData } = useDataPreloader()
  const [limits, setLimits] = useState<UserLimits | null>(null)
  const [limitsLoading, setLimitsLoading] = useState(true)
  const { locale, setLocale, t } = useLocale()

  // Initialize collapse state from localStorage
  useEffect(() => {
    const stored = getStoredCollapseState()
    setIsCollapsed(stored)
    // Notify listeners so that main content area adjusts
    sidebarCollapseListeners.forEach((listener) => listener(stored))
  }, [])

  // Fetch user limits
  useEffect(() => {
    const fetchLimits = async () => {
      if (!isAuthenticated) {
        console.log('[Sidebar] User not authenticated, skipping limits fetch')
        return
      }
      
      try {
        console.log('[Sidebar] Fetching user limits...')
        setLimitsLoading(true)
        const data = await getUserLimits()
        console.log('[Sidebar] Limits data received:', data)
        setLimits(data)
      } catch (err) {
        console.error('[Sidebar] Error fetching limits:', err)
      } finally {
        setLimitsLoading(false)
        console.log('[Sidebar] Limits loading finished')
      }
    }

    fetchLimits()
  }, [isAuthenticated])

  // Debug tooltip visibility conditions
  useEffect(() => {
    console.log('[Sidebar] Tooltip conditions debug:', {
      limits: limits,
      limitsLoading: limitsLoading,
      isUserSuperuser: limits?.is_superuser,
      isLimitsSuperuser: limits?.limits?.is_superuser,
      shouldShowTooltip: limits && !limits.is_superuser && !limits.limits.is_superuser && !limitsLoading
    })
  }, [limits, limitsLoading])

  // Don't show sidebar on login page or if not authenticated
  if (pathname.startsWith("/editor/") || pathname === "/login" || !isAuthenticated) {
    return null
  }

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    notifySidebarCollapse(newCollapsedState)
  }

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ru' : 'en')
  }

  const navigationItems = [
    { name: t('sidebar.prompts'), href: "/prompts", icon: MessageSquare, count: promptsCount },
    { name: t('sidebar.analytics'), href: "/analytics", icon: BarChart3 },
    { name: t('sidebar.apiKeys'), href: "/api-keys", icon: Key, count: apiKeysCount },
    { name: t('sidebar.apiLogs'), href: "/logs", icon: FileText },
    { name: t('sidebar.settings'), href: "/settings", icon: Settings },
  ]

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 border-slate-200 border-b border-r-0 h-[65px] flex items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} w-full cursor-pointer`}>
                {isCollapsed ? (
                  <img
                    src="/logo-compact.svg"
                    alt="xR2"
                    className="h-8 w-8 flex-shrink-0"
                  />
                ) : (
                  <>
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {user?.full_name || user?.username || 'User'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{user?.email || 'PromptHub'}</div>
                    </div>
                  </>
                )}
              </div>
            </TooltipTrigger>
            {limits && !limits.is_superuser && !limits.limits.is_superuser && !limitsLoading && (
              <TooltipContent side="right" className="w-64">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-900">{t('sidebar.usageLimits')}</div>

                  {/* Prompts Limit */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{t('sidebar.availablePrompts')}</span>
                      <span className="text-slate-700 font-medium">
                        {limits.limits.prompts.current} / {limits.limits.prompts.max}
                      </span>
                    </div>
                    <Progress 
                      value={limits.limits.prompts.max > 0 ? (limits.limits.prompts.current / limits.limits.prompts.max) * 100 : 0} 
                      className="h-2"
                      indicatorClassName={
                        (limits.limits.prompts.current / limits.limits.prompts.max) >= 0.9 ? 'bg-red-300' : 
                        (limits.limits.prompts.current / limits.limits.prompts.max) >= 0.7 ? 'bg-amber-300' : 'bg-emerald-300'
                      }
                    />
                    <div className="text-xs text-slate-500">
                      {limits.limits.prompts.max - limits.limits.prompts.current} {t('sidebar.remaining')}
                    </div>
                  </div>

                  {/* API Requests Limit */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{t('sidebar.monthlyApiRequests')}</span>
                      <span className="text-slate-700 font-medium">
                        {limits.limits.api_requests.current} / {limits.limits.api_requests.max}
                      </span>
                    </div>
                    <Progress 
                      value={limits.limits.api_requests.max > 0 ? (limits.limits.api_requests.current / limits.limits.api_requests.max) * 100 : 0} 
                      className="h-2"
                      indicatorClassName={
                        (limits.limits.api_requests.current / limits.limits.api_requests.max) >= 0.9 ? 'bg-red-300' : 
                        (limits.limits.api_requests.current / limits.limits.api_requests.max) >= 0.7 ? 'bg-amber-300' : 'bg-emerald-300'
                      }
                    />
                    <div className="text-xs text-slate-500">
                      {t('sidebar.resetsAt')} {new Date(limits.limits.api_requests.reset_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href ||
                           (item.href === "/prompts" && pathname.startsWith("/prompts")) ||
                           (item.href === "/analytics" && pathname.startsWith("/analytics"))
            const Icon = item.icon

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center py-2.5 h-10 transition-colors group ${
                      !isCollapsed ? "!space-x-3 !px-5" : "justify-center"
                    } ${
                      isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  title={isCollapsed ? item.name : undefined}
                  onMouseEnter={() => preloadPageData(item.href)}
                >
                <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm">{item.name}</span>
                      {item.count !== undefined && (
                        <span className="ml-auto px-1.5 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Limits Display */}
      <div className="flex-shrink-0">
        <UserLimitsDisplay isCollapsed={isCollapsed} />
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className={`flex items-center p-2 rounded-md transition-colors group text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${
            isCollapsed
              ? "w-8 h-8 justify-center"
              : "w-full justify-start space-x-2"
          }`}
          title={locale === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
        >
          <span className="text-sm">
            {locale.toUpperCase()}
          </span>
        </button>
        {/* Full Docs Button */}
        <a
          href="https://xr2.gitbook.io/docs"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center p-2 rounded-md transition-colors group text-slate-600 hover:bg-blue-50 hover:text-blue-700 ${
            isCollapsed
              ? "w-8 h-8 justify-center"
              : "w-full justify-start space-x-2"
          }`}
          title="Full Documentation"
        >
          <BookOpen className="w-4 h-4" />
          {!isCollapsed && <span className="text-sm">{t('sidebar.fullDocs')}</span>}
        </a>
        {/* Logout Button */}
        <button
          onClick={() => logout()}
          className={`flex items-center p-2 rounded-md transition-colors group text-slate-600 hover:bg-red-50 hover:text-red-700 ${
            isCollapsed
              ? "w-8 h-8 justify-center"
              : "w-full justify-start space-x-2"
          }`}
          title={t('sidebar.logout')}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="text-sm">{t('sidebar.logout')}</span>}
        </button>
        <button
          onClick={handleToggleCollapse}
          className={`flex items-center justify-center p-2 rounded-md transition-colors group ${
            isCollapsed
              ? "w-8 h-8 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              : "w-full h-8 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
          title={isCollapsed ? "Expand sidebar" : t('sidebar.collapse')}
        >
          <div className="flex flex-col space-y-0.5">
            <div className="w-3 h-0.5 bg-current rounded"></div>
            <div className="w-3 h-0.5 bg-current rounded"></div>
            <div className="w-3 h-0.5 bg-current rounded"></div>
          </div>
          {!isCollapsed && <span className="ml-2 text-sm">{t('sidebar.collapse')}</span>}
        </button>
      </div>
    </div>
  )
}