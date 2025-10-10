'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { X, Plus, Trophy, TrendingUp, Shield } from 'lucide-react'
import LoginModal from '@/components/LoginModal'
import SignupModal from '@/components/SignupModal'

interface Product {
  id: string
  name: string
  brand?: string
  price: number
  originalPrice?: number
  imageUrl?: string
  condition?: string
  category?: string
  dynamicSpecs?: any
  seller?: {
    businessName?: string
    rating?: number
  }
}

interface ComparisonData {
  products: Product[]
  winner?: {
    productId: string
    reason: string
    score: number
  }
  insights: string[]
}

export default function ComparePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [products, setProducts] = useState<Product[]>([])
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || '',
    userType: 'buyer' as const
  } : null

  // Load products from URL params
  useEffect(() => {
    const productIds = searchParams.get('products')?.split(',') || []
    if (productIds.length > 0) {
      fetchProducts(productIds)
    }
  }, [searchParams])

  const fetchProducts = async (productIds: string[]) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds })
      })

      const data = await response.json()
      if (data.success) {
        setProducts(data.products)
        setComparisonData(data.comparison)
      }
    } catch (error) {
      console.error('Failed to fetch comparison:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeProduct = (productId: string) => {
    const newProducts = products.filter(p => p.id !== productId)
    setProducts(newProducts)

    // Update URL
    const ids = newProducts.map(p => p.id).join(',')
    router.push(`/compare?products=${ids}`)
  }

  const addProduct = () => {
    router.push('/buyers/search?q=products&compare=true')
  }

  // Get all unique spec keys
  const getAllSpecs = () => {
    const specs = new Set<string>()
    products.forEach(p => {
      if (p.dynamicSpecs) {
        Object.keys(p.dynamicSpecs).forEach(key => specs.add(key))
      }
    })
    return Array.from(specs)
  }

  if (products.length === 0) {
    return (
      <div className="App">
        <Navigation
          user={appUser}
          onShowLogin={() => setShowLoginModal(true)}
          onShowSignup={() => setShowSignupModal(true)}
          onLogout={() => {}}
        />

        <main className="container mx-auto px-4 py-8" style={{ maxWidth: '1200px', minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center py-16">
            <Trophy className="w-24 h-24 mx-auto mb-6 text-purple-600" />
            <h1 className="page-header mb-3">Product Comparison</h1>
            <p className="page-subtitle mb-8">
              Compare up to 4 products side-by-side
            </p>
            <button
              onClick={addProduct}
              className="btn-modern-primary"
            >
              <Plus className="w-5 h-5" />
              <span>Add Products to Compare</span>
            </button>
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

  const specs = getAllSpecs()

  return (
    <div className="App">
      <Navigation
        user={appUser}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={() => {}}
      />

      <main className="container mx-auto px-4 py-6" style={{ maxWidth: '1400px', minHeight: 'calc(100vh - 200px)' }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="page-header mb-2">Product Comparison</h1>
          <p className="page-subtitle">
            Comparing {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {/* Winner Badge */}
        {comparisonData?.winner && (
          <div
            className="mb-6 p-6 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-8 h-8 text-purple-600" />
              <h2 className="text-xl font-bold text-primary">AI Winner</h2>
            </div>
            <p className="text-primary mb-2" style={{ fontSize: '1.125rem' }}>
              {products.find(p => p.id === comparisonData.winner?.productId)?.name}
            </p>
            <p className="text-secondary">{comparisonData.winner.reason}</p>
            <div className="mt-3">
              <span className="px-3 py-1 rounded-full bg-purple-600 text-white font-semibold">
                Winner Score: {comparisonData.winner.score}/100
              </span>
            </div>
          </div>
        )}

        {/* Comparison Grid */}
        <div
          className="overflow-x-auto rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-primary)'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', minWidth: '200px' }}>
                  <span className="text-secondary font-semibold">Specification</span>
                </th>
                {products.map((product) => (
                  <th key={product.id} style={{ padding: '1rem', minWidth: '250px' }}>
                    <div className="relative">
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-error text-white hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <img
                        src={product.imageUrl || '/placeholder-image.jpg'}
                        alt={product.name}
                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', marginBottom: '0.75rem' }}
                      />
                      <h3 className="text-primary font-semibold mb-1" style={{ fontSize: '0.95rem', lineHeight: '1.3' }}>
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>{product.brand}</p>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Price */}
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <td style={{ padding: '1rem' }}>
                  <span className="text-secondary font-medium">Price</span>
                </td>
                {products.map((product) => (
                  <td key={product.id} style={{ padding: '1rem' }}>
                    <div>
                      <span className="text-accent font-bold" style={{ fontSize: '1.25rem' }}>
                        ${product.price.toFixed(2)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-tertiary" style={{ fontSize: '0.875rem' }}>
                          <span style={{ textDecoration: 'line-through' }}>${product.originalPrice.toFixed(2)}</span>
                          <span className="text-green-600 ml-2">
                            Save ${(product.originalPrice - product.price).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Condition */}
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <td style={{ padding: '1rem' }}>
                  <span className="text-secondary font-medium">Condition</span>
                </td>
                {products.map((product) => (
                  <td key={product.id} style={{ padding: '1rem' }}>
                    <span className="product-spec-badge">{product.condition || 'Not specified'}</span>
                  </td>
                ))}
              </tr>

              {/* Seller */}
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <td style={{ padding: '1rem' }}>
                  <span className="text-secondary font-medium">Seller</span>
                </td>
                {products.map((product) => (
                  <td key={product.id} style={{ padding: '1rem' }}>
                    <div>
                      <div className="text-primary">{product.seller?.businessName || 'Unknown'}</div>
                      {product.seller?.rating && (
                        <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                          Rating: {product.seller.rating}/5
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* All Specs */}
              {specs.map((specKey) => (
                <tr key={specKey} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '1rem' }}>
                    <span className="text-secondary font-medium">{specKey}</span>
                  </td>
                  {products.map((product) => {
                    const value = product.dynamicSpecs?.[specKey]
                    return (
                      <td key={product.id} style={{ padding: '1rem' }}>
                        <span className="text-primary">{value || '-'}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add More Button */}
        {products.length < 4 && (
          <div className="mt-6 text-center">
            <button
              onClick={addProduct}
              className="btn-modern-secondary"
            >
              <Plus className="w-5 h-5" />
              <span>Add Another Product ({4 - products.length} slots left)</span>
            </button>
          </div>
        )}

        {/* Insights */}
        {comparisonData?.insights && comparisonData.insights.length > 0 && (
          <div className="mt-6 p-6 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-primary font-bold">AI Insights</h3>
            </div>
            <ul className="space-y-2">
              {comparisonData.insights.map((insight, idx) => (
                <li key={idx} className="text-secondary flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-1 flex-shrink-0 text-blue-600" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
