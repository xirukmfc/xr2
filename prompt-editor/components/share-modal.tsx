"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Copy, Check, ExternalLink, Trash2 } from 'lucide-react'
import { createPublicShare, deletePublicShare } from '@/lib/api'
import type { PublicShareResponse } from '@/lib/api'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  promptVersionId: string
  promptName: string
  versionNumber: string
  existingShare?: PublicShareResponse | null
  onShareCreated?: (share: PublicShareResponse) => void
  onShareDeleted?: () => void
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  promptVersionId,
  promptName,
  versionNumber,
  existingShare,
  onShareCreated,
  onShareDeleted
}) => {
  const [shareData, setShareData] = useState<PublicShareResponse | null>(existingShare || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateShare = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const newShare = await createPublicShare({
        prompt_version_id: promptVersionId
      })
      setShareData(newShare)
      onShareCreated?.(newShare)
    } catch (err: any) {
      setError(err.message || 'Failed to create share link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteShare = async () => {
    if (!shareData) return

    setIsLoading(true)
    setError(null)

    try {
      await deletePublicShare(shareData.id)
      setShareData(null)
      onShareDeleted?.()
    } catch (err: any) {
      setError(err.message || 'Failed to delete share link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareData?.share_url) return

    try {
      await navigator.clipboard.writeText(shareData.share_url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleOpenLink = () => {
    if (!shareData?.share_url) return
    window.open(shareData.share_url, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Prompt Template</DialogTitle>
          <DialogDescription>
            Share version {versionNumber} of "{promptName}" with others via a public link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border">
              {error}
            </div>
          )}

          {!shareData ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Create a public, read-only link that anyone can access without logging in.
              </p>
              <Button
                onClick={handleCreateShare}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Share Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Your public share link is ready:
              </p>

              <div className="flex space-x-2">
                <Input
                  value={shareData.share_url}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex items-center space-x-1"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="sr-only">Copy link</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenLink}
                  className="flex items-center space-x-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="sr-only">Open link</span>
                </Button>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p>• Created: {new Date(shareData.created_at).toLocaleString()}</p>
                <p>• This link will remain active until the prompt version is deleted</p>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteShare}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Link
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}