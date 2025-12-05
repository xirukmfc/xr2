"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNotification } from "@/components/notification-provider"
import { useLocale } from "@/contexts/locale-context"
import type { Variable } from "@/app/page"

interface AddVariableModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (variable: Omit<Variable, "isDefined">) => void
}

export function AddVariableModal({ isOpen, onClose, onAdd }: AddVariableModalProps) {
  const { t } = useLocale()
  const [name, setName] = useState("")
  const [type, setType] = useState<"string" | "number" | "boolean" | "array">("string")
  const [defaultValue, setDefaultValue] = useState("")
  const { showNotification } = useNotification()

  const handleSubmit = () => {
    if (!name.trim()) {
      showNotification("Variable name is required", "error")
      return
    }

    onAdd({
      name: name.trim(),
      type,
      defaultValue: defaultValue.trim() || undefined,
    })

    // Reset form
    setName("")
    setType("string")
    setDefaultValue("")

    showNotification("Variable added successfully!", "success")
    onClose()
  }

  const handleClose = () => {
    setName("")
    setType("string")
    setDefaultValue("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-96 max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('editor.addVariable.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('editor.addVariable.name')}</label>
            <Input type="text" placeholder={t('editor.addVariable.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('editor.addVariable.type')}</label>
            <Select value={type} onValueChange={(value: typeof type) => setType(value)}>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('editor.addVariable.defaultValue')}</label>
            <Input
              type="text"
              placeholder={t('editor.addVariable.defaultValuePlaceholder')}
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="ghost" onClick={handleClose}>
            {t('editor.addVariable.cancel')}
          </Button>
          <Button onClick={handleSubmit} className="bg-black hover:bg-gray-800">{t('editor.addVariable.add')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
