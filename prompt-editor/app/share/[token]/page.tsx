"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, User, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPublicPrompt } from '@/lib/api'
import type { PublicPromptData } from '@/lib/api'

export default function SharedPromptPage() {
  const params = useParams()
  const token = params?.token as string

  const [promptData, setPromptData] = useState<PublicPromptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Function to extract default values from prompt text
  const extractDefaultValues = (text: string, variableName: string): string | null => {
    if (!text) return null

    // Look for patterns like {{name:defaultValue}} or {{name|defaultValue}}
    const patterns = [
      new RegExp(`\\{\\{${variableName}:([^}]+)\\}\\}`, 'g'),
      new RegExp(`\\{\\{${variableName}\\|([^}]+)\\}\\}`, 'g'),
      new RegExp(`\\{\\{${variableName}=([^}]+)\\}\\}`, 'g')
    ]

    for (const pattern of patterns) {
      const match = pattern.exec(text)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return null
  }

  // Function to get actual default value for a variable
  const getDefaultValue = (variable: any): string | null => {
    // First check if the variable has a default value from API
    if (variable.defaultValue !== null && variable.defaultValue !== undefined && variable.defaultValue !== '') {
      return variable.defaultValue
    }

    // If not, try to extract from prompt text
    const allPromptText = [
      promptData?.system_prompt,
      promptData?.user_prompt,
      promptData?.assistant_prompt,
      promptData?.prompt_template
    ].filter(Boolean).join(' ')

    return extractDefaultValues(allPromptText, variable.name)
  }

  useEffect(() => {
    const loadPromptData = async () => {
      try {
        const data = await getPublicPrompt(token)
        setPromptData(data)
      } catch (err: any) {
        // Parse error message to provide user-friendly feedback
        const errorMessage = err.message || ''
        if (errorMessage.includes('404') || errorMessage.toLowerCase().includes('not found')) {
          setError('Prompt not found. This shared link may have been deleted or has expired.')
        } else if (errorMessage.includes('403') || errorMessage.toLowerCase().includes('forbidden')) {
          setError('Access denied. You do not have permission to view this prompt.')
        } else {
          setError('Failed to load shared prompt. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadPromptData()
    }
  }, [token])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared prompt...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Prompt Not Found</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="pt-2 text-sm text-muted-foreground">
              <p className="font-medium mb-1">Possible reasons:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>The shared link has been deleted by the owner</li>
                <li>The link has expired</li>
                <li>The link URL is incorrect</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!promptData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This shared prompt could not be found or has expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="text-center space-y-2 pb-4 border-b">
          <div className="flex items-center justify-center space-x-3">
            <h1 className="text-2xl font-semibold">{promptData.prompt_name}</h1>
            <Badge variant="secondary">v{promptData.version_number}</Badge>
          </div>

          {promptData.prompt_description && (
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {promptData.prompt_description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-2">
            {promptData.shared_by_name && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Shared by {promptData.shared_by_name}</span>
              </div>
            )}
            {promptData.created_by_name && (
              <div className="flex items-center space-x-1">
                <span>Created by {promptData.created_by_name}</span>
              </div>
            )}
            {promptData.updated_by_name && (
              <div className="flex items-center space-x-1">
                <span>Updated by {promptData.updated_by_name}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Created {new Date(promptData.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>Updated {new Date(promptData.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Variables */}
        {promptData.variables && promptData.variables.length > 0 && (
          <div className="space-y-2 py-3">
            <h3 className="text-sm font-medium text-muted-foreground">Variables ({promptData.variables.length})</h3>
            <div className="flex flex-wrap gap-2">
              {promptData.variables.map((variable, index) => {
                const defaultValue = getDefaultValue(variable)
                const varType = variable.type || 'string'
                return (
                  <button
                    key={index}
                    onClick={() => copyToClipboard(`{{${variable.name}}}`, `var-${index}`)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/40 hover:bg-muted border rounded-lg text-xs transition-colors group"
                    title="Click to copy"
                  >
                    <code className="font-mono font-medium">{`{{${variable.name}}}`}</code>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{varType}</Badge>
                    {defaultValue && (
                      <span className="text-muted-foreground border-l pl-2 ml-0.5">
                        <span className="opacity-60">default:</span> {defaultValue}
                      </span>
                    )}
                    {copiedField === `var-${index}` ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Prompts - Vertical Stack */}
        <div className="space-y-4">

          {/* System Prompt */}
          {promptData.system_prompt && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">System Prompt</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(promptData.system_prompt!, 'system')}
                  className="h-7 px-2 text-xs"
                >
                  {copiedField === 'system' ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy
                </Button>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 border">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {promptData.system_prompt}
                </pre>
              </div>
            </div>
          )}

          {/* User Prompt */}
          {promptData.user_prompt && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">User Prompt</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(promptData.user_prompt!, 'user')}
                  className="h-7 px-2 text-xs"
                >
                  {copiedField === 'user' ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy
                </Button>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 border">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {promptData.user_prompt}
                </pre>
              </div>
            </div>
          )}

          {/* Assistant Prompt */}
          {promptData.assistant_prompt && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Assistant Prompt</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(promptData.assistant_prompt!, 'assistant')}
                  className="h-7 px-2 text-xs"
                >
                  {copiedField === 'assistant' ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy
                </Button>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 border">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {promptData.assistant_prompt}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Read-only view • Powered by <span className="font-medium">xR2</span></p>
        </div>

      </div>
    </div>
  )
}