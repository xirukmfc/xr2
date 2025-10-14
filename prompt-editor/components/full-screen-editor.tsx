"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import type { editor as Monaco } from "monaco-editor"
import React, { useCallback, useEffect, useRef, useState } from "react"
import DynamicMonaco from "@/components/dynamic-monaco"
import { useMonaco } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import {
  Save, Plus, Minus, Eye, EyeOff, BookOpen, ChevronDown, ChevronRight,
  AlertCircle, CheckCircle2, Type, Moon, Sun, Copy, Edit
} from "lucide-react"
import { useNotification } from "@/components/notification-provider"
import { ModelPicker } from "@/components/model-picker"
import { TokenBadges } from "@/components/token-badges"
import { useTheme } from "next-themes"
import {
  getBaseEditorOptions,
  updateVariableDecorations,
  type IStandaloneCodeEditor,
  getEditorPositionFromClient,
} from "@/lib/editor-utils"

interface Variable {
  name: string
  isDefined: boolean
  description?: string
  type?: "string" | "number" | "boolean" | "array"
  defaultValue?: any
}

interface PromptData {
  systemPrompt: string
  userPrompt: string
  assistantPrompt: string
  variables: Variable[]
  title?: string
  description?: string
  slug?: string
}

function FullScreenContent({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("fs-editor-save"))
      }
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onKeyDown])

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className="fixed inset-0 z-[9999] m-0 p-0 bg-gradient-to-br from-slate-50 to-slate-100 rounded-none border-0"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogPrimitive.Title className="sr-only">Full-screen editor</DialogPrimitive.Title>
        <div className="grid grid-rows-[auto_1fr_auto] w-[100dvw] h-[100dvh]">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function VariablePanel({
  variables,
  onInsertVariable,
  onToggleVariable,
}: {
  variables: Variable[]
  onInsertVariable: (varName: string) => void
  onToggleVariable: (varName: string) => void
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-slate-600" />
          <span className="font-medium text-slate-900">Variables</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
            {variables.filter((v) => v.isDefined).length}/{variables.length}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-6 w-6 p-0">
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {variables.map((variable) => (
            <div
              key={variable.name}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "copy"
                e.dataTransfer.setData("text/plain", `{{${variable.name}}}`)
                e.dataTransfer.setData("application/x-variable-name", variable.name)
              }}
              className="group p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-grab active:cursor-grabbing"
              title="Drag to editor to insert {{variable}}"
              onClick={() => onInsertVariable(variable.name)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded text-blue-600">
                      {`{{${variable.name}}}`}
                    </code>
                    {variable.isDefined ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  {variable.description && <p className="text-xs text-slate-600 mb-2">{variable.description}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleVariable(variable.name)
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface FullScreenEditorProps {
  isOpen: boolean
  onClose: () => void
  promptData: PromptData
  updatePromptData: (updates: Partial<PromptData>) => void
  activeTab: "system" | "user" | "assistant"
  setActiveTab: (tab: "system" | "user" | "assistant") => void
  selectedModels: import("@/lib/tokens").ModelId[]
  onChangeSelectedModels: (next: import("@/lib/tokens").ModelId[]) => void
  currentViewingVersion?: string | null
  onReturnToActive?: () => void
  onSave?: () => Promise<void> | void
}

function FullScreenEditor({
  isOpen,
  onClose,
  promptData,
  updatePromptData,
  activeTab,
  setActiveTab,
  selectedModels,
  onChangeSelectedModels,
  currentViewingVersion,
  onReturnToActive,
  onSave,
}: FullScreenEditorProps) {
  const { showNotification } = useNotification()
  const monaco = useMonaco()
  const { theme, setTheme } = useTheme()

  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const editorHostRef = useRef<HTMLDivElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const sysModelRef = useRef<import("monaco-editor").editor.ITextModel | null>(null)
  const userModelRef = useRef<import("monaco-editor").editor.ITextModel | null>(null)
  const assistantModelRef = useRef<import("monaco-editor").editor.ITextModel | null>(null)
  const decorationsRef = useRef<Monaco.IEditorDecorationsCollection | null>(null)
  const dropDecoRef = useRef<Monaco.IEditorDecorationsCollection | null>(null)

  const [fontSize, setFontSize] = useState(14)
  const [showVariablePanel, setShowVariablePanel] = useState(true)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const safePrompt: PromptData = {
    systemPrompt: promptData?.systemPrompt ?? "",
    userPrompt: promptData?.userPrompt ?? "",
    assistantPrompt: promptData?.assistantPrompt ?? "",
    variables: Array.isArray(promptData?.variables) ? promptData.variables : [],
    title: promptData?.title,
    description: promptData?.description,
    slug: promptData?.slug,
  }

  // ⌘/Ctrl+S from anywhere in fullscreen
  useEffect(() => {
    const saveListener = () => doSave()
    window.addEventListener("fs-editor-save", saveListener as EventListener)
    return () => window.removeEventListener("fs-editor-save", saveListener as EventListener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSave])

  // local Save button calls parent onSave (if provided)
  const doSave = async () => {
    try {
      if (onSave) {
        await onSave()
        showNotification("Saved!", "success")
      } else {
        showNotification("Changes saved successfully!", "success")
      }
      setIsSaving(true)
      setTimeout(() => setIsSaving(false), 200)
    } catch {
      showNotification("Save failed", "error")
    }
  }

  // Cmd/Ctrl+A only when focus is in editor
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!editorRef.current) return
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "a") return
      if (!editorRef.current.hasTextFocus()) return
      e.preventDefault()
      e.stopPropagation()
      const model = editorRef.current.getModel()
      if (!model) return
      editorRef.current.setSelection(model.getFullModelRange())
      editorRef.current.revealLineNearTop(1)
    }
    window.addEventListener("keydown", handler, { capture: true })
    return () => window.removeEventListener("keydown", handler, { capture: true } as any)
  }, [])

  // Layout on window resize
  useEffect(() => {
    const onResize = () => {
      const ed = editorRef.current
      const el = editorHostRef.current
      if (!ed || !el) return
      requestAnimationFrame(() => {
        try {
          ed.layout({ width: el.clientWidth, height: el.clientHeight })
        } catch {}
      })
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Layout when collapsing right panel (with animation)
  useEffect(() => {
    const ed = editorRef.current
    const el = editorHostRef.current
    if (!ed || !el) return
    requestAnimationFrame(() => {
      try { ed.layout({ width: el.clientWidth, height: el.clientHeight }) } catch {}
      setTimeout(() => {
        try { ed.layout({ width: el.clientWidth, height: el.clientHeight }) } catch {}
      }, 180)
    })
  }, [showVariablePanel])

  const handleCopyAll = async () => {
    try {
      const text = editorRef.current?.getModel()?.getValue() ?? ""
      await navigator.clipboard.writeText(text)
      showNotification("Text copied", "success")
    } catch {
      showNotification("Failed to copy", "error")
    }
  }

  const refreshDecorations = React.useCallback(() => {
    decorationsRef.current = updateVariableDecorations(
      editorRef.current,
      monaco as any,
      safePrompt.variables,
      decorationsRef.current as any,
    )
  }, [monaco, safePrompt.variables])

  // Debounced версия для оптимизации при быстром наборе
  const debouncedRefreshDecorations = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshDecorations();
      }, 150); // 150ms задержка для оптимизации
    };
  }, [refreshDecorations])

  const clearDropCaret = useCallback(() => {
    try {
      dropDecoRef.current?.clear()
      dropDecoRef.current = null
    } catch {}
  }, [])

  const showDropCaret = useCallback(
    (clientX: number, clientY: number) => {
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
          options: { className: "drop-caret", isWholeLine: false },
        },
      ])
    },
    [monaco],
  )

  const onMount = (editor: any, m: any) => {
    editorRef.current = editor

    if (!sysModelRef.current) {
      sysModelRef.current = m.editor.createModel(safePrompt.systemPrompt || "", "markdown")
    }
    if (!userModelRef.current) {
      userModelRef.current = m.editor.createModel(safePrompt.userPrompt || "", "markdown")
    }
    if (!assistantModelRef.current) {
      assistantModelRef.current = m.editor.createModel(safePrompt.assistantPrompt || "", "markdown")
    }

    const initialModel =
      activeTab === "system"
        ? sysModelRef.current
        : activeTab === "user"
        ? userModelRef.current
        : assistantModelRef.current

    editor.setModel(initialModel!)

    requestAnimationFrame(() => {
      const el = editorHostRef.current
      if (el) {
        try {
          editor.layout({ width: el.clientWidth, height: el.clientHeight })
          editor.focus()
          refreshDecorations()
        } catch {}
      }
    })

    // Hot keys
    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => doSave())
    editor.addCommand(m.KeyCode.Escape, () => onClose())

    // ResizeObserver — HERE, where there's access to editor
    if (editorHostRef.current) {
      const ro = new ResizeObserver(() => {
        const el = editorHostRef.current!
        try {
          editor.layout({ width: el.clientWidth, height: el.clientHeight })
        } catch {}
      })
      ro.observe(editorHostRef.current)
      editor.onDidDispose(() => ro.disconnect())
    }

    // Sync upward
    const sync = editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      if (!model) return
      const val = model.getValue()

      if (model === sysModelRef.current) updatePromptData({ systemPrompt: val })
      else if (model === userModelRef.current) updatePromptData({ userPrompt: val })
      else if (model === assistantModelRef.current) updatePromptData({ assistantPrompt: val })

      debouncedRefreshDecorations() // Используем debounced версию для оптимизации
    })

    editor.onDidDispose(() => {
      sync.dispose()
      sysModelRef.current?.dispose()
      userModelRef.current?.dispose()
      assistantModelRef.current?.dispose()
      sysModelRef.current = null
      userModelRef.current = null
      assistantModelRef.current = null
    })
  }

  // synchronization of texts in model
  useEffect(() => {
    const sys = sysModelRef.current
    const user = userModelRef.current
    const assistant = assistantModelRef.current

    if (sys && typeof safePrompt.systemPrompt === "string" && sys.getValue() !== safePrompt.systemPrompt) {
      sys.pushEditOperations([], [{ range: sys.getFullModelRange(), text: safePrompt.systemPrompt }], () => null)
    }
    if (user && typeof safePrompt.userPrompt === "string" && user.getValue() !== safePrompt.userPrompt) {
      user.pushEditOperations([], [{ range: user.getFullModelRange(), text: safePrompt.userPrompt }], () => null)
    }
    if (assistant && typeof safePrompt.assistantPrompt === "string" && assistant.getValue() !== safePrompt.assistantPrompt) {
      assistant.pushEditOperations([], [{ range: assistant.getFullModelRange(), text: safePrompt.assistantPrompt }], () => null)
    }

    refreshDecorations()

    const ed = editorRef.current
    const el = editorHostRef.current
    if (ed && el) {
      requestAnimationFrame(() => {
        try {
          ed.layout({ width: el.clientWidth, height: el.clientHeight })
        } catch {}
      })
    }
  }, [safePrompt.systemPrompt, safePrompt.userPrompt, safePrompt.assistantPrompt, refreshDecorations])

  // tab change
  useEffect(() => {
    const ed = editorRef.current
    if (!ed) return

    if (activeTab === "assistant" && !assistantModelRef.current && monaco?.editor) {
      assistantModelRef.current = monaco.editor.createModel(safePrompt.assistantPrompt || "", "markdown")
    }

    const model =
      activeTab === "system" ? sysModelRef.current
        : activeTab === "user" ? userModelRef.current
        : assistantModelRef.current

    if (model) ed.setModel(model)

    ed.focus()
    refreshDecorations()

    requestAnimationFrame(() => {
      const el = editorHostRef.current
      if (!el) return
      try {
        ed.layout({ width: el.clientWidth, height: el.clientHeight })
      } catch {}
    })
  }, [activeTab, monaco, refreshDecorations, safePrompt.assistantPrompt])

  const totalCharacters =
      (safePrompt.systemPrompt?.length || 0) +
      (safePrompt.userPrompt?.length || 0) +
      (safePrompt.assistantPrompt?.length || 0);
  const totalWords =
    (safePrompt.systemPrompt || "").split(/\s+/).filter(Boolean).length +
    (safePrompt.userPrompt || "").split(/\s+/).filter(Boolean).length +
    (safePrompt.assistantPrompt || "").split(/\s+/).filter(Boolean).length;
  const definedVariables = safePrompt.variables.filter((v) => v.isDefined).length
  const undefinedVariables = safePrompt.variables.length - definedVariables

  const substituteVariables = (text: string) => {
    let result = text
    safePrompt.variables.forEach((variable) => {
      const placeholder = `{{${variable.name}}}`
      const value = variable.defaultValue || `[${variable.name}]`
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value)
    })
    return result
  }

  const editorOptions: Monaco.IStandaloneEditorConstructionOptions = {
    ...getBaseEditorOptions({ fontSize, showLineNumbers }),
    automaticLayout: false,
    lineNumbers: (showLineNumbers ? "on" : "off") as Monaco.LineNumbersType,
  }

  const handlePreviewToggle = () => {
    setIsPreviewMode(!isPreviewMode)
    showNotification(!isPreviewMode ? "Switched to preview mode" : "Switched to edit mode", "success")
  }

  const handleSwitchTab = (tab: "system" | "user" | "assistant") => {
    if (typeof setActiveTab !== "function") return
    setActiveTab(tab)
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={() => {}}>
      <FullScreenContent onClose={onClose}>
        {/* Header (py-3 = 12px top/bottom) */}
        <div className="row-start-1 row-end-2 flex items-center justify-between py-3 px-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 h-[65px]">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {safePrompt.slug && (
                <span className="text-sm text-slate-600 max-w-[40vw] truncate">— {safePrompt.slug}</span>
              )}
            </div>

            {!isPreviewMode && (
              <div className="flex">
                <Button
                  variant="ghost"
                  data-active={activeTab === "system"}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors rounded-none ${
                    activeTab === "system"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => handleSwitchTab("system")}
                >
                  System Prompt
                </Button>

                <Button
                  variant="ghost"
                  data-active={activeTab === "user"}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors rounded-none ${
                    activeTab === "user"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => handleSwitchTab("user")}
                >
                  User Prompt
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviewToggle}
              className="h-8 px-3 text-sm"
              title={isPreviewMode ? "Switch to edit mode" : "Switch to preview mode"}
            >
              {isPreviewMode ? (
                <>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </>
              )}
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVariablePanel((s) => !s)}
                className="h-8 w-8 p-0"
                title="Toggle variables panel"
              >
                {showVariablePanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopyAll} className="h-8 w-8 p-0" title="Copy">
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center border border-slate-300 rounded-md bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFontSize((p) => Math.max(10, p - 2))}
                className="h-8 w-8 p-0 rounded-r-none border-r border-slate-200"
                title="Decrease font size"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm text-slate-700 min-w-[3rem] text-center bg-slate-50">{fontSize}px</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFontSize((p) => Math.min(32, p + 2))}
                className="h-8 w-8 p-0 rounded-l-none border-l border-slate-200"
                title="Increase font size"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={doSave}
              className={`h-8 transition-all duration-200 ${isSaving ? "bg-green-600 hover:bg-green-700 scale-95" : "bg-blue-600 hover:bg-blue-700 scale-100"}`}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={onClose} variant="outline" size="sm" className="h-8 bg-transparent">
              Close
            </Button>
          </div>
        </div>

        {/* Main area with DnD */}
        <div
          ref={gridRef}
          className={[
            "row-start-2 row-end-3 grid min-h-0 h-full transition-[grid-template-columns] duration-200",
            showVariablePanel ? "grid-cols-[1fr_20rem]" : "grid-cols-1",
          ].join(" ")}
        >
          {isPreviewMode ? (
            <div className="min-w-0 p-6 bg-gray-50 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-8">
                <h2 className="text-xl font-medium text-gray-900 mb-8">Preview Mode</h2>

                <div className="space-y-3">
                  <h3 className="text-base font-medium text-gray-700">System Prompt:</h3>
                  <div className="bg-white rounded-md p-6 border border-gray-200 shadow-sm">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm">
                      {substituteVariables(safePrompt.systemPrompt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-medium text-gray-700">User Prompt:</h3>
                  <div className="bg-white rounded-md p-6 border border-gray-200 shadow-sm">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm">
                      {substituteVariables(safePrompt.userPrompt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={editorHostRef}
              className={`min-w-0 ${showVariablePanel ? "border-r border-slate-200" : ""}`}
              onDragOver={(e) => {
                e.preventDefault()
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
                  { range: new (monaco as any).Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text },
                ])
                ed.focus()
                clearDropCaret()
              }}
            >
              <DynamicMonaco
                onMount={onMount}
                height="100%"
                width="100%"
                options={editorOptions}
                theme={theme === "dark" ? "vs-dark" : "vs"}
                language="markdown"
              />
            </div>
          )}

          {/* Right panel */}
          {showVariablePanel && (
            <div className="overflow-hidden">
              <VariablePanel
                variables={safePrompt.variables}
                onInsertVariable={(name) => {
                  if (!editorRef.current) return
                  const sel = editorRef.current.getSelection()
                  if (!sel) return
                  editorRef.current.executeEdits("insert-variable", [{ range: sel, text: `{{${name}}}` }])
                  editorRef.current.focus()
                }}
                onToggleVariable={(name) => {
                  const updated = safePrompt.variables.map((v) =>
                    v.name === name ? { ...v, isDefined: !v.isDefined } : v,
                  )
                  updatePromptData({ variables: updated })
                  refreshDecorations()
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="row-start-3 row-end-4 border-t border-slate-200 px-4 py-2 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <Type className="w-4 h-4" />
                <span>
                  <span className="font-medium text-slate-900">{totalCharacters.toLocaleString()}</span> chars
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>
                  <span className="font-medium text-slate-900">{totalWords.toLocaleString()}</span> words
                </span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>
                  <span className="font-medium text-green-600">{definedVariables}</span>/
                  <span className="font-medium text-slate-900">{safePrompt.variables.length}</span> variables
                </span>
              </div>
              {undefinedVariables > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{undefinedVariables} undefined</span>
                </div>
              )}

              <div className="hidden md:flex items-center gap-2">
                <TokenBadges
                  systemText={sysModelRef.current?.getValue() || promptData.systemPrompt}
                  userText={userModelRef.current?.getValue() || promptData.userPrompt}
                  assistantText={assistantModelRef.current?.getValue() || promptData.assistantPrompt}
                  models={selectedModels}
                />
                <ModelPicker selected={selectedModels} onChange={onChangeSelectedModels} />
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>⌘S Save</span>
              <span>⌘P Deploy</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      </FullScreenContent>
    </DialogPrimitive.Root>
  )
}

export default FullScreenEditor
