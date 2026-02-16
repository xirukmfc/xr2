"use client"

import { useEffect, useState, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { Button } from "@/components/ui/button"
import {
  FlaskConical,
  Check,
  LineChart,
  Menu,
  X,
  Zap,
  History,
  BarChart3,
  RefreshCcw,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { apiClient } from "@/lib/api"

type SupportedLocale = 'en' | 'ru'

interface PricingPlan {
  plan_name: string
  price_display: string
  period_display: string
  features: string[]
}

const DEFAULT_PRICING: Record<string, Record<SupportedLocale, PricingPlan>> = {
  free: {
    en: { plan_name: 'free', price_display: '$0', period_display: '/month', features: ['Up to 10 prompts', '100 API calls/month', 'Basic analytics', '1 workspace'] },
    ru: { plan_name: 'free', price_display: '0\u20BD', period_display: '/\u043C\u0435\u0441', features: ['\u0414\u043E 10 \u043F\u0440\u043E\u043C\u043F\u0442\u043E\u0432', '100 API \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432/\u043C\u0435\u0441', '\u0411\u0430\u0437\u043E\u0432\u0430\u044F \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430', '1 workspace'] }
  },
  pro: {
    en: { plan_name: 'pro', price_display: '$19', period_display: '/month', features: ['Unlimited prompts', '1,000 API calls/month', 'A/B testing & revenue tracking', 'Unlimited workspaces', 'Team collaboration'] },
    ru: { plan_name: 'pro', price_display: '1500\u20BD', period_display: '/\u043C\u0435\u0441', features: ['\u0411\u0435\u0437\u043B\u0438\u043C\u0438\u0442 \u043F\u0440\u043E\u043C\u043F\u0442\u043E\u0432', '1 000 API \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432/\u043C\u0435\u0441', 'A/B \u0442\u0435\u0441\u0442\u044B \u0438 \u0432\u044B\u0440\u0443\u0447\u043A\u0430', '\u0411\u0435\u0437\u043B\u0438\u043C\u0438\u0442 workspaces', '\u041A\u043E\u043C\u0430\u043D\u0434\u043D\u0430\u044F \u0440\u0430\u0431\u043E\u0442\u0430'] }
  }
}

// Typewriter: lines with colored parts
const CODE_LINES = [
  { parts: [{ text: '# Before: prompt is stuck in code', cls: 'text-[#8b949e]' }] },
  { parts: [
    { text: 'prompt = ', cls: 'text-[#c9d1d9]' },
    { text: '"You are a helpful assistant..."', cls: 'text-[#a5d6ff]' },
  ] },
  { parts: [] as { text: string; cls: string }[] },
  { parts: [{ text: '# After: one call, always up to date', cls: 'text-[#7ee787]' }], highlight: true },
  { parts: [
    { text: 'prompt = ', cls: 'text-[#c9d1d9]' },
    { text: 'xr2', cls: 'text-[#d2a8ff]' },
    { text: '.', cls: 'text-[#c9d1d9]' },
    { text: 'get_prompt', cls: 'text-[#d2a8ff]' },
    { text: '(', cls: 'text-[#c9d1d9]' },
    { text: '"welcome-flow"', cls: 'text-[#a5d6ff]' },
    { text: ')', cls: 'text-[#c9d1d9]' },
  ], highlight: true },
]

// Precompute char offsets per line
const LINE_OFFSETS: number[] = []
let _off = 0
CODE_LINES.forEach((line, i) => {
  LINE_OFFSETS.push(_off)
  _off += line.parts.reduce((s, p) => s + p.text.length, 0)
  if (i < CODE_LINES.length - 1) _off++ // newline between lines
})
const TOTAL_CHARS = _off

function CodeTypewriter() {
  const [typed, setTyped] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started || typed >= TOTAL_CHARS) return
    const timer = setTimeout(() => setTyped(t => t + 1), 25)
    return () => clearTimeout(timer)
  }, [started, typed])

  const done = typed >= TOTAL_CHARS

  return (
    <div ref={ref} className="relative">
      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-[#30363d] shadow-2xl">
        <div className="flex items-center px-4 py-2.5 border-b border-[#30363d] bg-[#161b22]">
          <span className="text-xs text-[#8b949e] font-mono">app.py</span>
        </div>
        <pre className="p-5 font-mono text-[13px] leading-7 overflow-x-auto min-h-[180px]"><code>{CODE_LINES.map((line, li) => {
          const lineStart = LINE_OFFSETS[li]
          const lineLen = line.parts.reduce((s, p) => s + p.text.length, 0)
          const lineTyped = Math.max(0, Math.min(typed - lineStart, lineLen))
          if (typed < lineStart) return null

          const isActiveLine = !done && typed >= lineStart && typed <= lineStart + lineLen
          let partOff = 0

          return (
            <div key={li} className={line.highlight && lineTyped > 0 ? 'bg-[#7ee787]/5 -mx-5 px-5' : ''}>
              {lineLen === 0
                ? '\u00A0'
                : line.parts.map((part, pi) => {
                    const pStart = partOff
                    partOff += part.text.length
                    const pTyped = Math.max(0, Math.min(lineTyped - pStart, part.text.length))
                    if (pTyped === 0) return null
                    return <span key={pi} className={part.cls}>{part.text.slice(0, pTyped)}</span>
                  })
              }
              {isActiveLine && <span className="typewriter-cursor" />}
            </div>
          )
        })}{done && <span className="typewriter-cursor" />}</code></pre>
      </div>
    </div>
  )
}

function ScrollReveal({ children, className = '', delay = 0 }: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(20px)',
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export default function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { t, locale, setLocale } = useLocale()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pricing, setPricing] = useState<PricingPlan[]>([])


  useEffect(() => {
    const urlLang = lang as SupportedLocale
    if (urlLang === 'en' || urlLang === 'ru') {
      if (locale !== urlLang) {
        setLocale(urlLang)
      }
    }
  }, [lang, locale, setLocale])

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

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch(`${apiClient.getBaseUrl()}/pricing?locale=${locale}`)
        if (response.ok) {
          const data = await response.json()
          if (data.plans && data.plans.length > 0) {
            setPricing(data.plans)
          }
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error)
      }
    }
    fetchPricing()
  }, [locale])

  const getPlan = (planName: string): PricingPlan => {
    const apiPlan = pricing.find(p => p.plan_name === planName)
    if (apiPlan) return apiPlan
    const defaultPlan = DEFAULT_PRICING[planName]
    return defaultPlan ? defaultPlan[locale] : DEFAULT_PRICING.free[locale]
  }

  const switchLanguage = (newLang: SupportedLocale) => {
    setLocale(newLang)
    router.push(`/${newLang}`)
  }

  const currentLang = (lang === 'en' || lang === 'ru') ? lang : 'en'
  const alternateLang = currentLang === 'en' ? 'ru' : 'en'

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-100' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href={`/${currentLang}`} className="flex items-center">
              <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-5 w-auto" />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">{t('landing.nav.features')}</a>
              <a href="#pricing" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">{t('landing.nav.pricing')}</a>
              <a href="https://docs.xr2.uk" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">{t('landing.nav.public_docs')}</a>
              <button
                onClick={() => switchLanguage(alternateLang)}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
              >
                {currentLang === 'en' ? 'RU' : 'EN'}
              </button>
              <Button onClick={() => router.push("/login")} size="sm" className="text-sm">
                {t('landing.nav.signIn')}
              </Button>
            </div>

            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={() => switchLanguage(alternateLang)}
                className="text-gray-400 text-sm font-medium"
              >
                {currentLang === 'en' ? 'RU' : 'EN'}
              </button>
              <button
                className="p-2 text-gray-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-6 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 py-2 text-sm">{t('landing.nav.features')}</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 py-2 text-sm">{t('landing.nav.pricing')}</a>
              <a href="https://docs.xr2.uk" target="_blank" rel="noopener noreferrer" className="block text-gray-600 py-2 text-sm">{t('landing.nav.public_docs')}</a>
              <Button onClick={() => { setMobileMenuOpen(false); router.push("/login") }} className="w-full mt-2">
                {t('landing.nav.signIn')}
              </Button>
            </div>
          </div>
        )}
      </header>

      <main>
      {/* Hero */}
      <section className="min-h-screen pt-32 pb-20 lg:pt-44 lg:pb-28 flex items-center">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] mb-8">
                {t('landing.hero.titleLine1')}{' '}
                <span className="text-[#E63355]">{t('landing.hero.titleLine2')}</span>
              </h1>

              <p className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Button
                  onClick={() => router.push("/login")}
                  size="lg"
                  className="font-medium px-6"
                >
                  {t('landing.hero.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <a
                  href="#analytics"
                  className="inline-flex items-center gap-1 px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {t('landing.hero.secondaryCta')} <span className="ml-1">&darr;</span>
                </a>
              </div>
            </div>

            {/* Code block — before/after with typewriter */}
            <CodeTypewriter />
          </div>
        </div>
      </section>

      {/* Analytics — merged Revenue + Custom Metrics */}
      <section id="analytics" className="py-20 lg:py-28 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
            {/* Left — text */}
            <div className="lg:col-span-2 lg:sticky lg:top-28">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                {t('landing.revenue.title')}
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                {t('landing.revenue.subtitle')}
              </p>

              <div className="space-y-3 mb-8">
                {[
                  t('landing.revenue.bullet1'),
                  t('landing.revenue.bullet2'),
                  t('landing.revenue.bullet3')
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[#E63355]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[#E63355]" />
                    </div>
                    <span className="text-gray-600 text-sm">{text}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                {t('landing.revenue.howItWorks')}
              </p>
            </div>

            {/* Right — cards */}
            <div className="lg:col-span-3 space-y-4">
              {/* Revenue card */}
              <ScrollReveal className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm" delay={100}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{t('landing.revenue.revenueByPrompt')}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{t('landing.revenue.last7days')}</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "onboarding-welcome", revenue: "$1,240", pct: 100 },
                    { name: "upgrade-cta", revenue: "$860", pct: 69 },
                    { name: "checkout-helper", revenue: "$320", pct: 26 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-500 text-sm font-mono text-xs">{item.name}</span>
                        <span className="text-gray-900 text-sm font-semibold">{item.revenue}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-gray-800 h-1.5 rounded-full" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-gray-400 text-xs">3 {t('landing.revenue.promptsTracked')}</span>
                  <span className="text-lg font-bold text-emerald-600">$2,420</span>
                </div>
              </ScrollReveal>

              {/* A/B test card */}
              <ScrollReveal className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm" delay={200}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{t('landing.revenue.abTestResults')}</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+28%</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 text-sm">{t('landing.revenue.variantA')}</span>
                      <span className="text-gray-400 text-sm">3.2%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-gray-300 h-1.5 rounded-full" style={{ width: '39%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 text-sm">{t('landing.revenue.variantB')}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{t('landing.revenue.winner')}</span>
                      </div>
                      <span className="text-emerald-600 text-sm font-semibold">4.1%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="text-gray-400 text-xs">94% {t('landing.revenue.confidence')}</span>
                </div>
              </ScrollReveal>

              {/* Event log card */}
              <ScrollReveal className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm" delay={300}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{t('landing.revenue.eventLog')}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100">
                  {[
                    { event: "purchase_completed", value: "$2,340", change: "+12%", positive: true },
                    { event: "signup_finished", value: "847", change: "+8%", positive: true },
                    { event: "trial_started", value: "234", change: "-3%", positive: false },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                      <span className="text-gray-600 font-mono">{row.event}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{row.value}</span>
                        <span className={`text-[10px] ${row.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                          {row.positive ? '\u2191' : '\u2193'}{row.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Features — 2x2 grid */}
      <section id="features" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              {t('landing.features.title')}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('landing.features.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Edit prompts without engineering */}
            <ScrollReveal className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.noDevDependency.title')}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{t('landing.features.noDevDependency.description')}</p>
            </ScrollReveal>

            {/* Instant rollback */}
            <ScrollReveal className="bg-white rounded-xl p-6 border border-gray-200" delay={100}>
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <RefreshCcw className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.safeToExperiment.title')}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{t('landing.features.safeToExperiment.description')}</p>
            </ScrollReveal>

            {/* A/B test with real traffic */}
            <ScrollReveal className="bg-white rounded-xl p-6 border border-gray-200" delay={200}>
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <History className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.comparePerformance.title')}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{t('landing.features.comparePerformance.description')}</p>
            </ScrollReveal>

            {/* Track your KPIs */}
            <ScrollReveal className="bg-white rounded-xl p-6 border border-gray-200" delay={300}>
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.customMetrics.title')}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{t('landing.features.customMetrics.description')}</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Pricing — 2 plans */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-gray-500">{t('landing.pricing.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Free */}
            {(() => {
              const plan = getPlan('free')
              return (
                <ScrollReveal className="bg-white rounded-xl p-6 border border-gray-200" delay={100}>
                  <div className="text-sm text-gray-500 font-medium mb-1">{t('landing.pricing.free.name')}</div>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-bold">{plan.price_display}</span>
                    <span className="text-gray-400 text-sm">{plan.period_display}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6 text-sm">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600">
                        <Check className="h-4 w-4 text-gray-300 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
                    {t('landing.pricing.free.cta')}
                  </Button>
                </ScrollReveal>
              )
            })()}

            {/* Pro */}
            {(() => {
              const plan = getPlan('pro')
              return (
                <ScrollReveal className="bg-white rounded-xl p-6 border-2 border-gray-900" delay={200}>
                  <div className="text-sm text-gray-500 font-medium mb-1">{t('landing.pricing.pro.name')}</div>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-bold">{plan.price_display}</span>
                    <span className="text-gray-400 text-sm">{plan.period_display}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6 text-sm">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600">
                        <Check className="h-4 w-4 text-[#E63355] flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => router.push("/login")} className="w-full">
                    {t('landing.pricing.pro.cta')}
                  </Button>
                </ScrollReveal>
              )
            })()}
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t('landing.pricing.needMore')}{' '}
            <a href="mailto:hello@xr2.uk" className="text-gray-600 hover:text-gray-900 underline">
              {t('landing.pricing.contactUs')}
            </a>
          </p>
        </div>
      </section>

      {/* Integrations + CTA — merged dark section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          {/* Integration logos */}
          <ScrollReveal className="mb-12">
            <p className="text-center text-[11px] text-gray-500 uppercase tracking-widest mb-6">{t('landing.integrations.worksWithYourStack')}</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {/* Python */}
              <div className="flex flex-col items-center gap-2">
                <svg className="h-9 w-9 text-[#3776AB]" viewBox="0 0 256 255" fill="currentColor">
                  <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z"/>
                  <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z"/>
                </svg>
                <span className="text-xs text-gray-500">Python</span>
              </div>
              {/* Node.js */}
              <div className="flex flex-col items-center gap-2">
                <svg className="h-9 w-9 text-[#339933]" viewBox="0 0 256 289" fill="currentColor">
                  <path d="M128 288.464c-3.975 0-7.685-1.06-11.13-2.915l-35.247-20.936c-5.3-2.915-2.65-3.975-1.06-4.505 7.155-2.385 8.48-2.915 15.9-7.156.796-.53 1.856-.265 2.65.265l27.032 16.166c1.06.53 2.385.53 3.18 0l105.74-61.217c1.06-.53 1.59-1.59 1.59-2.915V83.08c0-1.325-.53-2.385-1.59-2.915l-105.74-60.953c-1.06-.53-2.385-.53-3.18 0L20.405 80.166c-1.06.53-1.59 1.855-1.59 2.915v122.17c0 1.06.53 2.385 1.59 2.915l28.887 16.695c15.636 7.95 25.44-1.325 25.44-10.6V93.68c0-1.59 1.326-3.18 3.181-3.18h13.516c1.59 0 3.18 1.325 3.18 3.18v120.58c0 20.936-11.396 33.126-31.272 33.126-6.095 0-10.865 0-24.38-6.625l-27.827-15.9C4.24 220.355 0 212.67 0 204.456V82.286C0 74.07 4.24 66.12 11.13 61.88L116.87.663c6.625-3.71 15.635-3.71 22.26 0L244.87 61.88c6.89 4.24 11.13 12.19 11.13 20.406v122.17c0 8.215-4.24 16.165-11.13 20.406l-105.74 61.217c-3.445 1.59-7.42 2.385-11.13 2.385z"/>
                </svg>
                <span className="text-xs text-gray-500">Node.js</span>
              </div>
              {/* n8n */}
              <div className="flex flex-col items-center gap-2">
                <svg className="h-9 w-[4.5rem] text-[#EA4B71]" viewBox="0 0 49 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M47.9855 4.8C47.9855 7.45098 45.8365 9.6 43.1855 9.6C40.949 9.6 39.0696 8.0703 38.5368 6H31.8352C30.662 6 29.6607 6.84822 29.4678 8.00544L29.2706 9.18912C29.0832 10.313 28.5147 11.2911 27.7108 12C28.5147 12.7089 29.0832 13.687 29.2706 14.8109L29.4678 15.9946C29.6607 17.1518 30.662 18 31.8352 18H33.7368C34.2696 15.9297 36.149 14.4 38.3855 14.4C41.0365 14.4 43.1855 16.549 43.1855 19.2C43.1855 21.851 41.0365 24 38.3855 24C36.149 24 34.2696 22.4703 33.7368 20.4H31.8352C29.4888 20.4 27.4863 18.7036 27.1005 16.3891L26.9032 15.2054C26.7104 14.0482 25.7091 13.2 24.5359 13.2H22.5782C21.979 15.1681 20.1495 16.6 17.9855 16.6C15.8216 16.6 13.9921 15.1681 13.3929 13.2H10.5782C9.97901 15.1681 8.14949 16.6 5.98554 16.6C3.33458 16.6 1.18555 14.4509 1.18555 11.8C1.18555 9.14904 3.33458 7.00002 5.98554 7.00002C8.29361 7.00002 10.2212 8.62902 10.6812 10.8H13.2899C13.7499 8.62902 15.6775 7.00002 17.9855 7.00002C20.2936 7.00002 22.2212 8.62902 22.6812 10.8H24.5359C25.7091 10.8 26.7104 9.95178 26.9032 8.79456L27.1005 7.61088C27.4863 5.29638 29.4888 3.6 31.8352 3.6H38.5368C39.0696 1.52973 40.949 0 43.1855 0C45.8365 0 47.9855 2.14903 47.9855 4.8Z"/>
                </svg>
                <span className="text-xs text-gray-500">n8n</span>
              </div>
              {/* Make */}
              <div className="flex flex-col items-center gap-2">
                <svg className="h-9 w-9" viewBox="0 0 48 48" fill="none">
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
                <span className="text-xs text-gray-500">Make</span>
              </div>
              {/* Zapier */}
              <div className="flex flex-col items-center gap-2">
                <svg className="h-9 w-9 text-[#FF4A00]" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M128.08 0c7.23 0 14.34.61 21.26 1.78v74.52l52.83-52.7c5.84 4.15 11.3 8.76 16.34 13.79 5.05 5.03 9.69 10.49 13.84 16.31l-52.83 52.7h74.71c1.16 6.89 1.77 13.96 1.77 21.19v.17c0 7.23-.61 14.31-1.77 21.2h-74.73l52.85 52.68c-4.15 5.82-8.79 11.28-13.82 16.31l-.02.01c-5.05 5.03-10.52 9.66-16.32 13.79l-52.85-52.7v74.52c-6.9 1.16-14 1.77-21.24 1.78h-.19c-7.23-.01-14.32-.62-21.23-1.78v-74.52l-52.83 52.7c-11.67-8.28-21.87-18.47-30.18-30.1l52.83-52.68H1.78c-1.17-6.91-1.78-14.01-1.78-21.24v-.37c.01-1.88.13-4.17.31-6.54l.05-.71c.52-6.67 1.42-13.7 1.42-13.7h74.71L23.67 53.7c4.14-5.82 8.76-11.26 13.81-16.29l.02-.02c5.04-5.03 10.51-9.64 16.35-13.79l52.83 52.7V1.78c6.91-1.16 14-1.77 21.25-1.78h.15zM128.07 95.76h-.12c-9.51 0-18.62 1.74-27.04 4.9-3.15 8.38-4.9 17.47-4.91 26.95v.12c.01 9.48 1.76 18.57 4.93 26.95 8.41 3.16 17.51 4.9 27.02 4.9h.12c9.51 0 18.62-1.74 27.02-4.9 3.17-8.4 4.92-17.47 4.92-26.95v-.12c0-9.48-1.75-18.57-4.92-26.95-8.4-3.16-17.51-4.9-27.02-4.9z"/>
                </svg>
                <span className="text-xs text-gray-500">Zapier</span>
              </div>
              {/* REST API */}
              <div className="flex flex-col items-center gap-2">
                <svg className="h-9 w-9 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
                <span className="text-xs text-gray-500">REST API</span>
              </div>
            </div>
          </ScrollReveal>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
              {t('landing.cta.title')}
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              {t('landing.cta.subtitle')}
            </p>
            <Button
              onClick={() => router.push("/login")}
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 font-medium px-8"
            >
              {t('landing.cta.button')}
            </Button>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-12 md:gap-16 mb-10">
            {/* Brand column */}
            <div className="md:max-w-xs">
              <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-5 w-auto mb-3" />
              <p className="text-sm text-gray-400 leading-relaxed">
                {t('landing.footer.description')}
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-12 md:gap-16 md:ml-auto">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">{t('landing.footer.productTitle')}</p>
                <div className="space-y-2.5">
                  <a href="#features" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.nav.features')}</a>
                  <a href="#pricing" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.nav.pricing')}</a>
                  <a href="https://docs.xr2.uk" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.footer.public_docs')}</a>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">{t('landing.footer.companyTitle')}</p>
                <div className="space-y-2.5">
                  <a href="mailto:hello@xr2.uk" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.footer.contact')}</a>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">{t('landing.footer.legalTitle')}</p>
                <div className="space-y-2.5">
                  <Link href="/legal/privacy" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.footer.privacy')}</Link>
                  <Link href="/legal/terms" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.footer.terms')}</Link>
                  <Link href="/legal/cookies" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.footer.cookies')}</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} xR2</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
