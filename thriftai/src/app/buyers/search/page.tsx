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
import ChatSidebar from '@/components/ChatSidebar'
import LeaderboardCard from '@/components/LeaderboardCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

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
  // Veritas Score™ - 96-Parameter Universal Scoring
  veritasScore?: number  // Veritas Score™ (0-100 scale)
  veritasConfidence?: number
  veritasPillars?: {
    quality: number
    value: number
    trust: number
    ux: number
    sustainability: number
  }
  veritasInsights?: string[]
  veritasBadges?: string[]
  veritasRecommendation?: string
  veritasDataCompleteness?: number
  aiScore?: number  // Legacy field - mapped to veritasScore from API
  aiConfidence?: number  // Legacy field - mapped to veritasConfidence from API
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
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const searchTriggeredRef = useRef(false)


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

    // Prevent multiple simultaneous searches
    if (searchInProgress) {
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


      // Fix URL parsing issue - use simple relative path
      const apiUrl = '/api/buyers/enhanced-search'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody)
      })

      if (!response.ok) {
        throw new Error('Failed to fetch search results')
      }

      const data = await response.json()

      // Use functional update to ensure we have the latest state

      setSearchResults((prevResults) => {
        // Ensure we're returning a valid SearchResponse object
        if (!data || typeof data !== 'object' || !data.products) {
          console.error('Invalid SearchResponse received:', data)
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
            },
            // Include Veritas Score™ data if available
            veritasScore: mp.veritasScore,
            veritasConfidence: mp.veritasConfidence,
            veritasPillars: mp.veritasPillars,
            veritasInsights: mp.veritasInsights,
            veritasBadges: mp.veritasBadges,
            veritasRecommendation: mp.veritasRecommendation,
            veritasDataCompleteness: mp.veritasDataCompleteness
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
      }


    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to load search results. Please try again.')
    } finally {
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

  // Helper function to render star ratings
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </>
    )
  }

  const renderProduct = (product: Product, index: number) => {
    // Safety checks for price structure
    const currentPrice = product.price?.current ?? product.price ?? 0
    const originalPrice = product.price?.original ?? currentPrice
    const discount = product.price?.discountPercentage ?? 0
    const savings = originalPrice - currentPrice
    const hasVeritasScore = product.veritasScore !== undefined && product.veritasScore !== null

    return (
      <div key={product.asin} className={viewMode === 'grid' ? 'product-card-modern' : 'product-card-list'}>
        {/* Product Image */}
        <div className="product-image-container">
          <img
            src={product.images[0] || '/placeholder-image.jpg'}
            alt={product.title}
            className="product-image"
          />

          {/* Top 3 Golden Star Badge */}
          {index < 3 && (
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              left: '0.5rem',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#000',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-bold)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
              zIndex: 2
            }}>
              <Star size={12} fill="#000" />
              #{index + 1}
            </div>
          )}

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
          {/* Veritas Score™ Badge */}
          {hasVeritasScore && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              <div className={`px-2 py-1 rounded-md text-xs font-semibold ${
                product.veritasScore! >= 80 ? 'bg-green-600' :
                product.veritasScore! >= 70 ? 'bg-blue-600' :
                product.veritasScore! >= 60 ? 'bg-yellow-600' : 'bg-gray-600'
              }`}>
                Veritas: {product.veritasScore!.toFixed(0)}
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
              <span className="product-star">{renderStars(product.reviews.rating)}</span>
              <span>{product.reviews.rating}</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="product-title">
            {product.title.replace(/#\d+$/,'')}
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


  if (loading && !searchResults) {
    return (
      <div className="App flex-container">
        <ChatSidebar onCollapseChange={setIsChatCollapsed} />
        <div
          className="flex-1 flex-container-col"
          style={{
            marginRight: isChatCollapsed ? '0' : '420px',
            transition: 'margin-right 0.3s ease'
          }}
        >
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
            </div>
          </div>
          <Footer />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="App flex-container">
        <ChatSidebar onCollapseChange={setIsChatCollapsed} />
        <div
          className="flex-1 flex-container-col"
          style={{
            marginRight: isChatCollapsed ? '0' : '420px',
            transition: 'margin-right 0.3s ease'
          }}
        >
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
      </div>
    )
  }

  return (
    <div className="App flex-container">
      {/* AI Shopping Advisor Sidebar */}
      <ChatSidebar onCollapseChange={setIsChatCollapsed} />

      {/* Main Content Area - Add right margin when chat is expanded */}
      <div
        className="flex-1 flex-container-col"
        style={{
          marginRight: isChatCollapsed ? '0' : '420px',
          transition: 'margin-right 0.3s ease'
        }}
      >
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
                  setViewMode('grid')
                }}
              >
                Grid
              </button>
              <button
                className={`btn-modern btn-modern-sm ${
                  viewMode === 'list' ? 'btn-modern-default' : 'btn-modern-outline'
                }`}
                onClick={() => {
                  setViewMode('list')
                }}
              >
                List
              </button>
              <button
                className={`btn-modern btn-modern-sm ${
                  viewMode === 'leaderboard' ? 'btn-modern-default' : 'btn-modern-outline'
                }`}
                onClick={() => {
                  setViewMode('leaderboard')
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
                    {/* Sort products by Veritas Score™ (descending) and render as leaderboard */}
                    {searchResults.products
                      .slice()
                      .sort((a, b) => {
                        // Sort by Veritas Score™ - 96-parameter universal scoring
                        const scoreA = a.veritasScore || 0
                        const scoreB = b.veritasScore || 0
                        return scoreB - scoreA
                      })
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
                          veritasScore: product.veritasScore || 0,
                          veritasConfidence: product.veritasConfidence || 0,
                          veritasPillars: product.veritasPillars,
                          veritasInsights: product.veritasInsights || [],
                          veritasBadges: product.veritasBadges || [],
                          veritasRecommendation: product.veritasRecommendation,
                          veritasDataCompleteness: product.veritasDataCompleteness,
                          aiScore: product.veritasScore || 0,  // Legacy field - maps to veritasScore
                          aiConfidence: product.veritasConfidence || 0,  // Legacy field
                          aiScoreBreakdown: {
                            total: product.veritasScore || 0,
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