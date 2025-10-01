'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ThumbsUp, ThumbsDown, TrendingUp, Loader2, ChevronDown, Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ReviewSummary {
  pros: string[]
  cons: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  aiScore: number // 0-100
  confidence: number // 0-1
  reviewCount: number
  avgRating: number
}

interface AIReviewBadgeProps {
  productId: string
  className?: string
  onExpand?: () => void
}

export function AIReviewBadge({ productId, className, onExpand }: AIReviewBadgeProps) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = async () => {
    if (summary) return // Already loaded

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/swipe/summary/${productId}`)

      if (!response.ok) {
        throw new Error('Failed to load AI summary')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      console.error('Error fetching AI summary:', err)
      setError(err instanceof Error ? err.message : 'Failed to load summary')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExpand = () => {
    if (!isExpanded) {
      fetchSummary()
    }
    setIsExpanded(!isExpanded)
    onExpand?.()
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'from-green-500 to-emerald-500'
      case 'negative':
        return 'from-red-500 to-rose-500'
      default:
        return 'from-gray-500 to-slate-500'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊'
      case 'negative':
        return '😕'
      default:
        return '😐'
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Collapsed Badge */}
      <motion.button
        onClick={handleExpand}
        className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-full font-semibold transition-all shadow-lg"
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-4 h-4" />
        <span className="flex-1 text-left">AI Review Summary</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-6 bg-white rounded-3xl shadow-xl border-2 border-gray-200">
              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                  <p className="text-gray-600 text-sm">Analyzing reviews with AI...</p>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="text-center py-6">
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={fetchSummary}
                    className="mt-2 text-emerald-600 text-sm font-semibold hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Summary Content */}
              {summary && !isLoading && (
                <div className="space-y-6">
                  {/* Header - Score & Sentiment */}
                  <div className="flex items-start gap-4">
                    {/* AI Score Circle */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="#e5e7eb"
                          strokeWidth="6"
                          fill="none"
                        />
                        <motion.circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="url(#gradient)"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: '0 200' }}
                          animate={{
                            strokeDasharray: `${(summary.aiScore / 100) * 200} 200`
                          }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#06d6a0" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-gray-900">
                          {summary.aiScore}
                        </span>
                        <span className="text-xs text-gray-500">Score</span>
                      </div>
                    </div>

                    {/* Sentiment & Reviews */}
                    <div className="flex-1">
                      <div
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r text-white rounded-full text-sm font-semibold mb-2',
                          getSentimentColor(summary.sentiment)
                        )}
                      >
                        <span className="text-lg">{getSentimentIcon(summary.sentiment)}</span>
                        <span className="capitalize">{summary.sentiment}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold text-gray-900">
                            {summary.avgRating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <span>•</span>
                        <span>{summary.reviewCount} reviews</span>
                      </div>

                      {/* Confidence */}
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">
                          AI Confidence: {Math.round(summary.confidence * 100)}%
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${summary.confidence * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pros */}
                  {summary.pros && summary.pros.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">What People Love</h3>
                      </div>
                      <div className="space-y-2 pl-10">
                        {summary.pros.map((pro, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-2"
                          >
                            <span className="text-green-600 mt-1">•</span>
                            <span className="text-gray-700 text-sm">{pro}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cons */}
                  {summary.cons && summary.cons.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <ThumbsDown className="w-4 h-4 text-red-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Points to Consider</h3>
                      </div>
                      <div className="space-y-2 pl-10">
                        {summary.cons.map((con, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-2"
                          >
                            <span className="text-red-600 mt-1">•</span>
                            <span className="text-gray-700 text-sm">{con}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Badge */}
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-gray-500">
                      Powered by Claude AI • Updated {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
