'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { SwipeCard } from './SwipeCard'
import { SwipeProduct } from '@/lib/stores/swipeStore'
import { Heart, X } from 'lucide-react'
import { vibrate } from '@/lib/utils/cn'

interface SwipeDeckProps {
  products: SwipeProduct[]
  currentIndex: number
  onSwipeLeft: (product: SwipeProduct) => void
  onSwipeRight: (product: SwipeProduct) => void
  onViewDetails: (product: SwipeProduct) => void
}

export function SwipeDeck({
  products,
  currentIndex,
  onSwipeLeft,
  onSwipeRight,
  onViewDetails
}: SwipeDeckProps) {
  // Show 2 cards at a time for better performance
  const visibleCards = products.slice(currentIndex, currentIndex + 2)

  const handleSwipeLeft = (product: SwipeProduct) => {
    onSwipeLeft(product)
    vibrate(10)
  }

  const handleSwipeRight = (product: SwipeProduct) => {
    onSwipeRight(product)
    vibrate([10, 50])
  }

  // No more products
  if (visibleCards.length === 0) {
    return (
      <div className="h-[calc(100vh-56px)] lg:h-[876px] flex items-center justify-center px-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            That's all for now!
          </h2>
          <p className="text-gray-600 mb-6">
            Check your likes or try new filters
          </p>

          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full font-bold transition-all active:scale-95 shadow-lg"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] lg:h-[876px] flex flex-col">
      {/* Card Stack - Takes most space */}
      <div className="flex-1 relative px-4 pt-2 pb-2">
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
                  index={cardIndex}
                  active={isTop}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Action Buttons - Symmetric 2-Button Layout */}
      <div className="pb-safe px-6 py-6 bg-white">
        <div className="flex items-center justify-center gap-6">
          {/* Pass Button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              if (visibleCards.length > 0) {
                handleSwipeLeft(visibleCards[0])
              }
            }}
            className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 transition-all"
            aria-label="Pass"
          >
            <X className="w-8 h-8 text-red-500 stroke-[2.5]" />
          </motion.button>

          {/* Like Button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              if (visibleCards.length > 0) {
                handleSwipeRight(visibleCards[0])
              }
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 shadow-2xl flex items-center justify-center hover:scale-105 transition-all"
            aria-label="Like"
          >
            <Heart className="w-8 h-8 text-white fill-white stroke-[2]" />
          </motion.button>
        </div>

        {/* Progress Text */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400 font-medium">
            {currentIndex + 1} of {products.length}
          </p>
        </div>
      </div>
    </div>
  )
}
