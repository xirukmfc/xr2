"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useLocale } from "@/contexts/locale-context"

const articles = {
  en: [
    {
      href: "/blog/n8n-prompt-management",
      title: "Centralized Prompt Management for n8n",
      description: "Stop hardcoding AI prompts in every n8n workflow. Manage, version, and switch prompts dynamically with a native n8n node.",
      tags: ["n8n", "Workflow Automation", "Dynamic Prompts"],
    },
    {
      href: "/blog/make-prompt-management",
      title: "Dynamic AI Prompts in Make.com Scenarios",
      description: "Fetch and switch AI prompts in Make.com scenarios without editing a single module. Centralized prompt management via HTTP.",
      tags: ["Make.com", "HTTP Module", "No-Code"],
    },
    {
      href: "/blog/prompt-versioning",
      title: "Version Control for AI Prompts",
      description: "Draft, test, and promote prompts through a structured lifecycle. Roll back instantly when something breaks.",
      tags: ["Versioning", "Draft → Production", "Rollback"],
    },
    {
      href: "/blog/prompt-ab-testing",
      title: "A/B Test AI Prompts with Revenue Tracking",
      description: "Run controlled experiments on prompt variants. Measure which wording drives more conversions and revenue.",
      tags: ["A/B Testing", "Conversion Tracking", "Analytics"],
    },
    {
      href: "/blog/langfuse-alternative",
      title: "xR2 vs Langfuse, PromptLayer & Alternatives",
      description: "How xR2 compares to developer-focused LLM tools. Built for product teams, not just engineers.",
      tags: ["Comparison", "No-Code", "Product Teams"],
    },
  ],
  ru: [
    {
      href: "/blog/n8n-prompt-management",
      title: "Управление промптами в n8n",
      description: "Централизуйте AI-промпты в одном месте. Нативная нода xR2 для n8n: версионирование, переключение и аналитика без изменения воркфлоу.",
      tags: ["n8n", "Автоматизация", "Динамические промпты"],
    },
    {
      href: "/blog/make-prompt-management",
      title: "Управление промптами в Make.com",
      description: "Загружайте и переключайте промпты в Make.com сценариях без редактирования модулей. Централизованное управление через REST API.",
      tags: ["Make.com", "HTTP-модуль", "No-Code"],
    },
    {
      href: "/blog/prompt-versioning",
      title: "Версионирование промптов для LLM",
      description: "Создавайте черновики, тестируйте и выводите промпты в продакшен. Откатывайте мгновенно при проблемах.",
      tags: ["Версионирование", "Черновик → Продакшен", "Откат"],
    },
    {
      href: "/blog/prompt-ab-testing",
      title: "A/B тестирование промптов",
      description: "Запускайте эксперименты над вариантами промптов. Измеряйте, какая формулировка приносит больше конверсий и выручки.",
      tags: ["A/B тесты", "Трекинг конверсий", "Аналитика"],
    },
    {
      href: "/blog/langfuse-alternative",
      title: "xR2 vs Langfuse и альтернативы",
      description: "Сравнение xR2 с инструментами для разработчиков. xR2 создан для продуктовых команд, а не только для инженеров.",
      tags: ["Сравнение", "No-Code", "Продуктовые команды"],
    },
  ],
}

export function BlogIndex() {
  const { locale } = useLocale()
  const en = locale === 'en'
  const items = en ? articles.en : articles.ru

  return (
    <div>
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          {en ? 'AI Prompt Management Blog' : 'Блог об управлении промптами'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {en
            ? 'How teams use xR2 to manage AI prompts across automation workflows — from n8n and Make.com to custom integrations.'
            : 'Как команды используют xR2 для управления промптами в автоматизациях — от n8n и Make.com до собственных интеграций.'}
        </p>
      </header>

      <div className="grid gap-6">
        {items.map((uc) => (
          <Link
            key={uc.href}
            href={uc.href}
            className="group block rounded-xl border border-border p-6 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-2 group-hover:underline underline-offset-4">{uc.title}</h2>
                <p className="text-muted-foreground mb-3">{uc.description}</p>
                <div className="flex flex-wrap gap-2">
                  {uc.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
