'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function Home() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState<'chatgpt' | 'claude'>('claude')
  const [budget, setBudget] = useState<string>('')

  const handleSearch = async (type: 'chatgpt' | 'claude') => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setSearchType(type)

    try {
      const endpoint = type === 'claude' ? '/api/buyers/claude-search' : '/api/buyers/chat-search'
      const body = type === 'claude'
        ? { query: searchQuery, budget: budget ? parseFloat(budget) : undefined }
        : { query: searchQuery }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Search failed')
      }

      setSearchResults(data)
    } catch (error: any) {
      console.error('Search error:', error)
      setSearchResults({
        error: true,
        message: error.message || 'Search failed',
        query: searchQuery
      })
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
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {/* Search Input */}
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you looking for? (e.g., vintage leather jacket, designer handbag)"
                  className="flex-1 px-6 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch('claude')}
                />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Budget ($)"
                  className="w-32 px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* AI Search Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleSearch('claude')}
                  disabled={loading}
                  className="px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && searchType === 'claude' ? (
                    <>⏳ Searching...</>
                  ) : (
                    <>🤖 Claude AI Search</>
                  )}
                </button>
                <button
                  onClick={() => handleSearch('chatgpt')}
                  disabled={loading}
                  className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && searchType === 'chatgpt' ? (
                    <>⏳ Searching...</>
                  ) : (
                    <>💬 ChatGPT Search</>
                  )}
                </button>
              </div>

              {/* Search Type Indicator */}
              <div className="text-center text-sm text-gray-600">
                {searchType === 'claude' && !loading && (
                  <p>🌱 Claude AI specializes in sustainable shopping advice</p>
                )}
                {searchType === 'chatgpt' && !loading && (
                  <p>💡 ChatGPT provides intelligent product recommendations</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            {searchResults.error ? (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4 text-red-600">⚠️ Search Error</h3>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                  <p className="text-red-800 mb-2">{searchResults.message}</p>
                  {searchResults.message.includes('API key') && (
                    <div className="text-sm text-red-600">
                      <p>To enable Claude AI:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Get an API key from <a href="https://console.anthropic.com/" target="_blank" className="underline">console.anthropic.com</a></li>
                        <li>Add it to your .env.local file as ANTHROPIC_API_KEY</li>
                        <li>Restart the development server</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">Search Results</h3>
                  <div className="flex gap-2">
                    {searchType === 'claude' && <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">🤖 Claude AI</span>}
                    {searchType === 'chatgpt' && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">💬 ChatGPT</span>}
                  </div>
                </div>

                {/* AI Response */}
                {searchResults.aiResponse && (
                  <div className={`p-4 rounded-lg mb-6 ${searchType === 'claude' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                    <h4 className={`font-semibold mb-2 ${searchType === 'claude' ? 'text-purple-900' : 'text-blue-900'}`}>
                      {searchType === 'claude' ? '🤖 Claude AI Advisor' : '💬 ChatGPT Assistant'}
                    </h4>
                    <div className={`${searchType === 'claude' ? 'text-purple-800' : 'text-blue-800'} whitespace-pre-wrap`}>
                      {searchResults.aiResponse}
                    </div>
                  </div>
                )}

                {/* Sustainability Insights for Claude */}
                {searchResults.sustainabilityInsights && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-green-900 mb-3">🌱 Sustainability Impact</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">${searchResults.sustainabilityInsights.totalSavings}</div>
                        <div className="text-green-600">Total Savings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">{searchResults.sustainabilityInsights.estimatedCO2Saved}</div>
                        <div className="text-green-600">CO2 Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">{searchResults.sustainabilityInsights.waterSaved}</div>
                        <div className="text-green-600">Water Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">{searchResults.sustainabilityInsights.textileWasteReduced}</div>
                        <div className="text-green-600">Waste Reduced</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
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