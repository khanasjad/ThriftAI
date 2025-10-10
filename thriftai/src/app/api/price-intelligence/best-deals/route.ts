/**
 * Best Deals API
 * GET /api/price-intelligence/best-deals
 * Returns products with the best price deals based on historical data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBestDeals } from '@/lib/services/priceIntelligence'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    logger.info('🏆 Best deals API called', {
      component: 'BestDealsAPI',
      metadata: { limit }
    })

    const deals = await getBestDeals(limit)

    return NextResponse.json(
      {
        success: true,
        deals,
        count: deals.length
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' // Cache for 10 minutes
        }
      }
    )
  } catch (error) {
    logger.error('❌ Best deals API error', {
      component: 'BestDealsAPI',
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get best deals'
      },
      { status: 500 }
    )
  }
}
