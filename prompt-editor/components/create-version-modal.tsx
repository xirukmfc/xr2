"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateVersionModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateVersion: (option: "current" | "history" | "scratch", versionId?: string) => void
  availableVersions: Array<{ id: string; name: string }>
}

export function CreateVersionModal({ isOpen, onClose, onCreateVersion, availableVersions }: CreateVersionModalProps) {
  const [selectedOption, setSelectedOption] = useState<"current" | "history" | "scratch">("current")
  const [selectedVersionId, setSelectedVersionId] = useState<string>("")

  const handleCreate = () => {
    onCreateVersion(selectedOption, selectedVersionId)
    onClose()
    setSelectedOption("current")
    setSelectedVersionId("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={selectedOption} onValueChange={(value) => setSelectedOption(value as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="current" id="current" />
              <Label htmlFor="current">Copy current version</Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="scratch" id="scratch" />
              <Label htmlFor="scratch">Start from scratch</Label>
            </div>
          </RadioGroup>

          {selectedOption === "history" && (
            <div className="ml-6">
              <Label htmlFor="version-select" className="text-sm text-gray-600">
                Select version to copy:
              </Label>
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Choose a version..." />
                </SelectTrigger>
                <SelectContent>
                  {availableVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={selectedOption === "history" && !selectedVersionId} className="bg-black hover:bg-gray-800">
            Create Version
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
