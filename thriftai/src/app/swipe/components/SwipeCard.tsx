'use client'

import { useState, useRef, forwardRef } from 'react'
import Image from 'next/image'
import TinderCard from 'react-tinder-card'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { formatPrice, calculateDiscount, cn, vibrate } from '@/lib/utils/cn'
import { SwipeProduct } from '@/lib/stores/swipeStore'
import { Star, Sparkles, ChevronLeft, ChevronRight, Heart, X } from 'lucide-react'

interface SwipeCardProps {
  product: SwipeProduct
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onViewDetails: () => void
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
      {/* Card - Instagram-Style Layout: Image Top, Content Below */}
      <div
        className="h-full w-full rounded-xl bg-white shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1)',
          display: 'grid',
          gridTemplateRows: '450px 1fr',
          position: 'relative'
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
        <div className="w-full bg-white border-b-4 border-gray-300" style={{ gridRow: 1, height: '450px', overflow: 'hidden' }}>
          {/* Image frame with padding */}
          <div className="w-full h-full p-3">
            <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          </div>

          {/* Discount Badge - Top Right (outside frame) */}
          {discount > 0 && (
            <div className="absolute top-6 right-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg z-20">
              {discount}% OFF
            </div>
          )}

          {/* Image Navigation Arrows (outside frame) */}
          {images.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevImage()
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/90 transition-all z-20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              )}

              {currentImageIndex < images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextImage()
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/90 transition-all z-20"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
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

            {/* Badges Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {product.brand && (
                <span style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', fontSize: '0.875rem', fontWeight: '500', borderRadius: '8px', color: '#000000' }}>
                  {product.brand}
                </span>
              )}
              {product.condition && (
                <span style={{ padding: '6px 12px', backgroundColor: '#eff6ff', fontSize: '0.875rem', fontWeight: '500', borderRadius: '8px', color: '#1e40af' }}>
                  {product.condition}
                </span>
              )}
              {product.category && (
                <span style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', fontSize: '0.875rem', fontWeight: '500', borderRadius: '8px', color: '#000000' }}>
                  {product.category}
                </span>
              )}
              {product.rating && product.rating > 0 && (
                <span style={{ padding: '6px 12px', backgroundColor: '#fef3c7', fontSize: '0.875rem', fontWeight: '500', borderRadius: '8px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

            {/* Action Buttons - Modern 2025 Style */}
            <div style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '16px',
              position: 'sticky',
              bottom: '0',
              backgroundColor: '#ffffff',
              paddingBottom: '24px',
              marginLeft: '-24px',
              marginRight: '-24px',
              paddingLeft: '24px',
              paddingRight: '24px',
              borderTop: '1px solid #f3f4f6'
            }}>
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
