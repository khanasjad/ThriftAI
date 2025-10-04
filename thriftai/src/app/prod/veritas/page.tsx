'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface VeritasScore {
  ssn: string
  overallScore: number
  confidence: number
  dataQualityScore: number
  calculatedAt: string
  categories: Array<{
    name: string
    score: number
    weight: number
    weightedScore: number
  }>
}

interface Product {
  id: string
  name: string
  category: string
  brand: string | null
  price: number
  originalPrice: number
  condition: string | null
  imageUrl: string | null
  veritasScore: VeritasScore | null
  companyProfile: {
    brandName: string
    brandReputation: number
    stockSymbol: string | null
  } | null
  sellerProfile: {
    seller: string
    rating: number
    isTopRated: boolean
  } | null
}

export default function ProductionVeritasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState({
    category: '',
    minScore: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [filter])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: '0'
      })

      if (filter.category) params.append('category', filter.category)
      if (filter.minScore) params.append('minScore', filter.minScore)

      const response = await fetch(`/api/products/veritas?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
      } else {
        setError(data.error || 'Failed to fetch products')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981' // green
    if (score >= 80) return '#22c55e' // light green
    if (score >= 70) return '#fbbf24' // yellow
    if (score >= 60) return '#f59e0b' // orange
    return '#ef4444' // red
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Poor'
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Veritas Score™ Marketplace
        </h1>
        <p style={{ fontSize: '18px', color: '#888', marginBottom: '30px' }}>
          Real products. Real scores. Real quality assessment.
        </p>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#aaa' }}>
              Category
            </label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              style={{
                padding: '10px 15px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">All Categories</option>
              <option value="ELECTRONICS">Electronics</option>
              <option value="PHONES">Phones</option>
              <option value="LAPTOPS">Laptops</option>
              <option value="ACCESSORIES">Accessories</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#aaa' }}>
              Minimum Score
            </label>
            <select
              value={filter.minScore}
              onChange={(e) => setFilter({ ...filter, minScore: e.target.value })}
              style={{
                padding: '10px 15px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">Any Score</option>
              <option value="90">90+ (Excellent)</option>
              <option value="80">80+ (Very Good)</option>
              <option value="70">70+ (Good)</option>
              <option value="60">60+ (Fair)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={fetchProducts}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#333' : '#0070f3',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto 20px',
          padding: '20px',
          backgroundColor: '#ff4444',
          borderRadius: '12px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '60px 20px',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading products...
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length === 0 && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '60px 20px',
          fontSize: '18px',
          color: '#666'
        }}>
          No products found. Try adjusting your filters.
        </div>
      )}

      {!loading && products.length > 0 && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px'
        }}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/prod/veritas/${product.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.2s',
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = '#3a3a3a'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = '#2a2a2a'
                e.currentTarget.style.boxShadow = 'none'
              }}
              >
                {/* Product Image */}
                <div style={{
                  width: '100%',
                  height: '240px',
                  backgroundColor: '#0f0f0f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <div style={{ color: '#444', fontSize: '48px' }}>📦</div>
                  )}

                  {/* Veritas Score Badge */}
                  {product.veritasScore && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: getScoreColor(product.veritasScore.overallScore),
                      color: '#000',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      {product.veritasScore.overallScore.toFixed(0)}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Brand */}
                  {product.brand && (
                    <div style={{
                      fontSize: '12px',
                      color: '#888',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      marginBottom: '6px'
                    }}>
                      {product.brand}
                    </div>
                  )}

                  {/* Product Name */}
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '12px',
                    lineHeight: '1.4'
                  }}>
                    {product.name}
                  </h3>

                  {/* Condition */}
                  {product.condition && (
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#aaa',
                      marginBottom: '12px',
                      width: 'fit-content'
                    }}>
                      {product.condition}
                    </div>
                  )}

                  {/* Veritas Score Details */}
                  {product.veritasScore && (
                    <div style={{
                      marginTop: 'auto',
                      paddingTop: '12px',
                      borderTop: '1px solid #2a2a2a'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '14px', color: '#aaa' }}>Veritas Score</span>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: getScoreColor(product.veritasScore.overallScore)
                        }}>
                          {getScoreLabel(product.veritasScore.overallScore)}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: '4px'
                      }}>
                        SSN: {product.veritasScore.ssn}
                      </div>

                      <div style={{
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        Confidence: {(product.veritasScore.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    marginTop: '12px'
                  }}>
                    <span style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}>
                      ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice > product.price && (
                      <span style={{
                        fontSize: '16px',
                        color: '#666',
                        textDecoration: 'line-through'
                      }}>
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                    {product.originalPrice > product.price && (
                      <span style={{
                        fontSize: '14px',
                        color: '#10b981',
                        fontWeight: '600'
                      }}>
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% off
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div style={{
        maxWidth: '1400px',
        margin: '60px auto 0',
        padding: '30px',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #2a2a2a'
      }}>
        <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>About Veritas Score™</h3>
        <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.6' }}>
          Veritas Score™ is a comprehensive quality assessment system that evaluates products across 121 parameters
          organized into 8 major categories. Each score represents real data from FREE API sources including brand
          reputation, seller trust, market value, sustainability metrics, and more. Our relational data architecture
          ensures efficient scoring with 99.4% fewer API calls through intelligent data caching.
        </p>
        <div style={{
          display: 'flex',
          gap: '20px',
          marginTop: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          <div>
            <strong style={{ color: '#fff' }}>Environment:</strong>{' '}
            {process.env.NEXT_PUBLIC_VERITAS_ENV || 'development'}
          </div>
          <div>
            <strong style={{ color: '#fff' }}>Products Loaded:</strong> {products.length}
          </div>
        </div>
      </div>
    </div>
  )
}
