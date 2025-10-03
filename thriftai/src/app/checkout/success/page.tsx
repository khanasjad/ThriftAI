'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react'
import LoginModal from '@/components/LoginModal'
import SignupModal from '@/components/SignupModal'

interface OrderDetails {
  id: string
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: string
  createdAt: string
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    productImageUrl?: string
  }>
}

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = searchParams.get('order_id')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('No order ID provided')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch order details')
        }

        const data = await response.json()
        setOrderDetails(data)
      } catch (err: any) {
        console.error('Error fetching order:', err)
        setError(err.message || 'Failed to load order details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId])

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
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <Package className="w-24 h-24 mx-auto" style={{ color: 'var(--text-tertiary, #9ca3af)' }} />
            </div>
            <h1 className="page-header mb-3">Order Not Found</h1>
            <p className="page-subtitle mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="btn-modern-primary"
            >
              <Home className="w-5 h-5" />
              <span>Return Home</span>
            </button>
          </div>
        ) : orderDetails ? (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center py-8">
              <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-600" />
              <h1 className="page-header mb-2">Order Confirmed!</h1>
              <p className="page-subtitle">
                Thank you for your purchase. Your order has been confirmed.
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                Order #{orderDetails.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Order Summary */}
            <div
              className="p-6 rounded-xl"
              style={{
                backgroundColor: 'var(--background-primary, #ffffff)',
                border: '1px solid var(--border-color, #e5e7eb)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary, #000000)' }}>
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                {orderDetails.items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-start">
                    {item.productImageUrl && (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="product-image"
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="product-title" style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
                        {item.productName}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: 'var(--text-primary, #000000)' }}>
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary, #6b7280)' }}>Subtotal</span>
                  <span style={{ color: 'var(--text-primary, #000000)' }}>${orderDetails.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary, #6b7280)' }}>Tax</span>
                  <span style={{ color: 'var(--text-primary, #000000)' }}>${orderDetails.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary, #6b7280)' }}>Shipping</span>
                  <span style={{ color: 'var(--text-primary, #000000)' }}>
                    {orderDetails.shipping > 0 ? `$${orderDetails.shipping.toFixed(2)}` : 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
                  <span className="text-lg font-bold" style={{ color: 'var(--text-primary, #000000)' }}>Total</span>
                  <span className="text-xl font-bold text-green-600">${orderDetails.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div
              className="p-6 rounded-xl"
              style={{
                backgroundColor: 'var(--background-secondary, #f9fafb)',
                border: '1px solid var(--border-color, #e5e7eb)'
              }}
            >
              <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary, #000000)' }}>
                What's Next?
              </h3>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>You'll receive a confirmation email shortly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>We'll send you tracking information when your order ships</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>You can track your order status in your account</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => router.push('/buyers/search?q=products')}
                className="btn-modern-secondary"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn-modern-primary"
              >
                <Home className="w-4 h-4" />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        ) : null}
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
