'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import LoginModal from '@/components/LoginModal'
import SignupModal from '@/components/SignupModal'
import ProductFilters, { ProductFiltersState } from '@/components/ProductFilters'
import Pagination, { QuickJumpPagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Product {
  asin: string
  title: string
  brand: string
  category: string
  price: {
    current: number
    original: number
    currency: string
    discountPercentage: number
  }
  availability: {
    inStock: boolean
    quantity: number
    shippingDays: number
    shippingCost: number
  }
  reviews: {
    rating: number
    count: number
    verified: boolean
  }
  images: string[]
  description: string
  seller: {
    name: string
    rating: number
    verified: boolean
  }
  specifications: {
    category: string
    size?: string
    color?: string
    condition?: string
  }
}

interface SearchResponse {
  products: Product[]
  metadata: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    filters: {
      availableCategories: Array<{ value: string; label: string; count: number }>
      availableBrands: Array<{ value: string; label: string; count: number }>
      priceRange: { min: number; max: number }
      availableConditions: Array<{ value: string; label: string; count: number }>
      availableSizes: Array<{ value: string; label: string; count: number }>
    }
  }
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

export default function SearchResults() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''

  console.log('DEBUG: SearchResults component rendered!')
  console.log('DEBUG: Initial query from URL:', query)

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_FILTERS)
  const [availableFilters, setAvailableFilters] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isInitialized, setIsInitialized] = useState(false)
  const [searchInProgress, setSearchInProgress] = useState(false)
  const searchTriggeredRef = useRef(false)

  console.log('DEBUG: All useState hooks initialized successfully')

  // Debug useEffect to track searchResults changes
  useEffect(() => {
    console.log('DEBUG: searchResults changed:', {
      hasResults: !!searchResults,
      productsCount: searchResults?.products?.length || 0,
      totalResults: searchResults?.metadata?.total || 0,
      loading: loading
    })
  }, [searchResults, loading])

  // Adapt the user object to match what Navigation expects
  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || '',
    userType: 'buyer' as const
  } : null

  // Simplified search function without useCallback to avoid stale closures
  const performSearch = async (
    searchQuery: string,
    currentFilters: ProductFiltersState,
    page: number,
    limit: number
  ) => {
    console.log('DEBUG: performSearch called with:', { searchQuery, page, limit })

    // Prevent multiple simultaneous searches
    if (searchInProgress) {
      console.log('DEBUG: Search already in progress, skipping')
      return
    }

    setSearchInProgress(true)
    setLoading(true)
    setError(null)

    try {
      const searchBody = {
        query: searchQuery,
        filters: {
          categories: currentFilters.categories,
          brands: currentFilters.brands,
          conditions: currentFilters.conditions,
          sizes: currentFilters.sizes,
          priceRange: currentFilters.priceRange
        },
        pagination: { page, limit },
        sorting: {
          field: currentFilters.sortBy,
          direction: currentFilters.sortDirection
        },
        includeMetadata: true
      }

      console.log('DEBUG: Making API call with body:', searchBody)

      // Fix URL parsing issue - use simple relative path
      const apiUrl = '/api/buyers/enhanced-search'
      console.log('DEBUG: Using API URL:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody)
      })

      console.log('DEBUG: API response:', response.ok, response.status)
      if (!response.ok) {
        throw new Error('Failed to fetch search results')
      }

      const data = await response.json()
      console.log('DEBUG: Search data received:', data?.products?.length || 0, 'products')
      console.log('DEBUG: Setting search results...')

      // Use functional update to ensure we have the latest state
      console.log('DEBUG: About to set search results')
      console.log('DEBUG: Raw API data:', JSON.stringify(data, null, 2))
      console.log('DEBUG: Data type:', typeof data)
      console.log('DEBUG: Data has products?', !!data?.products)
      console.log('DEBUG: Products array length:', data?.products?.length || 'N/A')

      setSearchResults((prevResults) => {
        console.log('DEBUG: Inside setSearchResults callback')
        console.log('DEBUG: Previous results:', prevResults)
        console.log('DEBUG: New data structure check:', {
          hasProducts: !!data?.products,
          isArray: Array.isArray(data?.products),
          productsLength: data?.products?.length,
          hasMetadata: !!data?.metadata
        })

        // Ensure we're returning a valid SearchResponse object
        if (!data || typeof data !== 'object' || !data.products) {
          console.error('DEBUG: Invalid SearchResponse received:', data)
          return null
        }

        return data
      })

      // Set available filters from search metadata
      if (data?.metadata?.filters) {
        setAvailableFilters(data.metadata.filters)
        console.log('DEBUG: Available filters set:', data.metadata.filters)
      }

      // Add a slight delay to check if state was updated
      setTimeout(() => {
        console.log('DEBUG: State after setTimeout check - searchResults should be updated now')
      }, 50)

      console.log('DEBUG: Search results set successfully')

    } catch (err) {
      console.error('DEBUG: Search error:', err)
      setError('Failed to load search results. Please try again.')
    } finally {
      console.log('DEBUG: Setting loading to false and search not in progress')
      setLoading(false)
      setSearchInProgress(false)
    }
  }

  // Main search effect - only trigger when query changes or component mounts
  useEffect(() => {
    const currentQuery = searchParams.get('q')

    if (!currentQuery?.trim()) {
      setLoading(false)
      setSearchResults(null)
      searchTriggeredRef.current = false
      return
    }

    // Reset search state when query changes
    if (query !== currentQuery) {
      setSearchResults(null)
      setLoading(true)
      searchTriggeredRef.current = false
    }

    // Only trigger search if not already in progress and not already triggered for this query
    if (!searchInProgress && !searchTriggeredRef.current) {
      searchTriggeredRef.current = true
      performSearch(currentQuery, filters, currentPage, itemsPerPage)
        .catch(err => {
          console.error('Search failed:', err)
          setError('Search failed')
          setLoading(false)
          setSearchInProgress(false)
          searchTriggeredRef.current = false
        })
    }
  }, [query])

  // Separate effect for when user changes filters/pagination - only for existing searches
  useEffect(() => {
    if (query && searchResults && !searchInProgress) {
      performSearch(query, filters, currentPage, itemsPerPage)
        .catch(err => {
          console.error('Filter search failed:', err)
          setError('Search failed')
        })
    }
  }, [filters.sortBy, filters.sortDirection, filters.categories, filters.brands, filters.conditions, filters.sizes, filters.priceRange.min, filters.priceRange.max, currentPage, itemsPerPage])

  const handleFiltersChange = (newFilters: ProductFiltersState) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Simple auth service for signup compatibility
  const authService = {
    signup: async (userData: any) => {
      console.log('Signup attempt:', userData)
    }
  }

  const renderProduct = (product: Product, index: number) => {
    const discount = product.price.discountPercentage
    const savings = product.price.original - product.price.current

    return (
      <div key={product.asin} className={viewMode === 'grid' ? 'product-card-modern' : 'product-card-list'}>
        {/* Product Image */}
        <div className="product-image-container">
          <img
            src={product.images[0] || '/placeholder-image.jpg'}
            alt={product.title}
            className="product-image"
          />
          {discount > 0 && (
            <div className="product-discount-badge">
              -{discount}%
            </div>
          )}
          {!product.availability.inStock && (
            <div className="product-out-of-stock">
              <span>Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info-container">
          {/* Brand and Rating */}
          <div className="product-brand-rating">
            <span className="product-brand">
              {product.brand}
            </span>
            <div className="product-rating">
              <span className="product-star">★</span>
              <span>{product.reviews.rating}</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="product-title">
            {product.title}
          </h3>

          {/* Specifications */}
          <div className="product-specs">
            {product.specifications.size && (
              <span className="product-spec-badge">
                {product.specifications.size}
              </span>
            )}
            {product.specifications.condition && (
              <span className="product-spec-badge">
                {product.specifications.condition}
              </span>
            )}
          </div>

          {/* Price Section */}
          <div className="product-pricing">
            <div className="product-price-row">
              <span className="product-current-price">
                ${product.price.current.toFixed(2)}
              </span>
              {discount > 0 && (
                <span className="product-original-price">
                  ${product.price.original.toFixed(2)}
                </span>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              className="product-add-to-cart"
              disabled={!product.availability.inStock}
            >
              {product.availability.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    )
  }


  // Debug logging - Fixed to show actual state
  console.log('DEBUG: Component state:', {
    loading,
    searchInProgress,
    hasSearchResults: searchResults !== null,
    searchResultsType: typeof searchResults,
    searchResultsLength: searchResults?.products?.length,
    error,
    query,
    isInitialized,
    searchTriggered: searchTriggeredRef.current
  })

  if (loading && !searchResults) {
    return (
      <div className="App">
        <Navigation
          user={appUser}
          onShowLogin={() => setShowLoginModal(true)}
          onShowSignup={() => setShowSignupModal(true)}
          onLogout={() => {}}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor: 'transparent transparent var(--accent-primary) transparent'}}></div>
            <h3 className="mt-4 text-xl" style={{color: 'var(--text-secondary)'}}>Searching for "{query}"...</h3>
            <p className="text-sm mt-2" style={{color: 'var(--text-tertiary)'}}>
              DEBUG: loading={loading.toString()}, hasResults={!!searchResults}, error={error || 'none'}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="App">
        <Navigation
          user={appUser}
          onShowLogin={() => setShowLoginModal(true)}
          onShowSignup={() => setShowSignupModal(true)}
          onLogout={() => {}}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <h3 className="font-semibold" style={{color: 'var(--error)'}}>Error</h3>
            <p style={{color: 'var(--error)'}}>{error}</p>
            <Button
              onClick={() => performSearch(query, filters, currentPage, itemsPerPage)}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="App">
      <Navigation
        user={appUser}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={() => {}}
      />

      <main className="container mx-auto px-4 py-8 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light mb-4" style={{
            color: 'var(--text-primary)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            letterSpacing: '-0.02em'
          }}>
            Search Results for "{query}"
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-lg" style={{
              color: 'var(--text-secondary)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              fontWeight: '400'
            }}>
              {searchResults?.metadata.total || 0} products found
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>View:</span>
              <button
                className={`btn-modern btn-modern-sm ${
                  viewMode === 'grid' ? 'btn-modern-default' : 'btn-modern-outline'
                }`}
                onClick={() => {
                  console.log('DEBUG: Grid button clicked, current viewMode:', viewMode)
                  setViewMode('grid')
                  console.log('DEBUG: setViewMode(grid) called')
                }}
              >
                Grid
              </button>
              <button
                className={`btn-modern btn-modern-sm ${
                  viewMode === 'list' ? 'btn-modern-default' : 'btn-modern-outline'
                }`}
                onClick={() => {
                  console.log('DEBUG: List button clicked, current viewMode:', viewMode)
                  setViewMode('list')
                  console.log('DEBUG: setViewMode(list) called')
                }}
              >
                List
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Filters Sidebar */}
          <div className="lg:w-1/5">
            <div className="sticky top-4">
              <ProductFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                availableFilters={availableFilters}
                isLoading={loading}
                showCounts={true}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {searchResults?.products && searchResults.products.length > 0 ? (
              <>
                {/* Top Pagination */}
                <div className="mb-6">
                  <Pagination
                    currentPage={searchResults.metadata.page}
                    totalPages={searchResults.metadata.totalPages}
                    totalItems={searchResults.metadata.total}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    isLoading={loading}
                  />
                </div>

                {/* Quick Jump for large datasets */}
                {searchResults.metadata.totalPages > 10 && (
                  <div className="mb-4 flex justify-center">
                    <QuickJumpPagination
                      currentPage={searchResults.metadata.page}
                      totalPages={searchResults.metadata.totalPages}
                      onPageChange={handlePageChange}
                      isLoading={loading}
                    />
                  </div>
                )}

                {/* AI Shopping Advisor */}
                {searchResults.aiResponse && (
                  <div className="card-modern mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="ai-icon">🤖</div>
                      <h2 style={{
                        fontSize: 'var(--text-xl)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-family-primary)',
                        margin: 0
                      }}>
                        AI Shopping Advisor
                      </h2>
                      <div style={{
                        padding: 'var(--space-1) var(--space-3)',
                        backgroundColor: searchResults.claudeAvailable ? 'var(--success-light)' : 'var(--warning-light)',
                        color: searchResults.claudeAvailable ? 'var(--success-dark)' : 'var(--warning-dark)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-medium)',
                        border: searchResults.claudeAvailable ? '1px solid var(--success)' : '1px solid var(--warning)'
                      }}>
                        {searchResults.claudeAvailable ? 'Claude AI' : 'Intelligent Fallback'}
                      </div>
                    </div>

                    <div style={{
                      fontSize: 'var(--text-sm)',
                      lineHeight: 'var(--leading-relaxed)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-family-primary)',
                      whiteSpace: 'pre-line'
                    }}>
                      {searchResults.aiResponse}
                    </div>

                    {searchResults.sustainabilityInsights && (
                      <div className="mt-4 pt-4" style={{borderTop: '1px solid var(--border-primary)'}}>
                        <div className="flex items-center gap-2 mb-3">
                          <span style={{fontSize: 'var(--text-lg)'}}>🌱</span>
                          <h3 style={{
                            fontSize: 'var(--text-md)',
                            fontWeight: 'var(--font-medium)',
                            color: 'var(--text-primary)',
                            margin: 0
                          }}>
                            Sustainability Impact
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="sustainability-metric">
                            <div style={{
                              fontSize: 'var(--text-lg)',
                              fontWeight: 'var(--font-bold)',
                              color: 'var(--success)'
                            }}>
                              {searchResults.sustainabilityInsights.carbonFootprintReduced}
                            </div>
                            <div style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-tertiary)'
                            }}>
                              CO₂ Saved
                            </div>
                          </div>
                          <div className="sustainability-metric">
                            <div style={{
                              fontSize: 'var(--text-lg)',
                              fontWeight: 'var(--font-bold)',
                              color: 'var(--success)'
                            }}>
                              {searchResults.sustainabilityInsights.itemsGivenSecondLife}
                            </div>
                            <div style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-tertiary)'
                            }}>
                              Items Rescued
                            </div>
                          </div>
                          <div className="sustainability-metric">
                            <div style={{
                              fontSize: 'var(--text-lg)',
                              fontWeight: 'var(--font-bold)',
                              color: 'var(--success)'
                            }}>
                              {searchResults.sustainabilityInsights.sustainabilityScore}
                            </div>
                            <div style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-tertiary)'
                            }}>
                              Eco Score
                            </div>
                          </div>
                          <div className="sustainability-metric">
                            <div style={{
                              fontSize: 'var(--text-lg)',
                              fontWeight: 'var(--font-bold)',
                              color: 'var(--success)'
                            }}>
                              {searchResults.sustainabilityInsights.equivalentNewItemsAvoided}
                            </div>
                            <div style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-tertiary)'
                            }}>
                              New Items Avoided
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Products */}
                <div className={
                  viewMode === 'grid'
                    ? "products-grid-modern"
                    : "products-list-modern"
                }>
                  {/* Debug: Log current viewMode and className */}
                  {console.log('DEBUG: Rendering products container with viewMode:', viewMode, 'className:', viewMode === 'grid' ? 'products-grid-modern' : 'products-list-modern')}
                  {searchResults.products.map((product, index) =>
                    renderProduct(product, index)
                  )}
                </div>

                {/* Bottom Pagination */}
                <div className="mt-8">
                  <Pagination
                    currentPage={searchResults.metadata.page}
                    totalPages={searchResults.metadata.totalPages}
                    totalItems={searchResults.metadata.total}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    isLoading={loading}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4" style={{color: 'var(--text-tertiary)'}}>🔍</div>
                <h3 className="text-xl mb-2" style={{color: 'var(--text-secondary)'}}>No products found</h3>
                <p className="mb-4" style={{color: 'var(--text-tertiary)'}}>
                  Try adjusting your search filters or search for different terms.
                </p>
                <Button onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <LoginModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
      />

      <SignupModal
        show={showSignupModal}
        onHide={() => setShowSignupModal(false)}
        onShowLogin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
        onSignup={authService.signup}
      />
    </div>
  )
}