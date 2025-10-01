'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Drawer } from 'vaul'
import { SwipeProduct } from '@/lib/stores/swipeStore'
import { X, Heart, ShoppingCart, ChevronLeft, ChevronRight, Star, Sparkles, AlertCircle } from 'lucide-react'
import { formatPrice, calculateDiscount } from '@/lib/utils/cn'
import Image from 'next/image'

interface ProductDetailModalProps {
  open: boolean
  product: SwipeProduct | null
  sessionId: string | null
  onClose: () => void
  onLike: (product: SwipeProduct) => void
  onSkip: () => void
  onAddToCart?: (product: SwipeProduct) => void
}

interface AISummary {
  productId: string
  aiScore: number
  sentiment: 'positive' | 'neutral' | 'negative'
  pros: string[]
  cons: string[]
  highlights: string[]
  summary: string
}

export function ProductDetailModal({
  open,
  product,
  sessionId,
  onClose,
  onLike,
  onSkip,
  onAddToCart
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0)
      setAiSummary(null)
      setSummaryError(null)

      // Fetch AI summary
      fetchAISummary(product.id)
    }
  }, [product?.id])

  const fetchAISummary = async (productId: string) => {
    if (!productId) return

    setIsLoadingSummary(true)
    setSummaryError(null)

    try {
      const response = await fetch(`/api/swipe/summary/${productId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch AI summary')
      }

      const data = await response.json()
      setAiSummary(data.summary)
    } catch (error) {
      console.error('Error fetching AI summary:', error)
      setSummaryError(error instanceof Error ? error.message : 'Failed to load AI summary')
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const handleNextImage = () => {
    if (product && currentImageIndex < product.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const handleLike = () => {
    if (product) {
      onLike(product)
      onClose()
    }
  }

  const handleSkip = () => {
    onSkip()
    onClose()
  }

  const handleAddToCart = () => {
    if (product && onAddToCart) {
      onAddToCart(product)
      onClose()
    }
  }

  if (!product) return null

  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0

  const images = product.images && product.images.length > 0
    ? product.images
    : ['/placeholder-image.jpg']

  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col bg-gray-900 rounded-t-[2rem] max-h-[95vh] overflow-hidden border-t border-gray-800/50 shadow-2xl">
          {/* Handle */}
          <div className="flex items-center justify-center py-4 flex-shrink-0">
            <div className="w-14 h-1.5 bg-gray-700 rounded-full" />
          </div>

          {/* Accessible title for screen readers */}
          <Drawer.Title className="sr-only">
            Product Details: {product?.name}
          </Drawer.Title>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Image Carousel */}
            <div className="relative w-full aspect-square bg-gray-800">
              <Image
                src={images[currentImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />

              {/* Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-5 right-5 bg-gradient-to-br from-orange-500 to-red-500 text-white px-4 py-2 rounded-2xl text-sm font-black shadow-2xl shadow-orange-500/40 backdrop-blur-sm border border-white/20 z-10">
                  {discount}% OFF
                </div>
              )}

              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-black/80 transition-all hover:scale-110 shadow-xl z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </button>
                  )}

                  {currentImageIndex < images.length - 1 && (
                    <button
                      onClick={handleNextImage}
                      className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-black/80 transition-all hover:scale-110 shadow-xl z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </button>
                  )}

                  {/* Image Indicators */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'w-8 bg-white shadow-lg'
                            : 'w-2 bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-5 left-5 w-12 h-12 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-black/80 transition-all hover:scale-110 shadow-xl z-10"
                aria-label="Close"
              >
                <X className="w-7 h-7 text-white" strokeWidth={2.5} />
              </button>
            </div>

            {/* Product Info */}
            <div className="px-6 py-6">
              {/* Name and Brand */}
              <div className="mb-5">
                <h2 className="text-3xl font-black text-white mb-2 leading-tight tracking-tight">
                  {product.name}
                </h2>
                {product.brand && (
                  <p className="text-gray-400 font-bold text-base">{product.brand}</p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-4xl font-black text-white tracking-tight">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xl text-gray-500 line-through font-bold">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                {product.condition && (
                  <span className="px-4 py-2 bg-gray-800/80 backdrop-blur-xl text-gray-300 text-sm font-bold rounded-full border border-gray-700/50 shadow-lg">
                    {product.condition}
                  </span>
                )}
                {product.category && (
                  <span className="px-4 py-2 bg-gray-800/80 backdrop-blur-xl text-gray-300 text-sm font-bold rounded-full border border-gray-700/50 shadow-lg">
                    {product.category}
                  </span>
                )}
                {product.rating && product.rating > 0 && (
                  <span className="px-4 py-2 bg-gray-800/80 backdrop-blur-xl text-yellow-400 text-sm font-bold rounded-full border border-gray-700/50 shadow-lg flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    {product.rating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-xl font-black text-white mb-3 tracking-tight">Description</h3>
                  <p className="text-gray-400 leading-relaxed font-medium">
                    {product.description}
                  </p>
                </div>
              )}

              {/* AI Summary Section */}
              <div className="mb-6 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-[1.5rem] p-6 border border-gray-700/30 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-xl font-black text-white tracking-tight">AI Summary</h3>
                </div>

                {isLoadingSummary && (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-8 h-8 border-2 border-gray-600 border-t-emerald-500 rounded-full"
                    />
                  </div>
                )}

                {summaryError && (
                  <div className="flex items-center gap-2 text-red-400 py-4">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{summaryError}</p>
                  </div>
                )}

                {!isLoadingSummary && !summaryError && aiSummary && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* AI Score */}
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                            {aiSummary.aiScore}
                          </div>
                          <div className="text-xs text-gray-500 text-center">/ 10</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white mb-1">
                            AI Quality Score
                          </div>
                          <div className={`text-xs font-medium ${
                            aiSummary.sentiment === 'positive'
                              ? 'text-green-500'
                              : aiSummary.sentiment === 'negative'
                              ? 'text-red-500'
                              : 'text-yellow-500'
                          }`}>
                            {aiSummary.sentiment.charAt(0).toUpperCase() + aiSummary.sentiment.slice(1)} sentiment
                          </div>
                        </div>
                      </div>

                      {/* Summary Text */}
                      {aiSummary.summary && (
                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                          {aiSummary.summary}
                        </p>
                      )}

                      {/* Pros */}
                      {aiSummary.pros && aiSummary.pros.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-green-400 mb-2">✓ Pros</h4>
                          <ul className="space-y-1">
                            {aiSummary.pros.map((pro, index) => (
                              <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">•</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Cons */}
                      {aiSummary.cons && aiSummary.cons.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-red-400 mb-2">✗ Cons</h4>
                          <ul className="space-y-1">
                            {aiSummary.cons.map((con, index) => (
                              <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Highlights */}
                      {aiSummary.highlights && aiSummary.highlights.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-cyan-400 mb-2">★ Highlights</h4>
                          <div className="flex flex-wrap gap-2">
                            {aiSummary.highlights.map((highlight, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-medium rounded-full border border-cyan-500/20"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {!isLoadingSummary && !summaryError && !aiSummary && (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    No AI summary available for this product
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="flex-shrink-0 px-6 py-5 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50">
            <div className="flex gap-3">
              {/* Skip Button */}
              <button
                onClick={handleSkip}
                className="flex-1 py-4 bg-gray-800/80 backdrop-blur-xl text-gray-300 rounded-2xl font-bold hover:bg-gray-700/80 transition-all shadow-lg border border-gray-700/50"
              >
                Skip
              </button>

              {/* Like Button */}
              <button
                onClick={handleLike}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-bold hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-emerald-500/40"
              >
                <Heart className="w-5 h-5 fill-white" />
                <span>Like</span>
              </button>

              {/* Add to Cart Button */}
              {onAddToCart && (
                <button
                  onClick={handleAddToCart}
                  className="w-14 h-14 bg-white text-gray-900 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-all shadow-xl"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="w-6 h-6" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
