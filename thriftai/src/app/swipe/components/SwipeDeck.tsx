'use client'

import { useRef, useMemo, useEffect } from 'react'
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
  onSwipeUp: (product: SwipeProduct) => void
  onViewDetails: (product: SwipeProduct) => void
  onUndo?: () => void
  canUndo?: boolean
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
  onSwipeUp,
  onViewDetails,
  onUndo,
  canUndo = false,
  onAddToCart
}: SwipeDeckProps) {
  // Show 3 cards at a time (stacked effect like LinkedIn)
  const visibleCards = products.slice(currentIndex, currentIndex + 3)

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

  const handleSwipeUp = (product: SwipeProduct) => {
    onSwipeUp(product)
    vibrate([10, 30, 10, 50]) // Special vibration pattern for Super Like
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          handleButtonSwipeLeft()
          break
        case 'ArrowRight':
          event.preventDefault()
          handleButtonSwipeRight()
          break
        case 'ArrowUp':
        case ' ':
          event.preventDefault()
          if (visibleCards.length > 0) {
            onViewDetails(visibleCards[0])
          }
          break
        case 'z':
        case 'Z':
          if (canUndo && onUndo) {
            event.preventDefault()
            onUndo()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visibleCards, canUndo, onUndo])

  // No more products - Tinder style with AI recommendations
  if (visibleCards.length === 0) {
    return (
      <div className="h-[calc(100dvh-180px)] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-gray-800 mb-3"
          >
            You've seen them all!
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <p className="text-gray-600 mb-4 text-base">
              🎯 Based on your likes, we recommend:
            </p>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-4 border border-purple-100">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-purple-900 mb-1">
                    Smart Filters Active
                  </p>
                  <p className="text-xs text-purple-700">
                    We're learning your preferences to show you better matches next time
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-3"
          >
            <button
              onClick={() => window.location.reload()}
              className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              Discover More Items
            </button>
            <p className="text-xs text-gray-500">
              New items are added daily
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  const totalCards = products.length
  const remainingCards = totalCards - currentIndex
  const progressPercent = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0

  return (
    <div className="h-[calc(100dvh-180px)] flex flex-col" style={{
      background: 'transparent',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* Progress Indicator */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-600">
            {remainingCards} {remainingCards === 1 ? 'card' : 'cards'} remaining
          </span>
          <span className="text-sm font-medium text-gray-500">
            {currentIndex} / {totalCards}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

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
                  y: index * 6,
                  opacity: 0,
                  rotateZ: index * 2
                }}
                animate={{
                  scale: 1 - index * 0.03,
                  y: index * 6,
                  opacity: 1,
                  rotateZ: 0
                }}
                exit={{
                  scale: 0.8,
                  opacity: 0,
                  rotateZ: 10,
                  transition: { duration: 0.2 }
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 35,
                  mass: 1
                }}
                style={{
                  zIndex: visibleCards.length - index
                }}
                className="absolute inset-0"
                whileHover={isTop ? { scale: 1.01 } : {}}
              >
                <SwipeCard
                  product={product}
                  onSwipeLeft={() => handleSwipeLeft(product)}
                  onSwipeRight={() => handleSwipeRight(product)}
                  onSwipeUp={() => handleSwipeUp(product)}
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

      {/* Action Buttons - LinkedIn/Tinder Style */}
      <div className="pb-6 px-4">
        <div className="flex items-center justify-center gap-4">
          {/* Skip Button */}
          <motion.button
            onClick={handleButtonSwipeLeft}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #fff 0%, #f5f5f5 100%)',
              border: '2px solid #ef4444'
            }}
            aria-label="Skip"
          >
            <X className="w-7 h-7 lg:w-8 lg:h-8 text-red-500" strokeWidth={2.5} />
          </motion.button>

          {/* Undo Button */}
          <motion.button
            onClick={onUndo}
            disabled={!canUndo}
            whileHover={canUndo ? { scale: 1.1 } : {}}
            whileTap={canUndo ? { scale: 0.95 } : {}}
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-md"
            style={{
              background: canUndo
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                : '#e5e7eb',
              opacity: canUndo ? 1 : 0.5,
              cursor: canUndo ? 'pointer' : 'not-allowed'
            }}
            aria-label="Undo"
          >
            <RotateCcw className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: canUndo ? '#fff' : '#9ca3af' }} strokeWidth={2.5} />
          </motion.button>

          {/* Like Button */}
          <motion.button
            onClick={handleButtonSwipeRight}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
            aria-label="Like"
          >
            <Heart className="w-7 h-7 lg:w-8 lg:h-8 text-white" fill="white" strokeWidth={2} />
          </motion.button>
        </div>

        {/* Hint Text */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Swipe, click buttons, or use arrow keys • Press Z to undo
          </p>
        </div>
      </div>
    </div>
  )
}
