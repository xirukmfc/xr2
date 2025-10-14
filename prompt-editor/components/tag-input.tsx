"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Palette } from "lucide-react"

// Minimal tag type from API
type ApiTag = { id: string; name: string; color?: string }

interface TagInputProps {
  value: string
  onChange: (value: string) => void
  onAddTag: (tag: string) => void
  onCreateTag?: (name: string, color: string) => Promise<void>
  existingTags: string[]
  myTags: ApiTag[]
  placeholder?: string
}

interface SuggestionsData {
  existingTags: ApiTag[]
  canCreate: boolean
  searchQuery: string
}

// Popular colors for tags
const TAG_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#EC4899', // pink
  '#6B7280', // gray
]

export function TagInput({
  value,
  onChange,
  onAddTag,
  onCreateTag,
  existingTags,
  myTags = [],
  placeholder = "Add tag..."
}: TagInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debug log for verification
  useEffect(() => {
    console.log('TagInput received myTags:', myTags?.length, myTags)
  }, [myTags])

  // Suggestions: filter by tags + add option to create new
  const suggestions = useMemo((): SuggestionsData => {
    const q = value.trim().toLowerCase()
    if (!q) {
      return {
        existingTags: [],
        canCreate: false,
        searchQuery: ''
      }
    }

    const matchingTags = myTags.filter(t =>
      t.name.toLowerCase().includes(q) && !existingTags.includes(t.name)
    ).slice(0, 15)

    // Check if there's an exact match
    const exactMatch = myTags.find(t => t.name.toLowerCase() === q)
    const canCreate = q.length >= 2 && !exactMatch && !existingTags.includes(q)

    return {
      existingTags: matchingTags,
      canCreate,
      searchQuery: q
    }
  }, [value, myTags, existingTags])

  const totalSuggestions = suggestions.existingTags.length + (suggestions.canCreate ? 1 : 0)

  useEffect(() => {
    if (value.trim() && totalSuggestions > 0) {
      setIsOpen(true)
      setShowSuggestions(true)
      setSelectedIndex(-1)
    } else {
      setIsOpen(false)
      setShowSuggestions(false)
      setShowColorPicker(false)
      setSelectedIndex(-1)
    }
  }, [value, totalSuggestions])

  // Close on click outside component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowSuggestions(false)
        setShowColorPicker(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleCreateTag = async () => {
    if (!onCreateTag || !suggestions.canCreate) return

    setIsCreating(true)
    try {
      await onCreateTag(suggestions.searchQuery, selectedColor)
      onChange("")
      setIsOpen(false)
      setShowSuggestions(false)
      setShowColorPicker(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const showCreateForm = () => {
    setShowColorPicker(true)
    setSelectedIndex(suggestions.existingTags.length)
  }

  const hideCreateForm = () => {
    setShowColorPicker(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === "Enter") {
        e.preventDefault()
        // If there's exact match - add it
        const exact = myTags.find(t => t.name.toLowerCase() === value.trim().toLowerCase())
        if (exact && !existingTags.includes(exact.name)) {
          onAddTag(exact.name)
          onChange("")
          setIsOpen(false)
          setShowSuggestions(false)
        } else if (suggestions.canCreate && onCreateTag) {
          // Create new tag with default color
          showCreateForm()
        }
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, totalSuggestions - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.existingTags.length) {
            // Selected existing tag
            const selectedTag = suggestions.existingTags[selectedIndex]
            onAddTag(selectedTag.name)
            onChange("")
            setIsOpen(false)
            setShowSuggestions(false)
          } else {
            // Selected option to create new tag
            if (showColorPicker) {
              handleCreateTag()
            } else {
              showCreateForm()
            }
          }
        } else {
          // Check exact match or create new
          const exact = myTags.find(t => t.name.toLowerCase() === value.trim().toLowerCase())
          if (exact && !existingTags.includes(exact.name)) {
            onAddTag(exact.name)
            onChange("")
            setIsOpen(false)
            setShowSuggestions(false)
          } else if (suggestions.canCreate && onCreateTag) {
            showCreateForm()
          }
        }
        break
      case "Escape":
        setIsOpen(false)
        setShowSuggestions(false)
        setShowColorPicker(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (tag: ApiTag) => {
    if (!existingTags.includes(tag.name)) onAddTag(tag.name)
    onChange("")
    setIsOpen(false)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (totalSuggestions > 0) {
            setIsOpen(true)
            setShowSuggestions(true)
          }
        }}
        className="h-8 text-sm"
      />

      {isOpen && showSuggestions && totalSuggestions > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
        >
          {/* Existing tags */}
          {suggestions.existingTags.map((suggestion: ApiTag, index: number) => (
            <div
              key={suggestion.id}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${index === selectedIndex ? "bg-blue-50" : ""}`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{suggestion.name}</span>
                {suggestion.color && (
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: suggestion.color }}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Option to create new tag */}
          {suggestions.canCreate && onCreateTag && (
            <div
              className={`border-t border-gray-100 ${selectedIndex === suggestions.existingTags.length ? "bg-blue-50" : ""}`}
            >
              {!showColorPicker ? (
                <div
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                  onClick={showCreateForm}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Create "{suggestions.searchQuery}"</span>
                </div>
              ) : (
                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">Choose color for "{suggestions.searchQuery}"</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {TAG_COLORS.map((color: string) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          selectedColor === color 
                            ? 'border-gray-800 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateTag}
                      disabled={isCreating}
                      className="flex-1 h-7 text-xs"
                    >
                      {isCreating ? "Creating..." : "Create Tag"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={hideCreateForm}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-1 text-[11px] text-gray-500">
        {myTags && myTags.length > 0
          ? `${myTags.length} tags available • Type to search or create new`
          : myTags && Array.isArray(myTags) && myTags.length === 0
            ? "No tags found • Type to create your first tag"
            : "Loading tags..."}
      </div>
    </div>
  )
}