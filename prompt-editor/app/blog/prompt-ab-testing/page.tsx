import { Metadata } from "next"
import { headers } from "next/headers"
import { PromptAbTestingContent } from "./content"

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') || 'xr2.uk'
  const isRu = host.includes('xr2.site')
  const baseUrl = isRu ? 'https://xr2.site' : 'https://xr2.uk'

  const title = isRu
    ? "A/B тестирование промптов — какой промпт конвертит лучше | xR2"
    : "A/B Test AI Prompts with Revenue Tracking — xR2"

  const description = isRu
    ? "Запускайте A/B тесты между версиями промптов и измеряйте конверсию. Статистическая значимость, трекинг событий, отчёты."
    : "Run controlled experiments on AI prompt variants. Measure which wording drives more conversions and revenue. Built-in traffic splitting and statistical significance."

  const keywords = isRu
    ? ["A/B тестирование промптов", "A/B тест AI промптов", "оптимизация промптов", "тестирование промптов", "конверсия промптов", "сравнение промптов"]
    : ["prompt A/B testing", "A/B test AI prompts", "prompt A/B testing automation", "AI prompt optimization", "prompt conversion tracking", "test prompt variants"]

  const ogTitle = isRu
    ? "A/B тестирование промптов — xR2"
    : "A/B Test AI Prompts with Revenue Tracking — xR2"

  const ogDescription = isRu
    ? "Запускайте A/B тесты между версиями промптов и измеряйте конверсию. Статистическая значимость и трекинг выручки."
    : "Run controlled experiments on AI prompt variants. Measure which wording drives more conversions and revenue."

  const ogTitleParam = isRu
    ? encodeURIComponent("A/B тестирование промптов")
    : encodeURIComponent("A/B Test AI Prompts with Revenue Tracking")

  const ogSubtitle = isRu
    ? encodeURIComponent("Сравнивайте варианты промптов. Измеряйте конверсии и выручку.")
    : encodeURIComponent("Run experiments on prompt variants. Measure conversions and revenue.")

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${baseUrl}/blog/prompt-ab-testing`,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: [{ url: `${baseUrl}/og?title=${ogTitleParam}&subtitle=${ogSubtitle}`, width: 1200, height: 630 }],
    },
  }
}

export default function PromptAbTesting() {
  return <PromptAbTestingContent />
}
