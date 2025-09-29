'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

interface FilterOption {
  value: string
  label: string
  count: number
}

export interface ProductFiltersState {
  categories: string[]
  brands: string[]
  conditions: string[]
  sizes: string[]
  priceRange: {
    min: number
    max: number
  }
  sortBy: 'relevance' | 'price' | 'name' | 'createdAt' | 'brand'
  sortDirection: 'asc' | 'desc'
}

interface ProductFiltersProps {
  filters: ProductFiltersState
  onFiltersChange: (filters: ProductFiltersState) => void
  availableFilters?: {
    categories: FilterOption[]
    brands: FilterOption[]
    conditions: FilterOption[]
    sizes: FilterOption[]
    priceRange: { min: number; max: number }
  }
  isLoading?: boolean
  showCounts?: boolean
}

const DEFAULT_FILTERS: ProductFiltersState = {
  categories: [],
  brands: [],
  conditions: [],
  sizes: [],
  priceRange: { min: 0, max: 1000 },
  sortBy: 'relevance',
  sortDirection: 'desc'
}

export default function ProductFilters({
  filters,
  onFiltersChange,
  availableFilters,
  isLoading = false,
  showCounts = true
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProductFiltersState>(filters)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceRange.min,
    filters.priceRange.max
  ])

  // Update local state when props change
  useEffect(() => {
    setLocalFilters(filters)
    // Use available price range if available, otherwise use filter values
    const minPrice = availableFilters?.priceRange?.min ?? filters.priceRange.min
    const maxPrice = availableFilters?.priceRange?.max ?? filters.priceRange.max
    setPriceRange([minPrice, maxPrice])
  }, [filters, availableFilters])

  const handleFilterChange = (newFilters: Partial<ProductFiltersState>) => {
    const updatedFilters = { ...localFilters, ...newFilters }
    setLocalFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const handleArrayFilterToggle = (
    filterType: 'categories' | 'brands' | 'conditions' | 'sizes',
    value: string
  ) => {
    const currentArray = localFilters[filterType]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]

    handleFilterChange({ [filterType]: newArray })
  }

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange([values[0], values[1]])
  }

  const handlePriceRangeCommit = () => {
    handleFilterChange({
      priceRange: { min: priceRange[0], max: priceRange[1] }
    })
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      ...DEFAULT_FILTERS,
      priceRange: availableFilters?.priceRange || { min: 0, max: 1000 }
    }
    setLocalFilters(clearedFilters)
    setPriceRange([clearedFilters.priceRange.min, clearedFilters.priceRange.max])
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = () => {
    return (
      localFilters.categories.length > 0 ||
      localFilters.brands.length > 0 ||
      localFilters.conditions.length > 0 ||
      localFilters.sizes.length > 0
    )
  }

  const renderFilterSection = (
    title: string,
    options: FilterOption[],
    selectedValues: string[],
    filterType: 'categories' | 'brands' | 'conditions' | 'sizes',
    maxShow: number = 8
  ) => {
    const [showAll, setShowAll] = useState(false)
    const [isExpanded, setIsExpanded] = useState(true)
    const displayOptions = showAll ? options : options.slice(0, maxShow)

    if (!options.length) return null

    return (
      <div className="filter-section">
        <button
          className="filter-section-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{title}</span>
          <span className={`filter-section-toggle ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>

        {isExpanded && (
          <div>
            {displayOptions.map((option) => (
              <div
                key={option.value}
                className="filter-option"
                onClick={() => handleArrayFilterToggle(filterType, option.value)}
              >
                <div className={`filter-checkbox ${selectedValues.includes(option.value) ? 'checked' : ''}`} />
                <span className="filter-label">{option.label}</span>
                {showCounts && (
                  <span className="filter-count">({option.count})</span>
                )}
              </div>
            ))}

            {options.length > maxShow && (
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  padding: 'var(--space-2) 0',
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--accent-secondary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--accent-primary)'}
              >
                {showAll ? 'Show Less' : `+ ${options.length - maxShow} more`}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card-modern">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-6)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--border-primary)'
      }}>
        <h2 style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-family-primary)',
          margin: 0
        }}>
          Filters
        </h2>
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              cursor: 'pointer',
              transition: 'color var(--transition-fast)',
              fontFamily: 'var(--font-family-primary)'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent-secondary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--accent-primary)'}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort Section */}
      <div className="filter-section">
        <div className="filter-section-header" style={{marginBottom: 'var(--space-3)'}}>
          <span>Sort by</span>
        </div>
        <select
          value={`${localFilters.sortBy}:${localFilters.sortDirection}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split(':') as [ProductFiltersState['sortBy'], 'asc' | 'desc']
            handleFilterChange({
              sortBy: field,
              sortDirection: direction
            })
          }}
          className="filter-dropdown"
          disabled={isLoading}
        >
          <option value="relevance:desc">Featured</option>
          <option value="price:asc">Price: Low to High</option>
          <option value="price:desc">Price: High to Low</option>
          <option value="name:asc">Name: A to Z</option>
          <option value="name:desc">Name: Z to A</option>
          <option value="createdAt:desc">Newest First</option>
          <option value="createdAt:asc">Oldest First</option>
          <option value="brand:asc">Brand: A to Z</option>
          <option value="brand:desc">Brand: Z to A</option>
        </select>
      </div>


      {/* Active Filters */}
      {hasActiveFilters() && (
        <div className="filter-section">
          <div className="filter-section-header" style={{marginBottom: 'var(--space-3)'}}>
            <span>Applied Filters</span>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)'}}>
            {localFilters.categories.map(category => (
              <button
                key={category}
                className="filter-badge"
                onClick={() => handleArrayFilterToggle('categories', category)}
              >
                {availableFilters?.categories.find(c => c.value === category)?.label || category}
                <span className="filter-badge-close">×</span>
              </button>
            ))}
            {localFilters.brands.map(brand => (
              <button
                key={brand}
                className="filter-badge"
                onClick={() => handleArrayFilterToggle('brands', brand)}
              >
                {brand}
                <span className="filter-badge-close">×</span>
              </button>
            ))}
            {localFilters.conditions.map(condition => (
              <button
                key={condition}
                className="filter-badge"
                onClick={() => handleArrayFilterToggle('conditions', condition)}
              >
                {condition}
                <span className="filter-badge-close">×</span>
              </button>
            ))}
            {localFilters.sizes.map(size => (
              <button
                key={size}
                className="filter-badge"
                onClick={() => handleArrayFilterToggle('sizes', size)}
              >
                Size {size}
                <span className="filter-badge-close">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      {availableFilters?.categories && renderFilterSection(
        'Category',
        availableFilters.categories,
        localFilters.categories,
        'categories'
      )}

      {availableFilters?.brands && renderFilterSection(
        'Brand',
        availableFilters.brands,
        localFilters.brands,
        'brands'
      )}

      {availableFilters?.conditions && renderFilterSection(
        'Condition',
        availableFilters.conditions,
        localFilters.conditions,
        'conditions'
      )}

      {availableFilters?.sizes && renderFilterSection(
        'Size',
        availableFilters.sizes,
        localFilters.sizes,
        'sizes'
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-8)',
          color: 'var(--text-tertiary)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid transparent',
            borderTop: '2px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto var(--space-3) auto'
          }} />
          <p style={{
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-family-primary)',
            margin: 0
          }}>
            Loading filters...
          </p>
        </div>
      )}
    </div>
  )
}