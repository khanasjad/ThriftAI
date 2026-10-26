/**
 * Product Comparison API
 *
 * POST /api/v1/products/compare
 *
 * Compares multiple products side-by-side across quality factors.
 */

import { NextRequest, NextResponse } from 'next/server'
import { compareProducts } from '@/lib/agents/explanation'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Request validation schema
const compareRequestSchema = z.object({
  productIds: z.array(z.string()).min(2).max(5),
  focusAreas: z.array(z.enum([
    'FIT',
    'QUALITY',
    'STYLE_VALUE',
    'COMFORT',
    'SUSTAINABILITY'
  ])).optional()
})

/**
 * POST /api/v1/products/compare
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = compareRequestSchema.parse(body)

    const { productIds, focusAreas } = validatedData

    logger.info('Product comparison request', {
      productCount: productIds.length,
      focusAreas
    })

    // Compare products
    const comparison = await compareProducts(
      productIds,
      focusAreas as any
    )

    const response = {
      success: true,
      comparison: {
        products: comparison.products.map(p => ({
          id: p.productId,
          name: p.productName,
          overallScore: p.overallScore,
          grade: p.grade,
          summary: p.summary,
          pillars: p.pillars,
          strengths: p.strengths,
          weaknesses: p.weaknesses
        })),
        comparisonText: comparison.comparison,
        winner: comparison.winner
      },
      metadata: {
        productCount: productIds.length,
        focusAreas: focusAreas || 'all',
        processingTime: Date.now() - startTime
      }
    }

    logger.info('Product comparison completed', {
      productCount: productIds.length,
      winner: comparison.winner,
      processingTime: response.metadata.processingTime
    })

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    logger.error('Product comparison failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.issues,
          hint: 'Provide 2-5 product IDs and optional focus areas (FIT, QUALITY, STYLE_VALUE, COMFORT, SUSTAINABILITY)'
        },
        { status: 400 }
      )
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
          message: 'One or more products could not be found'
        },
        { status: 404 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Comparison failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
