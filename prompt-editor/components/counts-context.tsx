"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getCounts, invalidateCache } from '@/lib/api'
import { useWorkspaceContext } from './workspace-context'
import { useAuth } from '@/contexts/auth-context'

interface CountsContextType {
  promptsCount: number
  apiKeysCount: number
  isLoading: boolean
  error: string | null
  refetchCounts: () => Promise<void>
  invalidateAndRefetch: () => Promise<void>
}

const CountsContext = createContext<CountsContextType | undefined>(undefined)

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes
const RETRY_INTERVAL = 30 * 1000 // 30 seconds for retries
const MAX_RETRY_ATTEMPTS = 3 // Maximum retry attempts before giving up
const EXPONENTIAL_BACKOFF_BASE = 2 // Base for exponential backoff

export function CountsProvider({ children }: { children: ReactNode }) {
  const [promptsCount, setPromptsCount] = useState(0)
  const [apiKeysCount, setApiKeysCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryAttempts, setRetryAttempts] = useState(0)
  const [isCircuitBreakerOpen, setIsCircuitBreakerOpen] = useState(false)
  
  const { currentWorkspaceId, isLoading: workspaceLoading } = useWorkspaceContext()
  const { isAuthenticated } = useAuth()

  const fetchCounts = useCallback(async () => {
    // Circuit breaker: stop making requests if too many failures
    if (isCircuitBreakerOpen) {
      console.debug('[CountsContext] Circuit breaker open, skipping request')
      return
    }

    if (!isAuthenticated || workspaceLoading) {
      // Reset retry attempts when user becomes unauthenticated
      setRetryAttempts(0)
      setIsCircuitBreakerOpen(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const counts = await getCounts(currentWorkspaceId || undefined)
      setPromptsCount(counts.prompts_count)
      setApiKeysCount(counts.api_keys_count)

      // Reset on successful request
      setRetryAttempts(0)
      setIsCircuitBreakerOpen(false)
      console.log('[CountsContext] Counts updated:', counts)
    } catch (err) {
      console.error('[CountsContext] Error fetching counts:', err)

      // Increment retry attempts
      const newRetryAttempts = retryAttempts + 1
      setRetryAttempts(newRetryAttempts)

      // Open circuit breaker if too many failures
      if (newRetryAttempts >= MAX_RETRY_ATTEMPTS) {
        setIsCircuitBreakerOpen(true)
        console.warn('[CountsContext] Circuit breaker opened due to repeated failures')
      }

      // Handle authentication errors
      if (err instanceof Error && (err.message.includes('403') || err.message.includes('401'))) {
        console.debug('[CountsContext] Authentication error, user needs to login')
        setError('Authentication required')
        // Open circuit breaker immediately for auth errors
        setIsCircuitBreakerOpen(true)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch counts')
      }
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspaceId, workspaceLoading, isAuthenticated, retryAttempts, isCircuitBreakerOpen])

  const invalidateAndRefetch = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      await invalidateCache()
      await fetchCounts()
    } catch (err) {
      console.error('[CountsContext] Error invalidating cache:', err)
      setError(err instanceof Error ? err.message : 'Failed to invalidate cache')
    }
  }, [fetchCounts, isAuthenticated])

  // Initial fetch and setup periodic refresh
  useEffect(() => {
    if (!isAuthenticated || workspaceLoading) {
      return
    }

    // Initial fetch
    fetchCounts()

    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchCounts()
    }, REFRESH_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [fetchCounts, isAuthenticated, workspaceLoading])

  // Separate effect for error retry with exponential backoff
  useEffect(() => {
    if (!error || !isAuthenticated || workspaceLoading || isCircuitBreakerOpen) {
      return
    }

    // Only retry if the error is not authentication-related and we haven't exceeded max attempts
    if (error.includes('Authentication required') || retryAttempts >= MAX_RETRY_ATTEMPTS) {
      return
    }

    // Exponential backoff: 30s, 60s, 120s
    const backoffDelay = RETRY_INTERVAL * Math.pow(EXPONENTIAL_BACKOFF_BASE, retryAttempts)
    console.debug(`[CountsContext] Retrying in ${backoffDelay}ms (attempt ${retryAttempts + 1}/${MAX_RETRY_ATTEMPTS})`)

    const retryTimeout = setTimeout(() => {
      fetchCounts()
    }, backoffDelay)

    return () => {
      clearTimeout(retryTimeout)
    }
  }, [error, fetchCounts, isAuthenticated, workspaceLoading, retryAttempts, isCircuitBreakerOpen])

  // Refetch when workspace changes
  useEffect(() => {
    if (isAuthenticated && !workspaceLoading) {
      fetchCounts()
    }
  }, [currentWorkspaceId, fetchCounts, isAuthenticated, workspaceLoading])

  const value = {
    promptsCount,
    apiKeysCount,
    isLoading,
    error,
    refetchCounts: fetchCounts,
    invalidateAndRefetch
  }

  return (
    <CountsContext.Provider value={value}>
      {children}
    </CountsContext.Provider>
  )
}

export function useCountsContext() {
  const context = useContext(CountsContext)
  if (context === undefined) {
    console.warn('useCountsContext must be used within a CountsProvider')
    return null
  }
  return context
}