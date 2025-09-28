// ThriftAI - Enhanced Search Results Component
// AI-powered search results with intelligent ranking and insights

'use client'

import React, { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Sparkles,
  TrendingUp,
  DollarSign,
  Leaf,
  Star,
  Clock,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import ProductCard from './ProductCard'
import type {
  EnhancedSearchResult,
  SearchResponse,
  MockAmazonProduct
} from '@/lib/types/scoring'

interface SearchResultsProps {
  searchResponse: SearchResponse
  onAddToCart?: (product: MockAmazonProduct) => void
  onAddToWishlist?: (product: MockAmazonProduct) => void
  onViewDetails?: (product: MockAmazonProduct) => void
  onSearchRefine?: (filters: any) => void
  loading?: boolean
}

type ViewMode = 'grid' | 'list'
type SortOption = 'relevance' | 'price_low' | 'price_high' | 'rating' | 'ai_score' | 'sustainability'

export function SearchResults({
  searchResponse,
  onAddToCart,
  onAddToWishlist,
  onViewDetails,
  onSearchRefine,
  loading = false
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [minRating, setMinRating] = useState(0)
  const [minAIScore, setMinAIScore] = useState(0)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [showSustainableOnly, setShowSustainableOnly] = useState(false)

  // Sort and filter results
  const sortedAndFilteredResults = useMemo(() => {
    let filtered = searchResponse.results.filter(result => {
      const product = result.product
      const withinPriceRange = product.price.current >= priceRange[0] && product.price.current <= priceRange[1]
      const meetsRating = product.reviews.rating >= minRating
      const meetsAIScore = result.scores.overall >= minAIScore
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category)
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand)
      const sustainabilityMatch = !showSustainableOnly || product.sustainability.ecoFriendly

      return withinPriceRange && meetsRating && meetsAIScore && categoryMatch && brandMatch && sustainabilityMatch
    })

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.product.price.current - b.product.price.current
        case 'price_high':
          return b.product.price.current - a.product.price.current
        case 'rating':
          return b.product.reviews.rating - a.product.reviews.rating
        case 'ai_score':
          return b.scores.overall - a.scores.overall
        case 'sustainability':
          return b.scores.breakdown.sustainability.score - a.scores.breakdown.sustainability.score
        case 'relevance':
        default:
          return a.ranking.position - b.ranking.position
      }
    })

    return filtered
  }, [searchResponse.results, sortBy, priceRange, minRating, minAIScore, selectedCategories, selectedBrands, showSustainableOnly])

  // Extract filter options from results
  const availableCategories = useMemo(() => {
    const categories = new Set(searchResponse.results.map(r => r.product.category))
    return Array.from(categories)
  }, [searchResponse.results])

  const availableBrands = useMemo(() => {
    const brands = new Set(searchResponse.results.map(r => r.product.brand))
    return Array.from(brands).sort()
  }, [searchResponse.results])

  const priceStats = useMemo(() => {
    const prices = searchResponse.results.map(r => r.product.price.current)
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
      avg: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
    }
  }, [searchResponse.results])

  const aiInsights = useMemo(() => {
    const results = searchResponse.results
    const avgAIScore = Math.round(results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length)
    const sustainableCount = results.filter(r => r.product.sustainability.ecoFriendly).length
    const avgSustainabilityScore = Math.round(results.reduce((sum, r) => sum + r.scores.breakdown.sustainability.score, 0) / results.length)
    const topBrands = Object.entries(
      results.reduce((acc, r) => {
        acc[r.product.brand] = (acc[r.product.brand] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).sort(([,a], [,b]) => b - a).slice(0, 3)

    return {
      avgAIScore,
      sustainableCount,
      avgSustainabilityScore,
      topBrands: topBrands.map(([brand]) => brand)
    }
  }, [searchResponse.results])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>AI is analyzing products...</span>
          </div>
        </div>
        {/* Loading skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (searchResponse.results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">No products found matching your search criteria.</div>
        <Button onClick={() => onSearchRefine?.({})}>
          Clear Filters
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Query Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="font-medium">AI-Enhanced Search Results</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Original: </span>
            <span className="font-medium">{searchResponse.query.original}</span>
          </div>
          <div>
            <span className="text-gray-600">Optimized: </span>
            <span className="font-medium">{searchResponse.query.optimized}</span>
          </div>
          <div>
            <span className="text-gray-600">Confidence: </span>
            <span className="font-medium">{searchResponse.metadata.confidence}%</span>
          </div>
        </div>
      </div>

      {/* AI Insights Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="font-medium">AI Analysis Summary</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{aiInsights.avgAIScore}</div>
              <div className="text-xs text-gray-600">Avg AI Score</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{aiInsights.sustainableCount}</div>
              <div className="text-xs text-gray-600">Sustainable Items</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">${priceStats.avg}</div>
              <div className="text-xs text-gray-600">Avg Price</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{searchResponse.metadata.totalFound}</div>
              <div className="text-xs text-gray-600">Total Found</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <strong>Top Brands:</strong> {aiInsights.topBrands.join(', ')}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Relevance
                </div>
              </SelectItem>
              <SelectItem value="ai_score">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Score
                </div>
              </SelectItem>
              <SelectItem value="price_low">
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4" />
                  Price: Low to High
                </div>
              </SelectItem>
              <SelectItem value="price_high">
                <div className="flex items-center gap-2">
                  <SortDesc className="w-4 h-4" />
                  Price: High to Low
                </div>
              </SelectItem>
              <SelectItem value="rating">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Customer Rating
                </div>
              </SelectItem>
              <SelectItem value="sustainability">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Sustainability Score
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {sortedAndFilteredResults.length} of {searchResponse.metadata.totalFound} results
          </span>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Price Range</label>
                <Slider
                  min={priceStats.min}
                  max={priceStats.max}
                  step={10}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="text-sm font-medium mb-2 block">Min Rating</label>
                <Select value={minRating.toString()} onValueChange={(value) => setMinRating(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum AI Score */}
              <div>
                <label className="text-sm font-medium mb-2 block">Min AI Score</label>
                <Slider
                  min={0}
                  max={100}
                  step={10}
                  value={[minAIScore]}
                  onValueChange={([value]) => setMinAIScore(value)}
                  className="mb-2"
                />
                <div className="text-xs text-gray-600 text-center">{minAIScore}/100</div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-medium mb-2 block">Categories</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {availableCategories.map(category => (
                    <label key={category} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category])
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== category))
                          }
                        }}
                        className="rounded"
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div>
                <label className="text-sm font-medium mb-2 block">Brands</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {availableBrands.slice(0, 8).map(brand => (
                    <label key={brand} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBrands([...selectedBrands, brand])
                          } else {
                            setSelectedBrands(selectedBrands.filter(b => b !== brand))
                          }
                        }}
                        className="rounded"
                      />
                      {brand}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="mt-4 pt-4 border-t">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showSustainableOnly}
                  onChange={(e) => setShowSustainableOnly(e.target.checked)}
                  className="rounded"
                />
                <Leaf className="w-4 h-4 text-green-600" />
                Show only sustainable products
              </label>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPriceRange([priceStats.min, priceStats.max])
                  setMinRating(0)
                  setMinAIScore(0)
                  setSelectedCategories([])
                  setSelectedBrands([])
                  setShowSustainableOnly(false)
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Grid/List */}
      <div className={`${
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
          : 'space-y-4'
      }`}>
        {sortedAndFilteredResults.map((result, index) => (
          <ProductCard
            key={result.product.asin}
            result={result}
            onAddToCart={onAddToCart}
            onAddToWishlist={onAddToWishlist}
            onViewDetails={onViewDetails}
            compact={viewMode === 'grid'}
            showDetailedScores={false}
          />
        ))}
      </div>

      {/* Pagination would go here if needed */}
      {sortedAndFilteredResults.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No products match your current filters.</div>
          <Button
            variant="outline"
            onClick={() => {
              setPriceRange([priceStats.min, priceStats.max])
              setMinRating(0)
              setMinAIScore(0)
              setSelectedCategories([])
              setSelectedBrands([])
              setShowSustainableOnly(false)
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Search Metadata */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t">
        Search processed in {searchResponse.metadata.processingTime}ms •
        AI Models: {searchResponse.metadata.aiModelsUsed?.join(', ') || 'Claude'} •
        Confidence: {searchResponse.metadata.confidence}%
      </div>
    </div>
  )
}

export default SearchResults