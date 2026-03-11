import { Metadata } from "next"
import { Article } from "../article"

export const metadata: Metadata = {
  title: "Version Control for AI Prompts — xR2",
  description: "Manage AI prompt versions with Draft → Testing → Production lifecycle. Roll back instantly, promote safely, and never lose a working prompt again.",
  keywords: ["version control AI prompts", "prompt versioning", "prompt lifecycle management", "AI prompt rollback", "prompt deployment workflow", "prompt version history"],
  alternates: {
    canonical: "https://xr2.uk/blog/prompt-versioning",
  },
  openGraph: {
    title: "Version Control for AI Prompts — xR2",
    description: "Manage AI prompt versions with Draft → Testing → Production lifecycle. Roll back instantly, promote safely.",
  },
}

export default function PromptVersioning() {
  return (
    <Article
      title="Version Control for AI Prompts"
      subtitle="Draft, test, and promote prompts through a structured lifecycle. Roll back instantly when something breaks."
      readTime="5 min"
      relatedLinks={[
        { href: "/blog/prompt-ab-testing", label: "A/B Test AI Prompts" },
        { href: "/blog/n8n-prompt-management", label: "n8n Prompt Management" },
        { href: "/blog/langfuse-alternative", label: "xR2 vs Langfuse & Alternatives" },
      ]}
    >
      <h2>Why Prompts Need Version Control</h2>
      <p>
        Code has Git. Designs have Figma history. Database schemas have migrations. But AI prompts? Most teams store them as hardcoded strings with no history, no rollback, and no safe way to test changes.
      </p>
      <p>
        This matters because a prompt <em>is</em> a product feature. When your AI assistant suddenly gives weird responses, the first question is: &quot;Did someone change the prompt?&quot; Without version control, answering that question requires digging through commit logs — if the change was even committed at all.
      </p>

      <h2>The Problem with &quot;Just Use Git&quot;</h2>
      <p>
        You could store prompts in your codebase and version them with Git. But this creates several issues:
      </p>
      <ul>
        <li><strong>Changing a prompt requires a deploy.</strong> Even a one-word tweak goes through commit → CI/CD → deployment. For a string that might need daily adjustments, this is too slow.</li>
        <li><strong>Non-developers can&apos;t edit.</strong> Product managers and support leads — the people who often know best what the AI should say — can&apos;t push to Git.</li>
        <li><strong>No safe testing path.</strong> You either test in production (risky) or maintain separate staging prompts that may drift from production.</li>
        <li><strong>No connection to outcomes.</strong> Git tells you <em>what</em> changed, but not whether the change improved conversion rates or user satisfaction.</li>
      </ul>

      <h2>How xR2 Handles Prompt Versions</h2>
      <p>
        Every prompt in xR2 has a <strong>status lifecycle</strong>:
      </p>
      <ul>
        <li><strong>Draft</strong> — Work in progress. Not served via API. Edit freely without affecting anything.</li>
        <li><strong>Testing</strong> — Available via API with an explicit <code>status: &quot;testing&quot;</code> parameter. Use this for QA, staging environments, or A/B tests.</li>
        <li><strong>Production</strong> — The default version served by the API. This is what your live workflows and apps receive.</li>
      </ul>

      <h3>The Workflow</h3>
      <ol>
        <li><strong>Write a new version</strong> — Create or edit a prompt in Draft status. The current Production version continues serving live traffic.</li>
        <li><strong>Promote to Testing</strong> — When ready, move the draft to Testing. Your staging environment or QA flows can now fetch it explicitly.</li>
        <li><strong>Validate</strong> — Run test scenarios, check outputs, verify edge cases. The Production version is still untouched.</li>
        <li><strong>Promote to Production</strong> — One click. The new version is now live. The old version is stored in history.</li>
        <li><strong>Roll back if needed</strong> — If the new version causes issues, revert to the previous production version instantly. No deploy, no Git revert, no downtime.</li>
      </ol>

      <h2>Version History</h2>
      <p>
        xR2 keeps a full history of every prompt version. You can see:
      </p>
      <ul>
        <li>What the prompt text was at each version</li>
        <li>When it was promoted to production</li>
        <li>Who made the change</li>
        <li>The diff between any two versions</li>
      </ul>
      <p>
        This gives you the audit trail that hardcoded prompts lack. When someone asks &quot;why did our AI start responding differently last Tuesday?&quot; — you have the answer in seconds.
      </p>

      <h2>Safe Editing for Non-Developers</h2>
      <p>
        Because xR2 separates prompt editing from code deployment, product managers, marketers, and support leads can safely modify prompts:
      </p>
      <ul>
        <li>They edit in a visual editor — no code, no Git</li>
        <li>Changes start as Drafts — nothing goes live until explicitly promoted</li>
        <li>The Production version acts as a safety net — it&apos;s always there to fall back to</li>
      </ul>
      <p>
        This is the core idea: <strong>a prompt is a product feature, not a line of code.</strong> The people closest to the product should be able to iterate on it without a deploy cycle.
      </p>

      <h2>Integrates with Your Workflow</h2>
      <p>
        Version control in xR2 works seamlessly with automation platforms. Your n8n workflow or Make.com scenario always fetches the Production version by default. When you promote a new version, the next API call automatically gets the updated prompt — no workflow changes needed.
      </p>
      <p>
        For testing environments, pass <code>status: &quot;testing&quot;</code> in your API call to fetch the testing version explicitly. This lets you run parallel environments with different prompt versions.
      </p>

      <h2>Getting Started</h2>
      <ol>
        <li>Sign up at <a href="https://xr2.uk">xr2.uk</a> and create your first prompt</li>
        <li>Write your initial version and promote it to Production</li>
        <li>When you need a change, edit the prompt — it starts as a Draft automatically</li>
        <li>Test, validate, and promote when ready</li>
      </ol>
      <p>
        Free plan includes 10 prompts with full version history. No credit card required.
      </p>
    </Article>
  )
}
