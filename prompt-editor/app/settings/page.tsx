"use client"

import { useState, useEffect, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Trash2, Edit2, Plus, Eye, EyeOff, Search, User, Tag, Key, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { NotificationProvider, useNotification } from "@/components/notification-provider"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { logger } from "@/lib/logger"

interface LLMApiKey {
  id: string
  name: string
  user_id: string
  provider_id: string
  provider_name?: string
  provider_display_name?: string
  created_at: string
  updated_at: string
}

interface LLMProvider {
  id: string
  name: string
  display_name: string
  description?: string
  is_active: boolean
  api_base_url?: string
  created_at: string
  updated_at: string
}

interface UserTag {
  id: string
  name: string
  color: string
}

const colorOptions = [
  { value: "#3B82F6", label: "Blue", class: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { value: "#10B981", label: "Green", class: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  { value: "#8B5CF6", label: "Purple", class: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  { value: "#F59E0B", label: "Orange", class: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  { value: "#EC4899", label: "Pink", class: "bg-pink-50 text-pink-700 border-pink-200", dot: "bg-pink-500" },
  { value: "#14B8A6", label: "Teal", class: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
  { value: "#6366F1", label: "Indigo", class: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  { value: "#EF4444", label: "Red", class: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
]


const subsections = [
  { id: "profile", name: "Profile", icon: User },
  { id: "tags", name: "Tags", icon: Tag },
  { id: "llm-keys", name: "LLM API Keys", icon: Key },
]

function SettingsPageContent() {
  const { user, refreshUser } = useAuth()
  const { showNotification } = useNotification()
  const [activeSubsection, setActiveSubsection] = useState<string>("profile")
  const [tags, setTags] = useState<UserTag[]>([])
  const [tagsLoading, setTagsLoading] = useState<boolean>(true)
  const [tagsError, setTagsError] = useState<string | null>(null)
  const didFetchTags = useRef(false)

  // LLM API Keys state
  const [llmKeys, setLlmKeys] = useState<LLMApiKey[]>([])
  const [llmKeysLoading, setLlmKeysLoading] = useState<boolean>(true)
  const [llmKeysError, setLlmKeysError] = useState<string | null>(null)
  
  // LLM Providers state
  const [llmProviders, setLlmProviders] = useState<LLMProvider[]>([])
  const [providersLoading, setProvidersLoading] = useState<boolean>(true)
  const [providersError, setProvidersError] = useState<string | null>(null)
  
  const didFetchLLMData = useRef(false)

  const [showTagModal, setShowTagModal] = useState(false)
  const [showLLMModal, setShowLLMModal] = useState(false)
  const [editingTag, setEditingTag] = useState<UserTag | null>(null)
  const [editingLLM, setEditingLLM] = useState<LLMApiKey | null>(null)

  const [tagSearch, setTagSearch] = useState("")

  // Delete confirmation dialogs
  const [showDeleteTagDialog, setShowDeleteTagDialog] = useState(false)
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null)
  const [showDeleteLLMDialog, setShowDeleteLLMDialog] = useState(false)
  const [deletingLLMId, setDeletingLLMId] = useState<string | null>(null)

  const [tagForm, setTagForm] = useState({ name: "", color: "#3B82F6" })
  const [llmForm, setLlmForm] = useState({ name: "", provider_id: "", api_key: "" })
  
  // Form states for profile
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: ""
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  // Load user data into profile form
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        email: user.email || ""
      })
    }
  }, [user])

  // Load tags from API
  useEffect(() => {
    if (didFetchTags.current) return
    didFetchTags.current = true

    const loadUserTags = async () => {
      try {
        setTagsLoading(true)
        setTagsError(null)
        logger.log('[Settings] Loading user tags...')
        
        const data = await apiClient.getUserTags()
        logger.log('[Settings] Received tags from API:', data)
        
        // Process the tags data similar to left-panel.tsx
        let tagsArray: UserTag[] = []
        
        if (Array.isArray(data)) {
          tagsArray = data.map((tag: any) => ({
            id: tag.id || '',
            name: tag.name || '',
            color: tag.color || '#3B82F6'
          }))
        } else if (data && typeof data === 'object' && Array.isArray((data as any).tags)) {
          tagsArray = (data as any).tags.map((tag: any) => ({
            id: tag.id || '',
            name: tag.name || '',
            color: tag.color || '#3B82F6'
          }))
        } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
          tagsArray = (data as any).data.map((tag: any) => ({
            id: tag.id || '',
            name: tag.name || '',
            color: tag.color || '#3B82F6'
          }))
        }
        
        logger.log('[Settings] Processed tags array:', tagsArray)
        setTags(tagsArray)
      } catch (error) {
        logger.error('[Settings] Failed to load user tags:', error)
        setTagsError('Failed to load tags')
        setTags([])
      } finally {
        setTagsLoading(false)
      }
    }

    loadUserTags()
  }, [])

  // Load LLM providers and user API keys from API
  useEffect(() => {
    if (didFetchLLMData.current) return
    didFetchLLMData.current = true

    const loadLLMData = async () => {
      try {
        // Load providers first
        setProvidersLoading(true)
        setProvidersError(null)
        logger.log('[Settings] Loading LLM providers...')
        
        const providersData = await apiClient.request('/llm/providers')
        logger.log('[Settings] Received providers from API:', providersData)
        
        let providersArray: LLMProvider[] = []
        if (Array.isArray(providersData)) {
          providersArray = providersData
        } else if (providersData && typeof providersData === 'object' && 'data' in providersData && Array.isArray(providersData.data)) {
          providersArray = providersData.data
        }

        setLlmProviders(providersArray)
        setProvidersLoading(false)

        // Then load user API keys
        setLlmKeysLoading(true)
        setLlmKeysError(null)
        logger.log('[Settings] Loading user API keys...')
        
        const keysData = await apiClient.request('/llm/api-keys')
        logger.log('[Settings] Received API keys from API:', keysData)
        
        let keysArray: LLMApiKey[] = []
        if (Array.isArray(keysData)) {
          keysArray = keysData
        } else if (keysData && typeof keysData === 'object' && 'data' in keysData && Array.isArray(keysData.data)) {
          keysArray = keysData.data
        }

        setLlmKeys(keysArray)
        setLlmKeysLoading(false)
        
      } catch (error) {
        logger.error('[Settings] Failed to load LLM data:', error)
        setProvidersError('Failed to load providers')
        setLlmKeysError('Failed to load API keys')
        setProvidersLoading(false)
        setLlmKeysLoading(false)
      }
    }

    loadLLMData()
  }, [])

  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true)
      await apiClient.request('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      })
      await refreshUser()
      showNotification('Profile updated successfully', 'success')
    } catch (error: any) {
      logger.error('Failed to save profile:', error)
      showNotification(error?.message || 'Failed to save profile', 'error')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setDeleteAccountLoading(true)
      await apiClient.request('/auth/me', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      })
      // Account deleted successfully - clear token and redirect
      showNotification('Account deleted successfully', 'success')
      apiClient.clearToken()
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    } catch (error: any) {
      logger.error('Failed to delete account:', error)
      showNotification(error?.message || 'Failed to delete account. Please try again.', 'error')
    } finally {
      setDeleteAccountLoading(false)
      setShowDeleteConfirmDialog(false)
      setDeleteConfirmation("")
    }
  }

  const openDeleteDialog = () => {
    setDeleteConfirmation("")
    setShowDeleteConfirmDialog(true)
  }

  const handleSaveTag = async () => {
    try {
      if (editingTag) {
        // Update existing tag
        logger.log('[Settings] Updating tag:', editingTag.id, tagForm)
        await apiClient.updateTag(editingTag.id, {
          name: tagForm.name,
          color: tagForm.color
        })

        // Update local state
        setTags(tags.map((tag) =>
          tag.id === editingTag.id ? { ...tag, ...tagForm } : tag
        ))
        showNotification('Tag updated successfully', 'success')
      } else {
        // Create new tag
        logger.log('[Settings] Creating new tag:', tagForm)
        const newTag = await apiClient.createTag({
          name: tagForm.name,
          color: tagForm.color
        })

        logger.log('[Settings] Created tag:', newTag)

        // Add to local state
        setTags([...tags, {
          id: newTag.id,
          name: newTag.name,
          color: newTag.color
        }])
        showNotification('Tag created successfully', 'success')
      }

      setShowTagModal(false)
      setEditingTag(null)
      setTagForm({ name: "", color: "#3B82F6" })
    } catch (error) {
      logger.error('[Settings] Failed to save tag:', error)
      showNotification('Failed to save tag', 'error')
    }
  }

  const handleSaveLLM = async () => {
    try {
      if (editingLLM) {
        // Update existing API key
        logger.log('[Settings] Updating API key:', editingLLM.id)

        // Only include api_key if it's not empty
        const updateData: any = {
          name: llmForm.name
        }
        if (llmForm.api_key && llmForm.api_key.trim() !== '') {
          updateData.api_key = llmForm.api_key
        }

        const updatedKey = await apiClient.request(`/llm/api-keys/${editingLLM.id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        })

        const typedUpdatedKey = updatedKey as LLMApiKey

        // Update local state
        setLlmKeys(llmKeys.map((key) => (key.id === editingLLM.id ? typedUpdatedKey : key)))
        showNotification('API key updated successfully', 'success')
      } else {
        // Create new API key
        logger.log('[Settings] Creating new API key')
        const newKey = await apiClient.request('/llm/api-keys', {
          method: 'POST',
          body: JSON.stringify({
            name: llmForm.name,
            provider_id: llmForm.provider_id,
            api_key: llmForm.api_key
          })
        })

        const typedNewKey = newKey as LLMApiKey

        // Update local state
        setLlmKeys([...llmKeys, typedNewKey])
        showNotification('API key created successfully', 'success')
      }

      setShowLLMModal(false)
      setEditingLLM(null)
      setLlmForm({ name: "", provider_id: "", api_key: "" })
    } catch (error) {
      logger.error('[Settings] Failed to save API key:', error)
      showNotification('Failed to save API key', 'error')
    }
  }

  const handleDeleteTag = async () => {
    if (!deletingTagId) return

    try {
      logger.log('[Settings] Deleting tag:', deletingTagId)
      await apiClient.deleteTag(deletingTagId)

      // Update local state
      setTags(tags.filter((tag) => tag.id !== deletingTagId))
      showNotification('Tag deleted successfully', 'success')
      setShowDeleteTagDialog(false)
      setDeletingTagId(null)
    } catch (error) {
      logger.error('[Settings] Failed to delete tag:', error)
      showNotification('Failed to delete tag', 'error')
    }
  }

  const handleDeleteLLM = async () => {
    if (!deletingLLMId) return

    try {
      logger.log('[Settings] Deleting API key:', deletingLLMId)
      await apiClient.request(`/llm/api-keys/${deletingLLMId}`, {
        method: 'DELETE'
      })

      // Update local state
      setLlmKeys(llmKeys.filter((key) => key.id !== deletingLLMId))
      showNotification('API key deleted successfully', 'success')
      setShowDeleteLLMDialog(false)
      setDeletingLLMId(null)
    } catch (error) {
      logger.error('[Settings] Failed to delete API key:', error)
      showNotification('Failed to delete API key', 'error')
    }
  }

  const openTagModal = (tag?: UserTag) => {
    if (tag) {
      setEditingTag(tag)
      setTagForm({ name: tag.name, color: tag.color })
    } else {
      setEditingTag(null)
      setTagForm({ name: "", color: "#3B82F6" })
    }
    setShowTagModal(true)
  }

  const openLLMModal = (llm?: LLMApiKey) => {
    if (llm) {
      setEditingLLM(llm)
      setLlmForm({ 
        name: llm.name || "", 
        provider_id: llm.provider_id,
        api_key: "" // Don't pre-fill API key for security
      })
    } else {
      setEditingLLM(null)
      setLlmForm({ name: "", provider_id: "", api_key: "" })
    }
    setShowLLMModal(true)
  }

  const getColorStyle = (color: string) => {
    return {
      '--tag-custom-color': color,
    } as React.CSSProperties
  }

  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase()))

  const renderProfileSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your personal account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input 
              id="full_name" 
              value={profileForm.full_name} 
              onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
              placeholder="Enter your full name" 
              className="mt-1" 
              disabled={profileLoading}
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              value={profileForm.email}
              onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
              placeholder="Enter your email" 
              className="mt-1" 
              disabled={profileLoading}
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={profileLoading}
            size="sm"
          >
            {profileLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that affect your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-red-800">Delete Account</h3>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button variant="destructive" className="ml-4" onClick={openDeleteDialog} size="sm">
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )


  const renderTagsSection = () => {
    if (tagsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <span className="text-sm text-muted-foreground">Loading tags...</span>
        </div>
      )
    }

    if (tagsError) {
      return (
        <div className="flex items-center justify-center py-12 text-red-600">
          <span>{tagsError}</span>
        </div>
      )
    }

    const tagColumns: Column<UserTag>[] = [
      {
        key: "name",
        header: "Name",
        width: "col-span-6",
        render: (tag) => (
          <div className="flex items-center space-x-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <div>
              <span className="font-medium text-slate-900 text-sm">{tag.name}</span>
            </div>
          </div>
        ),
      },
      {
        key: "color",
        header: "Color",
        width: "col-span-3",
        render: (tag) => (
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <span className="text-sm text-slate-600 font-mono">{tag.color}</span>
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        width: "col-span-3",
        render: (tag) => (
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => openTagModal(tag)} className="p-1 h-auto" title="Edit">
              <Edit2 className="w-4 h-4 text-slate-400 hover:text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeletingTagId(tag.id)
                setShowDeleteTagDialog(true)
              }}
              className="p-1 h-auto"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
            </Button>
          </div>
        ),
      },
    ]

    return (
      <div className="space-y-0">
        {/* Filters Block */}
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <Button
                onClick={() => openTagModal()}
                size="sm"
                className="text-xs h-9 px-3 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Spacing between filters and content */}
        <div className="h-4"></div>

        {/* Table */}
        <Card>
          <CardContent className="p-4">
            <DataTable
              data={filteredTags}
              columns={tagColumns}
              emptyState={{
                icon: <Tag className="w-6 h-6 text-slate-400" />,
                title: tagSearch ? "No tags found" : "No tags yet",
                description: tagSearch ? "Try adjusting your search terms." : "Create your first tag to get started.",
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderLLMKeysSection = () => {
    const llmColumns: Column<any>[] = [
      {
        key: "name",
        header: "Name",
        width: "col-span-4",
        render: (llm: LLMApiKey) => (
          <div>
            <div className="font-semibold text-slate-900 text-sm truncate">{llm.name}</div>
            <div className="text-xs text-slate-500 truncate">
              {llm.provider_display_name || llm.provider_name || 'Unknown Provider'}
            </div>
          </div>
        ),
      },
      {
        key: "created",
        header: "Created",
        width: "col-span-2",
        render: (llm: LLMApiKey) => (
          <div className="text-sm text-slate-600 whitespace-nowrap">
            {new Date(llm.created_at).toLocaleDateString()}
          </div>
        ),
      },
      {
        key: "key_preview",
        header: "Key Preview",
        width: "col-span-4",
        render: (llm: LLMApiKey) => (
          <div className="flex items-center space-x-2 min-w-0">
            <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-600 truncate">
              ••••••••••••••••••••
            </code>
            <span className="text-xs text-slate-400 whitespace-nowrap">Hidden</span>
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        width: "col-span-2",
        render: (llm: LLMApiKey) => (
          <div className="flex items-center space-x-1 justify-end">
            <Button variant="ghost" size="sm" onClick={() => openLLMModal(llm)} className="p-1 h-auto" title="Edit">
              <Edit2 className="w-4 h-4 text-slate-400 hover:text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeletingLLMId(llm.id)
                setShowDeleteLLMDialog(true)
              }}
              className="p-1 h-auto"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
            </Button>
          </div>
        ),
      },
    ]

    if (llmKeysLoading || providersLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading API keys...</p>
          </div>
        </div>
      )
    }

    if (llmKeysError || providersError) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-sm text-red-600 mb-2">
              {llmKeysError || providersError}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.reload()
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-0">
        {/* Filters Block */}
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex gap-2 items-center justify-end">
              <Button
                onClick={() => openLLMModal()}
                size="sm"
                className="text-xs h-9 px-3 gap-1.5"
                disabled={!llmProviders.length}
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Spacing between filters and content */}
        <div className="h-4"></div>

        {/* Table */}
        <Card>
          <CardContent className="p-4">
            <DataTable
              data={llmKeys}
              columns={llmColumns}
              emptyState={{
                icon: <Key className="w-6 h-6 text-slate-400" />,
                title: "No API keys yet",
                description: llmProviders.length === 0
                  ? "No LLM providers are available. Please contact your administrator."
                  : "Add your first API key to get started with LLM testing.",
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSubsection) {
      case "profile":
        return renderProfileSection()
      case "tags":
        return renderTagsSection()
      case "llm-keys":
        return renderLLMKeysSection()
      default:
        return renderProfileSection()
    }
  }

  return (
    <ProtectedRoute>
      <>
      {/* EditorHeader */}
      <div className="px-4 pt-[12px] pb-[12px] h-[65px] bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold">Settings</h1>
          <p className="text-xs text-muted-foreground">
            Manage your account, tags, and API configurations
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Horizontal tabs navigation */}
        <div className="bg-white border-b border-slate-200 px-4 h-10">
          <div className="flex items-center gap-1 -mb-px">
            {subsections.map((subsection) => {
              const Icon = subsection.icon
              const isActive = activeSubsection === subsection.id
              return (
                <button
                  key={subsection.id}
                  onClick={() => setActiveSubsection(subsection.id)}
                  className={`flex items-center gap-1.5 px-3 py-[11px] text-xs font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{subsection.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-full">{renderContent()}</div>
        </div>
      </div>

      {/* Tag Modal */}
      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Create New Tag"}</DialogTitle>
            <DialogDescription>
              {editingTag ? "Update the tag details below." : "Create a new tag for organizing your prompts."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={tagForm.name}
                onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                placeholder="Enter tag name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tag-color">Color</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setTagForm({ ...tagForm, color: color.value })}
                    className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${
                      tagForm.color === color.value
                        ? "border-slate-400 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                    <span className="text-sm">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Preview</Label>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: tagForm.color }}
                  />
                  <Badge variant="outline" className="border-gray-300">
                    {tagForm.name || "Tag Preview"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTag} disabled={!tagForm.name}>
              {editingTag ? "Update Tag" : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LLM API Key Modal */}
      <Dialog open={showLLMModal} onOpenChange={setShowLLMModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLLM ? "Edit API Key" : "Add New API Key"}</DialogTitle>
            <DialogDescription>
              {editingLLM ? "Update the API key details below." : "Add a new API key for LLM model testing."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="llm-name">Name</Label>
              <Input
                id="llm-name"
                value={llmForm.name}
                onChange={(e) => setLlmForm({ ...llmForm, name: e.target.value })}
                placeholder="Enter a name for this API key"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="llm-provider">Provider</Label>
              <Select 
                value={llmForm.provider_id} 
                onValueChange={(value) => setLlmForm({ ...llmForm, provider_id: value })}
                disabled={!!editingLLM} // Disable provider selection when editing
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {llmProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="llm-key">API Key</Label>
              <Input
                id="llm-key"
                type="password"
                value={llmForm.api_key}
                onChange={(e) => setLlmForm({ ...llmForm, api_key: e.target.value })}
                placeholder={editingLLM ? "Enter new API key (leave blank to keep current)" : "Enter your API key"}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLLMModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveLLM}
              disabled={!llmForm.name || !llmForm.provider_id || (!editingLLM && !llmForm.api_key)}
            >
              {editingLLM ? "Update Key" : "Add Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data including workspaces, prompts, tags, and API keys.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">⚠️ Warning</p>
              <p className="text-sm text-red-700 mt-1">
                All of your data will be permanently deleted, including:
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                <li>All workspaces and prompts</li>
                <li>All prompt versions and test data</li>
                <li>All tags and categorizations</li>
                <li>All API keys and configurations</li>
                <li>All usage history and analytics</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="delete-confirmation">Type "delete" to confirm</Label>
              <Input
                id="delete-confirmation"
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="mt-1"
                disabled={deleteAccountLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirmDialog(false)
                setDeleteConfirmation("")
              }}
              disabled={deleteAccountLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation.toLowerCase() !== "delete" || deleteAccountLoading}
            >
              {deleteAccountLoading ? "Deleting..." : "Delete My Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteTagDialog}
        onOpenChange={(open) => {
          setShowDeleteTagDialog(open)
          if (!open) setDeletingTagId(null)
        }}
        onConfirm={handleDeleteTag}
        title="Delete Tag"
        description="Are you sure you want to delete this tag? This action cannot be undone."
      />

      {/* Delete LLM API Key Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteLLMDialog}
        onOpenChange={(open) => {
          setShowDeleteLLMDialog(open)
          if (!open) setDeletingLLMId(null)
        }}
        onConfirm={handleDeleteLLM}
        title="Delete API Key"
        description="Are you sure you want to delete this API key? This action cannot be undone."
      />
      </>
    </ProtectedRoute>
  )
}

export default function SettingsPage() {
  return (
    <NotificationProvider>
      <SettingsPageContent />
    </NotificationProvider>
  )
}
