import { NextRequest, NextResponse } from 'next/server'
import { veritasScoreService } from '@/lib/services/veritasScoreService'

/**
 * GET /api/veritas/:productId
 * Retrieve Veritas Score for a product
 */
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

    // Try to get existing score
    let score = await veritasScoreService.getScore(productId)

    // If no score exists or it's outdated, calculate new one
    if (!score || (score.nextUpdateDue && new Date(score.nextUpdateDue) < new Date())) {
      console.log(`Calculating new Veritas Score for product ${productId}`)

      const scoreResult = await veritasScoreService.calculateScore(productId)
      await veritasScoreService.saveScore(productId, scoreResult)

      // Fetch the saved score
      score = await veritasScoreService.getScore(productId)
    }

    if (!score) {
      return NextResponse.json(
        { error: 'Failed to calculate score' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: score
    })
  } catch (error: any) {
    console.error('Veritas Score fetch error:', error)

    if (error.message?.includes('Product not found')) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
