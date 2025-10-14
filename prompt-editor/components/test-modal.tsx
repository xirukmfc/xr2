"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNotification } from "@/components/notification-provider"
import { AIResponseDisplay } from "@/components/ai-response-display"
import { MetricsGrid } from "@/components/metrics-grid"
import { X, Loader2, Settings, Play, Key, AlertTriangle, ChevronDown } from "lucide-react"
import { apiClient } from "@/lib/api"

export interface Variable {
  name: string
  isDefined: boolean
  description?: string
}
export interface PromptDataLike {
  systemPrompt: string
  userPrompt: string
  variables: Variable[]
}

interface APIModel {
  id?: string
  name?: string
  context_window?: number
}

interface APIProvider {
  id: string
  name: string
  display_name: string
  description?: string
  is_active: boolean
  api_base_url?: string
  models: (string | APIModel)[] // Support both string and object formats
  created_at: string
  updated_at: string
}

// Removed hardcoded PROVIDERS - now using dynamic data from API

const LS_KEY_PREFIX = "tester:apiKey:"

interface TestModal {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt?: PromptDataLike
}

export function TestModal({ open, onOpenChange, prompt }: TestModal) {
  const { showNotification } = useNotification()

  const safePrompt = useMemo(
    () =>
      prompt || {
        systemPrompt: "",
        userPrompt: "",
        variables: [],
      },
    [prompt],
  )

  // Dynamic providers from API
  const [apiProviders, setApiProviders] = useState<APIProvider[]>([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [providersError, setProvidersError] = useState<string | null>(null)

  const [provider, setProvider] = useState<string>("")
  const [model, setModel] = useState<string>("")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState<number | undefined>(2000)
  const [tools, setTools] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [testVars, setTestVars] = useState<Record<string, string>>({})
  const [apiKey, setApiKey] = useState("")
  const [needsApiKey, setNeedsApiKey] = useState(false)

  const [isRunning, setIsRunning] = useState(false)
  const [response, setResponse] = useState("")
  const [metrics, setMetrics] = useState<{
      responseTime: string;
      tokens?: number;
      inputTokens?: number;
      outputTokens?: number;
      cost?: string;
    }>({
      responseTime: "—",
    })


  // Fetch providers from API when modal opens
  useEffect(() => {
    if (!open) return
    
    const fetchProviders = async () => {
      try {
        setProvidersLoading(true)
        setProvidersError(null)
        const providersData = await apiClient.request('/llm/providers')
        console.log('[TestModal] Received providers from API:', providersData)
        
        let providersArray: APIProvider[] = []
        if (Array.isArray(providersData)) {
          providersArray = providersData
        } else if (providersData && typeof providersData === 'object' && 'data' in providersData && Array.isArray((providersData as any).data)) {
        providersArray = (providersData as any).data
      }

        setApiProviders(providersArray)
        
        // Set default provider and model if available
        if (providersArray.length > 0) {
          const firstProvider = providersArray[0]
          setProvider(firstProvider.id)
          if (firstProvider.models && firstProvider.models.length > 0) {
            const firstModel = firstProvider.models[0]
            const modelValue = typeof firstModel === 'string' ? firstModel : firstModel.id || firstModel.name || ''
            setModel(modelValue)
          }
        }
        
        setProvidersLoading(false)
      } catch (error) {
        console.error('[TestModal] Error loading providers:', error)
        setProvidersError('Failed to load providers')
        setProvidersLoading(false)
        showNotification('Failed to load providers', 'error')
      }
    }
    
    fetchProviders()
  }, [open])

  // load key from localStorage for current provider
  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem(LS_KEY_PREFIX + provider) || ""
    setApiKey(saved)
  }, [provider])

  // when changing provider — reset model to first
  useEffect(() => {
    if (!provider || apiProviders.length === 0) return
    
    const currentProvider = apiProviders.find(p => p.id === provider)
    if (currentProvider && currentProvider.models && currentProvider.models.length > 0) {
      const firstModel = currentProvider.models[0]
      const modelValue = typeof firstModel === 'string' ? firstModel : firstModel.id || firstModel.name || ''
      setModel(modelValue)
    } else {
      setModel("")
    }

    // For now, we don't require API keys for demo purposes
    setNeedsApiKey(false)
  }, [provider, apiProviders]) // eslint-disable-line react-hooks/exhaustive-deps


  const undefinedVars = useMemo(
    () => safePrompt.variables.filter((v) => !v.isDefined || !testVars[v.name] || testVars[v.name].trim() === "").map((v) => v.name),
    [safePrompt.variables, testVars],
  )

  // Early return if no prompt data
  if (!prompt) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/20 z-[1000]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-gray-600">No prompt data available</p>
              <Button onClick={() => onOpenChange(false)} className="mt-4">
                Close
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }

  const persistKey = () => {
    localStorage.setItem(LS_KEY_PREFIX + provider, apiKey)
    setNeedsApiKey(false)
  }

  const runTest = async () => {
  setIsRunning(true)
  setResponse("")
  setMetrics({ responseTime: "—" })

  const started = performance.now()

  console.log('[TestModal] Starting test request...') // Add logs

  try {
    // Get user auth token for API key retrieval
    const tokenStart = performance.now()
    const token = apiClient.getToken()
    console.log(`[TestModal] Token retrieval took: ${(performance.now() - tokenStart).toFixed(2)}ms`)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Add Authorization header if user is authenticated
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Get provider name instead of ID for API call
    const currentProvider = apiProviders.find(p => p.id === provider)
    const providerName = currentProvider?.name || provider

    const toolsArray = Object.entries(tools)
      .filter(([key, value]) => value)
      .map(([key]) => key)

    const requestBody = {
      provider: providerName,
      model,
      temperature,
      max_output_tokens: maxTokens,
      systemPrompt: safePrompt.systemPrompt,
      userPrompt: safePrompt.userPrompt,
      variables: testVars,
      tools: toolsArray,
    }

    console.log('[TestModal] Request body:', requestBody)
    const fetchStart = performance.now()

    const res = await fetch("http://localhost:8000/internal/llm/test-run", {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    console.log(`[TestModal] API request took: ${(performance.now() - fetchStart).toFixed(2)}ms`)

    if (res.status === 401) {
      setNeedsApiKey(true)
      showNotification("API key required for selected model", "error")
      return
    }
    if (!res.ok) {
      const err = await res.text()
      throw new Error(err || "Request failed")
    }

    const parseStart = performance.now()
    const data: {
      text: string
      usage?: {
        total?: number
        prompt_tokens?: number
        completion_tokens?: number
      }
      costUsd?: number | null
    } = await res.json()

    console.log(`[TestModal] JSON parsing took: ${(performance.now() - parseStart).toFixed(2)}ms`)
    console.log('[TestModal] Response data:', data)

    const elapsed = (performance.now() - started) / 1000
    setResponse(data.text || "")
    setMetrics({
      responseTime: `${elapsed.toFixed(2)}s`,
      tokens: data.usage?.total,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      cost: data.costUsd !== undefined && data.costUsd !== null
        ? `$${data.costUsd.toFixed(6)}`
        : "—",
    })
  } catch (e: any) {
    console.error('[TestModal] Error during test run:', e)
    showNotification(e?.message || "Request error", "error")
  } finally {
    setIsRunning(false)
  }
}


  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 z-[1000]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2 w-[min(1200px,95vw)] max-h-[90vh] bg-white rounded-lg shadow-lg border border-gray-300">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-gray-600" />
              <Dialog.Title className="text-sm font-medium text-gray-900">Test with AI</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex overflow-hidden" style={{ height: "calc(90vh - 60px)" }}>
            <div className="w-72 border-r border-gray-200 flex flex-col bg-white">
              <div className="flex-1 overflow-y-auto">
                {/* Model Selection */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Model</label>
                  <div className="space-y-2">
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={providersLoading}
                    >
                      {providersLoading ? (
                        <option>Loading providers...</option>
                      ) : providersError ? (
                        <option>Error loading providers</option>
                      ) : (
                        apiProviders.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.display_name}
                          </option>
                        ))
                      )}
                    </select>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={providersLoading || !provider}
                    >
                      {providersLoading ? (
                        <option>Loading models...</option>
                      ) : (
                        apiProviders
                          .find(p => p.id === provider)
                          ?.models.map((model, index) => {
                            // Handle both string and object formats for backward compatibility
                            const modelKey = typeof model === 'string' ? model : model.id || model.name || index.toString();
                            const modelValue = typeof model === 'string' ? model : model.id || model.name || '';
                            const modelDisplay = typeof model === 'string' ? model : model.name || model.id || 'Unknown model';
                            
                            return (
                              <option key={modelKey} value={modelValue}>
                                {modelDisplay}
                              </option>
                            );
                          }) || <option>No models available</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Variables */}
                {safePrompt.variables.length > 0 && (
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-700">Variables</label>
                      {undefinedVars.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          {undefinedVars.length} undefined
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {safePrompt.variables.map((v) => (
                        <div key={v.name} className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">{v.name}</label>
                          <Input
                            value={testVars[v.name] ?? ""}
                            onChange={(e) => setTestVars((s) => ({ ...s, [v.name]: e.target.value }))}
                            placeholder={v.isDefined ? "Enter value..." : "Undefined variable"}
                            className={`text-sm h-8 ${!v.isDefined ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                          />
                          {v.description && <p className="text-xs text-gray-500">{v.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advanced Settings Toggle */}
                <div className="border-b border-gray-200">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full justify-between text-left px-4 py-3 h-12 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Advanced Settings
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                  </Button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                  <div className="px-4 py-3 space-y-3 border-b border-gray-200 bg-gray-50">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Temperature</label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min={0}
                          max={2}
                          step={0.01}
                          value={temperature}
                          onChange={(e) => setTemperature(Math.min(2, Math.max(0, Number.parseFloat(e.target.value) || 0)))}
                          className="w-20"
                        />
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.01}
                          value={temperature}
                          onChange={(e) => setTemperature(Number.parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Max tokens (optional)</label>
                      <Input
                          type="number"
                          min={1}
                          placeholder="e.g. 512"
                          value={maxTokens ?? ""}
                          onChange={(e) => setMaxTokens(e.target.value ? Number(e.target.value) : undefined)}
                          className="text-sm h-8 border-gray-300"
                        />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Tools</label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={tools.includes('web_search')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTools(prev => [...prev, 'web_search'])
                            } else {
                              setTools(prev => prev.filter(tool => tool !== 'web_search'))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Web search (experimental)
                      </label>
                    </div>
                  </div>
                )}

                {/* API Key Prompt */}
                {needsApiKey && (
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                        <Key className="w-4 h-4" />
                        API Key Required
                      </div>
                      <Input
                        type="password"
                        placeholder={`${apiProviders.find(p => p.id === provider)?.display_name || 'Provider'} API key`}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="text-sm h-8 border-blue-200"
                      />
                      <div className="flex gap-2">
                        <Button onClick={persistKey} size="sm">
                          Save key
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setNeedsApiKey(false)}>
                          Later
                        </Button>
                      </div>
                      <p className="text-xs text-blue-700">
                        Key is stored locally in your browser for {apiProviders.find(p => p.id === provider)?.display_name || 'this provider'}.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Run Button */}
              <div className="p-4 border-t border-gray-200">
                <Button onClick={runTest} disabled={isRunning || undefinedVars.length > 0} className="w-full bg-black hover:bg-gray-800">
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Test
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
              <div className="flex-1 overflow-y-auto p-4">
                <AIResponseDisplay isLoading={isRunning} response={response} />
              </div>

              {/* Bottom Metrics */}
              <div className="border-t border-gray-200 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Response Time</div>
                      <div className="text-sm font-mono">{metrics.responseTime}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Total Tokens</div>
                      <div className="text-sm font-mono">{metrics.tokens ?? "—"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Input Tokens</div>
                      <div className="text-sm font-mono">{metrics.inputTokens ?? "—"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Output Tokens</div>
                      <div className="text-sm font-mono">{metrics.outputTokens ?? "—"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Cost</div>
                      <div className="text-sm font-mono">{metrics.cost ?? "—"}</div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
