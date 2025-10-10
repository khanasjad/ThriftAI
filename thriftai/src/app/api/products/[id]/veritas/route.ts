/**
 * Veritas Score API Endpoint
 * GET /api/products/[id]/veritas
 * Returns complete 121-parameter Veritas Score for a product
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateFullVeritasScore, generateVeritasInsights } from '@/lib/services/veritasScoreOrchestrator'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const productId = params.id

    logger.info('📊 Veritas Score API called', {
      component: 'VeritasAPI',
      metadata: { productId }
    })

    // Fetch product with all relations
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: true,
        reviews: {
          take: 50,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate Veritas Score
    const veritasScore = await calculateFullVeritasScore(product)

    // Generate human-readable insights
    const insights = generateVeritasInsights(veritasScore)

    const duration = Date.now() - startTime

    logger.info('✅ Veritas Score calculated via API', {
      component: 'VeritasAPI',
      metadata: {
        productId,
        score: veritasScore.overallScore,
        duration: `${duration}ms`
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...veritasScore,
        insights,
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price
        }
      },
      metadata: {
        calculationTime: `${duration}ms`,
        apiVersion: '1.0'
      }
    }, {
      headers: {
        'Cache-Control': `public, s-maxage=${veritasScore.cacheDuration}, stale-while-revalidate=600`
      }
    })

  } catch (error) {
    logger.error('❌ Veritas Score API error', {
      component: 'VeritasAPI',
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate Veritas Score',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
