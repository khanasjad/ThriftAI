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
import ProductCard from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { SwipeDeck } from '@/app/swipe/components/SwipeDeck'
import type { SwipeProduct } from '@/lib/stores/swipeStore'
import ProductDetailModal from '@/components/ProductDetailModal'
import VisualSearchUpload from '@/components/visual-search/VisualSearchUpload'

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
  // 96-Parameter Enriched Data
  dynamicSpecs?: Record<string, any>
  companyMetrics?: {
    esgScore?: number
    carbonFootprint?: number
    sustainabilityRating?: number
    laborPractices?: number
    supplyChainTransparency?: number
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
  // Claude semantic search response format
  query?: {
    original: string
    normalized: string
    intent: string
    confidence: number
  }
  results?: any[] // Claude results format
  insights?: {
    overallAnalysis: string
    topRecommendation?: string
    priceInsight?: string
    qualityInsight?: string
  }
}

const DEFAULT_FILTERS: ProductFiltersState = {
  categories: [],
  brands: [],
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
  const { addToCart, isLoading: cartLoading } = useCartStore()

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_FILTERS)
  const [availableFilters, setAvailableFilters] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'leaderboard' | 'swipe' | 'visual'>('grid')
  const [expandedLeaderboardCard, setExpandedLeaderboardCard] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [searchInProgress, setSearchInProgress] = useState(false)
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const searchTriggeredRef = useRef(false)
  const [displayQuery, setDisplayQuery] = useState(query) // Track current display query
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [likedProducts, setLikedProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size for responsive margin
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Reset display query when URL query changes
  useEffect(() => {
    setDisplayQuery(query)
  }, [query])

  // Handle products from AI - update search grid with AI-selected products
  const handleProductsFromAI = useCallback((products: any[], queryInfo: any) => {
    console.log('📦 Received AI-selected products:', products.length)

    // Update display query if this came from chat
    if (queryInfo?.query && queryInfo?.source === 'chat') {
      setDisplayQuery(queryInfo.query)
    }

    // Convert AI products to SearchResponse format
    const aiSearchResponse: SearchResponse = {
      products: products.map(p => ({
        asin: p.id || p.asin || `ai-${Date.now()}-${Math.random()}`,
        title: p.name || p.title || 'Product',
        brand: p.brand || 'Various',
        category: p.category || 'GENERAL',
        price: {
          current: p.price?.current || p.price || p.totalCost || 0,
          original: p.price?.original || p.originalPrice || p.price || p.totalCost || 0,
          currency: 'USD',
          discountPercentage: p.price?.discountPercentage || 0
        },
        availability: {
          inStock: p.availability !== false && p.inStock !== false,
          quantity: p.stockQuantity || p.quantity || 1,
          shippingDays: p.estimatedDeliveryDays || p.shippingDays || 5,
          shippingCost: p.shippingCost || 0
        },
        reviews: {
          rating: p.rating || p.reviews?.rating || 4.0,
          count: p.reviewCount || p.reviews?.count || 0,
          verified: true
        },
        images: p.images || (p.imageUrl ? [p.imageUrl] : ['/placeholder-image.jpg']),
        description: p.description || p.title || 'AI-recommended product',
        seller: {
          name: p.seller?.name || p.source || 'Veritas.ai',
          rating: p.seller?.rating || 4.5,
          verified: true
        },
        specifications: {
          category: p.category || 'GENERAL',
          condition: p.condition || 'Used - Good',
          size: p.size,
          color: p.color
        },
        veritasScore: p.veritasScore,
        veritasConfidence: p.veritasConfidence,
        veritasPillars: p.veritasPillars,
        veritasInsights: p.veritasInsights,
        veritasBadges: p.veritasBadges,
        veritasRecommendation: p.veritasRecommendation,
        veritasDataCompleteness: p.veritasDataCompleteness,
        aiScore: p.veritasScore || p.aiScore,
        aiConfidence: p.veritasConfidence || p.aiConfidence,
        isHighQuality: p.isHighQuality || (p.veritasScore && p.veritasScore >= 80),
        dynamicSpecs: p.dynamicSpecs,
        companyMetrics: p.companyMetrics
      })),
      metadata: {
        total: products.length,
        page: 1,
        limit: products.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        filters: availableFilters || {
          availableCategories: [],
          availableBrands: [],
          priceRange: { min: 0, max: 1000 },
          availableConditions: [],
          availableSizes: []
        }
      },
      aiInsights: {
        intelligenceApplied: true,
        queryUnderstanding: queryInfo?.intent || 'AI-curated selection',
        overallInsight: `Selected ${products.length} products using Veritas scoring`
      }
    }

    setSearchResults(aiSearchResponse)
    console.log('✅ Updated search grid with AI products')
  }, [availableFilters])

  // Visual search handlers
  const handleVisualSearchInitiated = useCallback((searchQuery: string, imageAnalysis: any) => {
    console.log('🖼️ Visual search initiated:', searchQuery, imageAnalysis)
    // Update the URL with the visual search query
    router.push(`/buyers/search?q=${encodeURIComponent(searchQuery)}`)
    setDisplayQuery(searchQuery)
    // Switch back to grid view to show results
    setViewMode('grid')
  }, [router])

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
            veritasDataCompleteness: mp.veritasDataCompleteness,
            dynamicSpecs: mp.dynamicSpecs,
            companyMetrics: mp.companyMetrics
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

  // Normalize Claude search response to standard format
  const normalizeClaudeResponse = (claudeData: any): SearchResponse => {
    // If it's already in standard format, return as-is
    if (claudeData.products && claudeData.metadata) {
      return claudeData
    }

    // Convert Claude format to standard format
    const products = (claudeData.results || []).map((result: any) => ({
      asin: result.id,
      title: result.name,
      brand: result.brand || 'Various',
      category: result.category,
      price: {
        current: result.price,
        original: result.price,
        currency: 'USD',
        discountPercentage: 0
      },
      availability: {
        inStock: true,
        quantity: 1,
        shippingDays: 5,
        shippingCost: 0
      },
      reviews: {
        rating: 4.0,
        count: 0,
        verified: true
      },
      images: result.imageUrl ? [result.imageUrl] : ['/placeholder-image.jpg'],
      description: result.description || result.claudeReasoning || result.name,
      seller: {
        name: 'Veritas.ai',
        rating: 4.5,
        verified: true
      },
      specifications: {
        category: result.category,
        condition: 'Used - Good'
      },
      // Claude-specific fields
      intelligenceScore: result.matchScore,
      reasoning: result.claudeReasoning
    }))

    return {
      products,
      metadata: {
        total: products.length,
        page: 1,
        limit: products.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        filters: {
          availableCategories: [],
          availableBrands: [],
          priceRange: { min: 0, max: 1000 },
          availableConditions: [],
          availableSizes: []
        }
      },
      query: claudeData.query,
      insights: claudeData.insights,
      aiInsights: {
        intelligenceApplied: true,
        queryUnderstanding: claudeData.query?.intent,
        overallInsight: claudeData.insights?.overallAnalysis
      }
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

    // Check if we have Claude search results in sessionStorage
    const storedResults = sessionStorage.getItem('searchResults')
    const searchMethod = sessionStorage.getItem('searchMethod')

    if (storedResults && searchMethod === 'claude') {
      try {
        const claudeData = JSON.parse(storedResults)
        const normalizedData = normalizeClaudeResponse(claudeData)
        setSearchResults(normalizedData)
        setLoading(false)
        sessionStorage.removeItem('searchResults') // Clear after reading
        sessionStorage.removeItem('searchMethod')
        return
      } catch (err) {
        console.error('Failed to parse Claude search results:', err)
      }
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
  }, [filters.sortBy, filters.sortDirection, filters.categories, filters.brands, filters.sizes, filters.priceRange.min, filters.priceRange.max, currentPage, itemsPerPage])

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

  // Convert Product to SwipeProduct format
  const convertToSwipeProducts = (products: Product[]): SwipeProduct[] => {
    return products.map(p => ({
      id: p.asin,
      name: p.title || p.name || 'Product',
      price: p.price?.current || 0,
      originalPrice: p.price?.original,
      images: p.images || [],
      brand: p.brand,
      category: p.category,
      condition: p.specifications?.condition,
      rating: p.reviews?.rating,
      description: p.description
    }))
  }

  // Swipe handlers
  const handleSwipeLeft = (product: SwipeProduct) => {
    console.log('Swiped left (pass):', product.name)
    if (swipeIndex < (searchResults?.products.length || 0) - 1) {
      setSwipeIndex(swipeIndex + 1)
    }
  }

  const handleSwipeRight = (product: SwipeProduct) => {
    console.log('Swiped right (like):', product.name)
    // Find the original product and add to liked
    const originalProduct = searchResults?.products.find(p => p.asin === product.id)
    if (originalProduct && !likedProducts.some(p => p.asin === originalProduct.asin)) {
      setLikedProducts([...likedProducts, originalProduct])
    }
    if (swipeIndex < (searchResults?.products.length || 0) - 1) {
      setSwipeIndex(swipeIndex + 1)
    }
  }

  const handleViewDetails = (product: SwipeProduct) => {
    // Find the original product to get full details
    const originalProduct = searchResults?.products.find(p => p.asin === product.id)
    if (originalProduct) {
      setSelectedProduct(originalProduct)
      setIsProductModalOpen(true)
    }
  }

  const handleAddToCart = async (product: SwipeProduct) => {
    try {
      console.log('Adding to cart from swipe:', product.name)
      await addToCart(product.id, 1, session?.user?.id)
      // Cart drawer will open automatically via the store
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  // Reset swipe index when search results change or view mode changes
  useEffect(() => {
    setSwipeIndex(0)
  }, [searchResults, viewMode])

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
    return (
      <ProductCard
        key={`${product.asin}-${index}`}
        product={product}
        index={index}
        viewMode={viewMode}
        onAddToCart={async () => {
          try {
            await addToCart(
              product.asin,
              1,
              session?.user?.id
            )
          } catch (error) {
            console.error('Failed to add to cart:', error)
          }
        }}
        cartLoading={cartLoading}
      />
    )
  }


  if (loading && !searchResults) {
    return (
      <div className="App flex-container">
        <ChatSidebar
          onCollapseChange={setIsChatCollapsed}
          onProductsFromAI={handleProductsFromAI}
          pageContext={{
            searchQuery: displayQuery || query || '',
            products: [],
            totalResults: 0,
            isLoading: true
          }}
        />
        <div
          className="flex-1 flex-container-col"
          style={{
            marginRight: isChatCollapsed || isMobile ? '0' : '420px',
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
        <ChatSidebar
          onCollapseChange={setIsChatCollapsed}
          onProductsFromAI={handleProductsFromAI}
          pageContext={{
            searchQuery: displayQuery || query || '',
            products: [],
            totalResults: 0,
            isLoading: false
          }}
        />
        <div
          className="flex-1 flex-container-col"
          style={{
            marginRight: isChatCollapsed || isMobile ? '0' : '420px',
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
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4" role="alert" aria-live="assertive">
              <h3 className="font-semibold empty-state-title" style={{color: 'var(--error)'}}>Search Error</h3>
              <p className="empty-state-description" style={{color: 'var(--error)'}} id="error-message">{error}</p>
              <Button
                onClick={() => performSearch(query, filters, currentPage, itemsPerPage)}
                className="mt-2"
                aria-describedby="error-message"
              >
                Try Again
              </Button>

              {/* Suggestions */}
              <div className="mt-6 pt-4 border-t border-red-700/50">
                <p className="text-sm font-semibold mb-3" style={{color: 'var(--text-secondary)'}}>Try searching for:</p>
                <div className="flex flex-wrap gap-2">
                  {['Laptops', 'Designer Handbags', 'Running Shoes', 'Vintage Watches', 'Electronics'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => router.push(`/buyers/search?q=${encodeURIComponent(suggestion)}`)}
                      className="px-3 py-2 bg-red-800/30 hover:bg-red-800/50 rounded-lg text-sm transition-colors"
                      style={{ minHeight: '44px' }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
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
      <ChatSidebar
        onCollapseChange={setIsChatCollapsed}
        onProductsFromAI={handleProductsFromAI}
        pageContext={{
          searchQuery: displayQuery || query || '',
          products: searchResults?.products || [],
          filters: filters,
          totalResults: searchResults?.metadata.total || 0
        }}
      />

      {/* Main Content Area - Add right margin when chat is expanded (desktop only) */}
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

        <main className="container mx-auto px-4 py-6 min-h-screen">
        {/* Professional Search Header - Like Amazon/eBay */}
        <div className="mb-6">
          {/* Breadcrumb & Title */}
          <div className="mb-4">
            <nav className="text-sm mb-2">
              <span
                onClick={() => router.push('/')}
                className="cursor-pointer transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                Home
              </span>
              <span className="mx-2" style={{ color: 'var(--text-tertiary)' }}>›</span>
              <span style={{ color: 'var(--text-secondary)' }}>Search Results</span>
            </nav>
            <h1 className="text-xl md:text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {displayQuery}
            </h1>
          </div>

          {/* Claude Insights Banner */}
          {searchResults?.insights && (
            <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <span className="text-2xl">🧠</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Claude AI Analysis
                  </h3>

                  {/* Query Understanding */}
                  {searchResults.query?.intent && (
                    <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                      <strong>Intent:</strong> {searchResults.query.intent}
                      {searchResults.query.confidence && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-800 text-xs">
                          {Math.round(searchResults.query.confidence * 100)}% confident
                        </span>
                      )}
                    </p>
                  )}

                  {/* Overall Analysis */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {searchResults.insights.overallAnalysis}
                  </p>

                  {/* Insights Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {searchResults.insights.topRecommendation && (
                      <div className="p-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                        <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">
                          ⭐ Top Recommendation
                        </p>
                        <p className="text-xs text-green-800 dark:text-green-200">
                          {searchResults.insights.topRecommendation}
                        </p>
                      </div>
                    )}
                    {searchResults.insights.priceInsight && (
                      <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          💰 Price Insight
                        </p>
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          {searchResults.insights.priceInsight}
                        </p>
                      </div>
                    )}
                    {searchResults.insights.qualityInsight && (
                      <div className="p-3 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
                        <p className="text-xs font-semibold text-orange-900 dark:text-orange-100 mb-1">
                          ✨ Quality Insight
                        </p>
                        <p className="text-xs text-orange-800 dark:text-orange-200">
                          {searchResults.insights.qualityInsight}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Bar - Like Major E-commerce Sites */}
          <div
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 rounded-lg"
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-primary)'
            }}
          >
            {/* Left: Results Count */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {searchResults?.metadata.total || 0} results
              </span>
            </div>

            {/* Right: View Mode Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className={`btn-modern btn-modern-sm view-mode-btn ${
                  viewMode === 'grid' ? 'btn-modern-default' : 'btn-modern-outline'
                }`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <span className="hidden sm:inline">Grid</span>
                <span className="sm:hidden">⊞</span>
              </button>
              <button
                className={`btn-modern btn-modern-sm view-mode-btn ${
                  viewMode === 'list' ? 'btn-modern-default' : 'btn-modern-outline'
                }`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <span className="hidden sm:inline">List</span>
                <span className="sm:hidden">☰</span>
              </button>
              <button
                className={`btn-modern btn-modern-sm view-mode-btn ${
                  viewMode === 'leaderboard' ? 'btn-modern-default' : 'btn-modern-outline'
                }`}
                onClick={() => setViewMode('leaderboard')}
                aria-label="Leaderboard view"
              >
                <span className="hidden sm:inline">Leaderboard</span>
                <span className="sm:hidden">🏆</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Filters Sidebar - Hidden on mobile, shown as drawer */}
          <div className={`filters-sidebar lg:w-1/5 ${showMobileFilters ? 'mobile-filters-open' : ''}`}>
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

          {/* Mobile Filters Backdrop */}
          {showMobileFilters && (
            <div
              className="mobile-filters-backdrop lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
          )}

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
                {viewMode === 'swipe' ? (
                  <div className="w-full max-w-md mx-auto">
                    <SwipeDeck
                      products={convertToSwipeProducts(searchResults.products)}
                      currentIndex={swipeIndex}
                      onSwipeLeft={handleSwipeLeft}
                      onSwipeRight={handleSwipeRight}
                      onViewDetails={handleViewDetails}
                      onAddToCart={handleAddToCart}
                    />
                    {likedProducts.length > 0 && (
                      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                          Liked Products ({likedProducts.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {likedProducts.slice(0, 5).map((product) => (
                            <span
                              key={product.asin}
                              className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 px-2 py-1 rounded"
                            >
                              {(product.title || product.name || 'Product').substring(0, 30)}...
                            </span>
                          ))}
                          {likedProducts.length > 5 && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              +{likedProducts.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : viewMode === 'leaderboard' ? (
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
                          name: product.title || product.name || 'Product',
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
                          dynamicSpecs: product.dynamicSpecs || product.specifications || {},
                          companyMetrics: product.companyMetrics
                        }

                        return (
                          <LeaderboardCard
                            key={`leaderboard-${product.id}-${index}`}
                            product={leaderboardProduct}
                            rank={index + 1}
                            isExpanded={expandedLeaderboardCard === `${product.id}-${index}`}
                            onToggleExpand={() => {
                              setExpandedLeaderboardCard(
                                expandedLeaderboardCard === `${product.id}-${index}` ? null : `${product.id}-${index}`
                              )
                            }}
                          />
                        )
                      })}
                  </div>
                ) : viewMode === 'visual' ? (
                  <div className="w-full max-w-4xl mx-auto py-8">
                    <VisualSearchUpload
                      onSearchInitiated={handleVisualSearchInitiated}
                      onImageAnalyzed={(analysis, imageUrl) => {
                        console.log('Image analyzed:', analysis)
                      }}
                    />
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
                <div className="text-center py-12" role="status" aria-live="polite">
                  <div className="text-6xl mb-4 empty-state-icon">🔍</div>
                  <h3 className="text-xl mb-2 empty-state-title">No products found for "{query}"</h3>
                  <p className="mb-4 empty-state-description">
                    Try adjusting your search filters or search for different terms.
                  </p>
                  <Button onClick={() => setFilters(DEFAULT_FILTERS)} style={{ minHeight: '44px' }}>
                    Clear All Filters
                  </Button>

                  {/* Suggestions */}
                  <div className="mt-8 max-w-2xl mx-auto">
                    <p className="text-lg font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Popular searches:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { emoji: '💻', text: 'Laptops under $500' },
                        { emoji: '👟', text: 'Running Shoes' },
                        { emoji: '👜', text: 'Designer Handbags' },
                        { emoji: '⌚', text: 'Smart Watches' },
                        { emoji: '📱', text: 'Smartphones' },
                        { emoji: '🎮', text: 'Gaming Consoles' }
                      ].map((suggestion) => (
                        <button
                          key={suggestion.text}
                          onClick={() => router.push(`/buyers/search?q=${encodeURIComponent(suggestion.text)}`)}
                          className="px-4 py-3 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-green-800/50 hover:to-green-900/50 border border-gray-700 hover:border-green-600 rounded-lg text-sm transition-all text-left"
                          style={{ minHeight: '44px' }}
                        >
                          <span className="text-2xl mr-2">{suggestion.emoji}</span>
                          <span>{suggestion.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
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

        <ProductDetailModal
          product={selectedProduct}
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false)
            setSelectedProduct(null)
          }}
          onAddToCart={selectedProduct ? async () => {
            await addToCart(selectedProduct.asin, 1, session?.user?.id)
          } : undefined}
        />
      </div>
    </div>
  )
}