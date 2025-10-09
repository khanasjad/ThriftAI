'use client'

import { useState, useEffect } from 'react'

interface CategoryScore {
  name: string
  key: string
  value: number
  weight: number
  color: string
  icon: string
}

export default function VeritasCalculatorPage() {
  const [categories, setCategories] = useState<CategoryScore[]>([
    { name: 'Product Quality', key: 'productQuality', value: 75, weight: 25, color: 'bg-blue-500', icon: '⭐' },
    { name: 'Seller Trust', key: 'sellerTrust', value: 75, weight: 20, color: 'bg-green-500', icon: '🤝' },
    { name: 'Market Value', key: 'marketValue', value: 75, weight: 15, color: 'bg-purple-500', icon: '💰' },
    { name: 'Sustainability', key: 'sustainability', value: 75, weight: 12, color: 'bg-emerald-500', icon: '🌱' },
    { name: 'Product Specification', key: 'productSpecification', value: 75, weight: 13, color: 'bg-indigo-500', icon: '📋' },
    { name: 'Security & Safety', key: 'securitySafety', value: 75, weight: 5, color: 'bg-red-500', icon: '🔒' },
    { name: 'User Experience', key: 'userExperience', value: 75, weight: 5, color: 'bg-yellow-500', icon: '😊' },
    { name: 'Company Performance', key: 'companyPerformance', value: 75, weight: 5, color: 'bg-pink-500', icon: '🏢' },
  ])

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Calculate score whenever categories change
  useEffect(() => {
    calculateScore()
  }, [categories])

  const calculateScore = async () => {
    setLoading(true)
    try {
      const payload: any = {}
      categories.forEach(cat => {
        payload[cat.key] = cat.value
      })

      const response = await fetch('/api/veritas/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.result)
      }
    } catch (error) {
      console.error('Calculation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCategory = (index: number, value: number) => {
    const updated = [...categories]
    updated[index].value = value
    setCategories(updated)
  }

  const resetAll = () => {
    const reset = categories.map(cat => ({ ...cat, value: 75 }))
    setCategories(reset)
  }

  const setPreset = (preset: 'excellent' | 'good' | 'fair' | 'poor') => {
    const presets = {
      excellent: [95, 90, 85, 92, 94, 88, 90, 92],
      good: [80, 75, 70, 75, 78, 72, 75, 77],
      fair: [65, 60, 55, 60, 62, 58, 60, 62],
      poor: [40, 35, 30, 35, 38, 32, 35, 37],
    }
    const values = presets[preset]
    const updated = categories.map((cat, i) => ({ ...cat, value: values[i] }))
    setCategories(updated)
  }

  const getGradeColor = (grade: string) => {
    const colors: any = {
      S: 'from-purple-500 to-pink-500',
      A: 'from-green-500 to-emerald-500',
      B: 'from-blue-500 to-cyan-500',
      C: 'from-yellow-500 to-orange-500',
      D: 'from-orange-500 to-red-500',
      F: 'from-red-500 to-red-700',
    }
    return colors[grade] || 'from-gray-400 to-gray-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Veritas Score™ Calculator
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Adjust the category scores to calculate your overall Veritas Score
          </p>

          {/* Preset Buttons */}
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => setPreset('excellent')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Excellent Product
            </button>
            <button
              onClick={() => setPreset('good')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Good Product
            </button>
            <button
              onClick={() => setPreset('fair')}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              Fair Product
            </button>
            <button
              onClick={() => setPreset('poor')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Poor Product
            </button>
            <button
              onClick={resetAll}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Reset All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Category Sliders */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Scores</h2>

              <div className="space-y-6">
                {categories.map((category, index) => (
                  <div key={category.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <label className="text-sm font-semibold text-gray-700">
                            {category.name}
                          </label>
                          <div className="text-xs text-gray-500">
                            Weight: {category.weight}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {category.value}
                        </div>
                        <div className="text-xs text-gray-500">
                          Weighted: {(category.value * category.weight / 100).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={category.value}
                        onChange={(e) => updateCategory(index, parseInt(e.target.value))}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right,
                            rgb(59 130 246) 0%,
                            rgb(59 130 246) ${category.value}%,
                            rgb(229 231 235) ${category.value}%,
                            rgb(229 231 235) 100%)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {result && (
              <>
                {/* Overall Score Card */}
                <div className={`bg-gradient-to-br ${getGradeColor(result.grade)} rounded-2xl shadow-xl p-8 text-white`}>
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-2">
                      {result.grade}
                    </div>
                    <div className="text-xl font-semibold mb-4">
                      {result.gradeLabel}
                    </div>
                    <div className="text-7xl font-bold mb-2">
                      {result.overallScore}
                    </div>
                    <div className="text-lg opacity-90 mb-4">
                      Overall Veritas Score
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
                      <div className="text-sm font-semibold">
                        {result.recommendation.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Breakdown Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Score Breakdown</h3>

                  <div className="space-y-3">
                    {result.breakdown.map((item: any) => (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{item.category}</span>
                          <span className="text-gray-600">{item.weightedScore.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <span>{item.score}/100</span>
                          <span>×</span>
                          <span>{item.percentage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formula Info */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">💡 How It Works</h3>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    The overall score is calculated using weighted averages. Each category contributes
                    a percentage of the final score based on its importance.
                  </p>
                  <div className="mt-3 text-xs font-mono text-blue-800 bg-white/50 rounded p-2">
                    Score = (PQ × 25%) + (ST × 20%) + (MV × 15%) + (SU × 12%) + (PS × 13%) + (SS × 5%) + (UE × 5%) + (CP × 5%)
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* API Info */}
        <div className="mt-12 bg-gray-900 text-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-4">🔌 API Usage</h2>
          <p className="text-gray-300 mb-6">
            Use the Veritas Calculator API in your applications:
          </p>

          <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <div className="text-green-400 mb-2">POST /api/veritas/calculator</div>
            <pre className="text-gray-300">{JSON.stringify({
              productQuality: 90,
              sellerTrust: 85,
              marketValue: 80,
              sustainability: 88,
              productSpecification: 92,
              securitySafety: 87,
              userExperience: 85,
              companyPerformance: 90
            }, null, 2)}</pre>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <a href="/api/veritas/calculator" target="_blank" className="text-blue-400 hover:underline">
              View full API documentation →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
