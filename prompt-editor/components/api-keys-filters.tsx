"use client"

import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ApiKeysFiltersProps {
  searchQuery: string
  onSearch: (query: string) => void
  activeFilter: string
  onFilter: (filter: string) => void
  sortBy: string
  onSort: (sort: string) => void
  onNewApiKey: () => void
}

export function ApiKeysFilters({
  searchQuery,
  onSearch,
  activeFilter,
  onFilter,
  sortBy,
  onSort,
  onNewApiKey,
}: ApiKeysFiltersProps) {
  const filters = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ]

  return (
    <div className="p-4 py-4 h-16 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search API keys..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9 w-80 h-8 text-sm border-slate-200"
            />
          </div>

          <div className="flex items-center space-x-1">
            {filters.map((filter) => (
              <Button
                key={filter.key}
                variant="ghost"
                size="sm"
                onClick={() => onFilter(filter.key)}
                className={`h-8 px-3 text-sm font-medium border-b-2 ${
                  activeFilter === filter.key
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={sortBy} onValueChange={onSort}>
            <SelectTrigger className="w-48 h-8 text-sm border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Sort by: Created Date</SelectItem>
              <SelectItem value="name">Sort by: Name</SelectItem>
              <SelectItem value="lastUsed">Sort by: Last Used</SelectItem>
              <SelectItem value="usage">Sort by: Usage</SelectItem>
            </SelectContent>
          </Select>

          {/* New API Key Button */}
          <Button
            onClick={onNewApiKey}
            size="sm"
            className="h-8 px-3 text-sm bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New API Key
          </Button>
        </div>
      </div>
    </div>
  )
}
