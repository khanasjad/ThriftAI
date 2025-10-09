import { NextRequest, NextResponse } from 'next/server'
import { VERITAS_SCORE } from '@/config/constants'

/**
 * POST /api/veritas/calculator
 * Simple Veritas Score Calculator - Input category scores, get overall score
 *
 * Use this API to calculate "what-if" scenarios or estimate scores before listing
 */

interface CategoryInput {
  productQuality?: number      // 0-100
  sellerTrust?: number         // 0-100
  marketValue?: number         // 0-100
  sustainability?: number      // 0-100
  productSpecification?: number // 0-100
  securitySafety?: number      // 0-100
  userExperience?: number      // 0-100
  companyPerformance?: number  // 0-100
}

interface CalculatorResult {
  overallScore: number
  grade: string
  gradeLabel: string
  recommendation: string
  breakdown: {
    category: string
    score: number
    weight: number
    weightedScore: number
    percentage: string
  }[]
  weights: {
    productQuality: number
    sellerTrust: number
    marketValue: number
    sustainability: number
    productSpecification: number
    securitySafety: number
    userExperience: number
    companyPerformance: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CategoryInput = await request.json()

    // Extract scores with defaults of 0
    const scores = {
      productQuality: body.productQuality ?? 0,
      sellerTrust: body.sellerTrust ?? 0,
      marketValue: body.marketValue ?? 0,
      sustainability: body.sustainability ?? 0,
      productSpecification: body.productSpecification ?? 0,
      securitySafety: body.securitySafety ?? 0,
      userExperience: body.userExperience ?? 0,
      companyPerformance: body.companyPerformance ?? 0,
    }

    // Validate scores (0-100 range)
    for (const [key, value] of Object.entries(scores)) {
      if (value < 0 || value > 100) {
        return NextResponse.json(
          { error: `Invalid score for ${key}: must be between 0 and 100` },
          { status: 400 }
        )
      }
    }

    // Get weights from constants
    const weights = VERITAS_SCORE.WEIGHTS

    // Calculate weighted scores
    const breakdown = [
      {
        category: 'Product Quality',
        score: scores.productQuality,
        weight: weights.PRODUCT_QUALITY,
        weightedScore: scores.productQuality * weights.PRODUCT_QUALITY,
        percentage: `${(weights.PRODUCT_QUALITY * 100).toFixed(0)}%`,
      },
      {
        category: 'Seller Trust',
        score: scores.sellerTrust,
        weight: weights.SELLER_TRUST,
        weightedScore: scores.sellerTrust * weights.SELLER_TRUST,
        percentage: `${(weights.SELLER_TRUST * 100).toFixed(0)}%`,
      },
      {
        category: 'Market Value',
        score: scores.marketValue,
        weight: weights.MARKET_VALUE,
        weightedScore: scores.marketValue * weights.MARKET_VALUE,
        percentage: `${(weights.MARKET_VALUE * 100).toFixed(0)}%`,
      },
      {
        category: 'Sustainability',
        score: scores.sustainability,
        weight: weights.SUSTAINABILITY,
        weightedScore: scores.sustainability * weights.SUSTAINABILITY,
        percentage: `${(weights.SUSTAINABILITY * 100).toFixed(0)}%`,
      },
      {
        category: 'Product Specification',
        score: scores.productSpecification,
        weight: weights.PRODUCT_SPECIFICATION,
        weightedScore: scores.productSpecification * weights.PRODUCT_SPECIFICATION,
        percentage: `${(weights.PRODUCT_SPECIFICATION * 100).toFixed(0)}%`,
      },
      {
        category: 'Security & Safety',
        score: scores.securitySafety,
        weight: weights.SECURITY_SAFETY,
        weightedScore: scores.securitySafety * weights.SECURITY_SAFETY,
        percentage: `${(weights.SECURITY_SAFETY * 100).toFixed(0)}%`,
      },
      {
        category: 'User Experience',
        score: scores.userExperience,
        weight: weights.USER_EXPERIENCE,
        weightedScore: scores.userExperience * weights.USER_EXPERIENCE,
        percentage: `${(weights.USER_EXPERIENCE * 100).toFixed(0)}%`,
      },
      {
        category: 'Company Performance',
        score: scores.companyPerformance,
        weight: weights.COMPANY_PERFORMANCE,
        weightedScore: scores.companyPerformance * weights.COMPANY_PERFORMANCE,
        percentage: `${(weights.COMPANY_PERFORMANCE * 100).toFixed(0)}%`,
      },
    ]

    // Calculate overall score
    const overallScore = breakdown.reduce((sum, item) => sum + item.weightedScore, 0)

    // Determine grade
    const { grade, gradeLabel } = getGrade(overallScore)

    // Get recommendation
    const recommendation = getRecommendation(overallScore)

    const result: CalculatorResult = {
      overallScore: Math.round(overallScore * 100) / 100,
      grade,
      gradeLabel,
      recommendation,
      breakdown,
      weights: {
        productQuality: weights.PRODUCT_QUALITY,
        sellerTrust: weights.SELLER_TRUST,
        marketValue: weights.MARKET_VALUE,
        sustainability: weights.SUSTAINABILITY,
        productSpecification: weights.PRODUCT_SPECIFICATION,
        securitySafety: weights.SECURITY_SAFETY,
        userExperience: weights.USER_EXPERIENCE,
        companyPerformance: weights.COMPANY_PERFORMANCE,
      },
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Calculator error:', error)
    return NextResponse.json(
      { error: 'Calculation failed', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint - Returns calculator documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'Veritas Score Calculator API',
    description: 'Calculate overall Veritas Score from category scores',
    version: '1.0.0',
    endpoint: 'POST /api/veritas/calculator',
    requestBody: {
      productQuality: 'number (0-100)',
      sellerTrust: 'number (0-100)',
      marketValue: 'number (0-100)',
      sustainability: 'number (0-100)',
      productSpecification: 'number (0-100)',
      securitySafety: 'number (0-100)',
      userExperience: 'number (0-100)',
      companyPerformance: 'number (0-100)',
    },
    example: {
      request: {
        productQuality: 90,
        sellerTrust: 85,
        marketValue: 80,
        sustainability: 88,
        productSpecification: 92,
        securitySafety: 87,
        userExperience: 85,
        companyPerformance: 90,
      },
      response: {
        success: true,
        result: {
          overallScore: 87.45,
          grade: 'A',
          gradeLabel: 'Excellent',
          recommendation: 'STRONG_BUY',
        },
      },
    },
    weights: {
      productQuality: '25%',
      sellerTrust: '20%',
      marketValue: '15%',
      sustainability: '12%',
      productSpecification: '13%',
      securitySafety: '5%',
      userExperience: '5%',
      companyPerformance: '5%',
    },
  })
}

/**
 * Determine grade from score
 */
function getGrade(score: number): { grade: string; gradeLabel: string } {
  const grades = VERITAS_SCORE.GRADES

  if (score >= grades.S.MIN) return { grade: 'S', gradeLabel: grades.S.LABEL }
  if (score >= grades.A.MIN) return { grade: 'A', gradeLabel: grades.A.LABEL }
  if (score >= grades.B.MIN) return { grade: 'B', gradeLabel: grades.B.LABEL }
  if (score >= grades.C.MIN) return { grade: 'C', gradeLabel: grades.C.LABEL }
  if (score >= grades.D.MIN) return { grade: 'D', gradeLabel: grades.D.LABEL }
  return { grade: 'F', gradeLabel: grades.F.LABEL }
}

/**
 * Get recommendation based on score
 */
function getRecommendation(score: number): string {
  if (score >= 95) return 'EXCEPTIONAL_BUY'
  if (score >= 85) return 'STRONG_BUY'
  if (score >= 75) return 'BUY'
  if (score >= 65) return 'CONSIDER'
  if (score >= 50) return 'CAUTION'
  return 'AVOID'
}
