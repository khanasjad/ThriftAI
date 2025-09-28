'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function Home() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleChatSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/buyers/chat-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🛍️ ThriftAI
          </h1>
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <span className="text-gray-600">Loading...</span>
            ) : session ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  Welcome, {session.user?.firstName || session.user?.name}!
                </span>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Smart Secondhand Shopping
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Discover amazing secondhand finds with AI-powered search and recommendations
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for? (e.g., vintage leather jacket, designer handbag)"
                className="flex-1 px-6 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleChatSearch()}
              />
              <button
                onClick={handleChatSearch}
                disabled={loading}
                className="px-8 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : '🔍 Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold mb-4">Search Results</h3>

            {/* AI Response */}
            {searchResults.aiResponse && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">🤖 AI Assistant</h4>
                <p className="text-blue-800">{searchResults.aiResponse}</p>
              </div>
            )}

            {/* Products */}
            {searchResults.products && searchResults.products.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-4">
                  Found {searchResults.totalFound} items:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.products.map((product: any) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h5 className="font-semibold">{product.name}</h5>
                      <p className="text-gray-600">{product.brand}</p>
                      <p className="text-lg font-bold text-green-600">${product.price}</p>
                      {product.originalPrice > 0 && (
                        <p className="text-sm text-gray-500">
                          Originally ${product.originalPrice}
                        </p>
                      )}
                      <p className="text-sm text-blue-600">{product.condition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {searchResults.recommendations && searchResults.recommendations.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-lg mb-4">💡 Recommended for you:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {searchResults.recommendations.map((rec: any) => (
                    <div key={rec.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h5 className="font-semibold">{rec.name}</h5>
                      <p className="text-green-600 font-bold">${rec.price}</p>
                      <p className="text-sm text-orange-600">Save {rec.savings}</p>
                      <p className="text-sm text-gray-600 mt-2">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Migration Success Message */}
        <div className="bg-green-100 border border-green-400 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-green-800 mb-2">
            ✅ Migration Complete!
          </h3>
          <p className="text-green-700">
            Successfully migrated from Java Spring Boot to Next.js 14 with:
          </p>
          <ul className="text-sm text-green-600 mt-2 space-y-1">
            <li>✓ PostgreSQL database with Prisma ORM</li>
            <li>✓ NextAuth.js authentication</li>
            <li>✓ AI-powered search (OpenAI + Claude)</li>
            <li>✓ Complete API endpoints</li>
            <li>✓ Business logic services</li>
            <li>✓ Database-driven configuration (no hardcoded values)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}