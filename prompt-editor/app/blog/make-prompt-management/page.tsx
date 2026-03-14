import { Metadata } from "next"
import { headers } from "next/headers"
import { MakePromptManagementContent } from "./content"

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') || 'xr2.uk'
  const isRu = host.includes('xr2.site')
  const baseUrl = isRu ? 'https://xr2.site' : 'https://xr2.uk'

  const title = isRu
    ? "Управление промптами в Make.com — версионирование и A/B тесты | xR2"
    : "Dynamic AI Prompts in Make.com Scenarios — xR2"

  const description = isRu
    ? "Центральная платформа для промптов в Make.com сценариях. Меняйте промпты без редактирования автоматизаций. Бесплатный тариф."
    : "Fetch and switch AI prompts in Make.com scenarios without editing modules. Centralized prompt management for Make.com via REST API. Free to start."

  const keywords = isRu
    ? ["управление промптами Make.com", "Make.com промпты", "Make.com OpenAI", "Make.com динамический промпт", "Make.com AI автоматизация", "Integromat управление промптами"]
    : ["Make.com prompt management", "Make.com manage AI prompts", "Make.com OpenAI tips", "Make.com dynamic prompt", "Make.com AI automation", "Integromat prompt management"]

  const ogTitle = isRu
    ? "Управление промптами в Make.com — xR2"
    : "Dynamic AI Prompts in Make.com — xR2"

  const ogDescription = isRu
    ? "Центральная платформа для промптов в Make.com сценариях. Меняйте промпты без редактирования автоматизаций."
    : "Fetch and switch AI prompts in Make.com scenarios without editing modules. Centralized prompt management via REST API."

  const ogSubtitle = isRu
    ? encodeURIComponent("Загружайте промпты через HTTP. Без редактирования модулей.")
    : encodeURIComponent("Fetch prompts at runtime via HTTP. No more editing modules.")

  const ogTitleParam = isRu
    ? encodeURIComponent("Управление промптами в Make.com")
    : encodeURIComponent("Dynamic AI Prompts in Make.com Scenarios")

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${baseUrl}/blog/make-prompt-management`,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: [{ url: `${baseUrl}/og?title=${ogTitleParam}&subtitle=${ogSubtitle}`, width: 1200, height: 630 }],
    },
  }
}

export default function MakePromptManagement() {
  return <MakePromptManagementContent />
}
