"use client"

import {Search} from "lucide-react"
import {Button} from "@/components/ui/button"
import {ReactNode} from "react"

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
    return (
        <div className="">
            <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4 flex-1">
                    {/* Search field */}
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                        {filterOptions.map((option) => (
                            <button
                                key={option.key}
                                onClick={() => onFilter(option.key)} // FIXED: Call onFilter, not filterChangeAction
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    activeFilter === option.key
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "bg-transparent text-slate-600 hover:bg-slate-200"
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
                            className="bg-blue-600/90 hover:bg-blue-600 text-white h-[35px]"
                        >
                            + New Prompt
                        </Button>
                    </div>
                )}

                {/* Sorting */}
                <div>
                    <select
                        value={sortBy}
                        onChange={(e) => onSort(e.target.value)}
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
    )
}