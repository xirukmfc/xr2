"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type VariableType = "string" | "number" | "boolean" | "array"

export interface EditVariablePayload {
  type: VariableType
  defaultValue?: string
  isDefined?: boolean
}

interface EditVariableModalProps {
  isOpen: boolean
  onClose: () => void
  variable: {
    name: string
    type: VariableType
    defaultValue?: string
    isDefined: boolean
  } | null
  onSave: (name: string, data: EditVariablePayload) => void
}

export function EditVariableModal({ isOpen, onClose, variable, onSave }: EditVariableModalProps) {
  const [type, setType] = useState<VariableType>("string")
  const [defaultValue, setDefaultValue] = useState<string>("")
  const [markDefined, setMarkDefined] = useState<boolean>(true)

  useEffect(() => {
    if (variable) {
      setType(variable.type)
      setDefaultValue(variable.defaultValue ?? "")
      setMarkDefined(variable.isDefined ?? true)
    }
  }, [variable])

  if (!variable) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-96 max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Variable</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input value={variable.name} readOnly className="bg-gray-50" />
            <p className="text-xs text-gray-500 mt-1">Renaming is currently disabled.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <Select value={type} onValueChange={(v: VariableType) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="array">Array</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
            <Input
              type="text"
              placeholder="Optional"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="markDefined"
              type="checkbox"
              checked={markDefined}
              onChange={(e) => setMarkDefined(e.target.checked)}
            />
            <label htmlFor="markDefined" className="text-sm text-gray-700">
              Mark as defined
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(variable.name, { type, defaultValue: defaultValue || undefined, isDefined: markDefined })
              onClose()
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
