"use client"

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IntegrationSnippets } from '@/components/integration-snippets'
import { Rocket, Key, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/contexts/locale-context'
import { getApiKeys } from '@/lib/api'

interface FirstPublishModalProps {
  isOpen: boolean
  onClose: () => void
  slug: string
  variables?: { name: string; type: string; defaultValue?: string }[]
}

export function FirstPublishModal({ isOpen, onClose, slug, variables }: FirstPublishModalProps) {
  const router = useRouter()
  const { t } = useLocale()
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)

  // Fetch the real (decrypted) API key when modal opens
  useEffect(() => {
    if (!isOpen) return
    getApiKeys().then(keys => {
      if (keys && keys.length > 0 && keys[0].api_key) {
        setApiKey(keys[0].api_key)
      }
    }).catch(() => {})
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Rocket className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {t('firstPublish.title')}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {t('firstPublish.subtitle')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 overflow-y-auto flex-1 min-h-0">
          <IntegrationSnippets
            slug={slug}
            apiKey={apiKey}
            variables={variables}
          />
        </div>

        <div className="flex-shrink-0 space-y-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => {
                router.push('/api-keys')
                onClose()
              }}
            >
              <Key className="w-3.5 h-3.5" />
              {t('firstPublish.getApiKey')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              asChild
            >
              <a href="https://docs.xr2.uk" target="_blank" rel="noopener noreferrer">
                <BookOpen className="w-3.5 h-3.5" />
                {t('firstPublish.viewDocs')}
              </a>
            </Button>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {t('firstPublish.gotIt')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
