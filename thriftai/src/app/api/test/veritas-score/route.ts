/**
 * Test endpoint to see Veritas Score with real FREE data
 * Usage: GET /api/test/veritas-score?productId=<id>
 */

import { NextRequest, NextResponse } from 'next/server'
import { veritasScoreService } from '@/lib/services/veritasScoreService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({
        error: 'Missing productId parameter',
        usage: 'GET /api/test/veritas-score?productId=<product_id>'
      }, { status: 400 })
    }

    console.log(`[Veritas Test] Calculating score for product: ${productId}`)

    // Calculate Veritas Score with real FREE data
    const scoreResult = await veritasScoreService.calculateScore(productId)

    // Format response to show data sources
    const formattedResult = {
      ssn: scoreResult.ssn,
      overallScore: scoreResult.overallScore,
      confidence: scoreResult.confidence,
      dataQualityScore: scoreResult.dataQualityScore,
      calculatedAt: scoreResult.calculatedAt,

      categories: scoreResult.categories.map(cat => ({
        category: cat.categoryName,
        score: cat.categoryScore,
        weight: cat.weight,
        weightedScore: cat.weightedScore,
        confidence: cat.confidence,

        parameters: cat.parameters.map(param => ({
          name: param.parameterName,
          code: param.parameterCode,
          rawValue: param.rawValue,
          normalizedScore: param.normalizedValue,
          weightedScore: param.weightedScore,
          dataSource: param.dataSource,
          confidence: param.confidence,
          isMissing: param.isMissing,

          // Highlight FREE API sources
          isRealData: [
            'gsmarena',
            'apple_warranty',
            'dell_warranty',
            'ifixit',
            'ebay',
            'energy_star',
            'alpha_vantage'
          ].includes(param.dataSource)
        }))
      })),

      missingDataFields: scoreResult.missingDataFields,

      // Summary of FREE data usage
      freeDataSummary: {
        totalParameters: scoreResult.categories.reduce((sum, cat) => sum + cat.parameters.length, 0),
        parametersUsingFreeAPIs: scoreResult.categories.reduce((sum, cat) => {
          return sum + cat.parameters.filter(p =>
            ['gsmarena', 'apple_warranty', 'dell_warranty', 'ifixit', 'ebay', 'energy_star', 'alpha_vantage'].includes(p.dataSource)
          ).length
        }, 0),
        freeAPIsUsed: Array.from(new Set(
          scoreResult.categories.flatMap(cat =>
            cat.parameters
              .filter(p => ['gsmarena', 'apple_warranty', 'dell_warranty', 'ifixit', 'ebay', 'energy_star', 'alpha_vantage'].includes(p.dataSource))
              .map(p => p.dataSource)
          )
        ))
      }
    }

    return NextResponse.json(formattedResult, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('[Veritas Test] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
