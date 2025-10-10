'use client'

import { Trophy, TrendingUp, Star, DollarSign, Shield, Truck, Zap, Heart, ChevronDown, ChevronUp, Package } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  brand: string
  category: string
  price: number | { current: number; original: number }
  originalPrice?: number
  condition: string
  veritasScore?: number  // Veritas Score™ (0-100 scale) - 96-parameter universal scoring
  veritasConfidence?: number
  veritasBadges?: string[]
  veritasRecommendation?: string
  veritasInsights?: string[]
  veritasDataCompleteness?: number
  veritasPillars?: {
    quality: number
    value: number
    trust: number
    ux: number
    sustainability: number
  }
  aiScore?: number  // Legacy field - maps to veritasScore
  aiConfidence?: number  // Legacy field
  aiScoreBreakdown?: {
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
      specsQuality: number
    }
    recommendation?: string
    insights?: string[]
  }
  stockQuantity?: number
  shippingCost?: number
  hasFreeShipping?: boolean
  estimatedDeliveryDays?: number
  hasFreeReturns?: boolean
  companyMetrics?: {
    esgScore: number
    carbonFootprint?: number
    sustainabilityRating: number
    laborPractices: number
    supplyChainTransparency: number
  }
  dynamicSpecs?: Record<string, any>
}

interface LeaderboardCardProps {
  product: Product
  rank: number
  isExpanded: boolean
  onToggleExpand: () => void
}

interface ScoreThreshold {
  name: string
  minScore: number
  maxScore: number
  badgeColor: string
  badgeClass: string
  label: string
}

export default function LeaderboardCard({ product, rank, isExpanded, onToggleExpand }: LeaderboardCardProps) {
  const [thresholds, setThresholds] = useState<ScoreThreshold[]>([])
  const [veritasScore, setVeritasScore] = useState<any>(null)
  const [loadingVeritas, setLoadingVeritas] = useState(false)

  useEffect(() => {
    // Fetch score thresholds from API
    fetch('/api/config/score-thresholds')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.thresholds) {
          setThresholds(data.thresholds)
        }
      })
      .catch(err => console.error('Failed to fetch score thresholds:', err))
  }, [])

  useEffect(() => {
    // Fetch Veritas Score when expanded
    if (isExpanded && product.id && !veritasScore && !loadingVeritas) {
      setLoadingVeritas(true)
      fetch(`/api/products/${product.id}/veritas`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setVeritasScore(data.data)
          }
        })
        .catch(err => console.error('Failed to fetch Veritas Score:', err))
        .finally(() => setLoadingVeritas(false))
    }
  }, [isExpanded, product.id, veritasScore, loadingVeritas])

  const getRecommendationColor = (rec?: string) => {
    switch (rec?.toLowerCase()) {
      case 'strong-buy': return '#10b981'
      case 'buy': return '#3b82f6'
      case 'consider': return '#f59e0b'
      default: return '#ef4444'
    }
  }

  const getScoreColor = (score: number) => {
    // Use database-driven thresholds if available
    if (thresholds.length > 0) {
      const threshold = thresholds.find(t => score >= t.minScore && score <= t.maxScore)
      if (threshold) {
        return threshold.badgeColor
      }
    }

    // Fallback to hardcoded values
    if (score >= 85) return '#10b981'
    if (score >= 70) return '#3b82f6'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  // Handle both price formats (legacy and new)
  const displayPrice = typeof product.price === 'number' ? product.price : product.price?.current || 0
  const displayOriginalPrice = product.originalPrice || (typeof product.price === 'object' ? product.price.original : product.price)

  return (
    <div
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
        onClick={onToggleExpand}
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
          background: rank === 1 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                      rank === 2 ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' :
                      rank === 3 ? 'linear-gradient(135deg, #d97706 0%, #92400e 100%)' :
                      'rgba(255, 255, 255, 0.05)',
          fontSize: '1.5rem',
          fontWeight: '700'
        }}>
          {rank}
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
              {product.name.replace(/#\d+$/, '')}
            </h3>
            <span style={{
              padding: '0.25rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-primary)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {product.category?.replace(/_/g, ' ') || 'General'}
            </span>
          </div>
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            <span>Brand: {product.brand || 'Unknown'}</span>
            <span>Condition: {product.condition || 'Good'}</span>
            <span>Price: ${displayPrice}</span>
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
              color: getScoreColor(product.veritasScore || 0)
            }}>
              {(product.veritasScore || 0).toFixed(1)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)'
            }}>
              Veritas Score™
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp size={24} style={{ color: 'var(--text-tertiary)' }} />
          ) : (
            <ChevronDown size={24} style={{ color: 'var(--text-tertiary)' }} />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{
          padding: '0 1.5rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
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
                Veritas Score™ Pillars
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(product.veritasPillars ? [
                  { label: 'Product Quality', value: product.veritasPillars.quality, icon: Trophy },
                  { label: 'Value Proposition', value: product.veritasPillars.value, icon: DollarSign },
                  { label: 'Trust & Safety', value: product.veritasPillars.trust, icon: Shield },
                  { label: 'User Experience', value: product.veritasPillars.ux, icon: Truck },
                  { label: 'Sustainability', value: product.veritasPillars.sustainability, icon: Heart }
                ] : [
                  { label: 'Relevance', value: product.aiScoreBreakdown?.components?.relevance || 0, icon: Star },
                  { label: 'Price Value', value: product.aiScoreBreakdown?.components?.priceValue || 0, icon: DollarSign },
                  { label: 'Trust', value: product.aiScoreBreakdown?.components?.trustScore || 0, icon: Shield },
                  { label: 'Quality', value: product.aiScoreBreakdown?.components?.qualityScore || 0, icon: Trophy },
                  { label: 'Social Proof', value: product.aiScoreBreakdown?.components?.socialProof || 0, icon: Star },
                  { label: 'Convenience', value: product.aiScoreBreakdown?.components?.convenience || 0, icon: Truck },
                  { label: 'Urgency', value: product.aiScoreBreakdown?.components?.urgency || 0, icon: Zap },
                  { label: 'Emotional', value: product.aiScoreBreakdown?.components?.emotional || 0, icon: Heart },
                  { label: 'Specs Quality', value: product.aiScoreBreakdown?.components?.specsQuality || 0, icon: Package }
                ]).map(({ label, value, icon: Icon }) => (
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
                        width: product.veritasPillars ? `${value}%` : `${(value / 10) * 100}%`,
                        height: '100%',
                        background: product.veritasPillars ? getScoreColor(value) : getScoreColor(value * 10),
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      minWidth: '45px',
                      textAlign: 'right'
                    }}>
                      {product.veritasPillars ? `${value.toFixed(0)}/100` : `${value.toFixed(1)}/10`}
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
                  <span style={{ fontWeight: '600' }}>${displayPrice}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Original Price:</span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>
                    ${displayOriginalPrice}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Discount:</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>
                    {(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100).toFixed(1)}%
                  </span>
                </div>
                {product.stockQuantity !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Stock:</span>
                    <span>{product.stockQuantity} units</span>
                  </div>
                )}
                {(product.shippingCost !== undefined || product.hasFreeShipping !== undefined) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Shipping:</span>
                    <span>{product.hasFreeShipping ? 'Free ✅' : `$${product.shippingCost}`}</span>
                  </div>
                )}
                {product.estimatedDeliveryDays !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Delivery:</span>
                    <span>{product.estimatedDeliveryDays} days</span>
                  </div>
                )}
                {product.hasFreeReturns !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Returns:</span>
                    <span>{product.hasFreeReturns ? 'Free ✅' : 'Paid'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ESG Metrics */}
            {product.companyMetrics && (
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
                    <span style={{ fontWeight: '600' }}>{(product.companyMetrics.esgScore || 0).toFixed(1)}/100</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sustainability:</span>
                    <span>{(product.companyMetrics.sustainabilityRating || 0).toFixed(1)}/5</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Labor Practices:</span>
                    <span>{(product.companyMetrics.laborPractices || 0).toFixed(1)}/100</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Supply Chain:</span>
                    <span>{(product.companyMetrics.supplyChainTransparency || 0).toFixed(1)}/100</span>
                  </div>
                </div>
              </div>
            )}

            {/* Product Specifications */}
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
                <Package size={18} style={{ color: 'var(--accent-primary)' }} />
                Product Specifications
              </h4>
              {product.dynamicSpecs && Object.keys(product.dynamicSpecs).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  {Object.entries(product.dynamicSpecs).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span style={{ fontWeight: '600' }}>{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  textAlign: 'center'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>⚠️ No specifications available</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    This product was generated without detailed specs
                  </div>
                </div>
              )}
            </div>

            {/* Veritas Score™ Details */}
            {veritasScore && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '1rem',
                gridColumn: '1 / -1'
              }}>
                <h4 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🏆 Veritas Score™ - Complete Analysis (121 Parameters)
                  <span style={{
                    fontSize: '1.5rem',
                    color: getScoreColor(veritasScore.overallScore),
                    marginLeft: 'auto'
                  }}>
                    {veritasScore.overallScore}/100
                  </span>
                </h4>

                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div>Confidence: {veritasScore.confidence}% | Data Completeness: {veritasScore.dataCompleteness}%</div>
                  <div>Sources Used: {veritasScore.dataSourcesUsed?.length || 0} | Failed: {veritasScore.dataSourcesFailed?.length || 0}</div>
                </div>

                {/* Category Scores */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  {Object.entries(veritasScore.categoryScores || {}).map(([category, score]) => (
                    <div key={category} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${getScoreColor(score as number)}`
                    }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: getScoreColor(score as number)
                      }}>
                        {score}/100
                      </div>
                    </div>
                  ))}
                </div>

                {/* Insights */}
                {veritasScore.insights && veritasScore.insights.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>
                      AI Insights
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {veritasScore.insights.map((insight: string, i: number) => (
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
            )}

            {loadingVeritas && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '2rem',
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                🔄 Calculating Veritas Score™ (121 parameters)...
              </div>
            )}

            {/* AI Insights */}
            {((product.veritasInsights && product.veritasInsights.length > 0) || (product.aiScoreBreakdown?.insights && product.aiScoreBreakdown.insights.length > 0)) && !veritasScore && (
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
                  {product.veritasInsights ? 'Veritas Insights' : 'AI Insights'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(product.veritasInsights || product.aiScoreBreakdown?.insights || []).map((insight, i) => (
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
  )
}
