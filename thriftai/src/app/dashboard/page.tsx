'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

interface Product {
  id: string
  name: string
  category: string
  subcategory?: string
  brand: {
    name: string
  }
  overallScore: number
  fitScore: number
  qualityScore: number
  returnRate: number
  reviewCount: number
  grade: string
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)

        const category = selectedCategory === 'all' ? '' : `&category=${selectedCategory}`
        const res = await fetch(`/api/v1/products?limit=100${category}`)

        if (!res.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await res.json()

        if (data.success) {
          setProducts(data.data)
        } else {
          throw new Error(data.error || 'Failed to load products')
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedCategory])

  const portfolioScore = products.length > 0
    ? Math.round(products.reduce((sum, p) => sum + p.overallScore, 0) / products.length)
    : 0

  const avgReturnRate = products.length > 0
    ? Math.round(products.reduce((sum, p) => sum + p.returnRate, 0) / products.length)
    : 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50'
    if (score >= 60) return 'bg-amber-50'
    return 'bg-red-50'
  }

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'TOPS', label: 'Tops' },
    { value: 'BOTTOMS', label: 'Bottoms' },
    { value: 'DRESSES', label: 'Dresses' },
    { value: 'OUTERWEAR', label: 'Outerwear' },
    { value: 'ACTIVEWEAR', label: 'Activewear' },
  ]

  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Quality Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              Monitor product quality and identify opportunities
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Portfolio Score</div>
                <div className="p-2 bg-violet-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                </div>
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {portfolioScore}
              </div>
              <div className="text-sm text-green-600 font-medium">+5 from last month</div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Avg Return Rate</div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {avgReturnRate}%
              </div>
              <div className="text-sm text-green-600 font-medium">-3% from last month</div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Products Tracked</div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {products.length}
              </div>
              <div className="text-sm text-gray-500">6 categories</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          {loading ? (
            <div className="text-center py-24">
              <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="block bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl hover:border-violet-200 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
                          {product.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          product.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                          product.grade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                          product.grade.startsWith('C') ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {product.grade}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{product.brand.name}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                        <span>•</span>
                        <span>{product.reviewCount.toLocaleString()} reviews</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className={`text-4xl font-bold mb-1 ${getScoreColor(product.overallScore)}`}>
                          {product.overallScore}
                        </div>
                        <div className="text-xs text-gray-500">Overall</div>
                      </div>

                      <div className="hidden md:block w-px h-12 bg-gray-200" />

                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(product.fitScore)}`}>
                            {product.fitScore}
                          </div>
                          <div className="text-xs text-gray-500">Fit</div>
                        </div>

                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(product.qualityScore)}`}>
                            {product.qualityScore}
                          </div>
                          <div className="text-xs text-gray-500">Quality</div>
                        </div>

                        <div className="text-center">
                          <div className={`text-2xl font-bold ${product.returnRate > 15 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {product.returnRate}%
                          </div>
                          <div className="text-xs text-gray-500">Returns</div>
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
