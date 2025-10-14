"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNotification } from "@/components/notification-provider"
import { useRouter } from "next/navigation"
import { apiClient, type ApiPrompt } from "@/lib/api"
import { useWorkspaceContext } from "@/components/workspace-context"

interface NewPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onPromptCreated?: (newPrompt: ApiPrompt) => void
}

export function NewPromptModal({ isOpen, onClose, onPromptCreated }: NewPromptModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [template, setTemplate] = useState("start-from-scratch")
  const [isCreating, setIsCreating] = useState(false)
  const { showNotification } = useNotification()
  const router = useRouter()
  const { currentWorkspaceId } = useWorkspaceContext() // get from context

  const handleSubmit = async () => {
    if (!name.trim()) {
      showNotification("Prompt name is required", "error")
      return
    }
    if (!currentWorkspaceId) {
      showNotification("No workspace selected. Try reloading the page.", "error")
      return
    }

    try {
      setIsCreating(true)

      const slug = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")

      const payload = {
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
        workspace_id: currentWorkspaceId,      // correct workspace
      }

      // log just in case
      // console.log("createPrompt payload", payload)

      const newPrompt = await apiClient.createPrompt(payload)

      showNotification("New prompt created successfully!", "success")

      onPromptCreated?.(newPrompt)
      onClose()

      // Navigate to editor
      router.push(`/editor/${newPrompt.id}`)

      // Reset form
      setName("")
      setDescription("")
      setTemplate("start-from-scratch")
    } catch (error: any) {
      console.error("Error creating prompt:", error)
      const msg =
        typeof error?.message === "string" ? error.message : "Failed to create prompt"
      showNotification(msg, "error")
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (isCreating) return
    setName("")
    setDescription("")
    setTemplate("start-from-scratch")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-96 max-w-sm">
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Name</label>
            <Input
              type="text"
              placeholder="e.g. Customer Welcome Message"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              placeholder="Brief description of what this prompt does..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              disabled={isCreating}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="ghost" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isCreating || !name.trim() || !currentWorkspaceId}
            title={!currentWorkspaceId ? "No workspace" : undefined}
          >
            {isCreating ? "Creating..." : "Create Prompt"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}