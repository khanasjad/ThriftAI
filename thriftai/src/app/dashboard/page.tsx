'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Leaf, ShoppingBag, Search, Clock, Award, BarChart3 } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useSession } from 'next-auth/react'

export default function AnalyticsDashboard() {
  const { data: session } = useSession()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || '',
    userType: 'buyer' as const
  } : null

  // Mock data - replace with real API calls
  const stats = {
    totalSavings: 1247.50,
    totalPurchases: 23,
    carbonOffset: 45.2,
    searchesMade: 156,
    avgSavingsPerItem: 54.24,
    topCategories: [
      { name: 'Electronics', count: 8, savings: 420 },
      { name: 'Fashion', count: 6, savings: 315 },
      { name: 'Home & Garden', count: 5, savings: 280 },
      { name: 'Books', count: 4, savings: 232 }
    ],
    recentSearches: [
      { query: 'vintage designer bags', date: '2 hours ago', results: 45 },
      { query: 'laptop under $200', date: '1 day ago', results: 28 },
      { query: 'sustainable fashion', date: '3 days ago', results: 67 }
    ],
    savingsOverTime: [
      { date: 'Jan', amount: 120 },
      { date: 'Feb', amount: 245 },
      { date: 'Mar', amount: 310 },
      { date: 'Apr', amount: 290 },
      { date: 'May', amount: 380 },
      { date: 'Jun', amount: 425 }
    ]
  }

  return (
    <div className="App">
      <Navigation
        user={appUser}
        onShowLogin={() => {}}
        onShowSignup={() => {}}
        onLogout={() => {}}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Your Shopping Analytics</h1>
          <p className="text-[var(--text-secondary)]">Track your savings, sustainability impact, and shopping trends</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-8">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
              }`}
            >
              {range === 'all' ? 'All Time' : range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-500 mb-1">${stats.totalSavings.toFixed(2)}</div>
            <div className="text-sm text-[var(--text-secondary)]">Total Savings</div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="w-8 h-8 text-blue-500" />
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-500 mb-1">{stats.totalPurchases}</div>
            <div className="text-sm text-[var(--text-secondary)]">Items Purchased</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Leaf className="w-8 h-8 text-emerald-500" />
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-500 mb-1">{stats.carbonOffset.toFixed(1)} kg</div>
            <div className="text-sm text-[var(--text-secondary)]">Carbon Offset</div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Search className="w-8 h-8 text-purple-500" />
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-500 mb-1">{stats.searchesMade}</div>
            <div className="text-sm text-[var(--text-secondary)]">Searches Made</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Savings Over Time */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Savings Over Time</h3>
            <div className="h-64">
              <svg className="w-full h-full" preserveAspectRatio="none">
                {/* Grid */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={`${y}%`}
                    x2="100%"
                    y2={`${y}%`}
                    stroke="var(--border-primary)"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                ))}

                {/* Bars */}
                {stats.savingsOverTime.map((point, i) => {
                  const x = (i / stats.savingsOverTime.length) * 100
                  const width = 100 / stats.savingsOverTime.length * 0.8
                  const height = (point.amount / 500) * 100
                  return (
                    <rect
                      key={i}
                      x={`${x}%`}
                      y={`${100 - height}%`}
                      width={`${width}%`}
                      height={`${height}%`}
                      fill="var(--accent-primary)"
                      rx="4"
                    />
                  )
                })}
              </svg>
              <div className="flex justify-between mt-4 text-xs text-[var(--text-secondary)]">
                {stats.savingsOverTime.map((point) => (
                  <span key={point.date}>{point.date}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Top Categories</h3>
            <div className="space-y-4">
              {stats.topCategories.map((cat, idx) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{cat.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{cat.count} items</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-500">${cat.savings}</div>
                      <div className="text-xs text-[var(--text-secondary)]">saved</div>
                    </div>
                  </div>
                  <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                    <div
                      className="bg-[var(--accent-primary)] h-2 rounded-full"
                      style={{ width: `${(cat.savings / 420) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Searches */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recent Searches</h3>
            </div>
            <div className="space-y-3">
              {stats.recentSearches.map((search, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-[var(--text-primary)]">{search.query}</div>
                    <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3" />
                      {search.date}
                    </div>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">{search.results} results</div>
                </div>
              ))}
            </div>
          </div>

          {/* Savings Calculator */}
          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Savings Calculator</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
                <div className="text-sm text-[var(--text-secondary)] mb-1">Average Savings Per Item</div>
                <div className="text-2xl font-bold text-green-500">${stats.avgSavingsPerItem.toFixed(2)}</div>
              </div>
              <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
                <div className="text-sm text-[var(--text-secondary)] mb-1">If you buy 10 more items</div>
                <div className="text-2xl font-bold text-green-500">+${(stats.avgSavingsPerItem * 10).toFixed(2)}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">Potential additional savings</div>
              </div>
              <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
                <div className="text-sm text-[var(--text-secondary)] mb-1">Sustainability Impact</div>
                <div className="text-lg font-semibold text-emerald-500">{(stats.carbonOffset * 1.5).toFixed(1)} kg CO₂</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">With 10 more purchases</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
