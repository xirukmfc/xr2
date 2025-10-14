"use client"

import { use, useEffect, useRef, useState, useCallback } from "react"
import {useRouter} from "next/navigation"
import {ProtectedRoute} from "@/components/protected-route"
import useLocalStorage from "@/hooks/useLocalStorage"
import {EditorHeader} from "@/components/ui/editor-header"
import {LeftPanel} from "@/components/left-panel"
import {CenterPanel} from "@/components/center-panel"
import {AddVariableModal} from "@/components/add-variable-modal"
import {TestModal} from "@/components/test-modal"
import {NotificationProvider, useNotification} from "@/components/notification-provider"
import {apiClient} from "@/lib/api"
import type {ModelId} from "@/lib/tokens"
import {findVariablesInText, VARIABLE_REGEX} from "@/lib/variable-regex"
import {useHotkeys} from "@/lib/use-hotkeys"

export interface Variable {
    name: string
    type: "string" | "number" | "boolean" | "array"
    defaultValue?: string
    isDefined: boolean
}

export interface PromptData {
    name: string
    slug: string
    description: string
    tags: {id: string; name: string; color: string}[]
    status: "draft" | "active" | "archived"
    systemPrompt: string
    userPrompt: string
    assistantPrompt?: string
    variables: Variable[]
}

export interface Version {
    id: string
    version: string
    status: "Production" | "Draft" | "Inactive"  | "Deprecated"
    timestamp: string
    author: string
    updater: string
    description: string
    requests: string
    successRate?: string
    systemPrompt: string
    userPrompt: string
    assistantPrompt?: string
    variables: Variable[]
    tags?: any[]
}

interface ApiPromptVersion {
    id: string
    version_number: number
    status: string
    system_prompt?: string
    user_prompt?: string
    creator_full_name?: string
    creator_name?: string
    updater?: string
    assistant_prompt?: string
    variables: any[]
    usage_count: number
    created_by: string
    created_at: string
    updated_at: string
}

// Import common variable search function from lib/variable-regex.ts

// FIXED function for synchronizing variables with prompt text
function syncVariablesWithPrompts(
    systemPrompt: string,
    userPrompt: string,
    assistantPrompt: string,
    currentVariables: Variable[]
): Variable[] {
    const allText = `${systemPrompt} ${userPrompt} ${assistantPrompt || ''}`
    const foundVariables = findVariablesInText(allText)

    // Create a set of defined variables
    const definedVariables = currentVariables.filter(v => v.isDefined)
    const undefinedVariables = currentVariables.filter(v => !v.isDefined)

    // Create a new list of variables
    const newVariables = [...definedVariables] // Всегда сохраняем определенные переменные

    // Add only new undefined variables
    foundVariables.forEach(varName => {
        const existsAsDefined = definedVariables.some(v => v.name === varName)
        const existsAsUndefined = undefinedVariables.some(v => v.name === varName)

        if (!existsAsDefined && !existsAsUndefined) {
            newVariables.push({
                name: varName,
                type: "string",
                defaultValue: "",
                isDefined: false
            })
        }
    })

    // Add existing undefined variables only if they are still in use
    undefinedVariables.forEach(variable => {
        if (foundVariables.includes(variable.name)) {
            newVariables.push(variable)
        }
    })

    return newVariables
}

function PromptEditorContent({ params }: { params: Promise<{ id: string }> }) {
    const { id: routeId } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [promptId, setPromptId] = useState<string | undefined>(undefined)
    const { showNotification } = useNotification()

    // Global Monaco error handler
    useEffect(() => {
        if (typeof window === 'undefined') return

        const originalHandler = window.onunhandledrejection

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.log('=== UNHANDLED PROMISE REJECTION CAUGHT ===')
            console.log('Event:', event)
            console.log('Reason type:', typeof event.reason)
            console.log('Reason value:', event.reason)
            console.log('Reason constructor:', event.reason?.constructor?.name)
            
            // Check if this is a Monaco cancelation error
            if (
                event.reason &&
                typeof event.reason === 'object' &&
                event.reason.type === 'cancelation'
            ) {
                // Ignore cancelation errors from Monaco
                console.log('Monaco cancelation error ignored:', event.reason.msg)
                event.preventDefault()
                return
            }

            // ALWAYS prevent showing [object Object] and log details
            console.error('=== PREVENTING [object Object] ERROR ===')
            console.error('Full event.reason:', event.reason)
            
            if (event.reason && typeof event.reason === 'object') {
                console.error('Object keys:', Object.keys(event.reason))
                console.error('Object entries:', Object.entries(event.reason))
                
                try {
                    console.error('JSON stringify:', JSON.stringify(event.reason, null, 2))
                } catch (jsonError) {
                    console.error('Cannot JSON.stringify reason:', jsonError)
                }
                
                // Try to extract useful information
                const possibleMessages = [
                    event.reason.message,
                    event.reason.error,
                    event.reason.statusText,
                    event.reason.details,
                    event.reason.toString?.(),
                ]
                console.error('Possible error messages:', possibleMessages.filter(Boolean))
            }
            
            // ALWAYS prevent default behavior
            event.preventDefault()
        }

        const handleError = (event: ErrorEvent) => {
            console.log('=== GLOBAL ERROR CAUGHT ===')
            console.log('Error event:', event)
            console.log('Error message:', event.message)
            console.log('Error:', event.error)
            console.log('Error type:', typeof event.error)
            console.log('Error constructor:', event.error?.constructor?.name)
            
            if (event.error && typeof event.error === 'object') {
                console.log('Error object keys:', Object.keys(event.error))
                try {
                    console.log('Error JSON:', JSON.stringify(event.error, null, 2))
                } catch (e) {
                    console.log('Cannot stringify error:', e)
                }
            }
        }

        window.addEventListener('unhandledrejection', handleUnhandledRejection)
        window.addEventListener('error', handleError)

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
            window.removeEventListener('error', handleError)
            if (originalHandler) {
                window.onunhandledrejection = originalHandler
            }
        }
    }, [])

    const [promptData, setPromptData] = useState<PromptData>({
        name: "",
        slug: "",
        description: "",
        tags: [],
        status: "draft",
        systemPrompt: "",
        userPrompt: "",
        variables: [],
    })

    // Add states for tracking original data
    const [originalPromptMeta, setOriginalPromptMeta] = useState<{
        name: string;
        slug: string;
        description?: string;
        tags: any[];
    }>({name: "", slug: "", description: "", tags: []})

    const [originalVersionData, setOriginalVersionData] = useState<{
        id: string;
        version: string;
        variables: Variable[];
        systemPrompt: string;
        userPrompt: string;
        assistantPrompt?: string;
    }>({
        id: "",
        version: "",
        variables: [],
        systemPrompt: "",
        userPrompt: "",
        assistantPrompt: "",
    })

    const [testVariables, setTestVariables] = useState<Record<string, string>>({})
    const [activeTab, setActiveTab] = useLocalStorage<"system" | "user" | "assistant">("editor-active-tab", "user")
    const [isAddVariableModalOpen, setIsAddVariableModalOpen] = useState(false)
    const [isTestModalOpen, setIsTestModalOpen] = useState(false)
    const [isPublished, setIsPublished] = useState(false)
    const [selectedModels, setSelectedModels] = useState<ModelId[]>(["gpt-5", "claude-4-sonnet"])
    const [isPreviewMode, setIsPreviewMode] = useState(false)
    const [currentViewingVersion, setCurrentViewingVersion] = useState<string | undefined>(undefined)
    const [originalPromptData, setOriginalPromptData] = useState<PromptData | null>(null)
    const [versions, setVersions] = useState<Version[]>([])
    const [publishedVersion, setPublishedVersion] = useState<string>("")
    const editorSnapshotGetterRef = useRef<(() => { system: string; user: string; assistant: string }) | null>(null)

    // Ref to prevent circular updates
    const updateInProgressRef = useRef(false)

    // Function to transform API variables to our format
    const transformApiVariables = (apiVariables: any[]): Variable[] => {
        return apiVariables.map(variable => ({
            name: variable.name,
            type: variable.type || "string",
            defaultValue: variable.default || "",
            isDefined: true // Variables from database are always defined
        }))
    }

    // Function to transform API version to our format
    const transformApiVersion = (apiVersion: ApiPromptVersion): Version => {
        const formatTimeAgo = (dateString: string) => {
            const date = new Date(dateString)
            const now = new Date()
            const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

            let interval = seconds / 31536000
            if (interval > 1) return Math.floor(interval) + "y ago"
            interval = seconds / 2592000
            if (interval > 1) return Math.floor(interval) + "mo ago"
            interval = seconds / 86400
            if (interval > 1) return Math.floor(interval) + "d ago"
            interval = seconds / 3600
            if (interval > 1) return Math.floor(interval) + "h ago"
            interval = seconds / 60
            if (interval > 1) return Math.floor(interval) + "m ago"
            return "just now"
        }

        const getVersionStatus = (status: string): "Production" | "Draft" | "Inactive" | "Deprecated" => {
            switch (status.toLowerCase()) {
                case 'production':
                    return "Production"
                case 'draft':
                    return "Draft"
                case 'inactive':
                    return "Inactive"
                case 'deprecated':
                    return "Deprecated"
                default:
                    return "Draft"
            }
        }

        const getDisplayName = (fullName?: string, username?: string) => {
            if (fullName && fullName.trim()) {
                return fullName.trim();
            }
            if (username) {
                return username;
            }
            return "Unknown User";
        };
        console.log(apiVersion)

        const creatorName = getDisplayName(apiVersion.creator_full_name, apiVersion.creator_name);
        const updaterName = getDisplayName((apiVersion as any).updater_full_name, (apiVersion as any).updater_name);
        
        // Show updater if it exists and is different from creator, otherwise show creator
        const hasUpdater = (apiVersion as any).updated_by && (apiVersion as any).updater_name && (apiVersion as any).updater_name.trim();
        const displayName = hasUpdater && updaterName !== creatorName && updaterName !== "Unknown User"
            ? updaterName 
            : creatorName;

        return {
            id: apiVersion.id,
            version: apiVersion.version_number.toString(),
            status: getVersionStatus(apiVersion.status),
            timestamp: formatTimeAgo(apiVersion.updated_at),
            author: displayName,
            updater: hasUpdater ? updaterName : displayName,
            description: "Version update",
            requests: `${apiVersion.usage_count} req`,
            successRate: undefined,
            systemPrompt: apiVersion.system_prompt || "",
            userPrompt: apiVersion.user_prompt || "",
            tags: (apiVersion as any).tags || [],
            assistantPrompt: apiVersion.assistant_prompt || "",
            variables: transformApiVariables(apiVersion.variables || [])
        }
    }

    // Load prompt data by ID
    useEffect(() => {
        const loadPromptData = async () => {
            try {
                setLoading(true);
                setError(null);

                const promptId = routeId;
                setPromptId(promptId);

                const [fullPrompt, promptVersions] = await Promise.all([
                    apiClient.getPrompt(promptId),
                    apiClient.getPromptVersions(promptId),
                ]);

                const transformedVersions = promptVersions.map(transformApiVersion);
                setVersions(transformedVersions);

                const activeVersion =
                    promptVersions.find(v => v.status === "production") ??
                    [...promptVersions].sort(
                        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                    )[0];

                if (!activeVersion) {
                    const emptyPrompt: PromptData = {
                        name: fullPrompt?.name || "",
                        slug: fullPrompt?.slug || "",
                        description: fullPrompt?.description || "",
                        tags: fullPrompt?.tags || [],
                        status: (fullPrompt?.status as "draft" | "active" | "archived") || "draft",
                        systemPrompt: "",
                        userPrompt: "",
                        assistantPrompt: "",
                        variables: [],
                    };
                    setPromptData(emptyPrompt);
                    setOriginalPromptMeta({
                        name: emptyPrompt.name,
                        slug: emptyPrompt.slug,
                        description: emptyPrompt.description,
                        tags: emptyPrompt.tags,
                    });
                    setOriginalVersionData({
                        id: "",
                        version: "",
                        variables: [],
                        systemPrompt: "",
                        userPrompt: "",
                        assistantPrompt: "",
                    });
                    setPublishedVersion("");
                    setCurrentViewingVersion(undefined);
                    setTestVariables({});
                    return;
                }

                // IMPORTANT: All variables from database should be isDefined: true
                const apiVars = Array.isArray(activeVersion.variables) ? activeVersion.variables : [];
                const normalizedVars: Variable[] = apiVars.map((v: any) => ({
                    name: String(v.name || "").trim(),
                    type: (v.type as Variable["type"]) || "string",
                    defaultValue: v.default ?? "",
                    isDefined: true,
                }));

                const newPromptData: PromptData = {
                    name: fullPrompt?.name || "",
                    slug: fullPrompt?.slug || "",
                    description: fullPrompt?.description || "",
                    tags: fullPrompt?.tags || [],
                    status: (fullPrompt?.status as "draft" | "active" | "archived") || "draft",
                    systemPrompt: activeVersion.system_prompt || "",
                    userPrompt: activeVersion.user_prompt || "",
                    assistantPrompt: activeVersion.assistant_prompt || "",
                    variables: normalizedVars,
                };

                // Synchronize variables on load
                const syncedVariables = syncVariablesWithPrompts(
                    newPromptData.systemPrompt,
                    newPromptData.userPrompt,
                    newPromptData.assistantPrompt || "",
                    newPromptData.variables
                );

                const syncedData = {...newPromptData, variables: syncedVariables};
                setPromptData(syncedData);

                // Set published version
                const activeVersionNumber = String(activeVersion.version_number);
                setPublishedVersion(
                    promptVersions.some(v => v.status === "production")
                        ? activeVersionNumber
                        : ""
                );
                setCurrentViewingVersion(activeVersionNumber);

                setOriginalPromptMeta({
                    name: newPromptData.name,
                    slug: newPromptData.slug,
                    description: newPromptData.description,
                    tags: newPromptData.tags,
                });

                setOriginalVersionData({
                    id: String(activeVersion.id),                // UUID версии
                    version: activeVersion.version_number.toString(), // порядковый номер для UI
                    variables: normalizedVars,
                    systemPrompt: newPromptData.systemPrompt,
                    userPrompt: newPromptData.userPrompt,
                    assistantPrompt: newPromptData.assistantPrompt || "",
                });

                // Test variable values
                const testVars: Record<string, string> = {};
                syncedData.variables.forEach(v => {
                    testVars[v.name] = v.defaultValue || "";
                });
                setTestVariables(testVars);

            } catch (err) {
                console.error("Error loading prompt data:", err);
                if (err instanceof Error) setError(err.message);
                else if (typeof err === "object" && err !== null) setError(JSON.stringify(err, null, 2));
                else setError(String(err));
            } finally {
                setLoading(false);
            }
        };

        loadPromptData();
    }, [routeId]);

    const handleSave = useCallback(async () => {
        try {
            if (!promptId) {
                throw new Error("No prompt ID")
            }

        // Get current data from editor
        let latestSystemPrompt = promptData.systemPrompt
        let latestUserPrompt = promptData.userPrompt
        let latestAssistantPrompt = promptData.assistantPrompt || ""

        if (editorSnapshotGetterRef.current) {
            try {
                const snap = editorSnapshotGetterRef.current()
                latestSystemPrompt = snap.system || ""
                latestUserPrompt = snap.user || ""
                latestAssistantPrompt = snap.assistant || ""

                console.log("Using snapshot data:", snap)
            } catch (error) {
                console.error("Error getting snapshot:", error)
            }
        }

        // Synchronize variables with current texts
        const syncedVariables = syncVariablesWithPrompts(
            latestSystemPrompt,
            latestUserPrompt,
            latestAssistantPrompt,
            promptData.variables
        );

        const currentPromptData = {
            ...promptData,
            systemPrompt: latestSystemPrompt,
            userPrompt: latestUserPrompt,
            assistantPrompt: latestAssistantPrompt,
            variables: syncedVariables,
        }

        // Check for undefined variables
        const undefinedVariables = currentPromptData.variables.filter(v => !v.isDefined)
        if (undefinedVariables.length > 0) {
            throw new Error(`Cannot save: ${undefinedVariables.length} undefined variable(s) found. Please define all variables before saving.`)
        }

        const hasPromptMetaChanges = (
            currentPromptData.name !== originalPromptMeta.name ||
            currentPromptData.slug !== originalPromptMeta.slug ||
            (currentPromptData.description || "") !== (originalPromptMeta.description || "")
        )

        const hasTagChanges = JSON.stringify(currentPromptData.tags) !== JSON.stringify(originalPromptMeta.tags)
        const hasVersionChanges = (
            JSON.stringify(currentPromptData.variables.filter(v => v.isDefined)) !== JSON.stringify(originalVersionData.variables.filter(v => v.isDefined)) ||
            latestSystemPrompt !== originalVersionData.systemPrompt ||
            latestUserPrompt !== originalVersionData.userPrompt ||
            latestAssistantPrompt !== (originalVersionData.assistantPrompt || "")
        )

        console.log("Save check:", {
            hasPromptMetaChanges,
            hasTagChanges,
            hasVersionChanges,
        })

        if (hasPromptMetaChanges) {
            const promptMetaPayload: any = {}
            if (currentPromptData.name !== originalPromptMeta.name) promptMetaPayload.name = currentPromptData.name
            if (currentPromptData.slug !== originalPromptMeta.slug) promptMetaPayload.slug = currentPromptData.slug
            if ((currentPromptData.description || "") !== (originalPromptMeta.description || "")) {
                promptMetaPayload.description = currentPromptData.description || ""
            }

            await apiClient.updatePrompt(promptId, promptMetaPayload)
        }

        // Handle tags separately since they're now on the Prompt, not PromptVersion
        if (hasTagChanges) {
            console.log("Current tags:", currentPromptData.tags)
            console.log("Original tags:", originalPromptMeta.tags)
            
            const validTagIds = currentPromptData.tags
                .map(tag => {
                    console.log("Processing tag:", tag)
                    return tag.id || tag.name
                })
                .filter(tagId => tagId !== null && tagId !== undefined && tagId !== "")
            
            const promptTagsPayload = {
                tag_ids: validTagIds
            }
            
            console.log("Updating tags:", promptTagsPayload)
            await apiClient.updatePrompt(promptId, promptTagsPayload)
        }

        console.log("Saving prompt:", originalVersionData)

        if (hasVersionChanges) {
            if (!originalVersionData.id) {
                throw new Error("Cannot update version: no version ID found. Try refreshing the page.")
            }

            const versionPayload: any = {}

            // Send only defined variables
            const definedVariables = currentPromptData.variables.filter(v => v.isDefined)
            versionPayload.variables = definedVariables.map(v => ({
                name: v.name,
                type: v.type,
                default: v.defaultValue,
                required: true
            }))

            versionPayload.system_prompt = latestSystemPrompt
            versionPayload.user_prompt = latestUserPrompt
            versionPayload.assistant_prompt = latestAssistantPrompt

            console.log("Sending to API:", versionPayload)

            await apiClient.updatePromptVersion(promptId, originalVersionData.id, versionPayload)
        }

        // Update state with current data
        setPromptData(currentPromptData)

        setOriginalPromptMeta({
            name: currentPromptData.name,
            slug: currentPromptData.slug,
            description: currentPromptData.description,
            tags: currentPromptData.tags,
        })

        setOriginalVersionData({
            id: originalVersionData.id,
            version: originalVersionData.version,
            variables: currentPromptData.variables.filter(v => v.isDefined),
            systemPrompt: latestSystemPrompt,
            userPrompt: latestUserPrompt,
            assistantPrompt: latestAssistantPrompt,
        })

        // Show success notification
        showNotification("Saved successfully", "success")
        } catch (error) {
            console.error("Error saving prompt:", error)

            // Show error notification
            let errorMessage = "Save failed"
            if (error instanceof Error) {
                errorMessage = error.message
            } else if (typeof error === 'object' && error !== null) {
                errorMessage = JSON.stringify(error)
            } else {
                errorMessage = String(error)
            }
            showNotification(errorMessage, "error")

            // Still throw for any other error handling
            if (error instanceof Error) {
                throw new Error(`Save failed: ${error.message}`)
            } else if (typeof error === 'object' && error !== null) {
                throw new Error(`Save failed: ${JSON.stringify(error)}`)
            } else {
                throw new Error(`Save failed: ${String(error)}`)
            }
        }
    }, [promptId, promptData, originalPromptMeta, originalVersionData]);

    // Setup hotkeys for save and publish (after handleSave is defined)
    useHotkeys({
        onSave: handleSave,
        onSendToProduction: async () => {
            if (!currentViewingVersion) return

            const isCurrentlyPublished = publishedVersion === currentViewingVersion
            const undefinedVariables = promptData.variables.filter((v) => !v.isDefined).length

            if (!isCurrentlyPublished && undefinedVariables > 0) {
                showNotification("Cannot publish: undefined variables found", "error")
                return
            }

            try {
                if (isCurrentlyPublished) {
                    // Already published, unpublish instead
                    await handleUnpublishVersion(currentViewingVersion)
                    showNotification(`Version ${currentViewingVersion} unpublished`, "success")
                } else {
                    // Publish current version
                    await handlePublishVersion(currentViewingVersion)
                    showNotification(`Version ${currentViewingVersion} published successfully!`, "success")
                }
            } catch (e: any) {
                showNotification(e?.message || "Failed to publish/unpublish", "error")
            }
        }
    })

    const totalCharacters = promptData.systemPrompt.length + promptData.userPrompt.length
    const definedVariables = promptData.variables.filter((v) => v.isDefined).length
    const undefinedVariables = promptData.variables.filter((v) => !v.isDefined).length

    const updatePromptData = (updates: Partial<PromptData>) => {
        if (updateInProgressRef.current) {
            console.log("Skipping update - already in progress")
            return // Prevent circular updates
        }

        console.log("updatePromptData called with:", Object.keys(updates))

        setPromptData(prevData => {
            updateInProgressRef.current = true

            let newData = {...prevData}

            // Apply only passed updates
            Object.keys(updates).forEach(key => {
                const value = updates[key as keyof PromptData]
                if (value !== undefined && value !== (prevData as any)[key]) {
                    (newData as any)[key] = value
                }
            })

            // Synchronize variables only when prompt text changes
            const isTextUpdate = updates.systemPrompt !== undefined ||
                updates.userPrompt !== undefined ||
                updates.assistantPrompt !== undefined

            const isVariableUpdate = updates.variables !== undefined

            if (isTextUpdate && !isVariableUpdate) {
                // Synchronize variables with new texts
                const syncedVariables = syncVariablesWithPrompts(
                    newData.systemPrompt,
                    newData.userPrompt,
                    newData.assistantPrompt || "",
                    newData.variables
                )

                // Check if variables actually changed
                if (JSON.stringify(syncedVariables) !== JSON.stringify(newData.variables)) {
                    newData = {...newData, variables: syncedVariables}

                    // Update test variables asynchronously
                    setTimeout(() => {
                        const newTestVariables: Record<string, string> = {}
                        syncedVariables.forEach(variable => {
                            newTestVariables[variable.name] = testVariables[variable.name] || variable.defaultValue || ""
                        })
                        setTestVariables(newTestVariables)
                        updateInProgressRef.current = false
                    }, 0)
                } else {
                    setTimeout(() => {
                        updateInProgressRef.current = false
                    }, 0)
                }
            } else {
                setTimeout(() => {
                    updateInProgressRef.current = false
                }, 0)
            }

            // Check if data actually changed
            const hasChanges = JSON.stringify(newData) !== JSON.stringify(prevData)
            if (!hasChanges) {
                setTimeout(() => {
                    updateInProgressRef.current = false
                }, 0)
                return prevData
            }

            console.log("Data actually changed, updating state")
            return newData
        })
    }

    const addVariable = (variable: Omit<Variable, "isDefined">) => {
        const newVariable = {...variable, isDefined: true}
        setPromptData((prev) => ({
            ...prev,
            variables: [...prev.variables, newVariable],
        }))
        setTestVariables((prev) => ({
            ...prev,
            [variable.name]: variable.defaultValue || "",
        }))
    }

    const removeVariable = (variableName: string) => {
        const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Prepare regexes for both placeholder styles
        const doubleCurly = new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, 'gu');

        setPromptData((prev) => {
            // Remove all placeholder occurrences from texts
            const nextSystem = (prev.systemPrompt || '').replace(doubleCurly, '');
            const nextUser = (prev.userPrompt || '').replace(doubleCurly, '');
            const nextAssistant = (prev.assistantPrompt || '').replace(doubleCurly, '');

            return {
                ...prev,
                systemPrompt: nextSystem,
                userPrompt: nextUser,
                assistantPrompt: nextAssistant,
                variables: prev.variables.filter((v) => v.name !== variableName),
            };
        });


        setTestVariables((prev) => {
            const newVars = {...prev};
            delete newVars[variableName];
            return newVars;
        });
    }

    const defineVariable = (variableName: string) => {
        setPromptData((prev) => ({
            ...prev,
            variables: prev.variables.map((v) => (v.name === variableName ? {...v, isDefined: true} : v)),
        }))
        setTestVariables((prev) => ({
            ...prev,
            [variableName]: "",
        }))
    }

    const handleViewVersion = (
        versionId: string,
        id: string,
        systemPrompt: string,
        userPrompt: string,
        assistantPrompt: string | undefined,
        variables: Variable[]
    ) => {
        if (!originalPromptData) {
            setOriginalPromptData(promptData)
        }
        const selectedVersion = versions.find(v => v.version === versionId)
        const syncedVariables = syncVariablesWithPrompts(systemPrompt, userPrompt, assistantPrompt || "", variables)

        const newData = {
            ...promptData,
            systemPrompt,
            userPrompt,
            // Keep tags from prompt data since tags are now at prompt level, not version level
            tags: promptData.tags,
            assistantPrompt: assistantPrompt || "",
            variables: syncedVariables,
        }

        setPromptData(newData)
        // Update base version for saving - now save will go to selected version
        setOriginalVersionData({
            id: id,
            version: versionId,
            variables: newData.variables.filter(v => v.isDefined),
            systemPrompt: newData.systemPrompt,
            userPrompt: newData.userPrompt,
            assistantPrompt: newData.assistantPrompt || "",
        })
        setCurrentViewingVersion(versionId)
    }

    const handleReturnToActive = () => {
        if (originalPromptData) {
            setPromptData(originalPromptData)
            setOriginalPromptData(null)
        }
        setCurrentViewingVersion(publishedVersion || undefined)
    }

    const handleCreateVersion = async (option: "current" | "history" | "scratch", versionId?: string) => {
    if (!promptId) return

    let newVersionData: PromptData

    switch (option) {
        case "current":
            newVersionData = {...promptData, status: "draft"}
            break
        case "history":
            const versionData = getVersionData(versionId || "")
            newVersionData = {
                ...promptData,
                systemPrompt: versionData.systemPrompt,
                userPrompt: versionData.userPrompt,
                variables: versionData.variables,
                status: "draft",
            }
            break
        case "scratch":
            newVersionData = {
                ...promptData,
                systemPrompt: "",
                userPrompt: "",
                variables: [],
                status: "draft",
            }
            break
        default:
            return
    }

    // Synchronize variables for new version
    const syncedVariables = syncVariablesWithPrompts(
        newVersionData.systemPrompt,
        newVersionData.userPrompt,
        newVersionData.assistantPrompt || "",
        newVersionData.variables
    )

    newVersionData = {...newVersionData, variables: syncedVariables}

    try {
        // Send only defined variables
        const definedVariables = newVersionData.variables.filter(v => v.isDefined)
        const apiVariables = definedVariables.map(v => ({
            name: v.name,
            type: v.type,
            default: v.defaultValue,
            required: v.isDefined
        }))

        const newVersion = await apiClient.createPromptVersion({
            prompt_id: promptId,
            system_prompt: newVersionData.systemPrompt,
            user_prompt: newVersionData.userPrompt,
            variables: apiVariables,
            changelog: "Created from editor"
        })

        const transformedVersion = transformApiVersion(newVersion)
        setVersions((prev) => [transformedVersion, ...prev])
        setPromptData(newVersionData)
        setCurrentViewingVersion(transformedVersion.version)
        setOriginalPromptData(null)

        setOriginalVersionData({
            id: transformedVersion.id, // ID новой версии
            version: transformedVersion.version, // номер новой версии
            variables: newVersionData.variables.filter(v => v.isDefined),
            systemPrompt: newVersionData.systemPrompt,
            userPrompt: newVersionData.userPrompt,
            assistantPrompt: newVersionData.assistantPrompt || "",
        })

    } catch (err) {
        console.error("Error creating version:", err)
        setError("Failed to create new version")
    }
}

    const handlePublishVersion = async (versionNumber: string) => {
    if (!promptId) return

    try {
        // Находим версию по номеру версии (version), а не по ID
        const versionToPublish = versions.find(v => v.version === versionNumber)
        if (versionToPublish) {
            // Use version ID for API request
            await apiClient.deployPromptVersion(promptId, versionToPublish.id.toString())

            setPublishedVersion(versionNumber) // Save version number
            setVersions((prev) =>
                prev.map((v) => ({
                    ...v,
                    status: v.version === versionNumber ? "Production" : v.status === "Production" ? "Inactive" : v.status,
                }))
            )

            // Invalidate prompts cache to update status on /prompts page
            const { invalidatePromptsCache } = await import('@/lib/api')
            invalidatePromptsCache()
        }
    } catch (err) {
        console.error("Error publishing version:", err)
        // Обеспечиваем, что всегда бросаем Error объект, а не произвольный объект
        if (err instanceof Error) {
            throw err
        } else if (typeof err === 'object' && err !== null) {
            // Safe property check via 'in' operator or type assertion
            const errorObj = err as any
            const message = errorObj.message || errorObj.error || 'Failed to publish version'
            throw new Error(typeof message === 'string' ? message : JSON.stringify(err))
        } else {
            throw new Error('Failed to publish version')
        }
    }
}

    const handleUnpublishVersion = async (versionNumber: string) => {
    if (!promptId) return

    try {
        // Находим версию по номеру версии (version), а не по ID
        const versionToUnpublish = versions.find(v => v.version === versionNumber)
        if (!versionToUnpublish) {
            throw new Error("Version not found")
        }

        // Check that version is actually in production
        if (versionToUnpublish.status !== "Production") {
            throw new Error("Only active versions can be unpublished")
        }

        // Call API to rollback deploy, using version ID
        const undeployResponse = await apiClient.undeployPromptVersion(promptId, versionToUnpublish.id)

        // Обновляем локальное состояние
        // Remove published version
        setPublishedVersion("")
        setIsPublished(false)

        // Update version statuses using API response
        setVersions((prev) =>
            prev.map((v) => {
                if (v.version === versionNumber) {
                    // Use status returned by API
                    return {
                        ...v,
                        status: undeployResponse.new_status as "Production" | "Draft" | "Inactive" | "Deprecated"
                    }
                }
                // Other versions remain unchanged
                return v
            })
        )

        // If currently viewing version was unpublished,
        // update isPublished flag
        if (currentViewingVersion === versionNumber) {
            setIsPublished(false)
        }

        // Invalidate prompts cache to update status on /prompts page
        const { invalidatePromptsCache } = await import('@/lib/api')
        invalidatePromptsCache()
    } catch (err) {
        console.error("Error unpublishing version:", err)
        // Обеспечиваем, что всегда бросаем Error объект, а не произвольный объект
        if (err instanceof Error) {
            throw err
        } else if (typeof err === 'object' && err !== null) {
            // Use type assertion to access properties
            const errorObj = err as any
            const message = errorObj.message || errorObj.error || 'Failed to unpublish version'
            throw new Error(typeof message === 'string' ? message : JSON.stringify(err))
        } else {
            throw new Error('Failed to unpublish version')
        }
    }
}


    const handleDeleteVersion = async (versionId: string) => {
        if (!promptId) return

        try {
            // Call API to delete version
            await apiClient.deletePromptVersion(promptId, versionId)

            // Update local state - remove version from list
            setVersions((prev) => prev.filter(v => v.id !== versionId))

            // If deleted version was currently viewing, reset to first available
            const deletedVersion = versions.find(v => v.id === versionId)
            if (deletedVersion && currentViewingVersion === deletedVersion.version) {
                const remainingVersions = versions.filter(v => v.id !== versionId)
                if (remainingVersions.length > 0) {
                    const latestVersion = remainingVersions[0] // versions already sorted in descending order
                    setCurrentViewingVersion(latestVersion.version)
                    setOriginalVersionData({
                        id: latestVersion.id,
                        version: latestVersion.version,
                        variables: latestVersion.variables.filter(v => v.isDefined),
                        systemPrompt: latestVersion.systemPrompt,
                        userPrompt: latestVersion.userPrompt,
                        assistantPrompt: latestVersion.assistantPrompt || "",
                    })
                    updatePromptData({
                        ...promptData,
                        systemPrompt: latestVersion.systemPrompt,
                        userPrompt: latestVersion.userPrompt,
                        assistantPrompt: latestVersion.assistantPrompt,
                        variables: latestVersion.variables
                    })
                }
            }
        } catch (err) {
            console.error("Error deleting version:", err)
            if (err instanceof Error) {
                throw err
            } else if (typeof err === 'object' && err !== null) {
                const message = (err as any).message || (err as any).error || 'Failed to delete version'
                throw new Error(typeof message === 'string' ? message : JSON.stringify(err))
            } else {
                throw new Error('Failed to delete version')
            }
        }
    }

    const getVersionData = (versionId: string) => {
        const version = versions.find(v => v.id.toString() === versionId)
        if (version) {
            return {
                systemPrompt: version.systemPrompt,
                userPrompt: version.userPrompt,
                variables: version.variables
            }
        }

        return {
            systemPrompt: "",
            userPrompt: "",
            variables: [] as Variable[]
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading prompt...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/prompts')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Back to Prompts
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
                <EditorHeader
                    isPublished={publishedVersion === currentViewingVersion}
                    setIsPublished={setIsPublished}
                    setIsTestModalOpen={setIsTestModalOpen}
                    hasUndefinedVariables={undefinedVariables > 0}
                    promptSlug={promptData.slug}
                    isPreviewMode={isPreviewMode}
                    setIsPreviewMode={setIsPreviewMode}
                    currentViewingVersion={currentViewingVersion}
                    publishedVersion={publishedVersion}
                    onPublishVersion={handlePublishVersion}
                    onUnpublishVersion={handleUnpublishVersion}
                    onSave={handleSave}
                    versions={versions}
                />

                <div className="flex flex-1 overflow-hidden pt-[65px]">
                    <LeftPanel
                        promptData={promptData}
                        updatePromptDataAction={updatePromptData}
                        setIsAddVariableModalOpenAction={setIsAddVariableModalOpen}
                        removeVariable={removeVariable}
                        defineVariable={defineVariable}
                        onViewVersion={handleViewVersion}
                        currentViewingVersion={currentViewingVersion ?? null}
                        onCreateVersion={handleCreateVersion}
                        onDeleteVersion={handleDeleteVersion}
                        publishedVersion={publishedVersion}
                        versions={versions}
                        promptId={promptId}
                    />

                    <CenterPanel
                        promptData={promptData}
                        updatePromptDataAction={updatePromptData}
                        activeTab={activeTab}
                        setActiveTabAction={setActiveTab}
                        totalCharacters={totalCharacters}
                        variableCount={promptData.variables.length}
                        undefinedCount={undefinedVariables}
                        selectedModels={selectedModels}
                        onChangeSelectedModelsAction={setSelectedModels}
                        currentViewingVersion={currentViewingVersion}
                        onReturnToActiveAction={handleReturnToActive}
                        isPreviewMode={isPreviewMode}
                        setSnapshotGetterAction={(fn) => {
                            editorSnapshotGetterRef.current = fn
                        }}
                        onSave={handleSave}
                    />
                </div>

                <AddVariableModal
                    isOpen={isAddVariableModalOpen}
                    onClose={() => setIsAddVariableModalOpen(false)}
                    onAdd={addVariable}
                />

                <TestModal
                    open={isTestModalOpen}
                    onOpenChange={setIsTestModalOpen}
                    prompt={promptData}
                />
            </div>
    )
}

export default function PromptEditor({ params }: { params: Promise<{ id: string }> }) {
    return (
        <ProtectedRoute>
            <NotificationProvider>
                <PromptEditorContent params={params} />
            </NotificationProvider>
        </ProtectedRoute>
    )
}