"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Loader2,
  GitBranch,
  FlaskConical,
  Puzzle,
  Check,
  RefreshCw,
  LineChart,
  Menu,
  X,
  MousePointerClick
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
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
    {
      title: "No Dev Team Needed",
      description: "Deploy and update prompts yourself. No tickets, no waiting, no code changes required."
    },
    {
      title: "Set Up in Clicks",
      description: "Get started in minutes. Create prompts, define variables, and go live with just a few clicks."
    },
    {
      title: "Ready Integrations",
      description: "Using n8n, Make, or Zapier? We've got ready-made integrations and SDKs for your stack."
    },
    {
      title: "Custom Metrics & Reports",
      description: "Define any metrics you need. Build performance reports that matter to your business."
    },
    {
      title: "A/B Testing Made Easy",
      description: "Run A/B tests with ease. Split traffic, compare variants, pick winners with confidence."
    },
    {
      title: "Full Version History",
      description: "Keep full version history of every prompt. Compare, analyze, and rollback anytime."
    }
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="xR2"
                width={60}
                height={25}
                className="h-6 w-auto"
              />
            </Link>

            {/* CTA Button */}
            <div className="hidden md:flex items-center">
              <Button
                onClick={() => router.push("/login")}
                className="font-medium px-5"
              >
                Sign In
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-6 py-4 space-y-4">
              <a href="#features" className="block text-gray-600 hover:text-gray-900 py-2 font-medium">Features</a>
              <a href="#pricing" className="block text-gray-600 hover:text-gray-900 py-2 font-medium">Pricing</a>
              <div className="pt-4">
                <Button onClick={() => router.push("/login")} className="w-full">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28">
        {/* Subtle Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-gray-50 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Eyebrow — what is this product */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm mb-6 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#E63355]"></span>
              AI Prompt Management Platform
            </div>

            {/* Headline — Data-driven, medium length */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.15]">
              <span className="text-gray-900">Stop guessing which prompt works.</span>
              <br />
              <span className="text-[#E63355]">Start measuring.</span>
            </h1>

            {/* Subheadline — Clear value prop */}
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect AI prompts to real revenue. A/B test variants, track conversions,
              and iterate instantly — <span className="text-gray-700 font-medium">without deploys or dev tickets.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Button
                onClick={() => router.push("/login")}
                size="lg"
                className="w-full sm:w-auto font-medium px-8"
              >
                Get Started
              </Button>
            </div>

            {/* Trust signals */}
            <p className="text-sm text-gray-400">
              Free forever up to 1K calls · No credit card · Setup in 5 minutes
            </p>
          </div>

          {/* Hero Visual - Real Dashboard Preview */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="relative">
              {/* Shadow */}
              <div className="absolute -inset-4 bg-gradient-to-b from-gray-100/50 to-transparent rounded-3xl blur-2xl" />

              {/* Dashboard */}
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
                  <div className="flex-1 flex flex-col min-h-[400px]">
                    {/* Filters Bar */}
                    <div className="px-4 py-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative w-full max-w-[140px]">
                            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" placeholder="Search..." className="w-full pl-6 pr-2 py-1 text-xs border border-slate-200 rounded-md bg-white" readOnly />
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

                    {/* Table Header */}
                    <div className="bg-slate-50 px-4 py-3 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        <div className="col-span-1 flex items-center">
                          <input type="checkbox" className="rounded border-slate-300" readOnly />
                        </div>
                        <div className="col-span-4">Name</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Updated</div>
                        <div className="col-span-1">Usage</div>
                        <div className="col-span-2">Owner</div>
                      </div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-slate-100">
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
                              <input type="checkbox" className="rounded border-slate-300" readOnly />
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A/B Testing & ROI Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Make every prompt count.</h2>
            <p className="text-gray-500">Compare performance. Pick winners. Ship faster.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* A/B Test Results Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-slate-600" />
                  <span className="text-slate-800 font-semibold">A/B Test Results</span>
                </div>
                <span className="text-[#E63355] text-sm font-semibold bg-red-50 px-3 py-1 rounded-full">+23% conversion</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm font-medium">Variant A — Original</span>
                    <span className="text-gray-500 text-sm">45%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-gray-400 h-3 rounded-full" style={{width: '45%'}} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 text-sm font-medium">Variant B — New CTA</span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Winner</span>
                    </div>
                    <span className="text-emerald-600 text-sm font-semibold">68%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-emerald-500 h-3 rounded-full" style={{width: '68%'}} />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-gray-400 text-sm">2,847 impressions · 95% confidence</span>
                <button className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg font-medium">Deploy Winner</button>
              </div>
            </div>

            {/* Revenue by Prompt Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-slate-600" />
                  <span className="text-slate-800 font-semibold">Revenue by Prompt</span>
                </div>
                <span className="text-gray-400 text-sm">Last 7 days</span>
              </div>

              <div className="space-y-4">
                {[
                  { name: "onboarding-welcome", revenue: "$12,450", pct: 100, color: "bg-slate-800" },
                  { name: "upgrade-cta", revenue: "$8,320", pct: 67, color: "bg-slate-600" },
                  { name: "checkout-helper", revenue: "$4,180", pct: 34, color: "bg-slate-400" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 text-sm font-medium">{item.name}</span>
                      <span className="text-gray-800 text-sm font-semibold">{item.revenue}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className={`${item.color} h-3 rounded-full`} style={{width: `${item.pct}%`}} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-gray-400 text-sm">3 prompts tracked</span>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Total Revenue</div>
                  <div className="text-xl font-bold text-emerald-600">$24,950</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Bar */}
      <section className="py-20 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-base text-gray-400 mb-12 uppercase tracking-wide font-medium">Works with your stack</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16">
            {/* Python */}
            <div className="group cursor-default flex flex-col items-center gap-3">
              <svg className="h-14 w-14 text-gray-400 group-hover:text-[#3776AB] transition-colors" viewBox="0 0 256 255" fill="currentColor">
                <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z"/>
                <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z"/>
              </svg>
              <span className="text-sm text-gray-400 font-medium">Python</span>
            </div>
            {/* Node.js */}
            <div className="group cursor-default flex flex-col items-center gap-3">
              <svg className="h-14 w-14 text-gray-400 group-hover:text-[#339933] transition-colors" viewBox="0 0 256 289" fill="currentColor">
                <path d="M128 288.464c-3.975 0-7.685-1.06-11.13-2.915l-35.247-20.936c-5.3-2.915-2.65-3.975-1.06-4.505 7.155-2.385 8.48-2.915 15.9-7.156.796-.53 1.856-.265 2.65.265l27.032 16.166c1.06.53 2.385.53 3.18 0l105.74-61.217c1.06-.53 1.59-1.59 1.59-2.915V83.08c0-1.325-.53-2.385-1.59-2.915l-105.74-60.953c-1.06-.53-2.385-.53-3.18 0L20.405 80.166c-1.06.53-1.59 1.855-1.59 2.915v122.17c0 1.06.53 2.385 1.59 2.915l28.887 16.695c15.636 7.95 25.44-1.325 25.44-10.6V93.68c0-1.59 1.326-3.18 3.181-3.18h13.516c1.59 0 3.18 1.325 3.18 3.18v120.58c0 20.936-11.396 33.126-31.272 33.126-6.095 0-10.865 0-24.38-6.625l-27.827-15.9C4.24 220.355 0 212.67 0 204.456V82.286C0 74.07 4.24 66.12 11.13 61.88L116.87 .663c6.625-3.71 15.635-3.71 22.26 0L244.87 61.88c6.89 4.24 11.13 12.19 11.13 20.406v122.17c0 8.215-4.24 16.165-11.13 20.406l-105.74 61.217c-3.445 1.59-7.42 2.385-11.13 2.385zm32.596-84.009c-46.377 0-55.917-21.2-55.917-39.221 0-1.59 1.325-3.18 3.18-3.18h13.78c1.59 0 2.916 1.06 2.916 2.65 2.12 14.046 8.215 20.936 36.307 20.936 22.26 0 31.802-5.035 31.802-16.96 0-6.891-2.65-11.926-37.367-15.372-28.887-2.915-46.907-9.275-46.907-32.33 0-21.467 18.02-34.187 48.232-34.187 33.921 0 50.617 11.66 52.737 37.102 0 .795-.265 1.59-.795 2.385-.53.53-1.325 1.06-2.12 1.06h-13.78c-1.326 0-2.65-1.06-2.916-2.385-3.18-14.576-11.395-19.346-33.126-19.346-24.38 0-27.296 8.48-27.296 14.84 0 7.686 3.445 10.07 36.307 14.311 32.596 4.24 47.967 10.335 47.967 33.126-.265 23.321-19.346 36.571-53.003 36.571z"/>
              </svg>
              <span className="text-sm text-gray-400 font-medium">Node.js</span>
            </div>
            {/* Make */}
            <div className="group cursor-default flex flex-col items-center gap-3">
              <svg className="h-14 w-14 grayscale group-hover:grayscale-0 transition-all" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="makeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF00FF"/>
                    <stop offset="100%" stopColor="#9333EA"/>
                  </linearGradient>
                  <linearGradient id="makeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7"/>
                    <stop offset="100%" stopColor="#7C3AED"/>
                  </linearGradient>
                  <linearGradient id="makeGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6"/>
                    <stop offset="100%" stopColor="#6D28D9"/>
                  </linearGradient>
                </defs>
                <rect x="6" y="10" width="10" height="28" rx="3" fill="url(#makeGrad1)" transform="rotate(15 11 24)"/>
                <rect x="19" y="10" width="10" height="28" rx="3" fill="url(#makeGrad2)" transform="rotate(8 24 24)"/>
                <rect x="32" y="10" width="10" height="28" rx="3" fill="url(#makeGrad3)"/>
              </svg>
              <span className="text-sm text-gray-400 font-medium">Make</span>
            </div>
            {/* n8n */}
            <div className="group cursor-default flex flex-col items-center gap-3">
              <svg className="h-14 w-28 text-gray-400 group-hover:text-[#EA4B71] transition-colors" viewBox="0 0 49 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M47.9855 4.8C47.9855 7.45098 45.8365 9.6 43.1855 9.6C40.949 9.6 39.0696 8.0703 38.5368 6H31.8352C30.662 6 29.6607 6.84822 29.4678 8.00544L29.2706 9.18912C29.0832 10.313 28.5147 11.2911 27.7108 12C28.5147 12.7089 29.0832 13.687 29.2706 14.8109L29.4678 15.9946C29.6607 17.1518 30.662 18 31.8352 18H33.7368C34.2696 15.9297 36.149 14.4 38.3855 14.4C41.0365 14.4 43.1855 16.549 43.1855 19.2C43.1855 21.851 41.0365 24 38.3855 24C36.149 24 34.2696 22.4703 33.7368 20.4H31.8352C29.4888 20.4 27.4863 18.7036 27.1005 16.3891L26.9032 15.2054C26.7104 14.0482 25.7091 13.2 24.5359 13.2H22.5782C21.979 15.1681 20.1495 16.6 17.9855 16.6C15.8216 16.6 13.9921 15.1681 13.3929 13.2H10.5782C9.97901 15.1681 8.14949 16.6 5.98554 16.6C3.33458 16.6 1.18555 14.4509 1.18555 11.8C1.18555 9.14904 3.33458 7.00002 5.98554 7.00002C8.29361 7.00002 10.2212 8.62902 10.6812 10.8H13.2899C13.7499 8.62902 15.6775 7.00002 17.9855 7.00002C20.2936 7.00002 22.2212 8.62902 22.6812 10.8H24.5359C25.7091 10.8 26.7104 9.95178 26.9032 8.79456L27.1005 7.61088C27.4863 5.29638 29.4888 3.6 31.8352 3.6H38.5368C39.0696 1.52973 40.949 0 43.1855 0C45.8365 0 47.9855 2.14903 47.9855 4.8ZM45.5855 4.8C45.5855 6.12546 44.511 7.2 43.1855 7.2C41.8601 7.2 40.7855 6.12546 40.7855 4.8C40.7855 3.47452 41.8601 2.4 43.1855 2.4C44.511 2.4 45.5855 3.47452 45.5855 4.8ZM5.98554 14.2C7.31105 14.2 8.38553 13.1255 8.38553 11.8C8.38553 10.4745 7.31105 9.40002 5.98554 9.40002C4.66006 9.40002 3.58554 10.4745 3.58554 11.8C3.58554 13.1255 4.66006 14.2 5.98554 14.2ZM17.9855 14.2C19.311 14.2 20.3855 13.1255 20.3855 11.8C20.3855 10.4745 19.311 9.40002 17.9855 9.40002C16.6601 9.40002 15.5855 10.4745 15.5855 11.8C15.5855 13.1255 16.6601 14.2 17.9855 14.2ZM38.3855 21.6C39.711 21.6 40.7855 20.5255 40.7855 19.2C40.7855 17.8745 39.711 16.8 38.3855 16.8C37.0601 16.8 35.9855 17.8745 35.9855 19.2C35.9855 20.5255 37.0601 21.6 38.3855 21.6Z"/>
              </svg>
              <span className="text-sm text-gray-400 font-medium">n8n</span>
            </div>
            {/* Zapier */}
            <div className="group cursor-default flex flex-col items-center gap-3">
              <svg className="h-14 w-14 text-gray-400 group-hover:text-[#FF4A00] transition-colors" viewBox="0 0 256 256" fill="currentColor">
                <path d="M128.080089,-0.000183105 C135.311053,0.0131003068 142.422517,0.624138494 149.335663,1.77979593 L149.335663,1.77979593 L149.335663,76.2997796 L202.166953,23.6044907 C208.002065,27.7488446 213.460883,32.3582023 218.507811,37.3926715 C223.557281,42.4271407 228.192318,47.8867213 232.346817,53.7047992 L232.346817,53.7047992 L179.512985,106.400063 L254.227854,106.400063 C255.387249,113.29414 256,120.36111 256,127.587243 L256,127.587243 L256,127.759881 C256,134.986013 255.387249,142.066204 254.227854,148.960282 L254.227854,148.960282 L179.500273,148.960282 L232.346817,201.642324 C228.192318,207.460402 223.557281,212.919983 218.523066,217.954452 L218.523066,217.954452 L218.507811,217.954452 C213.460883,222.988921 208.002065,227.6115 202.182208,231.742607 L202.182208,231.742607 L149.335663,179.04709 L149.335663,253.5672 C142.435229,254.723036 135.323765,255.333244 128.092802,255.348499 L128.092802,255.348499 L127.907197,255.348499 C120.673691,255.333244 113.590195,254.723036 106.677048,253.5672 L106.677048,253.5672 L106.677048,179.04709 L53.8457596,231.742607 C42.1780766,223.466917 31.977435,213.278734 23.6658953,201.642324 L23.6658953,201.642324 L76.4997269,148.960282 L1.78485803,148.960282 C0.612750404,142.052729 0,134.946095 0,127.719963 L0,127.719963 L0,127.349037 C0.0121454869,125.473817 0.134939797,123.182933 0.311311815,120.812834 L0.36577283,120.099764 C0.887996182,113.428547 1.78485803,106.400063 1.78485803,106.400063 L1.78485803,106.400063 L76.4997269,106.400063 L23.6658953,53.7047992 C27.8076812,47.8867213 32.4300059,42.4403618 37.4769335,37.4193681 L37.4769335,37.4193681 L37.5023588,37.3926715 C42.5391163,32.3582023 48.0106469,27.7488446 53.8457596,23.6044907 L53.8457596,23.6044907 L106.677048,76.2997796 L106.677048,1.77979593 C113.590195,0.624138494 120.688946,0.0131003068 127.932622,-0.000183105 L127.932622,-0.000183105 L128.080089,-0.000183105 Z M128.067377,95.7600714 L127.945335,95.7600714 C118.436262,95.7600714 109.32891,97.5001809 100.910584,100.661566 C97.7553011,109.043534 96.0085811,118.129275 95.9958684,127.613685 L95.9958684,127.733184 C96.0085811,137.217594 97.7553011,146.303589 100.923296,154.685303 C109.32891,157.846943 118.436262,159.587052 127.945335,159.587052 L128.067377,159.587052 C137.576449,159.587052 146.683802,157.846943 155.089415,154.685303 C158.257411,146.290368 160.004131,137.217594 160.004131,127.733184 L160.004131,127.613685 C160.004131,118.129275 158.257411,109.043534 155.089415,100.661566 C146.683802,97.5001809 137.576449,95.7600714 128.067377,95.7600714 Z"/>
              </svg>
              <span className="text-sm text-gray-400 font-medium">Zapier</span>
            </div>
            {/* REST API */}
            <div className="group cursor-default flex flex-col items-center gap-3">
              <svg className="h-14 w-14 text-gray-400 group-hover:text-gray-700 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              <span className="text-sm text-gray-400 font-medium">REST API</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              If you're a product person,
              <br />
              <span className="text-[#E63355]">you'll love this:</span>
            </h2>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm mb-6 font-medium">
              Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Start free.
              <br />
              <span className="text-gray-400">Scale as you grow.</span>
            </h2>
            <p className="text-gray-500">No credit card required. Cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="text-gray-500 text-sm font-medium mb-2">Free</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">Perfect for getting started.</p>

              <ul className="space-y-3 mb-8">
                {[
                  'Up to 10 prompts',
                  '1,000 API calls/month',
                  'Basic analytics',
                  '1 workspace'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 text-sm">
                    <Check className="h-4 w-4 text-gray-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => router.push("/login")}
                variant="outline"
                className="w-full"
              >
                Get Started
              </Button>
            </div>

            {/* Pro */}
            <div className="relative bg-white rounded-xl p-8 border-2 border-[#E63355]">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-[#E63355] text-white rounded-full text-xs font-medium">
                Recommended
              </div>

              <div className="text-gray-500 text-sm font-medium mb-2">Pro</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-gray-900">$29</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">For teams that need more.</p>

              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited prompts',
                  '100,000 API calls/month',
                  'A/B testing & advanced analytics',
                  'Unlimited workspaces',
                  'Team collaboration'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 text-sm">
                    <Check className="h-4 w-4 text-[#E63355]" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-[#E63355] hover:bg-[#d42d4d]"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} xR2 · Stop guessing which prompt works. Start measuring.
          </p>
        </div>
      </footer>
    </div>
  )
}
