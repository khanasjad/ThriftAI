/**
 * Price Intelligence API
 * GET /api/price-intelligence/[productId]
 * Returns price history, trends, and deal analysis for a product
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzePriceHistory } from '@/lib/services/priceIntelligence'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params

    logger.info('💰 Price intelligence API called', {
      component: 'PriceIntelligenceAPI',
      metadata: { productId }
    })

    const result = await analyzePriceHistory(productId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Product not found' ? 404 : 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // Cache for 5 minutes
        }
      }
    )
  } catch (error) {
    logger.error('❌ Price intelligence API error', {
      component: 'PriceIntelligenceAPI',
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze price history'
      },
      { status: 500 }
    )
  }
}
