'use client'

import { useCartStore } from '@/stores/cartStore'
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function CartDrawer() {
  const router = useRouter()
  const {
    items,
    count,
    subtotal,
    isOpen,
    isLoading,
    closeCart,
    removeFromCart,
    updateQuantity
  } = useCartStore()

  const handleCheckout = () => {
    closeCart()
    router.push('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: 9998 }}
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-[400px] shadow-2xl flex flex-col"
            style={{
              zIndex: 9999,
              backgroundColor: 'var(--background-primary, #ffffff)',
              color: 'var(--text-primary, #000000)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4" style={{
              borderBottom: '1px solid var(--border-color, #e5e7eb)',
              backgroundColor: 'var(--background-primary, #ffffff)'
            }}>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" style={{ color: 'var(--text-primary, #000000)' }} />
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary, #000000)' }}>
                  Shopping Cart ({count})
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary, #000000)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-secondary, #f3f4f6)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{
              backgroundColor: 'var(--background-primary, #ffffff)'
            }}>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <ShoppingBag className="w-16 h-16" style={{ color: 'var(--text-tertiary, #9ca3af)' }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary, #4b5563)' }}>
                    Your cart is empty
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary, #6b7280)' }}>
                    Add some products to get started!
                  </p>
                  <button
                    onClick={closeCart}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-lg"
                    style={{
                      backgroundColor: 'var(--background-secondary, #f9fafb)'
                    }}
                  >
                    {/* Product Image */}
                    <img
                      src={item.product.imageUrl || '/placeholder-image.jpg'}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary, #000000)' }}>
                        {item.product.name}
                      </h3>
                      {item.product.brand && (
                        <p className="text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                          {item.product.brand}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary, #000000)' }}>
                          ${(item.priceAtTime || item.product.price).toFixed(2)}
                        </span>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            disabled={isLoading || item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                          </button>

                          <span className="text-sm font-medium min-w-[20px] text-center" style={{ color: 'var(--text-primary, #000000)' }}>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            disabled={isLoading}
                          >
                            <Plus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                          </button>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors ml-2"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                        Total: ${((item.priceAtTime || item.product.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 space-y-3" style={{
                borderTop: '1px solid var(--border-color, #e5e7eb)',
                backgroundColor: 'var(--background-primary, #ffffff)'
              }}>
                {/* Subtotal */}
                <div className="flex items-center justify-between text-lg font-bold">
                  <span style={{ color: 'var(--text-primary, #000000)' }}>Subtotal:</span>
                  <span style={{ color: 'var(--text-primary, #000000)' }}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-center" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                  Shipping and taxes calculated at checkout
                </p>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                </button>

                <button
                  onClick={closeCart}
                  className="w-full py-2 font-medium transition-colors"
                  style={{ color: 'var(--text-secondary, #6b7280)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary, #000000)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary, #6b7280)'}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
