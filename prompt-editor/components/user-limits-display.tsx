"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle, Zap } from "lucide-react"
import { getUserLimits, UserLimits } from "@/lib/api"
import { useLocale } from "@/contexts/locale-context"

export function UserLimitsDisplay({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { t } = useLocale()
  const [limits, setLimits] = useState<UserLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLimits()
  }, [])

  const fetchLimits = async () => {
    try {
      setLoading(true)
      const data = await getUserLimits()
      setLimits(data)
    } catch (err) {
      console.error('Error fetching limits:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading || error || !limits || limits.is_superuser || limits.limits.is_superuser) {
    return null // Don't show for superusers or when loading/error
  }

  const promptsUnlimited = limits.limits.prompts.max === -1
  const apiUnlimited = limits.limits.api_requests.max === -1

  const promptsPercent = promptsUnlimited ? 0 : (limits.limits.prompts.max > 0
    ? (limits.limits.prompts.current / limits.limits.prompts.max) * 100
    : 0)

  const apiPercent = apiUnlimited ? 0 : (limits.limits.api_requests.max > 0
    ? (limits.limits.api_requests.current / limits.limits.api_requests.max) * 100
    : 0)

  const resetTime = new Date(limits.limits.api_requests.reset_time)
  const resetTimeStr = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isCollapsed) {
    // Compact view for collapsed sidebar - just icons with tooltips
    return (
      <TooltipProvider>
        <div className="space-y-2 px-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  promptsUnlimited ? 'bg-green-50' : promptsPercent >= 100 ? 'bg-red-50' : promptsPercent >= 70 ? 'bg-amber-50' : 'bg-emerald-50'
                }`}>
                  <span className={`text-xs font-bold ${
                    promptsUnlimited ? 'text-green-500' : promptsPercent >= 100 ? 'text-red-400' : promptsPercent >= 70 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {promptsUnlimited ? '∞' : limits.limits.prompts.current}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-sm">
                <div className="font-medium">{t('sidebar.prompts')}</div>
                <div className={promptsUnlimited ? 'text-green-600' : ''}>
                  {promptsUnlimited ? t('sidebar.unlimited') : `${limits.limits.prompts.current} / ${limits.limits.prompts.max}`}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  apiUnlimited ? 'bg-green-50' : apiPercent >= 100 ? 'bg-red-50' : apiPercent >= 70 ? 'bg-amber-50' : 'bg-emerald-50'
                }`}>
                  <Zap className={`w-3 h-3 ${
                    apiUnlimited ? 'text-green-500' : apiPercent >= 100 ? 'text-red-400' : apiPercent >= 70 ? 'text-amber-400' : 'text-emerald-400'
                  }`} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-sm">
                <div className="font-medium">{t('sidebar.apiRequestsMonthly')}</div>
                <div className={apiUnlimited ? 'text-green-600' : ''}>
                  {apiUnlimited ? t('sidebar.unlimited') : `${limits.limits.api_requests.current} / ${limits.limits.api_requests.max}`}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  // Full view for expanded sidebar
  return (
    <div className="px-4 py-2 space-y-3 border-t border-slate-200">
      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('sidebar.usage')}</div>

      {/* Prompts Limit */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">{t('sidebar.prompts')}</span>
          <span className={`font-medium ${promptsUnlimited ? 'text-green-600' : 'text-slate-700'}`}>
            {promptsUnlimited ? t('sidebar.unlimited') : `${limits.limits.prompts.current} / ${limits.limits.prompts.max}`}
          </span>
        </div>
        {!promptsUnlimited && (
          <>
            <Progress
              value={promptsPercent}
              className="h-1.5"
              indicatorClassName={
                promptsPercent >= 100 ? 'bg-red-300' :
                promptsPercent >= 90 ? 'bg-amber-300' :
                promptsPercent >= 70 ? 'bg-amber-300' : 'bg-emerald-300'
              }
            />
            {promptsPercent >= 100 && (
              <div className="flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="w-3 h-3" />
                <span>{t('sidebar.limitReached')}</span>
              </div>
            )}
            {promptsPercent >= 90 && promptsPercent < 100 && (
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <AlertTriangle className="w-3 h-3" />
                <span>{t('sidebar.limitAlmostReached')}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* API Requests Limit */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">{t('sidebar.apiRequestsMonthly')}</span>
          <span className={`font-medium ${apiUnlimited ? 'text-green-600' : 'text-slate-700'}`}>
            {apiUnlimited ? t('sidebar.unlimited') : `${limits.limits.api_requests.current} / ${limits.limits.api_requests.max}`}
          </span>
        </div>
        {!apiUnlimited && (
          <>
            <Progress
              value={apiPercent}
              className="h-1.5"
              indicatorClassName={
                apiPercent >= 100 ? 'bg-red-300' :
                apiPercent >= 90 ? 'bg-amber-300' :
                apiPercent >= 70 ? 'bg-amber-300' : 'bg-emerald-300'
              }
            />
            {apiPercent >= 100 && (
              <div className="flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="w-3 h-3" />
                <span>{t('sidebar.limitReached')}</span>
              </div>
            )}
            {apiPercent >= 90 && apiPercent < 100 && (
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <AlertTriangle className="w-3 h-3" />
                <span>{t('sidebar.limitAlmostReached')}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}