"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle, Zap } from "lucide-react"
import { getUserLimits, UserLimits } from "@/lib/api"

export function UserLimitsDisplay({ isCollapsed = false }: { isCollapsed?: boolean }) {
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

  const promptsPercent = limits.limits.prompts.max > 0 
    ? (limits.limits.prompts.current / limits.limits.prompts.max) * 100
    : 0

  const apiPercent = limits.limits.api_requests.max > 0
    ? (limits.limits.api_requests.current / limits.limits.api_requests.max) * 100
    : 0

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
                  promptsPercent >= 90 ? 'bg-red-100' : promptsPercent >= 70 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <span className={`text-xs font-bold ${
                    promptsPercent >= 90 ? 'text-red-600' : promptsPercent >= 70 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {limits.limits.prompts.current}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-sm">
                <div className="font-medium">Prompts</div>
                <div>{limits.limits.prompts.current} / {limits.limits.prompts.max}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {limits.limits.prompts.max - limits.limits.prompts.current} remaining
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  apiPercent >= 90 ? 'bg-red-100' : apiPercent >= 70 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <Zap className={`w-3 h-3 ${
                    apiPercent >= 90 ? 'text-red-600' : apiPercent >= 70 ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-sm">
                <div className="font-medium">API Requests (24h)</div>
                <div>{limits.limits.api_requests.current} / {limits.limits.api_requests.max}</div>
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
      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Usage</div>
      
      {/* Prompts Limit */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">Prompts</span>
          <span className="text-slate-700 font-medium">
            {limits.limits.prompts.current} / {limits.limits.prompts.max}
          </span>
        </div>
        <Progress 
          value={promptsPercent} 
          className="h-1.5"
          indicatorClassName={
            promptsPercent >= 90 ? 'bg-red-500' : 
            promptsPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
          }
        />
        {promptsPercent >= 90 && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span>Limit almost reached</span>
          </div>
        )}
      </div>

      {/* API Requests Limit */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">API Requests (24h)</span>
          <span className="text-slate-700 font-medium">
            {limits.limits.api_requests.current} / {limits.limits.api_requests.max}
          </span>
        </div>
        <Progress 
          value={apiPercent} 
          className="h-1.5"
          indicatorClassName={
            apiPercent >= 90 ? 'bg-red-500' : 
            apiPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
          }
        />
        {apiPercent >= 90 && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span>Limit almost reached</span>
          </div>
        )}
      </div>
    </div>
  )
}