"use client"

import { useEffect, useState, useRef, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLocale } from "@/contexts/locale-context"
import { Button } from "@/components/ui/button"
import {
  FlaskConical, Check, LineChart, Menu, X, Zap, History, BarChart3,
  RefreshCcw, ArrowRight, Users, Bot, ShoppingCart, Megaphone,
  Code2, Package, Globe, Workflow,
  X as XIcon,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
    en: { plan_name: 'pro', price_display: '$19', period_display: '/month', features: ['Unlimited prompts', '1,000 API calls/month', 'A/B testing & revenue tracking', 'Unlimited workspaces'] },
    ru: { plan_name: 'pro', price_display: '1500\u20BD', period_display: '/\u043C\u0435\u0441', features: ['\u0411\u0435\u0437\u043B\u0438\u043C\u0438\u0442 \u043F\u0440\u043E\u043C\u043F\u0442\u043E\u0432', '1 000 API \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432/\u043C\u0435\u0441', 'A/B \u0442\u0435\u0441\u0442\u044B \u0438 \u0432\u044B\u0440\u0443\u0447\u043A\u0430', '\u0411\u0435\u0437\u043B\u0438\u043C\u0438\u0442 workspaces', '\u041A\u043E\u043C\u0430\u043D\u0434\u043D\u0430\u044F \u0440\u0430\u0431\u043E\u0442\u0430'] }
  }
}

/* ─── Code snippets for integration tabs ─── */
const PYTHON_CODE = `from xr2_sdk.client import xR2Client

client = xR2Client(api_key="xr2_prod_xxx")

response = client.get_prompt(slug="welcome-email")
prompt = response.data

# Render with variables
rendered = prompt.render({
    "customer_name": "Alice",
    "plan_name": "Pro"
})

# Track conversion event
client.track_event(
    trace_id=prompt.trace_id,
    event_name="purchase_completed",
    user_id="user_123",
    value=99.99,
    currency="USD"
)`

const NODEJS_CODE = `import { XR2Client, renderPrompt } from "xr2-sdk";

const client = new XR2Client("xr2_prod_xxx");

const response = await client.getPrompt({
  slug: "welcome-email",
  status: "production",
});
const prompt = response.data;

// Render with variables
const rendered = renderPrompt(prompt, {
  values: { customer_name: "Alice", plan_name: "Pro" },
});

// Track conversion event
await client.trackEvent({
  traceId: prompt.trace_id,
  eventName: "purchase_completed",
  userId: "user_123",
  value: 99.99,
  currency: "USD",
});`

const REST_CODE = `curl -X POST https://xr2.uk/api/v1/get-prompt \\
  -H "Authorization: Bearer xr2_prod_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "slug": "welcome-email",
    "source_name": "web_app"
  }'

# Response (200 OK):
{
  "slug": "welcome-email",
  "status": "production",
  "system_prompt": "You are a friendly...",
  "user_prompt": "Generate a welcome email...",
  "variables": [...],
  "trace_id": "evt_abc123_xyz"
}`

const NOCODE_CODE = `// n8n  — install @xr2/n8n-nodes-xr2 community node
// Make — use the HTTP module with xR2 API
//
// Step-by-step:
// 1. Add xR2 node (n8n) or HTTP module (Make)
// 2. Set API key: xr2_prod_xxx
// 3. Choose action: Get Prompt / Track Event
// 4. Enter prompt slug → get production prompt
// 5. Feed prompt text into your AI / email / chat node
//
// Connect to 5,000+ apps — no coding required.`

/* ─── Particle field — dots that scatter on mouse hover ─── */
const particleMouse = { x: -1000, y: -1000 }

function ParticleField({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<{ x: number; y: number; ox: number; oy: number; vx: number; vy: number; r: number }[]>([])
  const raf = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = section.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      initParticles(rect.width, rect.height)
    }

    const initParticles = (w: number, h: number) => {
      const spacing = 28
      const pts: typeof particles.current = []
      for (let x = spacing / 2; x < w; x += spacing) {
        for (let y = spacing / 2; y < h; y += spacing) {
          pts.push({ x, y, ox: x, oy: y, vx: 0, vy: 0, r: 1 })
        }
      }
      particles.current = pts
    }

    const animate = () => {
      const rect = section.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
      const isDark = document.documentElement.classList.contains('dark')
      const color = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,'
      const mx = particleMouse.x
      const my = particleMouse.y
      const radius = 120
      const radiusSq = radius * radius

      for (const p of particles.current) {
        const dx = p.x - mx
        const dy = p.y - my
        const distSq = dx * dx + dy * dy

        if (distSq < radiusSq && distSq > 0) {
          const dist = Math.sqrt(distSq)
          const force = (radius - dist) / radius
          p.vx += (dx / dist) * force * 2
          p.vy += (dy / dist) * force * 2
        }

        p.vx += (p.ox - p.x) * 0.05
        p.vy += (p.oy - p.y) * 0.05
        p.vx *= 0.85
        p.vy *= 0.85
        p.x += p.vx
        p.y += p.vy

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        const alpha = Math.min(0.12 + speed * 0.15, 0.5)
        const size = p.r + speed * 0.3

        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = color + alpha + ')'
        ctx.fill()
      }

      raf.current = requestAnimationFrame(animate)
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      particleMouse.x = e.clientX - rect.left
      particleMouse.y = e.clientY - rect.top
    }
    const onMouseLeave = () => {
      particleMouse.x = -1000
      particleMouse.y = -1000
    }

    resize()
    animate()
    window.addEventListener('resize', resize)
    section.addEventListener('mousemove', onMouseMove)
    section.addEventListener('mouseleave', onMouseLeave)

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', resize)
      section.removeEventListener('mousemove', onMouseMove)
      section.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [sectionRef])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />
}

/* ─── ScrollReveal ─── */
function ScrollReveal({ children, className = '', delay = 0, instant = false }: {
  children: React.ReactNode; className?: string; delay?: number; instant?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(instant)
  useEffect(() => {
    if (instant || !ref.current) return
    const el = ref.current
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [instant])
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(30px)',
      transition: instant ? 'none' : `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
    }}>{children}</div>
  )
}

/* ─── Integration logos (for marquee) ─── */
const INTEGRATION_LOGOS = [
  { name: 'Python', svg: <svg className="h-5 w-auto" viewBox="0 0 256 255" fill="currentColor"><path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z"/><path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z"/></svg> },
  { name: 'Node.js', svg: <svg className="h-5 w-auto" viewBox="0 0 256 289" fill="currentColor"><path d="M128 288.464c-3.975 0-7.685-1.06-11.13-2.915l-35.247-20.936c-5.3-2.915-2.65-3.975-1.06-4.505 7.155-2.385 8.48-2.915 15.9-7.156.796-.53 1.856-.265 2.65.265l27.032 16.166c1.06.53 2.385.53 3.18 0l105.74-61.217c1.06-.53 1.59-1.59 1.59-2.915V83.08c0-1.325-.53-2.385-1.59-2.915l-105.74-60.953c-1.06-.53-2.385-.53-3.18 0L20.405 80.166c-1.06.53-1.59 1.855-1.59 2.915v122.17c0 1.06.53 2.385 1.59 2.915l28.887 16.695c15.636 7.95 25.44-1.325 25.44-10.6V93.68c0-1.59 1.326-3.18 3.181-3.18h13.516c1.59 0 3.18 1.325 3.18 3.18v120.58c0 20.936-11.396 33.126-31.272 33.126-6.095 0-10.865 0-24.38-6.625l-27.827-15.9C4.24 220.355 0 212.67 0 204.456V82.286C0 74.07 4.24 66.12 11.13 61.88L116.87.663c6.625-3.71 15.635-3.71 22.26 0L244.87 61.88c6.89 4.24 11.13 12.19 11.13 20.406v122.17c0 8.215-4.24 16.165-11.13 20.406l-105.74 61.217c-3.445 1.59-7.42 2.385-11.13 2.385z"/></svg> },
  { name: 'n8n', svg: <svg className="h-5 w-auto" viewBox="0 0 49 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M47.9855 4.8C47.9855 7.45098 45.8365 9.6 43.1855 9.6C40.949 9.6 39.0696 8.0703 38.5368 6H31.8352C30.662 6 29.6607 6.84822 29.4678 8.00544L29.2706 9.18912C29.0832 10.313 28.5147 11.2911 27.7108 12C28.5147 12.7089 29.0832 13.687 29.2706 14.8109L29.4678 15.9946C29.6607 17.1518 30.662 18 31.8352 18H33.7368C34.2696 15.9297 36.149 14.4 38.3855 14.4C41.0365 14.4 43.1855 16.549 43.1855 19.2C43.1855 21.851 41.0365 24 38.3855 24C36.149 24 34.2696 22.4703 33.7368 20.4H31.8352C29.4888 20.4 27.4863 18.7036 27.1005 16.3891L26.9032 15.2054C26.7104 14.0482 25.7091 13.2 24.5359 13.2H22.5782C21.979 15.1681 20.1495 16.6 17.9855 16.6C15.8216 16.6 13.9921 15.1681 13.3929 13.2H10.5782C9.97901 15.1681 8.14949 16.6 5.98554 16.6C3.33458 16.6 1.18555 14.4509 1.18555 11.8C1.18555 9.14904 3.33458 7.00002 5.98554 7.00002C8.29361 7.00002 10.2212 8.62902 10.6812 10.8H13.2899C13.7499 8.62902 15.6775 7.00002 17.9855 7.00002C20.2936 7.00002 22.2212 8.62902 22.6812 10.8H24.5359C25.7091 10.8 26.7104 9.95178 26.9032 8.79456L27.1005 7.61088C27.4863 5.29638 29.4888 3.6 31.8352 3.6H38.5368C39.0696 1.52973 40.949 0 43.1855 0C45.8365 0 47.9855 2.14903 47.9855 4.8Z"/></svg> },
  { name: 'Make', svg: <svg className="h-5 w-5" viewBox="0 0 48 48" fill="currentColor"><rect x="6" y="10" width="10" height="28" rx="3" transform="rotate(15 11 24)"/><rect x="19" y="10" width="10" height="28" rx="3" transform="rotate(8 24 24)"/><rect x="32" y="10" width="10" height="28" rx="3"/></svg> },
  { name: 'Zapier', svg: <svg className="h-5 w-5" viewBox="0 0 256 256" fill="currentColor"><path d="M128.08 0c7.23 0 14.34.61 21.26 1.78v74.52l52.83-52.7c5.84 4.15 11.3 8.76 16.34 13.79 5.05 5.03 9.69 10.49 13.84 16.31l-52.83 52.7h74.71c1.16 6.89 1.77 13.96 1.77 21.19v.17c0 7.23-.61 14.31-1.77 21.2h-74.73l52.85 52.68c-4.15 5.82-8.79 11.28-13.82 16.31l-.02.01c-5.05 5.03-10.52 9.66-16.32 13.79l-52.85-52.7v74.52c-6.9 1.16-14 1.77-21.24 1.78h-.19c-7.23-.01-14.32-.62-21.23-1.78v-74.52l-52.83 52.7c-11.67-8.28-21.87-18.47-30.18-30.1l52.83-52.68H1.78c-1.17-6.91-1.78-14.01-1.78-21.24v-.37c.01-1.88.13-4.17.31-6.54l.05-.71c.52-6.67 1.42-13.7 1.42-13.7h74.71L23.67 53.7c4.14-5.82 8.76-11.26 13.81-16.29l.02-.02c5.04-5.03 10.51-9.64 16.35-13.79l52.83 52.7V1.78c6.91-1.16 14-1.77 21.25-1.78h.15z"/></svg> },
  { name: 'REST API', svg: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg> },
]

export default function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { t, locale } = useLocale()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pricing, setPricing] = useState<PricingPlan[]>([])
  const [integrationTab, setIntegrationTab] = useState<'python' | 'nodejs' | 'rest' | 'nocode'>('python')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const heroRef = useRef<HTMLElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 4, y: -12 })

  const handleTerminalMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = terminalRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5   // -0.5 … 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -12, y: x * 12 })  // rotateX from Y, rotateY from X
  }, [])

  const handleTerminalLeave = useCallback(() => {
    setTilt({ x: 4, y: -12 })
  }, [])

  const en = locale === 'en'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (!hostname.includes('xr2.site') && !hostname.includes('xr2.uk')) {
        const urlLang = lang as SupportedLocale
        if ((urlLang === 'en' || urlLang === 'ru') && locale !== urlLang) {
          localStorage.setItem('locale', urlLang)
        }
      }
    }
  }, [lang, locale])

  useEffect(() => { if (!isLoading && isAuthenticated) router.push("/prompts") }, [router, isAuthenticated, isLoading])
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/internal/pricing?locale=${locale}`)
        if (r.ok) { const d = await r.json(); if (d.plans?.length) setPricing(d.plans) }
      } catch {}
    })()
  }, [locale])

  const getPlan = (n: string): PricingPlan => {
    const p = pricing.find(p => p.plan_name === n)
    if (p) return p
    return DEFAULT_PRICING[n]?.[locale] ?? DEFAULT_PRICING.free[locale]
  }

  const currentLang = (lang === 'en' || lang === 'ru') ? lang : 'en'
  const [docsUrl, setDocsUrl] = useState('https://docs.xr2.uk')
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('xr2.site')) setDocsUrl('/documentation/')
  }, [])

  const steps = en
    ? [
        { icon: <Zap className="h-5 w-5" />, title: 'Create prompts', desc: 'Write and organize prompts in a visual editor with variables, tags, and version history.' },
        { icon: <Code2 className="h-5 w-5" />, title: 'Integrate via SDK', desc: 'Fetch prompts at runtime with Python, Node.js SDK or REST API. One line of code.' },
        { icon: <FlaskConical className="h-5 w-5" />, title: 'A/B test variants', desc: 'Split traffic between prompt versions. Compare conversion rates and revenue.' },
        { icon: <LineChart className="h-5 w-5" />, title: 'Track revenue', desc: 'Send conversion events. See exactly which prompt version generates the most money.' },
      ]
    : [
        { icon: <Zap className="h-5 w-5" />, title: 'Напишите промпт', desc: 'Визуальный редактор с переменными и историей версий. Как Google Docs, только для промптов.' },
        { icon: <Code2 className="h-5 w-5" />, title: 'Встройте в продукт', desc: 'Одна строка кода — и ваш продукт получает актуальный промпт. Python, Node.js или простой HTTP-запрос.' },
        { icon: <FlaskConical className="h-5 w-5" />, title: 'Запустите A/B тест', desc: 'Два варианта промпта, половина трафика на каждый. Через неделю видно, какой работает лучше.' },
        { icon: <LineChart className="h-5 w-5" />, title: 'Считайте деньги', desc: 'Привяжите покупки к промптам. Видно, какой вариант реально приносит выручку, а не просто "нравится".' },
      ]

  const useCases = en
    ? [
        { icon: Bot, title: 'AI Chatbots', desc: 'Your support bot answers differently depending on the system prompt. Test two versions on real users and see which one actually resolves tickets.' },
        { icon: ShoppingCart, title: 'E-commerce', desc: 'The checkout assistant that upsells 14% more? You\'ll know which prompt version does that — because revenue is tracked per variant.' },
        { icon: Code2, title: 'AI Features in SaaS', desc: 'Product team wants to tweak the AI summary prompt. They do it themselves in xR2 and ship it — no Jira ticket, no deploy.' },
        { icon: Megaphone, title: 'Marketing & Content', desc: 'Ad copy, email subject lines, landing page CTAs — all powered by prompts. Change them live, compare results, keep what works.' },
        { icon: Workflow, title: 'SMM & Automation', desc: 'Prompts scattered across n8n, Make, Zapier, Suno? Edit them all from one place. No more logging into five tools to fix one sentence. Bonus: A/B test which version performs better.' },
        { icon: Package, title: 'AI Agents & Pipelines', desc: 'Multi-step agent where each step has its own prompt? Version and optimize them independently. Tweak step 3 without breaking step 1.' },
      ]
    : [
        { icon: Bot, title: 'AI-чатботы', desc: 'Бот поддержки отвечает по-разному в зависимости от системного промпта. Протестируйте две версии на реальных пользователях и узнайте, какая закрывает больше тикетов.' },
        { icon: ShoppingCart, title: 'E-commerce', desc: 'Ассистент в чекауте, который апселлит на 14% больше? Вы узнаете, какой именно промпт это делает — выручка трекается по каждому варианту.' },
        { icon: Code2, title: 'AI-фичи в SaaS', desc: 'Продакт хочет подкрутить промпт для AI-саммари. Он делает это сам в xR2 и шипит — без тикета в Jira, без деплоя.' },
        { icon: Megaphone, title: 'Маркетинг и контент', desc: 'Рекламные тексты, темы писем, CTA на лендингах — всё на промптах. Меняйте на лету, сравнивайте результаты, оставляйте то, что работает.' },
        { icon: Workflow, title: 'SMM и автоматизации', desc: 'Промпты раскиданы по n8n, Make, Zapier, Suno? Редактируйте всё из одного места. Не нужно заходить в пять интерфейсов, чтобы поправить одно предложение. И да — можно закинуть A/B тест прямо туда.' },
        { icon: Package, title: 'AI-агенты и пайплайны', desc: 'Многошаговый агент, где у каждого шага свой промпт? Версионируйте и оптимизируйте их независимо. Подкрутите шаг 3, не ломая шаг 1.' },
      ]

  const comparisonFeatures = en
    ? [
        { feature: 'Built for', xr2: 'Product & marketing teams', promptlayer: 'ML engineers', langfuse: 'ML engineers', humanloop: 'AI teams' },
        { feature: 'Free tier', xr2: '10 prompts, 1k API calls', promptlayer: '10 prompts, 2.5k API calls', langfuse: '50k events, 30-day history', humanloop: '10k events' },
        { feature: 'A/B testing', xr2: 'Built-in + revenue attribution', promptlayer: 'Built-in', langfuse: 'Manual setup in code', humanloop: 'Built-in' },
        { feature: 'Prompt analytics dashboard', xr2: 'Per-prompt metrics + funnels', promptlayer: 'Basic metrics', langfuse: 'Traces & costs', humanloop: 'Eval scores' },
        { feature: 'Custom events & revenue', xr2: 'Any event + revenue + ROI', promptlayer: false, langfuse: false, humanloop: false },
        { feature: 'Source tracking', xr2: 'By app, channel, variant', promptlayer: false, langfuse: false, humanloop: false },
        { feature: 'Conversion funnels', xr2: true, promptlayer: false, langfuse: false, humanloop: false },
        { feature: 'No-code (n8n, Make, Zapier)', xr2: true, promptlayer: false, langfuse: 'Zapier only', humanloop: 'Zapier only' },
        { feature: 'Built for non-technical teams', xr2: true, promptlayer: false, langfuse: false, humanloop: 'Partial' },
        { feature: 'Starting price', xr2: '$19/mo', promptlayer: '$49/mo', langfuse: '$29/mo', humanloop: '~$100/mo' },
      ]
    : [
        { feature: 'Для кого', xr2: 'Продакты и маркетологи', promptlayer: 'ML-инженеры', langfuse: 'ML-инженеры', humanloop: 'AI-команды' },
        { feature: 'Бесплатно', xr2: '10 промптов, 1 000 запросов', promptlayer: '10 промптов, 2 500 запросов', langfuse: '50 000 событий, 30 дней истории', humanloop: '10 000 событий' },
        { feature: 'A/B тесты', xr2: 'Встроенные + атрибуция выручки', promptlayer: 'Встроенные', langfuse: 'Нужно настраивать в коде', humanloop: 'Встроенные' },
        { feature: 'Аналитика по промптам', xr2: 'Метрики + воронки по каждому', promptlayer: 'Базовые метрики', langfuse: 'Трейсы и расходы', humanloop: 'Оценки качества' },
        { feature: 'Кастомные события и выручка', xr2: 'Любые события + выручка + ROI', promptlayer: false, langfuse: false, humanloop: false },
        { feature: 'Трекинг по источникам', xr2: 'По приложению и каналу', promptlayer: false, langfuse: false, humanloop: false },
        { feature: 'Воронки конверсии', xr2: true, promptlayer: false, langfuse: false, humanloop: false },
        { feature: 'Без кода (n8n, Make, Zapier)', xr2: true, promptlayer: false, langfuse: 'Только Zapier', humanloop: 'Только Zapier' },
        { feature: 'UI для нетехнических команд', xr2: true, promptlayer: false, langfuse: false, humanloop: 'Частично' },
        { feature: 'Стартовая цена', xr2: '$19/мес', promptlayer: '$49/мес', langfuse: '$29/мес', humanloop: '~$100/мес' },
      ]

  const integrationCode = integrationTab === 'python' ? PYTHON_CODE : integrationTab === 'nodejs' ? NODEJS_CODE : integrationTab === 'rest' ? REST_CODE : NOCODE_CODE

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "xR2",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "url": en ? "https://xr2.uk" : "https://xr2.site",
    "description": en
      ? "Prompt management platform for AI workflows. Version control, A/B testing, and dynamic prompt switching for n8n, Make.com, and REST API."
      : "Платформа управления промптами для AI. Версионирование, A/B тесты и динамическое переключение промптов для n8n, Make.com и REST API.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
  }

  return (
    <div className="flex min-h-screen flex-col bg-background overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      {/* ─── Grid background (sniffmail-style) ─── */}
      <div
        className="fixed inset-0 opacity-[0.015] dark:opacity-[0.025] pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />

      {/* ─── Header — pill-shaped nav (sniffmail-style) ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 md:px-6 md:pt-5">
        <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-full border border-border/50 bg-card/90 backdrop-blur-lg px-4 py-2.5 shadow-sm md:px-6 md:py-3">
          <Link href={`/${currentLang}`} className="flex items-center z-50">
            <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-4 w-auto md:hidden" />
            <Image src="/tagline.svg" alt="xR2 — Prompt Management" width={250} height={30} className="h-5 w-auto hidden md:block dark:invert" />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <a href="#how-it-works" className="px-3 py-1.5 text-sm rounded-full transition-colors text-muted-foreground hover:text-foreground">
              {en ? 'How It Works' : 'Как работает'}
            </a>
            <a href="#pricing" className="px-3 py-1.5 text-sm rounded-full transition-colors text-muted-foreground hover:text-foreground">
              {t('landing.nav.pricing')}
            </a>
            <a href="#use-cases" className="px-3 py-1.5 text-sm rounded-full transition-colors text-muted-foreground hover:text-foreground">
              {en ? 'Use Cases' : 'Кейсы'}
            </a>
            <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm rounded-full transition-colors text-muted-foreground hover:text-foreground">
              {t('landing.nav.public_docs')}
            </a>
            <button
              onClick={() => router.push("/login")}
              className="ml-2 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t('landing.nav.signIn')}
            </button>
          </div>

          <button className="md:hidden relative w-10 h-10 flex items-center justify-center" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="mx-auto max-w-5xl mt-2 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-lg p-4 shadow-lg md:hidden">
            {[
              { href: '#how-it-works', label: en ? 'How It Works' : 'Как работает' },
              { href: '#pricing', label: t('landing.nav.pricing') },
              { href: '#use-cases', label: en ? 'Use Cases' : 'Кейсы' },
              { href: docsUrl, label: t('landing.nav.public_docs'), ext: true },
            ].map(item => (
              <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                {...(item.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="block py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">{item.label}</a>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); router.push("/login") }}
              className="mt-2 w-full rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
              {t('landing.nav.signIn')}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 relative z-10">

      {/* ─── Hero — two-column with 3D terminal (sniffmail-style) ─── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        <ParticleField sectionRef={heroRef} />
        <div className="mx-auto max-w-7xl w-full px-6 md:px-10 pb-16 pt-28 md:pb-24 md:pt-36 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-12 items-center">

            {/* Left — text */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <ScrollReveal instant>
                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-[2.85rem] lg:leading-[1.2] font-display">
                  {t('landing.hero.titleLine1')}{' '}
                  <span className="text-[#E63355]">{t('landing.hero.titleLine2')}</span>
                </h1>
              </ScrollReveal>

              <ScrollReveal instant>
                <p className="mt-6 max-w-md text-pretty text-[1.05rem] leading-relaxed text-muted-foreground">
                  {t('landing.hero.subtitle')}
                </p>
              </ScrollReveal>

              <ScrollReveal instant>
                <div className="mt-8">
                  <button
                    onClick={() => router.push("/login")}
                    className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-medium transition-colors"
                  >
                    {t('landing.hero.cta')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </ScrollReveal>

              <ScrollReveal instant>
                <p className="mt-4 text-xs text-muted-foreground">
                  {en ? '10 free prompts and 1000 api requests per month.' : '10 бесплатных промптов и 1000 запросов в месяц.'}
                </p>
              </ScrollReveal>
            </div>

            {/* Right — editor screenshot with interactive 3D tilt */}
            <ScrollReveal instant>
              <div
                ref={terminalRef}
                className="relative lg:pl-4 lg:-mr-18"
                style={{ perspective: '800px' }}
                onMouseMove={handleTerminalMouse}
                onMouseLeave={handleTerminalLeave}
              >
                <div
                  className="will-change-transform"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                >
                  <div className="w-full lg:w-[105%] rounded-2xl border border-border/60 shadow-2xl overflow-hidden">
                    <Image
                      src="/screenshots/Screenshot 2026-03-06 at 11.48.00.png"
                      alt={en ? 'Prompt Editor — version control, variables, multi-model testing' : 'Редактор промптов — версии, переменные, тестирование'}
                      width={1480}
                      height={900}
                      className="w-full h-auto"
                      priority
                    />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Integration logos marquee (sniffmail-style) */}
          <ScrollReveal delay={400}>
            <div className="w-full overflow-hidden py-8 mt-8">
              <p className="text-center text-xs text-muted-foreground uppercase tracking-wider mb-4">
                {t('landing.integrations.worksWithYourStack')}
              </p>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
                <div className="flex animate-marquee-scroll">
                  {[...INTEGRATION_LOGOS, ...INTEGRATION_LOGOS, ...INTEGRATION_LOGOS, ...INTEGRATION_LOGOS].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 mx-8 shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-default select-none">
                      <span>{item.svg}</span>
                      <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Three ways to integrate (sniffmail-style tabs) ─── */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl font-display">
                {en ? 'Integration methods' : 'Подключите за 5 минут'}
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                {en ? 'Python SDK, Node.js SDK, REST API, or no-code platforms — pick what fits your stack.' : 'Готовые библиотеки, простой API или визуальные конструкторы — выберите удобный способ.'}
              </p>
            </div>
          </ScrollReveal>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {([
              { key: 'python' as const, icon: <Package className="h-4 w-4" />, label: 'Python SDK' },
              { key: 'nodejs' as const, icon: <Code2 className="h-4 w-4" />, label: 'Node.js SDK' },
              { key: 'rest' as const, icon: <Globe className="h-4 w-4" />, label: 'REST API' },
              { key: 'nocode' as const, icon: <Workflow className="h-4 w-4" />, label: 'No-code' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setIntegrationTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  integrationTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center min-w-0">
            <ScrollReveal className="min-w-0">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-foreground font-display">
                  {integrationTab === 'python' ? 'Python SDK' : integrationTab === 'nodejs' ? 'Node.js SDK' : integrationTab === 'rest' ? 'REST API' : (en ? 'No-code platforms' : 'Без кода')}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {integrationTab === 'python'
                    ? (en ? 'Install xr2-sdk via pip. Sync & async clients, variable rendering, event tracking — all typed.' : 'Одна команда для установки. Получайте промпты, подставляйте переменные и отслеживайте конверсии — всё из Python.')
                    : integrationTab === 'nodejs'
                    ? (en ? 'Install xr2-sdk via npm. Full TypeScript support, variable rendering, event tracking.' : 'Быстрая установка через npm. Типизированный клиент для Node.js — промпты, переменные и аналитика из коробки.')
                    : integrationTab === 'rest'
                    ? (en ? 'POST to /api/v1/get-prompt with Bearer auth. Works with any language or platform.' : 'Простые HTTP-запросы с API-ключом. Работает с любым языком программирования и платформой.')
                    : (en ? 'Use the xR2 community node in n8n, HTTP module in Make, or webhooks in Zapier. Connect prompts to 5,000+ apps.' : 'Подключите промпты к n8n, Make или Zapier без единой строчки кода. Доступ к 5 000+ приложений.')
                  }
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  {(integrationTab === 'python'
                    ? [en ? 'Fetch & render prompts with variables' : 'Получайте промпты одной строкой кода', en ? 'Track revenue events with trace_id' : 'Отслеживайте, какой промпт приносит деньги', en ? 'Async support & automatic retries' : 'Работает стабильно — автоповторы при сбоях']
                    : integrationTab === 'nodejs'
                    ? [en ? 'Full TypeScript types out of the box' : 'Полная типизация — меньше ошибок', en ? 'renderPrompt() for variable substitution' : 'Подставляйте переменные в промпты автоматически', en ? 'Track events with traceId linking' : 'Связывайте конверсии с конкретными промптами']
                    : integrationTab === 'rest'
                    ? [en ? 'Get prompt by slug with POST request' : 'Запросите промпт по имени — получите актуальную версию', en ? 'Track events via /api/v1/events' : 'Отправляйте события конверсий одним запросом', en ? 'Bearer token authentication' : 'Простая авторизация по API-ключу']
                    : [en ? 'n8n — community node, install in one click' : 'n8n — установка нодой в один клик', en ? 'Make.com — HTTP module or invite link' : 'Make.com — готовый модуль по инвайт-ссылке', en ? 'Zapier — connect via webhooks' : 'Zapier — подключение через вебхуки', en ? 'No coding required' : 'Программировать не нужно']
                  ).map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-foreground">{text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                    <button className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium transition-colors">
                      {en ? 'View docs' : 'Документация'} <ArrowRight className="h-4 w-4" />
                    </button>
                  </a>
                  {integrationTab === 'python' && (
                    <a href="https://pypi.org/project/xr2-sdk/" target="_blank" rel="noopener noreferrer">
                      <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-10 px-4 py-2 text-sm font-medium transition-colors">
                        <Package className="h-4 w-4" /> pip install xr2-sdk
                      </button>
                    </a>
                  )}
                  {integrationTab === 'nodejs' && (
                    <a href="https://www.npmjs.com/package/xr2-sdk" target="_blank" rel="noopener noreferrer">
                      <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-10 px-4 py-2 text-sm font-medium transition-colors">
                        <Package className="h-4 w-4" /> npm install xr2-sdk
                      </button>
                    </a>
                  )}
                  {integrationTab === 'nocode' && (
                    <>
                      <a href="https://www.npmjs.com/package/@xr2/n8n-nodes-xr2" target="_blank" rel="noopener noreferrer">
                        <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-10 px-4 py-2 text-sm font-medium transition-colors">
                          <Package className="h-4 w-4" /> n8n node
                        </button>
                      </a>
                      <a href="https://eu2.make.com/app/invite/7314860fdac4e42901280ee576aed8c8" target="_blank" rel="noopener noreferrer">
                        <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-10 px-4 py-2 text-sm font-medium transition-colors">
                          <Workflow className="h-4 w-4" /> Make.com
                        </button>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100} className="min-w-0 hidden lg:block">
              <div className="rounded-xl border border-border bg-card overflow-hidden min-w-0">
                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                  <code className="text-sm font-mono text-foreground">
                    {integrationTab === 'python' ? 'pip install xr2-sdk' : integrationTab === 'nodejs' ? 'npm install xr2-sdk' : integrationTab === 'rest' ? 'curl — POST /api/v1/get-prompt' : 'n8n / Make.com'}
                  </code>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-xs sm:text-sm font-mono text-muted-foreground"><code>{integrationCode}</code></pre>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── How It Works (sniffmail-style) ─── */}
      <section id="how-it-works" className="bg-card scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{en ? 'How It Works' : 'Как это работает'}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance font-display">
                {en ? 'Four-step prompt management' : 'Как это устроено'}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground leading-relaxed">
                {en ? 'Every prompt goes through a structured workflow from creation to revenue tracking.' : 'Вы пишете промпт, подключаете к продукту, тестируете варианты и смотрите, какой приносит больше.'}
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="group relative rounded-xl border border-border bg-background p-6 transition-shadow hover:shadow-md">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                      {step.icon}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground font-mono">
                      {en ? 'Step' : 'Шаг'} {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground font-display">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          {/* Screenshots: Funnels & A/B Tests */}
          <div className="mt-20 grid gap-8 md:grid-cols-2">
            <ScrollReveal delay={100}>
              <button type="button" onClick={() => setLightboxSrc('/screenshots/analytics-funnels.png')} className="rounded-2xl border border-border/60 shadow-lg overflow-hidden bg-background cursor-zoom-in transition-shadow hover:shadow-xl">
                <Image
                  src="/screenshots/analytics-funnels.png"
                  alt={en ? 'Funnel Analytics — compare prompt versions by conversion' : 'Воронки — сравнение версий промптов по конверсии'}
                  width={1480}
                  height={900}
                  className="w-full h-auto"
                />
              </button>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <button type="button" onClick={() => setLightboxSrc('/screenshots/analytics-ab-tests.png')} className="rounded-2xl border border-border/60 shadow-lg overflow-hidden bg-background cursor-zoom-in transition-shadow hover:shadow-xl">
                <Image
                  src="/screenshots/analytics-ab-tests.png"
                  alt={en ? 'A/B Testing — statistical confidence and winner detection' : 'A/B тесты — статистическая значимость и определение победителя'}
                  width={1480}
                  height={900}
                  className="w-full h-auto"
                />
              </button>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Pricing (sniffmail-style) ─── */}
      <section id="pricing" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('landing.nav.pricing')}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance font-display">{t('landing.pricing.title')}</h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground leading-relaxed">{t('landing.pricing.subtitle')}</p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
            {(() => {
              const plan = getPlan('free')
              return (
                <ScrollReveal delay={100}>
                  <div className="relative rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">{t('landing.pricing.free.name')}</p>
                      <p className="mt-3 text-4xl font-bold tracking-tight text-foreground font-display">{plan.price_display}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.period_display}</p>
                    </div>
                    <ul className="mt-6 space-y-3 text-sm">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-muted-foreground">
                          <Check className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => router.push("/login")} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-sm font-medium transition-colors">
                      {t('landing.pricing.free.cta')} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </ScrollReveal>
              )
            })()}

            {(() => {
              const plan = getPlan('pro')
              return (
                <ScrollReveal delay={200}>
                  <div className="relative overflow-hidden rounded-xl border border-primary p-6 transition-shadow hover:shadow-md bg-card">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-bl-lg">
                      {en ? 'Most Popular' : 'Популярный'}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">{t('landing.pricing.pro.name')}</p>
                      <p className="mt-3 text-4xl font-bold tracking-tight text-foreground font-display">{plan.price_display}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.period_display}</p>
                    </div>
                    <ul className="mt-6 space-y-3 text-sm">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-muted-foreground">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => router.push("/login")} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium transition-colors">
                      {t('landing.pricing.pro.cta')} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </ScrollReveal>
              )
            })()}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {t('landing.pricing.needMore')}{' '}
            <a href="mailto:hello@xr2.uk" className="text-foreground hover:text-primary underline transition-colors">{t('landing.pricing.contactUs')}</a>
          </p>
        </div>
      </section>

      {/* ─── Comparison table ─── */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{en ? 'Compare' : 'Сравнение'}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance font-display">{en ? 'Why xR2?' : 'Почему xR2?'}</h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground leading-relaxed">{en ? 'Most prompt tools are built for ML engineers. xR2 is built for product and marketing teams.' : 'Большинство инструментов для промптов сделаны для ML-инженеров. xR2 — для продактов и маркетологов.'}</p>
            </div>
          </ScrollReveal>

          {/* Desktop table */}
          <ScrollReveal delay={100}>
            <div className="mt-12 rounded-xl border border-border bg-card overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-muted-foreground font-medium">{en ? 'Feature' : 'Функция'}</th>
                    <th className="p-4 text-center font-semibold text-primary">xR2</th>
                    <th className="p-4 text-center text-muted-foreground font-medium">PromptLayer</th>
                    <th className="p-4 text-center text-muted-foreground font-medium">Langfuse</th>
                    <th className="p-4 text-center text-muted-foreground font-medium">Humanloop</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => {
                    const renderCell = (val: boolean | string) =>
                      typeof val === 'boolean'
                        ? val ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : <XIcon className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                        : <span className="text-xs">{val}</span>
                    return (
                      <tr key={i} className={i < comparisonFeatures.length - 1 ? 'border-b border-border' : ''}>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">{row.feature}</td>
                        <td className="p-4 text-center font-medium">{renderCell(row.xr2)}</td>
                        <td className="p-4 text-center text-muted-foreground">{renderCell(row.promptlayer)}</td>
                        <td className="p-4 text-center text-muted-foreground">{renderCell(row.langfuse)}</td>
                        <td className="p-4 text-center text-muted-foreground">{renderCell(row.humanloop)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          {/* Mobile — xR2 advantages list */}
          <ScrollReveal delay={100}>
            <div className="mt-12 rounded-xl border border-border bg-card p-5 space-y-4 md:hidden">
              {comparisonFeatures.map((row, i) => {
                const xr2Val = row.xr2
                const alwaysHighlight = [
                  'Built for', 'Для кого',
                  'Prompt analytics dashboard', 'Аналитика по промптам',
                  'Starting price', 'Стартовая цена',
                ].includes(row.feature)
                const othersWorse = alwaysHighlight || [row.promptlayer, row.langfuse, row.humanloop].filter(v => v === false || v === 'Partial' || v === 'Частично').length >= 2
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${othersWorse ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'}`}>
                      {othersWorse
                        ? <Check className="h-3 w-3 text-emerald-600" />
                        : <Check className="h-3 w-3 text-muted-foreground" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{row.feature}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.feature === (en ? 'Starting price' : 'Стартовая цена')
                          ? <><span className="text-emerald-600 font-medium">{xr2Val}</span>{en ? ' — lowest on the market' : ' — самая низкая на рынке'}</>
                          : row.feature === (en ? 'Built for' : 'Для кого')
                          ? <span className="font-medium text-foreground">{xr2Val as string}</span>
                          : <>{typeof xr2Val === 'string' ? xr2Val : (en ? 'Supported' : 'Поддерживается')}{othersWorse && (en ? ' — unique to xR2' : ' — только у xR2')}</>
                        }
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Use Cases — 2-column horizontal cards (sniffmail-style) ─── */}
      <section id="use-cases" className="bg-card scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{en ? 'Use Cases' : 'Кейсы'}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance font-display">
                {en ? 'Where teams use xR2' : 'Где команды используют xR2'}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground leading-relaxed">
                {en ? 'Real scenarios where prompt management pays off.' : 'Сценарии, в которых управление промптами окупается.'}
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {useCases.map((uc, i) => {
              const Icon = uc.icon
              return (
                <ScrollReveal key={i} delay={i * 80} className="h-full">
                  <div className="flex h-full gap-5 rounded-xl border border-border bg-background p-6 transition-shadow hover:shadow-md">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground font-display">{uc.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{uc.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Blog highlights ─── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{en ? 'From the Blog' : 'Блог'}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance font-display">
                {en ? 'Learn how teams manage AI prompts' : 'Как команды управляют промптами'}
              </h2>
            </div>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {(en ? [
              { href: "/blog/n8n-prompt-management", title: "Prompt Management for n8n", desc: "Stop hardcoding system prompts. Fetch them at runtime with a native n8n node." },
              { href: "/blog/prompt-versioning", title: "Version Control for AI Prompts", desc: "Draft, test, and promote prompts. Roll back instantly when something breaks." },
              { href: "/blog/prompt-ab-testing", title: "A/B Test AI Prompts", desc: "Run experiments on prompt variants. Measure conversions and revenue, not just vibes." },
            ] : [
              { href: "/blog/n8n-prompt-management", title: "Управление промптами в n8n", desc: "Централизуйте промпты и загружайте их на лету через нативную ноду xR2." },
              { href: "/blog/prompt-versioning", title: "Версионирование промптов", desc: "Черновики, тестирование, продакшен. Откатывайте мгновенно при проблемах." },
              { href: "/blog/prompt-ab-testing", title: "A/B тесты промптов", desc: "Эксперименты над вариантами промптов. Измеряйте конверсии и выручку." },
            ]).map((post, i) => (
              <ScrollReveal key={post.href} delay={i * 80}>
                <Link
                  href={post.href}
                  className="group block rounded-xl border border-border p-6 transition-colors hover:bg-muted/50 h-full"
                >
                  <h3 className="text-base font-bold text-foreground font-display group-hover:underline underline-offset-4">{post.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {en ? 'Read more' : 'Читать'} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {en ? 'View all articles →' : 'Все статьи →'}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA — inverted card with glow (sniffmail-style) ─── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-16 text-center md:px-16">
              {/* Glow */}
              <div className="absolute inset-0 -z-0">
                <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-background md:text-4xl text-balance font-display">{t('landing.cta.title')}</h2>
                <p className="mx-auto mt-4 max-w-md text-background/70 leading-relaxed">{t('landing.cta.subtitle')}</p>
                <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <button onClick={() => router.push("/login")} className="inline-flex items-center justify-center gap-2 h-11 rounded-md bg-accent px-8 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
                    {t('landing.cta.button')} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-6 text-sm text-background/70">
                  {en ? '10 free prompts/month. No credit card required.' : '10 бесплатных промптов и 1000 запросов в месяц.'}
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      </main>

      {/* ─── Lightbox ─── */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out" onClick={() => setLightboxSrc(null)}>
          <button type="button" onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X className="h-8 w-8" />
          </button>
          <Image
            src={lightboxSrc}
            alt=""
            width={2960}
            height={1800}
            className="max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ─── Footer (sniffmail-style) ─── */}
      <footer className="bg-card">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between mb-10">
            <div>
              <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-6 w-auto mb-3" />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{t('landing.footer.description')}</p>
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
                <p className="text-sm font-semibold mb-3">{t('landing.footer.productTitle')}</p>
                <div className="space-y-2.5">
                  <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{en ? 'How It Works' : 'Как работает'}</a>
                  <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.nav.pricing')}</a>
                  <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.public_docs')}</a>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-3">{t('landing.footer.companyTitle')}</p>
                <div className="space-y-2.5">
                  <Link href="/legal/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.privacy')}</Link>
                  <Link href="/legal/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.terms')}</Link>
                  <Link href="/legal/cookies" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.cookies')}</Link>
                  <Link href="/blog" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
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

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} xR2. {en ? 'All rights reserved.' : 'Все права защищены.'}</p>
            <a href="https://portfolio.xr2.uk" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{en ? 'Built by Pavel Kuzko' : 'Создатель — Павел Кузько'}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
