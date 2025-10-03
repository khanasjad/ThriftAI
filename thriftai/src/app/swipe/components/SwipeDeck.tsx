'use client'

import { useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SwipeCard } from './SwipeCard'
import { SwipeProduct } from '@/lib/stores/swipeStore'
import { Heart, X, Star, RotateCcw, Zap } from 'lucide-react'
import { vibrate } from '@/lib/utils/cn'

interface SwipeDeckProps {
  products: SwipeProduct[]
  currentIndex: number
  onSwipeLeft: (product: SwipeProduct) => void
  onSwipeRight: (product: SwipeProduct) => void
  onViewDetails: (product: SwipeProduct) => void
  onAddToCart?: (product: SwipeProduct) => void
}

// TinderCard API type
interface TinderCardAPI {
  swipe(dir?: 'left' | 'right' | 'up' | 'down'): Promise<void>
  restoreCard(): Promise<void>
}

export function SwipeDeck({
  products,
  currentIndex,
  onSwipeLeft,
  onSwipeRight,
  onViewDetails,
  onAddToCart
}: SwipeDeckProps) {
  // Show 1 card at a time
  const visibleCards = products.slice(currentIndex, currentIndex + 1)

  // Refs for TinderCard instances - one for each visible card
  const cardRefs = useRef<(TinderCardAPI | null)[]>([])

  const handleSwipeLeft = (product: SwipeProduct) => {
    onSwipeLeft(product)
    vibrate(10)
  }

  const handleSwipeRight = (product: SwipeProduct) => {
    onSwipeRight(product)
    vibrate([10, 50])
  }

  // Programmatic swipe via button
  const triggerSwipe = async (direction: 'left' | 'right') => {
    if (visibleCards.length > 0 && cardRefs.current[0]) {
      try {
        await cardRefs.current[0].swipe(direction)
      } catch (error) {
        console.error('Swipe error:', error)
      }
    }
  }

  const handleButtonSwipeLeft = () => {
    if (visibleCards.length > 0) {
      handleSwipeLeft(visibleCards[0])
      triggerSwipe('left')
    }
  }

  const handleButtonSwipeRight = () => {
    if (visibleCards.length > 0) {
      handleSwipeRight(visibleCards[0])
      triggerSwipe('right')
    }
  }

  // No more products - Tinder style
  if (visibleCards.length === 0) {
    return (
      <div className="h-[calc(100vh-56px)] lg:h-[876px] flex items-center justify-center px-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-[#44D362] to-[#3FB854] rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Heart className="w-12 h-12 text-white fill-white" />
            </div>
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            That's all for now!
          </h2>
          <p className="text-gray-600 mb-8 text-base">
            Check back later for more matches
          </p>

          <button
            onClick={() => window.location.reload()}
            className="px-10 py-4 bg-gradient-to-r from-[#44D362] to-[#3FB854] text-white rounded-full font-semibold transition-all active:scale-95 shadow-lg hover:shadow-xl"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] lg:h-[876px] flex flex-col" style={{
      background: 'transparent'
    }}>
      {/* Card Stack - Takes most space */}
      <div className="flex-1 relative px-2 pt-2 pb-2">
        <AnimatePresence>
          {visibleCards.map((product, index) => {
            const isTop = index === 0
            const cardIndex = currentIndex + index

            return (
              <motion.div
                key={product.id}
                initial={{
                  scale: 1 - index * 0.03,
                  y: index * 6
                }}
                animate={{
                  scale: 1 - index * 0.03,
                  y: index * 6
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                style={{
                  zIndex: visibleCards.length - index
                }}
                className="absolute inset-0"
              >
                <SwipeCard
                  product={product}
                  onSwipeLeft={() => handleSwipeLeft(product)}
                  onSwipeRight={() => handleSwipeRight(product)}
                  onViewDetails={() => onViewDetails(product)}
                  onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
                  index={cardIndex}
                  active={isTop}
                  cardRef={(el) => {
                    cardRefs.current[index] = el
                  }}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
