'use client'

import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import { formatPrice, calculateDiscount, cn, vibrate } from '@/lib/utils/cn'
import { SwipeProduct } from '@/lib/stores/swipeStore'

interface SwipeCardProps {
  product: SwipeProduct
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onViewDetails: () => void
  style?: React.CSSProperties
  index: number
  active: boolean
}

export function SwipeCard({
  product,
  onSwipeLeft,
  onSwipeRight,
  onViewDetails,
  style,
  index,
  active
}: SwipeCardProps) {
  const [exitX, setExitX] = useState(0)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Transform x position to rotation (max 15 degrees)
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15])

  // Transform x position to opacity for indicators
  const likeOpacity = useTransform(x, [0, 150], [0, 1])
  const nopeOpacity = useTransform(x, [-150, 0], [1, 0])

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 100
    const swipeVelocityThreshold = 300

    // Check if swipe was strong enough
    if (
      Math.abs(info.offset.x) > swipeThreshold ||
      Math.abs(info.velocity.x) > swipeVelocityThreshold
    ) {
      setExitX(info.offset.x > 0 ? 1000 : -1000)
      vibrate([10, 50, 10])

      if (info.offset.x > 0) {
        onSwipeRight()
      } else {
        onSwipeLeft()
      }
    }
  }

  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        ...style
      }}
      drag={active ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX, opacity: 0 } : {}}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 35
      }}
      className={cn(
        'absolute inset-0',
        active ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      )}
    >
      {/* Card - Rounded corners like Tinder */}
      <div className="relative h-full w-full rounded-3xl bg-white shadow-2xl overflow-hidden">

        {/* Full Product Image */}
        <div className="absolute inset-0">
          <Image
            src={product.images[0] || '/placeholder-image.jpg'}
            alt={product.name}
            fill
            className="object-cover object-center"
            priority={index === 0}
            sizes="(max-width: 1024px) calc(100vw - 32px), 398px"
            quality={85}
          />

          {/* Gradient Overlay - Bottom only */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>

        {/* Swipe Indicators - Simple and Bold */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-10 right-6 px-5 py-2 rounded-xl font-black text-xl bg-green-500 text-white shadow-2xl rotate-12 border-3 border-white"
        >
          LIKE
        </motion.div>

        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-10 left-6 px-5 py-2 rounded-xl font-black text-xl bg-red-500 text-white shadow-2xl -rotate-12 border-3 border-white"
        >
          NOPE
        </motion.div>

        {/* Discount Badge - Top Right */}
        {discount > 0 && (
          <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
            {discount}% OFF
          </div>
        )}

        {/* Product Info - Bottom Overlay (Tinder-style) */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
          {/* Product Name */}
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight drop-shadow-2xl line-clamp-2">
            {product.name}
          </h2>

          {/* Price and Badges Row */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl font-black text-white drop-shadow-2xl">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-white/80 line-through drop-shadow-lg">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Bottom Row - Brand, Condition, Rating */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.brand && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-sm font-semibold rounded-full border border-white/30">
                {product.brand}
              </span>
            )}
            {product.condition && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-sm font-semibold rounded-full border border-white/30">
                {product.condition}
              </span>
            )}
            {product.rating && product.rating > 0 && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-sm font-semibold rounded-full border border-white/30">
                ⭐ {product.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
