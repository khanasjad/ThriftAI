'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TrendingUp, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

interface ComparisonProduct {
  source: string
  id: string
  title: string
  brand?: string
  price: number
  totalCost: number
  imageUrl?: string
  productUrl: string
  affiliateUrl?: string
  condition?: string
  rating?: number
  shippingCost?: number
}

interface ComparisonInsights {
  totalFound: number
  averagePrice: number
  priceRange: { min: number; max: number }
  sourceBreakdown: Record<string, number>
}

interface ComparisonProps {
  query: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sources?: string[]
}

export default function ProductComparison({
  query,
  category,
  minPrice,
  maxPrice,
  sources
}: ComparisonProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ComparisonProduct[]>([])
  const [bestDeal, setBestDeal] = useState<ComparisonProduct | null>(null)
  const [insights, setInsights] = useState<ComparisonInsights | null>(null)

  useEffect(() => {
    if (query) {
      fetchComparison()
    }
  }, [query, category, minPrice, maxPrice])

  const fetchComparison = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/marketplace/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          category,
          minPrice,
          maxPrice,
          sources: sources || ['thriftai', 'amazon', 'ebay']
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch comparison')
      }

      const data = await response.json()
      setResults(data.results || [])
      setBestDeal(data.bestDeal)
      setInsights(data.insights)
    } catch (err) {
      console.error('Comparison failed:', err)
      setError('Failed to load price comparison. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-400">Comparing prices across marketplaces...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-400">Error Loading Comparison</h3>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No products found for comparison.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Insights Summary */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Found</p>
            <p className="text-2xl font-bold text-white">{insights.totalFound}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">Average Price</p>
            <p className="text-2xl font-bold text-white">${insights.averagePrice.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">Lowest Price</p>
            <p className="text-2xl font-bold text-green-500">${insights.priceRange.min.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">Highest Price</p>
            <p className="text-2xl font-bold text-red-500">${insights.priceRange.max.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Best Deal Highlight */}
      {bestDeal && (
        <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-gray-800">
                {bestDeal.imageUrl && (
                  <Image
                    src={bestDeal.imageUrl}
                    alt={bestDeal.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span className="text-green-500 font-bold text-lg">Best Deal</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 line-clamp-2">{bestDeal.title}</h3>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl font-bold text-green-500">
                  ${bestDeal.totalCost.toFixed(2)}
                </span>
                <span className="text-gray-400">from {bestDeal.source}</span>
                {bestDeal.shippingCost && bestDeal.shippingCost > 0 && (
                  <span className="text-sm text-gray-400">
                    (+ ${bestDeal.shippingCost.toFixed(2)} shipping)
                  </span>
                )}
              </div>
              {bestDeal.condition && (
                <span className="inline-block px-3 py-1 bg-gray-700 rounded-full text-sm mr-2">
                  {bestDeal.condition}
                </span>
              )}
              {bestDeal.brand && (
                <span className="inline-block px-3 py-1 bg-blue-900/30 rounded-full text-sm">
                  {bestDeal.brand}
                </span>
              )}
              <a
                href={bestDeal.affiliateUrl || bestDeal.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
              >
                View Deal <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Source</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Product</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Price</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Shipping</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Total</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Condition</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((product, idx) => (
                <tr
                  key={`${product.source}-${product.id}`}
                  className={`border-t border-gray-800 hover:bg-gray-800/50 transition-colors ${
                    product === bestDeal ? 'bg-green-900/10' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold capitalize text-white">{product.source}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <div className="w-12 h-12 relative rounded overflow-hidden bg-gray-800 flex-shrink-0">
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm text-white">{product.title}</p>
                        {product.brand && (
                          <p className="text-xs text-gray-400 mt-1">{product.brand}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-white">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400">
                    {product.shippingCost && product.shippingCost > 0
                      ? `$${product.shippingCost.toFixed(2)}`
                      : 'Free'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-bold text-white">
                      ${product.totalCost.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                      {product.condition || 'New'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a
                      href={product.affiliateUrl || product.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}