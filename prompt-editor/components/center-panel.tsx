"use client"

import {useEffect, useRef, useState, useCallback} from "react"
import {
    clearDropCaret as clearDropCaretUtil,
    getEditorPositionFromClient,
    getBaseEditorOptions,
    updateVariableDecorations,
    type IStandaloneCodeEditor,
} from "@/lib/editor-utils"
import DynamicMonaco from "@/components/dynamic-monaco"
import {useMonaco} from "@monaco-editor/react"
import {Button} from "@/components/ui/button"
import {Maximize2, Plus, Minus, Copy} from "lucide-react"
import FullScreenEditor from "@/components/full-screen-editor"
import type {PromptData} from "@/app/editor/[id]/page"
import {ModelPicker} from "@/components/model-picker"
import {TokenBadges} from "@/components/token-badges"
import type {editor as Monaco} from "monaco-editor"
import type {ModelId} from "@/lib/tokens"
import {useNotification} from "@/components/notification-provider"

interface CenterPanelProps {
    promptData: PromptData
    updatePromptDataAction: (updates: Partial<PromptData>) => void
    activeTab: "system" | "user" | "assistant"
    setActiveTabAction: (tab: "system" | "user" | "assistant") => void
    totalCharacters: number
    variableCount: number
    undefinedCount: number
    selectedModels: ModelId[]
    onChangeSelectedModelsAction: (next: ModelId[]) => void
    currentViewingVersion?: string | null
    onReturnToActiveAction?: () => void
    isPreviewMode?: boolean
    setSnapshotGetterAction: (fn: (() => { system: string; user: string; assistant: string }) | null) => void
    onSave: () => Promise<void> | void
}

export function CenterPanel({
                                promptData,
                                updatePromptDataAction,
                                activeTab,
                                setActiveTabAction,
                                totalCharacters,
                                variableCount,
                                undefinedCount,
                                selectedModels,
                                onChangeSelectedModelsAction,
                                currentViewingVersion,
                                onReturnToActiveAction,
                                isPreviewMode = false,
                                setSnapshotGetterAction,
                                onSave,
                            }: CenterPanelProps) {
    const monaco = useMonaco()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const editorRef = useRef<IStandaloneCodeEditor | null>(null)
    const hostRef = useRef<HTMLDivElement | null>(null)

    // Unified types for models
    const sysModelRef = useRef<Monaco.ITextModel | null>(null)
    const userModelRef = useRef<Monaco.ITextModel | null>(null)
    const assistantModelRef = useRef<Monaco.ITextModel | null>(null)

    const decorationsRef = useRef<Monaco.IEditorDecorationsCollection | null>(null)
    const dropDecoRef = useRef<Monaco.IEditorDecorationsCollection | null>(null)
    const isInitializedRef = useRef(false)
    const isProgrammaticChangeRef = useRef(false)

    // Without NodeJS.Timeout — this is browser
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)
    const [theme] = useState<"vs" | "vs-dark">("vs")
    const [showLineNumbers] = useState(true)
    const [fontSize, setFontSize] = useState(14)

    const {showNotification} = useNotification()

    const handleCopyActive = async () => {
        try {
            const currentModel = editorRef.current?.getModel()
            const textToCopy = currentModel?.getValue() || ""
            await navigator.clipboard.writeText(textToCopy)
            showNotification("Current tab text copied", "success")
        } catch {
            showNotification("Failed to copy", "error")
        }
    }

    const editorOptions: Monaco.IStandaloneEditorConstructionOptions = {
        ...getBaseEditorOptions({fontSize, showLineNumbers}),
        lineNumbers: (showLineNumbers ? "on" : "off") as Monaco.LineNumbersType,
    }

    // Cmd/Ctrl+A only within panel
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!(e.metaKey || e.ctrlKey)) return
            const isA = e.code === "KeyA" || e.key.toLowerCase() === "a"
            if (!isA) return
            const target = e.target as Node | null
            if (!containerRef.current || (target && !containerRef.current.contains(target))) return
            const ed = editorRef.current
            if (!ed) return
            e.preventDefault()
            e.stopPropagation()
            const model = ed.getModel()
            if (!model) return
            ed.focus()
            ed.setSelection(model.getFullModelRange())
            ed.revealLineNearTop(1)
        }
        window.addEventListener("keydown", handler, {capture: true})
        return () => window.removeEventListener("keydown", handler, {capture: true} as any)
    }, [])

    const refreshDecorations = useCallback(() => {
        decorationsRef.current = updateVariableDecorations(
            editorRef.current,
            monaco as any,
            promptData.variables,
            decorationsRef.current as any,
        )
    }, [monaco, promptData.variables])

    const clearAllDecorations = useCallback(() => {
        try {
            decorationsRef.current?.clear()
            decorationsRef.current = null
        } catch {
        }
    }, [])

    const clearDropCaret = useCallback(() => {
        try {
            clearDropCaretUtil(editorRef.current, dropDecoRef)
        } catch {
        }
    }, [])

    const showDropCaret = useCallback(
        (clientX: number, clientY: number) => {
            try {
                if (!monaco || !editorRef.current) return
                const ed = editorRef.current
                const model = ed.getModel()
                if (!model) return
                const pos = getEditorPositionFromClient(ed, clientX, clientY)
                if (!pos) return
                const lineLen = model.getLineMaxColumn(pos.lineNumber)
                const endCol = Math.min(pos.column + 1, lineLen)

                dropDecoRef.current?.clear()
                dropDecoRef.current = ed.createDecorationsCollection([
                    {
                        range: new (monaco as any).Range(pos.lineNumber, pos.column, pos.lineNumber, endCol),
                        options: {className: "drop-caret", isWholeLine: false},
                    },
                ])
            } catch (error: any) {
                if (error?.type !== "cancelation") console.error("Error showing drop caret:", error)
            }
        },
        [monaco],
    )

    // debounce parent updates
    const scheduleParentUpdate = useCallback(() => {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = setTimeout(() => {
            if (!isInitializedRef.current) return
            const systemValue = sysModelRef.current?.getValue() || ""
            const userValue = userModelRef.current?.getValue() || ""
            const assistantValue = assistantModelRef.current?.getValue() || ""
            updatePromptDataAction({
                systemPrompt: systemValue,
                userPrompt: userValue,
                assistantPrompt: assistantValue,
            })
        }, 800)
    }, [updatePromptDataAction])

    const onMount = (editor: any, m: any) => {
        editorRef.current = editor

        if (!sysModelRef.current) sysModelRef.current = m.editor.createModel(promptData.systemPrompt || "", "markdown")
        if (!userModelRef.current) userModelRef.current = m.editor.createModel(promptData.userPrompt || "", "markdown")
        if (!assistantModelRef.current)
            assistantModelRef.current = m.editor.createModel(promptData.assistantPrompt || "", "markdown")

        const activeModel =
            activeTab === "system" ? sysModelRef.current : activeTab === "user" ? userModelRef.current : assistantModelRef.current
        editor.setModel(activeModel)
        editor.focus()

        isInitializedRef.current = true

        const contentHandler = editor.onDidChangeModelContent(() => {
            if (isProgrammaticChangeRef.current) return
            scheduleParentUpdate()
            requestAnimationFrame(() => {
                try {
                    refreshDecorations()
                } catch {
                }
            })
        })

        editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyA, () => {
            const model = editor.getModel()
            if (!model) return
            editor.setSelection(model.getFullModelRange())
            editor.revealLineNearTop(1)
        })

        try {
            refreshDecorations()
        } catch {
        }

        if (hostRef.current) {
            const ro = new ResizeObserver(() => {
                try {
                    const el = hostRef.current!
                    editor.layout({width: el.clientWidth, height: el.clientHeight})
                } catch {
                }
            })
            ro.observe(hostRef.current)
            editor.onDidDispose(() => ro.disconnect())
        }

        editor.onDidDispose(() => {
            contentHandler.dispose()
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
            try {
                sysModelRef.current?.dispose()
                userModelRef.current?.dispose()
                assistantModelRef.current?.dispose()
            } catch {
            }
            sysModelRef.current = null
            userModelRef.current = null
            assistantModelRef.current = null
            decorationsRef.current = null
            dropDecoRef.current = null
            isInitializedRef.current = false
        })
    }

    // sync models on external changes
    useEffect(() => {
        if (!isInitializedRef.current) return
        isProgrammaticChangeRef.current = true

        const trySync = (modelRef: React.RefObject<Monaco.ITextModel | null>, nextValue: string | undefined) => {
            const model = modelRef.current
            if (model && model.getValue() !== (nextValue || "")) {
                const editor = editorRef.current
                const currentModel = editor?.getModel()
                const position = currentModel === model ? editor?.getPosition() : null
                try {
                    model.setValue(nextValue || "")
                    if (position && currentModel === model) {
                        requestAnimationFrame(() => {
                            try {
                                editor?.setPosition(position)
                            } catch {
                            }
                        })
                    }
                } catch {
                }
            }
        }

        trySync(sysModelRef, promptData.systemPrompt)
        trySync(userModelRef, promptData.userPrompt)
        trySync(assistantModelRef, promptData.assistantPrompt)

        setTimeout(() => {
            isProgrammaticChangeRef.current = false
            refreshDecorations()
        }, 100)
    }, [
        promptData.systemPrompt,
        promptData.userPrompt,
        promptData.assistantPrompt,
        currentViewingVersion,
        refreshDecorations,
    ])

    // tab switching
    useEffect(() => {
        const editor = editorRef.current
        if (!editor || !isInitializedRef.current) return
        clearAllDecorations()

        const targetModel =
            activeTab === "system" ? sysModelRef.current : activeTab === "user" ? userModelRef.current : assistantModelRef.current

        if (targetModel && editor.getModel() !== targetModel) {
            try {
                editor.setModel(targetModel)
                editor.focus()
            } catch {
            }
        }

        setTimeout(() => {
            try {
                refreshDecorations()
            } catch {
            }
        }, 100)

        requestAnimationFrame(() => {
            try {
                if (!hostRef.current) return
                editor.layout({width: hostRef.current.clientWidth, height: hostRef.current.clientHeight})
            } catch {
            }
        })
    }, [activeTab, refreshDecorations, clearAllDecorations])

    // update decorations when variables change
    useEffect(() => {
        if (!isInitializedRef.current) return
        requestAnimationFrame(() => {
            try {
                refreshDecorations()
            } catch {
            }
        })
    }, [promptData.variables, refreshDecorations])

    // snapshot for saving
    useEffect(() => {
        const getter = () => ({
            system: sysModelRef.current?.getValue() || "",
            user: userModelRef.current?.getValue() || "",
            assistant: assistantModelRef.current?.getValue() || "",
        })
        setSnapshotGetterAction(getter)
        return () => setSnapshotGetterAction(null)
    }, [setSnapshotGetterAction])

    // Preview Mode
    if (isPreviewMode) {
        const currentSystemPrompt = sysModelRef.current?.getValue() || promptData.systemPrompt || ""
        const currentUserPrompt = userModelRef.current?.getValue() || promptData.userPrompt || ""
        const currentAssistantPrompt = assistantModelRef.current?.getValue() || promptData.assistantPrompt || ""

        return (
            <>
                <div ref={containerRef} className="flex-1 bg-white flex flex-col min-w-0">
                    <div className="flex-shrink-0 bg-white/95 backdrop-blur border-b-0 px-4">
                        <div className="flex items-center justify-between h-full border-b-0 py-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-medium text-gray-700">Preview Mode</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={handleCopyActive} className="h-8 w-8 p-0"
                                        title="Copy">
                                    <Copy className="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-4">System Prompt:</h3>
                                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{currentSystemPrompt}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-4">User Prompt:</h3>
                                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{currentUserPrompt}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 px-3 py-2 bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center space-x-3">
                <span>
                  Characters:{" "}
                    <span className="font-medium">{currentSystemPrompt.length + currentUserPrompt.length}</span>
                </span>
                                <span>
                  Variables: <span className="font-medium">{variableCount}</span>
                </span>
                                {undefinedCount > 0 && (
                                    <span className="text-orange-600">
                    {"⚠️ "}
                                        {undefinedCount} undefined variable{undefinedCount > 1 ? "s" : ""}
                  </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    // Main editor interface
    return (
        <>
            <div ref={containerRef} className="flex-1 bg-white flex flex-col min-w-0">
                <div className="h-10 border-b-0 bg-gradient-to-r from-slate-50 to-slate-100 pt-0">
                    <div className="flex items-center">
                        {/* Tabs */}
                        <div className="flex">
                            <button
                                onClick={() => setActiveTabAction("system")}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "system"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                System Prompt
                            </button>
                            <button
                                onClick={() => setActiveTabAction("user")}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "user"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                User Prompt
                            </button>
                            {currentViewingVersion && (
                                <div className="px-1 py-2 text-xs text-slate-500">Viewing
                                    v.{currentViewingVersion}</div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="ml-auto flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleCopyActive} className="h-8 w-8 p-0"
                                    title="Copy">
                                <Copy className="w-4 h-4"/>
                            </Button>

                            <div className="flex items-center border border-slate-300 rounded-md bg-white">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Decrease font size"
                                    onClick={() => setFontSize((p) => Math.max(10, p - 2))}
                                    className="h-8 w-8 p-0 rounded-r-none border-r border-slate-200"
                                >
                                    <Minus className="w-4 h-4"/>
                                </Button>
                                <span
                                    className="px-3 text-sm text-slate-700 min-w-[3rem] text-center bg-slate-50">{fontSize}px</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Increase font size"
                                    onClick={() => setFontSize((p) => Math.min(32, p + 2))}
                                    className="h-8 w-8 p-0 rounded-l-none border-l border-slate-200"
                                >
                                    <Plus className="w-4 h-4"/>
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsFullScreenOpen(true)}
                                className="h-8 w-8 p-0"
                                title="Open in full screen"
                            >
                                <Maximize2 className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Editor area */}
                <div
                    ref={hostRef}
                    className="flex-1 min-h-0"
                    onDragOver={(e) => {
                        e.preventDefault()
                        if (!editorRef.current) return
                        showDropCaret(e.clientX, e.clientY)
                    }}
                    onDragLeave={() => clearDropCaret()}
                    onDrop={(e) => {
                        e.preventDefault()
                        const ed = editorRef.current
                        const model = ed?.getModel()
                        if (!ed || !model || !monaco) return
                        const pos = getEditorPositionFromClient(ed, e.clientX, e.clientY)
                        if (!pos) return
                        const text = e.dataTransfer?.getData("text/plain") || ""
                        ed.executeEdits("drop-variable", [
                            {
                                range: new (monaco as any).Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                                text
                            },
                        ])
                        ed.focus()
                        clearDropCaret()
                    }}
                >
                    <DynamicMonaco
                        theme={theme}
                        language="markdown"
                        height="100%"
                        width="100%"
                        options={editorOptions}
                        onMount={onMount}
                    />
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 px-3 py-2 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center space-x-3">
              <span>
                Characters: <span className="font-medium">{totalCharacters}</span>
              </span>
                            <span>
                Variables: <span className="font-medium">{variableCount}</span>
              </span>
                            {undefinedCount > 0 && (
                                <span className="text-orange-600">
                  {"⚠️ "}
                                    {undefinedCount} undefined variable{undefinedCount > 1 ? "s" : ""}
                </span>
                            )}
                            <div className="hidden md:flex items-center gap-2 ml-3">
                                <TokenBadges
                                    systemText={sysModelRef.current?.getValue() || promptData.systemPrompt}
                                    userText={userModelRef.current?.getValue() || promptData.userPrompt}
                                    assistantText={assistantModelRef.current?.getValue() || promptData.assistantPrompt || ""}
                                    models={selectedModels}
                                />
                                <ModelPicker selected={selectedModels} onChange={onChangeSelectedModelsAction}/>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span>⌘S Save</span>
                            <span>⌘P Deploy</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Screen Editor Modal */}
            {isFullScreenOpen && (
                <FullScreenEditor
                    isOpen={isFullScreenOpen}
                    onClose={() => setIsFullScreenOpen(false)}
                    promptData={promptData as any}
                    updatePromptData={updatePromptDataAction as any}
                    activeTab={activeTab}
                    setActiveTab={(t) => setActiveTabAction(t)}
                    selectedModels={selectedModels as any}
                    onChangeSelectedModels={onChangeSelectedModelsAction as any}
                    currentViewingVersion={currentViewingVersion ?? null}
                    onReturnToActive={onReturnToActiveAction}
                    onSave={onSave}
                />
            )}
        </>
    )
}
