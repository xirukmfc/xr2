"use client"

import React, { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import {MoreHorizontal, Copy, Edit2, Trash2, Eye, EyeOff, Search, Key, Edit} from "lucide-react"
import { getApiKeys, deleteApiKey, createApiKey } from "@/lib/api"
import { useCountsContext } from "@/components/counts-context"
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
import { NotificationProvider, useNotification } from "@/components/notification-provider"
import { NewApiKeyModal } from "@/components/new-api-key-modal"
import { DataFilters } from "@/components/ui/data-filters"
import { DataTable } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import type { Column } from "@/components/ui/data-table"

export interface ApiKey {
  id: string
  name: string
  key_prefix: string
  api_key: string // Now always available - full API key
  description?: string
  total_requests: number
  last_used_at?: string
  created_at: string
  updated_at: string
}

function ApiKeysPageContent() {
  const [isNewApiKeyModalOpen, setIsNewApiKeyModalOpen] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10) // Fixed 10 items per page
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [renameKeyId, setRenameKeyId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  // Removed visibleKeys state - all keys are now always visible
  const { showNotification } = useNotification()
  const { invalidateAndRefetch } = useCountsContext()

  // Load API keys from backend
  useEffect(() => {
    const loadApiKeys = async () => {
      setLoading(true)
      setError(null)
      try {
        const keys = await getApiKeys()
        // Transform backend data to match frontend interface
        const transformedKeys = keys.map(key => ({
          id: key.id,
          name: key.name,
          key_prefix: key.key_prefix,
          api_key: key.api_key, // Full API key is now always available
          description: key.description,
          total_requests: key.total_requests || 0,
          last_used_at: key.last_used_at,
          created_at: key.created_at,
          updated_at: key.updated_at,
        }))
        setApiKeys(transformedKeys)
      } catch (err) {
        console.error('Error loading API keys:', err)
        setError(err instanceof Error ? err.message : 'Failed to load API keys')
      } finally {
        setLoading(false)
      }
    }

    loadApiKeys()
  }, [])

  // Removed dynamic pagination calculation - now fixed at 10 items per page

  const handleDelete = async () => {
    if (deleteKeyId) {
      try {
        await deleteApiKey(deleteKeyId)
        setApiKeys((prev) => prev.filter((k) => k.id !== deleteKeyId))
        setDeleteKeyId(null)
        showNotification("API key deleted successfully", "success")
        // Invalidate cache to update counts in sidebar
        await invalidateAndRefetch()
      } catch (err) {
        console.error('Error deleting API key:', err)
        showNotification("Failed to delete API key", "error")
      }
    }
  }

  const handleRename = () => {
    if (renameKeyId && newName.trim()) {
      setApiKeys((prev) => prev.map((k) => (k.id === renameKeyId ? { ...k, name: newName.trim() } : k)))
      setRenameKeyId(null)
      setNewName("")
      showNotification("API key renamed successfully", "success")
    }
  }


  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    showNotification("API key copied to clipboard", "success")
  }

  // Removed toggleKeyVisibility - all keys are now always visible

  const formatUsage = (usage: number) => {
    if (usage >= 1000000) return `${(usage / 1000000).toFixed(1)}M`
    if (usage >= 1000) return `${(usage / 1000).toFixed(1)}K`
    return usage.toString()
  }


  const handleCreateApiKey = async (data: { 
    name: string; 
    description?: string;
  }) => {
    try {
      const response = await createApiKey(data)
      // The response includes the actual API key
      const newApiKey: ApiKey = {
        id: response.id,
        name: response.name,
        key_prefix: response.key_prefix,
        api_key: response.api_key, // Full API key is always available
        description: response.description,
        total_requests: response.total_requests || 0,
        last_used_at: response.last_used_at,
        created_at: response.created_at,
        updated_at: response.updated_at,
      }
      
      setApiKeys((prev) => [newApiKey, ...prev])
      showNotification("API key created successfully", "success")
      // Invalidate cache to update counts in sidebar
      await invalidateAndRefetch()
      return response.api_key // Return the full API key for the modal
    } catch (err) {
      console.error('Error creating API key:', err)
      showNotification("Failed to create API key", "error")
      throw err
    }
  }

  // No filter options needed for API keys

  const sortOptions = [
    { value: "createdAt", label: "Sort by: Created Date" },
    { value: "name", label: "Sort by: Name" },
    { value: "usage", label: "Sort by: Usage" },
    { value: "lastUsed", label: "Sort by: Last Used" },
  ]

  const columns: Column<ApiKey>[] = [
    {
      key: "name",
      header: "Name",
      width: "col-span-3",
      render: (apiKey) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-sm font-medium text-slate-900">{apiKey.name}</div>
            <div className="text-xs text-slate-500">Created {new Date(apiKey.created_at).toLocaleDateString()}</div>
            {apiKey.description && (
              <div className="text-xs text-slate-400 truncate max-w-xs">{apiKey.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "apiKey",
      header: "API Key",
      width: "col-span-4",
      render: (apiKey) => (
        <div>
          <div className="flex items-center space-x-1">
            <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 select-all">
              {apiKey.api_key}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyKey(apiKey.api_key)}
              className="h-5 w-5 p-0 hover:bg-slate-200"
              title="Copy API key"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      width: "col-span-2",
      render: (apiKey) => (
        <div>
          <div className="text-sm font-medium text-slate-800">{apiKey.total_requests.toLocaleString()}</div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "col-span-1",
      render: (apiKey) => (
        <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="p-1 h-auto" title="Edit"
                    onClick={() => {
                      setRenameKeyId(apiKey.id);
                      setNewName(apiKey.name);
                    }}>
                <Edit className="w-4 h-4 text-slate-400 hover:text-blue-600"/>
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-auto" title="Delete"
                    onClick={() => setDeleteKeyId(apiKey.id)}>
                <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600"/>
            </Button>
        </div>
      ),
    },
  ]

  let filteredApiKeys = apiKeys.filter((apiKey) => {
    return apiKey.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  filteredApiKeys = filteredApiKeys.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "usage":
        return b.total_requests - a.total_requests
      case "lastUsed":
        if (!a.last_used_at) return 1
        if (!b.last_used_at) return -1
        return new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime()
      case "createdAt":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const totalPages = Math.ceil(filteredApiKeys.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedApiKeys = filteredApiKeys.slice(startIndex, startIndex + itemsPerPage)

  const emptyState = {
    icon: <Key className="w-6 h-6 text-slate-400" />,
    title: "No API keys found",
    description: "Create your first API key to get started with the API.",
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <div className="px-4 pt-[12px] pb-[12px] h-[65px] bg-white border-b border-slate-200">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4 flex-1">
              {/* Search field */}
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search API keys..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Create API Key button */}
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Button
                onClick={() => setIsNewApiKeyModalOpen(true)}
                className="bg-blue-600/90 hover:bg-blue-600 text-white h-[35px]"
              >
                + Create Keys
              </Button>
            </div>

            {/* Sort dropdown */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1">
          <DataTable data={paginatedApiKeys} columns={columns} emptyState={emptyState} />
          <Pagination
            totalItems={filteredApiKeys.length}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemName="API keys"
          />
        </div>
      </div>

      <NewApiKeyModal
        isOpen={isNewApiKeyModalOpen}
        onClose={() => setIsNewApiKeyModalOpen(false)}
        onCreateApiKey={handleCreateApiKey}
      />

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

export default function ApiKeysPage() {
  return (
    <ProtectedRoute>
      <NotificationProvider>
        <ApiKeysPageContent />
      </NotificationProvider>
    </ProtectedRoute>
  )
}
