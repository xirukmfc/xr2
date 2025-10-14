"use client"

import type React from "react"

import { useState } from "react"
import { X, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotification } from "@/components/notification-provider"

interface NewApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateApiKey: (data: { 
    name: string; 
    description?: string;
  }) => Promise<string>
}

export function NewApiKeyModal({ isOpen, onClose, onCreateApiKey }: NewApiKeyModalProps) {
  const [step, setStep] = useState<"form" | "success">("form")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [generatedKey, setGeneratedKey] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const newKey = await onCreateApiKey({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      setGeneratedKey(newKey)
      setStep("success")
    } catch (error) {
      console.error('Failed to create API key:', error)
      // Error is already handled in parent component
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey)
    setCopied(true)
    showNotification("API key copied to clipboard", "success")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setStep("form")
    setName("")
    setDescription("")
    setGeneratedKey("")
    setCopied(false)
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{step === "form" ? "Create New API Key" : "API Key Created"}</DialogTitle>
          </div>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">API Key Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Production API Key"
                required
              />
              <p className="text-sm text-slate-500 mt-1">
                Choose a descriptive name to help you identify this key later.
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will this key be used for?"
              />
            </div>


            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || loading}>
                {loading ? "Creating..." : "Create API Key"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-green-800 mb-2">
                <Check className="w-4 h-4" />
                <span className="font-medium">API Key Created Successfully</span>
              </div>
              <p className="text-sm text-green-700">
                Your new API key has been generated. Make sure to copy it now as you won't be able to see it again.
              </p>
            </div>

            <div>
              <Label>Your API Key</Label>
              <div className="flex items-center space-x-2 mt-1">
                <code className="flex-1 text-sm font-mono bg-slate-100 px-3 py-2 rounded border break-all">{generatedKey}</code>
                <Button variant="outline" size="sm" onClick={handleCopy} className="flex-shrink-0 bg-transparent">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
