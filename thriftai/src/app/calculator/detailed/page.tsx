'use client'

import { useState, useEffect } from 'react'

// All Veritas Parameters with scoring guides
const PARAMETERS = {
  'Product Quality (25%)': [
    { code: 'PQ_WARRANTY', name: 'Warranty Status', weight: 12, guide: '0=None, 50=Limited (6mo), 75=Standard (1yr), 100=Extended (2yr+)' },
    { code: 'PQ_AUTHENTICITY', name: 'Product Authenticity', weight: 15, guide: '0=Fake, 50=Unverified, 75=Likely Genuine, 100=Verified Genuine' },
    { code: 'PQ_CONDITION', name: 'Product Condition', weight: 10, guide: '0=Poor, 40=Fair, 60=Good, 80=Very Good, 90=Like New, 100=Brand New' },
    { code: 'PQ_VISUAL_DEFECTS', name: 'Visual Defects', weight: 8, guide: '0=Heavily Damaged, 50=Minor Scratches, 75=Minimal Wear, 100=Flawless' },
    { code: 'PQ_FUNCTIONAL', name: 'Functional Completeness', weight: 9, guide: '0=Not Working, 50=Partial Function, 75=Mostly Working, 100=Perfect' },
    { code: 'PQ_WEAR_TEAR', name: 'Wear and Tear', weight: 7, guide: '0=Heavily Worn, 50=Moderate Use, 75=Light Use, 100=No Wear' },
    { code: 'PQ_MISSING_PARTS', name: 'Missing Components', weight: 6, guide: '0=Many Missing, 50=Some Missing, 75=Almost Complete, 100=All Included' },
    { code: 'PQ_MATERIAL', name: 'Material Quality', weight: 5, guide: '0=Cheap/Broken, 50=Average, 75=Good Quality, 100=Premium Materials' },
    { code: 'PQ_PACKAGING', name: 'Packaging Quality', weight: 4, guide: '0=None, 50=Generic Box, 75=Good Packaging, 100=Original Sealed' },
    { code: 'PQ_ACCESSORIES', name: 'Included Accessories', weight: 4, guide: '0=None, 50=Some, 75=Most, 100=All Original Accessories' },
  ],
  'Seller Trust (20%)': [
    { code: 'ST_RATING', name: 'Seller Rating', weight: 30, guide: '0=1★, 20=2★, 40=3★, 60=4★, 80=4.5★, 100=5★' },
    { code: 'ST_EXPERIENCE', name: 'Seller Experience', weight: 25, guide: '0=New (0-10), 40=Some (50), 70=Experienced (500), 100=Expert (5000+)' },
    { code: 'ST_TOP_RATED', name: 'Top Rated Status', weight: 20, guide: '0=No, 50=Rising, 75=Power Seller, 100=Top Rated' },
    { code: 'ST_RESPONSE_TIME', name: 'Response Time', weight: 10, guide: '0=>24hrs, 50=12hrs, 75=6hrs, 90=1hr, 100=<1hr' },
    { code: 'ST_RETURN_POLICY', name: 'Return Policy', weight: 15, guide: '0=No Returns, 50=7 Days, 75=30 Days, 100=60+ Days Free Returns' },
  ],
  'Market Value (15%)': [
    { code: 'MV_PRICE_MARKET', name: 'Price vs Market', weight: 25, guide: '0=Much Above, 50=At Market, 75=Below Market, 100=Great Deal' },
    { code: 'MV_DISCOUNT', name: 'Discount from MSRP', weight: 20, guide: '0=Above MSRP, 25=0-10% off, 50=20% off, 75=40% off, 100=60%+ off' },
    { code: 'MV_VALUE', name: 'Value for Money', weight: 25, guide: '0=Terrible, 50=Fair Value, 75=Good Value, 100=Exceptional Value' },
    { code: 'MV_FAIRNESS', name: 'Price Fairness', weight: 15, guide: '0=Unfair, 50=Acceptable, 75=Fair, 100=Very Fair' },
    { code: 'MV_COMPETITIVE', name: 'Competitive Position', weight: 15, guide: '0=Worst Price, 50=Average, 75=Good Price, 100=Best Price' },
  ],
  'Sustainability (12%)': [
    { code: 'SUS_REPAIRABILITY', name: 'Repairability Score', weight: 30, guide: '0=1/10 iFixit, 30=3/10, 50=5/10, 70=7/10, 100=10/10' },
    { code: 'SUS_ENERGY_STAR', name: 'Energy Efficiency', weight: 20, guide: '0=F Rating, 40=C Rating, 60=B Rating, 80=A Rating, 100=A+++' },
    { code: 'SUS_CARBON', name: 'Carbon Footprint', weight: 15, guide: '0=Very High, 50=Average, 75=Low, 100=Carbon Neutral' },
    { code: 'SUS_CIRCULAR', name: 'Circular Economy', weight: 15, guide: '0=Not Recyclable, 50=Partially, 75=Mostly, 100=Fully Circular' },
    { code: 'SUS_EWASTE', name: 'E-Waste Reduction', weight: 10, guide: '0=No Effort, 50=Some Programs, 75=Good Programs, 100=Zero Waste' },
    { code: 'SUS_PARTS_AVAILABLE', name: 'Parts Availability', weight: 10, guide: '0=None, 50=Limited, 75=Good Availability, 100=Readily Available' },
  ],
  'Product Specification (13%)': [
    { code: 'PS_COMPLETENESS', name: 'Spec Completeness', weight: 20, guide: '0=Missing Most, 50=Basic Info, 75=Good Detail, 100=Complete Specs' },
    { code: 'PS_ACCURACY', name: 'Spec Accuracy', weight: 20, guide: '0=Wrong Info, 50=Mostly Correct, 75=Accurate, 100=Verified Accurate' },
    { code: 'PS_TECH_DETAIL', name: 'Technical Detail', weight: 15, guide: '0=None, 50=Basic, 75=Detailed, 100=Comprehensive Technical Info' },
    { code: 'PS_FEATURE_MATCH', name: 'Feature Match', weight: 15, guide: '0=Mismatch, 50=Partial Match, 75=Good Match, 100=Perfect Match' },
    { code: 'PS_PROCESSOR', name: 'Processor Info', weight: 10, guide: '0=Unknown, 50=Basic Info, 75=Model/Speed, 100=Full Specs' },
    { code: 'PS_RAM', name: 'Memory Info', weight: 10, guide: '0=Unknown, 50=Size Only, 75=Size/Type, 100=Full Details' },
    { code: 'PS_STORAGE', name: 'Storage Info', weight: 10, guide: '0=Unknown, 50=Size Only, 75=Type/Speed, 100=Full Specs' },
  ],
  'Security & Safety (5%)': [
    { code: 'SEC_PAYMENT', name: 'Payment Security', weight: 40, guide: '0=Insecure, 50=Basic, 75=Secure (SSL), 100=Bank-Level Security' },
    { code: 'SEC_PROTECTION', name: 'Buyer Protection', weight: 30, guide: '0=None, 50=Limited, 75=Good Protection, 100=Full Guarantee' },
    { code: 'SEC_PRIVACY', name: 'Privacy Protection', weight: 15, guide: '0=No Privacy, 50=Basic, 75=Good Policy, 100=GDPR Compliant' },
    { code: 'SEC_FRAUD', name: 'Fraud Prevention', weight: 15, guide: '0=None, 50=Basic Checks, 75=Good Systems, 100=Advanced AI' },
  ],
  'User Experience (5%)': [
    { code: 'UX_PAGE_QUALITY', name: 'Page Quality', weight: 40, guide: '0=Poor Layout, 50=Basic, 75=Good Design, 100=Professional' },
    { code: 'UX_IMAGE_QUALITY', name: 'Image Quality', weight: 30, guide: '0=No Images, 50=1-2 Images, 75=Multiple Good, 100=HD Gallery' },
    { code: 'UX_DESCRIPTION', name: 'Description Quality', weight: 30, guide: '0=Missing, 50=Brief, 75=Good Detail, 100=Comprehensive' },
  ],
  'Company Performance (5%)': [
    { code: 'CP_BRAND_REP', name: 'Brand Reputation', weight: 35, guide: '0=Poor Reputation, 50=Average, 75=Well-Known, 100=Premium Brand' },
    { code: 'CP_STOCK_PERF', name: 'Stock Performance', weight: 25, guide: '0=Declining, 40=Flat, 60=Growing, 80=Strong, 100=Excellent' },
    { code: 'CP_MARKET_PERF', name: 'Market Performance', weight: 20, guide: '0=Losing Share, 50=Stable, 75=Growing, 100=Market Leader' },
    { code: 'CP_NEWS_SENTIMENT', name: 'News Sentiment', weight: 20, guide: '0=Very Negative, 50=Neutral, 75=Positive, 100=Very Positive' },
  ],
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  'Product Quality (25%)': 0.25,
  'Seller Trust (20%)': 0.20,
  'Market Value (15%)': 0.15,
  'Sustainability (12%)': 0.12,
  'Product Specification (13%)': 0.13,
  'Security & Safety (5%)': 0.05,
  'User Experience (5%)': 0.05,
  'Company Performance (5%)': 0.05,
}

export default function DetailedCalculatorPage() {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({})
  const [overallScore, setOverallScore] = useState(0)
  const [grade, setGrade] = useState('C')

  // Initialize all parameters with default score of 75
  useEffect(() => {
    const initialScores: Record<string, number> = {}
    Object.values(PARAMETERS).forEach(params => {
      params.forEach(param => {
        initialScores[param.code] = 75
      })
    })
    setScores(initialScores)
  }, [])

  // Calculate scores whenever parameter values change
  useEffect(() => {
    calculateScores()
  }, [scores])

  const calculateScores = () => {
    const catScores: Record<string, number> = {}

    // Calculate each category score
    Object.entries(PARAMETERS).forEach(([category, params]) => {
      let categoryTotal = 0
      let weightSum = 0

      params.forEach(param => {
        const score = scores[param.code] || 0
        categoryTotal += score * param.weight
        weightSum += param.weight
      })

      catScores[category] = weightSum > 0 ? categoryTotal / weightSum : 0
    })

    setCategoryScores(catScores)

    // Calculate overall score
    let overall = 0
    Object.entries(CATEGORY_WEIGHTS).forEach(([category, weight]) => {
      overall += (catScores[category] || 0) * weight
    })

    setOverallScore(Math.round(overall * 100) / 100)
    setGrade(getGrade(overall))
  }

  const getGrade = (score: number) => {
    if (score >= 95) return 'S'
    if (score >= 85) return 'A'
    if (score >= 75) return 'B'
    if (score >= 65) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  const updateScore = (code: string, value: number) => {
    setScores(prev => ({ ...prev, [code]: Math.min(100, Math.max(0, value)) }))
  }

  const setAllScores = (value: number) => {
    const updated: Record<string, number> = {}
    Object.keys(scores).forEach(code => {
      updated[code] = value
    })
    setScores(updated)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Veritas Score Calculator
          </h1>
          <p className="text-gray-600 mb-4">
            Enter scores (0-100) for each parameter using the guides below
          </p>

          {/* Quick Presets */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setAllScores(100)} className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700">
              All 100
            </button>
            <button onClick={() => setAllScores(90)} className="px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600">
              All 90
            </button>
            <button onClick={() => setAllScores(75)} className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600">
              All 75
            </button>
            <button onClick={() => setAllScores(50)} className="px-4 py-2 bg-yellow-500 text-white rounded font-medium hover:bg-yellow-600">
              All 50
            </button>
            <button onClick={() => setAllScores(25)} className="px-4 py-2 bg-orange-500 text-white rounded font-medium hover:bg-orange-600">
              All 25
            </button>
            <button onClick={() => setAllScores(0)} className="px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600">
              All 0
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Categories */}
              {Object.entries(PARAMETERS).map(([categoryName, params]) => (
                <div key={categoryName} className="mb-8 last:mb-0">
                  {/* Category Title */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-blue-200 bg-blue-50 px-4 py-3 rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-900">{categoryName}</h2>
                    <div className="text-3xl font-bold text-blue-600">
                      {(categoryScores[categoryName] || 0).toFixed(1)}
                    </div>
                  </div>

                  {/* Parameters Table */}
                  <div className="space-y-4 px-2">
                    {params.map((param) => {
                      const value = scores[param.code] || 0
                      return (
                        <div key={param.code} className="border-b border-gray-200 pb-4 last:border-0">
                          <div className="flex items-start gap-4">
                            {/* Left: Parameter Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-black text-lg mb-1">{param.name}</div>
                              <div className="text-sm text-black bg-blue-50 px-3 py-2 rounded border border-blue-200 font-mono">
                                📊 {param.guide}
                              </div>
                              <div className="text-xs text-black mt-1">Parameter Weight: {param.weight}%</div>
                            </div>

                            {/* Right: Input Controls */}
                            <div className="flex flex-col items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={value}
                                onChange={(e) => updateScore(param.code, parseInt(e.target.value) || 0)}
                                className="w-24 px-3 py-3 text-center text-2xl font-bold text-black border-2 border-blue-400 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none bg-blue-50"
                                tabIndex={0}
                              />
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={value}
                                onChange={(e) => updateScore(param.code, parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                style={{ width: '200px' }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Result */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Score</h3>

              {/* Grade Badge */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-5xl font-black text-white mb-3 ${
                  grade === 'S' ? 'bg-purple-600' :
                  grade === 'A' ? 'bg-green-600' :
                  grade === 'B' ? 'bg-blue-600' :
                  grade === 'C' ? 'bg-yellow-600' :
                  grade === 'D' ? 'bg-orange-600' : 'bg-red-600'
                }`}>
                  {grade}
                </div>
                <div className="text-4xl font-black text-gray-900">{overallScore}</div>
                <div className="text-sm text-gray-600 font-medium">out of 100</div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Category Scores:</h4>
                {Object.entries(categoryScores).map(([category, score]) => (
                  <div key={category} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 font-medium">{category.split('(')[0].trim()}</span>
                    <span className="font-bold text-gray-900">{score.toFixed(1)}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Parameters:</span>
                    <span className="font-bold">{Object.values(PARAMETERS).flat().length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories:</span>
                    <span className="font-bold">{Object.keys(PARAMETERS).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Parameter:</span>
                    <span className="font-bold">
                      {Object.values(scores).length > 0
                        ? (Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length).toFixed(1)
                        : '0.0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
