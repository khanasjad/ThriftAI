/**
 * Brand Reputation Analyzer
 *
 * Assesses brand reputation from multiple sources and generates
 * evidence for Factor 15 (Brand Reputation)
 */

import {
  BrandReputation,
  BrandReputationEvidence,
  ReputationSource
} from './trend-types'

/**
 * Analyze brand reputation
 */
export function analyzeBrandReputation(
  brandId: string,
  brandName: string,
  useMockData: boolean = true
): BrandReputation {
  // In production, this would aggregate data from multiple APIs
  // For demo, generate realistic mock data
  const sources = useMockData
    ? generateMockReputationData(brandName)
    : []  // TODO: Implement real API calls

  // Calculate component scores from sources
  const customerSatisfaction = calculateComponentScore(sources, 'customer')
  const sustainability = calculateComponentScore(sources, 'sustainability')
  const ethics = calculateComponentScore(sources, 'ethics')
  const transparency = calculateComponentScore(sources, 'transparency')
  const qualityConsistency = calculateComponentScore(sources, 'quality')

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (customerSatisfaction * 0.3) +
    (sustainability * 0.2) +
    (ethics * 0.2) +
    (transparency * 0.15) +
    (qualityConsistency * 0.15)
  )

  // Assign rating
  const rating = getRating(overallScore)

  // Check for certifications (mock for demo)
  const certifications = generateMockCertifications(brandName, sustainability, ethics)

  // Check for controversies (mock for demo)
  const controversies = generateMockControversies(brandName, overallScore)
  const hasActiveControversy = controversies.length > 0

  return {
    brandId,
    brandName,
    overallScore,
    rating,
    customerSatisfaction,
    sustainability,
    ethics,
    transparency,
    qualityConsistency,
    sources,
    certifications,
    controversies,
    hasActiveControversy
  }
}

/**
 * Generate evidence from brand reputation analysis
 */
export function generateBrandReputationEvidence(
  productId: string,
  reputation: BrandReputation
): BrandReputationEvidence {
  const { overallScore, rating, brandName, certifications, hasActiveControversy } = reputation

  // Determine signal and sentiment
  const { signal, sentiment, quote } = determineSignalAndSentiment(
    overallScore,
    rating,
    brandName,
    certifications,
    hasActiveControversy
  )

  // Calculate confidence based on data sources
  const confidence = calculateConfidence(reputation.sources)

  return {
    productId,
    brandId: reputation.brandId,
    factor: 'style_value.brand_reputation',
    signal,
    sentiment,
    confidence,
    quote,
    metadata: {
      brandName,
      overallScore,
      certifications,
      hasControversies: hasActiveControversy
    }
  }
}

/**
 * Generate mock reputation data for demo
 */
function generateMockReputationData(brandName: string): any[] {
  // Different brands get different reputation profiles
  const brandProfiles: Record<string, number> = {
    'Everlane': 85,      // Excellent reputation
    'Reformation': 88,   // Excellent, sustainable
    'Patagonia': 95,     // Outstanding reputation
    'Shein': 45,         // Poor reputation
    'H&M': 62,          // Average reputation
    'Zara': 68,         // Good reputation
    'Uniqlo': 75,       // Good reputation
    'Allbirds': 82      // Excellent, sustainable
  }

  const baseScore = brandProfiles[brandName] || 70  // Default to good

  return [
    {
      source: ReputationSource.TRUSTPILOT,
      score: baseScore + (Math.random() * 10 - 5),
      reviewCount: Math.floor(Math.random() * 10000) + 1000,
      lastUpdated: new Date()
    },
    {
      source: ReputationSource.SOCIAL_SENTIMENT,
      score: baseScore + (Math.random() * 10 - 5),
      lastUpdated: new Date()
    },
    {
      source: ReputationSource.SUSTAINABILITY_RATINGS,
      score: brandName === 'Patagonia' || brandName === 'Reformation'
        ? baseScore + 10
        : baseScore - 10,
      lastUpdated: new Date()
    }
  ]
}

/**
 * Calculate component score from sources
 */
function calculateComponentScore(sources: any[], component: string): number {
  if (sources.length === 0) return 70  // Default to good

  // For demo, calculate average with some variation
  const avg = sources.reduce((sum, s) => sum + s.score, 0) / sources.length
  const variation = (Math.random() - 0.5) * 10
  return Math.round(Math.max(0, Math.min(100, avg + variation)))
}

/**
 * Get rating from overall score
 */
function getRating(score: number): 'excellent' | 'good' | 'average' | 'poor' | 'very_poor' {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 55) return 'average'
  if (score >= 40) return 'poor'
  return 'very_poor'
}

/**
 * Generate mock certifications
 */
function generateMockCertifications(
  brandName: string,
  sustainability: number,
  ethics: number
): string[] {
  const certs: string[] = []

  if (sustainability >= 80) {
    certs.push('B-Corp Certified')
    certs.push('GOTS Organic')
  }

  if (ethics >= 80) {
    certs.push('Fair Trade Certified')
  }

  if (brandName === 'Patagonia') {
    certs.push('1% for the Planet')
    certs.push('Bluesign Approved')
  }

  if (brandName === 'Reformation') {
    certs.push('Climate Neutral Certified')
  }

  return certs
}

/**
 * Generate mock controversies
 */
function generateMockControversies(brandName: string, overallScore: number): string[] {
  if (brandName === 'Shein') {
    return [
      'Labor practices concerns',
      'Environmental impact criticism'
    ]
  }

  if (overallScore < 50) {
    return ['Recent quality issues reported']
  }

  return []
}

/**
 * Determine signal and sentiment for brand reputation
 */
function determineSignalAndSentiment(
  overallScore: number,
  rating: string,
  brandName: string,
  certifications: string[],
  hasControversy: boolean
): {
  signal: 'trusted_brand' | 'unknown_brand' | 'poor_reputation' | 'luxury_brand'
  sentiment: number
  quote: string
} {
  // Poor reputation (controversy or low score)
  if (hasControversy || overallScore < 50) {
    return {
      signal: 'poor_reputation',
      sentiment: -0.8,
      quote: `${brandName} has reputation concerns with an overall score of ${overallScore}/100${hasControversy ? ' and active controversies' : ''}`
    }
  }

  // Excellent reputation with certifications (trusted brand)
  if (rating === 'excellent' && certifications.length > 0) {
    return {
      signal: 'trusted_brand',
      sentiment: 1.0,
      quote: `${brandName} is a highly trusted brand (${overallScore}/100) with certifications: ${certifications.slice(0, 2).join(', ')}`
    }
  }

  // Good reputation
  if (rating === 'good' || rating === 'excellent') {
    return {
      signal: 'trusted_brand',
      sentiment: 0.7,
      quote: `${brandName} has a ${rating} reputation with ${overallScore}/100 overall score`
    }
  }

  // Average/unknown
  return {
    signal: 'unknown_brand',
    sentiment: 0.0,
    quote: `${brandName} has an average reputation (${overallScore}/100) with limited data`
  }
}

/**
 * Calculate confidence for reputation evidence
 */
function calculateConfidence(sources: any[]): number {
  // More sources = higher confidence
  const sourceScore = Math.min(sources.length / 5, 1.0) * 0.6

  // More reviews = higher confidence
  const totalReviews = sources.reduce((sum, s) => sum + (s.reviewCount || 0), 0)
  const reviewScore = Math.min(totalReviews / 5000, 1.0) * 0.4

  return Math.min(1.0, sourceScore + reviewScore)
}

/**
 * Format brand reputation for display
 */
export function formatBrandReputation(reputation: BrandReputation): string {
  const lines = [
    `Brand: ${reputation.brandName}`,
    `Overall Score: ${reputation.overallScore}/100 (${reputation.rating.toUpperCase()})`,
    ``,
    `Component Scores:`,
    `  Customer Satisfaction: ${reputation.customerSatisfaction}/100`,
    `  Sustainability: ${reputation.sustainability}/100`,
    `  Ethics: ${reputation.ethics}/100`,
    `  Transparency: ${reputation.transparency}/100`,
    `  Quality Consistency: ${reputation.qualityConsistency}/100`,
    ``
  ]

  if (reputation.certifications.length > 0) {
    lines.push(`Certifications:`)
    reputation.certifications.forEach(cert => lines.push(`  • ${cert}`))
    lines.push(``)
  }

  if (reputation.controversies.length > 0) {
    lines.push(`⚠️  Active Concerns:`)
    reputation.controversies.forEach(c => lines.push(`  • ${c}`))
    lines.push(``)
  }

  lines.push(`Data Sources: ${reputation.sources.length}`)

  return lines.join('\n')
}
