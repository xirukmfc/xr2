"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useLocale } from "@/contexts/locale-context"

interface ArticleProps {
  title: string
  subtitle: string
  readTime: string
  slug: string
  children: React.ReactNode
  relatedLinks?: { href: string; label: string }[]
}

export function Article({ title, subtitle, readTime, slug, children, relatedLinks }: ArticleProps) {
  const { locale } = useLocale()
  const en = locale === 'en'
  const domain = en ? 'https://xr2.uk' : 'https://xr2.site'

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": subtitle,
    "author": {
      "@type": "Organization",
      "name": "xR2",
      "url": domain,
    },
    "publisher": {
      "@type": "Organization",
      "name": "xR2",
      "url": domain,
    },
    "url": `${domain}/blog/${slug}`,
    "mainEntityOfPage": `${domain}/blog/${slug}`,
  }

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-3.5 w-3.5" />
        {en ? 'All articles' : 'Все статьи'}
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{title}</h1>
        <p className="text-lg text-muted-foreground">{subtitle}</p>
        <p className="text-sm text-muted-foreground mt-2">{readTime} {en ? 'read' : 'чтения'}</p>
      </header>

      <div className="article-content">
        {children}
      </div>

      {relatedLinks && relatedLinks.length > 0 && (
        <div className="mt-14 pt-8 border-t border-border">
          <h3 className="text-sm font-semibold mb-4">{en ? 'Related articles' : 'Связанные статьи'}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <span className="text-sm font-medium">{link.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-14 rounded-xl bg-muted/50 border border-border p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">{en ? 'Ready to try xR2?' : 'Попробуйте xR2'}</h3>
        <p className="text-muted-foreground mb-5">
          {en
            ? 'Free plan includes 10 prompts and 1000 API calls per month.'
            : 'Бесплатный тариф: 10 промптов и 1000 API-запросов в месяц.'}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {en ? 'Get Started Free' : 'Начать бесплатно'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
