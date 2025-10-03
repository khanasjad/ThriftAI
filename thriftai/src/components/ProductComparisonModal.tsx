'use client'

import React, { useState } from 'react'
import { X, Star, DollarSign, Package, Truck, Shield, Award, ChevronLeft, ChevronRight } from 'lucide-react'

interface Product {
  asin: string
  title: string
  brand: string
  price: {
    current: number
    original: number
    discountPercentage: number
  }
  images: string[]
  reviews: {
    rating: number
    count: number
  }
  specifications: {
    condition: string
    size?: string
    [key: string]: any
  }
  availability: {
    inStock: boolean
    shippingDays: number
    shippingCost: number
  }
  seller: {
    name: string
    rating: number
  }
  veritasScore?: number
}

interface ProductComparisonModalProps {
  products: Product[]
  isOpen: boolean
  onClose: () => void
  onRemoveProduct: (asin: string) => void
  onAddToCart: (asin: string) => void
}

export default function ProductComparisonModal({
  products,
  isOpen,
  onClose,
  onRemoveProduct,
  onAddToCart
}: ProductComparisonModalProps) {
  const [scrollPosition, setScrollPosition] = useState(0)

  if (!isOpen) return null

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('comparison-scroll')
    if (container) {
      const scrollAmount = 400
      const newPosition = direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount

      container.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  const comparisonRows = [
    { label: 'Product', key: 'title', type: 'title' },
    { label: 'Price', key: 'price', type: 'price' },
    { label: 'Veritas Score', key: 'veritasScore', type: 'score' },
    { label: 'Condition', key: 'specifications.condition', type: 'text' },
    { label: 'Size', key: 'specifications.size', type: 'text' },
    { label: 'Rating', key: 'reviews', type: 'rating' },
    { label: 'Availability', key: 'availability', type: 'availability' },
    { label: 'Shipping', key: 'shipping', type: 'shipping' },
    { label: 'Seller', key: 'seller', type: 'seller' },
  ]

  const getValue = (product: Product, key: string, type: string) => {
    if (type === 'title') {
      return (
        <div className="p-4">
          <img
            src={product.images[0] || '/placeholder-image.jpg'}
            alt={product.title}
            className="w-full h-32 object-cover rounded-lg mb-3"
          />
          <div className="font-medium text-sm line-clamp-2">{product.title}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">{product.brand}</div>
        </div>
      )
    }

    if (type === 'price') {
      const savings = product.price.original - product.price.current
      return (
        <div className="p-4">
          <div className="text-xl font-bold text-[var(--accent-primary)]">
            ${product.price.current.toFixed(2)}
          </div>
          {product.price.discountPercentage > 0 && (
            <>
              <div className="text-sm text-[var(--text-secondary)] line-through">
                ${product.price.original.toFixed(2)}
              </div>
              <div className="text-xs text-green-500 font-medium">
                Save ${savings.toFixed(2)} ({product.price.discountPercentage}% off)
              </div>
            </>
          )}
        </div>
      )
    }

    if (type === 'score') {
      const score = product.veritasScore || 0
      const getScoreColor = (s: number) => {
        if (s >= 90) return 'text-green-500'
        if (s >= 80) return 'text-blue-500'
        if (s >= 70) return 'text-yellow-500'
        return 'text-orange-500'
      }

      return (
        <div className="p-4 flex items-center justify-center">
          {product.veritasScore ? (
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
          ) : (
            <div className="text-sm text-[var(--text-tertiary)]">N/A</div>
          )}
        </div>
      )
    }

    if (type === 'rating') {
      return (
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="font-semibold">{product.reviews.rating.toFixed(1)}</span>
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            {product.reviews.count.toLocaleString()} reviews
          </div>
        </div>
      )
    }

    if (type === 'availability') {
      return (
        <div className="p-4">
          <div className={`font-medium ${product.availability.inStock ? 'text-green-500' : 'text-red-500'}`}>
            {product.availability.inStock ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>
      )
    }

    if (type === 'shipping') {
      return (
        <div className="p-4">
          <div className="text-sm">{product.availability.shippingDays} days</div>
          <div className="text-xs text-[var(--text-secondary)]">
            {product.availability.shippingCost === 0 ? 'Free shipping' : `$${product.availability.shippingCost.toFixed(2)}`}
          </div>
        </div>
      )
    }

    if (type === 'seller') {
      return (
        <div className="p-4">
          <div className="text-sm font-medium">{product.seller.name}</div>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs">{product.seller.rating.toFixed(1)}</span>
          </div>
        </div>
      )
    }

    if (type === 'text') {
      const value = key.split('.').reduce((obj: any, k) => obj?.[k], product)
      return (
        <div className="p-4">
          <div className="text-sm">{value || 'N/A'}</div>
        </div>
      )
    }

    return <div className="p-4 text-sm">N/A</div>
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm animate-fadeIn"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl w-full max-w-7xl max-h-[90vh] flex flex-col animate-slideUp"
          style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Header */}
          <div className="border-b border-[var(--border-primary)] p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <Award className="w-6 h-6 text-[var(--accent-primary)]" />
                Compare Products
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Comparing {products.length} products side by side
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center hover:bg-[var(--bg-primary)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          </div>

          {/* Comparison Table */}
          <div className="flex-1 overflow-auto relative">
            {products.length > 3 && (
              <>
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center hover:bg-[var(--bg-primary)] transition-colors"
                  disabled={scrollPosition === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div id="comparison-scroll" className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-[var(--bg-secondary)] z-10">
                  <tr>
                    <th className="p-4 text-left border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] min-w-[200px]">
                      <div className="font-semibold text-[var(--text-primary)]">Feature</div>
                    </th>
                    {products.map((product) => (
                      <th
                        key={product.asin}
                        className="p-4 border-b border-l border-[var(--border-primary)] min-w-[280px] relative"
                      >
                        <button
                          onClick={() => onRemoveProduct(product.asin)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500 flex items-center justify-center transition-colors group"
                        >
                          <X className="w-4 h-4 text-red-500 group-hover:text-white" />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-[var(--border-primary)]">
                      <td className="p-4 bg-[var(--bg-tertiary)] font-medium text-[var(--text-primary)]">
                        {row.label}
                      </td>
                      {products.map((product) => (
                        <td
                          key={product.asin}
                          className="border-l border-[var(--border-primary)] text-[var(--text-primary)]"
                        >
                          {getValue(product, row.key, row.type)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Action Row */}
                  <tr>
                    <td className="p-4 bg-[var(--bg-tertiary)] font-medium text-[var(--text-primary)]">
                      Action
                    </td>
                    {products.map((product) => (
                      <td
                        key={product.asin}
                        className="p-4 border-l border-[var(--border-primary)]"
                      >
                        <button
                          onClick={() => onAddToCart(product.asin)}
                          disabled={!product.availability.inStock}
                          className="w-full py-2 px-4 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {product.availability.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border-primary)] p-4 flex items-center justify-between">
            <div className="text-sm text-[var(--text-secondary)]">
              Select up to 4 products to compare
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
