import { NextRequest, NextResponse } from 'next/server'
import { aiReviewSummarizer } from '@/lib/services/aiReviewSummarizer'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    logger.info('📝 Fetching AI summary', { productId })

    // Get AI-generated summary (with caching)
    const summary = await aiReviewSummarizer.getSummary(productId)

    logger.info('✅ AI summary retrieved', {
      productId,
      aiScore: summary.aiScore,
      sentiment: summary.sentiment
    })

    return NextResponse.json({
      productId,
      summary,
      cached: true // Always cached after first generation
    })

  } catch (error) {
    logger.error('❌ Failed to get AI summary', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Failed to get summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
