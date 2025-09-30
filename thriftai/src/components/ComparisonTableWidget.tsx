'use client'

import { useState } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronUp, ExternalLink, Award, TrendingUp, Package } from 'lucide-react'
import { ScoredProduct } from '@/lib/services/productScoringService'

interface ComparisonTableWidgetProps {
  topProducts: ScoredProduct[]
  insights?: {
    totalCompared: number
    avgScore: number
    scoreRange: { min: number; max: number }
    bestSource: string
    sourceBreakdown: Record<string, number>
  }
  onProductClick?: (product: ScoredProduct) => void
}

export default function ComparisonTableWidget({
  topProducts,
  insights,
  onProductClick
}: ComparisonTableWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!topProducts || topProducts.length === 0) {
    return null
  }

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'best_value':
        return 'bg-green-600'
      case 'premium':
        return 'bg-purple-600'
      case 'budget':
        return 'bg-blue-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getBadgeLabel = (badge?: string) => {
    switch (badge) {
      case 'best_value':
        return 'Best Value'
      case 'premium':
        return 'Premium'
      case 'budget':
        return 'Budget Pick'
      default:
        return ''
    }
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'thriftai':
        return 'bg-green-900/50 text-green-400 border-green-700'
      case 'amazon':
        return 'bg-orange-900/50 text-orange-400 border-orange-700'
      case 'ebay':
        return 'bg-blue-900/50 text-blue-400 border-blue-700'
      case 'nike':
        return 'bg-red-900/50 text-red-400 border-red-700'
      case 'adidas':
        return 'bg-indigo-900/50 text-indigo-400 border-indigo-700'
      default:
        return 'bg-gray-900/50 text-gray-400 border-gray-700'
    }
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
        className="flex items-center justify-between cursor-pointer transition-all"
        style={{
          padding: '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
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
        </div>
        <button style={{ color: 'var(--text-secondary)' }}>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div>
          {/* Compact Table View */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
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
                    Score
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
                  }}></th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr
                    key={`${product.source}-${product.id}`}
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
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
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node, ...props }) => <span {...props} />,
                              strong: ({ node, ...props }) => (
                                <strong style={{ fontWeight: '600', color: 'var(--text-primary)' }} {...props} />
                              ),
                              em: ({ node, ...props }) => (
                                <em style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }} {...props} />
                              ),
                              code: ({ node, ...props }: any) => (
                                <code
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '0.125rem 0.25rem',
                                    borderRadius: '3px',
                                    fontSize: '0.75rem',
                                    fontFamily: 'var(--font-family-mono)'
                                  }}
                                  {...props}
                                />
                              ),
                              a: ({ node, ...props }) => (
                                <a
                                  style={{
                                    color: 'var(--accent-primary)',
                                    textDecoration: 'underline',
                                    cursor: 'pointer'
                                  }}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                />
                              )
                            }}
                          >
                            {product.title}
                          </ReactMarkdown>
                        </div>
                        {product.brand && (
                          <div style={{
                            fontSize: '0.6875rem',
                            color: 'var(--text-tertiary)',
                            fontFamily: 'var(--font-family-primary)'
                          }}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ node, ...props }) => <span {...props} />,
                                strong: ({ node, ...props }) => (
                                  <strong style={{ fontWeight: '600' }} {...props} />
                                ),
                                em: ({ node, ...props }) => (
                                  <em style={{ fontStyle: 'italic' }} {...props} />
                                ),
                                code: ({ node, ...props }: any) => (
                                  <code
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.1)',
                                      padding: '0.125rem 0.25rem',
                                      borderRadius: '3px',
                                      fontSize: '0.625rem',
                                      fontFamily: 'var(--font-family-mono)'
                                    }}
                                    {...props}
                                  />
                                )
                              }}
                            >
                              {product.brand}
                            </ReactMarkdown>
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
                        background: product.source === 'thriftai' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: product.source === 'thriftai' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        border: `1px solid ${product.source === 'thriftai' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
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
                          ${product.price.toFixed(2)}
                        </p>
                        <p style={{
                          fontSize: '0.6875rem',
                          color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-family-primary)',
                          margin: 0
                        }}>
                          {product.shippingCost && product.shippingCost > 0 ?
                            `+$${product.shippingCost.toFixed(2)}` : 'Free'}
                        </p>
                      </div>
                    </td>

                    {/* AI Score */}
                    <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-2">
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'var(--accent-primary)',
                          fontFamily: 'var(--font-family-primary)'
                        }}>
                          {product.score.total}
                        </span>
                        <div style={{
                          width: '40px',
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div
                            style={{
                              width: `${product.score.total}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                              borderRadius: '2px'
                            }}
                          />
                        </div>
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 1)'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
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
                  Avg: <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>{insights.avgScore}</span>
                </span>
                <span>·</span>
                <span>
                  Range: {insights.scoreRange.min}-{insights.scoreRange.max}
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