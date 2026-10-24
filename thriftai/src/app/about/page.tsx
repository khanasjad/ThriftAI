'use client'

import { useState } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { Award, TrendingUp, Shield, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

export default function AboutPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

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
    }
  ]

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-violet-50 via-white to-indigo-50 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-16 border-b border-violet-500">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4">
                About Veritas AI
              </h1>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                Revolutionizing online shopping with AI-powered trust and transparency
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
                <Award className="mx-auto mb-4 w-12 h-12" />
                <h3 className="text-xl font-bold mb-2">Veritas Score</h3>
                <p className="text-sm opacity-90">
                  Our proprietary trust algorithm analyzing 96 unique parameters
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
                <TrendingUp className="mx-auto mb-4 w-12 h-12" />
                <h3 className="text-xl font-bold mb-2">Smart Shopping</h3>
                <p className="text-sm opacity-90">
                  AI-powered recommendations that save you time and money
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
                <Shield className="mx-auto mb-4 w-12 h-12" />
                <h3 className="text-xl font-bold mb-2">Buyer Protection</h3>
                <p className="text-sm opacity-90">
                  Shop with confidence knowing every transaction is verified
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              What We Improve
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-600 mb-8 text-center">
                Online shopping should be simple, safe, and sustainable. At Veritas AI, we use advanced AI to solve the biggest challenges in e-commerce:
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Trust & Transparency', desc: 'No more wondering if a deal is too good to be true. Our Veritas Score gives you instant trust insights.' },
                  { title: 'Information Overload', desc: 'We analyze thousands of data points so you can make decisions in seconds, not hours.' },
                  { title: 'Hidden Costs', desc: 'Complete price transparency including shipping, taxes, and total cost of ownership.' },
                  { title: 'Seller Reliability', desc: 'Deep verification of seller history, ratings, and trustworthiness across platforms.' },
                  { title: 'Sustainability', desc: 'Making eco-conscious shopping easy with environmental impact scores for every product.' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-violet-600 font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Veritas Score Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-gray-900 mb-3 text-center">
              The Veritas Score
            </h2>
            <p className="text-lg text-gray-600 mb-12 text-center max-w-4xl mx-auto">
              A revolutionary trust metric that analyzes <span className="text-violet-600 font-bold">96 unique parameters</span> across
              6 critical categories to give you a complete picture of every purchase.
            </p>

            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 rounded-2xl p-8 mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Helps You</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Make Faster Decisions', desc: 'One score instead of reading hundreds of reviews. See instantly if a product and seller are trustworthy.' },
                  { title: 'Avoid Scams & Fakes', desc: 'Our AI detects red flags in seller behavior, pricing anomalies, and authenticity concerns.' },
                  { title: 'Save Money', desc: 'Find the best deals with confidence. Compare true value, not just price.' },
                  { title: 'Shop Sustainably', desc: 'See the environmental impact of every purchase and make eco-friendly choices easily.' },
                  { title: 'Reduce Returns', desc: 'Accurate product analysis means you get what you expect, reducing buyer\'s remorse.' },
                  { title: 'Peace of Mind', desc: 'Every transaction backed by comprehensive analysis and buyer protection insights.' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <h4 className="text-violet-600 font-semibold text-lg mb-2">{item.title}</h4>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 96 Parameters Breakdown */}
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              96 Parameters Explained
            </h3>

            <div className="space-y-4">
              {parameterCategories.map((category) => {
                const Icon = category.icon
                const isExpanded = expandedCategory === category.id

                return (
                  <div
                    key={category.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 text-left">
                        <Icon className="w-8 h-8 text-violet-600" />
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-1">
                            {category.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-violet-600 w-6 h-6" />
                      ) : (
                        <ChevronDown className="text-violet-600 w-6 h-6" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                          {category.parameters.map((param, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700"
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

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Experience Smarter Shopping Today
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of smart shoppers who trust Veritas AI for safe, sustainable, and savvy online shopping.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-white text-violet-600 rounded-full text-lg font-semibold hover:shadow-xl hover:scale-105 transition-all"
              >
                View Dashboard
              </Link>
              <Link
                href="/pilot"
                className="px-8 py-4 bg-violet-500 text-white rounded-full text-lg font-semibold hover:bg-violet-400 transition-all"
              >
                Start Pilot Program
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
