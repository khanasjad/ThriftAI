'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  showPageInfo?: boolean
  className?: string
  isLoading?: boolean
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showPageInfo = true,
  className = '',
  isLoading = false
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Smart pagination logic
      if (currentPage <= 4) {
        // Beginning: 1 2 3 4 5 ... 10
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // End: 1 ... 6 7 8 9 10
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Middle: 1 ... 4 5 6 ... 10
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const handlePrevious = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage && !isLoading) {
      onPageChange(page)
    }
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    if (onItemsPerPageChange && !isLoading) {
      // Calculate what the new current page should be to keep the user roughly in the same place
      const currentFirstItem = (currentPage - 1) * itemsPerPage + 1
      const newPage = Math.ceil(currentFirstItem / newItemsPerPage)
      onItemsPerPageChange(newItemsPerPage)
      onPageChange(newPage)
    }
  }

  if (totalPages <= 1 && !showPageInfo) {
    return null
  }

  return (
    <div className={`pagination-container ${className}`}>
      {/* Page Info */}
      {showPageInfo && (
        <div className="pagination-info">
          {totalItems > 0 ? (
            <>
              Showing <span style={{fontWeight: 'var(--font-medium)', color: 'var(--text-primary)'}}>{startItem}</span> to{' '}
              <span style={{fontWeight: 'var(--font-medium)', color: 'var(--text-primary)'}}>{endItem}</span> of{' '}
              <span style={{fontWeight: 'var(--font-medium)', color: 'var(--text-primary)'}}>{totalItems}</span> results
            </>
          ) : (
            'No results found'
          )}
        </div>
      )}

      {/* Items Per Page Selector */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div className="pagination-per-page">
          <label htmlFor="items-per-page">Show:</label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="pagination-select"
            disabled={isLoading}
          >
            {ITEMS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentPage <= 1 || isLoading}
            className="pagination-button"
          >
            Previous
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="pagination-ellipsis">...</span>
              ) : (
                <button
                  onClick={() => handlePageClick(page)}
                  disabled={isLoading}
                  className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages || isLoading}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="pagination-loading">
          <div className="pagination-spinner"></div>
          <span>Loading...</span>
        </div>
      )}
    </div>
  )
}

// Quick Jump Pagination Component for large datasets
export function QuickJumpPagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}) {
  const [jumpToPage, setJumpToPage] = React.useState('')

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = parseInt(jumpToPage)
    if (pageNum >= 1 && pageNum <= totalPages && !isLoading) {
      onPageChange(pageNum)
      setJumpToPage('')
    }
  }

  if (totalPages <= 10) {
    return null // Only show for large datasets
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-family-primary)'
    }}>
      <span style={{color: 'var(--text-secondary)'}}>Quick jump:</span>
      <form onSubmit={handleJumpSubmit} style={{display: 'flex', alignItems: 'center', gap: 'var(--space-1)'}}>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          placeholder="Page"
          className="pagination-select"
          style={{width: '64px'}}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!jumpToPage || isLoading}
          className="pagination-button"
        >
          Go
        </button>
      </form>
      <span style={{color: 'var(--text-tertiary)'}}>of {totalPages}</span>
    </div>
  )
}

// Compact Pagination for mobile or tight spaces
export function CompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}) {
  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
        className="p-2"
      >
        ←
      </Button>

      <span className="text-sm min-w-[4rem] text-center" style={{color: 'var(--text-secondary)'}}>
        {currentPage} / {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isLoading}
        className="p-2"
      >
        →
      </Button>
    </div>
  )
}