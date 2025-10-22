'use client'

import { useState } from 'react'
import TinderCard from 'react-tinder-card'
import { motion } from 'framer-motion'
import { formatPrice, calculateDiscount, cn, vibrate } from '@/lib/utils/cn'
import { SwipeProduct } from '@/lib/stores/swipeStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SwipeCardProps {
  product: SwipeProduct
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSwipeUp: () => void
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
  onSwipeUp,
  onViewDetails,
  index,
  active,
  cardRef
}: SwipeCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const handleSwipe = (direction: string) => {
    vibrate([10, 50, 10])

    if (direction === 'right') {
      onSwipeRight()
    } else if (direction === 'left') {
      onSwipeLeft()
    } else if (direction === 'up') {
      vibrate([10, 30, 10, 50])
      onSwipeUp()
    }
  }

  const handleCardLeftScreen = (direction: string) => {
    // Card has completely left the screen
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => Math.min(product.images.length - 1, prev + 1))
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
      preventSwipe={active ? ['down'] : ['up', 'down', 'left', 'right']}
      swipeRequirementType="position"
      swipeThreshold={100}
      className={cn(
        'absolute inset-0',
        active ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      )}
      flickOnSwipe={true}
    >
      {/* Tinder-Style Card with Full Bleed Background Image */}
      <div
        className="swipe-card-inner"
        style={{
          width: '100%',
          height: '600px',
          backgroundImage: `url(${images[currentImageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.25), 0 8px 24px rgba(118, 75, 162, 0.15)'
        }}
      >
        {/* Swipe Indicators */}
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

        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 px-10 py-3 rounded-lg font-black text-5xl text-[#3b82f6] border-4 border-[#3b82f6] bg-white/20 backdrop-blur-sm opacity-0 swipe-super-indicator tracking-wider pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          ⭐ SUPER LIKE
        </div>

        {/* Veritas Score Badge - Top Left */}
        {product.veritasScore && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="absolute top-6 left-6 px-3 py-2 rounded-xl text-xs font-black backdrop-blur-sm border border-white/30 shadow-lg z-20"
            style={{
              background: product.veritasScore.score >= 90
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : product.veritasScore.score >= 80
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : product.veritasScore.score >= 70
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>VERITAS</div>
            <div style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              {Math.round(product.veritasScore.score)}
            </div>
          </motion.div>
        )}


        {/* Image Navigation Arrows - Modern Circular Design */}
        {images.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevImage()
                }}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 20,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                }}
                aria-label="Previous image"
              >
                <ChevronLeft style={{ width: '24px', height: '24px', color: '#1f2937' }} strokeWidth={2.5} />
              </button>
            )}

            {currentImageIndex < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNextImage()
                }}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 20,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                }}
                aria-label="Next image"
              >
                <ChevronRight style={{ width: '24px', height: '24px', color: '#1f2937' }} strokeWidth={2.5} />
              </button>
            )}
          </>
        )}

        {/* Image Indicator Dots - Top of card - Hidden for now */}
        {images.length > 1 && false && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-20">
            {images.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === currentImageIndex ? '28px' : '28px',
                  height: '3px',
                  borderRadius: '2px',
                  background: idx === currentImageIndex ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        )}

        {/* Text Overlay - Bottom (Tinder Style) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)',
            padding: '80px 24px 24px 24px',
            pointerEvents: 'none'
          }}
        >
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            lineHeight: 1.2,
            color: 'rgb(255, 255, 255)',
            WebkitTextFillColor: 'rgb(255, 255, 255)',
            margin: '0 0 10px 0',
            textShadow: '0 3px 12px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)'
          }}>
            {product.name.length > 50 ? product.name.substring(0, 50) + '...' : product.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'rgb(255, 255, 255)',
              WebkitTextFillColor: 'rgb(255, 255, 255)',
              textShadow: '0 3px 12px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)'
            }}>
              {formatPrice(product.price)}
            </span>
            {product.brand && (
              <>
                <span style={{ color: 'rgb(255, 255, 255)', WebkitTextFillColor: 'rgb(255, 255, 255)', opacity: 0.8 }}>•</span>
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: 'rgb(255, 255, 255)',
                  WebkitTextFillColor: 'rgb(255, 255, 255)',
                  opacity: 0.95,
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)'
                }}>
                  {product.brand}
                </span>
              </>
            )}
            {product.condition && (
              <>
                <span style={{ color: 'rgb(255, 255, 255)', WebkitTextFillColor: 'rgb(255, 255, 255)', opacity: 0.8 }}>•</span>
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: 'rgb(255, 255, 255)',
                  WebkitTextFillColor: 'rgb(255, 255, 255)',
                  opacity: 0.95,
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)'
                }}>
                  {product.condition}
                </span>
              </>
            )}
          </div>

          {/* View Details Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onViewDetails()
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onViewDetails()
            }}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '24px',
              color: 'rgb(31, 41, 55)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </TinderCard>
  )
}
