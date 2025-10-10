'use client'

import { useState, useRef, forwardRef } from 'react'
import Image from 'next/image'
import TinderCard from 'react-tinder-card'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { formatPrice, calculateDiscount, cn, vibrate } from '@/lib/utils/cn'
import { SwipeProduct } from '@/lib/stores/swipeStore'
import { Star, Sparkles, ChevronLeft, ChevronRight, Heart, X, ShoppingCart, Eye } from 'lucide-react'

interface SwipeCardProps {
  product: SwipeProduct
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onViewDetails: () => void
  onAddToCart?: () => void
  style?: React.CSSProperties
  index: number
  active: boolean
  cardRef?: React.Ref<any>
}

export function SwipeCard({
  product,
  onSwipeLeft,
  onSwipeRight,
  onViewDetails,
  onAddToCart,
  style,
  index,
  active,
  cardRef
}: SwipeCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const startTimeRef = useRef<number>(0)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleSwipe = (direction: string) => {
    vibrate([10, 50, 10])

    if (direction === 'right') {
      onSwipeRight()
    } else if (direction === 'left') {
      onSwipeLeft()
    }
  }

  const handleCardLeftScreen = (direction: string) => {
    // Card has completely left the screen
  }

  // Image carousel navigation
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => Math.min(product.images.length - 1, prev + 1))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startTimeRef.current = Date.now()
    startPosRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    startTimeRef.current = 0
    startPosRef.current = null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    startTimeRef.current = Date.now()
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    startTimeRef.current = 0
    startPosRef.current = null
  }

  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0

  const images = product.images && product.images.length > 0
    ? product.images
    : ['/placeholder-image.jpg']

  return (
    <TinderCard
      ref={cardRef}
      onSwipe={handleSwipe}
      onCardLeftScreen={handleCardLeftScreen}
      preventSwipe={active ? [] : ['up', 'down', 'left', 'right']}
      swipeRequirementType="position"
      swipeThreshold={100}
      className={cn(
        'absolute inset-0',
        active ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      )}
      flickOnSwipe={true}
    >
      {/* Card - Instagram-Style Layout with Floating Effect & Ambient Glow */}
      <div
        className="h-full w-full rounded-xl bg-white shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.25), 0 8px 24px rgba(118, 75, 162, 0.15), 0 0 80px rgba(102, 126, 234, 0.1)',
          display: 'grid',
          gridTemplateRows: '450px 1fr 140px',
          position: 'relative',
          transform: 'translateZ(0)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Swipe Indicators - Fixed position overlay */}
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 px-10 py-3 rounded-lg font-black text-6xl text-[#44D362] border-4 border-[#44D362] bg-white/20 backdrop-blur-sm opacity-0 swipe-like-indicator rotate-[-20deg] tracking-wider pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          LIKE
        </div>

        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 px-10 py-3 rounded-lg font-black text-6xl text-[#FF4458] border-4 border-[#FF4458] bg-white/20 backdrop-blur-sm opacity-0 swipe-nope-indicator rotate-[20deg] tracking-wider pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          NOPE
        </div>

        {/* Image Section - Row 1 of grid (FIXED HEIGHT, NO ABSOLUTE POSITIONING) */}
        <div className="w-full bg-white" style={{ gridRow: 1, height: '450px', overflow: 'hidden' }}>
          {/* Image frame with padding */}
          <div className="w-full h-full p-4">
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden flex items-center justify-center" style={{
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          </div>

          {/* Engagement Badges - Top Left (outside frame) */}
          <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
            {/* Hot Deal Badge */}
            {discount >= 50 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="px-3 py-1.5 rounded-xl text-xs font-black backdrop-blur-sm border border-white/30 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)'
                }}
              >
                🔥 HOT DEAL
              </motion.div>
            )}

            {/* Top Rated Badge */}
            {product.rating && product.rating >= 4.5 && (
              <motion.div
                initial={{ scale: 0, x: -20 }}
                animate={{ scale: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="px-3 py-1.5 rounded-xl text-xs font-black backdrop-blur-sm border border-white/30 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#78350f',
                  boxShadow: '0 4px 16px rgba(251, 191, 36, 0.4)'
                }}
              >
                ⭐ TOP RATED
              </motion.div>
            )}

            {/* Limited Stock Badge (show randomly for engagement) */}
            {Math.random() > 0.7 && (
              <motion.div
                initial={{ scale: 0, x: -20 }}
                animate={{ scale: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="px-3 py-1.5 rounded-xl text-xs font-black backdrop-blur-sm border border-white/30 shadow-lg animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(249, 115, 22, 0.4)'
                }}
              >
                ⚡ LIMITED STOCK
              </motion.div>
            )}
          </div>

          {/* Discount Badge - Top Right (outside frame) */}
          {discount > 0 && (
            <div className="absolute top-6 right-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-2xl text-sm font-black shadow-2xl z-20 backdrop-blur-sm border border-white/20" style={{
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
            }}>
              {discount}% OFF
            </div>
          )}

          {/* Image Navigation Arrows (outside frame) - Modern 2025 Style */}
          {images.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevImage()
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/95 backdrop-blur-xl rounded-2xl flex items-center justify-center transition-all z-20 border border-gray-200/50"
                  style={{
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.16)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)'
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" strokeWidth={2.5} />
                </button>
              )}

              {currentImageIndex < images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextImage()
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/95 backdrop-blur-xl rounded-2xl flex items-center justify-center transition-all z-20 border border-gray-200/50"
                  style={{
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.16)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)'
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" strokeWidth={2.5} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Content Section - Row 2 of grid */}
        <div
          ref={scrollContainerRef}
          className="swipe-card-content"
          style={{
            gridRow: 2,
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}
        >
          <div style={{ padding: '24px', color: '#000000' }}>
            {/* Product Name */}
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1.2', color: '#000000' }}>
                {product.name}
              </h2>
            </div>

            {/* Price Section */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#000000' }}>
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span style={{ fontSize: '1.125rem', textDecoration: 'line-through', color: '#666666' }}>
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Badges Row - Modern 2025 Style */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {product.brand && (
                <span style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  color: '#000000',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                  {product.brand}
                </span>
              )}
              {product.condition && (
                <span style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  color: '#1e40af',
                  border: '1px solid #93c5fd',
                  boxShadow: '0 2px 8px rgba(30, 64, 175, 0.1)'
                }}>
                  {product.condition}
                </span>
              )}
              {product.category && (
                <span style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  color: '#000000',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                  {product.category}
                </span>
              )}
              {product.rating && product.rating > 0 && (
                <span style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1px solid #fcd34d',
                  boxShadow: '0 2px 8px rgba(180, 83, 9, 0.1)'
                }}>
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  {product.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '8px', color: '#000000' }}>Description</h3>
                <p style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap', color: '#1f2937' }}>
                  {product.description}
                </p>
              </div>
            )}

            {/* Seller Info / Recently Active */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#4b5563' }}>Recently Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>📍</span>
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>2 miles away</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at Bottom (Grid Row 3) */}
        <div style={{
          gridRow: 3,
          width: '100%',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #f3f4f6',
          padding: '16px 24px',
          pointerEvents: 'auto',
          touchAction: 'auto'
        }}>
          {/* Action Buttons - Modern 2025 Style */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Top Row: Add to Cart & View Details */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Add to Cart Button */}
                {onAddToCart && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onAddToCart()
                    }}
                    style={{
                      flex: 1,
                      height: '56px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
                    <span>Add to Cart</span>
                  </button>
                )}

                {/* View Details Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onViewDetails()
                  }}
                  style={{
                    flex: 1,
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <Eye className="w-5 h-5" strokeWidth={2.5} />
                  <span>Details</span>
                </button>
              </div>

              {/* Bottom Row: Pass & Like */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Dislike Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSwipeLeft()
                  }}
                  style={{
                    flex: 1,
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 107, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 107, 107, 0.3)'
                  }}
                >
                  <X className="w-6 h-6" strokeWidth={2.5} />
                  <span>Pass</span>
                </button>

                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSwipeRight()
                  }}
                  style={{
                    flex: 1,
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  <Heart className="w-6 h-6" strokeWidth={2.5} fill="currentColor" />
                  <span>Like</span>
                </button>
              </div>
            </div>
        </div>
      </div>
    </TinderCard>
  )
}
