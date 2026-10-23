/**
 * Product Score Explanation API
 *
 * GET /api/v1/products/:id/explain
 *
 * Returns a natural language explanation of a product's quality score.
 */

import { NextRequest, NextResponse } from 'next/server'
import { explainScore } from '@/lib/agents/explanation'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Query parameters schema
const explainQuerySchema = z.object({
  detailLevel: z.enum(['summary', 'detailed', 'full']).optional().default('detailed'),
  focusAreas: z.string().optional() // Comma-separated pillar names
})

/**
 * GET /api/v1/products/:id/explain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const productId = params.id

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = explainQuerySchema.parse({
      detailLevel: searchParams.get('detailLevel'),
      focusAreas: searchParams.get('focusAreas')
    })

    logger.info('Score explanation request', {
      productId,
      detailLevel: queryParams.detailLevel,
      focusAreas: queryParams.focusAreas
    })

    // Parse focus areas if provided
    const focusAreas = queryParams.focusAreas
      ? queryParams.focusAreas.split(',').map(f => f.trim().toUpperCase() as any)
      : undefined

    // Generate explanation
    const explanation = await explainScore(productId, {
      detailLevel: queryParams.detailLevel,
      focusAreas
    })

    const response = {
      success: true,
      productId,
      explanation,
      metadata: {
        detailLevel: queryParams.detailLevel,
        processingTime: Date.now() - startTime
      }
    }

    logger.info('Score explanation completed', {
      productId,
      overallScore: explanation.overallScore,
      grade: explanation.grade,
      processingTime: response.metadata.processingTime
    })

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    logger.error('Score explanation failed', {
      productId: params.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.errors
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
          message: 'The product or its score could not be found'
        },
        { status: 404 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Explanation failed',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
