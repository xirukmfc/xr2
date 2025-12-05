"use client"

import React from 'react'
import { useLocale } from '@/contexts/locale-context'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ru' : 'en')
  }

  return (
    <Button
      variant="ghost"
      onClick={toggleLanguage}
      className="w-full justify-start text-left px-4 py-3 h-10 hover:bg-slate-50 rounded-none focus-visible:ring-0 text-slate-600 hover:text-slate-900"
      title={locale === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
    >
      <span className="flex items-center gap-2 w-full">
        <Languages className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm flex-1">{locale === 'en' ? 'Language' : 'Язык'}</span>
        <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
          {locale.toUpperCase()}
        </span>
      </span>
    </Button>
  )
}
