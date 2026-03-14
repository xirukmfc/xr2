import { Metadata } from "next"
import { headers } from "next/headers"
import { LangfuseAlternativeContent } from "./content"

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') || 'xr2.uk'
  const isRu = host.includes('xr2.site')
  const baseUrl = isRu ? 'https://xr2.site' : 'https://xr2.uk'

  const title = isRu
    ? "Альтернатива Langfuse для управления промптами | xR2"
    : "xR2 vs Langfuse, PromptLayer & Alternatives — xR2"

  const description = isRu
    ? "xR2 vs Langfuse: сравнение платформ. xR2 фокусируется на бизнес-метриках, A/B тестах и нативных интеграциях с n8n и Make."
    : "How xR2 compares to Langfuse, PromptLayer, and Helicone for prompt management. Built for product teams and no-code automation, not just developers."

  const keywords = isRu
    ? ["альтернатива Langfuse", "альтернатива PromptLayer", "альтернатива Helicone", "управление промптами no-code", "сравнение управления промптами", "LLM обсервабилити vs управление промптами"]
    : ["Langfuse alternative", "PromptLayer alternative", "Helicone alternative", "prompt management no-code", "prompt management comparison", "LLM observability vs prompt management"]

  const ogTitle = isRu
    ? "Альтернатива Langfuse для управления промптами — xR2"
    : "xR2 vs Langfuse, PromptLayer & Alternatives"

  const ogDescription = isRu
    ? "xR2 vs Langfuse: сравнение платформ. xR2 фокусируется на бизнес-метриках, A/B тестах и нативных интеграциях."
    : "How xR2 compares to Langfuse, PromptLayer, and Helicone. Built for product teams, not just developers."

  const ogTitleParam = isRu
    ? encodeURIComponent("xR2 vs Langfuse, PromptLayer и альтернативы")
    : encodeURIComponent("xR2 vs Langfuse, PromptLayer & Alternatives")

  const ogSubtitle = isRu
    ? encodeURIComponent("Для продуктовых команд, а не только для разработчиков.")
    : encodeURIComponent("Built for product teams, not just developers.")

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${baseUrl}/blog/langfuse-alternative`,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: [{ url: `${baseUrl}/og?title=${ogTitleParam}&subtitle=${ogSubtitle}`, width: 1200, height: 630 }],
    },
  }
}

export default function LangfuseAlternative() {
  return <LangfuseAlternativeContent />
}
