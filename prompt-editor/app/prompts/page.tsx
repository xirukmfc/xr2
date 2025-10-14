"use client"

import React, {useState, useEffect, useMemo, useCallback} from "react"
import {ProtectedRoute} from "@/components/protected-route"
import {Copy, Eye, RotateCcw, TrendingUp, TrendingDown} from "lucide-react"
import {Button} from "@/components/ui/button"
import {NewPromptModal} from "@/components/new-prompt-modal"
import {DataFilters} from "@/components/ui/data-filters"
import {DataTable} from "@/components/ui/data-table"
import type {Column} from "@/components/ui/data-table"
import {Pagination} from "@/components/ui/pagination"
import {useRouter} from "next/navigation"
import {ApiPrompt, getPrompts, deletePrompt, deployPromptVersion, undeployPromptVersion, getPromptVersions, invalidatePromptsCache} from "@/lib/api"
import {useCountsContext} from "@/components/counts-context"
import {useWorkspaceContext} from "@/components/workspace-context"
import {useHotkeys} from "@/lib/use-hotkeys"
import {BulkActionsToolbar} from "@/components/ui/bulk-actions-toolbar"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import {useNotification, NotificationProvider} from "@/components/notification-provider"

// UI model expected by design components
export interface UIPrompt {
    id: string
    name: string
    slug: string
    description: string
    status: "active" | "draft" | "archived"
    tags: { name: string; color?: string }[]
    lastUpdated: string
    updatedBy: string
    usage24h: number
    owner: {
        name: string
        avatar?: string
    }
}

// Adapter function to convert data from API to UI model
const transformApiPromptToUIPrompt = (apiPrompt: ApiPrompt): UIPrompt => {
    const currentVersion = apiPrompt.current_version

    const getDisplayName = (fullName?: string, username?: string) => {
        if (fullName && fullName.trim()) return fullName.trim()
        if (username) return username
        return "Unknown User"
    }

    const creatorDisplayName = getDisplayName(apiPrompt.creator_full_name, apiPrompt.creator_name)
    const updaterDisplayName = getDisplayName(apiPrompt.updater_full_name, apiPrompt.updater_name)
    console.log("apiPrompt:", apiPrompt)
    const displayName = apiPrompt.updater_name && apiPrompt.updater_name.trim()
        ? updaterDisplayName
        : creatorDisplayName

    const formatTimeAgo = (dateString: string | null | undefined) => {
        if (!dateString) return "Unknown"
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return "Unknown"
            
            const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
            let interval = seconds / 31536000
            if (interval > 1) return Math.floor(interval) + " years ago"
            interval = seconds / 2592000
            if (interval > 1) return Math.floor(interval) + " months ago"
            interval = seconds / 86400
            if (interval > 1) return Math.floor(interval) + " days ago"
            interval = seconds / 3600
            if (interval > 1) return Math.floor(interval) + " hours ago"
            interval = seconds / 60
            if (interval > 1) return Math.floor(interval) + " minutes ago"
            return "just now"
        } catch {
            return "Unknown"
        }
    }

    return {
        id: apiPrompt.id,
        name: apiPrompt.name,
        slug: apiPrompt.slug,
        description: apiPrompt.description || "No description",
        status: apiPrompt.status,
        tags: apiPrompt.tags?.map(t => ({ name: t.name, color: t.color })) ?? [],
        lastUpdated: formatTimeAgo(apiPrompt.updated_at),
        updatedBy: displayName,
        usage24h: apiPrompt.usage_24h || 0,
        owner: {
            name: creatorDisplayName,
            avatar: "/placeholder.svg?height=32&width=32",
        },
    }
}

function PromptsPageContent() {
    const [isNewPromptModalOpen, setIsNewPromptModalOpen] = useState(false)
    const [prompts, setPrompts] = useState<ApiPrompt[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedPrompts, setSelectedPrompts] = useState<string[]>([])
    const [bulkActionsLoading, setBulkActionsLoading] = useState(false)
    const countsContext = useCountsContext()
    const workspaceContext = useWorkspaceContext()
    const { showNotification } = useNotification()

    // Setup hotkeys (removed Cmd+N functionality)

    const invalidateAndRefetch = countsContext?.invalidateAndRefetch || (() => {})
    const currentWorkspaceId = workspaceContext?.currentWorkspaceId
    const workspaceLoading = workspaceContext?.isLoading || false

    const [searchQuery, setSearchQuery] = useState("")
    const [activeFilter, setActiveFilter] = useState("all")
    const [sortBy, setSortBy] = useState("lastUpdated")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const router = useRouter()

    // Load data
    const loadData = useCallback(async () => {
        console.log('[PromptsPage] loadData called:', { currentWorkspaceId, workspaceLoading });
        if (!currentWorkspaceId || workspaceLoading) {
            console.log('[PromptsPage] Skipping load - no workspace or still loading');
            return;
        }
        
        console.log('[PromptsPage] Starting to load prompts...');
        setLoading(true)
        try {
            const promptsData = await getPrompts({workspace_id: currentWorkspaceId})
            console.log('[PromptsPage] Loaded prompts:', promptsData.length, 'items');
            setPrompts(promptsData)
            setError(null)
            // Invalidate cache to update counts after data changes
            await invalidateAndRefetch()
        } catch (err) {
            console.error('[PromptsPage] Error loading prompts:', err);
            setError(err instanceof Error ? err.message : "Failed to load prompts.")
        } finally {
            setLoading(false)
        }
    }, [currentWorkspaceId, workspaceLoading, invalidateAndRefetch])

    const handleBulkDelete = async () => {
        if (selectedPrompts.length === 0) return

        const confirmMessage = `Are you sure you want to delete ${selectedPrompts.length} prompt${selectedPrompts.length > 1 ? 's' : ''}? This action cannot be undone.`
        if (!window.confirm(confirmMessage)) return

        setBulkActionsLoading(true)
        let successCount = 0
        let errorCount = 0

        try {
            for (const promptId of selectedPrompts) {
                try {
                    await deletePrompt(promptId)
                    successCount++
                } catch (error) {
                    console.error(`Failed to delete prompt ${promptId}:`, error)
                    const errorMessage = error instanceof Error ? error.message : String(error)
                    console.error(`Error details:`, errorMessage)
                    errorCount++
                }
            }

            if (successCount > 0) {
                showNotification(`Successfully deleted ${successCount} prompt${successCount > 1 ? 's' : ''}`, "success")
            }

            if (errorCount > 0) {
                showNotification(`Failed to delete ${errorCount} prompt${errorCount > 1 ? 's' : ''}`, "error")
            }

            // Force cache invalidation and reload data
            try {
                await invalidatePromptsCache()
                await loadData()
            } catch (error) {
                console.error('Failed to refresh data after delete:', error)
                const errorMessage = error instanceof Error ? error.message : String(error)
                showNotification(`Warning: Could not refresh data: ${errorMessage}`, "error")
            }

            setSelectedPrompts([])
        } catch (error) {
            console.error('Unexpected error in handleBulkDelete:', error)
            const errorMessage = error instanceof Error ? error.message : String(error)
            showNotification(`Unexpected error: ${errorMessage}`, "error")
        } finally {
            setBulkActionsLoading(false)
        }
    }

    const handleBulkDeploy = async () => {
        if (selectedPrompts.length === 0) return

        setBulkActionsLoading(true)
        let successCount = 0
        let errorCount = 0

        try {
            for (const promptId of selectedPrompts) {
                try {
                    // Get all versions for this prompt
                    const versions = await getPromptVersions(promptId)
                    console.log(`Deploy: Found ${versions.length} versions for prompt ${promptId}`, versions)

                    if (versions.length === 0) {
                        console.warn(`No versions found for prompt ${promptId}`)
                        errorCount++
                        continue
                    }

                    // Find the latest version (highest version_number)
                    const latestVersion = versions.reduce((latest, current) =>
                        current.version_number > latest.version_number ? current : latest
                    )

                    console.log(`Deploy: Latest version for prompt ${promptId}:`, latestVersion)

                    if (latestVersion) {
                        const result = await deployPromptVersion(promptId, latestVersion.id)
                        console.log(`Deploy result for ${promptId}:`, result)
                        successCount++
                    } else {
                        errorCount++
                    }
                } catch (error) {
                    console.error(`Failed to deploy prompt ${promptId}:`, error)
                    errorCount++
                }
            }

            if (successCount > 0) {
                showNotification(`Successfully deployed ${successCount} prompt${successCount > 1 ? 's' : ''}`, "success")
            }

            // Force cache invalidation and reload data
            await invalidatePromptsCache()
            setTimeout(async () => {
                await invalidatePromptsCache()
                await loadData()
            }, 2000)

            if (errorCount > 0) {
                showNotification(`Failed to deploy ${errorCount} prompt${errorCount > 1 ? 's' : ''}`, "error")
            }

            setSelectedPrompts([])
        } finally {
            setBulkActionsLoading(false)
        }
    }

    const handleBulkUndeploy = async () => {
        if (selectedPrompts.length === 0) return

        setBulkActionsLoading(true)
        let successCount = 0
        let errorCount = 0

        try {
            for (const promptId of selectedPrompts) {
                try {
                    // Get all versions for this prompt
                    const versions = await getPromptVersions(promptId)
                    console.log(`Undeploy: Found ${versions.length} versions for prompt ${promptId}`, versions)

                    if (versions.length === 0) {
                        console.warn(`No versions found for prompt ${promptId}`)
                        errorCount++
                        continue
                    }

                    // Find the deployed version (status === 'production')
                    const deployedVersion = versions.find(v => v.status === 'production')
                    console.log(`Undeploy: Deployed version for prompt ${promptId}:`, deployedVersion)

                    if (deployedVersion) {
                        const result = await undeployPromptVersion(promptId, deployedVersion.id)
                        console.log(`Undeploy result for ${promptId}:`, result)
                        successCount++
                    } else {
                        // No deployed version found - skip silently or count as error?
                        console.warn(`No deployed version found for prompt ${promptId}`)
                        errorCount++
                    }
                } catch (error) {
                    console.error(`Failed to undeploy prompt ${promptId}:`, error)
                    errorCount++
                }
            }

            if (successCount > 0) {
                showNotification(`Successfully undeployed ${successCount} prompt${successCount > 1 ? 's' : ''}`, "success")
            }

            // Force cache invalidation and reload data
            await invalidatePromptsCache()
            setTimeout(async () => {
                await invalidatePromptsCache()
                await loadData()
            }, 2000)

            if (errorCount > 0) {
                showNotification(`Failed to undeploy ${errorCount} prompt${errorCount > 1 ? 's' : ''}`, "error")
            }

            setSelectedPrompts([])
        } finally {
            setBulkActionsLoading(false)
        }
    }

    useEffect(() => {
        console.log('[PromptsPage] Effect triggered:', { currentWorkspaceId, workspaceLoading });
        loadData()
    }, [loadData])

    // Actions with prompts
    const handleEdit = (id: string) => {
        router.push(`/editor/${id}`)
    }


    const getStatusBadge = (status: string) => {
        const styles = {
            active: "bg-green-50 text-green-700 border-green-200",
            draft: "bg-orange-50 text-orange-700 border-orange-200",
            archived: "bg-slate-50 text-slate-600 border-slate-200",
        } as const
        return styles[status as keyof typeof styles] || styles.draft
    }

    const getStatusDot = (status: string) => {
        const styles = {
            active: "bg-green-500",
            draft: "bg-orange-500",
            archived: "bg-slate-400",
        } as const
        return styles[status as keyof typeof styles] || styles.draft
    }

    // Helpers to style tag pills by hex color from API
    const hexToRgb = (hex?: string) => {
      if (!hex) return null;
      let s = hex.replace('#', '').trim();
      if (s.length === 3) s = s.split('').map(c => c + c).join('');
      if (s.length !== 6) return null;
      const num = parseInt(s, 16);
      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    };
    const getTagStyle = (hex?: string) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return {};
      return {
        backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.10)`,
        color: hex,
        borderColor: hex,
      } as React.CSSProperties;
    };

    const filterOptions = [
        {key: "all", label: "All"},
        {key: "active", label: "Active"},
        {key: "draft", label: "Draft"},
        {key: "archived", label: "Archived"},
    ]

    const sortOptions = [
        {value: "lastUpdated", label: "Sort by: Last Updated"},
        {value: "name", label: "Sort by: Name"},
        {value: "usage", label: "Sort by: Usage"},
    ]
    console.log("Prompts:", prompts)
    // Columns for table
    const columns: Column<UIPrompt>[] = [
        {
            key: "name",
            header: "Name",
            width: "col-span-4",
            render: (prompt) => (
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(prompt.status)}`}></div>
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-800 text-sm truncate">
                            {prompt.name}
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                            {prompt.tags.slice(0, 3).map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-1 py-0.5 rounded text-xs border flex-shrink-0"
                                    style={getTagStyle(tag.color)}
                                >
                                    {tag.name}
                                </span>
                            ))}
                            {prompt.tags.length > 3 && (
                                <span className="text-xs text-slate-400 flex-shrink-0">+{prompt.tags.length - 3}</span>
                            )}
                        </div>
                        {prompt.description && (
                            <div className="text-xs text-slate-500 truncate mt-0.5">
                                {prompt.description}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "status",
            header: "Status",
            width: "col-span-1",
            render: (prompt) => (
                <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadge(prompt.status)}`}>
          {prompt.status.charAt(0).toUpperCase() + prompt.status.slice(1)}
        </span>
            ),
        },
        {
            key: "lastUpdated",
            header: "Last Updated",
            width: "col-span-3",
            render: (prompt) => (
                <div>
                    <div className={`text-sm ${prompt.status === "archived" ? "text-slate-500" : "text-slate-800"} truncate`}>
                        {prompt.lastUpdated}
                    </div>
                    <div className={`text-xs ${prompt.status === "archived" ? "text-slate-400" : "text-slate-500"} truncate`}>
                        by {prompt.updatedBy}
                    </div>
                </div>
            ),
        },
        {
            key: "usage",
            header: "Usage (24H)",
            width: "col-span-1",
            render: (prompt) => (
                <div className="text-sm font-medium text-slate-800">
                    {prompt.usage24h.toLocaleString()}
                </div>
            ),
        },
        {
            key: "owner",
            header: "Owner",
            width: "col-span-2",
            render: (prompt) => (
                <div className="flex items-center space-x-2">
                    <img src={prompt.owner.avatar} alt={prompt.owner.name} className="w-5 h-5 rounded-full flex-shrink-0"/>
                    <span className="text-sm text-slate-700 truncate">{prompt.owner.name}</span>
                </div>
            ),
        },
    ]

    // Data filtering and sorting
    const processedPrompts = useMemo(() => {
        let uiPrompts = prompts.map(transformApiPromptToUIPrompt)

        uiPrompts = uiPrompts.filter((prompt) => {
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch = prompt.name.toLowerCase().includes(searchLower) ||
                prompt.description.toLowerCase().includes(searchLower) ||
                prompt.tags.some(tag => tag.name.toLowerCase().includes(searchLower))
            const matchesFilter = activeFilter === "all" || prompt.status === activeFilter
            return matchesSearch && matchesFilter
        })

        uiPrompts.sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name)
                case "usage":
                    return b.usage24h - a.usage24h
                case "lastUpdated":
                default: {
                    const timeA = new Date(prompts.find(p => p.id === a.id)?.updated_at || 0).getTime()
                    const timeB = new Date(prompts.find(p => p.id === b.id)?.updated_at || 0).getTime()
                    return timeB - timeA
                }
            }
        })

        return uiPrompts
    }, [prompts, searchQuery, activeFilter, sortBy])

    const totalPages = Math.ceil(processedPrompts.length / itemsPerPage)
    const paginatedPrompts = processedPrompts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    if (loading || workspaceLoading) {
        return (
          <div className="flex flex-col min-h-screen">
            <LoadingState message="Loading your prompts..." />
          </div>
        )
      }
    if (error) {
        return (
          <div className="flex flex-col min-h-screen">
            <ErrorState
              title="Failed to load prompts"
              message={error}
              onRetry={loadData}
            />
          </div>
        )
      }

    const hasNoPrompts = prompts.length === 0 && !loading && !error

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-1">
                <div className="px-4 pt-[12px] pb-[12px] h-[65px] bg-white border-b border-slate-200">
                    <DataFilters
                        searchQuery={searchQuery}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Search prompts..."
                        activeFilter={activeFilter}
                        onFilter={setActiveFilter}
                        filterOptions={filterOptions}
                        sortBy={sortBy}
                        onSort={setSortBy}
                        sortOptions={sortOptions}
                        onNewPromptClick={() => setIsNewPromptModalOpen(true)}
                    />
                </div>
                <div className="flex flex-col flex-1">
                    <DataTable
                        data={paginatedPrompts}
                        columns={columns}
                        selectable={true}
                        selectedItems={selectedPrompts}
                        onSelectionChange={setSelectedPrompts}
                        onRowClick={(prompt) => handleEdit(prompt.id)}
                    />
                    <Pagination
                        totalItems={processedPrompts.length}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        itemName="prompts"
                    />
                </div>
            </div>
            <NewPromptModal
              isOpen={isNewPromptModalOpen}
              onClose={() => setIsNewPromptModalOpen(false)}
              onPromptCreated={() => loadData()}
            />
            <BulkActionsToolbar
                selectedCount={selectedPrompts.length}
                onDelete={handleBulkDelete}
                onDeploy={handleBulkDeploy}
                onUndeploy={handleBulkUndeploy}
                onClearSelection={() => setSelectedPrompts([])}
                isLoading={bulkActionsLoading}
            />
        </div>
    )
}

export default function PromptsPage() {
    return (
        <ProtectedRoute>
            <NotificationProvider>
                <PromptsPageContent/>
            </NotificationProvider>
        </ProtectedRoute>
    )
}