'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Product {
  id: string
  name: string
  category: string
  brand: string
  price: number
  originalPrice: number
  condition: string
  imageUrl: string | null
  isAvailable: boolean
  stockQuantity: number
  hasFreeShipping: boolean
  aiScore: number | null
  aiConfidence: number | null
  globalRank: number | null
  categoryRank: number | null
  leaderboardBadges: string[]
  dynamicSpecs: any
  companyMetrics: any
  createdAt: string
}

interface FilterOption {
  value: string
  label: string
  count: number
}

interface ApiResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  filters: {
    categories: FilterOption[]
    brands: FilterOption[]
    conditions: FilterOption[]
  }
  statistics: {
    total: number
    scored: number
    avgScore: number | null
    minScore: number | null
    maxScore: number | null
    avgPrice: number | null
    minPrice: number | null
    maxPrice: number | null
    available: number
    freeShipping: number
  }
}

export default function AdminProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [brand, setBrand] = useState(searchParams.get('brand') || '')
  const [condition, setCondition] = useState(searchParams.get('condition') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [minScore, setMinScore] = useState(searchParams.get('minScore') || '')
  const [maxScore, setMaxScore] = useState(searchParams.get('maxScore') || '')
  const [isAvailable, setIsAvailable] = useState(searchParams.get('isAvailable') || '')
  const [hasAIScore, setHasAIScore] = useState(searchParams.get('hasAIScore') || '')
  const [hasFreeShipping, setHasFreeShipping] = useState(searchParams.get('hasFreeShipping') || '')

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt')
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '50'))

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // UI states
  const [showFilters, setShowFilters] = useState(true)
  const [brandSearch, setBrandSearch] = useState('')

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      if (brand) params.set('brand', brand)
      if (condition) params.set('condition', condition)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (minScore) params.set('minScore', minScore)
      if (maxScore) params.set('maxScore', maxScore)
      if (isAvailable) params.set('isAvailable', isAvailable)
      if (hasAIScore) params.set('hasAIScore', hasAIScore)
      if (hasFreeShipping) params.set('hasFreeShipping', hasFreeShipping)
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      params.set('page', page.toString())
      params.set('limit', limit.toString())

      const response = await fetch(`/api/admin/products?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const result: ApiResponse = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [search, category, brand, condition, minPrice, maxPrice, minScore, maxScore,
      isAvailable, hasAIScore, hasFreeShipping, sortBy, sortOrder, page, limit])

  const resetFilters = () => {
    setSearch('')
    setCategory('')
    setBrand('')
    setCondition('')
    setMinPrice('')
    setMaxPrice('')
    setMinScore('')
    setMaxScore('')
    setIsAvailable('')
    setHasAIScore('')
    setHasFreeShipping('')
    setPage(1)
  }

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0
    if (search) count++
    if (category) count++
    if (brand) count++
    if (condition) count++
    if (minPrice) count++
    if (maxPrice) count++
    if (minScore) count++
    if (maxScore) count++
    if (isAvailable) count++
    if (hasAIScore) count++
    if (hasFreeShipping) count++
    return count
  }

  // Quick filter presets
  const applyQuickFilter = (preset: string) => {
    resetFilters()
    switch (preset) {
      case 'high-quality':
        setMinScore('60')
        setHasAIScore('true')
        break
      case 'low-stock':
        setIsAvailable('true')
        setSortBy('stockQuantity')
        setSortOrder('asc')
        break
      case 'best-deals':
        setHasFreeShipping('true')
        setSortBy('price')
        setSortOrder('asc')
        break
      case 'unscored':
        setHasAIScore('false')
        break
      case 'top-ranked':
        setSortBy('globalRank')
        setSortOrder('asc')
        break
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400'
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-blue-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBadge = (score: number | null) => {
    if (!score) return 'bg-gray-700'
    if (score >= 80) return 'bg-green-600'
    if (score >= 60) return 'bg-blue-600'
    if (score >= 40) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-full px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Product Database</h1>
              <p className="text-gray-400 text-sm mt-1">
                Advanced filtering and analytics dashboard
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                {viewMode === 'table' ? '📊 Grid View' : '📋 Table View'}
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Back to Store
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full px-8 py-6">
        {/* Statistics Bar */}
        {data?.statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Total Products</div>
              <div className="text-2xl font-bold text-blue-400">{data.statistics.total}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">AI Scored</div>
              <div className="text-2xl font-bold text-green-400">{data.statistics.scored}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Avg Score</div>
              <div className="text-2xl font-bold text-purple-400">
                {data.statistics.avgScore ? data.statistics.avgScore.toFixed(1) : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Score Range</div>
              <div className="text-sm font-bold text-yellow-400">
                {data.statistics.minScore?.toFixed(0)} - {data.statistics.maxScore?.toFixed(0)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Avg Price</div>
              <div className="text-2xl font-bold text-green-400">
                ${data.statistics.avgPrice ? data.statistics.avgPrice.toFixed(0) : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Price Range</div>
              <div className="text-sm font-bold text-blue-400">
                ${data.statistics.minPrice?.toFixed(0)} - ${data.statistics.maxPrice?.toFixed(0)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Available</div>
              <div className="text-2xl font-bold text-green-400">{data.statistics.available}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Free Ship</div>
              <div className="text-2xl font-bold text-blue-400">{data.statistics.freeShipping}</div>
            </div>
          </div>
        )}

        {/* Quick Filter Presets */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-400">Quick Filters:</span>
              <button
                onClick={() => applyQuickFilter('high-quality')}
                className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-sm border border-green-600/50"
              >
                🌟 High Quality (60+)
              </button>
              <button
                onClick={() => applyQuickFilter('low-stock')}
                className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded text-sm border border-yellow-600/50"
              >
                ⚠️ Low Stock Alert
              </button>
              <button
                onClick={() => applyQuickFilter('best-deals')}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-sm border border-blue-600/50"
              >
                💰 Best Deals
              </button>
              <button
                onClick={() => applyQuickFilter('unscored')}
                className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded text-sm border border-purple-600/50"
              >
                🔍 Needs Scoring
              </button>
              <button
                onClick={() => applyQuickFilter('top-ranked')}
                className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded text-sm border border-orange-600/50"
              >
                🏆 Top Ranked
              </button>
            </div>
            {getActiveFilterCount() > 0 && (
              <button
                onClick={resetFilters}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Clear All ({getActiveFilterCount()})
              </button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {getActiveFilterCount() > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-400">Active Filters:</span>
              {search && (
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  Search: {search}
                  <button onClick={() => setSearch('')} className="hover:text-blue-100">×</button>
                </span>
              )}
              {category && (
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  Category: {category.replace(/_/g, ' ')}
                  <button onClick={() => setCategory('')} className="hover:text-blue-100">×</button>
                </span>
              )}
              {brand && (
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  Brand: {brand}
                  <button onClick={() => setBrand('')} className="hover:text-blue-100">×</button>
                </span>
              )}
              {condition && (
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  Condition: {condition}
                  <button onClick={() => setCondition('')} className="hover:text-blue-100">×</button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  Price: ${minPrice || '0'} - ${maxPrice || '∞'}
                  <button onClick={() => { setMinPrice(''); setMaxPrice('') }} className="hover:text-blue-100">×</button>
                </span>
              )}
              {(minScore || maxScore) && (
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  Score: {minScore || '0'} - {maxScore || '100'}
                  <button onClick={() => { setMinScore(''); setMaxScore('') }} className="hover:text-blue-100">×</button>
                </span>
              )}
              {isAvailable && (
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  {isAvailable === 'true' ? 'Available' : 'Out of Stock'}
                  <button onClick={() => setIsAvailable('')} className="hover:text-blue-100">×</button>
                </span>
              )}
              {hasAIScore && (
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  {hasAIScore === 'true' ? 'AI Scored' : 'Not Scored'}
                  <button onClick={() => setHasAIScore('')} className="hover:text-blue-100">×</button>
                </span>
              )}
              {hasFreeShipping && (
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center gap-2">
                  Free Shipping
                  <button onClick={() => setHasFreeShipping('')} className="hover:text-blue-100">×</button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick Sort & View Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ color: '#ffffff', backgroundColor: '#374151' }}
                  className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="createdAt" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Date</option>
                  <option value="name" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Name</option>
                  <option value="price" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Price</option>
                  <option value="aiScore" style={{ backgroundColor: '#374151', color: '#ffffff' }}>AI Score</option>
                  <option value="globalRank" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Rank</option>
                  <option value="category" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Category</option>
                  <option value="brand" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Brand</option>
                </select>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-sm text-white"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Show:</label>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1) }}
                  style={{ color: '#ffffff', backgroundColor: '#374151' }}
                  className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="25" style={{ backgroundColor: '#374151', color: '#ffffff' }}>25</option>
                  <option value="50" style={{ backgroundColor: '#374151', color: '#ffffff' }}>50</option>
                  <option value="100" style={{ backgroundColor: '#374151', color: '#ffffff' }}>100</option>
                  <option value="200" style={{ backgroundColor: '#374151', color: '#ffffff' }}>200</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {data && `${data.pagination.total.toLocaleString()} products found`}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg mb-6 border border-gray-700">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Advanced Filters</h2>
              {getActiveFilterCount() > 0 && (
                <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs">
                  {getActiveFilterCount()}
                </span>
              )}
            </div>
            <span className="text-2xl text-gray-400">{showFilters ? '▼' : '▶'}</span>
          </button>

          {showFilters && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Search Products
                {search && (
                  <button
                    onClick={() => { setSearch(''); setPage(1) }}
                    className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    (Clear)
                  </button>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search name, brand, description..."
                  autoComplete="off"
                  style={{ color: '#ffffff' }}
                  className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-gray-700"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(''); setPage(1) }}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Category
                {category && (
                  <button
                    onClick={() => { setCategory(''); setPage(1) }}
                    className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    (Clear)
                  </button>
                )}
              </label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1) }}
                style={{ color: '#ffffff', backgroundColor: '#374151' }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" style={{ backgroundColor: '#374151', color: '#ffffff' }}>All Categories ({data?.filters.categories.reduce((sum, c) => sum + c.count, 0) || 0})</option>
                {data?.filters.categories.map(c => (
                  <option key={c.value} value={c.value} style={{ backgroundColor: '#374151', color: '#ffffff' }}>
                    {c.label} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Brand with Search */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Brand
                {brand && (
                  <span className="ml-2 text-xs text-blue-400">({brand})</span>
                )}
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    onFocus={() => setBrandSearch('')}
                    placeholder="Type to search brands..."
                    autoComplete="off"
                    style={{ color: '#ffffff' }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-gray-700"
                  />
                  {brand && (
                    <button
                      onClick={() => { setBrand(''); setBrandSearch(''); setPage(1) }}
                      className="absolute right-2 top-2 text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {brandSearch && (
                  <div className="max-h-48 overflow-y-auto bg-gray-700 border border-gray-600 rounded">
                    {data?.filters.brands
                      .filter(b => b.label.toLowerCase().includes(brandSearch.toLowerCase()))
                      .slice(0, 50)
                      .map(b => (
                        <button
                          key={b.value}
                          onClick={() => { setBrand(b.value); setBrandSearch(''); setPage(1) }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0"
                        >
                          <span className="font-medium">{b.label}</span>
                          <span className="text-gray-400 text-sm ml-2">({b.count})</span>
                        </button>
                      ))}
                    {data?.filters.brands.filter(b => b.label.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">No brands found</div>
                    )}
                  </div>
                )}
                {!brandSearch && brand && (
                  <div className="text-xs text-gray-500">
                    Selected: {brand}
                  </div>
                )}
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Condition
                {condition && (
                  <button
                    onClick={() => { setCondition(''); setPage(1) }}
                    className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    (Clear)
                  </button>
                )}
              </label>
              <select
                value={condition}
                onChange={(e) => { setCondition(e.target.value); setPage(1) }}
                style={{ color: '#ffffff', backgroundColor: '#374151' }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" style={{ backgroundColor: '#374151', color: '#ffffff' }}>All Conditions ({data?.filters.conditions.reduce((sum, c) => sum + c.count, 0) || 0})</option>
                {data?.filters.conditions.map(c => (
                  <option key={c.value} value={c.value} style={{ backgroundColor: '#374151', color: '#ffffff' }}>
                    {c.label} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Price Range
                {(minPrice || maxPrice) && (
                  <span className="ml-2 text-xs text-blue-400">
                    ${minPrice || '0'} - ${maxPrice || '∞'}
                  </span>
                )}
              </label>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
                      placeholder="Min"
                      autoComplete="off"
                      style={{ color: '#ffffff' }}
                      className="w-full pl-7 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-gray-700"
                    />
                  </div>
                </div>
                <span className="text-gray-500">—</span>
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
                      placeholder="Max"
                      autoComplete="off"
                      style={{ color: '#ffffff' }}
                      className="w-full pl-7 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <button
                  onClick={() => { setMinPrice(''); setMaxPrice('50'); setPage(1) }}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
                >
                  Under $50
                </button>
                <button
                  onClick={() => { setMinPrice('50'); setMaxPrice('200'); setPage(1) }}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
                >
                  $50-$200
                </button>
                <button
                  onClick={() => { setMinPrice('200'); setMaxPrice('500'); setPage(1) }}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
                >
                  $200-$500
                </button>
                <button
                  onClick={() => { setMinPrice('500'); setMaxPrice(''); setPage(1) }}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
                >
                  Over $500
                </button>
              </div>
            </div>

            {/* AI Score Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                AI Score Range
                {(minScore || maxScore) && (
                  <span className="ml-2 text-xs text-purple-400">
                    {minScore || '0'} - {maxScore || '100'}
                  </span>
                )}
              </label>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    value={minScore}
                    onChange={(e) => { setMinScore(e.target.value); setPage(1) }}
                    placeholder="Min (0)"
                    min="0"
                    max="100"
                    autoComplete="off"
                    style={{ color: '#ffffff' }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-gray-700"
                  />
                </div>
                <span className="text-gray-500">—</span>
                <div className="flex-1">
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => { setMaxScore(e.target.value); setPage(1) }}
                    placeholder="Max (100)"
                    min="0"
                    max="100"
                    autoComplete="off"
                    style={{ color: '#ffffff' }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-gray-700"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <button
                  onClick={() => { setMinScore('80'); setMaxScore(''); setPage(1) }}
                  className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-xs border border-green-600/50"
                >
                  Excellent (80+)
                </button>
                <button
                  onClick={() => { setMinScore('60'); setMaxScore('79'); setPage(1) }}
                  className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-xs border border-blue-600/50"
                >
                  Good (60-79)
                </button>
                <button
                  onClick={() => { setMinScore('40'); setMaxScore('59'); setPage(1) }}
                  className="px-2 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded text-xs border border-yellow-600/50"
                >
                  Fair (40-59)
                </button>
                <button
                  onClick={() => { setMinScore(''); setMaxScore('39'); setPage(1) }}
                  className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs border border-red-600/50"
                >
                  Poor (&lt;40)
                </button>
              </div>
            </div>

            {/* Boolean Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Availability
                {isAvailable && (
                  <button
                    onClick={() => { setIsAvailable(''); setPage(1) }}
                    className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    (Clear)
                  </button>
                )}
              </label>
              <select
                value={isAvailable}
                onChange={(e) => { setIsAvailable(e.target.value); setPage(1) }}
                style={{ color: '#ffffff', backgroundColor: '#374151' }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" style={{ backgroundColor: '#374151', color: '#ffffff' }}>All Products</option>
                <option value="true" style={{ backgroundColor: '#374151', color: '#ffffff' }}>✓ Available</option>
                <option value="false" style={{ backgroundColor: '#374151', color: '#ffffff' }}>✕ Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                AI Scored
                {hasAIScore && (
                  <button
                    onClick={() => { setHasAIScore(''); setPage(1) }}
                    className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    (Clear)
                  </button>
                )}
              </label>
              <select
                value={hasAIScore}
                onChange={(e) => { setHasAIScore(e.target.value); setPage(1) }}
                style={{ color: '#ffffff', backgroundColor: '#374151' }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" style={{ backgroundColor: '#374151', color: '#ffffff' }}>All Products</option>
                <option value="true" style={{ backgroundColor: '#374151', color: '#ffffff' }}>✓ Has AI Score</option>
                <option value="false" style={{ backgroundColor: '#374151', color: '#ffffff' }}>✕ Not Scored Yet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Free Shipping
                {hasFreeShipping && (
                  <button
                    onClick={() => { setHasFreeShipping(''); setPage(1) }}
                    className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    (Clear)
                  </button>
                )}
              </label>
              <select
                value={hasFreeShipping}
                onChange={(e) => { setHasFreeShipping(e.target.value); setPage(1) }}
                style={{ color: '#ffffff', backgroundColor: '#374151' }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" style={{ backgroundColor: '#374151', color: '#ffffff' }}>All Products</option>
                <option value="true" style={{ backgroundColor: '#374151', color: '#ffffff' }}>✓ Free Shipping</option>
                <option value="false" style={{ backgroundColor: '#374151', color: '#ffffff' }}>✕ Paid Shipping</option>
              </select>
            </div>
          </div>
            </div>
          )}
        </div>

        {/* Products */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading products...</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">AI Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {data?.products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded flex-shrink-0"></div>
                          <div>
                            <div className="font-medium text-white">{product.name}</div>
                            <div className="text-xs text-gray-400">{product.condition}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {product.category.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{product.brand}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-green-400">${product.price.toFixed(2)}</div>
                        {product.originalPrice > product.price && (
                          <div className="text-xs text-gray-500 line-through">
                            ${product.originalPrice.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {product.aiScore ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getScoreBadge(product.aiScore)}`}>
                              {product.aiScore.toFixed(1)}
                            </span>
                            {product.aiConfidence && (
                              <span className="text-xs text-gray-500">
                                ({(product.aiConfidence * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Not scored</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {product.globalRank ? (
                          <span className="text-yellow-400">#{product.globalRank}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{product.stockQuantity}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                            product.isAvailable ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                          }`}>
                            {product.isAvailable ? 'Available' : 'Out of Stock'}
                          </span>
                          {product.hasFreeShipping && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-400">
                              Free Ship
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} products
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2 px-4">
                    <span className="text-sm text-gray-400">
                      Page {page} of {data.pagination.totalPages}
                    </span>
                  </div>
                  <button
                    onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                    disabled={page === data.pagination.totalPages}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Grid View */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data?.products.map((product) => (
                <div key={product.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition">
                  <div className="relative mb-3">
                    <div className="w-full h-48 bg-gray-700 rounded"></div>
                    {product.aiScore && (
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold ${getScoreBadge(product.aiScore)}`}>
                        {product.aiScore.toFixed(1)}
                      </div>
                    )}
                    {product.globalRank && product.globalRank <= 100 && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold bg-yellow-600">
                        #{product.globalRank}
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-white mb-1 truncate">{product.name}</h3>
                  <p className="text-xs text-gray-400 mb-2">{product.brand} • {product.condition}</p>
                  <p className="text-xs text-gray-500 mb-3">{product.category.replace(/_/g, ' ')}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-lg font-bold text-green-400">${product.price.toFixed(2)}</div>
                      {product.originalPrice > product.price && (
                        <div className="text-xs text-gray-500 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Stock: {product.stockQuantity}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      product.isAvailable ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>
                      {product.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                    {product.hasFreeShipping && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-400">
                        Free Ship
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination for Grid */}
            {data && data.pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} products
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="flex items-center px-4">
                    <span className="text-sm text-gray-400">
                      Page {page} of {data.pagination.totalPages}
                    </span>
                  </div>
                  <button
                    onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                    disabled={page === data.pagination.totalPages}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
