/**
 * TypeScript types for Trend & Brand Agent
 */

/**
 * Trend phase in fashion cycle
 */
export enum TrendPhase {
  EMERGING = 'EMERGING',       // New trend gaining traction
  PEAK = 'PEAK',              // At maximum popularity
  DECLINING = 'DECLINING',    // Losing popularity
  CLASSIC = 'CLASSIC'         // Timeless, stable popularity
}

/**
 * Trend data source
 */
export enum TrendSource {
  GOOGLE_TRENDS = 'GOOGLE_TRENDS',
  INSTAGRAM = 'INSTAGRAM',
  PINTEREST = 'PINTEREST',
  TIKTOK = 'TIKTOK',
  FASHION_WEEKS = 'FASHION_WEEKS',
  RETAIL_DATA = 'RETAIL_DATA'
}

/**
 * Brand reputation source
 */
export enum ReputationSource {
  TRUSTPILOT = 'TRUSTPILOT',
  BBB = 'BBB',                          // Better Business Bureau
  GLASSDOOR = 'GLASSDOOR',              // Employee reviews
  NEWS_ARTICLES = 'NEWS_ARTICLES',
  SOCIAL_SENTIMENT = 'SOCIAL_SENTIMENT',
  SUSTAINABILITY_RATINGS = 'SUSTAINABILITY_RATINGS'
}

/**
 * Trend signal data point
 */
export interface TrendSignal {
  keyword: string                 // e.g., "wide leg jeans", "oversized blazer"
  category: string                // e.g., "denim", "outerwear"
  phase: TrendPhase
  score: number                   // 0-100 (popularity score)
  velocity: number                // Rate of change (-100 to +100)
  sources: {
    source: TrendSource
    score: number
    timestamp: Date
  }[]
  peakDate?: Date                 // When trend peaked
  projectedDecline?: Date         // When trend expected to decline
}

/**
 * Brand reputation data
 */
export interface BrandReputation {
  brandId: string
  brandName: string

  // Overall metrics
  overallScore: number            // 0-100
  rating: 'excellent' | 'good' | 'average' | 'poor' | 'very_poor'

  // Component scores
  customerSatisfaction: number    // 0-100
  sustainability: number          // 0-100
  ethics: number                  // 0-100
  transparency: number            // 0-100
  qualityConsistency: number      // 0-100

  // Source data
  sources: {
    source: ReputationSource
    score: number
    reviewCount?: number
    lastUpdated: Date
  }[]

  // Certifications
  certifications: string[]        // e.g., ["B-Corp", "Fair Trade", "GOTS"]

  // Red flags
  controversies: string[]         // Major issues/scandals
  hasActiveControversy: boolean
}

/**
 * Trend relevance analysis
 */
export interface TrendRelevance {
  productId: string
  productCategory: string
  productStyle: string

  // Matching trends
  matchingTrends: {
    keyword: string
    phase: TrendPhase
    score: number
    relevanceScore: number        // How well product matches trend (0-100)
  }[]

  // Overall assessment
  trendScore: number              // 0-100
  trendRating: 'on_trend' | 'timeless' | 'dated' | 'fast_fashion'
  longevityScore: number          // 0-100 (will it be stylish in 2 years?)
}

/**
 * Evidence for Factor 15 (Brand Reputation)
 */
export interface BrandReputationEvidence {
  productId: string
  brandId: string
  factor: 'style_value.brand_reputation'
  signal: 'trusted_brand' | 'unknown_brand' | 'poor_reputation' | 'luxury_brand'
  sentiment: number               // -1.0 to +1.0
  confidence: number              // 0.0 to 1.0
  quote: string
  metadata: {
    brandName: string
    overallScore: number
    certifications: string[]
    hasControversies: boolean
  }
}

/**
 * Evidence for Factor 17 (Trend Relevance)
 */
export interface TrendRelevanceEvidence {
  productId: string
  factor: 'style_value.trend_relevance'
  signal: 'on_trend' | 'timeless' | 'dated' | 'fast_fashion'
  sentiment: number               // -1.0 to +1.0
  confidence: number              // 0.0 to 1.0
  quote: string
  metadata: {
    trendScore: number
    matchingTrends: string[]
    phase: TrendPhase
    longevityScore: number
  }
}

/**
 * Configuration for trend tracking
 */
export interface TrendConfig {
  sources: TrendSource[]
  updateFrequency: number         // Days between updates
  minimumScore: number            // Minimum trend score to consider (0-100)
  useMockData: boolean           // Use mock data for demo
}

/**
 * Default trend configuration
 */
export const DEFAULT_TREND_CONFIG: TrendConfig = {
  sources: [
    TrendSource.GOOGLE_TRENDS,
    TrendSource.INSTAGRAM,
    TrendSource.PINTEREST
  ],
  updateFrequency: 7,             // Weekly updates
  minimumScore: 30,               // Only track trends with 30+ score
  useMockData: true              // Default to mock for demo
}
