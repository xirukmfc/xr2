"use client"

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface HotkeysCallbacks {
  onSave?: () => void | Promise<void>
  onSendToProduction?: () => void | Promise<void>
}

export function useHotkeys(callbacks: HotkeysCallbacks = {}) {
  const router = useRouter()
  const pathname = usePathname()

  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    // Only handle Cmd on Mac / Ctrl on Windows/Linux
    const isModKey = event.metaKey || event.ctrlKey

    if (!isModKey) return

    // Check if we're in an input field, textarea, or contenteditable element
    const target = event.target as HTMLElement
    const isInputField = target.tagName === 'INPUT' ||
                        target.tagName === 'TEXTAREA' ||
                        target.contentEditable === 'true' ||
                        target.closest('.monaco-editor') !== null

    // Prevent default browser shortcuts
    switch (event.key.toLowerCase()) {
      case 's':
        // Don't interfere with normal save in input fields unless we have a save callback
        if (isInputField && !callbacks.onSave) return

        event.preventDefault()
        event.stopPropagation()

        // Cmd+S: Save (use standard notifications)
        if (callbacks.onSave) {
          try {
            await callbacks.onSave()
            // Don't show toast - use standard notifications from the app
          } catch (error) {
            console.error('Save failed:', error)
            // Don't show toast - use standard notifications from the app
          }
        }
        break

      case 'p':
        // Don't interfere with print in input fields unless we have a publish callback
        if (isInputField && !callbacks.onSendToProduction) return

        event.preventDefault()
        event.stopPropagation()

        // Cmd+P: Send to production (use standard notifications)
        if (callbacks.onSendToProduction) {
          try {
            await callbacks.onSendToProduction()
            // Don't show toast - use standard notifications from the app
          } catch (error) {
            console.error('Publish failed:', error)
            // Don't show toast - use standard notifications from the app
          }
        }
        break
    }
  }, [callbacks, router, pathname])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}