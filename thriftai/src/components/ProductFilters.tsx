'use client'

import React, { useState, useEffect } from 'react'

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

function ProductFilters({
  filters,
  onFiltersChange,
  availableFilters,
  isLoading = false,
  showCounts = true
}: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceRange.min,
    filters.priceRange.max
  ])

  // Separate state for each section
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const [priceOpen, setPriceOpen] = useState(false)
  const [conditionOpen, setConditionOpen] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)
  const [showAllConditions, setShowAllConditions] = useState(false)
  const [showAllSizes, setShowAllSizes] = useState(false)

  // Update price range only when availableFilters changes
  useEffect(() => {
    if (availableFilters?.priceRange) {
      setPriceRange([availableFilters.priceRange.min, availableFilters.priceRange.max])
    }
  }, [availableFilters?.priceRange?.min, availableFilters?.priceRange?.max])

  const handleFilterChange = (newFilters: Partial<ProductFiltersState>) => {
    onFiltersChange({ ...filters, ...newFilters })
  }

  const handleArrayFilterToggle = (
    filterType: 'categories' | 'brands' | 'conditions' | 'sizes',
    value: string
  ) => {
    const currentArray = filters[filterType]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    handleFilterChange({ [filterType]: newArray })
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
    setPriceRange([clearedFilters.priceRange.min, clearedFilters.priceRange.max])
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = () => {
    return (
      filters.categories.length > 0 ||
      filters.brands.length > 0 ||
      filters.conditions.length > 0 ||
      filters.sizes.length > 0
    )
  }

  return (
    <div style={{
      background: 'var(--bg-glass)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-2xl)',
      backdropFilter: 'var(--backdrop-blur-lg)',
      padding: 'var(--space-4)',
      pointerEvents: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-3)',
        paddingBottom: 'var(--space-2)',
        borderBottom: '1px solid var(--border-primary)'
      }}>
        <h2 style={{
          fontSize: 'var(--text-base)',
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
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-medium)',
              cursor: 'pointer',
              transition: 'color var(--transition-fast)',
              fontFamily: 'var(--font-family-primary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort Section */}
      <div className="filter-section" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="filter-section-header" style={{marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)'}}>
          <span>Sort by</span>
        </div>
        <select
          value={`${filters.sortBy}:${filters.sortDirection}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split(':') as [ProductFiltersState['sortBy'], 'asc' | 'desc']
            handleFilterChange({
              sortBy: field,
              sortDirection: direction
            })
          }}
          className="filter-dropdown"
          disabled={isLoading}
          style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-2)' }}
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

      {/* Applied Filters */}
      {hasActiveFilters() && (
        <div className="filter-section" style={{ marginBottom: 'var(--space-3)' }}>
          <div className="filter-section-header" style={{marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)'}}>
            <span>Applied</span>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)'}}>
            {filters.categories.map(category => (
              <button
                key={category}
                className="filter-badge"
                onClick={() => handleArrayFilterToggle('categories', category)}
                style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)' }}
              >
                {availableFilters?.categories.find(c => c.value === category)?.label || category}
                <span className="filter-badge-close">×</span>
              </button>
            ))}
            {filters.brands.map(brand => (
              <button
                key={brand}
                className="filter-badge"
                onClick={() => handleArrayFilterToggle('brands', brand)}
                style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)' }}
              >
                {brand}
                <span className="filter-badge-close">×</span>
              </button>
            ))}
            {filters.conditions.map(condition => (
              <button
                key={condition}
                className="filter-badge"
                onClick={() => handleArrayFilterToggle('conditions', condition)}
                style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)' }}
              >
                {condition}
                <span className="filter-badge-close">×</span>
              </button>
            ))}
            {filters.sizes.map(size => (
              <button
                key={size}
                className="filter-badge"
                onClick={() => handleArrayFilterToggle('sizes', size)}
                style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)' }}
              >
                Size {size}
                <span className="filter-badge-close">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Section */}
      {availableFilters?.categories && availableFilters.categories.length > 0 && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <div
            onClick={() => setCategoryOpen(!categoryOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: 'var(--space-2) 0',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)',
              userSelect: 'none'
            }}
          >
            <span>Category</span>
            <span style={{
              transform: categoryOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)'
            }}>▼</span>
          </div>
          {categoryOpen && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
              gap: 'var(--space-1)',
              marginTop: 'var(--space-2)'
            }}>
              {availableFilters.categories.slice(0, 8).map((option) => {
                const isSelected = filters.categories.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => handleArrayFilterToggle('categories', option.value)}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 'var(--space-1)',
                      background: isSelected
                        ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                        : 'var(--bg-secondary)',
                      border: isSelected
                        ? '2px solid var(--accent-primary)'
                        : '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: 'var(--text-2xs)',
                      fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-medium)',
                      color: isSelected ? 'white' : 'var(--text-primary)',
                      textAlign: 'center'
                    }}
                  >
                    <div>{option.label}</div>
                    {showCounts && <div style={{ fontSize: 'var(--text-2xs)', marginTop: '2px' }}>({option.count})</div>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Price Range Section */}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div
          onClick={() => setPriceOpen(!priceOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: 'var(--space-2) 0',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
            userSelect: 'none'
          }}
        >
          <span>Price Range</span>
          <span style={{
            transform: priceOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)'
          }}>▼</span>
        </div>
        {priceOpen && (
          <div style={{ marginTop: 'var(--space-2)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)'
            }}>
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-2xs)',
                  color: 'var(--text-tertiary)',
                  marginBottom: 'var(--space-1)'
                }}>Min</label>
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                  onBlur={handlePriceRangeCommit}
                  style={{
                    width: '100%',
                    padding: 'var(--space-1)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-2xs)',
                  color: 'var(--text-tertiary)',
                  marginBottom: 'var(--space-1)'
                }}>Max</label>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                  onBlur={handlePriceRangeCommit}
                  style={{
                    width: '100%',
                    padding: 'var(--space-1)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Brand Section */}
      {availableFilters?.brands && availableFilters.brands.length > 0 && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <div
            onClick={() => setBrandOpen(!brandOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: 'var(--space-2) 0',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)',
              userSelect: 'none'
            }}
          >
            <span>Brand</span>
            <span style={{
              transform: brandOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)'
            }}>▼</span>
          </div>
          {brandOpen && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
              gap: 'var(--space-1)',
              marginTop: 'var(--space-2)'
            }}>
              {availableFilters.brands.slice(0, 8).map((option) => {
                const isSelected = filters.brands.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => handleArrayFilterToggle('brands', option.value)}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 'var(--space-1)',
                      background: isSelected
                        ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                        : 'var(--bg-secondary)',
                      border: isSelected
                        ? '2px solid var(--accent-primary)'
                        : '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: 'var(--text-2xs)',
                      fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-medium)',
                      color: isSelected ? 'white' : 'var(--text-primary)',
                      textAlign: 'center'
                    }}
                  >
                    <div>{option.label}</div>
                    {showCounts && <div style={{ fontSize: 'var(--text-2xs)', marginTop: '2px' }}>({option.count})</div>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Condition Section */}
      {availableFilters?.conditions && availableFilters.conditions.length > 0 && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <div
            onClick={() => setConditionOpen(!conditionOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: 'var(--space-2) 0',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)',
              userSelect: 'none'
            }}
          >
            <span>Condition</span>
            <span style={{
              transform: conditionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)'
            }}>▼</span>
          </div>
          {conditionOpen && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              {(showAllConditions ? availableFilters.conditions : availableFilters.conditions.slice(0, 6)).map((option) => (
                <div
                  key={option.value}
                  className="filter-option"
                  onClick={() => handleArrayFilterToggle('conditions', option.value)}
                  style={{ padding: 'var(--space-1) 0', fontSize: 'var(--text-sm)' }}
                >
                  <div className={`filter-checkbox ${filters.conditions.includes(option.value) ? 'checked' : ''}`} />
                  <span className="filter-label" style={{ fontSize: 'var(--text-sm)' }}>{option.label}</span>
                  {showCounts && <span className="filter-count" style={{ fontSize: 'var(--text-xs)' }}>({option.count})</span>}
                </div>
              ))}
              {availableFilters.conditions.length > 6 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAllConditions(!showAllConditions)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    padding: 'var(--space-1) 0'
                  }}
                >
                  {showAllConditions ? 'Show Less' : `+ ${availableFilters.conditions.length - 6} more`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Size Section */}
      {availableFilters?.sizes && availableFilters.sizes.length > 0 && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <div
            onClick={() => setSizeOpen(!sizeOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: 'var(--space-2) 0',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)',
              userSelect: 'none'
            }}
          >
            <span>Size</span>
            <span style={{
              transform: sizeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)'
            }}>▼</span>
          </div>
          {sizeOpen && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              {(showAllSizes ? availableFilters.sizes : availableFilters.sizes.slice(0, 6)).map((option) => (
                <div
                  key={option.value}
                  className="filter-option"
                  onClick={() => handleArrayFilterToggle('sizes', option.value)}
                  style={{ padding: 'var(--space-1) 0', fontSize: 'var(--text-sm)' }}
                >
                  <div className={`filter-checkbox ${filters.sizes.includes(option.value) ? 'checked' : ''}`} />
                  <span className="filter-label" style={{ fontSize: 'var(--text-sm)' }}>{option.label}</span>
                  {showCounts && <span className="filter-count" style={{ fontSize: 'var(--text-xs)' }}>({option.count})</span>}
                </div>
              ))}
              {availableFilters.sizes.length > 6 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAllSizes(!showAllSizes)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    padding: 'var(--space-1) 0'
                  }}
                >
                  {showAllSizes ? 'Show Less' : `+ ${availableFilters.sizes.length - 6} more`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductFilters
