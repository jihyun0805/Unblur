"use client"

import type React from "react"

interface HistoryPaginationProps {
  currentPage: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (pageIndex: number) => void
  className?: string
}

export function HistoryPagination({
  currentPage,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
  className = "",
}: HistoryPaginationProps) {
  if (totalPages <= 1) return null

  const goToPage = (index: number) => {
    const safeIndex = Math.min(totalPages - 1, Math.max(0, index))
    if (safeIndex === currentPage) return
    onPageChange(safeIndex)
  }

  const renderPageButtons = () => {
    const elements: Array<React.ReactNode> = []
    for (let i = 0; i < totalPages; i += 1) {
      const showPageButton = i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage + 2)
      if (!showPageButton) {
        if (i === currentPage - 3 || i === currentPage + 3) {
          elements.push(
            <span key={`ellipsis-${i}`} className="flex items-center justify-center w-10 h-10 text-sm text-muted-foreground">
              ...
            </span>
          )
        }
        continue
      }

      elements.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`w-10 h-10 rounded-lg transition-transform duration-150 ${
            currentPage === i
              ? "bg-pink-100 text-pink-900"
              : "bg-white text-sky-600 hover:bg-sky-100"
          } hover:scale-105 active:scale-95`}
        >
          {i + 1}
        </button>
      )
    }
    return elements
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex justify-center flex-wrap gap-1 sm:gap-2">
        <button
          onClick={() => goToPage(0)}
          disabled={!hasPrevious}
          className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-lg transition-transform duration-150 ${
            !hasPrevious
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white text-sky-600 hover:bg-sky-100 hover:scale-105 active:scale-95"
          }`}
        >
          &laquo;
        </button>

        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={!hasPrevious}
          className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg transition-transform duration-150 ${
            !hasPrevious
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white text-sky-600 hover:bg-sky-100 hover:scale-105 active:scale-95"
          }`}
        >
          &lt;
        </button>

        <div className="flex sm:hidden items-center px-3 py-1 bg-white rounded-lg">
          <span className="text-sm">
            {currentPage + 1} / {totalPages}
          </span>
        </div>

        <div className="hidden sm:flex">{renderPageButtons()}</div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={!hasNext}
          className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg transition-transform duration-150 ${
            !hasNext
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white text-sky-600 hover:bg-sky-100 hover:scale-105 active:scale-95"
          }`}
        >
          &gt;
        </button>

        <button
          onClick={() => goToPage(totalPages - 1)}
          disabled={!hasNext}
          className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-lg transition-transform duration-150 ${
            !hasNext
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white text-sky-600 hover:bg-sky-100 hover:scale-105 active:scale-95"
          }`}
        >
          &raquo;
        </button>
      </div>
    </div>
  )
}