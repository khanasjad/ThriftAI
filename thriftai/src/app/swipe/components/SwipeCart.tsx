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
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white rounded-t-3xl max-h-[90vh]">
          {/* Handle */}
          <div className="flex items-center justify-center py-4">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 border-b border-gray-200">
            <Drawer.Title className="sr-only">
              Liked Items Cart - {likedProducts.length} {likedProducts.length === 1 ? 'item' : 'items'}
            </Drawer.Title>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Liked Items</h2>
                  <p className="text-sm text-gray-600">
                    {likedProducts.length} {likedProducts.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-600" />
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
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6"
                  >
                    <ShoppingCart className="w-12 h-12 text-purple-600" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">No liked items yet</h3>
                  <p className="text-gray-600 mb-6 max-w-sm">
                    Start swiping right on products you love to add them here!
                  </p>

                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
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
                      className="group relative bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-purple-300 hover:shadow-lg transition-all"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <button
                          onClick={() => handleViewProduct(product.id)}
                          className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100"
                        >
                          <Image
                            src={product.images[0] || '/placeholder-image.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            sizes="96px"
                          />

                          {/* Discount Badge */}
                          {product.originalPrice && product.originalPrice > product.price && (
                            <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
                            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                              {product.name}
                            </h3>

                            {/* Brand */}
                            {product.brand && (
                              <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
                            )}

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(product.price)}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-sm text-gray-400 line-through">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              )}
                            </div>
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromLiked(product.id)}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          aria-label="Remove from liked items"
                        >
                          <Trash2 className="w-5 h-5" />
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
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              {/* Summary */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-green-600 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Total Savings
                    </span>
                    <span className="font-semibold text-green-600">
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
                  className="flex-shrink-0 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Clear All
                </button>

                <button
                  onClick={handleCheckout}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>Add to Cart</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Additional Info */}
              <p className="text-xs text-gray-500 text-center mt-3">
                Items will be added to your cart for checkout
              </p>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
