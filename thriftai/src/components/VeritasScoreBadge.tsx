'use client'

import React, { useState } from 'react'
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  VeritasScore,
  getVeritasGrade,
  getVeritasColor,
  getVeritasLabel,
  getCategoryDisplayInfo,
  type VeritasCategoryType
} from '@/types/veritas'

interface VeritasScoreBadgeProps {
  score: VeritasScore | number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showGrade?: boolean
  showSSN?: boolean
  showDetails?: boolean
  className?: string
  onClick?: () => void
}

/**
 * Veritas Score Badge Component
 * Displays the overall Veritas Score with grade and color coding
 */
export default function VeritasScoreBadge({
  score,
  size = 'md',
  showLabel = true,
  showGrade = true,
  showSSN = false,
  showDetails = false,
  className = '',
  onClick
}: VeritasScoreBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Extract score value
  const scoreValue = typeof score === 'number' ? score : score.overallScore
  const scoreData = typeof score === 'object' ? score : null

  // Get display properties
  const grade = getVeritasGrade(scoreValue)
  const color = getVeritasColor(scoreValue)
  const label = getVeritasLabel(scoreValue)

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'px-2 py-1',
      text: 'text-xs',
      badge: 'w-12 h-12',
      score: 'text-lg',
      grade: 'text-xs'
    },
    md: {
      container: 'px-3 py-2',
      text: 'text-sm',
      badge: 'w-16 h-16',
      score: 'text-2xl',
      grade: 'text-sm'
    },
    lg: {
      container: 'px-4 py-3',
      text: 'text-base',
      badge: 'w-20 h-20',
      score: 'text-3xl',
      grade: 'text-base'
    }
  }

  const config = sizeConfig[size]

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Main Badge */}
      <div
        className={`inline-flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg ${config.container} ${onClick ? 'cursor-pointer hover:border-[var(--accent-primary)] transition-colors' : ''}`}
        onClick={onClick}
        style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
      >
        {/* Circular Score Badge */}
        <div
          className={`${config.badge} rounded-full flex flex-col items-center justify-center font-bold shadow-lg`}
          style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
        >
          <div className={`${config.score} font-extrabold`} style={{ color }}>
            {Math.round(scoreValue)}
          </div>
          {showGrade && (
            <div className={`${config.grade} font-semibold opacity-80`} style={{ color }}>
              {grade}
            </div>
          )}
        </div>

        {/* Label and Info */}
        <div className="flex flex-col">
          <div className={`font-semibold text-[var(--text-primary)] ${config.text}`}>
            Veritas Score™
          </div>
          {showLabel && (
            <div className={`text-[var(--text-secondary)] ${config.text}`} style={{ color }}>
              {label}
            </div>
          )}
          {showSSN && scoreData && (
            <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
              {scoreData.ssn}
            </div>
          )}
          {scoreData && (
            <div className="flex items-center gap-1 mt-1">
              <div className="text-xs text-[var(--text-tertiary)]">
                Confidence: {Math.round(scoreData.confidence * 100)}%
              </div>
            </div>
          )}
        </div>

        {showDetails && <Info className="w-4 h-4 text-[var(--text-tertiary)] ml-auto" />}
      </div>

      {/* Tooltip */}
      {showTooltip && scoreData && (
        <div className="absolute z-50 top-full mt-2 left-0 w-80 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-[var(--text-primary)]">Veritas Score Details</h4>
            <div className="text-xs text-[var(--text-secondary)]">
              {new Date(scoreData.calculatedAt).toLocaleDateString()}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-2">
            {scoreData.categories?.map((category) => {
              const info = getCategoryDisplayInfo(category.categoryName as VeritasCategoryType)
              const catScore = typeof category.categoryScore === 'number'
                ? category.categoryScore
                : parseFloat(category.categoryScore as any)

              return (
                <div key={category.id} className="flex items-center gap-2">
                  <span className="text-lg">{info.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--text-secondary)]">{info.displayName}</span>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {Math.round(catScore)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${catScore}%`,
                          backgroundColor: getVeritasColor(catScore)
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Data Quality */}
          <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Data Quality</span>
              <span className="text-[var(--text-primary)] font-semibold">
                {Math.round(scoreData.dataQualityScore)}%
              </span>
            </div>
            {scoreData.missingDataFields.length > 0 && (
              <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
                {scoreData.missingDataFields.length} parameters need more data
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact Veritas Score Badge (for product cards)
 */
export function VeritasScoreBadgeCompact({
  score,
  className = ''
}: {
  score: number
  className?: string
}) {
  const grade = getVeritasGrade(score)
  const color = getVeritasColor(score)

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-bold text-xs ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}`
      }}
    >
      <span className="text-[10px] opacity-70">VS</span>
      <span>{Math.round(score)}</span>
      <span className="text-[10px] opacity-70">{grade}</span>
    </div>
  )
}

/**
 * Veritas Score Trend Indicator
 */
export function VeritasScoreTrend({
  current,
  previous,
  className = ''
}: {
  current: number
  previous: number
  className?: string
}) {
  const change = current - previous
  const changePercent = (change / previous) * 100

  if (Math.abs(change) < 0.5) {
    return (
      <div className={`inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] ${className}`}>
        <Minus className="w-3 h-3" />
        <span>Stable</span>
      </div>
    )
  }

  const isPositive = change > 0

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs font-semibold ${className}`}
      style={{ color: isPositive ? '#10b981' : '#ef4444' }}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span>
        {isPositive ? '+' : ''}{change.toFixed(1)} ({changePercent.toFixed(1)}%)
      </span>
    </div>
  )
}
