'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { XCircle, ShoppingCart, ArrowLeft, Home } from 'lucide-react'
import LoginModal from '@/components/LoginModal'
import SignupModal from '@/components/SignupModal'
import { useState } from 'react'

export default function CheckoutCancelPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || '',
    userType: 'buyer' as const
  } : null

  return (
    <div className="App">
      <Navigation
        user={appUser}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={() => {}}
      />

      <main className="container mx-auto px-4 py-8" style={{ maxWidth: '900px', minHeight: 'calc(100vh - 200px)' }}>
        <div className="text-center py-16">
          {/* Cancel Icon */}
          <XCircle className="w-24 h-24 mx-auto mb-6 text-orange-500" />

          {/* Header */}
          <h1 className="page-header mb-3">Checkout Cancelled</h1>
          <p className="page-subtitle mb-8">
            Your order was not completed. No charges have been made.
          </p>

          {/* What Happened Section */}
          <div
            className="mb-8 p-6 rounded-xl text-left max-w-2xl mx-auto"
            style={{
              backgroundColor: 'var(--background-secondary, #f9fafb)',
              border: '1px solid var(--border-color, #e5e7eb)'
            }}
          >
            <h2 className="font-bold mb-3" style={{ color: 'var(--text-primary, #000000)' }}>
              What happened?
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              You cancelled the checkout process. Your cart items are still saved and ready when you're ready to complete your purchase.
            </p>

            <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary, #000000)', fontSize: '0.95rem' }}>
              Common reasons for cancellation:
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Changed your mind about the purchase</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Need to review items before buying</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Prefer to pay later</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Encountered a technical issue</span>
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div
            className="mb-8 p-6 rounded-xl text-left max-w-2xl mx-auto"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary, #000000)' }}>
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              <li className="flex items-start gap-2">
                <ShoppingCart className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>Your cart items are still saved and waiting for you</span>
              </li>
              <li className="flex items-start gap-2">
                <ShoppingCart className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>You can modify your cart or continue shopping</span>
              </li>
              <li className="flex items-start gap-2">
                <ShoppingCart className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>When ready, return to checkout to complete your purchase</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/cart')}
              className="btn-modern-primary"
              style={{ minWidth: '200px' }}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Return to Cart</span>
            </button>

            <button
              onClick={() => router.push('/buyers/search?q=products')}
              className="btn-modern-secondary"
              style={{ minWidth: '200px' }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Continue Shopping</span>
            </button>

            <button
              onClick={() => router.push('/')}
              className="btn-modern-secondary"
              style={{ minWidth: '200px' }}
            >
              <Home className="w-5 h-5" />
              <span>Return Home</span>
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-8" style={{ borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
            <p className="text-sm" style={{ color: 'var(--text-tertiary, #9ca3af)' }}>
              Need help? Contact our support team or check our FAQ
            </p>
          </div>
        </div>
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
