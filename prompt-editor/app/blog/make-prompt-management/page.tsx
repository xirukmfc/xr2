import { Metadata } from "next"
import { Article } from "../article"

export const metadata: Metadata = {
  title: "Dynamic AI Prompts in Make.com Scenarios — xR2",
  description: "Fetch and switch AI prompts in Make.com scenarios without editing modules. Centralized prompt management for Make.com via REST API. Free to start.",
  keywords: ["Make.com prompt management", "Make.com manage AI prompts", "Make.com OpenAI tips", "Make.com dynamic prompt", "Make.com AI automation", "Integromat prompt management"],
  alternates: {
    canonical: "https://xr2.uk/blog/make-prompt-management",
  },
  openGraph: {
    title: "Dynamic AI Prompts in Make.com — xR2",
    description: "Fetch and switch AI prompts in Make.com scenarios without editing modules. Centralized prompt management via REST API.",
  },
}

export default function MakePromptManagement() {
  return (
    <Article
      title="Dynamic AI Prompts in Make.com Scenarios"
      subtitle="Fetch prompts at runtime via HTTP. No more editing modules every time you tweak a word."
      readTime="5 min"
      relatedLinks={[
        { href: "/blog/n8n-prompt-management", label: "n8n Prompt Management" },
        { href: "/blog/prompt-ab-testing", label: "A/B Test AI Prompts" },
        { href: "/blog/langfuse-alternative", label: "xR2 vs Langfuse & Alternatives" },
      ]}
    >
      <h2>The Make.com Prompt Problem</h2>
      <p>
        Make.com (formerly Integromat) is one of the most popular no-code automation platforms. When you add an OpenAI or ChatGPT module to a scenario, the system prompt lives inside that module&apos;s configuration.
      </p>
      <p>
        This works fine for simple setups. But once you have multiple scenarios using AI — customer support, content generation, lead qualification — managing prompts becomes painful:
      </p>
      <ul>
        <li>Each scenario has its own copy of the prompt</li>
        <li>Changing a prompt requires opening the scenario, finding the module, editing, and saving</li>
        <li>There&apos;s no way to version or roll back changes</li>
        <li>Non-technical team members can&apos;t edit prompts without Make.com access</li>
        <li>You can&apos;t test two prompt versions against each other</li>
      </ul>

      <h2>The Solution: Fetch Prompts via HTTP</h2>
      <p>
        xR2 exposes a simple REST API. In Make.com, you use a standard <strong>HTTP module</strong> to fetch the prompt before passing it to your AI module. The prompt content is managed entirely in xR2 — your Make.com scenario just consumes it.
      </p>

      <h3>Setup in 3 Steps</h3>
      <ol>
        <li>
          <strong>Create your prompt in xR2</strong> — Write the prompt in xR2&apos;s editor, assign a slug like <code>email-writer</code>, and promote it to Production status.
        </li>
        <li>
          <strong>Add an HTTP module</strong> — In your Make.com scenario, add an HTTP &quot;Make a request&quot; module before your AI module:
          <pre><code>{`POST https://xr2.uk/api/v1/get-prompt
Headers:
  Authorization: Bearer xr2_prod_your_key
  Content-Type: application/json
Body:
  { "slug": "email-writer" }`}</code></pre>
        </li>
        <li>
          <strong>Map the response to your AI module</strong> — The HTTP module returns the prompt text. Map <code>system_prompt</code> from the response to your OpenAI module&apos;s system message field.
        </li>
      </ol>

      <h2>Dynamic Prompt Switching</h2>
      <p>
        Just like with n8n, you can use a single Make.com scenario to handle multiple prompt variants. Pass the slug as a variable — from a webhook, a router, or a data store lookup — and the same scenario serves different AI behaviors.
      </p>
      <p>
        Example: a customer support scenario that routes tickets based on department:
      </p>
      <ul>
        <li>Billing questions → fetch <code>support-billing</code> prompt</li>
        <li>Technical issues → fetch <code>support-technical</code> prompt</li>
        <li>Sales inquiries → fetch <code>support-sales</code> prompt</li>
      </ul>
      <p>
        One scenario, three completely different AI behaviors — all controlled from xR2&apos;s dashboard.
      </p>

      <h2>Variables in Prompts</h2>
      <p>
        xR2 prompts support <code>{"{{variable}}"}</code> placeholders. You can pass variable values in the API request body, and xR2 renders the final prompt with those values filled in. This keeps your prompts generic and reusable across different Make.com scenarios.
      </p>
      <pre><code>{`{
  "slug": "email-writer",
  "variables": {
    "customer_name": "Alice",
    "product": "Pro Plan"
  }
}`}</code></pre>

      <h2>Benefits for Make.com Users</h2>
      <ul>
        <li><strong>No more module editing</strong> — Change prompt wording in xR2, it takes effect immediately on the next scenario run</li>
        <li><strong>Team collaboration</strong> — Marketing and support teams can edit prompts without Make.com access</li>
        <li><strong>Version history</strong> — Every change is tracked. Roll back to a previous version if needed</li>
        <li><strong>A/B testing</strong> — Test two prompt variants and measure which one converts better</li>
        <li><strong>Analytics</strong> — See how often each prompt is called, track conversion events tied to specific prompts</li>
      </ul>

      <h2>Works with Any AI Module</h2>
      <p>
        Since xR2 delivers the prompt as plain text via HTTP, it works with any AI module in Make.com: OpenAI, Anthropic Claude, Google Gemini, or even custom API calls. The prompt source is decoupled from the AI provider.
      </p>

      <h2>Getting Started</h2>
      <ol>
        <li>Sign up at <a href="https://xr2.uk">xr2.uk</a> — free plan includes 10 prompts and 100 API calls/month</li>
        <li>Create a prompt with a slug</li>
        <li>Add an HTTP module to your Make.com scenario pointing to xR2&apos;s API</li>
        <li>Map the response to your AI module</li>
      </ol>
      <p>
        Setup takes about 5 minutes. From that point, your prompts live outside Make.com and can be managed by anyone on your team.
      </p>
    </Article>
  )
}
