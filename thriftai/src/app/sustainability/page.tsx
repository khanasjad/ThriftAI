'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Leaf, TrendingUp, Award, Globe, Recycle, Heart } from 'lucide-react'
import LoginModal from '@/components/LoginModal'
import SignupModal from '@/components/SignupModal'

interface SustainabilityStats {
  co2Saved: number // kg
  waterSaved: number // liters
  wasteAvoided: number // kg
  treesEquivalent: number
  purchaseCount: number
  globalRank: number
  totalUsers: number
}

export default function SustainabilityPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [stats, setStats] = useState<SustainabilityStats>({
    co2Saved: 0,
    waterSaved: 0,
    wasteAvoided: 0,
    treesEquivalent: 0,
    purchaseCount: 0,
    globalRank: 0,
    totalUsers: 1000
  })
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
    // In a real implementation, fetch user's sustainability stats from API
    // For demo, calculate based on session or show platform stats
    calculateSustainabilityImpact()
  }, [session])

  const calculateSustainabilityImpact = () => {
    // Demo calculation - in production, fetch from database
    const avgItemImpact = {
      co2: 5.2, // kg per item
      water: 2000, // liters per item
      waste: 0.8 // kg per item
    }

    // Platform-wide stats (for non-logged-in users)
    const platformStats = {
      co2Saved: 45678,
      waterSaved: 18500000,
      wasteAvoided: 7234,
      treesEquivalent: 2000,
      purchaseCount: 8500,
      globalRank: 0,
      totalUsers: 1200
    }

    // If user is logged in, show personalized stats
    // For demo, we'll show platform stats
    setStats(platformStats)
  }

  const badges = [
    { name: 'Eco Warrior', icon: '🌟', requirement: 'Saved 50kg CO2', earned: stats.co2Saved >= 50000 },
    { name: 'Water Guardian', icon: '💧', requirement: 'Saved 100K liters', earned: stats.waterSaved >= 100000 },
    { name: 'Waste Reducer', icon: '♻️', requirement: 'Avoided 20kg waste', earned: stats.wasteAvoided >= 20000 },
    { name: 'Green Pioneer', icon: '🌱', requirement: '50 secondhand purchases', earned: stats.purchaseCount >= 50 },
  ]

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
          <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
            <Leaf className="w-12 h-12 text-green-600" />
            <h1 className="page-header mb-0">
              Your Sustainability Impact
            </h1>
          </div>
          <p className="page-subtitle">
            {appUser ? 'Track your environmental contribution through smart shopping' : 'See the collective impact of our Veritas.ai community'}
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="row g-4 mb-6">
          {/* CO2 Saved */}
          <div className="col-md-6 col-lg-3">
            <div className="card-modern p-4" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 rounded-circle" style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-primary font-bold mb-0" style={{ fontSize: '2rem' }}>
                    {(stats.co2Saved / 1000).toFixed(1)}
                  </h3>
                  <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>tons CO₂ saved</p>
                </div>
              </div>
              <p className="text-tertiary mb-0" style={{ fontSize: '0.8rem' }}>
                = {stats.treesEquivalent.toLocaleString()} trees planted
              </p>
            </div>
          </div>

          {/* Water Saved */}
          <div className="col-md-6 col-lg-3">
            <div className="card-modern p-4" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 rounded-circle" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <Recycle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-primary font-bold mb-0" style={{ fontSize: '2rem' }}>
                    {(stats.waterSaved / 1000000).toFixed(1)}M
                  </h3>
                  <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>liters water saved</p>
                </div>
              </div>
              <p className="text-tertiary mb-0" style={{ fontSize: '0.8rem' }}>
                = {Math.floor(stats.waterSaved / 200)} bathtubs
              </p>
            </div>
          </div>

          {/* Waste Avoided */}
          <div className="col-md-6 col-lg-3">
            <div className="card-modern p-4" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 rounded-circle" style={{ background: 'rgba(168, 85, 247, 0.2)' }}>
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-primary font-bold mb-0" style={{ fontSize: '2rem' }}>
                    {(stats.wasteAvoided / 1000).toFixed(1)}
                  </h3>
                  <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>tons waste avoided</p>
                </div>
              </div>
              <p className="text-tertiary mb-0" style={{ fontSize: '0.8rem' }}>
                = {Math.floor(stats.wasteAvoided / 0.8)} items from landfills
              </p>
            </div>
          </div>

          {/* Purchases */}
          <div className="col-md-6 col-lg-3">
            <div className="card-modern p-4" style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%)' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 rounded-circle" style={{ background: 'rgba(249, 115, 22, 0.2)' }}>
                  <Heart className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-primary font-bold mb-0" style={{ fontSize: '2rem' }}>
                    {stats.purchaseCount.toLocaleString()}
                  </h3>
                  <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>sustainable purchases</p>
                </div>
              </div>
              <p className="text-tertiary mb-0" style={{ fontSize: '0.8rem' }}>
                by our community
              </p>
            </div>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="card-modern p-6 mb-6">
          <h2 className="text-primary font-bold mb-4">🌍 Your Environmental Journey</h2>

          {/* Milestones */}
          <div className="row g-4">
            <div className="col-md-4">
              <div className="mb-2">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">CO₂ Reduction</span>
                  <span className="font-semibold">{Math.min(100, (stats.co2Saved / 1000)).toFixed(0)}%</span>
                </div>
                <div style={{ height: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, (stats.co2Saved / 1000))}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #22c55e, #10b981)',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
              <p className="text-tertiary" style={{ fontSize: '0.8rem' }}>Target: 100 tons</p>
            </div>

            <div className="col-md-4">
              <div className="mb-2">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Water Conservation</span>
                  <span className="font-semibold">{Math.min(100, (stats.waterSaved / 200000)).toFixed(0)}%</span>
                </div>
                <div style={{ height: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, (stats.waterSaved / 200000))}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
              <p className="text-tertiary" style={{ fontSize: '0.8rem' }}>Target: 20M liters</p>
            </div>

            <div className="col-md-4">
              <div className="mb-2">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Waste Reduction</span>
                  <span className="font-semibold">{Math.min(100, (stats.wasteAvoided / 100)).toFixed(0)}%</span>
                </div>
                <div style={{ height: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, (stats.wasteAvoided / 100))}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #a855f7, #8b5cf6)',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
              <p className="text-tertiary" style={{ fontSize: '0.8rem' }}>Target: 10 tons</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card-modern p-6 mb-6">
          <h2 className="text-primary font-bold mb-4">🏆 Sustainability Badges</h2>
          <div className="row g-4">
            {badges.map((badge, idx) => (
              <div key={idx} className="col-md-6 col-lg-3">
                <div
                  className="text-center p-4 rounded-xl"
                  style={{
                    background: badge.earned ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)' : 'var(--bg-secondary)',
                    border: `2px solid ${badge.earned ? 'var(--success)' : 'var(--border-primary)'}`,
                    opacity: badge.earned ? 1 : 0.5,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="mb-2" style={{ fontSize: '3rem' }}>
                    {badge.icon}
                  </div>
                  <h4 className="font-semibold mb-1">{badge.name}</h4>
                  <p className="text-secondary mb-0" style={{ fontSize: '0.8rem' }}>
                    {badge.requirement}
                  </p>
                  {badge.earned && (
                    <div className="mt-2">
                      <span className="badge bg-success text-white px-3 py-1">Earned!</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Educational Section */}
        <div className="card-modern p-6" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '2px solid rgba(34, 197, 94, 0.2)' }}>
          <h2 className="text-primary font-bold mb-4">🌱 Why Secondhand Shopping Matters</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <h4 className="font-semibold mb-2">Reduce Carbon Footprint</h4>
              <p className="text-secondary mb-0" style={{ fontSize: '0.9rem' }}>
                Every secondhand purchase avoids the manufacturing emissions of a new product, saving an average of 5.2kg of CO₂.
              </p>
            </div>
            <div className="col-md-4">
              <h4 className="font-semibold mb-2">Conserve Water</h4>
              <p className="text-secondary mb-0" style={{ fontSize: '0.9rem' }}>
                Manufacturing new products requires massive amounts of water. Buying used saves an average of 2,000 liters per item.
              </p>
            </div>
            <div className="col-md-4">
              <h4 className="font-semibold mb-2">Reduce Landfill Waste</h4>
              <p className="text-secondary mb-0" style={{ fontSize: '0.9rem' }}>
                The fashion industry alone generates 92 million tons of waste yearly. Every purchase extends an item's life cycle.
              </p>
            </div>
          </div>

          <div className="mt-5 text-center">
            <button
              className="btn-modern-primary"
              onClick={() => router.push('/')}
            >
              <span>Start Shopping Sustainably</span>
              <Leaf className="w-5 h-5" />
            </button>
          </div>
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
