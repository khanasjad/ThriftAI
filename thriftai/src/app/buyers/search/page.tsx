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
import EnhancedComparisonTable from '@/components/EnhancedComparisonTable'
import ChatSidebar from '@/components/ChatSidebar'
import LeaderboardCard from '@/components/LeaderboardCard'
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
  // AI Scoring fields
  aiScore?: number
  aiConfidence?: number
  isHighQuality?: boolean
  leaderboardRank?: number
  // NEW: Intelligence Layer fields
  intelligenceScore?: number
  reasoning?: string
  pros?: string[]
  cons?: string[]
  bestFor?: string
  intelligenceRank?: number
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
  comparisonData?: {
    topProducts: any[]
    insights: any
  }
  // AI Scoring insights
  aiInsights?: {
    averageScore?: number
    highQualityCount?: number
    priceIntentDetected?: boolean
    priceRange?: { min: number; max: number }
    // NEW: Intelligence layer insights
    intelligenceApplied?: boolean
    queryUnderstanding?: string
    overallInsight?: string
    recommendations?: string[]
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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'leaderboard'>('grid')
  const [expandedLeaderboardCard, setExpandedLeaderboardCard] = useState<string | null>(null)
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
      console.log('DEBUG: ComparisonData available:', !!data?.comparisonData, 'with', data?.comparisonData?.topProducts?.length || 0, 'products')
      console.log('DEBUG: Setting search results...')

      // Use functional update to ensure we have the latest state
      console.log('DEBUG: About to set search results')
      console.log('DEBUG: Raw API data:', JSON.stringify(data, null, 2))
      console.log('DEBUG: Data type:', typeof data)
      console.log('DEBUG: Data has products?', !!data?.products)
      console.log('DEBUG: Products array length:', data?.products?.length || 'N/A')
      console.log('DEBUG: ComparisonData products:', data?.comparisonData?.topProducts?.length || 0)

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

        // 🤖 AI ENHANCEMENT: When database has 0 products but marketplace has results,
        // convert marketplace products to main product format for display
        if (data.products.length === 0 && data.comparisonData?.topProducts?.length > 0) {
          console.log('🤖 Converting marketplace products to main display format')
          const convertedProducts = data.comparisonData.topProducts.map((mp: any) => ({
            asin: mp.id || mp.asin || `marketplace-${Date.now()}-${Math.random()}`,
            title: mp.title || mp.name || 'Product',
            brand: mp.brand || mp.seller || 'Various',
            category: mp.category || 'GENERAL',
            price: {
              current: mp.price || mp.totalCost || 0,
              original: mp.originalPrice || mp.totalCost || 0,
              currency: 'USD',
              discountPercentage: mp.discountPercentage || 0
            },
            availability: {
              inStock: mp.availability !== false && mp.inStock !== false,
              quantity: mp.quantity || 1,
              shippingDays: mp.shippingDays || 5,
              shippingCost: mp.shippingCost || 0
            },
            reviews: {
              rating: mp.rating || mp.reviews?.rating || 4.0,
              count: mp.reviewCount || mp.reviews?.count || 0,
              verified: true
            },
            images: mp.images || mp.imageUrl ? [mp.imageUrl || mp.images[0]] : ['/placeholder-image.jpg'],
            description: mp.description || mp.title || 'AI-recommended product from marketplace',
            seller: {
              name: mp.source || mp.marketplace || 'Marketplace',
              rating: mp.sellerRating || 4.5,
              verified: true
            },
            specifications: {
              category: mp.category || 'GENERAL',
              condition: mp.condition || 'Used - Good',
              size: mp.size,
              color: mp.color
            }
          }))

          console.log(`✅ Converted ${convertedProducts.length} marketplace products to main display`)

          return {
            ...data,
            products: convertedProducts,
            metadata: {
              ...data.metadata,
              total: convertedProducts.length,
              totalPages: 1,
              page: 1
            }
          }
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
    // Safety checks for price structure
    const currentPrice = product.price?.current ?? product.price ?? 0
    const originalPrice = product.price?.original ?? currentPrice
    const discount = product.price?.discountPercentage ?? 0
    const savings = originalPrice - currentPrice
    const hasAIScore = product.aiScore !== undefined && product.aiScore !== null

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
          {/* AI Score Badge */}
          {hasAIScore && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              <div className={`px-2 py-1 rounded-md text-xs font-semibold ${
                product.aiScore! >= 80 ? 'bg-green-600' :
                product.aiScore! >= 60 ? 'bg-blue-600' :
                product.aiScore! >= 40 ? 'bg-yellow-600' : 'bg-gray-600'
              }`}>
                AI Score: {product.aiScore!.toFixed(0)}
              </div>
              {product.isHighQuality && (
                <div className="px-2 py-1 rounded-md text-xs font-semibold bg-purple-600">
                  ⭐ Top Quality
                </div>
              )}
              {product.leaderboardRank && product.leaderboardRank <= 100 && (
                <div className="px-2 py-1 rounded-md text-xs font-semibold bg-orange-600">
                  #{product.leaderboardRank} Global
                </div>
              )}
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
                ${currentPrice.toFixed(2)}
              </span>
              {discount > 0 && (
                <span className="product-original-price">
                  ${originalPrice.toFixed(2)}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto spinner"></div>
            <h3 className="mt-4 text-xl page-subtitle">Searching for "{query}"...</h3>
            <p className="text-sm mt-2 empty-state-description">
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
            <h3 className="font-semibold empty-state-title" style={{color: 'var(--error)'}}>Error</h3>
            <p className="empty-state-description" style={{color: 'var(--error)'}}>{error}</p>
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
    <div className="App flex-container">
      {/* AI Shopping Advisor Sidebar */}
      <ChatSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex-container-col">
        <Navigation
          user={appUser}
          onShowLogin={() => setShowLoginModal(true)}
          onShowSignup={() => setShowSignupModal(true)}
          onLogout={() => {}}
        />

        <main className="container mx-auto px-4 py-8 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light mb-4 page-header">
            Search Results for "{query}"
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-lg page-subtitle">
              {searchResults?.metadata.total || 0} products found
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium page-subtitle">View:</span>
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
              <button
                className={`btn-modern btn-modern-sm ${
                  viewMode === 'leaderboard' ? 'btn-modern-default' : 'btn-modern-outline'
                }`}
                onClick={() => {
                  console.log('DEBUG: Leaderboard button clicked, current viewMode:', viewMode)
                  setViewMode('leaderboard')
                  console.log('DEBUG: setViewMode(leaderboard) called')
                }}
              >
                Leaderboard
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
            {/* AI-Powered Marketplace Comparison - Only show in grid/list view (not leaderboard) */}
            {!loading && viewMode !== 'leaderboard' && searchResults?.products && searchResults.products.length > 0 && searchResults.comparisonData?.topProducts && searchResults.comparisonData.topProducts.length > 0 && (
              <div className="mb-6">
                <EnhancedComparisonTable
                  topProducts={searchResults.comparisonData.topProducts}
                  insights={searchResults.comparisonData.insights}
                  onProductClick={(product) => {
                    console.log('Product clicked:', product)
                    // Track click for analytics
                  }}
                />
              </div>
            )}

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

                {/* Products */}
                {viewMode === 'leaderboard' ? (
                  <div className="flex flex-col gap-4">
                    {/* Sort products by AI score (descending) and render as leaderboard */}
                    {searchResults.products
                      .slice()
                      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
                      .map((product, index) => {
                        // Map search page Product to LeaderboardCard's expected format
                        const leaderboardProduct = {
                          id: product.asin,
                          name: product.title,
                          brand: product.brand,
                          category: product.category,
                          price: {
                            current: product.price.current,
                            original: product.price.original
                          },
                          originalPrice: product.price.original,
                          condition: product.specifications?.condition || 'Used - Good',
                          aiScore: product.aiScore || 0,
                          aiConfidence: product.aiConfidence || 0,
                          aiScoreBreakdown: {
                            total: product.aiScore || 0,
                            components: {
                              relevance: 0,
                              priceValue: 0,
                              trustScore: 0,
                              qualityScore: 0,
                              socialProof: 0,
                              convenience: 0,
                              urgency: 0,
                              emotional: 0,
                              specsQuality: 0
                            },
                            recommendation: product.isHighQuality ? 'strong-buy' : 'consider',
                            insights: []
                          },
                          stockQuantity: product.availability?.quantity,
                          shippingCost: product.availability?.shippingCost,
                          hasFreeShipping: product.availability?.shippingCost === 0,
                          estimatedDeliveryDays: product.availability?.shippingDays,
                          hasFreeReturns: false,
                          dynamicSpecs: product.specifications || {}
                        }

                        return (
                          <LeaderboardCard
                            key={product.asin}
                            product={leaderboardProduct}
                            rank={index + 1}
                            isExpanded={expandedLeaderboardCard === product.asin}
                            onToggleExpand={() => {
                              setExpandedLeaderboardCard(
                                expandedLeaderboardCard === product.asin ? null : product.asin
                              )
                            }}
                          />
                        )
                      })}
                  </div>
                ) : (
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
                )}

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
              // Only show "No products found" if there's also no comparison data
              !searchResults?.comparisonData?.topProducts?.length && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 empty-state-icon">🔍</div>
                  <h3 className="text-xl mb-2 empty-state-title">No products found</h3>
                  <p className="mb-4 empty-state-description">
                    Try adjusting your search filters or search for different terms.
                  </p>
                  <Button onClick={() => setFilters(DEFAULT_FILTERS)}>
                    Clear All Filters
                  </Button>
                </div>
              )
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
    </div>
  )
}