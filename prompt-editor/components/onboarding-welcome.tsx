"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Sparkles, Code, BarChart3, TestTubes, GitBranch, Zap, TrendingUp, GitCompare, Puzzle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'

interface OnboardingWelcomeProps {
  isOpen: boolean
  onClose: () => void
  apiKey?: string
  onCreatePrompt?: () => void
}

type OnboardingStep = {
  icon: any
  title: string
  description: string
  features: string[]
  visual: string
}

const getSteps = (t: (key: string, params?: Record<string, string | number>) => string): OnboardingStep[] => [
  {
    icon: Sparkles,
    title: t('onboarding.steps.prompts.title'),
    description: t('onboarding.steps.prompts.description'),
    features: [
      t('onboarding.steps.prompts.features.history'),
      t('onboarding.steps.prompts.features.variables'),
      t('onboarding.steps.prompts.features.instantUpdates'),
      t('onboarding.steps.prompts.features.collaboration')
    ],
    visual: "prompt-editor"
  },
  {
    icon: Code,
    title: t('onboarding.steps.api.title'),
    description: t('onboarding.steps.api.description'),
    features: [
      t('onboarding.steps.api.features.rest'),
      t('onboarding.steps.api.features.examples'),
      t('onboarding.steps.api.features.auth'),
      t('onboarding.steps.api.features.platforms')
    ],
    visual: "api-integration"
  },
  {
    icon: Puzzle,
    title: t('onboarding.steps.sdk.title'),
    description: t('onboarding.steps.sdk.description'),
    features: [
      t('onboarding.steps.sdk.features.make'),
      t('onboarding.steps.sdk.features.n8n'),
      t('onboarding.steps.sdk.features.nocode'),
      t('onboarding.steps.sdk.features.templates')
    ],
    visual: "sdk-integration"
  },
  {
    icon: BarChart3,
    title: t('onboarding.steps.analytics.title'),
    description: t('onboarding.steps.analytics.description'),
    features: [
      t('onboarding.steps.analytics.features.realtime'),
      t('onboarding.steps.analytics.features.costs'),
      t('onboarding.steps.analytics.features.performance'),
      t('onboarding.steps.analytics.features.trends')
    ],
    visual: "analytics"
  },
  {
    icon: TestTubes,
    title: t('onboarding.steps.ab.title'),
    description: t('onboarding.steps.ab.description'),
    features: [
      t('onboarding.steps.ab.features.multiple'),
      t('onboarding.steps.ab.features.traffic'),
      t('onboarding.steps.ab.features.significance'),
      t('onboarding.steps.ab.features.decisions')
    ],
    visual: "ab-testing"
  }
]

const steps = [
  {
    icon: Sparkles,
    title: "Create & Manage Prompts",
    description: "Build AI prompts with full version control. Use template variables to create reusable prompts that work across all your applications.",
    features: [
      "Full version history — track every change",
      "Template variables — dynamic prompts",
      "Instant updates — no code deployment needed",
      "Team collaboration — work together in real-time"
    ],
    visual: "prompt-editor"
  },
  {
    icon: Code,
    title: "Integrate via REST API",
    description: "Access your prompts from any application, language, or platform. Simple API calls replace hardcoded prompts in your codebase.",
    features: [
      "REST API — works with any stack",
      "Ready-to-use code examples",
      "Secure API key authentication",
      "Works with mobile, web, and backend apps"
    ],
    visual: "api-integration"
  },
  {
    icon: Puzzle,
    title: "Use Ready-Made SDKs",
    description: "Integrate prompts easily with no-code platforms using our ready-made SDKs and plugins. Connect xR2 to Make.com, n8n, and other automation tools.",
    features: [
      "Make.com integration — drag & drop blocks",
      "n8n custom node — visual workflow builder",
      "No-code setup — no programming required",
      "Pre-configured templates — get started instantly"
    ],
    visual: "sdk-integration"
  },
  {
    icon: BarChart3,
    title: "Analytics & Performance",
    description: "See exactly how your prompts perform. Track usage, costs, response times, and user engagement in real-time.",
    features: [
      "Real-time usage statistics",
      "Cost tracking per prompt",
      "Performance metrics & latency",
      "Usage trends & insights"
    ],
    visual: "analytics"
  },
  {
    icon: TestTubes,
    title: "A/B Testing & Optimization",
    description: "Test different prompt versions simultaneously. Measure conversion rates, user satisfaction, and automatically identify winning variants.",
    features: [
      "A/B test multiple prompt versions",
      "Traffic splitting & conversion tracking",
      "Statistical significance detection",
      "Data-driven optimization decisions"
    ],
    visual: "ab-testing"
  }
]

// Visual illustration components for each step
const VisualIllustration = ({ type, t }: { type: string, t: (key: string, params?: Record<string, string | number>) => string }) => {
  switch (type) {
    case "prompt-editor":
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 overflow-hidden">
          <div className="absolute inset-0 p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="h-2 bg-slate-300 rounded w-24"></div>
              <div className="h-2 bg-slate-200 rounded w-16 ml-auto"></div>
            </div>
            <div className="flex-1 bg-white rounded border border-slate-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-slate-400" />
                <div className="h-1.5 bg-blue-200 rounded w-32"></div>
              </div>
              <div className="space-y-1.5">
                <div className="h-1 bg-slate-200 rounded w-full"></div>
                <div className="h-1 bg-slate-200 rounded w-5/6"></div>
                <div className="h-1 bg-blue-100 rounded w-20"></div>
                <div className="h-1 bg-slate-200 rounded w-full"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 bg-slate-200 rounded w-16"></div>
              <div className="h-6 bg-slate-900 rounded w-20"></div>
            </div>
          </div>
        </div>
      )
    case "api-integration":
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 overflow-hidden">
          <div className="absolute inset-0 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-slate-400" />
              <div className="h-2 bg-slate-300 rounded w-32"></div>
            </div>
            <div className="flex-1 bg-slate-900 rounded p-2 font-mono text-[10px] text-green-400 space-y-1">
              <div className="text-slate-400">curl -X POST \</div>
              <div className="text-green-300">https://xr2.uk/api/v1/get-prompt</div>
              <div className="text-slate-400">-H "Authorization: Bearer xr2_..."</div>
              <div className="text-slate-400">-d '{"{"}"slug": "welcome", "source_name": "user"{"}"}'</div>
              <div className="mt-1 pt-1 border-t border-slate-700">
                <div className="text-green-400">✓ 200 OK</div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div className="h-1.5 bg-yellow-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      )
    case "sdk-integration":
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 overflow-hidden">
          <div className="absolute inset-0 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-slate-400" />
              <div className="h-2 bg-slate-300 rounded w-32"></div>
            </div>
            <div className="flex-1 bg-white rounded border border-slate-200 p-3 space-y-2">
              {/* Make.com block */}
              <div className="flex items-center gap-2 p-1.5 bg-purple-50 rounded border border-purple-200">
                <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                  <Puzzle className="w-3 h-3 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-900">Make.com</div>
                  <div className="text-[10px] text-slate-600">{t('onboarding.visual.sdk.makeModule')}</div>
                </div>
              </div>
              {/* n8n block */}
              <div className="flex items-center gap-2 p-1.5 bg-blue-50 rounded border border-blue-200">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-900">n8n</div>
                  <div className="text-[10px] text-slate-600">{t('onboarding.visual.sdk.n8nNode')}</div>
                </div>
              </div>
              {/* Connection status */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-[10px] text-slate-600">{t('onboarding.visual.sdk.connected')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 bg-purple-200 rounded w-20"></div>
              <div className="h-6 bg-blue-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      )
    case "analytics":
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 overflow-hidden">
          <div className="absolute inset-0 p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <div className="text-[10px] font-medium text-slate-600 truncate">{t('onboarding.visual.analytics.requestsTitle')}</div>
            </div>
              <div className="flex-1 bg-white rounded border border-slate-200 p-3 space-y-2">
                {/* Requests by Source */}
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-slate-600">{t('onboarding.visual.analytics.requestsTitle')}</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700">{t('onboarding.visual.analytics.mobile')}</span>
                      <span className="text-[10px] font-semibold text-slate-900">842</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700">{t('onboarding.visual.analytics.web')}</span>
                      <span className="text-[10px] font-semibold text-slate-900">356</span>
                    </div>
                  </div>
                </div>
                
                {/* Revenue by Prompt */}
                <div className="space-y-1 pt-1 border-t border-slate-200">
                  <div className="text-[10px] font-medium text-slate-600">{t('onboarding.visual.analytics.revenueTitle')}</div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700 truncate">welcome-message</span>
                      <span className="text-[10px] font-semibold text-green-600">$1,240</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700 truncate">checkout-assistant</span>
                      <span className="text-[10px] font-semibold text-green-600">$890</span>
                    </div>
                  </div>
                </div>

                {/* Version Performance */}
                <div className="space-y-1 pt-1 border-t border-slate-200">
                  <div className="text-[10px] font-medium text-slate-600">{t('onboarding.visual.analytics.versionPerformance')}</div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700">welcome-message v2</span>
                      <span className="text-[10px] font-semibold text-green-600">+15%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700">checkout-assistant v3</span>
                      <span className="text-[10px] font-semibold text-green-600">+8%</span>
                    </div>
                  </div>
                </div>
              </div>
            <div className="flex gap-2">
              <div className="h-6 bg-slate-200 rounded w-16"></div>
              <div className="h-6 bg-slate-900 rounded w-20"></div>
            </div>
          </div>
        </div>
      )
    case "ab-testing":
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 overflow-hidden">
          <div className="absolute inset-0 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <TestTubes className="w-4 h-4 text-slate-400" />
              <div className="h-2 bg-slate-300 rounded w-24"></div>
            </div>
            <div className="flex-1 bg-white rounded border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div className="text-xs font-medium text-slate-900">{t('onboarding.visual.variantA')}</div>
                </div>
                <div className="text-xs text-slate-600">{t('onboarding.visual.traffic', { percent: 45 })}</div>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-3 h-3 text-green-600" />
                  <div className="text-xs font-medium text-slate-900">{t('onboarding.visual.variantB')}</div>
                  <div className="text-xs text-green-600 font-semibold">{t('onboarding.visual.winner')}</div>
                </div>
                <div className="text-xs text-slate-600">{t('onboarding.visual.traffic', { percent: 55 })}</div>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>{t('onboarding.visual.conversion')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}

export function OnboardingWelcome({ isOpen, onClose, apiKey, onCreatePrompt }: OnboardingWelcomeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { refreshUser, user } = useAuth()
  const { t } = useLocale()
  const steps = useMemo(() => getSteps(t), [t])

  const userNeedsOnboarding = user && (
    user.onboarding_completed === false ||
    user.onboarding_completed === undefined ||
    user.onboarding_completed === null ||
    String(user.onboarding_completed).toLowerCase() === 'false'
  )

  const [shouldShow, setShouldShow] = useState(isOpen || userNeedsOnboarding)

  useEffect(() => {
    const needsOnboarding = user && (
      user.onboarding_completed === false ||
      user.onboarding_completed === undefined ||
      user.onboarding_completed === null ||
      String(user.onboarding_completed).toLowerCase() === 'false'
    )

    if (needsOnboarding) {
      setShouldShow(true)
      setCurrentStep(0)
    } else if (user && user.onboarding_completed === true) {
      setShouldShow(false)
    } else {
      setShouldShow(isOpen)
    }
  }, [isOpen, user])

  const markOnboardingCompleted = async () => {
    try {
      await apiClient.completeOnboarding(true)
      await refreshUser()
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_completed', 'true')
      }
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error)
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_completed', 'true')
      }
    }
  }

  const handleSkip = async () => {
    await markOnboardingCompleted()
    onClose()
  }

  const handleGetStarted = async () => {
    await markOnboardingCompleted()
    onClose()
    if (onCreatePrompt) {
      onCreatePrompt()
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const finalIsOpen = shouldShow || userNeedsOnboarding || false

  return (
    <Dialog open={finalIsOpen} onOpenChange={(open) => {
      if (!open && !userNeedsOnboarding) {
        handleSkip()
      }
    }}>
      <DialogContent className="max-w-xl p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {t('onboarding.title')}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 mt-1">
            {t('onboarding.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-slate-900'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={t('onboarding.goToStep', { step: index + 1 })}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {t('onboarding.progress', { current: currentStep + 1, total: steps.length })}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                {steps[currentStep].title}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {steps[currentStep].description}
              </p>
            </div>

            {/* Features list */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <ul className="space-y-2">
                {steps[currentStep].features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full flex-shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual illustration */}
            <div className="mt-4">
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                <VisualIllustration type={steps[currentStep].visual} t={t} />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-xs text-slate-600 hover:text-slate-900 h-8 px-3"
          >
            {t('onboarding.skip')}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="h-8 px-3 text-xs text-slate-700 hover:text-slate-900 disabled:opacity-40"
            >
              <ChevronLeft className="w-3 h-3 mr-1" />
              {t('onboarding.prev')}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                className="h-8 px-4 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium"
              >
                {t('onboarding.next')}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleGetStarted}
                className="h-8 px-4 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium"
              >
                {t('onboarding.getStarted')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
