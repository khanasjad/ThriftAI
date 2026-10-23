/**
 * TypeScript types for Price & Value Agent
 */

/**
 * Retailer or marketplace where price is found
 */
export enum Retailer {
  BRAND_DIRECT = 'BRAND_DIRECT',     // Brand's own website
  AMAZON = 'AMAZON',
  NORDSTROM = 'NORDSTROM',
  ZAPPOS = 'ZAPPOS',
  REI = 'REI',
  TARGET = 'TARGET',
  MACYS = 'MACYS',
  BLOOMINGDALES = 'BLOOMINGDALES',
  OTHER = 'OTHER'
}

/**
 * Price data point from a specific retailer
 */
export interface PricePoint {
  retailer: Retailer
  price: number                // Current price in USD
  originalPrice?: number       // Original/MSRP price if on sale
  currency: string             // Default: 'USD'
  isOnSale: boolean
  discountPercentage?: number  // If on sale
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown'
  url?: string                 // Product URL
  scrapedAt: Date
}

/**
 * Price comparison results
 */
export interface PriceComparison {
  productId: string
  brandDirectPrice: number     // Price from brand's website
  competitorPrices: PricePoint[]

  // Statistics
  lowestPrice: number
  highestPrice: number
  averagePrice: number
  medianPrice: number

  // Comparison metrics
  pricePosition: 'lowest' | 'below_average' | 'average' | 'above_average' | 'highest'
  percentileRank: number       // 0-100 (0 = cheapest, 100 = most expensive)
  savingsVsAverage: number     // Positive if cheaper than average
  savingsVsLowest: number      // How much more than lowest price

  // Fairness assessment
  fairnessScore: number        // 0-100 (100 = very fair price)
  fairnessRating: 'excellent' | 'good' | 'fair' | 'expensive' | 'overpriced'

  // Metadata
  comparisonDate: Date
  totalComparisons: number
}

/**
 * Price history for tracking trends
 */
export interface PriceHistory {
  productId: string
  snapshots: PriceSnapshot[]

  // Trend analysis
  currentPrice: number
  lowestHistoricalPrice: number
  highestHistoricalPrice: number
  averageHistoricalPrice: number

  trend: 'stable' | 'increasing' | 'decreasing' | 'volatile'
  percentageChange30d?: number  // Price change over last 30 days
  percentageChange90d?: number  // Price change over last 90 days
}

/**
 * Single price snapshot
 */
export interface PriceSnapshot {
  price: number
  retailer: Retailer
  date: Date
  isOnSale: boolean
}

/**
 * Evidence for Factor 14 (Price Fairness)
 */
export interface PriceFairnessEvidence {
  productId: string
  factor: 'style_value.price_fairness'
  signal: 'fair_price' | 'better_price_elsewhere' | 'best_price' | 'fake_discount' | 'overpriced'
  sentiment: number            // -1.0 to +1.0
  confidence: number           // 0.0 to 1.0
  quote: string                // Evidence description
  metadata: {
    brandPrice: number
    averageMarketPrice: number
    lowestMarketPrice: number
    percentDifference: number
  }
}

/**
 * Configuration for price scraping
 */
export interface PricingConfig {
  retailers: Retailer[]        // Which retailers to check
  maxRetries: number           // Max retries per retailer
  timeoutMs: number            // Timeout per request
  userAgent: string            // User agent for scraping
  useMockData: boolean         // Use mock data for testing
}

/**
 * Default pricing configuration
 */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  retailers: [
    Retailer.BRAND_DIRECT,
    Retailer.AMAZON,
    Retailer.NORDSTROM,
    Retailer.ZAPPOS
  ],
  maxRetries: 3,
  timeoutMs: 10000,
  userAgent: 'ThriftAI-PriceBot/1.0',
  useMockData: true  // Default to mock data for demo
}
