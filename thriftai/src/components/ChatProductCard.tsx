'use client'

import Image from 'next/image'
import { ExternalLink, Star } from 'lucide-react'
import { ScoredProduct } from '@/lib/services/productScoringService'

interface ChatProductCardProps {
  product: ScoredProduct
  index: number
}

export default function ChatProductCard({ product, index }: ChatProductCardProps) {
  const getSourceBadgeStyle = (source: string) => {
    switch (source.toLowerCase()) {
      case 'thriftai':
        return {
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--accent-primary)',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }
      case 'amazon':
        return {
          background: 'rgba(255, 152, 0, 0.15)',
          color: '#ff9800',
          border: '1px solid rgba(255, 152, 0, 0.3)'
        }
      case 'ebay':
        return {
          background: 'rgba(33, 150, 243, 0.15)',
          color: '#2196f3',
          border: '1px solid rgba(33, 150, 243, 0.3)'
        }
      default:
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-secondary)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
    }
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '0.75rem',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
      }}
    >
      <div className="flex gap-3">
        {/* Product Image */}
        {product.imageUrl && (
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.05)',
            flexShrink: 0
          }}>
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={64}
              height={64}
              className="object-cover"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <p style={{
                fontSize: '0.8125rem',
                fontWeight: '500',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family-primary)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: '1.3'
              }}>
                {product.title}
              </p>
              {product.brand && (
                <p style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-family-primary)',
                  margin: '0.125rem 0 0 0'
                }}>
                  {product.brand}
                </p>
              )}
            </div>

            {/* AI Score Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.125rem 0.5rem',
              background: 'rgba(16, 185, 129, 0.15)',
              borderRadius: '12px',
              flexShrink: 0
            }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-family-primary)'
              }}>
                {product.score.total}
              </span>
            </div>
          </div>

          {/* Price and Source */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-baseline gap-1">
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family-primary)'
              }}>
                ${product.price.toFixed(2)}
              </span>
              {product.shippingCost && product.shippingCost > 0 && (
                <span style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  +${product.shippingCost.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Source Badge */}
              <span style={{
                ...getSourceBadgeStyle(product.source),
                fontSize: '0.6875rem',
                fontWeight: '500',
                fontFamily: 'var(--font-family-primary)',
                padding: '0.125rem 0.5rem',
                borderRadius: '6px'
              }}>
                {product.source}
              </span>

              {/* View Link */}
              <a
                href={product.affiliateUrl || product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(16, 185, 129, 0.9)',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
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
                onClick={(e) => e.stopPropagation()}
              >
                View
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Condition and Rating */}
          {(product.condition || product.rating) && (
            <div className="flex items-center gap-3 mt-2">
              {product.condition && (
                <span style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  {product.condition}
                </span>
              )}
              {product.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                  <span style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-family-primary)'
                  }}>
                    {product.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}