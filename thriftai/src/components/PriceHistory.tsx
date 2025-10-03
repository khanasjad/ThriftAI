'use client'

import React from 'react'
import { TrendingDown, TrendingUp, Bell } from 'lucide-react'

interface PricePoint {
  date: string
  price: number
}

interface PriceHistoryProps {
  productId: string
  currentPrice: number
  history: PricePoint[]
  onSetAlert?: (targetPrice: number) => void
}

export default function PriceHistory({ productId, currentPrice, history, onSetAlert }: PriceHistoryProps) {
  const [alertPrice, setAlertPrice] = React.useState('')

  if (!history || history.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--text-secondary)]">
        No price history available for this product
      </div>
    )
  }

  const prices = history.map(p => p.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const priceChange = currentPrice - history[0].price
  const priceChangePercent = (priceChange / history[0].price) * 100

  const normalizePrice = (price: number) => {
    const range = maxPrice - minPrice
    return range === 0 ? 50 : ((price - minPrice) / range) * 100
  }

  const handleSetAlert = () => {
    const target = parseFloat(alertPrice)
    if (!isNaN(target) && target > 0 && onSetAlert) {
      onSetAlert(target)
      setAlertPrice('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Price Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Current</div>
          <div className="text-xl font-bold text-[var(--accent-primary)]">${currentPrice.toFixed(2)}</div>
        </div>
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Lowest</div>
          <div className="text-xl font-bold text-green-500">${minPrice.toFixed(2)}</div>
        </div>
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Average</div>
          <div className="text-xl font-bold text-blue-500">${avgPrice.toFixed(2)}</div>
        </div>
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Change</div>
          <div className={`text-xl font-bold flex items-center gap-1 ${priceChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {priceChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {priceChangePercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-[var(--bg-tertiary)] rounded-lg p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Price Trend (Last {history.length} Days)</h3>
        <div className="relative h-48">
          <svg className="w-full h-full" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={`${y}%`}
                x2="100%"
                y2={`${y}%`}
                stroke="var(--border-primary)"
                strokeWidth="1"
                strokeDasharray="4"
              />
            ))}

            {/* Price line */}
            <polyline
              points={history.map((point, i) => {
                const x = (i / (history.length - 1)) * 100
                const y = 100 - normalizePrice(point.price)
                return `${x}%,${y}%`
              }).join(' ')}
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Price points */}
            {history.map((point, i) => {
              const x = (i / (history.length - 1)) * 100
              const y = 100 - normalizePrice(point.price)
              return (
                <g key={i}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="var(--accent-primary)"
                  />
                </g>
              )
            })}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-[var(--text-secondary)]">
            <span>${maxPrice.toFixed(0)}</span>
            <span>${((minPrice + maxPrice) / 2).toFixed(0)}</span>
            <span>${minPrice.toFixed(0)}</span>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-[var(--text-secondary)]">
          <span>{history[0]?.date}</span>
          <span>{history[Math.floor(history.length / 2)]?.date}</span>
          <span>{history[history.length - 1]?.date}</span>
        </div>
      </div>

      {/* Price Alert */}
      {onSetAlert && (
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Set Price Alert</h3>
          </div>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Target price"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              className="flex-1 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <button
              onClick={handleSetAlert}
              disabled={!alertPrice}
              className="px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Set Alert
            </button>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            We'll notify you when the price drops to or below your target
          </p>
        </div>
      )}

      {/* Best Time to Buy */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">💡 Best Time to Buy</h3>
        <div className="space-y-2 text-sm">
          {currentPrice <= minPrice && (
            <p className="text-green-500">✓ Current price matches historical low - Great time to buy!</p>
          )}
          {currentPrice > avgPrice && (
            <p className="text-yellow-500">⚠ Price is above average - Consider waiting for a better deal</p>
          )}
          {priceChange < 0 && (
            <p className="text-green-500">✓ Price is trending down - Good buying opportunity</p>
          )}
          {currentPrice > minPrice && currentPrice <= avgPrice && (
            <p className="text-blue-500">ℹ Price is reasonable - Fair time to purchase</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to generate mock price history
export function generateMockPriceHistory(currentPrice: number, days: number = 30): PricePoint[] {
  const history: PricePoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Generate realistic price variation
    const variation = (Math.random() - 0.5) * (currentPrice * 0.2)
    const price = currentPrice + variation - (i * currentPrice * 0.001) // Slight downward trend

    history.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Math.max(currentPrice * 0.7, Math.min(currentPrice * 1.3, price))
    })
  }

  return history
}
