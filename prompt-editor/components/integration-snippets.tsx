"use client"

import React, { useState } from 'react'
import { Copy, Check, Terminal, Code, Puzzle } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'

interface IntegrationSnippetsProps {
  slug: string
  variables?: { name: string; type: string; defaultValue?: string }[]
  apiKey?: string
  compact?: boolean
}

type TabKey = 'curl' | 'python' | 'nodejs' | 'n8n'

function buildVariablesJson(variables: IntegrationSnippetsProps['variables']) {
  if (!variables || variables.length === 0) return ''
  const pairs = variables.map(v => `    "${v.name}": "${v.defaultValue || `<${v.type}>`}"`)
  return `,\n  "variables": {\n${pairs.join(',\n')}\n  }`
}

function getCurlSnippet(slug: string, apiKey: string, variables: IntegrationSnippetsProps['variables']) {
  const vars = buildVariablesJson(variables)
  return `curl -X POST https://api.xr2.uk/api/v1/get-prompt \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"slug": "${slug}"${vars}}'`
}

function getPythonSnippet(slug: string, apiKey: string, variables: IntegrationSnippetsProps['variables']) {
  const varsDict = variables && variables.length > 0
    ? `\n    variables={${variables.map(v => `"${v.name}": "${v.defaultValue || '...'}"`).join(', ')}},`
    : ''
  return `pip install xr2

from xr2 import XR2Client

client = XR2Client(api_key="${apiKey}")
prompt = client.get_prompt(
    slug="${slug}",${varsDict}
)
print(prompt.system_prompt)`
}

function getNodeSnippet(slug: string, apiKey: string, variables: IntegrationSnippetsProps['variables']) {
  const varsObj = variables && variables.length > 0
    ? `\n    variables: {${variables.map(v => ` ${v.name}: "${v.defaultValue || '...'}"`).join(',')} },`
    : ''
  return `npm install xr2

const res = await fetch(
  "https://api.xr2.uk/api/v1/get-prompt",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer ${apiKey}",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slug: "${slug}",${varsObj}
    }),
  }
);
const data = await res.json();`
}

function getN8nSnippet(slug: string) {
  return `1. Install "xR2" from Community Nodes
   n8n Settings > Community Nodes > xR2
2. Add API key in Credentials
3. Use "Get Prompt" with slug: "${slug}"
4. Connect to your AI model node

docs.xr2.uk/integrations/n8n`
}

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'curl', label: 'cURL', icon: Terminal },
  { key: 'python', label: 'Python', icon: Code },
  { key: 'nodejs', label: 'Node.js', icon: Code },
  { key: 'n8n', label: 'n8n', icon: Puzzle },
]

export function IntegrationSnippets({ slug, variables, apiKey, compact }: IntegrationSnippetsProps) {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = useState<TabKey>('curl')
  const [copied, setCopied] = useState(false)

  const key = apiKey || 'YOUR_API_KEY'
  const definedVars = variables?.filter(v => v.defaultValue || v.type)

  const snippets: Record<TabKey, string> = {
    curl: getCurlSnippet(slug, key, definedVars),
    python: getPythonSnippet(slug, key, definedVars),
    nodejs: getNodeSnippet(slug, key, definedVars),
    n8n: getN8nSnippet(slug),
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippets[activeTab])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {/* Tabs */}
      <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-medium transition-colors flex-1 justify-center whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3 h-3 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Code block */}
      <div className="relative group">
        <pre className={`bg-[#1e1e1e] text-[#d4d4d4] rounded-lg overflow-auto font-mono ${
          compact ? 'p-2 text-[10px] leading-4 max-h-[120px]' : 'p-3 text-xs leading-5 max-h-[180px]'
        }`}>
          <code className="whitespace-pre">{snippets[activeTab]}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-1.5 right-1.5 p-1 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
          title={t('integration.copy')}
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    </div>
  )
}
