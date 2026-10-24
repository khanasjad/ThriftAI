'use client'

import { useState } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'

export default function PilotSignup() {
  const [formData, setFormData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    productCount: '',
    reviewCount: ''
  })

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/pilot-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Failed to submit application. Please try again.')
      }
    } catch (err) {
      console.error('Submission error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (submitted) {
    return (
      <AppLayout>
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="max-w-2xl text-center px-6">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-5xl font-semibold mb-4">
              Application submitted
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              We'll review your application and get back to you within 1-2 business days.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-lg font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              Return home
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="bg-white min-h-screen">
        {/* Header */}
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-semibold mb-4">
            Start your pilot
          </h1>
          <p className="text-xl text-gray-600">
            8-week program. $10,000+ value. No credit card required.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-[680px] mx-auto px-6 pb-24">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-[14px]">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[17px] font-semibold mb-2">
                Company name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
                placeholder="Your Brand"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[17px] font-semibold mb-2">
                  First name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-[17px] font-semibold mb-2">
                  Last name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[17px] font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
                placeholder="name@company.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[17px] font-semibold mb-2">
                  Products
                </label>
                <select
                  name="productCount"
                  value={formData.productCount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
                >
                  <option value="">Select range</option>
                  <option value="1-50">1-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>

              <div>
                <label className="block text-[17px] font-semibold mb-2">
                  Reviews
                </label>
                <select
                  name="reviewCount"
                  value={formData.reviewCount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
                >
                  <option value="">Select range</option>
                  <option value="<200">Less than 200</option>
                  <option value="200-500">200-500</option>
                  <option value="500-2000">500-2,000</option>
                  <option value="2000+">2,000+</option>
                </select>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-lg font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit application'}
              </button>
            </div>

            <p className="text-xs text-gray-600 text-center">
              By submitting, you agree to our{' '}
              <Link href="/terms-of-service" className="text-violet-600 hover:underline">
                Terms
              </Link>
              {' '}and{' '}
              <Link href="/privacy-policy" className="text-violet-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </div>

        {/* What's Included */}
        <div className="bg-[#fbfbfd] py-20">
          <div className="max-w-[980px] mx-auto px-6">
            <h2 className="text-[40px] font-semibold tracking-[-0.003em] mb-12 text-center">
              What's included
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                'Complete product quality scoring',
                '27-factor analysis across 5 pillars',
                'Prioritized action items',
                'Return rate reduction insights',
                'ROI projections',
                'API access during pilot',
                'Dedicated support',
                'Comprehensive final report'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="text-[17px] text-green-600">✓</div>
                  <div className="text-[17px] text-black/80">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
