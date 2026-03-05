"use client"

import { Button } from "@/components/ui/button"
import { useLocale } from "@/contexts/locale-context"

export interface PaginationProps {
  totalItems: number
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  itemName?: string
  className?: string
}

export function Pagination({
  totalItems,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  itemName = "items",
  className = "",
}: PaginationProps) {
  const { t } = useLocale()
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  const getVisiblePages = () => {
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    const adjustedStart = Math.max(1, end - maxVisible + 1)

    return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i)
  }

  return (
    <div className={`flex items-center justify-between mt-4 px-4 mb-4 ${className}`}>
      <div className="text-xs text-muted-foreground">
        {totalItems === 0 ? (
          <>0 {itemName}</>
        ) : (
          <>
            <span className="font-medium">{startIndex}-{endIndex}</span> {t('prompts.pagination.of')}{" "}
            <span className="font-medium">{totalItems}</span> {itemName}
          </>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 px-3 text-xs"
        >
          {t('prompts.pagination.previous')}
        </Button>
        {getVisiblePages().map((pageNum) => (
          <Button
            key={pageNum}
            size="sm"
            variant={currentPage === pageNum ? "default" : "ghost"}
            onClick={() => onPageChange(pageNum)}
            className={`h-8 px-3 text-xs ${currentPage === pageNum ? "gradient-primary text-primary-foreground" : ""}`}
          >
            {pageNum}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 px-3 text-xs"
        >
          {t('prompts.pagination.next')}
        </Button>
      </div>
    </div>
  )
}
