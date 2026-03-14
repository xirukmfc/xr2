import { Metadata } from "next"
import { headers } from "next/headers"
import { BlogIndex } from "./blog-index"

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') || 'xr2.uk'
  const isRu = host.includes('xr2.site')
  const baseUrl = isRu ? 'https://xr2.site' : 'https://xr2.uk'

  return {
    title: isRu ? "Блог об управлении промптами — xR2" : "AI Prompt Management Blog — xR2",
    description: isRu
      ? "Как команды используют xR2 для управления промптами в n8n, Make.com и других платформах автоматизации. Версионирование, A/B тесты, аналитика."
      : "Learn how teams use xR2 to manage AI prompts in n8n, Make.com, and other automation platforms. Prompt versioning, A/B testing, and dynamic switching.",
    alternates: {
      canonical: `${baseUrl}/blog`,
    },
    openGraph: {
      title: isRu ? "Блог об управлении промптами — xR2" : "AI Prompt Management Blog — xR2",
      description: isRu
        ? "Как команды используют xR2 для управления промптами в автоматизациях."
        : "Learn how teams use xR2 to manage AI prompts in n8n, Make.com, and other automation platforms.",
      images: [{ url: `${baseUrl}/og?title=${encodeURIComponent(isRu ? 'Блог об управлении промптами' : 'AI Prompt Management Blog')}&subtitle=${encodeURIComponent(isRu ? 'Как команды используют xR2 для управления промптами в автоматизациях.' : 'How teams use xR2 to manage AI prompts across automation workflows.')}`, width: 1200, height: 630 }],
    },
  }
}

export default function Page() {
  return <BlogIndex />
}
