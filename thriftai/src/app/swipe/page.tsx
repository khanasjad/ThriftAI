'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FilterWizard } from './components/FilterWizard'
import { SwipeDeck } from './components/SwipeDeck'
import { SwipeCart } from './components/SwipeCart'
import { useSwipeStore, SwipeFilters } from '@/lib/stores/swipeStore'
import { ShoppingBag, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SwipePage() {
  const router = useRouter()
  const {
    sessionId,
    filters,
    products,
    currentIndex,
    likedProducts,
    isLoading,
    showFilters,
    showCart,
    setSessionId,
    setFilters,
    setProducts,
    swipeLeft,
    swipeRight,
    toggleFilters,
    toggleCart,
    resetSession
  } = useSwipeStore()

  const [showWizard, setShowWizard] = useState(!sessionId)
  const [initError, setInitError] = useState<string | null>(null)

  // Override parent dark mode styles for swipe page
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.id = 'swipe-page-styles'
    styleEl.textContent = `
      html, body {
        background: #f9fafb !important;
        color: #111827 !important;
      }
      h1, h2, h3, h4, h5, h6, p, div, span {
        color: inherit !important;
      }
    `
    document.head.appendChild(styleEl)

    return () => {
      document.getElementById('swipe-page-styles')?.remove()
    }
  }, [])

  // Initialize session with filters
  const initializeSession = async (selectedFilters: SwipeFilters) => {
    setShowWizard(false)
    useSwipeStore.setState({ isLoading: true })
    setInitError(null)

    try {
      const response = await fetch('/api/swipe/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedFilters)
      })

      if (!response.ok) {
        throw new Error(`Failed to initialize session: ${response.statusText}`)
      }

      const data = await response.json()
      setSessionId(data.sessionId)
      setFilters(selectedFilters)
      setProducts(data.products)
    } catch (error) {
      console.error('Failed to initialize swipe session:', error)
      setInitError(error instanceof Error ? error.message : 'Failed to load products')
    } finally {
      useSwipeStore.setState({ isLoading: false })
    }
  }

  // Skip wizard and use default filters
  const handleSkipWizard = () => {
    const defaultFilters: SwipeFilters = {
      categories: ['CLOTHING', 'ACCESSORIES', 'SHOES'],
      priceRange: { min: 0, max: 500 },
      styles: []
    }
    initializeSession(defaultFilters)
  }

  // Record swipe action
  const recordSwipeAction = async (productId: string, action: 'LIKE' | 'SKIP', index: number) => {
    if (!sessionId) return

    try {
      await fetch('/api/swipe/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          productId,
          action,
          cardPosition: index,
          timeSpent: null,
          swipeDirection: action === 'LIKE' ? 'right' : 'left',
          swipeVelocity: null
        })
      })
    } catch (error) {
      console.error('Failed to record swipe action:', error)
    }
  }

  // Handle swipe left (skip)
  const handleSwipeLeft = (product: any) => {
    recordSwipeAction(product.id, 'SKIP', currentIndex)
    swipeLeft()
  }

  // Handle swipe right (like)
  const handleSwipeRight = (product: any) => {
    recordSwipeAction(product.id, 'LIKE', currentIndex)
    swipeRight(product)
  }

  // Handle view details
  const handleViewDetails = (product: any) => {
    if (!sessionId) return

    // Record view details action
    fetch('/api/swipe/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        productId: product.id,
        action: 'VIEW_DETAILS',
        cardPosition: currentIndex
      })
    }).catch(console.error)

    // Navigate to product details
    router.push(`/products/${product.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center lg:p-8">
      {/* Responsive Container: Full screen on mobile, phone mockup on desktop */}
      <div className="w-full h-screen lg:w-[430px] lg:h-[932px] lg:max-h-[95vh] bg-white lg:rounded-[50px] shadow-none lg:shadow-2xl overflow-hidden relative flex flex-col">

        {/* Minimalist Top Bar - Fixed */}
        <header className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left: Reset Button */}
            {!showWizard && (
              <button
                onClick={() => {
                  resetSession()
                  setShowWizard(true)
                }}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                aria-label="Reset filters"
              >
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {/* Center: Logo */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                Swipe
              </h1>
            </div>

            {/* Right: Cart Button */}
            {!showWizard && (
              <button
                onClick={toggleCart}
                className="relative p-2 hover:bg-gray-50 rounded-full transition-colors"
                aria-label="Liked items"
              >
                <ShoppingBag className="w-5 h-5 text-gray-600" />
                {likedProducts.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {likedProducts.length}
                  </motion.span>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-14">
          <AnimatePresence mode="wait">
            {/* Filter Wizard */}
            {showWizard && (
              <FilterWizard onComplete={initializeSession} onSkip={handleSkipWizard} />
            )}

            {/* Loading State */}
            {isLoading && !showWizard && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-[calc(100vh-56px)] lg:h-[876px]"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-12 h-12 border-3 border-gray-200 border-t-pink-500 rounded-full mx-auto mb-4"
                  />
                  <p className="text-gray-500 text-sm font-medium">Loading...</p>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {initError && !showWizard && (
              <motion.div
                key="error"
                className="flex items-center justify-center h-[calc(100vh-56px)] lg:h-[876px] px-6"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">😕</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
                  <p className="text-gray-600 text-sm mb-6">{initError}</p>
                  <button
                    onClick={() => {
                      setInitError(null)
                      setShowWizard(true)
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full font-semibold transition-all active:scale-95 shadow-lg"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {/* Swipe Deck */}
            {!showWizard && !isLoading && !initError && products.length > 0 && (
              <SwipeDeck
                products={products}
                currentIndex={currentIndex}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onViewDetails={handleViewDetails}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Cart Drawer */}
        <SwipeCart open={showCart} onClose={toggleCart} />
      </div>
    </div>
  )
}
