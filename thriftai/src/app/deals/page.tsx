'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-react'
import LoginModal from '@/components/LoginModal'
import SignupModal from '@/components/SignupModal'

interface Deal {
  id: string
  name: string
  brand?: string
  price: number
  originalPrice?: number
  imageUrl?: string
  category?: string
  dealScore: number
  priceDropPercent: number
  trend: 'Rising' | 'Falling' | 'Stable'
}

export default function DealsPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || '',
    userType: 'buyer' as const
  } : null

  useEffect(() => {
    fetchBestDeals()
  }, [])

  const fetchBestDeals = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/price-intelligence/best-deals?limit=20')
      const data = await response.json()

      if (data.success) {
        setDeals(data.deals)
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDealBadge = (score: number) => {
    if (score >= 90) return { text: '🔥 HOT DEAL', color: 'bg-red-600' }
    if (score >= 80) return { text: '⭐ Great Deal', color: 'bg-orange-500' }
    if (score >= 70) return { text: '✨ Good Deal', color: 'bg-blue-500' }
    return { text: '👍 Fair Deal', color: 'bg-gray-500' }
  }

  return (
    <div className="App">
      <Navigation
        user={appUser}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={() => {}}
      />

      <main className="container mx-auto px-4 py-8" style={{ maxWidth: '1200px', minHeight: 'calc(100vh - 200px)' }}>
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="page-header mb-3">
            🔥 Best Deals Right Now
          </h1>
          <p className="page-subtitle">
            AI-curated deals with the biggest price drops and best value
          </p>
        </div>

        {/* Deals Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary mt-3">Finding the best deals for you...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-secondary">No deals available at the moment</p>
          </div>
        ) : (
          <div className="row g-4">
            {deals.map((deal) => {
              const badge = getDealBadge(deal.dealScore)
              const savings = deal.originalPrice ? deal.originalPrice - deal.price : 0

              return (
                <div key={deal.id} className="col-md-6 col-lg-4">
                  <div
                    className="product-card h-100"
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/products/${deal.id}`)}
                  >
                    {/* Deal Badge */}
                    <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                      <span className={`badge ${badge.color} text-white px-3 py-2`}>
                        {badge.text}
                      </span>
                    </div>

                    {/* Product Image */}
                    <img
                      src={deal.imageUrl || '/placeholder-image.jpg'}
                      alt={deal.name}
                      className="product-card-img"
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="text-primary font-semibold mb-2" style={{ fontSize: '1rem', lineHeight: '1.4' }}>
                        {deal.name}
                      </h3>

                      {deal.brand && (
                        <p className="text-secondary mb-2" style={{ fontSize: '0.875rem' }}>
                          {deal.brand}
                        </p>
                      )}

                      {/* Price Info */}
                      <div className="mb-3">
                        <div className="d-flex align-items-baseline gap-2 mb-1">
                          <span className="text-accent font-bold" style={{ fontSize: '1.5rem' }}>
                            ${deal.price.toFixed(2)}
                          </span>
                          {deal.originalPrice && (
                            <span className="text-tertiary" style={{ textDecoration: 'line-through', fontSize: '1rem' }}>
                              ${deal.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {savings > 0 && (
                          <div className="d-flex align-items-center gap-2">
                            <span className="text-green-600 font-semibold">
                              Save ${savings.toFixed(2)} ({deal.priceDropPercent.toFixed(0)}% off)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Deal Score */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Deal Score</span>
                          <span className="font-semibold">{deal.dealScore}/100</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${deal.dealScore}%`,
                              height: '100%',
                              background: deal.dealScore >= 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                      </div>

                      {/* Price Trend */}
                      <div className="d-flex align-items-center gap-2">
                        {deal.trend === 'Falling' ? (
                          <>
                            <TrendingDown className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-semibold" style={{ fontSize: '0.875rem' }}>Price Dropping</span>
                          </>
                        ) : deal.trend === 'Rising' ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-red-600" />
                            <span className="text-red-600" style={{ fontSize: '0.875rem' }}>Price Rising</span>
                          </>
                        ) : (
                          <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Stable Price</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-6 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h3 className="text-primary font-bold mb-0">How We Find These Deals</h3>
          </div>
          <p className="text-secondary mb-0">
            Our AI analyzes price history across thousands of products to identify items with the biggest price drops,
            best value compared to retail, and highest quality-to-price ratio. Deal scores consider price trends,
            market demand, and product condition to surface only the most worthwhile opportunities.
          </p>
        </div>
      </main>

      <Footer />
      <LoginModal show={showLoginModal} onHide={() => setShowLoginModal(false)} />
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
