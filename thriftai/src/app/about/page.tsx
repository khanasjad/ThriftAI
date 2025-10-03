'use client'

import React, { useState } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useSession } from 'next-auth/react'
import LoginModal from '@/components/LoginModal'
import SignupModal from '@/components/SignupModal'
import { Award, TrendingUp, Shield, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

export default function AboutPage() {
  const { data: session } = useSession()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || '',
    userType: 'buyer' as const
  } : null

  const parameterCategories = [
    {
      id: 'product-quality',
      title: 'Product Quality (24 parameters)',
      icon: Award,
      description: 'Comprehensive analysis of product condition, authenticity, and value',
      parameters: [
        'Product condition score',
        'Brand reputation index',
        'Material quality assessment',
        'Manufacturing standards',
        'Authenticity verification',
        'Age and wear analysis',
        'Functional condition',
        'Cosmetic condition',
        'Original packaging presence',
        'Warranty status',
        'Return policy rating',
        'Refurbishment quality',
        'Parts originality',
        'Durability score',
        'Maintenance history',
        'Previous ownership count',
        'Usage intensity estimation',
        'Storage condition assessment',
        'Damage history',
        'Repair quality',
        'Certification status',
        'Quality control compliance',
        'Defect frequency',
        'Overall quality score'
      ]
    },
    {
      id: 'seller-trust',
      title: 'Seller Trustworthiness (18 parameters)',
      icon: Shield,
      description: 'Deep dive into seller reliability, history, and credibility',
      parameters: [
        'Seller rating average',
        'Total reviews count',
        'Verified seller status',
        'Account age',
        'Response time average',
        'Response rate percentage',
        'Dispute resolution record',
        'Cancellation rate',
        'Late shipment rate',
        'Positive feedback ratio',
        'Return acceptance rate',
        'Customer satisfaction score',
        'Trust badges earned',
        'Platform violations history',
        'Fraud detection score',
        'Business legitimacy',
        'Contact information completeness',
        'Seller reliability index'
      ]
    },
    {
      id: 'market-value',
      title: 'Market Value Analysis (16 parameters)',
      icon: TrendingUp,
      description: 'Real-time market intelligence and pricing insights',
      parameters: [
        'Current market price',
        'Historical price trends',
        'Price vs. market average',
        'Discount percentage',
        'Savings calculation',
        'Retail price comparison',
        'Competitor pricing',
        'Price stability index',
        'Demand level',
        'Supply availability',
        'Seasonal pricing factor',
        'Regional price variance',
        'Currency conversion accuracy',
        'Tax inclusion clarity',
        'Hidden costs analysis',
        'Total cost of ownership'
      ]
    },
    {
      id: 'sustainability',
      title: 'Sustainability Impact (12 parameters)',
      icon: Sparkles,
      description: 'Environmental and social responsibility metrics',
      parameters: [
        'Carbon footprint reduction',
        'Waste prevention score',
        'Circular economy contribution',
        'Recycling potential',
        'Material sustainability',
        'Ethical sourcing verification',
        'Energy efficiency rating',
        'Environmental certifications',
        'Packaging sustainability',
        'Transportation carbon cost',
        'Product lifecycle extension',
        'Social impact score'
      ]
    },
    {
      id: 'transaction',
      title: 'Transaction Security (14 parameters)',
      icon: Shield,
      description: 'Payment safety and transaction reliability',
      parameters: [
        'Payment method security',
        'Buyer protection coverage',
        'Escrow availability',
        'Refund policy clarity',
        'Shipping insurance',
        'Tracking availability',
        'Delivery guarantee',
        'Fraud protection',
        'Secure checkout rating',
        'Privacy policy compliance',
        'Data encryption level',
        'Third-party verification',
        'Transaction history',
        'Platform trust score'
      ]
    },
    {
      id: 'user-experience',
      title: 'User Experience (12 parameters)',
      icon: Award,
      description: 'Shopping convenience and customer service quality',
      parameters: [
        'Product description accuracy',
        'Image quality score',
        'Shipping speed rating',
        'Packaging quality',
        'Communication clarity',
        'Post-purchase support',
        'Return process ease',
        'Customer service availability',
        'Problem resolution time',
        'User satisfaction index',
        'Recommendation likelihood',
        'Overall experience rating'
      ]
    }
  ]

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  return (
    <div className="App">
      <Navigation
        user={appUser}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={() => {}}
      />

      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          padding: '4rem 0',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 className="text-gradient-primary" style={{
                fontSize: '3rem',
                fontWeight: 800,
                marginBottom: '1rem',
                lineHeight: '1.2'
              }}>
                About Veritas.ai
              </h1>
              <p className="text-secondary" style={{ fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
                Revolutionizing online shopping with AI-powered trust and transparency
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
              marginTop: '3rem'
            }}>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <Award className="mx-auto mb-3" style={{ width: '48px', height: '48px', color: 'var(--accent-primary)' }} />
                <h3 className="text-primary font-bold mb-2" style={{ fontSize: '1.25rem' }}>Veritas Score</h3>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                  Our proprietary trust algorithm analyzing 96 unique parameters
                </p>
              </div>

              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <TrendingUp className="mx-auto mb-3" style={{ width: '48px', height: '48px', color: 'var(--accent-primary)' }} />
                <h3 className="text-primary font-bold mb-2" style={{ fontSize: '1.25rem' }}>Smart Shopping</h3>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                  AI-powered recommendations that save you time and money
                </p>
              </div>

              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <Shield className="mx-auto mb-3" style={{ width: '48px', height: '48px', color: 'var(--accent-primary)' }} />
                <h3 className="text-primary font-bold mb-2" style={{ fontSize: '1.25rem' }}>Buyer Protection</h3>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                  Shop with confidence knowing every transaction is verified
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section style={{ padding: '4rem 0' }}>
          <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
            <h2 className="text-primary font-bold mb-4" style={{ fontSize: '2rem', textAlign: 'center' }}>
              What We Improve
            </h2>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <p className="text-secondary mb-4" style={{ fontSize: '1.125rem', lineHeight: '1.8' }}>
                Online shopping should be simple, safe, and sustainable. At Veritas.ai, we use advanced AI to solve the biggest challenges in e-commerce:
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  { title: 'Trust & Transparency', desc: 'No more wondering if a deal is too good to be true. Our Veritas Score gives you instant trust insights.' },
                  { title: 'Information Overload', desc: 'We analyze thousands of data points so you can make decisions in seconds, not hours.' },
                  { title: 'Hidden Costs', desc: 'Complete price transparency including shipping, taxes, and total cost of ownership.' },
                  { title: 'Seller Reliability', desc: 'Deep verification of seller history, ratings, and trustworthiness across platforms.' },
                  { title: 'Sustainability', desc: 'Making eco-conscious shopping easy with environmental impact scores for every product.' }
                ].map((item, idx) => (
                  <li key={idx} style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    marginBottom: '1rem'
                  }}>
                    <h3 className="text-accent font-semibold mb-2" style={{ fontSize: '1.125rem' }}>{item.title}</h3>
                    <p className="text-secondary" style={{ fontSize: '1rem', margin: 0 }}>{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Veritas Score Section */}
        <section style={{
          padding: '4rem 0',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid var(--border-primary)',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
            <h2 className="text-primary font-bold mb-3" style={{ fontSize: '2rem', textAlign: 'center' }}>
              The Veritas Score
            </h2>
            <p className="text-secondary mb-6" style={{ fontSize: '1.125rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem' }}>
              A revolutionary trust metric that analyzes <span className="text-accent font-bold">96 unique parameters</span> across
              6 critical categories to give you a complete picture of every purchase.
            </p>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--accent-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              marginBottom: '3rem'
            }}>
              <h3 className="text-primary font-bold mb-4" style={{ fontSize: '1.5rem' }}>How It Helps You</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <h4 className="text-accent font-semibold mb-2" style={{ fontSize: '1.125rem' }}>Make Faster Decisions</h4>
                  <p className="text-secondary" style={{ fontSize: '1rem' }}>
                    One score instead of reading hundreds of reviews. See instantly if a product and seller are trustworthy.
                  </p>
                </div>
                <div>
                  <h4 className="text-accent font-semibold mb-2" style={{ fontSize: '1.125rem' }}>Avoid Scams & Fakes</h4>
                  <p className="text-secondary" style={{ fontSize: '1rem' }}>
                    Our AI detects red flags in seller behavior, pricing anomalies, and authenticity concerns.
                  </p>
                </div>
                <div>
                  <h4 className="text-accent font-semibold mb-2" style={{ fontSize: '1.125rem' }}>Save Money</h4>
                  <p className="text-secondary" style={{ fontSize: '1rem' }}>
                    Find the best deals with confidence. Compare true value, not just price.
                  </p>
                </div>
                <div>
                  <h4 className="text-accent font-semibold mb-2" style={{ fontSize: '1.125rem' }}>Shop Sustainably</h4>
                  <p className="text-secondary" style={{ fontSize: '1rem' }}>
                    See the environmental impact of every purchase and make eco-friendly choices easily.
                  </p>
                </div>
                <div>
                  <h4 className="text-accent font-semibold mb-2" style={{ fontSize: '1.125rem' }}>Reduce Returns</h4>
                  <p className="text-secondary" style={{ fontSize: '1rem' }}>
                    Accurate product analysis means you get what you expect, reducing buyer's remorse.
                  </p>
                </div>
                <div>
                  <h4 className="text-accent font-semibold mb-2" style={{ fontSize: '1.125rem' }}>Peace of Mind</h4>
                  <p className="text-secondary" style={{ fontSize: '1rem' }}>
                    Every transaction backed by comprehensive analysis and buyer protection insights.
                  </p>
                </div>
              </div>
            </div>

            {/* 96 Parameters Breakdown */}
            <h3 className="text-primary font-bold mb-4" style={{ fontSize: '1.75rem', textAlign: 'center' }}>
              96 Parameters Explained
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {parameterCategories.map((category) => {
                const Icon = category.icon
                const isExpanded = expandedCategory === category.id

                return (
                  <div
                    key={category.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-xl)',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      onClick={() => toggleCategory(category.id)}
                      style={{
                        width: '100%',
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      className="hover:bg-opacity-80"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                        <Icon style={{ width: '32px', height: '32px', color: 'var(--accent-primary)' }} />
                        <div style={{ textAlign: 'left' }}>
                          <h4 className="text-primary font-bold mb-1" style={{ fontSize: '1.25rem' }}>
                            {category.title}
                          </h4>
                          <p className="text-secondary" style={{ fontSize: '0.875rem', margin: 0 }}>
                            {category.description}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-accent" style={{ width: '24px', height: '24px' }} />
                      ) : (
                        <ChevronDown className="text-accent" style={{ width: '24px', height: '24px' }} />
                      )}
                    </button>

                    {isExpanded && (
                      <div style={{
                        padding: '0 1.5rem 1.5rem',
                        borderTop: '1px solid var(--border-primary)'
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                          gap: '0.75rem',
                          marginTop: '1rem'
                        }}>
                          {category.parameters.map((param, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: '0.875rem'
                              }}
                              className="text-secondary"
                            >
                              {param}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* How to Improve Section */}
        <section style={{ padding: '4rem 0' }}>
          <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
            <h2 className="text-primary font-bold mb-3" style={{ fontSize: '2rem', textAlign: 'center' }}>
              How to Improve Your Veritas Score
            </h2>
            <p className="text-secondary mb-6" style={{ fontSize: '1.125rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem' }}>
              For sellers looking to increase their trust rating and visibility
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {[
                {
                  title: 'Maintain High Quality',
                  tips: [
                    'Provide accurate product descriptions',
                    'Use high-quality photos',
                    'Ensure products match descriptions',
                    'Maintain consistent quality standards'
                  ]
                },
                {
                  title: 'Build Trust',
                  tips: [
                    'Respond quickly to buyer messages',
                    'Resolve disputes fairly',
                    'Maintain high positive feedback ratio',
                    'Get verified seller status'
                  ]
                },
                {
                  title: 'Competitive Pricing',
                  tips: [
                    'Price competitively with market rates',
                    'Offer transparent pricing',
                    'Provide detailed cost breakdowns',
                    'No hidden fees or charges'
                  ]
                },
                {
                  title: 'Reliable Shipping',
                  tips: [
                    'Ship on time consistently',
                    'Use tracking for all orders',
                    'Package items securely',
                    'Communicate delivery updates'
                  ]
                },
                {
                  title: 'Customer Service',
                  tips: [
                    'Offer easy returns',
                    'Provide excellent post-sale support',
                    'Handle complaints professionally',
                    'Go above and beyond for customers'
                  ]
                },
                {
                  title: 'Sustainability',
                  tips: [
                    'Use eco-friendly packaging',
                    'Source products ethically',
                    'Reduce carbon footprint',
                    'Obtain environmental certifications'
                  ]
                }
              ].map((section, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '2rem'
                  }}
                >
                  <h3 className="text-accent font-bold mb-3" style={{ fontSize: '1.25rem' }}>
                    {section.title}
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {section.tips.map((tip, tipIdx) => (
                      <li
                        key={tipIdx}
                        className="text-secondary"
                        style={{
                          fontSize: '0.9375rem',
                          marginBottom: '0.75rem',
                          paddingLeft: '1.5rem',
                          position: 'relative'
                        }}
                      >
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          color: 'var(--accent-primary)',
                          fontWeight: 'bold'
                        }}>
                          ✓
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: '4rem 0',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderTop: '1px solid var(--border-primary)'
        }}>
          <div className="container mx-auto px-4" style={{ maxWidth: '800px', textAlign: 'center' }}>
            <h2 className="text-primary font-bold mb-4" style={{ fontSize: '2rem' }}>
              Experience Smarter Shopping Today
            </h2>
            <p className="text-secondary mb-6" style={{ fontSize: '1.125rem' }}>
              Join thousands of smart shoppers who trust Veritas.ai for safe, sustainable, and savvy online shopping.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/buyers/search?q=products" className="btn-modern-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                Start Shopping
              </a>
              <a href="/" className="btn-modern-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                Learn More
              </a>
            </div>
          </div>
        </section>
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
