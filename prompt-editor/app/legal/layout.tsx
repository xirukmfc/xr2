"use client"

import Link from "next/link"
import Image from "next/image"
import { useLocale } from "@/contexts/locale-context"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useLocale()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-6 w-auto" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        {children}
      </main>

      <footer className="py-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <a href="https://docs.xr2.uk/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900">{t('landing.footer.public_docs')}</a>
              <a href="/#pricing" className="text-gray-500 hover:text-gray-900">{t('landing.footer.pricing')}</a>
              <a href="mailto:hello@xr2.uk" className="text-gray-500 hover:text-gray-900">{t('landing.footer.contact')}</a>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/legal/cookies" className="text-gray-400 hover:text-gray-600">{t('landing.footer.cookies')}</Link>
              <Link href="/legal/privacy" className="text-gray-400 hover:text-gray-600">{t('landing.footer.privacy')}</Link>
              <Link href="/legal/terms" className="text-gray-400 hover:text-gray-600">{t('landing.footer.terms')}</Link>
            </div>
          </div>
          <div className="mt-4 text-center md:text-left">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} xR2
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
