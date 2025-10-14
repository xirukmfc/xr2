"use client"

import { useState } from "react"
import { MoreHorizontal, Copy, Edit2, Trash2, Eye, EyeOff, Power, PowerOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useNotification } from "@/components/notification-provider"
import type { ApiKey } from "@/app/api-keys/page"

interface ApiKeysTableProps {
  apiKeys: ApiKey[]
  onDelete: (keyId: string) => void
  onRename: (keyId: string, newName: string) => void
  onToggleStatus: (keyId: string) => void
  totalItems: number
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export function ApiKeysTable({
  apiKeys,
  onDelete,
  onRename,
  onToggleStatus,
  totalItems,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
}: ApiKeysTableProps) {
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [renameKeyId, setRenameKeyId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const { showNotification } = useNotification()

  const handleDelete = () => {
    if (deleteKeyId) {
      onDelete(deleteKeyId)
      setDeleteKeyId(null)
      showNotification("API key deleted successfully", "success")
    }
  }

  const handleRename = () => {
    if (renameKeyId && newName.trim()) {
      onRename(renameKeyId, newName.trim())
      setRenameKeyId(null)
      setNewName("")
      showNotification("API key renamed successfully", "success")
    }
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    showNotification("API key copied to clipboard", "success")
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId)
    } else {
      newVisibleKeys.add(keyId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const formatUsage = (usage: number) => {
    if (usage >= 1000000) return `${(usage / 1000000).toFixed(1)}M`
    if (usage >= 1000) return `${(usage / 1000).toFixed(1)}K`
    return usage.toString()
  }

  const getStatusDot = (status: string) => {
    return status === "active" ? "bg-green-500" : "bg-slate-400"
  }

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <div className="grid grid-cols-12 gap-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <div className="col-span-3">Name</div>
            <div className="col-span-4">API Key</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Usage (30d)</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Power className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No API keys found</h3>
              <p className="text-slate-500 mb-4">Create your first API key to get started with the API.</p>
            </div>
          ) : (
            apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="border-b border-slate-100 px-4 py-2 hover:bg-slate-50 transition-colors">
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Name */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusDot(apiKey.status)}`}></div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{apiKey.name}</div>
                        <div className="text-xs text-slate-500">
                          Created {new Date(apiKey.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API Key */}
                  <div className="col-span-4">
                    <div className="flex items-center space-x-1">
                      <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : apiKey.maskedKey}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="h-5 w-5 p-0 hover:bg-slate-200"
                      >
                        {visibleKeys.has(apiKey.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyKey(apiKey.key)}
                        className="h-5 w-5 p-0 hover:bg-slate-200"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Last used: {apiKey.lastUsed}</div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <Badge
                      variant={apiKey.status === "active" ? "default" : "secondary"}
                      className={`text-xs px-2 py-0.5 ${
                        apiKey.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {apiKey.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Usage */}
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-slate-900">{formatUsage(apiKey.usage30d)}</div>
                    <div className="text-xs text-slate-500">requests</div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setRenameKeyId(apiKey.id)
                            setNewName(apiKey.name)
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(apiKey.id)}>
                          {apiKey.status === "active" ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteKeyId(apiKey.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-1.5">
        <div className="text-xs text-slate-600">
          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
          <span className="font-medium">{totalItems}</span> API keys
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 px-3 text-xs"
          >
            Previous
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1
            return (
              <Button
                key={pageNum}
                size="sm"
                variant={currentPage === pageNum ? "default" : "ghost"}
                onClick={() => onPageChange(pageNum)}
                className={`h-8 px-3 text-xs ${currentPage === pageNum ? "bg-blue-600 text-white" : ""}`}
              >
                {pageNum}
              </Button>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 px-3 text-xs"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone and will immediately revoke
              access for any applications using this key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameKeyId} onOpenChange={() => setRenameKeyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">API Key Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter API key name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameKeyId(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
