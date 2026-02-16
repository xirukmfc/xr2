"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// Fallback redirect component
// Normally middleware handles the redirect, but this is a safety net
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Determine locale from domain
    const hostname = window.location.hostname
    let locale: string
    if (hostname.includes('xr2.site')) {
      locale = 'ru'
    } else if (hostname.includes('xr2.uk')) {
      locale = 'en'
    } else {
      // Localhost: use localStorage or default to 'en'
      const savedLocale = localStorage.getItem('locale')
      locale = (savedLocale === 'en' || savedLocale === 'ru') ? savedLocale : 'en'
    }
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
