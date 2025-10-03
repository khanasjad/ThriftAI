'use client'

import React, { useState } from 'react'
import { X, Award, Shield, DollarSign, Leaf, Lock, Star, ChevronDown, ChevronUp, TrendingUp, Package } from 'lucide-react'

interface VeritasScoreBreakdown {
  overallScore: number
  categories: {
    id: string
    name: string
    score: number
    weight: number
    icon: any
    parameters: {
      name: string
      value: number
      maxValue: number
      description: string
    }[]
  }[]
}

interface VeritasScoreModalProps {
  isOpen: boolean
  onClose: () => void
  productTitle: string
  breakdown: VeritasScoreBreakdown
}

export default function VeritasScoreModal({ isOpen, onClose, productTitle, breakdown }: VeritasScoreModalProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  if (!isOpen) return null

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 80) return 'text-blue-500'
    if (score >= 70) return 'text-yellow-500'
    if (score >= 60) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-blue-500'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional'
    if (score >= 80) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Poor'
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] animate-fadeIn"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto animate-slideUp"
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] p-6 z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-6 h-6 text-[var(--accent-primary)]" />
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Veritas Score™ Breakdown</h2>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{productTitle}</p>

                {/* Overall Score */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="var(--border-primary)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="var(--accent-primary)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - breakdown.overallScore / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(breakdown.overallScore)}`}>
                        {breakdown.overallScore}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className={`text-xl font-semibold ${getScoreColor(breakdown.overallScore)}`}>
                      {getScoreLabel(breakdown.overallScore)}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Based on 96 quality parameters
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center hover:bg-[var(--bg-primary)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-primary)]" />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="p-6 space-y-4">
            {breakdown.categories.map((category) => {
              const Icon = category.icon
              const isExpanded = expandedCategory === category.id

              return (
                <div
                  key={category.id}
                  className="border border-[var(--border-primary)] rounded-xl overflow-hidden bg-[var(--bg-tertiary)]"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-primary)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${getScoreBgColor(category.score)} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-[var(--text-primary)]">{category.name}</div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          {category.parameters.length} parameters • {category.weight}% weight
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                          {category.score}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {getScoreLabel(category.score)}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
                      )}
                    </div>
                  </button>

                  {/* Category Parameters */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border-primary)] p-4 space-y-3">
                      {category.parameters.map((param, idx) => {
                        const percentage = (param.value / param.maxValue) * 100

                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-[var(--text-primary)]">{param.name}</div>
                                <div className="text-xs text-[var(--text-secondary)]">{param.description}</div>
                              </div>
                              <div className="text-sm font-semibold text-[var(--text-primary)] ml-4">
                                {param.value}/{param.maxValue}
                              </div>
                            </div>
                            <div className="w-full bg-[var(--bg-primary)] rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${getScoreBgColor(percentage)} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] p-6">
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>Veritas Score™ is calculated using AI-powered analysis across 96 quality parameters</span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

// Helper function to generate mock breakdown data
export function generateVeritasBreakdown(score: number): VeritasScoreBreakdown {
  return {
    overallScore: score,
    categories: [
      {
        id: 'product-quality',
        name: 'Product Quality',
        score: Math.min(100, score + Math.random() * 10 - 5),
        weight: 30,
        icon: Award,
        parameters: [
          { name: 'Product condition score', value: Math.floor(score * 0.9), maxValue: 100, description: 'Overall physical condition assessment' },
          { name: 'Brand reputation index', value: Math.floor(score * 0.85), maxValue: 100, description: 'Historical brand quality metrics' },
          { name: 'Material quality rating', value: Math.floor(score * 0.88), maxValue: 100, description: 'Construction and material analysis' },
          { name: 'Authenticity verification', value: Math.floor(score * 0.92), maxValue: 100, description: 'Authentication checks passed' },
          { name: 'Product age assessment', value: Math.floor(score * 0.78), maxValue: 100, description: 'Age vs. expected lifespan' },
          { name: 'Wear and tear analysis', value: Math.floor(score * 0.81), maxValue: 100, description: 'Visible damage assessment' },
        ]
      },
      {
        id: 'seller-trust',
        name: 'Seller Trustworthiness',
        score: Math.min(100, score + Math.random() * 10 - 5),
        weight: 20,
        icon: Shield,
        parameters: [
          { name: 'Seller rating history', value: Math.floor(score * 0.91), maxValue: 100, description: 'Historical seller performance' },
          { name: 'Return policy quality', value: Math.floor(score * 0.89), maxValue: 100, description: 'Buyer protection assessment' },
          { name: 'Response time average', value: Math.floor(score * 0.86), maxValue: 100, description: 'Communication responsiveness' },
          { name: 'Verified seller status', value: Math.floor(score * 0.94), maxValue: 100, description: 'Identity verification status' },
          { name: 'Transaction history', value: Math.floor(score * 0.87), maxValue: 100, description: 'Successful transaction count' },
          { name: 'Dispute resolution rate', value: Math.floor(score * 0.90), maxValue: 100, description: 'Successful dispute resolutions' },
        ]
      },
      {
        id: 'market-value',
        name: 'Market Value Analysis',
        score: Math.min(100, score + Math.random() * 10 - 5),
        weight: 20,
        icon: DollarSign,
        parameters: [
          { name: 'Price competitiveness', value: Math.floor(score * 0.83), maxValue: 100, description: 'vs. market average pricing' },
          { name: 'Value retention rate', value: Math.floor(score * 0.79), maxValue: 100, description: 'Expected resale value' },
          { name: 'Historical price trend', value: Math.floor(score * 0.84), maxValue: 100, description: 'Price movement analysis' },
          { name: 'Demand indicator', value: Math.floor(score * 0.88), maxValue: 100, description: 'Current market demand' },
          { name: 'Comparable listings score', value: Math.floor(score * 0.81), maxValue: 100, description: 'Similar item comparison' },
          { name: 'Deal quality rating', value: Math.floor(score * 0.86), maxValue: 100, description: 'Overall value assessment' },
        ]
      },
      {
        id: 'sustainability',
        name: 'Sustainability Impact',
        score: Math.min(100, score + Math.random() * 10 - 5),
        weight: 15,
        icon: Leaf,
        parameters: [
          { name: 'Carbon footprint score', value: Math.floor(score * 0.77), maxValue: 100, description: 'Environmental impact reduction' },
          { name: 'Circular economy rating', value: Math.floor(score * 0.82), maxValue: 100, description: 'Reuse and recyclability' },
          { name: 'Packaging sustainability', value: Math.floor(score * 0.80), maxValue: 100, description: 'Eco-friendly packaging use' },
          { name: 'Shipping efficiency', value: Math.floor(score * 0.85), maxValue: 100, description: 'Carbon-efficient delivery' },
          { name: 'Material sustainability', value: Math.floor(score * 0.78), maxValue: 100, description: 'Sustainable materials used' },
          { name: 'Longevity potential', value: Math.floor(score * 0.83), maxValue: 100, description: 'Expected product lifespan' },
        ]
      },
      {
        id: 'transaction-security',
        name: 'Transaction Security',
        score: Math.min(100, score + Math.random() * 10 - 5),
        weight: 10,
        icon: Lock,
        parameters: [
          { name: 'Payment security level', value: Math.floor(score * 0.95), maxValue: 100, description: 'Payment protection rating' },
          { name: 'Fraud detection score', value: Math.floor(score * 0.93), maxValue: 100, description: 'Anti-fraud measures' },
          { name: 'Buyer protection coverage', value: Math.floor(score * 0.91), maxValue: 100, description: 'Purchase protection level' },
          { name: 'Data privacy compliance', value: Math.floor(score * 0.94), maxValue: 100, description: 'Privacy policy rating' },
          { name: 'Secure checkout rating', value: Math.floor(score * 0.96), maxValue: 100, description: 'Checkout security level' },
          { name: 'Dispute handling quality', value: Math.floor(score * 0.89), maxValue: 100, description: 'Dispute resolution process' },
        ]
      },
      {
        id: 'user-experience',
        name: 'User Experience',
        score: Math.min(100, score + Math.random() * 10 - 5),
        weight: 5,
        icon: Package,
        parameters: [
          { name: 'Product description quality', value: Math.floor(score * 0.87), maxValue: 100, description: 'Information completeness' },
          { name: 'Image quality score', value: Math.floor(score * 0.90), maxValue: 100, description: 'Photo clarity and coverage' },
          { name: 'Shipping speed rating', value: Math.floor(score * 0.84), maxValue: 100, description: 'Delivery time assessment' },
          { name: 'Customer service quality', value: Math.floor(score * 0.88), maxValue: 100, description: 'Support responsiveness' },
          { name: 'Returns process ease', value: Math.floor(score * 0.85), maxValue: 100, description: 'Return simplicity score' },
          { name: 'Overall buyer satisfaction', value: Math.floor(score * 0.91), maxValue: 100, description: 'Historical satisfaction rate' },
        ]
      },
    ]
  }
}
