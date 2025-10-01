'use client'

import { useState, useEffect } from 'react'
import { Trophy, Filter, TrendingUp, Star, DollarSign, Shield, Truck, Zap, Heart, ChevronDown, ChevronUp } from 'lucide-react'

interface Product {
  id: string
  name: string
  brand: string
  category: string
  price: number
  originalPrice: number
  condition: string
  aiScore: number
  aiConfidence: number
  aiScoreBreakdown: {
    total: number
    components: {
      relevance: number
      priceValue: number
      trustScore: number
      qualityScore: number
      socialProof: number
      convenience: number
      urgency: number
      emotional: number
    }
    recommendation: string
    insights: string[]
  }
  stockQuantity: number
  shippingCost: number
  hasFreeShipping: boolean
  estimatedDeliveryDays: number
  hasFreeReturns: boolean
  companyMetrics: {
    esgScore: number
    carbonFootprint: number
    sustainabilityRating: number
    laborPractices: number
    supplyChainTransparency: number
  }
}

export default function LeaderboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(10000)
  const [conditionFilter, setConditionFilter] = useState<string>('ALL')

  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchLeaderboard()
    fetchCategories()
  }, [categoryFilter, minPrice, maxPrice, conditionFilter])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: categoryFilter,
        minPrice: minPrice.toString(),
        maxPrice: maxPrice.toString(),
        condition: conditionFilter,
        limit: '20'
      })

      const res = await fetch(`/api/leaderboard?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId)
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec?.toLowerCase()) {
      case 'strong-buy': return '#10b981'
      case 'buy': return '#3b82f6'
      case 'consider': return '#f59e0b'
      default: return '#ef4444'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10b981'
    if (score >= 70) return '#3b82f6'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.5rem'
        }}>
          <Trophy size={40} style={{ color: '#fbbf24' }} />
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Product Leaderboard
          </h1>
        </div>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          margin: 0
        }}>
          Top 20 products ranked by AI Score (96-Parameter System)
        </p>
      </div>

      {/* Filters */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <Filter size={20} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{
            margin: 0,
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>Filters</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {/* Category Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--text-secondary)'
            }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--text-secondary)'
            }}>
              Min Price
            </label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Max Price */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--text-secondary)'
            }}>
              Max Price
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Condition Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--text-secondary)'
            }}>
              Condition
            </label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            >
              <option value="ALL">All Conditions</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Acceptable">Acceptable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            color: 'var(--text-secondary)'
          }}>
            Loading leaderboard...
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            color: 'var(--text-secondary)'
          }}>
            No products found matching your filters
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {products.map((product, index) => (
              <div
                key={product.id}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Product Header */}
                <div
                  onClick={() => toggleExpand(product.id)}
                  style={{
                    padding: '1.5rem',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr auto',
                    gap: '1.5rem',
                    alignItems: 'center'
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                                index === 1 ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' :
                                index === 2 ? 'linear-gradient(135deg, #d97706 0%, #92400e 100%)' :
                                'rgba(255, 255, 255, 0.05)',
                    fontSize: '1.5rem',
                    fontWeight: '700'
                  }}>
                    {index + 1}
                  </div>

                  {/* Product Info */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: '600'
                      }}>
                        {product.name}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--accent-primary)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {product.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '1.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <span>Brand: {product.brand}</span>
                      <span>Condition: {product.condition}</span>
                      <span>Price: ${product.price}</span>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: getScoreColor(product.aiScore)
                      }}>
                        {product.aiScore.toFixed(1)}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)'
                      }}>
                        AI Score
                      </div>
                    </div>
                    {expandedProduct === product.id ? (
                      <ChevronUp size={24} style={{ color: 'var(--text-tertiary)' }} />
                    ) : (
                      <ChevronDown size={24} style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedProduct === product.id && (
                  <div style={{
                    padding: '0 1.5rem 1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '1.5rem',
                      marginTop: '1.5rem'
                    }}>
                      {/* Score Components */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        padding: '1rem'
                      }}>
                        <h4 style={{
                          margin: '0 0 1rem 0',
                          fontSize: '1rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
                          Score Components
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {[
                            { label: 'Relevance', value: product.aiScoreBreakdown?.components?.relevance || 0, icon: Star },
                            { label: 'Price Value', value: product.aiScoreBreakdown?.components?.priceValue || 0, icon: DollarSign },
                            { label: 'Trust', value: product.aiScoreBreakdown?.components?.trustScore || 0, icon: Shield },
                            { label: 'Quality', value: product.aiScoreBreakdown?.components?.qualityScore || 0, icon: Trophy },
                            { label: 'Social Proof', value: product.aiScoreBreakdown?.components?.socialProof || 0, icon: Star },
                            { label: 'Convenience', value: product.aiScoreBreakdown?.components?.convenience || 0, icon: Truck },
                            { label: 'Urgency', value: product.aiScoreBreakdown?.components?.urgency || 0, icon: Zap },
                            { label: 'Emotional', value: product.aiScoreBreakdown?.components?.emotional || 0, icon: Heart }
                          ].map(({ label, value, icon: Icon }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <Icon size={16} style={{ color: 'var(--text-tertiary)' }} />
                              <span style={{ flex: 1, fontSize: '0.875rem' }}>{label}</span>
                              <div style={{
                                width: '100px',
                                height: '6px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${(value / 10) * 100}%`,
                                  height: '100%',
                                  background: getScoreColor(value * 10),
                                  borderRadius: '3px'
                                }} />
                              </div>
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                minWidth: '45px',
                                textAlign: 'right'
                              }}>
                                {value.toFixed(1)}/10
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        padding: '1rem'
                      }}>
                        <h4 style={{
                          margin: '0 0 1rem 0',
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}>
                          Product Details
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Price:</span>
                            <span style={{ fontWeight: '600' }}>${product.price}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Original Price:</span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>
                              ${product.originalPrice}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Discount:</span>
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              {(((product.originalPrice - product.price) / product.originalPrice) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Stock:</span>
                            <span>{product.stockQuantity} units</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Shipping:</span>
                            <span>{product.hasFreeShipping ? 'Free ✅' : `$${product.shippingCost}`}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Delivery:</span>
                            <span>{product.estimatedDeliveryDays} days</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Returns:</span>
                            <span>{product.hasFreeReturns ? 'Free ✅' : 'Paid'}</span>
                          </div>
                        </div>
                      </div>

                      {/* ESG Metrics */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        padding: '1rem'
                      }}>
                        <h4 style={{
                          margin: '0 0 1rem 0',
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}>
                          ESG Metrics
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>ESG Score:</span>
                            <span style={{ fontWeight: '600' }}>{(product.companyMetrics?.esgScore || 0).toFixed(1)}/100</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Sustainability:</span>
                            <span>{(product.companyMetrics?.sustainabilityRating || 0).toFixed(1)}/5</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Labor Practices:</span>
                            <span>{(product.companyMetrics?.laborPractices || 0).toFixed(1)}/100</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Supply Chain:</span>
                            <span>{(product.companyMetrics?.supplyChainTransparency || 0).toFixed(1)}/100</span>
                          </div>
                        </div>
                      </div>

                      {/* AI Insights */}
                      {product.aiScoreBreakdown?.insights && product.aiScoreBreakdown.insights.length > 0 && (
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          padding: '1rem',
                          gridColumn: '1 / -1'
                        }}>
                          <h4 style={{
                            margin: '0 0 1rem 0',
                            fontSize: '1rem',
                            fontWeight: '600'
                          }}>
                            AI Insights
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {product.aiScoreBreakdown.insights.map((insight, i) => (
                              <div key={i} style={{
                                fontSize: '0.875rem',
                                padding: '0.5rem',
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '6px',
                                borderLeft: '3px solid var(--accent-primary)'
                              }}>
                                {insight}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
