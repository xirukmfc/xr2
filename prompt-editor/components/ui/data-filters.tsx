"use client"

import {Search} from "lucide-react"
import {Button} from "@/components/ui/button"
import {ReactNode} from "react"
import {useLocale} from "@/contexts/locale-context"

interface FilterOption {
    key: string
    label: string
}

interface SortOption {
    value: string
    label: string
}

interface DataFiltersProps {
    searchQuery: string
    onSearch: (query: string) => void
    searchPlaceholder?: string
    activeFilter: string
    onFilter: (filter: string) => void // Этот пропс мы будем использовать
    filterOptions: FilterOption[]
    sortBy: string
    onSort: (sort: string) => void
    sortOptions: SortOption[]
    showNewPromptButton?: boolean // New optional prop
    customActionButton?: ReactNode // Custom button instead of "New Prompt"
    onNewPromptClick?: () => void // Callback for creating prompt
}

export function DataFilters({
                                searchQuery,
                                onSearch,
                                searchPlaceholder = "Search...",
                                activeFilter,
                                onFilter, // Получаем onFilter
                                filterOptions,
                                sortBy,
                                onSort,
                                sortOptions,
                                showNewPromptButton = true, // Show button by default for backward compatibility
                                customActionButton, // Custom button
                                onNewPromptClick, // Add callback for creating prompt
                            }: DataFiltersProps) {
    const { t } = useLocale()

    return (
        <div className="">
            <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4 flex-1">
                    {/* Search field */}
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-10 pr-4 py-1.5 text-sm bg-secondary/40 border border-border/30 rounded-lg focus:ring-2 focus:ring-ring/10 focus:border-border/50 transition-shadow placeholder:text-muted-foreground/50"
                        />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center space-x-0.5 bg-secondary/30 p-0.5 rounded-lg">
                        {filterOptions.map((option) => (
                            <button
                                key={option.key}
                                onClick={() => onFilter(option.key)}
                                className={`px-2.5 py-1 text-sm rounded-md transition-all duration-200 ${
                                    activeFilter === option.key
                                        ? "bg-foreground text-background shadow-sm"
                                        : "bg-transparent text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {customActionButton ? (
                    <div className="flex items-center">
                        {customActionButton}
                    </div>
                ) : showNewPromptButton && onNewPromptClick && (
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <Button
                            onClick={onNewPromptClick}
                            variant="primary"
                            className="h-[35px]"
                        >
                            + {t('prompts.newPrompt')}
                        </Button>
                    </div>
                )}

                {/* Sorting */}
                <div>
                    <select
                        value={sortBy}
                        onChange={(e) => onSort(e.target.value)}
                        className="px-2.5 py-1.5 text-sm border border-border/30 rounded-lg focus:ring-2 focus:ring-ring/10 focus:border-border/50 bg-secondary/40 text-foreground transition-shadow"
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
    )
}