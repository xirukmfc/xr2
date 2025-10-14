"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPublicPrompt } from '@/lib/api'
import type { PublicPromptData } from '@/lib/api'

export default function SharedPromptPage() {
  const params = useParams()
  const token = params.token as string

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
        setError(err.message || 'Failed to load shared prompt')
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
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
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
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">

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

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Column - System Prompt & Variables */}
          <div className="space-y-4">

            {/* System Prompt */}
            {promptData.system_prompt && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-normal text-muted-foreground">System Prompt</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(promptData.system_prompt!, 'system')}
                    >
                      {copiedField === 'system' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-1">Copy</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-muted/30 rounded p-3 border">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {promptData.system_prompt}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Variables */}
            {promptData.variables && promptData.variables.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-normal text-muted-foreground">Variables ({promptData.variables.length})</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {promptData.variables.map((variable, index) => {
                      const defaultValue = getDefaultValue(variable)
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
                          <div className="flex items-center space-x-2 min-w-0">
                            <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">
                              {`{{${variable.name}}}`}
                            </code>
                            <Badge variant="outline" className="text-xs">
                              {variable.type || 'string'}
                            </Badge>
                            {defaultValue ? (
                              <span className="text-xs text-muted-foreground truncate">
                                <code className="bg-background px-1 rounded">{defaultValue}</code>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">no default</span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`{{${variable.name}}}`, `var-${index}`)}
                            className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                          >
                            {copiedField === `var-${index}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - User Prompt & Assistant Prompt */}
          <div className="space-y-4">
            {/* User Prompt */}
            {promptData.user_prompt && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-normal text-muted-foreground">User Prompt</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(promptData.user_prompt!, 'user')}
                    >
                      {copiedField === 'user' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-1">Copy</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-muted/30 rounded p-3 border">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {promptData.user_prompt}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assistant Prompt */}
            {promptData.assistant_prompt && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-normal text-muted-foreground">Assistant Prompt</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(promptData.assistant_prompt!, 'assistant')}
                    >
                      {copiedField === 'assistant' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-1">Copy</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-muted/30 rounded p-3 border">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {promptData.assistant_prompt}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Read-only view • Powered by <span className="font-medium">xR2</span></p>
        </div>

      </div>
    </div>
  )
}