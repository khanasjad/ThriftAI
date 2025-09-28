'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import LoginModal from '@/components/LoginModal'
import SignupModal from '@/components/SignupModal'

interface Product {
  id: string
  name: string
  price: number
  description: string
  imageUrl?: string
  category?: string
  brand?: string
  condition?: string
}

interface SearchResults {
  products: Product[]
  aiResponse?: string
  recommendations?: any[]
  totalFound?: number
  sustainabilityInsights?: any
}

export default function SearchResults() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  // Adapt the user object to match what Navigation expects
  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || '',
    userType: 'buyer' as const
  } : null

  useEffect(() => {
    const loadSearchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        // First check session storage for cached results
        const cachedResults = sessionStorage.getItem('searchResults')
        if (cachedResults) {
          const parsedResults = JSON.parse(cachedResults)
          setSearchResults({
            products: parsedResults.products || [],
            aiResponse: parsedResults.aiResponse,
            recommendations: parsedResults.recommendations,
            totalFound: parsedResults.totalFound,
            sustainabilityInsights: parsedResults.sustainabilityInsights
          })
          setLoading(false)
          return
        }

        // If no cached results, fetch from API
        if (query) {
          const response = await fetch(`/api/buyers/search?q=${encodeURIComponent(query)}`)
          if (!response.ok) {
            throw new Error('Failed to fetch search results')
          }

          const data = await response.json()
          setSearchResults({
            products: data.products || [],
            aiResponse: data.aiResponse,
            recommendations: data.recommendations,
            totalFound: data.totalFound,
            sustainabilityInsights: data.sustainabilityInsights
          })
        }
      } catch (err) {
        console.error('Search error:', err)
        setError('Failed to load search results')
      } finally {
        setLoading(false)
      }
    }

    loadSearchResults()
  }, [query])

  // Simple auth service for signup compatibility
  const authService = {
    signup: async (userData: any) => {
      console.log('Signup attempt:', userData)
    }
  }

  if (loading) {
    return (
      <div className="App">
        <Navigation
          user={appUser}
          onShowLogin={() => setShowLoginModal(true)}
          onShowSignup={() => setShowSignupModal(true)}
          onLogout={() => {}}
        />
        <div className="container my-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h3 className="mt-3 text-primary">Searching for "{query}"...</h3>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="App">
        <Navigation
          user={appUser}
          onShowLogin={() => setShowLoginModal(true)}
          onShowSignup={() => setShowSignupModal(true)}
          onLogout={() => {}}
        />
        <div className="container my-5">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="App">
      <Navigation
        user={appUser}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={() => {}}
      />

      <main className="container my-5">
        <div className="row">
          <div className="col-12 mb-4">
            <h1 className="text-primary fw-bold">
              Search Results for "{query}"
            </h1>
            <p className="text-secondary">
              Found {searchResults?.totalFound || searchResults?.products?.length || 0} products
            </p>
          </div>
        </div>

        {/* Claude AI Response Section */}
        {searchResults?.aiResponse && (
          <div className="row mb-5">
            <div className="col-12">
              <div className="card-modern p-4" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <h4 className="text-primary mb-3">
                  <i className="fas fa-robot me-2"></i>
                  AI Shopping Assistant
                </h4>
                <div className="text-white" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
                  {searchResults.aiResponse}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sustainability Insights */}
        {searchResults?.sustainabilityInsights && (
          <div className="row mb-5">
            <div className="col-12">
              <div className="card-modern p-4" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <h5 className="text-success mb-3">
                  <i className="fas fa-leaf me-2"></i>
                  Sustainability Impact
                </h5>
                <div className="row">
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-warning">${searchResults.sustainabilityInsights.totalSavings}</div>
                      <small className="text-muted">Money Saved</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-info">{searchResults.sustainabilityInsights.estimatedCO2Saved}</div>
                      <small className="text-muted">CO2 Saved</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-primary">{searchResults.sustainabilityInsights.waterSaved}</div>
                      <small className="text-muted">Water Saved</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-success">{searchResults.sustainabilityInsights.itemsKeptFromLandfill}</div>
                      <small className="text-muted">Items from Landfill</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          {searchResults?.products && searchResults.products.length > 0 ? (
            searchResults.products.map((product) => (
              <div key={product.id} className="col-lg-4 col-md-6 mb-4">
                <div className="card-modern h-100">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      className="card-img-top"
                      alt={product.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h6 className="card-title fw-bold text-primary">{product.name}</h6>
                    <p className="card-text text-secondary small flex-grow-1">
                      {product.description}
                    </p>
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="h5 text-success fw-bold mb-0">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      {product.condition && (
                        <small className="text-muted">
                          Condition: {product.condition}
                        </small>
                      )}
                      <div className="mt-2">
                        <button className="btn btn-primary w-100">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="text-center py-5">
                <h3 className="text-secondary">No products found</h3>
                <p className="text-muted">
                  Try adjusting your search filters or search for different terms.
                </p>
              </div>
            </div>
          )}
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
        onSignup={authService.signup}
      />
    </div>
  )
}