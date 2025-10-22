'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useSwipeStore } from '@/lib/stores/swipeStore'
import { Heart, Trash2, ArrowLeft, ShoppingCart, Sparkles, ArrowRight } from 'lucide-react'

export default function LikesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { likedProducts, removeFromLiked, clearLiked } = useSwipeStore()

  const [showLoginModal, setShowLoginModal] = React.useState(false)
  const [showSignupModal, setShowSignupModal] = React.useState(false)

  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || '',
    userType: 'buyer' as const
  } : null

  const totalPrice = likedProducts.reduce((sum, product) => sum + Number(product.price), 0)
  const totalSavings = likedProducts.reduce((sum, product) => {
    if (product.originalPrice && Number(product.originalPrice) > Number(product.price)) {
      return sum + (Number(product.originalPrice) - Number(product.price))
    }
    return sum
  }, 0)

  const handleCheckout = () => {
    router.push('/cart')
  }

  const getValidImageUrl = (images: any[]): string => {
    if (images && images.length > 0 && images[0]) {
      return images[0]
    }
    return '/placeholder-image.jpg'
  }

  return (
    <div className="App">
      <Navigation
        user={appUser}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={() => {}}
      />

      <main className="container mx-auto px-4 py-6" style={{ maxWidth: '1200px', minHeight: 'calc(100vh - 200px)' }}>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/swipe')}
            className="btn-modern-secondary mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Swipe</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-6 h-6 text-accent fill-accent" />
            <h1 className="page-header" style={{ fontSize: '2rem', marginBottom: 0 }}>Liked Items</h1>
          </div>
          <p className="page-subtitle">
            {likedProducts.length} {likedProducts.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {likedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="w-24 h-24 mb-6 text-tertiary" />
            <h2 className="text-primary font-semibold mb-3" style={{ fontSize: '1.5rem' }}>
              No liked items yet
            </h2>
            <p className="text-secondary mb-6" style={{ fontSize: '1.125rem' }}>
              Start swiping right on products you love!
            </p>
            <button
              onClick={() => router.push('/swipe')}
              className="btn-modern-primary"
            >
              Start Swiping
            </button>
          </div>
        ) : (
          <div className="cart-page-grid grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Liked Items */}
            <div className="lg:col-span-8 space-y-4">
              {likedProducts.map((product) => (
                <div
                  key={product.id}
                  className="cart-item-card"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: '1.5rem',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Product Image */}
                  <img
                    src={getValidImageUrl(product.images)}
                    alt={product.name}
                    className="cart-item-image"
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-lg)',
                      flexShrink: 0
                    }}
                  />

                  {/* Product Details */}
                  <div style={{ minWidth: 0 }}>
                    <h3 className="text-primary font-semibold mb-2" style={{ fontSize: '1.125rem', lineHeight: '1.4' }}>
                      {product.name}
                    </h3>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      {product.brand && (
                        <span className="product-spec-badge">
                          {product.brand}
                        </span>
                      )}
                      {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                        <span className="product-spec-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                          {Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}% OFF
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="text-accent font-bold" style={{ fontSize: '1.5rem' }}>
                        ${Number(product.price).toFixed(2)}
                      </span>
                      {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                        <span className="text-tertiary line-through" style={{ fontSize: '1rem' }}>
                          ${Number(product.originalPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromLiked(product.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--error)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-lg)',
                      transition: 'background 0.2s ease'
                    }}
                    title="Remove from liked items"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="font-medium" style={{ fontSize: '0.875rem' }}>Remove</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-4">
              <div
                className="cart-summary-sticky"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.5rem',
                  position: 'sticky',
                  top: '1.5rem'
                }}
              >
                <h2 className="text-primary font-bold mb-6" style={{ fontSize: '1.5rem' }}>
                  Summary
                </h2>

                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                      Subtotal ({likedProducts.length} {likedProducts.length === 1 ? 'item' : 'items'})
                    </span>
                    <span className="text-primary font-semibold" style={{ fontSize: '1rem' }}>
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {totalSavings > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Sparkles className="w-4 h-4" />
                        Total Savings
                      </span>
                      <span style={{ fontSize: '1rem', color: 'var(--success)', fontWeight: '600' }}>
                        -${totalSavings.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span className="text-primary font-bold" style={{ fontSize: '1.125rem' }}>Total</span>
                  <span className="text-accent font-bold" style={{ fontSize: '1.75rem' }}>
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn-modern-primary w-full mb-3"
                  style={{ padding: '0.875rem 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add All to Cart
                </button>

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all liked items?')) {
                      clearLiked()
                    }
                  }}
                  className="btn-modern-secondary w-full"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Clear All
                </button>

                <p className="text-tertiary text-center mt-4" style={{ fontSize: '0.75rem', margin: '1rem 0 0 0' }}>
                  Items will be added to your cart for checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
