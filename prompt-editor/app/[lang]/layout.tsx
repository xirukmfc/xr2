import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { Metadata } from 'next'

const supportedLocales = ['en', 'ru'] as const
type SupportedLocale = typeof supportedLocales[number]

export function generateStaticParams() {
  return supportedLocales.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const headersList = await headers()
  const host = headersList.get('host') || 'xr2.uk'

  const isRussianDomain = host.includes('xr2.site')
  const canonical = isRussianDomain ? 'https://xr2.site' : 'https://xr2.uk'

  return {
    alternates: {
      canonical,
      languages: {
        'en': 'https://xr2.uk',
        'ru': 'https://xr2.site',
        'x-default': 'https://xr2.uk',
      },
    },
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!supportedLocales.includes(lang as SupportedLocale)) {
    notFound()
  }

  return children
}
