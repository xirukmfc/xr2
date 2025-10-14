'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/error-state'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <ErrorState
        title="Oops! Something went wrong"
        message={error.message || 'An unexpected error occurred. Please try again.'}
        onRetry={reset}
      />
    </div>
  )
}