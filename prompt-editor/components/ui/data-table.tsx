"use client"

import type { ReactNode } from "react"

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  width: string
  render: (item: T) => ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  emptyState?: {
    icon: ReactNode
    title: string
    description: string
  }
  className?: string
  selectable?: boolean
  selectedItems?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onRowClick?: (item: T) => void
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  emptyState,
  className = "",
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  onRowClick
}: DataTableProps<T>) {

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? data.map(item => item.id) : [])
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedItems, itemId])
      } else {
        onSelectionChange(selectedItems.filter(id => id !== itemId))
      }
    }
  }

  const isAllSelected = selectedItems.length === data.length && data.length > 0
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < data.length
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="overflow-auto">
        {/* Table EditorHeader */}
        <div className="bg-slate-100 px-4 py-3 border-slate-200">
          <div className={`grid gap-4 text-xs font-medium text-slate-600 uppercase tracking-wide ${selectable ? 'grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr]' : 'grid-cols-12'}`}>
            {selectable && (
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            )}
            {columns.map((column) => (
              <div key={column.key} className={column.width}>
                {column.header}
              </div>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-200">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500">Loading...</p>
            </div>
          ) : data.length === 0 && emptyState ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                {emptyState.icon}
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">{emptyState.title}</h3>
              <p className="text-slate-500 mb-4">{emptyState.description}</p>
            </div>
          ) : (
            data.map((item) => {
              const isSelected = selectedItems.includes(item.id)
              return (
                <div
                  key={item.id}
                  className={`px-4 py-2 hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-blue-50' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={(e) => {
                    // Don't trigger row click if clicking on checkbox
                    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
                      return
                    }
                    // Don't trigger row click if clicking on buttons or interactive elements
                    if (e.target instanceof HTMLElement && (
                      e.target.closest('button') ||
                      e.target.closest('a') ||
                      e.target.closest('[role="button"]')
                    )) {
                      return
                    }
                    onRowClick?.(item)
                  }}
                >
                  <div className={`grid gap-4 items-center ${selectable ? 'grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr]' : 'grid-cols-12'}`}>
                    {selectable && (
                      <div className="col-span-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    {columns.map((column) => (
                      <div key={column.key} className={column.width}>
                        {column.render(item)}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
