"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
import { Trash2, Edit2, Plus, Eye, EyeOff, Search, Tag, Key, Loader2, Zap, Check, X } from "lucide-react"
import { apiClient, getCurrentSubscription, getSubscriptionTransactions, cancelSubscription, resumeSubscription, getUserLimits, type UserLimits } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { NotificationProvider, useNotification } from "@/components/notification-provider"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { logger } from "@/lib/logger"
import { useLocale } from "@/contexts/locale-context"
import { Progress } from "@/components/ui/progress"
import { UpgradeModal } from "@/components/upgrade-modal"
import type { SubscriptionResponse, Transaction } from "@/types/subscription"

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
  { value: "#3B82F6", labelKey: "settings.tags.colors.blue", class: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { value: "#10B981", labelKey: "settings.tags.colors.green", class: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  { value: "#8B5CF6", labelKey: "settings.tags.colors.purple", class: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  { value: "#F59E0B", labelKey: "settings.tags.colors.orange", class: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  { value: "#EC4899", labelKey: "settings.tags.colors.pink", class: "bg-pink-50 text-pink-700 border-pink-200", dot: "bg-pink-500" },
  { value: "#14B8A6", labelKey: "settings.tags.colors.teal", class: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
  { value: "#6366F1", labelKey: "settings.tags.colors.indigo", class: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  { value: "#EF4444", labelKey: "settings.tags.colors.red", class: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
]


function SettingsPageContent() {
  const { t } = useLocale()
  const { user, refreshUser } = useAuth()
  const { showNotification } = useNotification()
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

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false)
  const didFetchSubscription = useRef(false)

  const translatedColorOptions = useMemo(() =>
    colorOptions.map((option) => ({
      ...option,
      label: t(option.labelKey),
    }))
  , [t])

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
        setTagsError(t('settings.tags.loadError'))
        setTags([])
      } finally {
        setTagsLoading(false)
      }
    }

    loadUserTags()
  }, [t])

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
        setProvidersError(t('settings.llmKeys.providersLoadError'))
        setLlmKeysError(t('settings.llmKeys.loadError'))
        setProvidersLoading(false)
        setLlmKeysLoading(false)
      }
    }

    loadLLMData()
  }, [t])

  // Load subscription data
  useEffect(() => {
    if (didFetchSubscription.current) return
    didFetchSubscription.current = true

    const loadSubscriptionData = async () => {
      try {
        setSubscriptionLoading(true)
        logger.log('[Settings] Loading subscription data...')

        const [subscriptionData, transactionsData, limitsData] = await Promise.all([
          getCurrentSubscription(),
          getSubscriptionTransactions(10, 0),
          getUserLimits()
        ])

        logger.log('[Settings] Received subscription:', subscriptionData)
        logger.log('[Settings] Received user limits:', limitsData)
        setSubscription(subscriptionData)
        setTransactions(transactionsData.transactions || [])
        setUserLimits(limitsData)
      } catch (error) {
        logger.error('[Settings] Failed to load subscription data:', error)
      } finally {
        setSubscriptionLoading(false)
      }
    }

    loadSubscriptionData()
  }, [])

  const handleCancelSubscription = async () => {
    try {
      setSubscriptionActionLoading(true)
      await cancelSubscription()
      showNotification(t('settings.notifications.subscriptionCancelled'), 'success')
      // Refresh subscription data
      const subscriptionData = await getCurrentSubscription()
      setSubscription(subscriptionData)
      setShowCancelDialog(false)
    } catch (error: any) {
      logger.error('Failed to cancel subscription:', error)
      showNotification(error?.message || t('settings.notifications.subscriptionError'), 'error')
    } finally {
      setSubscriptionActionLoading(false)
    }
  }

  const handleResumeSubscription = async () => {
    try {
      setSubscriptionActionLoading(true)
      // Resume cancelled subscription via API (calls LemonSqueezy/YooKassa resume API)
      const result = await resumeSubscription()

      // Check if subscription expired and requires new payment
      if (result.requires_payment) {
        // Show upgrade modal - it will use the saved payment provider
        setShowUpgradeModal(true)
        return
      }

      showNotification(t('settings.notifications.subscriptionResumed'), 'success')
      // Refresh subscription data
      const subData = await getCurrentSubscription()
      setSubscription(subData)
    } catch (error: any) {
      logger.error('Failed to resume subscription:', error)
      showNotification(error?.message || t('settings.notifications.subscriptionError'), 'error')
    } finally {
      setSubscriptionActionLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true)
      await apiClient.request('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      })
      await refreshUser()
      showNotification(t('settings.notifications.profileSaved'), 'success')
    } catch (error: any) {
      logger.error('Failed to save profile:', error)
      showNotification(error?.message || t('settings.notifications.profileSaveError'), 'error')
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
      showNotification(t('settings.notifications.accountDeleted'), 'success')
      apiClient.clearToken()
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    } catch (error: any) {
      logger.error('Failed to delete account:', error)
      showNotification(error?.message || t('settings.notifications.accountDeleteError'), 'error')
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
        showNotification(t('settings.notifications.tagUpdated'), 'success')
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
        showNotification(t('settings.notifications.tagCreated'), 'success')
      }

      setShowTagModal(false)
      setEditingTag(null)
      setTagForm({ name: "", color: "#3B82F6" })
    } catch (error) {
      logger.error('[Settings] Failed to save tag:', error)
      showNotification(t('settings.notifications.tagSaveError'), 'error')
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
        showNotification(t('settings.notifications.llmKeyUpdated'), 'success')
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
        showNotification(t('settings.notifications.llmKeyCreated'), 'success')
      }

      setShowLLMModal(false)
      setEditingLLM(null)
      setLlmForm({ name: "", provider_id: "", api_key: "" })
    } catch (error) {
      logger.error('[Settings] Failed to save API key:', error)
      showNotification(t('settings.notifications.llmKeySaveError'), 'error')
    }
  }

  const handleDeleteTag = async () => {
    if (!deletingTagId) return

    try {
      logger.log('[Settings] Deleting tag:', deletingTagId)
      await apiClient.deleteTag(deletingTagId)

      // Update local state
      setTags(tags.filter((tag) => tag.id !== deletingTagId))
      showNotification(t('settings.notifications.tagDeleted'), 'success')
      setShowDeleteTagDialog(false)
      setDeletingTagId(null)
    } catch (error) {
      logger.error('[Settings] Failed to delete tag:', error)
      showNotification(t('settings.notifications.tagDeleteError'), 'error')
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
      showNotification(t('settings.notifications.llmKeyDeleted'), 'success')
      setShowDeleteLLMDialog(false)
      setDeletingLLMId(null)
    } catch (error) {
      logger.error('[Settings] Failed to delete API key:', error)
      showNotification(t('settings.notifications.llmKeyDeleteError'), 'error')
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

  const filteredTags = tags.filter((tag) => tag.name?.toLowerCase().includes(tagSearch.toLowerCase()))

  const renderProfileSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.profile.title')}</CardTitle>
          <CardDescription>{t('settings.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full_name">{t('settings.profile.name')}</Label>
            <Input
              id="full_name"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
              placeholder={t('settings.profile.namePlaceholder')}
              className="mt-1"
              disabled={profileLoading}
            />
          </div>
          <div>
            <Label htmlFor="email">{t('settings.profile.email')}</Label>
            <Input
              id="email"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
              placeholder={t('settings.profile.emailPlaceholder')}
              className="mt-1"
              disabled={profileLoading}
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={profileLoading}
            size="sm"
          >
            {profileLoading ? t('settings.profile.saving') : t('settings.profile.save')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderDangerZone = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">{t('settings.account.title')}</CardTitle>
        <CardDescription>{t('settings.account.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800">{t('settings.account.deleteAccount')}</h3>
              <p className="text-sm text-red-700 mt-1">
                {t('settings.account.deleteAccountDescription')}
              </p>
            </div>
            <Button variant="destructive" className="ml-4" onClick={openDeleteDialog} size="sm">
              {t('settings.account.deleteAccount')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderSubscriptionSection = () => {
    if (subscriptionLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <span className="text-sm text-muted-foreground">{t('settings.subscription.loading')}</span>
        </div>
      )
    }

    if (!subscription) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Failed to load subscription data
        </div>
      )
    }

    const planBadgeColor = {
      free: 'bg-secondary text-foreground',
      pro: 'bg-blue-100 text-blue-700',
      enterprise: 'bg-purple-100 text-purple-700',
    }[subscription.plan] || 'bg-secondary text-foreground'

    const statusBadgeColor = {
      active: 'bg-green-100 text-green-700',
      cancelled: 'bg-amber-100 text-amber-700',
      expired: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
    }[subscription.status] || 'bg-secondary text-foreground'

    const statusLabel = {
      active: t('settings.subscription.statusActive'),
      cancelled: t('settings.subscription.statusCancelled'),
      expired: t('settings.subscription.statusExpired'),
      pending: t('settings.subscription.statusPending'),
    }[subscription.status] || subscription.status

    const transactionTypeLabel = (type: string) => ({
      subscription: t('settings.subscription.typeSubscription'),
      renewal: t('settings.subscription.typeRenewal'),
      upgrade: t('settings.subscription.typeUpgrade'),
      refund: t('settings.subscription.typeRefund'),
    }[type] || type)

    return (
      <div className="space-y-4">
        {/* Current Plan Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('settings.subscription.title')}</CardTitle>
              <div className="flex items-center gap-1.5">
                <Badge className={`${planBadgeColor} text-xs`}>
                  {subscription.plan === 'free' && t('settings.subscription.free')}
                  {subscription.plan === 'pro' && t('settings.subscription.pro')}
                  {subscription.plan === 'enterprise' && t('settings.subscription.enterprise')}
                </Badge>
                <Badge className={`${statusBadgeColor} text-xs`}>{statusLabel}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Plan Details - compact for Pro */}
            {subscription.plan !== 'free' && subscription.period_end && (
              <div className="flex items-center justify-between text-sm bg-secondary/50 rounded-md px-3 py-2">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">{t('settings.subscription.validUntil')}:</span>
                  <span className="font-medium">{new Date(subscription.period_end).toLocaleDateString()}</span>
                  <span className="text-muted-foreground">({subscription.days_remaining} {t('settings.subscription.daysRemaining')})</span>
                </div>
                <span className={subscription.auto_renew ? "text-green-600 text-xs" : "text-amber-600 text-xs"}>
                  {subscription.auto_renew ? t('settings.subscription.autoRenewOn') : t('settings.subscription.autoRenewOff')}
                </span>
              </div>
            )}

            {/* Usage Section - inline */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-md px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('settings.subscription.prompts')}</span>
                  <span className="font-medium">
                    {subscription.limits.max_prompts === -1
                      ? <span className="text-green-600">{t('settings.subscription.unlimited')}</span>
                      : userLimits
                        ? `${userLimits.limits.prompts.current} / ${subscription.limits.max_prompts}`
                        : subscription.limits.max_prompts
                    }
                  </span>
                </div>
                {subscription.limits.max_prompts > 0 && userLimits && (
                  <Progress value={(userLimits.limits.prompts.current / subscription.limits.max_prompts) * 100} className="h-1.5 mt-1.5" />
                )}
              </div>
              <div className="bg-secondary/50 rounded-md px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('settings.subscription.apiRequests')}</span>
                  <span className="font-medium">
                    {subscription.limits.max_api_requests_per_month === -1
                      ? <span className="text-green-600">{t('settings.subscription.unlimited')}</span>
                      : userLimits
                        ? `${userLimits.limits.api_requests.current.toLocaleString()} / ${subscription.limits.max_api_requests_per_month.toLocaleString()}`
                        : subscription.limits.max_api_requests_per_month.toLocaleString()
                    }
                  </span>
                </div>
                {subscription.limits.max_api_requests_per_month > 0 && userLimits && (
                  <Progress value={(userLimits.limits.api_requests.current / subscription.limits.max_api_requests_per_month) * 100} className="h-1.5 mt-1.5" />
                )}
              </div>
            </div>

            {/* Actions - compact */}
            {(subscription.plan === 'free' && !subscription.is_superuser) ||
             (subscription.plan !== 'free' && (subscription.status === 'active' || subscription.status === 'cancelled')) ? (
              <div className="flex items-center gap-2 pt-1">
                {subscription.plan === 'free' && !subscription.is_superuser && (
                  <Button size="sm" onClick={() => setShowUpgradeModal(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    {t('settings.subscription.upgradeToPro')}
                  </Button>
                )}
                {subscription.plan !== 'free' && subscription.status === 'active' && subscription.auto_renew && (
                  <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(true)} disabled={subscriptionActionLoading}>
                    {t('settings.subscription.cancelSubscription')}
                  </Button>
                )}
                {subscription.plan !== 'free' && subscription.status === 'cancelled' && (
                  <Button size="sm" onClick={handleResumeSubscription} disabled={subscriptionActionLoading}>
                    {subscriptionActionLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    {t('settings.subscription.resumeSubscription')}
                  </Button>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Transaction History - compact */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm font-medium">{t('settings.subscription.transactionHistory')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{transactionTypeLabel(tx.transaction_type)}</span>
                      <span className="text-xs text-muted-foreground">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tx.amount_display}</span>
                      <Badge variant="outline" className="text-xs py-0 px-1.5">
                        {tx.status === 'completed' && <Check className="w-3 h-3 text-green-500" />}
                        {tx.status === 'pending' && <Loader2 className="w-3 h-3 animate-spin" />}
                        {tx.status === 'failed' && <X className="w-3 h-3 text-red-500" />}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade Modal */}
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          onUpgradeSuccess={async () => {
            const subscriptionData = await getCurrentSubscription()
            setSubscription(subscriptionData)
            const txData = await getSubscriptionTransactions(10, 0)
            setTransactions(txData.transactions || [])
          }}
          forcedProvider={subscription?.payment_provider}
        />

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings.subscription.cancelSubscription')}</DialogTitle>
              <DialogDescription>
                {t('settings.subscription.cancelConfirm')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                {t('settings.subscription.keepButton')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={subscriptionActionLoading}
              >
                {subscriptionActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('settings.subscription.cancelButton')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const renderTagsSection = () => {
    if (tagsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <span className="text-sm text-muted-foreground">{t('settings.tags.loading')}</span>
        </div>
      )
    }

    if (tagsError) {
      return (
        <div className="flex items-center justify-center py-12 text-red-600">
          <span>{tagsError || t('settings.tags.loadError')}</span>
        </div>
      )
    }

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('settings.tags.title')}</CardTitle>
            <Button
              onClick={() => openTagModal()}
              size="sm"
              className="text-xs h-8 px-3 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('settings.tags.newTag')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Tag className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {tagSearch ? t('settings.tags.empty.filteredTitle') : t('settings.tags.empty.title')}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-secondary/30 text-sm"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-foreground">{tag.name}</span>
                  <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openTagModal(tag)} className="p-0.5 rounded hover:bg-secondary" title={t('settings.tags.modal.titleEdit')}>
                      <Edit2 className="w-3 h-3 text-muted-foreground hover:text-blue-600" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingTagId(tag.id)
                        setShowDeleteTagDialog(true)
                      }}
                      className="p-0.5 rounded hover:bg-secondary"
                      title={t('settings.tags.deleteDialog.title')}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderLLMKeysSection = () => {
    if (llmKeysLoading || providersLoading) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">{t('settings.llmKeys.loading')}</span>
          </CardContent>
        </Card>
      )
    }

    if (llmKeysError || providersError) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-red-600 mb-2">
              {llmKeysError || providersError || t('settings.llmKeys.loadError')}
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              {t('settings.llmKeys.retry')}
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('settings.llmKeys.title')}</CardTitle>
            <Button
              onClick={() => openLLMModal()}
              size="sm"
              className="text-xs h-8 px-3 gap-1.5"
              disabled={!llmProviders.length}
            >
              <Plus className="w-3.5 h-3.5" />
              {t('settings.llmKeys.newKey')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {llmKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Key className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {llmProviders.length === 0
                  ? t('settings.llmKeys.empty.noProviders')
                  : t('settings.llmKeys.empty.description')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {llmKeys.map((llm) => (
                <div key={llm.id} className="group flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{llm.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {llm.provider_display_name || llm.provider_name || t('settings.llmKeys.unknownProvider')}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openLLMModal(llm)} className="p-1 rounded hover:bg-secondary" title={t('settings.llmKeys.modal.titleEdit')}>
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-blue-600" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingLLMId(llm.id)
                        setShowDeleteLLMDialog(true)
                      }}
                      className="p-1 rounded hover:bg-secondary"
                      title={t('settings.llmKeys.deleteDialog.title')}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <ProtectedRoute>
      <>
      {/* EditorHeader */}
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold">{t('settings.title')}</h1>
          <p className="text-xs text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 overflow-y-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Profile + Subscription */}
          <div className="space-y-8">
            {renderProfileSection()}
            {renderSubscriptionSection()}
          </div>
          {/* Right column: Tags + LLM Keys */}
          <div className="space-y-8">
            {renderTagsSection()}
            {renderLLMKeysSection()}
          </div>
        </div>
        {renderDangerZone()}
      </div>

      {/* Tag Modal */}
      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? t('settings.tags.modal.titleEdit') : t('settings.tags.modal.titleCreate')}</DialogTitle>
            <DialogDescription>
              {editingTag ? t('settings.tags.modal.descriptionEdit') : t('settings.tags.modal.descriptionCreate')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tag-name">{t('settings.tags.modal.nameLabel')}</Label>
              <Input
                id="tag-name"
                value={tagForm.name}
                onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                placeholder={t('settings.tags.modal.namePlaceholder')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tag-color">{t('settings.tags.modal.colorLabel')}</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {translatedColorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setTagForm({ ...tagForm, color: color.value })}
                    className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                      tagForm.color === color.value
                        ? "border-border bg-secondary/50"
                        : "border-border hover:border-border"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color.value }} />
                    <span className="text-sm truncate">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>{t('settings.tags.modal.previewLabel')}</Label>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: tagForm.color }}
                  />
                  <Badge variant="outline" className="border-border">
                    {tagForm.name || t('settings.tags.modal.previewPlaceholder')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagModal(false)}>
              {t('settings.tags.modal.cancel')}
            </Button>
            <Button onClick={handleSaveTag} disabled={!tagForm.name}>
              {editingTag ? t('settings.tags.modal.saveEdit') : t('settings.tags.modal.saveCreate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LLM API Key Modal */}
      <Dialog open={showLLMModal} onOpenChange={setShowLLMModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLLM ? t('settings.llmKeys.modal.titleEdit') : t('settings.llmKeys.modal.titleCreate')}</DialogTitle>
            <DialogDescription>
              {editingLLM ? t('settings.llmKeys.modal.descriptionEdit') : t('settings.llmKeys.modal.descriptionCreate')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="llm-name">{t('settings.llmKeys.modal.fields.name')}</Label>
              <Input
                id="llm-name"
                value={llmForm.name}
                onChange={(e) => setLlmForm({ ...llmForm, name: e.target.value })}
                placeholder={t('settings.llmKeys.modal.fields.namePlaceholder')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="llm-provider">{t('settings.llmKeys.modal.fields.provider')}</Label>
              <Select 
                value={llmForm.provider_id} 
                onValueChange={(value) => setLlmForm({ ...llmForm, provider_id: value })}
                disabled={!!editingLLM} // Disable provider selection when editing
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('settings.llmKeys.modal.fields.providerPlaceholder')} />
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
              <Label htmlFor="llm-key">{t('settings.llmKeys.modal.fields.apiKey')}</Label>
              <Input
                id="llm-key"
                type="password"
                value={llmForm.api_key}
                onChange={(e) => setLlmForm({ ...llmForm, api_key: e.target.value })}
                placeholder={editingLLM ? t('settings.llmKeys.modal.fields.apiKeyEditPlaceholder') : t('settings.llmKeys.modal.fields.apiKeyPlaceholder')}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLLMModal(false)}>
              {t('settings.llmKeys.modal.cancel')}
            </Button>
            <Button
              onClick={handleSaveLLM}
              disabled={!llmForm.name || !llmForm.provider_id || (!editingLLM && !llmForm.api_key)}
            >
              {editingLLM ? t('settings.llmKeys.modal.saveEdit') : t('settings.llmKeys.modal.saveCreate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('settings.account.deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('settings.account.deleteDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">⚠️ {t('settings.account.deleteDialog.warningTitle')}</p>
              <p className="text-sm text-red-700 mt-1">
                {t('settings.account.deleteDialog.warningDescription')}
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                <li>{t('settings.account.deleteDialog.items.workspaces')}</li>
                <li>{t('settings.account.deleteDialog.items.promptVersions')}</li>
                <li>{t('settings.account.deleteDialog.items.tags')}</li>
                <li>{t('settings.account.deleteDialog.items.apiKeys')}</li>
                <li>{t('settings.account.deleteDialog.items.history')}</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="delete-confirmation">{t('settings.account.deleteDialog.confirmationLabel')}</Label>
              <Input
                id="delete-confirmation"
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={t('settings.account.deleteDialog.confirmationPlaceholder')}
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
              {t('settings.account.deleteDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation.toLowerCase() !== "delete" || deleteAccountLoading}
            >
              {deleteAccountLoading ? t('settings.account.deleteDialog.confirmLoading') : t('settings.account.deleteDialog.confirm')}
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
        title={t('settings.tags.deleteDialog.title')}
        description={t('settings.tags.deleteDialog.description')}
      />

      {/* Delete LLM API Key Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteLLMDialog}
        onOpenChange={(open) => {
          setShowDeleteLLMDialog(open)
          if (!open) setDeletingLLMId(null)
        }}
        onConfirm={handleDeleteLLM}
        title={t('settings.llmKeys.deleteDialog.title')}
        description={t('settings.llmKeys.deleteDialog.description')}
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
