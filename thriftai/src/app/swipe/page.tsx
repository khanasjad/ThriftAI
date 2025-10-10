'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { FilterWizard } from './components/FilterWizard'
import { SwipeDeck } from './components/SwipeDeck'
import { SwipeCart } from './components/SwipeCart'
import { ProductDetailModal } from './components/ProductDetailModal'
import { useSwipeStore, SwipeFilters } from '@/lib/stores/swipeStore'
import { ShoppingBag, RotateCcw, Sparkles, Camera, Sliders } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SwipePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const {
    sessionId,
    filters,
    products,
    currentIndex,
    likedProducts,
    isLoading,
    showFilters,
    showCart,
    showProductDetail,
    selectedProduct,
    swipeHistory,
    setSessionId,
    setFilters,
    setProducts,
    swipeLeft,
    swipeRight,
    undoSwipe,
    toggleFilters,
    toggleCart,
    resetSession,
    openProductDetail,
    closeProductDetail
  } = useSwipeStore()

  const [showWizard, setShowWizard] = useState(false) // Always skip wizard
  const [initError, setInitError] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showVisualSearch, setShowVisualSearch] = useState(false)

  // Adapt the user object to match what Navigation expects
  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || ''
  } : null

  const handleSignOut = () => {
    signOut()
  }

  // Auto-initialize with default filters on mount
  useEffect(() => {
    if (!sessionId && !isLoading && !initError) {
      const defaultFilters: SwipeFilters = {
        categories: ['CLOTHING', 'ACCESSORIES', 'SHOES', 'ELECTRONICS', 'HOME'],
        priceRange: { min: 0, max: 1000 },
        styles: []
      }
      initializeSession(defaultFilters)
    }
  }, []) // Run once on mount

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

  // Handle view details - Open modal instead of navigating
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

    // Open product detail modal
    openProductDetail(product)
  }

  // Handle modal actions
  const handleModalLike = (product: any) => {
    recordSwipeAction(product.id, 'LIKE', currentIndex)
    swipeRight(product)
  }

  const handleModalSkip = () => {
    if (products[currentIndex]) {
      recordSwipeAction(products[currentIndex].id, 'SKIP', currentIndex)
      swipeLeft()
    }
  }

  return (
    <div className="App" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Animated Gradient Mesh Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #667eea 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        opacity: 0.15
      }} />

      {/* Radial Gradient Overlay for Depth */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        background: 'radial-gradient(ellipse at top, rgba(102, 126, 234, 0.1) 0%, rgba(255, 255, 255, 0) 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navigation
          user={appUser}
          onShowLogin={() => setShowLoginModal(true)}
          onShowSignup={() => setShowSignupModal(true)}
          onLogout={handleSignOut}
        />

        {/* Swipe Container */}
        <div className="container py-5" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-6">
            {/* Header Section with Likes - Glass Morphism */}
            {!showWizard && (
              <div className="d-flex align-items-center justify-content-between mb-4" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)'
              }}>
                <div>
                  <h1 className="mb-1" style={{fontSize: '2rem', fontWeight: 800}}>
                    <span style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>Discover</span> Amazing Deals
                  </h1>
                  <p className="text-secondary mb-0">
                    <Sparkles className="w-4 h-4" style={{display: 'inline', marginRight: '0.25rem'}} />
                    Swipe to find your perfect match
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    onClick={toggleCart}
                    className="btn position-relative"
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                    aria-label="Liked items"
                  >
                    <ShoppingBag className="w-4 h-4" style={{display: 'inline', marginRight: '0.5rem'}} />
                    Likes
                    {likedProducts.length > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill" style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}>
                        {likedProducts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Main Swipe Content - Modern 2025 Style */}
            <div style={{
              background: 'transparent',
              borderRadius: '0',
              overflow: 'visible',
              minHeight: '600px'
            }}>
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
                  className="d-flex align-items-center justify-content-center"
                  style={{minHeight: '600px'}}
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      style={{
                        width: '64px',
                        height: '64px',
                        border: '4px solid rgba(255, 255, 255, 0.1)',
                        borderTop: '4px solid var(--accent-primary)',
                        borderRadius: '50%',
                        margin: '0 auto 1.5rem'
                      }}
                    />
                    <p className="text-accent" style={{fontSize: '1.125rem', fontWeight: 600}}>Loading amazing deals...</p>
                  </div>
                </motion.div>
              )}

              {/* Error State */}
              {initError && !showWizard && (
                <motion.div
                  key="error"
                  className="d-flex align-items-center justify-content-center px-4"
                  style={{minHeight: '600px'}}
                >
                  <div className="text-center">
                    <div className="mb-4" style={{fontSize: '4rem'}}>😕</div>
                    <h2 className="mb-3" style={{fontSize: '1.875rem', fontWeight: 800}}>Oops!</h2>
                    <p className="text-secondary mb-4" style={{fontSize: '1.125rem', maxWidth: '400px'}}>{initError}</p>
                    <button
                      onClick={() => {
                        setInitError(null)
                        setShowWizard(true)
                      }}
                      className="btn btn-modern-primary"
                      style={{padding: '1rem 2.5rem', fontSize: '1.125rem', fontWeight: 700}}
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
                  onUndo={undoSwipe}
                  canUndo={swipeHistory.length > 0 && currentIndex > 0}
                />
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

        <Footer />

        {/* Floating Action Buttons */}
        {!showWizard && !isLoading && products.length > 0 && (
          <div className="fixed bottom-32 right-6 z-50 flex flex-col gap-3">
            {/* Camera/Visual Search Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/visual-search')}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
              }}
              title="Visual Search"
            >
              <Camera className="w-6 h-6 text-white" strokeWidth={2.5} />
            </motion.button>

            {/* Filters Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowWizard(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)'
              }}
              title="Refine Filters"
            >
              <Sliders className="w-6 h-6 text-white" strokeWidth={2.5} />
            </motion.button>
          </div>
        )}

        {/* Cart Drawer */}
        <SwipeCart open={showCart} onClose={toggleCart} />

        {/* Product Detail Modal */}
        <ProductDetailModal
          open={showProductDetail}
          product={selectedProduct}
          sessionId={sessionId}
          onClose={closeProductDetail}
          onLike={handleModalLike}
          onSkip={handleModalSkip}
        />
      </div>
    </div>
  )
}
