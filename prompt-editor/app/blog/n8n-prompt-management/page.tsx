import { Metadata } from "next"
import { headers } from "next/headers"
import { N8nPromptManagementContent } from "./content"

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') || 'xr2.uk'
  const isRu = host.includes('xr2.site')
  const baseUrl = isRu ? 'https://xr2.site' : 'https://xr2.uk'

  return {
    title: isRu
      ? "Управление промптами в n8n — централизуйте AI-промпты | xR2"
      : "Centralized Prompt Management for n8n — xR2",
    description: isRu
      ? "Как управлять промптами в n8n из одного места. Нативная нода xR2 для n8n: версионирование, A/B тестирование и аналитика промптов без изменения воркфлоу."
      : "Stop updating AI prompts in every n8n workflow. Use xR2's native n8n node to manage, version, and dynamically switch prompts from one dashboard. Free to start.",
    keywords: isRu
      ? ["управление промптами n8n", "n8n промпты", "n8n AI агент промпты", "динамический промпт n8n", "n8n OpenAI промпт", "централизованное управление промптами"]
      : ["n8n prompt management", "n8n dynamic system prompt", "n8n AI agent prompts", "switch prompts n8n workflow", "n8n OpenAI prompt", "centralized prompt management n8n"],
    alternates: {
      canonical: `${baseUrl}/blog/n8n-prompt-management`,
    },
    openGraph: {
      title: isRu
        ? "Управление промптами в n8n — xR2"
        : "Centralized Prompt Management for n8n — xR2",
      description: isRu
        ? "Как управлять промптами в n8n из одного места. Нативная нода xR2 для версионирования и динамической загрузки промптов."
        : "Stop updating AI prompts in every n8n workflow. Manage, version, and dynamically switch prompts from one dashboard.",
      images: [{ url: `${baseUrl}/og?title=${encodeURIComponent(isRu ? 'Управление промптами в n8n' : 'Centralized Prompt Management for n8n')}&subtitle=${encodeURIComponent(isRu ? 'Нативная нода xR2 для n8n. Версионирование, A/B тесты и аналитика промптов.' : 'Stop hardcoding system prompts. Fetch them at runtime with a native n8n node.')}`, width: 1200, height: 630 }],
    },
  }
}

export default function N8nPromptManagement() {
  return <N8nPromptManagementContent />
}
