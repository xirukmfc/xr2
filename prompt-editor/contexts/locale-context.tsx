"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import enTranslations from '@/locales/en.json'
import ruTranslations from '@/locales/ru.json'

type Locale = 'en' | 'ru'

type Translations = typeof enTranslations

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const translations: Record<Locale, Translations> = {
  en: enTranslations,
  ru: ruTranslations,
}

function getLocaleByHostname(hostname: string): Locale | null {
  if (hostname.includes('xr2.site')) return 'ru'
  if (hostname.includes('xr2.uk')) return 'en'
  return null
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  // Determine locale on mount: domain-fixed or localStorage fallback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const domainLocale = getLocaleByHostname(window.location.hostname)
      if (domainLocale) {
        setLocaleState(domainLocale)
        // Set cookie for middleware compatibility
        const domainPart = domainLocale === 'ru' ? ';domain=.xr2.site' : ';domain=.xr2.uk'
        document.cookie = `locale=${domainLocale};path=/;max-age=31536000;SameSite=Lax${domainPart}`
      } else {
        // Localhost: use localStorage
        const savedLocale = localStorage.getItem('locale') as Locale
        if (savedLocale && (savedLocale === 'en' || savedLocale === 'ru')) {
          setLocaleState(savedLocale)
        }
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    // On production domains, locale is fixed by domain — ignore setLocale calls
    if (typeof window !== 'undefined') {
      const domainLocale = getLocaleByHostname(window.location.hostname)
      if (domainLocale) {
        // Domain-fixed: don't allow changing locale
        return
      }
      // Localhost: allow changing
      setLocaleState(newLocale)
      localStorage.setItem('locale', newLocale)
      document.cookie = `locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`
    }
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = translations[locale]

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`)
      return key
    }

    // Replace parameters in translation string
    if (params) {
      return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
        return str.replace(`{${paramKey}}`, String(paramValue))
      }, value)
    }

    return value
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
