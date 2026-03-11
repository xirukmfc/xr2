import { Metadata } from "next"
import { Article } from "../article"

export const metadata: Metadata = {
  title: "Centralized Prompt Management for n8n — xR2",
  description: "Stop updating AI prompts in every n8n workflow. Use xR2's native n8n node to manage, version, and dynamically switch prompts from one dashboard. Free to start.",
  keywords: ["n8n prompt management", "n8n dynamic system prompt", "n8n AI agent prompts", "switch prompts n8n workflow", "n8n OpenAI prompt", "centralized prompt management n8n"],
  alternates: {
    canonical: "https://xr2.uk/blog/n8n-prompt-management",
  },
  openGraph: {
    title: "Centralized Prompt Management for n8n — xR2",
    description: "Stop updating AI prompts in every n8n workflow. Manage, version, and dynamically switch prompts from one dashboard.",
  },
}

export default function N8nPromptManagement() {
  return (
    <Article
      title="Centralized Prompt Management for n8n"
      subtitle="Stop hardcoding system prompts in every workflow. Manage them from one place, switch dynamically at runtime."
      readTime="6 min"
      relatedLinks={[
        { href: "/blog/make-prompt-management", label: "Dynamic Prompts in Make.com" },
        { href: "/blog/prompt-versioning", label: "Prompt Version Control" },
        { href: "/blog/prompt-ab-testing", label: "A/B Test AI Prompts" },
      ]}
    >
      <h2>The Problem: Prompts Buried Inside Workflows</h2>
      <p>
        If you use n8n with OpenAI, Anthropic, or any LLM node, you&apos;ve probably run into this: your system prompt is hardcoded inside the workflow. Need to tweak a word? Open n8n, find the node, edit, save, activate. Multiply that by 10 workflows serving different clients or scenarios — and you have a maintenance problem.
      </p>
      <p>
        It gets worse when non-technical team members need to adjust prompts. They can&apos;t touch n8n. So they ask a developer, who makes the change, tests it, and redeploys. A one-word edit becomes a 30-minute task.
      </p>

      <h2>The Solution: Fetch Prompts at Runtime</h2>
      <p>
        Instead of storing prompts inside n8n, store them in xR2 and fetch them when the workflow runs. Your n8n workflow becomes a generic execution engine — it doesn&apos;t care <em>what</em> the prompt says, it just fetches the latest version and sends it to the LLM.
      </p>
      <p>
        xR2 provides a <strong>native n8n community node</strong> that you can install directly from n8n&apos;s settings. No HTTP module configuration needed.
      </p>

      <h3>How It Works</h3>
      <ol>
        <li><strong>Install the xR2 node</strong> — Go to Settings → Community Nodes in your n8n instance and install <code>n8n-nodes-xr2</code>.</li>
        <li><strong>Create your prompts in xR2</strong> — Write your system prompts in xR2&apos;s editor. Assign each one a unique slug like <code>support-acme</code> or <code>sales-qualifier</code>.</li>
        <li><strong>Add the xR2 node to your workflow</strong> — Place it before your LLM node. It fetches the prompt by slug and outputs the system prompt text.</li>
        <li><strong>Connect to your AI node</strong> — Pass the fetched prompt as the system message to OpenAI, Anthropic, or any LLM node.</li>
      </ol>

      <h2>One Workflow, Multiple Prompts</h2>
      <p>
        This is where it gets powerful. Instead of duplicating workflows for different clients or scenarios, you can use a single workflow that receives a <code>prompt_slug</code> parameter and dynamically loads the right prompt.
      </p>
      <p>
        For example, a single customer support workflow can serve:
      </p>
      <ul>
        <li><code>support-acme</code> — a friendly, casual tone for ACME Corp</li>
        <li><code>support-globex</code> — a formal, professional tone for Globex Industries</li>
        <li><code>sales-bot</code> — a sales qualification prompt for inbound leads</li>
      </ul>
      <p>
        The workflow stays the same. Only the prompt changes — and it&apos;s controlled from xR2&apos;s dashboard, not inside n8n.
      </p>

      <h3>Triggering with Different Slugs</h3>
      <p>
        Use a webhook trigger that accepts a JSON body with <code>prompt_slug</code> and <code>message</code> fields. The xR2 node reads <code>prompt_slug</code> from the incoming data, fetches the corresponding prompt, and passes it to the LLM. This means your API callers or chatbot frontend can control which prompt gets used — without touching the workflow.
      </p>

      <h2>Edit Prompts Without Touching n8n</h2>
      <p>
        Once your workflow fetches prompts from xR2, your team can iterate on prompt wording directly in the xR2 editor. No n8n access required. No workflow restarts. Changes take effect on the next API call.
      </p>
      <p>
        This is especially useful for:
      </p>
      <ul>
        <li><strong>Product managers</strong> who want to tweak AI behavior without developer involvement</li>
        <li><strong>Support teams</strong> adjusting tone or adding new FAQ coverage</li>
        <li><strong>Agencies</strong> managing prompts for multiple clients from one dashboard</li>
      </ul>

      <h2>Prompt Variables</h2>
      <p>
        xR2 prompts support <strong>dynamic variables</strong> using <code>{"{{variable_name}}"}</code> syntax. Define placeholders in your prompt like <code>{"{{company_name}}"}</code> or <code>{"{{product_list}}"}</code>, then pass values at runtime. The xR2 node resolves them before sending to the LLM.
      </p>
      <p>
        This separates <em>prompt logic</em> (the template) from <em>runtime data</em> (the variables) — keeping your prompts clean and reusable.
      </p>

      <h2>Version Control Built In</h2>
      <p>
        Every prompt in xR2 goes through a lifecycle: <strong>Draft → Testing → Production</strong>. You can have a production version serving live traffic while editing a new draft. When ready, promote it to production with one click. If something breaks, roll back instantly.
      </p>
      <p>
        Your n8n workflow always fetches the production version by default — so draft edits never affect live workflows until you explicitly promote them.
      </p>

      <h2>Getting Started</h2>
      <ol>
        <li>Sign up at <a href="https://xr2.uk">xr2.uk</a> (free plan: 10 prompts, 100 API calls/month)</li>
        <li>Install <code>n8n-nodes-xr2</code> from n8n Community Nodes</li>
        <li>Create your first prompt and set a slug</li>
        <li>Add the xR2 node to your workflow, enter your API key</li>
        <li>Connect the output to your AI node — done</li>
      </ol>
      <p>
        The entire setup takes under 5 minutes. Your prompts are now managed externally, versioned, and ready for A/B testing when you need it.
      </p>
    </Article>
  )
}
