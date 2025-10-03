import { NextRequest, NextResponse } from 'next/server'
import { veritasScoreService } from '@/lib/services/veritasScoreService'

/**
 * POST /api/veritas/calculate
 * Calculate or recalculate Veritas Score for one or more products
 *
 * Body:
 * - productId: string (single product)
 * - productIds: string[] (multiple products)
 * - force: boolean (force recalculation even if score exists)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productIds, force = false } = body

    // Validate input
    if (!productId && (!productIds || !Array.isArray(productIds))) {
      return NextResponse.json(
        { error: 'Either productId or productIds array is required' },
        { status: 400 }
      )
    }

    const idsToProcess = productId ? [productId] : productIds
    const results: any[] = []
    const errors: any[] = []

    // Process each product
    for (const id of idsToProcess) {
      try {
        // Check if score exists and is fresh
        if (!force) {
          const existingScore = await veritasScoreService.getScore(id)
          if (existingScore && existingScore.nextUpdateDue && new Date(existingScore.nextUpdateDue) > new Date()) {
            results.push({
              productId: id,
              status: 'skipped',
              message: 'Score is still fresh',
              score: existingScore
            })
            continue
          }
        }

        // Calculate new score
        console.log(`Calculating Veritas Score for product ${id}`)
        const scoreResult = await veritasScoreService.calculateScore(id)

        // Save to database
        await veritasScoreService.saveScore(id, scoreResult)

        results.push({
          productId: id,
          status: 'success',
          score: scoreResult
        })
      } catch (error: any) {
        console.error(`Error calculating score for product ${id}:`, error)
        errors.push({
          productId: id,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Veritas Score calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
