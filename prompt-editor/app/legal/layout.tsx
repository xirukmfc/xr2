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
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-5 w-auto" />
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            &larr; Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        {children}
      </main>

      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-12 md:gap-16 mb-10">
            <div className="md:max-w-xs">
              <Image src="/logo.svg" alt="xR2" width={60} height={25} className="h-5 w-auto mb-3" />
              <p className="text-sm text-gray-400 leading-relaxed">
                {t('landing.footer.description')}
              </p>
            </div>

            <div className="flex flex-wrap gap-12 md:gap-16 md:ml-auto">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('landing.footer.productTitle')}</h4>
                <div className="space-y-2.5">
                  <Link href="/#features" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.nav.features')}</Link>
                  <Link href="/#pricing" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.nav.pricing')}</Link>
                  <a href="https://docs.xr2.uk" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.footer.public_docs')}</a>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('landing.footer.companyTitle')}</h4>
                <div className="space-y-2.5">
                  <a href="mailto:hello@xr2.uk" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.footer.contact')}</a>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('landing.footer.legalTitle')}</h4>
                <div className="space-y-2.5">
                  <Link href="/legal/privacy" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.footer.privacy')}</Link>
                  <Link href="/legal/terms" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.footer.terms')}</Link>
                  <Link href="/legal/cookies" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors">{t('landing.footer.cookies')}</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} xR2</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
