import { Metadata } from "next"
import { headers } from "next/headers"
import { PromptVersioningContent } from "./content"

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') || 'xr2.uk'
  const isRu = host.includes('xr2.site')
  const baseUrl = isRu ? 'https://xr2.site' : 'https://xr2.uk'

  return {
    title: isRu
      ? "Версионирование промптов для LLM — зачем и как это делать | xR2"
      : "Version Control for AI Prompts — xR2",
    description: isRu
      ? "Версионирование промптов: откатывайте, сравнивайте и отслеживайте изменения. Руководство для команд, работающих с AI-автоматизациями."
      : "Manage AI prompt versions with Draft → Testing → Production lifecycle. Roll back instantly, promote safely, and never lose a working prompt again.",
    keywords: isRu
      ? ["версионирование промптов", "контроль версий промптов", "управление версиями промптов", "откат промптов", "жизненный цикл промптов", "история версий промптов"]
      : ["version control AI prompts", "prompt versioning", "prompt lifecycle management", "AI prompt rollback", "prompt deployment workflow", "prompt version history"],
    alternates: {
      canonical: `${baseUrl}/blog/prompt-versioning`,
    },
    openGraph: {
      title: isRu
        ? "Версионирование промптов для LLM — xR2"
        : "Version Control for AI Prompts — xR2",
      description: isRu
        ? "Версионирование промптов: откатывайте, сравнивайте и отслеживайте изменения."
        : "Manage AI prompt versions with Draft → Testing → Production lifecycle. Roll back instantly, promote safely.",
      images: [{ url: `${baseUrl}/og?title=${encodeURIComponent(isRu ? 'Версионирование промптов для LLM' : 'Version Control for AI Prompts')}&subtitle=${encodeURIComponent(isRu ? 'Откатывайте, сравнивайте и отслеживайте изменения промптов.' : 'Draft, test, and promote prompts. Roll back instantly.')}`, width: 1200, height: 630 }],
    },
  }
}

export default function PromptVersioning() {
  return <PromptVersioningContent />
}
