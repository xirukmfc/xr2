"use client"
import type React from "react"
import {useState, useMemo, useEffect, useRef} from "react"
import {
    Edit,
    Trash2,
    Eye,
    Plus,
    Minus,
    Code,
    Settings,
    Clock,
    BarChart3,
    Users,
    CheckCircle,
    AlertTriangle,
    Share,
} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import type {PromptData} from "@/app/editor/[id]/page"
import {EditVariableModal} from "@/components/edit-variable-modal"
import type {EditVariablePayload} from "@/components/edit-variable-modal"
import {TagInput} from "@/components/tag-input"
import {CreateVersionModal} from "@/components/create-version-modal"
import {ShareModal} from "@/components/share-modal"
import type {Version, Variable} from "@/app/editor/[id]/page"
import {apiClient} from "@/lib/api"

interface PromptPerformanceStats {
    prompt_id: string;
    period_hours: number;
    total_requests: number;
    requests_by_source: Record<string, {total: number, successful: number}>;
    success_rate_200_percent: number;
    avg_response_time_ms: number;
    status_200_count: number;
}
interface LeftPanelProps {
    promptData: PromptData
    updatePromptDataAction: (updates: Partial<PromptData>) => void
    setIsAddVariableModalOpenAction: (open: boolean) => void
    removeVariable: (name: string) => void
    defineVariable: (name: string) => void
    onViewVersion: (versionId: string, id: string, systemPrompt: string, userPrompt: string, assistantPrompt: string | undefined, variables: Variable[]) => void
    currentViewingVersion: string | null
    publishedVersion?: string
    onCreateVersion: (option: "current" | "history" | "scratch", versionId?: string) => void
    onDeleteVersion: (versionId: string) => Promise<void>
    versions: Version[]
    promptId?: string  // NEW: Add prompt ID for stats
}

type MyTag = { id: string; name: string; color: string }

function SourceBreakdown({
                             total,
                             sources,
                         }: {
    total: number
    sources: { name: string; count: number }[]
}) {
    const data = [...sources].sort((a, b) => b.count - a.count)
    return (
        <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">By Source</div>
            <div className="space-y-2">
                {data.map(({name, count}, index) => {
                    const pct = Math.round((count / Math.max(total, 1)) * 100)
                    return (
                        <div key={`${name}-${index}`}>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span className="truncate">{name}</span>
                                <span className="tabular-nums">
                                    {count} ({pct}%)
                                    </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-900"
                                     style={{width: `${Math.min(100, Math.max(0, pct))}%`}}/>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function LeftPanel({
                              promptData,
                              updatePromptDataAction,
                              setIsAddVariableModalOpenAction,
                              removeVariable,
                              defineVariable,
                              onViewVersion,
                              currentViewingVersion,
                              onCreateVersion,
                              onDeleteVersion,
                              publishedVersion,
                              versions,
                              promptId,
                          }: LeftPanelProps) {
    const [newTag, setNewTag] = useState("")
    const [editingVar, setEditingVar] = useState<{ name: string } | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [showPerformanceStats, setShowPerformanceStats] = useState(false)
    const [showVariables, setShowVariables] = useState(false)
    const [showVersions, setShowVersions] = useState(false)
    const [isCreateVersionModalOpen, setIsCreateVersionModalOpen] = useState(false)
    const [myTags, setMyTags] = useState<MyTag[]>([])
    const [performanceStats, setPerformanceStats] = useState<PromptPerformanceStats | null>(null)
    const [statsLoading, setStatsLoading] = useState(false)
    const [shareModalOpen, setShareModalOpen] = useState(false)
    const [shareVersionId, setShareVersionId] = useState<string | null>(null)
    const [shareVersionName, setShareVersionName] = useState<string>('')

    const didFetch = useRef(false)

    // Load user tags
    useEffect(() => {
        if (didFetch.current) return
        didFetch.current = true

        ;(async () => {
            try {
                console.log('[LeftPanel] Starting to load user tags...')
                const data = await apiClient.getUserTags()
                console.log('[LeftPanel] Received tags from API:', data, 'Type:', typeof data, 'Array?', Array.isArray(data))

                console.log('[LeftPanel] Processing tags data...')
                // More reliable data processing
                let tagsArray: MyTag[] = []

                if (Array.isArray(data)) {
                    console.log('[LeftPanel] Data is array, processing...')
                    // Ensure each tag has required fields
                    tagsArray = data.map((tag: any) => {
                        const processedTag = {
                            id: tag.id || '',
                            name: tag.name || '',
                            color: tag.color || '#e5e7eb'
                        }
                        console.log('[LeftPanel] Processing tag:', tag, '->', processedTag)
                        return processedTag
                    })
                } else if (data && typeof data === 'object' && Array.isArray((data as any).tags)) {
                    console.log('[LeftPanel] Data has tags property, processing...')
                    tagsArray = (data as any).tags.map((tag: any) => ({
                        id: tag.id || '',
                        name: tag.name || '',
                        color: tag.color || '#e5e7eb'
                    }))
                } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
                    console.log('[LeftPanel] Data has data property, processing...')
                    tagsArray = (data as any).data.map((tag: any) => ({
                        id: tag.id || '',
                        name: tag.name || '',
                        color: tag.color || '#e5e7eb'
                    }))
                } else {
                    console.log('[LeftPanel] Data format not recognized')
                }

                console.log('[LeftPanel] Processed tags array:', tagsArray)
                console.log('[LeftPanel] About to set myTags state with:', tagsArray?.length, 'tags')
                setMyTags(tagsArray)
                console.log('[LeftPanel] setMyTags called')

            } catch (e) {
                console.error("load user tags failed", e)
                // Set empty array in case of error
                setMyTags([])
            }
        })()
    }, [])

    // Debug log to check tags state
    useEffect(() => {
        console.log('[LeftPanel] myTags state updated:', myTags?.length, myTags)

        // Additional debugging - check after a small delay
        setTimeout(() => {
            console.log('[LeftPanel] myTags after timeout:', myTags?.length, myTags)
        }, 100)
    }, [myTags])

    // Load performance stats when promptId changes
    useEffect(() => {
        const loadPerformanceStats = async () => {
            if (!promptId || !showPerformanceStats) return;

            try {
                setStatsLoading(true);
                console.log('[LeftPanel] Loading performance stats for prompt:', promptId);
                
                const stats: PromptPerformanceStats = await apiClient.request(`/prompts/${promptId}/performance-stats`);
                console.log('[LeftPanel] Performance stats loaded:', stats);
                setPerformanceStats(stats);

            } catch (error) {
                console.error('[LeftPanel] Error loading performance stats:', error);
                // Set empty stats to avoid showing loading forever
                setPerformanceStats({
                    prompt_id: promptId,
                    period_hours: 24,
                    total_requests: 0,
                    requests_by_source: {},
                    success_rate_200_percent: 0,
                    avg_response_time_ms: 0,
                    status_200_count: 0
                });
            } finally {
                setStatsLoading(false);
            }
        };

        loadPerformanceStats();
    }, [promptId, showPerformanceStats]);

    const tagColorMap = useMemo(() => {
        const map: Record<string, string> = {}
        myTags.forEach(t => {
            if (t?.name) map[t.name] = t.color || '#e5e7eb'
        })
        return map
    }, [myTags])

    const tagStyle = (name: string) => {
        const bg = tagColorMap[name] || '#e5e7eb' // default gray if not found
        const text = '#111'
        return { backgroundColor: bg, color: text, borderColor: bg }
    }

    const safePromptData = promptData || {
        name: "",
        slug: "",
        description: "",
        tags: [],
        status: "draft" as const,
        systemPrompt: "",
        userPrompt: "",
        variables: []
    }

    const addTag = (tagName: string) => {
        if (tagName.trim()) {
            // Look for existing tag object by name
            const existingTag = myTags.find(tag => tag.name === tagName.trim())
            const isAlreadySelected = safePromptData.tags.some(tag => tag.name === tagName.trim())
            
            if (existingTag && !isAlreadySelected) {
                updatePromptDataAction({tags: [...safePromptData.tags, existingTag]})
            }
        }
    }

    const createTag = async (name: string, color: string) => {
        try {
            console.log('[LeftPanel] Creating new tag:', name, color)

            // Create tag using API
            const newTag = await apiClient.createTag({ name, color })

            console.log('[LeftPanel] Created tag:', newTag)

            // Add new tag to local state
            setMyTags(prev => [...prev, newTag])

            // Automatically add new tag to prompt
            updatePromptDataAction({tags: [...safePromptData.tags, newTag]})
        } catch (error) {
            console.error('Failed to create tag:', error)
            throw error // Re-throw error for handling in TagInput
        }
    }

    const removeTag = (tagToRemove: string) => {
        updatePromptDataAction({tags: safePromptData.tags.filter((tag) => tag.name !== tagToRemove)})
    }

    const openEdit = (name: string) => setEditingVar({name})

    const saveVariable = (name: string, data: EditVariablePayload) => {
        updatePromptDataAction({
            variables: promptData.variables.map((v) =>
                v.name === name
                    ? {...v, type: data.type, defaultValue: data.defaultValue, isDefined: data.isDefined ?? v.isDefined}
                    : v,
            ),
        })
    }

    const handleViewVersion = (version: Version) => {
        onViewVersion(
            version.version,
            version.id,
            version.systemPrompt,
            version.userPrompt,
            version.assistantPrompt,
            version.variables
        )
    }

    const handleCreateVersion = () => {
        setIsCreateVersionModalOpen(true)
    }

    const handleCreateVersionFromModal = (option: "current" | "history" | "scratch", versionId?: string) => {
        if (onCreateVersion) {
            onCreateVersion(option, versionId)
        }
        setIsCreateVersionModalOpen(false)
    }

    const handleDeleteVersion = async (version: Version) => {
        if (!confirm(`Are you sure you want to delete version ${version.version}?`)) {
            return
        }

        try {
            await onDeleteVersion(version.id)
        } catch (error) {
            console.error('Failed to delete version:', error)
            alert('Failed to delete version. Please try again.')
        }
    }

    const handleShareVersion = (version: Version) => {
        setShareVersionId(version.id)
        setShareVersionName(`v${version.version}`)
        setShareModalOpen(true)
    }

    const getStatusStyle = (status: string, versionNumber: string) => {
        const isPublished = publishedVersion === versionNumber

        if (isPublished || status === "Production") {
            return "bg-green-100 text-green-800"
        }

        switch (status) {
            case "Inactive":
                return "bg-gray-100 text-gray-600"
            case "Draft":
                return "bg-yellow-100 text-yellow-800"
            case "Deprecated":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-600"
        }
    }

    const variables = safePromptData.variables || []
    const undefinedCount = useMemo(() => variables.filter((v) => !v.isDefined).length, [variables])
    const hasUndefined = undefinedCount > 0

    return (
        <div className="w-64 bg-white border-r border-gray-300 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <style jsx>{`
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }

                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {/* Settings Toggle */}
                <div
                    className="flex items-center h-10 transition-colors group text-slate-600 hover:text-slate-900 border-b border-slate-200">
                    <Button
                        variant="ghost"
                        onClick={() => setShowSettings(!showSettings)}
                        className="w-full justify-between text-left px-4 py-3 h-10 hover:bg-slate-50 rounded-none focus-visible:ring-0 text-slate-600 hover:text-slate-900"
                    >
                    <span className="flex items-center gap-2">
                      <Settings className="w-4 h-4 flex-shrink-0"/>
                      <span className="text-sm">Settings</span>
                    </span>
                        {showSettings ? <Minus className="w-4 h-4 flex-shrink-0"/> :
                            <Plus className="w-4 h-4 flex-shrink-0"/>}
                    </Button>
                </div>

                {/* Settings Content */}
                {showSettings && (
                    <div className="px-4 py-3 space-y-3 bg-white">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Prompt Name</label>
                            <Input
                                value={safePromptData.name || ""}
                                onChange={(e) => updatePromptDataAction({name: e.target.value})}
                                className="text-sm h-8"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
                            <Input
                                value={safePromptData.slug || ""}
                                onChange={(e) => updatePromptDataAction({slug: e.target.value})}
                                className="h-8 text-sm font-mono tracking-tight bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={safePromptData.description || ""}
                                onChange={(e) => updatePromptDataAction({description: e.target.value})}
                                className="w-full text-sm p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={5}
                                maxLength={250}
                                placeholder="Enter prompt description..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {safePromptData.tags.map((tag, index) => (
                                    <span
                                      key={`tag-${index}-${tag.id}`}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs border"
                                      style={tagStyle(tag.name)}
                                    >
                                      {tag.name}
                                      <button onClick={() => removeTag(tag.name)} className="ml-1 hover:text-gray-600">×</button>
                                    </span>
                                ))}
                            </div>
                            <TagInput
                              value={newTag}
                              onChange={setNewTag}
                              onAddTag={addTag}
                              onCreateTag={createTag}
                              existingTags={safePromptData.tags.map(tag => tag.name)}
                              myTags={myTags}
                              placeholder="Add tag..."
                            />
                        </div>
                    </div>
                )}

                {/* Rest of the code remains unchanged... */}
                {/* Performance Stats Toggle */}
                <div
                    className="flex items-center h-10 transition-colors group text-slate-600 hover:text-slate-900 border-b border-slate-200">
                    <Button
                        variant="ghost"
                        onClick={() => setShowPerformanceStats(!showPerformanceStats)}
                        className="w-full justify-between text-left px-4 py-3 h-10 hover:bg-slate-50 rounded-none focus-visible:ring-0 text-slate-600 hover:text-slate-900"
                    >
                    <span className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 flex-shrink-0"/>
                      <span className="text-sm">Performance Stats</span>
                    </span>
                        {showPerformanceStats ? <Minus className="w-4 h-4 flex-shrink-0"/> :
                            <Plus className="w-4 h-4 flex-shrink-0"/>}
                    </Button>
                </div>

                {showPerformanceStats && (
                    <div className="px-4 py-3 space-y-3 bg-white">
                        {statsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                            </div>
                        ) : performanceStats ? (
                            <>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <Users className="w-4 h-4 text-gray-600"/>
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">24h</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 mb-1">
                                        {performanceStats.total_requests.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-600">Total Requests</div>
                                    
                                    {performanceStats.total_requests > 0 && (
                                        <SourceBreakdown 
                                            total={performanceStats.total_requests} 
                                            sources={Object.entries(performanceStats.requests_by_source).map(([name, data]) => ({
                                                name,
                                                count: data.total
                                            }))} 
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <CheckCircle className="w-4 h-4 text-gray-600 mb-2"/>
                                        <div className="text-lg font-bold text-gray-900">
                                            {performanceStats.success_rate_200_percent.toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-600">Success Rate</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <Clock className="w-4 h-4 text-gray-600 mb-2"/>
                                        <div className="text-lg font-bold text-gray-900">
                                            {performanceStats.avg_response_time_ms > 0 
                                                ? `${(performanceStats.avg_response_time_ms / 1000).toFixed(1)}s`
                                                : '0s'
                                            }
                                        </div>
                                        <div className="text-xs text-gray-600">Avg Response</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                                <div className="text-sm">No data available</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Variables Toggle */}
                <div className="flex items-center h-10 transition-colors group text-slate-600 hover:text-slate-900 border-b border-slate-200">
                    <Button
                        variant="ghost"
                        onClick={() => setShowVariables(!showVariables)}
                        className="w-full justify-between text-left px-4 py-3 h-10 hover:bg-slate-50 rounded-none focus-visible:ring-0 text-slate-600 hover:text-slate-900"
                    >
                    <span className="flex items-center gap-2">
                      <Code className="w-4 h-4 flex-shrink-0"/>
                      <span className="text-sm">Variables ({variables.length})</span>
                        {hasUndefined && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-red-50 text-red-700 text-[10px] font-medium">
                          <AlertTriangle className="w-3 h-3"/>
                                {undefinedCount}
                        </span>
                        )}
                    </span>
                        {showVariables ? <Minus className="w-4 h-4 flex-shrink-0"/> :
                            <Plus className="w-4 h-4 flex-shrink-0"/>}
                    </Button>
                </div>

                {showVariables && (
                    <div className="px-4 py-3 space-y-2 bg-white">
                        <Button
                            onClick={() => setIsAddVariableModalOpenAction(true)}
                            variant="outline"
                            className="w-full text-xs h-8"
                        >
                            <Plus className="w-3 h-3 mr-1"/>
                            Add Variable
                        </Button>

                        {variables.length === 0 ? (
                            <div className="text-xs text-gray-500 text-center py-2">No variables defined</div>
                        ) : (
                            <div className="space-y-2">
                                {variables.map((variable, index) => (
                                    <div
                                        key={`${variable.name}-${index}`}
                                        className={`flex items-center justify-between p-2 border rounded text-xs ${
                                            variable.isDefined ? "bg-white border-gray-200" : "bg-yellow-50 border-yellow-200"
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {variable.name}
                                                {!variable.isDefined && <span className="text-yellow-600 ml-1">⚠</span>}
                                            </div>
                                            <div className="text-gray-500">{variable.type}</div>
                                            {variable.defaultValue && (
                                                <div className="text-gray-400 truncate">{variable.defaultValue}</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                            {!variable.isDefined && (
                                                <Button
                                                    onClick={() => defineVariable(variable.name)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    title="Define variable"
                                                >
                                                    <CheckCircle className="w-3 h-3"/>
                                                </Button>
                                            )}
                                            <Button
                                                onClick={() => openEdit(variable.name)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                                                title="Edit variable"
                                            >
                                                <Edit className="w-3 h-3"/>
                                            </Button>
                                            <Button
                                                onClick={() => removeVariable(variable.name)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                title="Remove variable"
                                            >
                                                <Trash2 className="w-3 h-3"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Versions Toggle */}
                <div className="flex items-center h-10 transition-colors group text-slate-600 hover:text-slate-900 border-b border-slate-200">
                    <Button
                        variant="ghost"
                        onClick={() => setShowVersions(!showVersions)}
                        className="w-full justify-between text-left px-4 py-3 h-10 hover:bg-slate-50 rounded-none focus-visible:ring-0 text-slate-600 hover:text-slate-900"
                    >
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0"/>
                      <span className="text-sm">Versions ({versions.length})</span>
                    </span>
                        {showVersions ? <Minus className="w-4 h-4 flex-shrink-0"/> :
                            <Plus className="w-4 h-4 flex-shrink-0"/>}
                    </Button>
                </div>

                {showVersions && (
                    <div className="px-4 py-3 space-y-2 bg-white">
                        <Button
                            onClick={handleCreateVersion}
                            variant="outline"
                            className="w-full text-xs h-8"
                        >
                            <Plus className="w-3 h-3 mr-1"/>
                            New Version
                        </Button>

                        {versions.length === 0 ? (
                            <div className="text-xs text-gray-500 text-center py-2">No versions</div>
                        ) : (
                            <div className="space-y-2">
                                {versions.map((version) => (
                                    <div
                                        key={version.id}
                                        className={`p-2 border rounded text-xs cursor-pointer transition-colors ${
                                            currentViewingVersion === version.version
                                                ? "bg-blue-50 border-blue-200"
                                                : "bg-white border-gray-200 hover:bg-gray-50"
                                        }`}
                                        onClick={() => handleViewVersion(version)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-medium">v{version.version}</div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyle(version.status, version.version)}`}>
                                                {version.status}
                                              </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">{version.timestamp} · {version.updater || 'Unknown'}</span>
                                            <div className="flex gap-1">
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleViewVersion(version)
                                                    }}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-blue-50"
                                                    title="View version"
                                                >
                                                    <Eye className="w-3 h-3"/>
                                                </Button>
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleShareVersion(version)
                                                    }}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    title="Share version"
                                                >
                                                    <Share className="w-3 h-3"/>
                                                </Button>
                                                {/* Show delete button only for non-deployed versions */}
                                                {version.status !== "Production" && (
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteVersion(version)
                                                        }}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        title="Delete version"
                                                    >
                                                        <Trash2 className="w-3 h-3"/>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {editingVar && (
                <EditVariableModal
                    isOpen={!!editingVar}
                    onClose={() => setEditingVar(null)}
                    variable={variables.find((v) => v.name === editingVar?.name) || null}
                    onSave={(name, data) => {
                        saveVariable(name, data)
                        setEditingVar(null)
                    }}
                />
            )}
            <CreateVersionModal
                isOpen={isCreateVersionModalOpen}
                onClose={() => setIsCreateVersionModalOpen(false)}
                onCreateVersion={handleCreateVersionFromModal}
                availableVersions={versions.map(v => ({ id: v.id, name: `v${v.version}` }))}
            />
            {shareVersionId && (
                <ShareModal
                    isOpen={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    promptVersionId={shareVersionId}
                    promptName={promptData.name}
                    versionNumber={shareVersionName}
                />
            )}
        </div>
    )
}