import { notFound } from 'next/navigation'
import { Metadata } from 'next'

const supportedLocales = ['en', 'ru'] as const
type SupportedLocale = typeof supportedLocales[number]

export function generateStaticParams() {
  return supportedLocales.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return {
    alternates: {
      canonical: `https://xr2.uk/${lang}`,
      languages: {
        'en': 'https://xr2.uk/en',
        'ru': 'https://xr2.uk/ru',
        'x-default': 'https://xr2.uk/en',
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
