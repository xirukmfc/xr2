"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useNotification } from "@/components/notification-provider"
import { Eye, Edit3, Bot, Save, Rocket, Loader2 } from "lucide-react"

interface HeaderProps {
  isPublished: boolean
  setIsPublished: (published: boolean) => void
  setIsTestModalOpen: (open: boolean) => void
  hasUndefinedVariables: boolean
  promptSlug?: string
  isPreviewMode: boolean
  setIsPreviewMode: (preview: boolean) => void
  currentViewingVersion?: string
  publishedVersion?: string
  onPublishVersion?: (version: string) => void
  onUnpublishVersion?: (version: string) => void
  onSave?: () => Promise<void> | void
  versions?: { id: string; version: string; status: string }[]
}

export function EditorHeader({
  isPublished,
  setIsPublished,
  setIsTestModalOpen,
  hasUndefinedVariables,
  promptSlug,
  isPreviewMode,
  setIsPreviewMode,
  currentViewingVersion,
  publishedVersion,
  onPublishVersion,
  onUnpublishVersion,
  onSave,
  versions = [],
}: HeaderProps) {
  const { showNotification } = useNotification()
  const router = useRouter()

  // Simple loading states
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    const onModS = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === "s" || e.key === "S")) {
        e.preventDefault()
        e.stopPropagation()
        if (!isSaving) {
          void handleSave()
        }
      }
    }
    window.addEventListener("keydown", onModS, { capture: true })
    return () => window.removeEventListener("keydown", onModS, { capture: true })
  }, [isSaving, onSave])

  const handleSave = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      await onSave?.()
      showNotification("Draft saved successfully!", "success")
      // Keep green state for a moment before resetting
      setTimeout(() => setIsSaving(false), 200)
    } catch (e: any) {
      console.error('Save error:', e)
      let errorMessage = "Failed to save"
      let notificationType: "error" | "warning" | "info" | "success" = "error"

      if (e instanceof Error) {
        errorMessage = e.message
      } else if (typeof e === 'string') {
        errorMessage = e
      } else if (e && typeof e === 'object' && e.message) {
        errorMessage = e.message
      }

      // Check if this is a production version edit attempt
      if (errorMessage.includes("Production versions cannot be edited")) {
        errorMessage = "Production versions cannot be edited. Please create a new version instead."
        notificationType = "warning"
      }

      // Check if this is an undefined variables warning
      if (errorMessage.includes("undefined variable(s) found")) {
        notificationType = "warning"
      }

      showNotification(errorMessage, notificationType)
      setIsSaving(false)
    }
  }

  const handlePublishUnpublish = async () => {
    if (!currentViewingVersion || isPublishing) return

    // Определяем, является ли текущая версия опубликованной
    const isCurrentlyPublished = publishedVersion === currentViewingVersion

    if (!isCurrentlyPublished && hasUndefinedVariables) {
      showNotification("Cannot publish: undefined variables found", "error")
      return
    }

    setIsPublishing(true)
    try {
      if (isCurrentlyPublished) {
        // Unpublish - pass version number
        await onUnpublishVersion?.(currentViewingVersion)
        showNotification(`Version ${currentViewingVersion} unpublished`, "success")
      } else {
        // Publish - pass version number
        await onPublishVersion?.(currentViewingVersion)
        showNotification(`Version ${currentViewingVersion} published successfully!`, "success")
      }
    } catch (e: any) {
      showNotification(e?.message || "Failed to publish/unpublish", "error")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleTest = async () => {
    if (isTesting) return

    setIsTesting(true)
    try {
      setIsTestModalOpen(true)
    } finally {
      setTimeout(() => setIsTesting(false), 500) // Small delay for UX
    }
  }

  const handlePreviewToggle = () => {
    setIsPreviewMode(!isPreviewMode)
    showNotification(isPreviewMode ? "Switched to edit mode" : "Switched to preview mode", "success")
  }

  const shouldShowPublishButton = !!currentViewingVersion
  const isCurrentlyPublished = publishedVersion === currentViewingVersion
  const publishButtonText = isCurrentlyPublished
    ? `Unpublish v.${currentViewingVersion}`
    : `Publish v.${currentViewingVersion}`

  return (
    <header className="fixed top-0 h-[65px] left-0 right-0 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            onClick={() => router.push("/prompts")}
            variant="ghost"
            className="gap-1 h-9 px-3 rounded-md text-sm border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <span className="text-lg leading-none">←</span>
            <span>Back</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <Button
            onClick={handlePreviewToggle}
            variant="outline"
            className="h-9 px-3 gap-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            {isPreviewMode ? (
              <>
                <Edit3 className="w-4 h-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Preview
              </>
            )}
          </Button>

          {/* Test with AI */}
          <Button
            onClick={handleTest}
            disabled={isTesting}
            variant="ghost"
            className="h-9 px-3 gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
            Test with AI
          </Button>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={`h-9 px-3 gap-1 transition-all duration-200 ${isSaving ? "bg-green-600 hover:bg-green-700 scale-95" : "bg-blue-600/90 hover:bg-blue-600 scale-100"} text-white`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>

          {/* Publish / Unpublish */}
          {shouldShowPublishButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={handlePublishUnpublish}
                      disabled={isPublishing || (!isCurrentlyPublished && hasUndefinedVariables)}
                      className={`h-9 px-3 gap-1 ${
                        isCurrentlyPublished
                          ? "bg-slate-600 hover:bg-slate-700 text-white"
                          : hasUndefinedVariables
                            ? "bg-amber-200 text-amber-900 cursor-not-allowed border border-amber-300"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                      }`}
                    >
                      {isPublishing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Rocket className="w-4 h-4" />
                      )}
                      {publishButtonText}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isCurrentlyPublished && hasUndefinedVariables && (
                  <TooltipContent>
                    <p>Cannot publish: there are undefined variables that need to be defined first</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </header>
  )
}