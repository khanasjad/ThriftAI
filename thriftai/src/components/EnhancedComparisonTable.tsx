'use client'

import { useState, useMemo, Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ChevronDown, ChevronUp, ExternalLink, Award, TrendingUp, Package,
  ChevronRight, Filter, X, BarChart3, Brain, DollarSign, Shield,
  Star, Truck, Clock, Users, Sparkles
} from 'lucide-react'

interface ScoreComponents {
  relevance?: number
  priceValue?: number
  trustScore?: number
  qualityScore?: number
  socialProof?: number
  convenience?: number
  urgency?: number
  emotional?: number
}

interface ComparisonProduct {
  id?: string
  asin?: string
  name?: string
  title?: string
  brand?: string
  category?: string
  price?: number
  totalCost?: number
  condition?: string
  rating?: number
  source?: string
  score?: {
    total?: number
    relevance?: number
    price?: number
    trust?: number
    quality?: number
    social?: number
    convenience?: number
    urgency?: number
    emotional?: number
  }
  totalScore?: number
  relevanceScore?: number
  priceScore?: number
  trustScore?: number
  qualityScore?: number
  socialProofScore?: number
  convenienceScore?: number
  urgencyScore?: number
  emotionalScore?: number
  recommendation?: string
  insights?: string[]
  confidence?: number
  // Veritas Score™ fields
  veritasScore?: number
  veritasBadges?: string[]
  veritasRecommendation?: string
  veritasInsights?: string[]
  [key: string]: any
}

interface EnhancedComparisonTableProps {
  topProducts: ComparisonProduct[]
  insights?: {
    totalCompared: number
    avgScore: number
    scoreRange: { min: number; max: number }
    bestSource: string
    sourceBreakdown: Record<string, number>
  }
  onProductClick?: (product: ComparisonProduct) => void
}

export default function EnhancedComparisonTable({
  topProducts,
  insights,
  onProductClick
}: EnhancedComparisonTableProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [minScore, setMinScore] = useState(0)

  if (!topProducts || topProducts.length === 0) {
    return null
  }

  // Extract unique brands, categories
  const brands = useMemo(() => {
    return Array.from(new Set(topProducts.map(p => p.brand).filter(Boolean)))
  }, [topProducts])

  const categories = useMemo(() => {
    return Array.from(new Set(topProducts.map(p => p.category).filter(Boolean)))
  }, [topProducts])

  // Calculate price range
  const [minPrice, maxPrice] = useMemo(() => {
    const prices = topProducts.map(p => p.price || 0)
    return [Math.min(...prices), Math.max(...prices)]
  }, [topProducts])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return topProducts.filter(product => {
      // Brand filter
      if (selectedBrands.size > 0 && !selectedBrands.has(product.brand || '')) {
        return false
      }

      // Category filter
      if (selectedCategories.size > 0 && !selectedCategories.has(product.category || '')) {
        return false
      }

      // Price filter
      const price = product.price || 0
      if (price < priceRange[0] || price > priceRange[1]) {
        return false
      }

      // Score filter - Use Veritas Score™ for consistency
      const score = product.veritasScore || product.totalScore || product.score?.total || 0
      if (score < minScore) {
        return false
      }

      return true
    })
  }, [topProducts, selectedBrands, selectedCategories, priceRange, minScore])

  const toggleRow = (productId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedRows(newExpanded)
  }

  const toggleBrand = (brand: string) => {
    const newBrands = new Set(selectedBrands)
    if (newBrands.has(brand)) {
      newBrands.delete(brand)
    } else {
      newBrands.add(brand)
    }
    setSelectedBrands(newBrands)
  }

  const toggleCategory = (category: string) => {
    const newCategories = new Set(selectedCategories)
    if (newCategories.has(category)) {
      newCategories.delete(category)
    } else {
      newCategories.add(category)
    }
    setSelectedCategories(newCategories)
  }

  const clearFilters = () => {
    setSelectedBrands(new Set())
    setSelectedCategories(new Set())
    setPriceRange([minPrice, maxPrice])
    setMinScore(0)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981' // Green
    if (score >= 60) return '#3b82f6' // Blue
    if (score >= 40) return '#f59e0b' // Orange
    return '#ef4444' // Red
  }

  const renderScoreBreakdown = (product: ComparisonProduct) => {
    const scores = {
      relevance: product.relevanceScore || product.score?.relevance || 0,
      priceValue: product.priceScore || product.score?.price || 0,
      trust: product.trustScore || product.score?.trust || 0,
      quality: product.qualityScore || product.score?.quality || 0,
      socialProof: product.socialProofScore || product.score?.social || 0,
      convenience: product.convenienceScore || product.score?.convenience || 0,
      urgency: product.urgencyScore || product.score?.urgency || 0,
      emotional: product.emotionalScore || product.score?.emotional || 0
    }

    const scoreIcons: Record<string, any> = {
      relevance: <Brain className="w-4 h-4" />,
      priceValue: <DollarSign className="w-4 h-4" />,
      trust: <Shield className="w-4 h-4" />,
      quality: <Award className="w-4 h-4" />,
      socialProof: <Users className="w-4 h-4" />,
      convenience: <Truck className="w-4 h-4" />,
      urgency: <Clock className="w-4 h-4" />,
      emotional: <Sparkles className="w-4 h-4" />
    }

    const scoreLabels: Record<string, string> = {
      relevance: 'Search Relevance',
      priceValue: 'Price Value',
      trust: 'Trust & Reliability',
      quality: 'Product Quality',
      socialProof: 'Social Proof',
      convenience: 'Convenience',
      urgency: 'Availability',
      emotional: 'Emotional Appeal'
    }

    return (
      <div style={{
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(scores).map(([key, value]) => (
            <div
              key={key}
              style={{
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div style={{ color: getScoreColor(value) }}>
                  {scoreIcons[key]}
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  {scoreLabels[key]}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: getScoreColor(value),
                  fontFamily: 'var(--font-family-primary)',
                  lineHeight: '1'
                }}>
                  {value.toFixed(1)}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-family-primary)',
                  marginBottom: '0.125rem'
                }}>
                  / 10
                </span>
              </div>
              <div style={{
                marginTop: '0.5rem',
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(value / 10) * 100}%`,
                  height: '100%',
                  background: getScoreColor(value),
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Claude AI Insights */}
        {product.insights && product.insights.length > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-family-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Claude AI Analysis
              </span>
            </div>
            <ul style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-family-primary)',
              paddingLeft: '1.25rem',
              margin: '0',
              listStyleType: 'disc'
            }}>
              {product.insights.map((insight, i) => (
                <li key={i} style={{ marginBottom: '0.375rem' }}>{insight}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="mb-6 overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
        }}
      >
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{
            fontSize: '0.9375rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            AI Marketplace Comparison
          </h3>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            ({filteredProducts.length} products)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              background: showFilters ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: showFilters ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '500',
              color: showFilters ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-family-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ color: 'var(--text-secondary)', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {isExpanded && showFilters && (
        <div style={{
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.01)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Brand Filter */}
            {brands.length > 0 && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-family-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem'
                }}>
                  Brands
                </label>
                <div className="flex flex-wrap gap-2">
                  {brands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: selectedBrands.has(brand) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: selectedBrands.has(brand) ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: selectedBrands.has(brand) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-family-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter */}
            {categories.length > 0 && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-family-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem'
                }}>
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: selectedCategories.has(category) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: selectedCategories.has(category) ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: selectedCategories.has(category) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-family-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-family-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}>
                Price Range
              </label>
              <div style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-family-primary)',
                marginBottom: '0.5rem'
              }}>
                ${priceRange[0].toFixed(0)} - ${priceRange[1].toFixed(0)}
              </div>
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([minPrice, parseFloat(e.target.value)])}
                style={{ width: '100%' }}
              />
            </div>

            {/* Min Score */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-family-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}>
                Min Score
              </label>
              <div style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-family-primary)',
                marginBottom: '0.5rem'
              }}>
                {minScore.toFixed(0)} / 100
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(selectedBrands.size > 0 || selectedCategories.size > 0 || minScore > 0 || priceRange[1] < maxPrice) && (
            <button
              onClick={clearFilters}
              style={{
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#ef4444',
                fontFamily: 'var(--font-family-primary)',
                cursor: 'pointer'
              }}
            >
              <X className="w-3.5 h-3.5" />
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {isExpanded && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ width: '30px' }}></th>
                  <th style={{
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-family-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    #
                  </th>
                  <th style={{
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-family-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Product
                  </th>
                  <th style={{
                    padding: '0.5rem 0.75rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-family-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Source
                  </th>
                  <th style={{
                    padding: '0.5rem 0.75rem',
                    textAlign: 'right',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-family-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Price
                  </th>
                  <th style={{
                    padding: '0.5rem 0.75rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-family-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    AI Score
                  </th>
                  <th style={{ padding: '0.5rem 0.75rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => {
                  const productKey = `${product.source}-${product.id}-${index}`
                  const isRowExpanded = expandedRows.has(productKey)

                  return (
                    <Fragment key={productKey}>
                      <tr
                        style={{
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'background 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        {/* Expand Button */}
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <button
                            onClick={() => toggleRow(productKey)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-tertiary)',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {isRowExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Rank */}
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-family-primary)'
                          }}>
                            {index + 1}
                          </span>
                        </td>

                        {/* Product */}
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <div className="flex flex-col">
                            <div style={{
                              fontSize: '0.8125rem',
                              fontWeight: '400',
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-family-primary)',
                              margin: 0
                            }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {product.title || product.name || ''}
                              </ReactMarkdown>
                            </div>
                            {product.brand && (
                              <div style={{
                                fontSize: '0.6875rem',
                                color: 'var(--text-tertiary)',
                                fontFamily: 'var(--font-family-primary)'
                              }}>
                                {product.brand}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Source */}
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.6875rem',
                            fontWeight: '500',
                            fontFamily: 'var(--font-family-primary)',
                            background: product.source === 'Veritas.ai' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: product.source === 'Veritas.ai' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            border: `1px solid ${product.source === 'Veritas.ai' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
                          }}>
                            {product.source}
                          </span>
                        </td>

                        {/* Price */}
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right' }}>
                          <div>
                            <p style={{
                              fontSize: '0.8125rem',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-family-primary)',
                              margin: 0
                            }}>
                              ${(product.price || 0).toFixed(2)}
                            </p>
                            <p style={{
                              fontSize: '0.6875rem',
                              color: 'var(--text-tertiary)',
                              fontFamily: 'var(--font-family-primary)',
                              margin: 0
                            }}>
                              {product.shippingCost && product.shippingCost > 0 ? `+$${product.shippingCost.toFixed(2)}` : 'Free'}
                            </p>
                          </div>
                        </td>

                        {/* AI Score */}
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center justify-center gap-2">
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: 'var(--accent-primary)',
                                fontFamily: 'var(--font-family-primary)'
                              }}>
                                {(() => {
                                  // Use Veritas Score™ (0-100 scale, no division needed)
                                  const scoreValue = product.veritasScore || product.totalScore || product.score?.total || 0
                                  return scoreValue.toFixed(1)
                                })()}
                              </span>
                              <div style={{
                                width: '40px',
                                height: '4px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '2px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${Math.min(100, product.veritasScore || product.totalScore || product.score?.total || 0)}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                                  borderRadius: '2px'
                                }} />
                              </div>
                            </div>
                            {product.recommendation && (
                              <span style={{
                                fontSize: '0.625rem',
                                fontWeight: '500',
                                color: product.recommendation === 'strong-buy' ? '#10b981' :
                                       product.recommendation === 'buy' ? '#3b82f6' :
                                       product.recommendation === 'consider' ? '#f59e0b' : '#ef4444',
                                fontFamily: 'var(--font-family-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                {product.recommendation.replace('-', ' ')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                          <a
                            href={product.affiliateUrl || product.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onProductClick?.(product)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.375rem 0.75rem',
                              background: 'rgba(16, 185, 129, 0.9)',
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              fontFamily: 'var(--font-family-primary)',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            View
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>

                      {/* Expanded Row - Score Breakdown */}
                      {isRowExpanded && (
                        <tr key={`${productKey}-expanded`}>
                          <td colSpan={7} style={{ padding: 0 }}>
                            {renderScoreBreakdown(product)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer with Insights */}
          {insights && (
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.01)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div className="flex flex-wrap items-center gap-3" style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-family-primary)'
              }}>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Avg: <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                    {((Number(insights.avgScore || 0)) / 10).toFixed(3)}
                  </span>
                </span>
                <span>·</span>
                <span>
                  Range: {((Number(insights.scoreRange?.min || 0)) / 10).toFixed(3)}-{((Number(insights.scoreRange?.max || 0)) / 10).toFixed(3)}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Top: <span style={{ fontWeight: '500', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{insights.bestSource}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
