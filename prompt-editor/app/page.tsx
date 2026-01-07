"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  FlaskConical,
  Check,
  LineChart,
  Menu,
  X,
  Zap,
  History,
  BarChart3,
  RefreshCcw
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { t, locale, setLocale } = useLocale()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/prompts")
    }
  }, [router, isAuthenticated, isLoading])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ru' : 'en')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto" />
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  const features = [
    { titleKey: "landing.features.noDevDependency.title", descKey: "landing.features.noDevDependency.description", icon: Zap },
    { titleKey: "landing.features.safeToExperiment.title", descKey: "landing.features.safeToExperiment.description", icon: RefreshCcw },
    { titleKey: "landing.features.comparePerformance.title", descKey: "landing.features.comparePerformance.description", icon: History },
    { titleKey: "landing.features.customMetrics.title", descKey: "landing.features.customMetrics.description", icon: BarChart3 }
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-6 w-auto" />
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t('landing.nav.features')}</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t('landing.nav.pricing')}</a>
              <Link href="/docs" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t('landing.nav.docs')}</Link>
              <button
                onClick={toggleLanguage}
                className="text-xl px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                title={locale === 'en' ? 'Переключить на русский' : 'Switch to English'}
              >
                {locale === 'en' ? '🇬🇧' : '🇷🇺'}
              </button>
              <Button onClick={() => router.push("/login")} className="font-medium px-5">{t('landing.nav.signIn')}</Button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="text-xl px-2 py-1"
                title={locale === 'en' ? 'Переключить на русский' : 'Switch to English'}
              >
                {locale === 'en' ? '🇬🇧' : '🇷🇺'}
              </button>
              <button
                className="p-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-6 py-4 space-y-4">
              <a href="#features" className="block text-gray-600 hover:text-gray-900 py-2 font-medium">{t('landing.nav.features')}</a>
              <a href="#pricing" className="block text-gray-600 hover:text-gray-900 py-2 font-medium">{t('landing.nav.pricing')}</a>
              <Link href="/docs" className="block text-gray-600 hover:text-gray-900 py-2 font-medium">{t('landing.nav.docs')}</Link>
              <div className="pt-4">
                <Button onClick={() => router.push("/login")} className="w-full">{t('landing.nav.getStartedFree')}</Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#E63355]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-slate-200/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-gray-100 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm mb-6 font-medium border border-slate-200/50 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#E63355] animate-pulse"></span>
              {t('landing.hero.badge')}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              {t('landing.hero.titleStart')}{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-[#E63355] via-[#ff6b6b] to-[#E63355] bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] bg-clip-text text-transparent">
                  {t('landing.hero.titleAccent')}
                </span>
              </span>
            </h1>

            <p className="text-xl text-gray-500 mb-8 max-w-xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <Button
                onClick={() => router.push("/login")}
                size="lg"
                className="w-full sm:w-auto font-medium px-8 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 transition-all hover:-translate-y-0.5"
              >
                {t('landing.hero.cta')}
              </Button>
            </div>

            <p className="text-sm text-gray-400">
              {t('landing.hero.differentiator')} <span className="text-gray-600">{t('landing.hero.differentiatorAccent')}</span>
            </p>
          </div>

          {/* Dashboard Preview - Full Version */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-b from-gray-100/50 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl shadow-gray-200/50">
                {/* Browser Chrome */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded-lg px-4 py-1.5 text-xs text-gray-400 flex items-center gap-2 border border-gray-100">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      xr2.uk/prompts
                    </div>
                  </div>
                </div>

                <div className="flex">
                  {/* Sidebar */}
                  <div className="hidden lg:flex flex-col w-56 border-r border-gray-200 bg-white">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">Alex Johnson</div>
                        <div className="text-xs text-slate-500 truncate">alex@company.com</div>
                      </div>
                    </div>
                    <nav className="flex-1 py-2">
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 text-slate-900 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Prompts
                        <span className="ml-auto px-1.5 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">12</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2.5 text-slate-600 text-sm">
                        <LineChart className="w-4 h-4" />
                        Analytics
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2.5 text-slate-600 text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        API Keys
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2.5 text-slate-600 text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </div>
                    </nav>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col min-h-[300px] md:min-h-[400px]">
                    {/* Filters Bar - Desktop */}
                    <div className="hidden md:block px-4 py-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative w-full max-w-[140px]">
                            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" placeholder="Search..." className="w-full pl-6 pr-2 py-1 text-xs border border-slate-200 rounded-md bg-white" readOnly aria-label="Search prompts" />
                          </div>
                          <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
                            <button className="px-2 py-1 text-xs font-medium rounded bg-white text-slate-800 shadow-sm">All</button>
                            <button className="px-2 py-1 text-xs font-medium rounded text-slate-600">Active</button>
                            <button className="px-2 py-1 text-xs font-medium rounded text-slate-600">Draft</button>
                          </div>
                        </div>
                        <button className="px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md flex items-center gap-1">+ New Prompt</button>
                        <select className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-600">
                          <option>Last Updated</option>
                        </select>
                      </div>
                    </div>

                    {/* Filters Bar - Mobile */}
                    <div className="md:hidden px-3 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
                        <button className="px-2 py-1 text-xs font-medium rounded bg-white text-slate-800 shadow-sm">All</button>
                        <button className="px-2 py-1 text-xs font-medium rounded text-slate-600">Active</button>
                      </div>
                      <button className="px-2 py-1 bg-slate-900 text-white text-xs font-medium rounded-md">+ New</button>
                    </div>

                    {/* Table Header - Desktop only */}
                    <div className="hidden md:block bg-slate-50 px-4 py-3 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        <div className="col-span-1 flex items-center">
                          <input type="checkbox" className="rounded border-slate-300" readOnly aria-label="Select all prompts" />
                        </div>
                        <div className="col-span-4">Name</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Updated</div>
                        <div className="col-span-1">Usage</div>
                        <div className="col-span-2">Owner</div>
                      </div>
                    </div>

                    {/* Table Rows - Desktop */}
                    <div className="hidden md:block divide-y divide-slate-100">
                      {[
                        { name: "onboarding-welcome", status: "active", tags: [{name: "onboarding", color: "#10b981"}, {name: "core", color: "#6366f1"}], updated: "2 hours ago", updatedBy: "Alex", usage: "12,847", owner: "Alex Johnson" },
                        { name: "upgrade-cta", status: "active", tags: [{name: "conversion", color: "#f59e0b"}], updated: "5 hours ago", updatedBy: "Sarah", usage: "3,241", owner: "Sarah Chen" },
                        { name: "support-response", status: "draft", tags: [{name: "support", color: "#ec4899"}], updated: "1 day ago", updatedBy: "Mike", usage: "8,102", owner: "Mike Wilson" },
                        { name: "product-description", status: "active", tags: [{name: "content", color: "#8b5cf6"}], updated: "3 days ago", updatedBy: "Alex", usage: "5,439", owner: "Alex Johnson" },
                        { name: "checkout-assistant", status: "active", tags: [{name: "sales", color: "#0ea5e9"}], updated: "4 days ago", updatedBy: "Sarah", usage: "2,156", owner: "Sarah Chen" },
                      ].map((prompt, i) => (
                        <div key={i} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-1">
                              <input type="checkbox" className="rounded border-slate-300" readOnly aria-label={`Select ${prompt.name}`} />
                            </div>
                            <div className="col-span-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${prompt.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-800 text-sm truncate">{prompt.name}</div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {prompt.tags.map((tag, j) => (
                                      <span
                                        key={j}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs border"
                                        style={{
                                          backgroundColor: `${tag.color}15`,
                                          color: tag.color,
                                          borderColor: `${tag.color}30`
                                        }}
                                      >
                                        {tag.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                                prompt.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {prompt.status.charAt(0).toUpperCase() + prompt.status.slice(1)}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <div className="text-sm text-slate-800">{prompt.updated}</div>
                              <div className="text-xs text-slate-500">by {prompt.updatedBy}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-sm font-medium text-slate-800">{prompt.usage}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-200 rounded-full flex-shrink-0" />
                                <span className="text-sm text-slate-700 truncate">{prompt.owner}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cards - Mobile only */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {[
                        { name: "onboarding-welcome", status: "active", tags: [{name: "onboarding", color: "#10b981"}, {name: "core", color: "#6366f1"}], updated: "2h ago", usage: "12,847" },
                        { name: "upgrade-cta", status: "active", tags: [{name: "conversion", color: "#f59e0b"}], updated: "5h ago", usage: "3,241" },
                        { name: "support-response", status: "draft", tags: [{name: "support", color: "#ec4899"}], updated: "1d ago", usage: "8,102" },
                        { name: "checkout-assistant", status: "active", tags: [{name: "sales", color: "#0ea5e9"}], updated: "4d ago", usage: "2,156" },
                      ].map((prompt, i) => (
                        <div key={i} className="px-3 py-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${prompt.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <div className="min-w-0">
                                <div className="font-medium text-slate-800 text-sm">{prompt.name}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  {prompt.tags.map((tag, j) => (
                                    <span key={j} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: `${tag.color}15`, color: tag.color }}>
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                              prompt.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {prompt.status === 'active' ? 'Active' : 'Draft'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 pl-4">
                            <span>{prompt.updated}</span>
                            <span>{prompt.usage} calls</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Attribution */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('landing.revenue.title')}</h2>
            <div className="space-y-2">
              <p className="text-gray-500">{t('landing.revenue.subtitle')}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Revenue Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-slate-600" />
                  <span className="text-slate-800 font-semibold">{t('landing.revenue.revenueByPrompt')}</span>
                </div>
                <span className="text-gray-400 text-sm">{t('landing.revenue.last7days')}</span>
              </div>

              <div className="space-y-4">
                {[
                  { name: "onboarding-welcome", revenue: "$12,450", pct: 100 },
                  { name: "upgrade-cta", revenue: "$8,320", pct: 67 },
                  { name: "checkout-helper", revenue: "$4,180", pct: 34 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-gray-600 text-sm">{item.name}</span>
                      <span className="text-gray-800 text-sm font-semibold">{item.revenue}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-slate-700 h-2 rounded-full" style={{width: `${item.pct}%`}} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-gray-400 text-sm">3 {t('landing.revenue.promptsTracked')}</span>
                <div className="text-xl font-bold text-emerald-600">$24,950</div>
              </div>
            </div>

            {/* A/B Test Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-slate-600" />
                  <span className="text-slate-800 font-semibold">{t('landing.revenue.abTestResults')}</span>
                </div>
                <span className="text-[#E63355] text-sm font-semibold bg-red-50 px-3 py-1 rounded-full">+23%</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-gray-600 text-sm">{t('landing.revenue.variantA')}</span>
                    <span className="text-gray-500 text-sm">45%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{width: '45%'}} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 text-sm">{t('landing.revenue.variantB')}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{t('landing.revenue.winner')}</span>
                    </div>
                    <span className="text-emerald-600 text-sm font-semibold">68%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{width: '68%'}} />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-gray-400 text-sm">95% {t('landing.revenue.confidence')}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 text-sm text-gray-500 text-center max-w-3xl mx-auto">
            {t('landing.revenue.howItWorks')}
          </div>

        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
            {t('landing.features.title')}
          </h2>
          <p className="text-lg text-gray-500 text-center mb-16">{t('landing.features.subtitle')}</p>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 flex gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-[#E63355] to-[#c42847] rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-gray-500">{t(feature.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solo / Automation Users + Integrations */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-12">
            <div className="text-center mb-10">
              <p className="text-sm text-slate-400 uppercase tracking-wide mb-3">{t('landing.integrations.badge')}</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('landing.integrations.title')}
              </h2>
              <p className="text-slate-300 mb-6 max-w-xl mx-auto">
                {t('landing.integrations.subtitle')}
              </p>
              <Button onClick={() => router.push("/login")} className="bg-white text-slate-900 hover:bg-slate-100">
                {t('landing.integrations.cta')}
              </Button>
            </div>

            <div className="border-t border-slate-700 pt-8">
              <p className="text-center text-sm text-slate-400 mb-6">{t('landing.integrations.worksWithYourStack')}</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                {/* Python */}
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-10 w-10 text-[#3776AB]" viewBox="0 0 256 255" fill="currentColor">
                    <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z"/>
                    <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z"/>
                  </svg>
                  <span className="text-xs text-slate-400">Python</span>
                </div>
                {/* Node.js */}
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-10 w-10 text-[#339933]" viewBox="0 0 256 289" fill="currentColor">
                    <path d="M128 288.464c-3.975 0-7.685-1.06-11.13-2.915l-35.247-20.936c-5.3-2.915-2.65-3.975-1.06-4.505 7.155-2.385 8.48-2.915 15.9-7.156.796-.53 1.856-.265 2.65.265l27.032 16.166c1.06.53 2.385.53 3.18 0l105.74-61.217c1.06-.53 1.59-1.59 1.59-2.915V83.08c0-1.325-.53-2.385-1.59-2.915l-105.74-60.953c-1.06-.53-2.385-.53-3.18 0L20.405 80.166c-1.06.53-1.59 1.855-1.59 2.915v122.17c0 1.06.53 2.385 1.59 2.915l28.887 16.695c15.636 7.95 25.44-1.325 25.44-10.6V93.68c0-1.59 1.326-3.18 3.181-3.18h13.516c1.59 0 3.18 1.325 3.18 3.18v120.58c0 20.936-11.396 33.126-31.272 33.126-6.095 0-10.865 0-24.38-6.625l-27.827-15.9C4.24 220.355 0 212.67 0 204.456V82.286C0 74.07 4.24 66.12 11.13 61.88L116.87.663c6.625-3.71 15.635-3.71 22.26 0L244.87 61.88c6.89 4.24 11.13 12.19 11.13 20.406v122.17c0 8.215-4.24 16.165-11.13 20.406l-105.74 61.217c-3.445 1.59-7.42 2.385-11.13 2.385z"/>
                  </svg>
                  <span className="text-xs text-slate-400">Node.js</span>
                </div>
                {/* n8n */}
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-10 w-20 text-[#EA4B71]" viewBox="0 0 49 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M47.9855 4.8C47.9855 7.45098 45.8365 9.6 43.1855 9.6C40.949 9.6 39.0696 8.0703 38.5368 6H31.8352C30.662 6 29.6607 6.84822 29.4678 8.00544L29.2706 9.18912C29.0832 10.313 28.5147 11.2911 27.7108 12C28.5147 12.7089 29.0832 13.687 29.2706 14.8109L29.4678 15.9946C29.6607 17.1518 30.662 18 31.8352 18H33.7368C34.2696 15.9297 36.149 14.4 38.3855 14.4C41.0365 14.4 43.1855 16.549 43.1855 19.2C43.1855 21.851 41.0365 24 38.3855 24C36.149 24 34.2696 22.4703 33.7368 20.4H31.8352C29.4888 20.4 27.4863 18.7036 27.1005 16.3891L26.9032 15.2054C26.7104 14.0482 25.7091 13.2 24.5359 13.2H22.5782C21.979 15.1681 20.1495 16.6 17.9855 16.6C15.8216 16.6 13.9921 15.1681 13.3929 13.2H10.5782C9.97901 15.1681 8.14949 16.6 5.98554 16.6C3.33458 16.6 1.18555 14.4509 1.18555 11.8C1.18555 9.14904 3.33458 7.00002 5.98554 7.00002C8.29361 7.00002 10.2212 8.62902 10.6812 10.8H13.2899C13.7499 8.62902 15.6775 7.00002 17.9855 7.00002C20.2936 7.00002 22.2212 8.62902 22.6812 10.8H24.5359C25.7091 10.8 26.7104 9.95178 26.9032 8.79456L27.1005 7.61088C27.4863 5.29638 29.4888 3.6 31.8352 3.6H38.5368C39.0696 1.52973 40.949 0 43.1855 0C45.8365 0 47.9855 2.14903 47.9855 4.8Z"/>
                  </svg>
                  <span className="text-xs text-slate-400">n8n</span>
                </div>
                {/* Make */}
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    <defs>
                      <linearGradient id="makeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF00FF"/><stop offset="100%" stopColor="#9333EA"/>
                      </linearGradient>
                      <linearGradient id="makeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A855F7"/><stop offset="100%" stopColor="#7C3AED"/>
                      </linearGradient>
                      <linearGradient id="makeGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6"/><stop offset="100%" stopColor="#6D28D9"/>
                      </linearGradient>
                    </defs>
                    <rect x="6" y="10" width="10" height="28" rx="3" fill="url(#makeGrad1)" transform="rotate(15 11 24)"/>
                    <rect x="19" y="10" width="10" height="28" rx="3" fill="url(#makeGrad2)" transform="rotate(8 24 24)"/>
                    <rect x="32" y="10" width="10" height="28" rx="3" fill="url(#makeGrad3)"/>
                  </svg>
                  <span className="text-xs text-slate-400">Make</span>
                </div>
                {/* Zapier */}
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-10 w-10 text-[#FF4A00]" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M128.08 0c7.23 0 14.34.61 21.26 1.78v74.52l52.83-52.7c5.84 4.15 11.3 8.76 16.34 13.79 5.05 5.03 9.69 10.49 13.84 16.31l-52.83 52.7h74.71c1.16 6.89 1.77 13.96 1.77 21.19v.17c0 7.23-.61 14.31-1.77 21.2h-74.73l52.85 52.68c-4.15 5.82-8.79 11.28-13.82 16.31l-.02.01c-5.05 5.03-10.52 9.66-16.32 13.79l-52.85-52.7v74.52c-6.9 1.16-14 1.77-21.24 1.78h-.19c-7.23-.01-14.32-.62-21.23-1.78v-74.52l-52.83 52.7c-11.67-8.28-21.87-18.47-30.18-30.1l52.83-52.68H1.78c-1.17-6.91-1.78-14.01-1.78-21.24v-.37c.01-1.88.13-4.17.31-6.54l.05-.71c.52-6.67 1.42-13.7 1.42-13.7h74.71L23.67 53.7c4.14-5.82 8.76-11.26 13.81-16.29l.02-.02c5.04-5.03 10.51-9.64 16.35-13.79l52.83 52.7V1.78c6.91-1.16 14-1.77 21.25-1.78h.15zM128.07 95.76h-.12c-9.51 0-18.62 1.74-27.04 4.9-3.15 8.38-4.9 17.47-4.91 26.95v.12c.01 9.48 1.76 18.57 4.93 26.95 8.41 3.16 17.51 4.9 27.02 4.9h.12c9.51 0 18.62-1.74 27.02-4.9 3.17-8.4 4.92-17.47 4.92-26.95v-.12c0-9.48-1.75-18.57-4.92-26.95-8.4-3.16-17.51-4.9-27.02-4.9z"/>
                  </svg>
                  <span className="text-xs text-slate-400">Zapier</span>
                </div>
                {/* REST API */}
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                  <span className="text-xs text-slate-400">REST API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-gray-500 text-center mb-12">{t('landing.pricing.subtitle')}</p>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Free */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="text-gray-500 text-sm font-medium mb-1">{t('landing.pricing.free.name')}</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-gray-900">{t('landing.pricing.free.price')}</span>
                <span className="text-gray-400 text-sm">{t('landing.pricing.free.period')}</span>
              </div>

              <ul className="space-y-2.5 mb-6 text-sm">
                {(locale === 'ru' ? ['До 10 промптов', '100 API запросов/мес', 'Базовая аналитика', '1 workspace'] : ['Up to 10 prompts', '100 API calls/month', 'Basic analytics', '1 workspace']).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <Check className="h-4 w-4 text-gray-400" />{f}
                  </li>
                ))}
              </ul>

              <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
                {t('landing.pricing.free.cta')}
              </Button>
            </div>

            {/* Pro */}
            <div className="relative bg-white rounded-xl p-6 border-2 border-[#E63355] shadow-lg">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-[#E63355] text-white rounded-full text-xs font-medium">
                {t('landing.pricing.pro.popular')}
              </div>

              <div className="text-gray-500 text-sm font-medium mb-1">{t('landing.pricing.pro.name')}</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-gray-900">{t('landing.pricing.pro.price')}</span>
                <span className="text-gray-400 text-sm">{t('landing.pricing.pro.period')}</span>
              </div>

              <ul className="space-y-2.5 mb-6 text-sm">
                {(locale === 'ru' ? ['Безлимит промптов', '1 000 API запросов/мес', 'A/B тесты и выручка', 'Безлимит workspaces', 'Командная работа'] : ['Unlimited prompts', '1,000 API calls/month', 'A/B testing & revenue tracking', 'Unlimited workspaces', 'Team collaboration']).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <Check className="h-4 w-4 text-[#E63355]" />{f}
                  </li>
                ))}
              </ul>

              <Button onClick={() => router.push("/login")} className="w-full bg-[#E63355] hover:bg-[#d42d4d]">
                {t('landing.pricing.pro.cta')}
              </Button>
            </div>

            {/* Enterprise */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="text-gray-500 text-sm font-medium mb-1">{t('landing.pricing.enterprise.name')}</div>
              <div className="text-2xl font-bold text-gray-900 mb-4">{t('landing.pricing.enterprise.price')}</div>

              <ul className="space-y-2.5 mb-6 text-sm">
                {(locale === 'ru' ? ['SSO и SAML', 'Выделенная поддержка', 'Кастомные интеграции', 'SLA'] : ['SSO & SAML', 'Dedicated support', 'Custom integrations', 'SLA']).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <Check className="h-4 w-4 text-gray-400" />{f}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full" onClick={() => window.location.href = 'mailto:hello@xr2.uk'}>
                {t('landing.pricing.enterprise.cta')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <Button onClick={() => router.push("/login")} size="lg" className="font-medium px-8">
            {t('landing.cta.button')}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm">
            <Link href="/docs" className="text-gray-500 hover:text-gray-900">{t('landing.footer.docs')}</Link>
            <a href="#pricing" className="text-gray-500 hover:text-gray-900">{t('landing.footer.pricing')}</a>
            <a href="mailto:hello@xr2.uk" className="text-gray-500 hover:text-gray-900">{t('landing.footer.contact')}</a>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} xR2
          </p>
        </div>
      </footer>
    </div>
  )
}
