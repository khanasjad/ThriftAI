'use client'

import { useState } from 'react'
import ProductComparison from '@/components/ProductComparison'
import { Search } from 'lucide-react'

export default function MarketplaceComparePage() {
  const [query, setQuery] = useState('Nike shoes')
  const [searchQuery, setSearchQuery] = useState('Nike shoes')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(query)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Marketplace Price Comparison
          </h1>
          <p className="text-gray-400 text-lg">
            Compare prices across ThriftAI, Amazon, eBay, and more
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products to compare prices..."
              className="w-full px-6 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Quick Search Suggestions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-400">Try:</span>
            {['Nike shoes', 'Vintage jeans', 'iPhone 13', 'Designer sunglasses', 'Gaming laptop'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion)
                  setSearchQuery(suggestion)
                }}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Results */}
        <div className="max-w-7xl mx-auto">
          <ProductComparison
            query={searchQuery}
            sources={['thriftai', 'amazon', 'ebay']}
          />
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-2">🛍️ Multiple Sources</h3>
            <p className="text-gray-400 text-sm">
              Search across ThriftAI, Amazon, eBay, Nike, and Adidas simultaneously
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-2">💰 Best Deals</h3>
            <p className="text-gray-400 text-sm">
              Automatically find the lowest price including shipping costs
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-2">⚡ Real-time</h3>
            <p className="text-gray-400 text-sm">
              Live price comparison with caching for optimal performance
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}