'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Star, Heart, Share2, BarChart3 } from 'lucide-react'

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
    size?: string
    [key: string]: any
  }
  veritasScore?: number
  isHighQuality?: boolean
  leaderboardRank?: number
}

interface ProductCardProps {
  product: Product
  index: number
  viewMode: 'grid' | 'list'
  onAddToCart: () => void
  onToggleFavorite?: () => void
  onShare?: () => void
  onCompare?: () => void
  isFavorited?: boolean
  isInComparison?: boolean
  cartLoading?: boolean
}

export default function ProductCard({
  product,
  index,
  viewMode,
  onAddToCart,
  onToggleFavorite,
  onShare,
  onCompare,
  isFavorited = false,
  isInComparison = false,
  cartLoading = false
}: ProductCardProps) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  const currentPrice = product.price?.current ?? product.price ?? 0
  const originalPrice = product.price?.original ?? currentPrice
  const discount = product.price?.discountPercentage ?? 0
  const hasVeritasScore = product.veritasScore !== undefined && product.veritasScore !== null
  const hasMultipleImages = product.images && product.images.length > 1

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setImageLoaded(false)
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setImageLoaded(false)
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

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

  const getVeritasScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-600'
    if (score >= 80) return 'bg-blue-600'
    if (score >= 70) return 'bg-yellow-600'
    if (score >= 60) return 'bg-orange-600'
    return 'bg-red-600'
  }

  const handleCardClick = () => {
    const productId = (product as any).id || product.asin
    router.push(`/products/${productId}`)
  }

  return (
    <div
      className={`${viewMode === 'grid' ? 'product-card-modern' : 'product-card-list'} clickable-product-card`}
      onClick={handleCardClick}
    >
      {/* Product Image with Carousel */}
      <div className="product-image-container" style={{ position: 'relative' }}>
        {/* Image */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
          <img
            src={product.images[currentImageIndex] || '/placeholder-image.jpg'}
            alt={product.title}
            className="product-image"
            onLoad={() => setImageLoaded(true)}
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />

          {/* Image skeleton while loading */}
          {!imageLoaded && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite'
              }}
            />
          )}
        </div>

        {/* Image Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all z-10"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all z-10"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>

            {/* Image Dots Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {product.images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Top Left Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {/* Top 3 Golden Star Badge */}
          {index < 3 && (
            <div style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#000',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-bold)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)'
            }}>
              <Star size={12} fill="#000" />
              #{index + 1}
            </div>
          )}

          {/* Veritas Score Badge */}
          {hasVeritasScore && (
            <div className={`px-2 py-1 rounded-md text-xs font-semibold text-white ${getVeritasScoreColor(product.veritasScore!)}`}>
              Veritas: {product.veritasScore!.toFixed(0)}
            </div>
          )}

          {/* Top Quality Badge */}
          {product.isHighQuality && (
            <div className="px-2 py-1 rounded-md text-xs font-semibold bg-purple-600 text-white">
              ⭐ Top Quality
            </div>
          )}

          {/* Leaderboard Rank */}
          {product.leaderboardRank && product.leaderboardRank <= 100 && (
            <div className="px-2 py-1 rounded-md text-xs font-semibold bg-orange-600 text-white">
              #{product.leaderboardRank} Global
            </div>
          )}
        </div>

        {/* Top Right Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="product-discount-badge">
              -{discount}%
            </div>
          )}

          {/* Out of Stock Badge */}
          {!product.availability.inStock && (
            <div className="product-out-of-stock">
              <span>Out of Stock</span>
            </div>
          )}
        </div>

        {/* Action Buttons (Hover) */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity z-20"
             style={{ marginTop: discount > 0 || !product.availability.inStock ? '40px' : '0' }}>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isFavorited ? 'bg-red-500' : 'bg-black/50 hover:bg-black/70'
              }`}
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white text-white' : 'text-white'}`} />
            </button>
          )}

          {onShare && (
            <button
              onClick={(e) => { e.stopPropagation(); onShare() }}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          )}

          {onCompare && (
            <button
              onClick={(e) => { e.stopPropagation(); onCompare() }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isInComparison ? 'bg-blue-500' : 'bg-black/50 hover:bg-black/70'
              }`}
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <BarChart3 className={`w-4 h-4 ${isInComparison ? 'text-white' : 'text-white'}`} />
            </button>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="product-info-container">
        {/* Brand and Rating */}
        <div className="product-brand-rating">
          <span className="product-brand">
            {product.brand}
          </span>
          <div className="product-rating">
            <span className="product-star">{renderStars(product.reviews.rating)}</span>
            <span>{product.reviews.rating}</span>
          </div>
        </div>

        {/* Product Title */}
        <h3 className="product-title">
          {product.title.replace(/#\d+$/,'')}
        </h3>

        {/* Specifications */}
        <div className="product-specs">
          {product.specifications.size && (
            <span className="product-spec-badge">
              {product.specifications.size}
            </span>
          )}
          {product.specifications.condition && (
            <span className="product-spec-badge">
              {product.specifications.condition}
            </span>
          )}
        </div>

        {/* Price Section */}
        <div className="product-pricing">
          <div className="product-price-row">
            <span className="product-current-price">
              ${currentPrice.toFixed(2)}
            </span>
            {discount > 0 && (
              <span className="product-original-price">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            className="product-add-to-cart"
            disabled={!product.availability.inStock || cartLoading}
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart()
            }}
          >
            {!product.availability.inStock
              ? 'Out of Stock'
              : cartLoading
              ? 'Adding...'
              : 'Add to Cart'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .clickable-product-card {
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .clickable-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  )
}
