import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog — xR2 Prompt Management",
  description: "Learn how teams use xR2 to manage AI prompts in n8n, Make.com, and other automation platforms. Prompt versioning, A/B testing, and dynamic switching.",
  alternates: {
    canonical: "https://xr2.uk/blog",
  },
  openGraph: {
    title: "Blog — xR2 Prompt Management",
    description: "Learn how teams use xR2 to manage AI prompts in n8n, Make.com, and other automation platforms.",
  },
}

const articles = [
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
]

export default function BlogIndex() {
  return (
    <div>
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Blog</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          How teams use xR2 to manage AI prompts across automation workflows — from n8n and Make.com to custom integrations.
        </p>
      </header>

      <div className="grid gap-6">
        {articles.map((uc) => (
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
