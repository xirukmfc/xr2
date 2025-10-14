"use client"

import { Trash2, Upload, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BulkActionsToolbarProps {
  selectedCount: number
  onDelete: () => void
  onDeploy: () => void
  onUndeploy: () => void
  onClearSelection: () => void
  isLoading?: boolean
}

export function BulkActionsToolbar({
  selectedCount,
  onDelete,
  onDeploy,
  onUndeploy,
  onClearSelection,
  isLoading = false
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-max">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{selectedCount}</span>
          <span>item{selectedCount > 1 ? 's' : ''} selected</span>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onDeploy}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
          >
            <Upload className="w-3.5 h-3.5" />
            Deploy
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onUndeploy}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
          >
            <Download className="w-3.5 h-3.5" />
            Undeploy
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          disabled={isLoading}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 px-2"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </Button>
      </div>
    </div>
  )
}