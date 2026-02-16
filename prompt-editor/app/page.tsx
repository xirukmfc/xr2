"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// Fallback redirect component
// Normally middleware handles the redirect, but this is a safety net
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const hostname = window.location.hostname
    const isProductionDomain = hostname.includes('xr2.site') || hostname.includes('xr2.uk')

    if (isProductionDomain) {
      // On production, middleware handles rewrite — no client redirect needed
      return
    }

    // Localhost: redirect to locale path
    const savedLocale = localStorage.getItem('locale')
    const locale = (savedLocale === 'en' || savedLocale === 'ru') ? savedLocale : 'en'
    router.replace(`/${locale}`)
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto" />
        <p className="mt-2 text-gray-500">Loading...</p>
      </div>
    </div>
  )
}
