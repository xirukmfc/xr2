import { notFound } from 'next/navigation'

const supportedLocales = ['en', 'ru'] as const
type SupportedLocale = typeof supportedLocales[number]

export function generateStaticParams() {
  return supportedLocales.map((lang) => ({ lang }))
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
