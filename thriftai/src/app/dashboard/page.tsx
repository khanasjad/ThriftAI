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
  rated: boolean
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

  const rated = products.filter((p) => p.rated)
  const portfolioScore = rated.length > 0
    ? Math.round(rated.reduce((sum, p) => sum + p.overallScore, 0) / rated.length)
    : null
  const categoryCount = new Set(products.map((p) => p.category)).size

  const avgReturnRate = products.length > 0
    ? Math.round(products.reduce((sum, p) => sum + p.returnRate, 0) / products.length)
    : 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-warning-fg'
    return 'text-critical-fg'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50'
    if (score >= 60) return 'bg-warning-soft'
    return 'bg-critical-soft'
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
      <div className="bg-surface-2 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-5xl font-bold mb-3 text-fg tracking-tight">
              Quality Dashboard
            </h1>
            <p className="text-xl text-fg-muted">
              Monitor product quality and identify opportunities
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-fg-muted">Portfolio Score</div>
                <div className="p-2 bg-accent-soft rounded-lg">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
              </div>
              <div className="text-5xl font-bold text-fg tabular mb-2">
                {portfolioScore ?? '—'}
              </div>
              <div className="text-sm text-fg-subtle">{rated.length} of {products.length} products rated</div>
            </div>

            <div className="bg-surface rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-fg-muted">Avg Return Rate</div>
                <div className="p-2 bg-good-soft rounded-lg">
                  <TrendingDown className="w-5 h-5 text-good-fg" />
                </div>
              </div>
              <div className="text-5xl font-bold text-fg mb-2">
                {avgReturnRate}%
              </div>
              <div className="text-sm text-fg-subtle">Returns per review, all tracked products</div>
            </div>

            <div className="bg-surface rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-fg-muted">Products Tracked</div>
                <div className="p-2 bg-accent-soft rounded-lg">
                  <Filter className="w-5 h-5 text-accent" />
                </div>
              </div>
              <div className="text-5xl font-bold text-fg mb-2">
                {products.length}
              </div>
              <div className="text-sm text-fg-subtle">{categoryCount} {categoryCount === 1 ? 'category' : 'categories'}</div>
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
                    ? 'bg-accent text-accent-fg shadow-sm'
                    : 'bg-surface text-fg-muted hover:bg-surface-2 border border-border'
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
              <div className="w-12 h-12 border-4 border-accent border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-fg-subtle">Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-critical-fg font-medium">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-fg-subtle">No products found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="block bg-surface rounded-2xl p-6 border border-border hover:shadow-xl hover:border-accent transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-fg group-hover:text-accent transition-colors">
                          {product.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          !product.rated ? 'bg-surface-2 text-fg-muted' :
                          product.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                          product.grade.startsWith('B') ? 'bg-accent-soft text-accent' :
                          product.grade.startsWith('C') ? 'bg-warning-soft text-warning-fg' :
                          'bg-critical-soft text-critical-fg'
                        }`}>
                          {product.rated ? product.grade : 'Not rated yet'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-fg-subtle">
                        <span>{product.brand.name}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                        <span>•</span>
                        <span>{product.reviewCount.toLocaleString()} reviews</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className={`text-4xl font-bold mb-1 ${product.rated ? getScoreColor(product.overallScore) : 'text-fg-subtle'}`}>
                          {product.rated ? product.overallScore : '—'}
                        </div>
                        <div className="text-xs text-fg-subtle">Overall</div>
                      </div>

                      <div className="hidden md:block w-px h-12 bg-surface-3" />

                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${product.rated ? getScoreColor(product.fitScore) : 'text-fg-subtle'}`}>
                            {product.rated ? product.fitScore : '—'}
                          </div>
                          <div className="text-xs text-fg-subtle">Fit</div>
                        </div>

                        <div className="text-center">
                          <div className={`text-2xl font-bold ${product.rated ? getScoreColor(product.qualityScore) : 'text-fg-subtle'}`}>
                            {product.rated ? product.qualityScore : '—'}
                          </div>
                          <div className="text-xs text-fg-subtle">Quality</div>
                        </div>

                        <div className="text-center">
                          <div className={`text-2xl font-bold ${product.returnRate > 15 ? 'text-critical-fg' : 'text-emerald-600'}`}>
                            {product.returnRate}%
                          </div>
                          <div className="text-xs text-fg-subtle">Returns</div>
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-fg-subtle group-hover:text-accent group-hover:translate-x-1 transition-all" />
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
