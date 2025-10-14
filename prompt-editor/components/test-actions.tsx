"use client"

import { Button } from "@/components/ui/button"

interface TestActionsProps {
  onTestAgain: () => void
  onPublish?: () => void
}

export function TestActions({ onTestAgain, onPublish }: TestActionsProps) {
  return (
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={onTestAgain}>
        Test Again
      </Button>
      {onPublish && (
        <Button onClick={onPublish} className="bg-green-600 hover:bg-green-700">
          Publish
        </Button>
      )}
    </div>
  )
}
