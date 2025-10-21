'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Drawer } from 'vaul'
import { SwipeProduct, useSwipeStore } from '@/lib/stores/swipeStore'
import { X, ShoppingCart, Heart, Sparkles, ArrowRight, Trash2 } from 'lucide-react'
import { formatPrice, calculateDiscount } from '@/lib/utils/cn'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface SwipeCartProps {
  open: boolean
  onClose: () => void
}

export function SwipeCart({ open, onClose }: SwipeCartProps) {
  const router = useRouter()
  const { likedProducts, removeFromLiked, clearLiked } = useSwipeStore()

  // Helper function to validate image URL
  const getValidImageUrl = (product: SwipeProduct): string => {
    try {
      if (
        product.images &&
        product.images.length > 0 &&
        product.images[0] &&
        typeof product.images[0] === 'string'
      ) {
        const url = product.images[0].trim()
        // Check if URL is valid (starts with http/https or /)
        if (url.length > 0 && (url.startsWith('http') || url.startsWith('/'))) {
          return url
        }
      }
    } catch (error) {
      console.error('Invalid image URL:', error)
    }
    return '/placeholder-image.jpg'
  }

  const totalPrice = likedProducts.reduce((sum, product) => sum + product.price, 0)
  const totalSavings = likedProducts.reduce((sum, product) => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return sum + (product.originalPrice - product.price)
    }
    return sum
  }, 0)

  const handleCheckout = () => {
    // Add liked products to cart and navigate to checkout
    // TODO: Integrate with your cart system
    router.push('/cart')
  }

  const handleViewProduct = (productId: string) => {
    router.push(`/products/${productId}`)
    onClose()
  }

  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-gray-900 rounded-t-[2rem] max-h-[90vh] border-t border-gray-800/50 shadow-2xl">
          {/* Handle */}
          <div className="flex items-center justify-center py-4">
            <div className="w-14 h-1.5 bg-gray-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pb-5 border-b border-gray-800/50">
            <Drawer.Title className="sr-only">
              Liked Items Cart - {likedProducts.length} {likedProducts.length === 1 ? 'item' : 'items'}
            </Drawer.Title>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <Heart className="w-7 h-7 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Liked Items</h2>
                  <p className="text-sm text-gray-400 font-semibold">
                    {likedProducts.length} {likedProducts.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800/80 rounded-full transition-all hover:scale-110"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-400" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <AnimatePresence mode="popLayout">
              {likedProducts.length === 0 ? (
                /* Empty State */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-28 h-28 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-full flex items-center justify-center mb-8 border border-gray-700/30 shadow-2xl"
                  >
                    <ShoppingCart className="w-14 h-14 text-emerald-500" strokeWidth={2} />
                  </motion.div>

                  <h3 className="text-2xl font-black text-white mb-3 tracking-tight">No liked items yet</h3>
                  <p className="text-gray-400 mb-8 max-w-sm font-medium">
                    Start swiping right on products you love to add them here!
                  </p>

                  <button
                    onClick={onClose}
                    className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-bold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60"
                  >
                    Start Swiping
                  </button>
                </motion.div>
              ) : (
                /* Product List */
                <div className="space-y-4">
                  {likedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-[1.25rem] p-4 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <button
                          onClick={() => handleViewProduct(product.id)}
                          className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-900 shadow-lg"
                        >
                          <Image
                            src={getValidImageUrl(product)}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            sizes="96px"
                          />

                          {/* Discount Badge */}
                          {product.originalPrice && product.originalPrice > product.price && (
                            <div className="absolute top-1 right-1 bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg">
                              {calculateDiscount(product.originalPrice, product.price)}% OFF
                            </div>
                          )}
                        </button>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleViewProduct(product.id)}
                            className="text-left w-full"
                          >
                            <h3 className="font-bold text-white line-clamp-2 group-hover:text-emerald-400 transition-colors tracking-tight">
                              {product.name}
                            </h3>

                            {/* Brand */}
                            {product.brand && (
                              <p className="text-sm text-gray-400 mt-1 font-semibold">{product.brand}</p>
                            )}

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-xl font-black text-white tracking-tight">
                                {formatPrice(product.price)}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-sm text-gray-500 line-through font-bold">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              )}
                            </div>
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromLiked(product.id)}
                          className="flex-shrink-0 p-2 text-gray-500 hover:text-red-500 hover:bg-red-950/50 rounded-full transition-all hover:scale-110"
                          aria-label="Remove from liked items"
                        >
                          <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {likedProducts.length > 0 && (
            <div className="px-6 py-5 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50">
              {/* Summary */}
              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-semibold">Subtotal</span>
                  <span className="font-black text-white text-lg tracking-tight">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-green-500 flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-4 h-4" />
                      Total Savings
                    </span>
                    <span className="font-black text-green-500 text-lg tracking-tight">
                      -{formatPrice(totalSavings)}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all liked items?')) {
                      clearLiked()
                    }
                  }}
                  className="flex-shrink-0 px-5 py-4 bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 text-gray-300 rounded-2xl font-bold hover:bg-gray-700/80 transition-all shadow-lg"
                >
                  Clear All
                </button>

                <button
                  onClick={handleCheckout}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-bold hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-emerald-500/40"
                >
                  <span>Add to Cart</span>
                  <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              {/* Additional Info */}
              <p className="text-xs text-gray-500 text-center mt-4 font-semibold">
                Items will be added to your cart for checkout
              </p>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
