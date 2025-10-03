'use client'

import React from 'react'
import { X, Star, ShoppingCart, ExternalLink, Package, Truck, Shield } from 'lucide-react'

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
    condition: string
    [key: string]: any
  }
}

interface ProductDetailModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart?: () => void
}

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart }: ProductDetailModalProps) {
  const [selectedImage, setSelectedImage] = React.useState(0)

  if (!isOpen || !product) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          pointerEvents: 'none'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            pointerEvents: 'auto',
            animation: 'slideUp 0.3s ease-out',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s ease'
            }}
            className="hover:bg-opacity-80"
          >
            <X className="w-5 h-5 text-primary" />
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '2rem' }}>
            {/* Left: Images */}
            <div>
              {/* Main Image */}
              <div
                style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={product.images?.[selectedImage] || product.images?.[0] || '/placeholder-image.jpg'}
                  alt={product.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Thumbnail Gallery */}
              {(product.images?.length || 0) > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
                  {product.images!.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: selectedImage === index ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '0.25rem',
                        cursor: 'pointer',
                        flexShrink: 0,
                        width: '80px',
                        height: '80px',
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Brand */}
              {product.brand && (
                <div className="text-accent font-medium mb-2" style={{ fontSize: '0.875rem' }}>
                  {product.brand}
                </div>
              )}

              {/* Title */}
              <h2 className="text-primary font-bold mb-3" style={{ fontSize: '1.5rem', lineHeight: '1.3' }}>
                {product.title}
              </h2>

              {/* Rating & Reviews */}
              {product.reviews?.rating !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star className="w-4 h-4" style={{ fill: 'var(--accent-primary)', color: 'var(--accent-primary)' }} />
                    <span className="text-primary font-semibold">{product.reviews.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                    ({(product.reviews.count || 0).toLocaleString()} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <span className="text-accent font-bold" style={{ fontSize: '2rem' }}>
                    ${(product.price?.current || 0).toFixed(2)}
                  </span>
                  {(product.price?.discountPercentage || 0) > 0 && (
                    <>
                      <span className="text-tertiary" style={{ fontSize: '1.125rem', textDecoration: 'line-through' }}>
                        ${(product.price?.original || 0).toFixed(2)}
                      </span>
                      <span style={{
                        background: 'var(--error)',
                        color: '#ffffff',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        -{product.price.discountPercentage}% OFF
                      </span>
                    </>
                  )}
                </div>
                {(product.price?.original || 0) > (product.price?.current || 0) && (
                  <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                    Save ${((product.price?.original || 0) - (product.price?.current || 0)).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Condition */}
              {product.specifications?.condition && (
                <div style={{ marginBottom: '1rem' }}>
                  <span className="product-spec-badge">
                    {product.specifications.condition}
                  </span>
                </div>
              )}

              {/* Quick Info */}
              <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package className="w-4 h-4 text-secondary" />
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                      {product.availability?.inStock ? 'In Stock' : 'Out of Stock'}
                      {(product.availability?.quantity || 0) > 0 && ` (${product.availability.quantity} available)`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck className="w-4 h-4 text-secondary" />
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                      Ships in {product.availability?.shippingDays || 'N/A'} days
                      {(product.availability?.shippingCost || 0) === 0 ? ' • FREE Shipping' : ` • $${(product.availability?.shippingCost || 0).toFixed(2)} shipping`}
                    </span>
                  </div>
                  {product.seller?.name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Shield className="w-4 h-4 text-secondary" />
                      <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                        Seller: {product.seller.name} ({(product.seller.rating || 0).toFixed(1)}★)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="text-primary font-semibold mb-2" style={{ fontSize: '1rem' }}>Description</h3>
                <p className="text-secondary" style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                  {product.description}
                </p>
              </div>

              {/* Actions */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
                {onAddToCart && (
                  <button
                    onClick={() => {
                      onAddToCart()
                      onClose()
                    }}
                    className="btn-modern-primary flex-1 flex items-center justify-center gap-2"
                    disabled={!product.availability?.inStock}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                )}
                <button
                  className="btn-modern-secondary flex items-center justify-center gap-2"
                  style={{ minWidth: '120px' }}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Listing</span>
                </button>
              </div>
            </div>
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
      `}</style>
    </>
  )
}
