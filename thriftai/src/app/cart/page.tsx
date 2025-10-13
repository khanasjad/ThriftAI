'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useCartStore } from '@/stores/cartStore'
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft } from 'lucide-react'
import LoginModal from '@/components/LoginModal'
import SignupModal from '@/components/SignupModal'

export default function CartPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const {
    items,
    count,
    subtotal,
    isLoading,
    fetchCart,
    removeFromCart,
    updateQuantity
  } = useCartStore()

  const [showLoginModal, setShowLoginModal] = React.useState(false)
  const [showSignupModal, setShowSignupModal] = React.useState(false)
  const [isCheckingOut, setIsCheckingOut] = React.useState(false)
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null)

  useEffect(() => {
    const buyerId = session?.user?.id
    fetchCart(buyerId)
  }, [session?.user?.id, fetchCart])

  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || '',
    userType: 'buyer' as const
  } : null

  const handleCheckout = async () => {
    if (!session?.user?.id) {
      setShowLoginModal(true)
      return
    }

    setIsCheckingOut(true)
    setCheckoutError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: localStorage.getItem('veritas-cart-storage')
            ? JSON.parse(localStorage.getItem('veritas-cart-storage')!).state?.sessionId
            : null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      setCheckoutError(error.message || 'Failed to proceed to checkout')
      setIsCheckingOut(false)
    }
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
            onClick={() => router.back()}
            className="btn-modern-secondary mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h1 className="page-header" style={{ fontSize: '2rem', marginBottom: 0 }}>Shopping Cart</h1>
          </div>
          <p className="page-subtitle">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="w-24 h-24 mb-6 text-tertiary" />
            <h2 className="text-primary font-semibold mb-3" style={{ fontSize: '1.5rem' }}>
              Your cart is empty
            </h2>
            <p className="text-secondary mb-6" style={{ fontSize: '1.125rem' }}>
              Add some products to get started!
            </p>
            <button
              onClick={() => router.push('/buyers/search?q=products')}
              className="btn-modern-primary"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="cart-page-grid grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
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
                    src={item.product.imageUrl || '/placeholder-image.jpg'}
                    alt={item.product.name}
                    className="cart-item-image"
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-lg)',
                      flexShrink: 0
                    }}
                  />

                  {/* Product Details */}
                  <div style={{ minWidth: 0 }}>
                    <h3 className="text-primary font-semibold mb-2" style={{ fontSize: '1.125rem', lineHeight: '1.4' }}>
                      {item.product.name}
                    </h3>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      {item.product.brand && (
                        <span className="product-spec-badge">
                          {item.product.brand}
                        </span>
                      )}
                      {item.product.condition && (
                        <span className="product-spec-badge">
                          {item.product.condition}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {/* Quantity Controls */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'var(--bg-tertiary)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-primary)'
                      }}>
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          }}
                          disabled={isLoading || item.quantity <= 1}
                          className="cart-quantity-btn"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: item.quantity <= 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: '44px',
                            minHeight: '44px',
                            justifyContent: 'center'
                          }}
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="text-primary font-semibold" style={{ minWidth: '2rem', textAlign: 'center' }}>
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isLoading}
                          className="cart-quantity-btn"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: '44px',
                            minHeight: '44px',
                            justifyContent: 'center'
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={isLoading}
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
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="font-medium" style={{ fontSize: '0.875rem' }}>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div className="text-accent font-bold mb-1" style={{ fontSize: '1.5rem' }}>
                      ${((item.priceAtTime || item.product.price) * item.quantity).toFixed(2)}
                    </div>
                    <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                      ${(item.priceAtTime || item.product.price).toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
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
                  Order Summary
                </h2>

                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                      Subtotal ({count} {count === 1 ? 'item' : 'items'})
                    </span>
                    <span className="text-primary font-semibold" style={{ fontSize: '1rem' }}>
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Shipping</span>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                      At checkout
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Tax</span>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                      At checkout
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span className="text-primary font-bold" style={{ fontSize: '1.125rem' }}>Total</span>
                  <span className="text-accent font-bold" style={{ fontSize: '1.75rem' }}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {checkoutError && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--error)', margin: 0 }}>{checkoutError}</p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isLoading || isCheckingOut}
                  className="btn-modern-primary w-full mb-3"
                  style={{ padding: '0.875rem 1.5rem', fontSize: '1rem' }}
                >
                  {isCheckingOut ? 'Redirecting to checkout...' : 'Proceed to Checkout'}
                </button>

                <button
                  onClick={() => router.back()}
                  className="btn-modern-secondary w-full"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Continue Shopping
                </button>

                <p className="text-tertiary text-center mt-4" style={{ fontSize: '0.75rem', margin: '1rem 0 0 0' }}>
                  Secure checkout powered by Stripe
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <LoginModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
      />

      <SignupModal
        show={showSignupModal}
        onHide={() => setShowSignupModal(false)}
        onShowLogin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
        onSignup={async () => {}}
      />
    </div>
  )
}
