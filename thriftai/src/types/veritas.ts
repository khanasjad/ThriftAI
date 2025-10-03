/**
 * Veritas Score™ - Universal Product Quality Assessment System
 *
 * The IMDB of Products - Works for ALL product conditions:
 * - NEW products (factory sealed, open-box, authorized retailers)
 * - REFURBISHED products (manufacturer certified, third-party certified)
 * - USED products (like new, excellent, good, fair, poor)
 * - RENTAL products (cameras, tools, equipment)
 * - SUBSCRIPTION devices (upgrade programs, leases)
 *
 * Provides a single, objective quality score (0-100) based on:
 * - 8 quality categories (weighted combination)
 * - 121 verified parameters (26 currently implemented)
 * - Multi-source data validation
 * - Transparent, algorithm-driven methodology
 *
 * Example Use Cases:
 * 1. Compare new vs. refurbished vs. used versions of same product
 * 2. Evaluate certified refurb (often scores HIGHER than new!)
 * 3. Cross-platform comparison (Amazon "Renewed" vs. eBay "Certified")
 * 4. B2B procurement decisions (new vs. refurb for bulk purchases)
 * 5. Rental equipment quality assessment
 *
 * Score Interpretation:
 * - S Grade (95-100): Exceptional - Buy immediately
 * - A Grade (85-94): Excellent - Highly recommended (sweet spot for refurbs!)
 * - B Grade (75-84): Good - Safe purchase
 * - C Grade (65-74): Fair - Consider carefully
 * - D Grade (50-64): Below Average - Risky
 * - F Grade (0-49): Poor - Avoid
 *
 * Real-World Examples:
 * - New iPhone (sealed): 82/100 - Full price, full warranty
 * - Certified Refurb iPhone: 89/100 - 30% savings, same warranty, HIGHEST score!
 * - Used iPhone (excellent): 85/100 - 40% savings, good condition
 *
 * Frontend types for the 121-parameter quality assessment system
 */

export type VeritasCategoryType =
  | 'PRODUCT_QUALITY'        // 25% - Condition, authenticity, functionality
  | 'SELLER_TRUST'           // 20% - Reputation, reliability, service
  | 'MARKET_VALUE'           // 15% - Price fairness, value for money
  | 'SUSTAINABILITY'         // 12% - Environmental impact, reuse benefit
  | 'SECURITY_SAFETY'        // 5%  - Payment security, buyer protection
  | 'USER_EXPERIENCE'        // 5%  - Listing quality, customer service
  | 'PRODUCT_SPECIFICATION'  // 13% - Category-specific technical specs
  | 'COMPANY_PERFORMANCE'    // 5%  - Brand reputation, news sentiment

export interface VeritasScore {
  id: string
  productId: string
  ssn: string
  overallScore: number
  confidence: number
  dataQualityScore: number
  calculatedAt: Date
  lastUpdatedAt: Date
  nextUpdateDue?: Date
  calculationVersion: string
  missingDataFields: string[]
  categories: VeritasCategory[]
  competitorComparisons?: VeritasCompetitorComparison[]
}

export interface VeritasCategory {
  id: string
  veritasScoreId: string
  categoryName: VeritasCategoryType
  categoryScore: number
  weight: number
  weightedScore: number
  confidence: number
  calculatedAt: Date
  parameters: VeritasParameter[]
}

export interface VeritasParameter {
  id: string
  categoryId: string
  parameterName: string
  parameterCode: string
  rawValue: string | null
  normalizedValue: number
  weight: number
  weightedScore: number
  dataSource: string
  confidence: number
  isMissing: boolean
  calculatedAt: Date
  metadata?: Record<string, any>
}

export interface VeritasScoreHistory {
  id: string
  productId: string
  overallScore: number
  confidence: number
  ssn: string
  recordedAt: Date
  changeReason?: string
  deltaScore?: number
}

export interface VeritasCompetitorAnalysis {
  id: string
  productId: string
  competitorSource: string
  competitorProductId?: string
  competitorName: string
  competitorPrice: number
  competitorCondition?: string
  competitorRating?: number
  priceDifferential: number
  priceDifferentialPct: number
  marketPosition: string
  analyzedAt: Date
  expiresAt: Date
}

export interface VeritasCompetitorComparison {
  id: string
  veritasScoreId: string
  averageMarketPrice: number
  lowestMarketPrice: number
  highestMarketPrice: number
  pricePercentile: number
  valueScore: number
  competitorCount: number
  marketPosition: string
  priceRecommendation?: string
  lastComparisonAt: Date
}

// ============================================================================
// Display Types (for UI components)
// ============================================================================

export interface VeritasScoreDisplay {
  score: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  color: string
  label: string
  confidence: number
  ssn: string
}

export interface VeritasCategoryDisplay {
  name: string
  displayName: string
  score: number
  weight: number
  icon: string
  color: string
  description: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get display grade from score
 */
export function getVeritasGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 95) return 'S'
  if (score >= 85) return 'A'
  if (score >= 75) return 'B'
  if (score >= 65) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

/**
 * Get color for score
 */
export function getVeritasColor(score: number): string {
  if (score >= 90) return '#10b981' // green-500
  if (score >= 80) return '#3b82f6' // blue-500
  if (score >= 70) return '#f59e0b' // amber-500
  if (score >= 60) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

/**
 * Get label for score
 */
export function getVeritasLabel(score: number): string {
  if (score >= 90) return 'Exceptional'
  if (score >= 80) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 50) return 'Below Average'
  return 'Poor'
}

/**
 * Get category display info
 */
export function getCategoryDisplayInfo(category: VeritasCategoryType): {
  displayName: string
  icon: string
  description: string
} {
  const categoryInfo: Record<VeritasCategoryType, { displayName: string; icon: string; description: string }> = {
    PRODUCT_QUALITY: {
      displayName: 'Product Quality',
      icon: '⭐',
      description: 'Physical condition, authenticity, and specifications'
    },
    SELLER_TRUST: {
      displayName: 'Seller Trust',
      icon: '🛡️',
      description: 'Seller reputation and reliability'
    },
    MARKET_VALUE: {
      displayName: 'Market Value',
      icon: '💰',
      description: 'Price fairness and market positioning'
    },
    SUSTAINABILITY: {
      displayName: 'Sustainability',
      icon: '🌱',
      description: 'Environmental impact and eco-friendliness'
    },
    SECURITY_SAFETY: {
      displayName: 'Security & Safety',
      icon: '🔒',
      description: 'Payment security and buyer protection'
    },
    USER_EXPERIENCE: {
      displayName: 'User Experience',
      icon: '✨',
      description: 'Interface quality and customer service'
    },
    PRODUCT_SPECIFICATION: {
      displayName: 'Product Specification',
      icon: '📋',
      description: 'Category-specific technical specifications and features'
    },
    COMPANY_PERFORMANCE: {
      displayName: 'Company Performance',
      icon: '📈',
      description: 'Brand reputation, news sentiment, and market performance'
    }
  }

  return categoryInfo[category]
}

/**
 * Format SSN for display
 */
export function formatSSN(ssn: string): string {
  // SSN format: VS-CAT-SCORE-CONF-DATE
  const parts = ssn.split('-')
  if (parts.length !== 5) return ssn

  return `${parts[0]}-${parts[1]}\n${parts[2]}/${parts[3]}`
}

/**
 * Calculate score trend from history
 */
export function calculateScoreTrend(history: VeritasScoreHistory[]): {
  trend: 'up' | 'down' | 'stable'
  change: number
  changePercent: number
} {
  if (history.length < 2) {
    return { trend: 'stable', change: 0, changePercent: 0 }
  }

  const sorted = history.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
  const latest = sorted[0].overallScore
  const previous = sorted[1].overallScore
  const change = latest - previous
  const changePercent = (change / previous) * 100

  return {
    trend: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable',
    change,
    changePercent
  }
}

// ============================================================================
// Product Extension
// ============================================================================

/**
 * Extended product type with Veritas Score
 */
export interface ProductWithVeritasScore {
  id: string
  name: string
  category: string
  brand?: string
  price: number
  originalPrice: number
  condition?: string
  description?: string
  imageUrl?: string
  veritasScore?: VeritasScore
}
