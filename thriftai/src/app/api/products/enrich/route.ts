import { NextRequest, NextResponse } from 'next/server'
import { realtimeDynamicGenerator } from '@/lib/services/realtimeDynamicGenerator'
import { logger } from '@/lib/logger'

/**
 * Real-time Product Enrichment API
 *
 * POST /api/products/enrich
 *
 * Takes a basic product and generates all 96 parameters in real-time:
 * - 25+ dynamic category-specific parameters (Claude AI)
 * - 8 AI score components
 * - 25 company ESG metrics
 * - Optimized seller/shipping/review parameters
 * - Complete AI scoring breakdown
 *
 * NO WEB SCRAPING - Uses AI generation for all parameters
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.category || !body.price) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['name', 'category', 'price']
        },
        { status: 400 }
      )
    }

    logger.info('🔄 Real-time product enrichment request', {
      name: body.name,
      category: body.category,
      price: body.price
    })

    // Enrich product with all 96 parameters
    const enrichedProduct = await realtimeDynamicGenerator.enrichProduct({
      name: body.name,
      description: body.description,
      brand: body.brand,
      category: body.category,
      price: body.price,
      originalPrice: body.originalPrice,
      condition: body.condition,
      imageUrl: body.imageUrl
    })

    // Optionally save to database
    if (body.save !== false) {
      await realtimeDynamicGenerator.saveProduct(enrichedProduct)
    }

    logger.info('✅ Product enrichment complete', {
      id: enrichedProduct.id,
      aiScore: enrichedProduct.aiScore,
      confidence: enrichedProduct.aiConfidence
    })

    return NextResponse.json({
      success: true,
      product: enrichedProduct,
      metadata: {
        totalParameters: 96,
        dynamicParametersGenerated: Object.keys(enrichedProduct.dynamicSpecs).length,
        aiConfidence: enrichedProduct.aiConfidence,
        processingTime: 'Real-time',
        method: 'AI Generation (Claude)'
      }
    })

  } catch (error) {
    logger.error('❌ Product enrichment error', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Product enrichment failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Batch enrichment endpoint
 * POST /api/products/enrich with array of products
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    if (!Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json(
        { error: 'Expected array of products' },
        { status: 400 }
      )
    }

    logger.info(`🔄 Batch enrichment request for ${body.products.length} products`)

    const enrichedProducts = await realtimeDynamicGenerator.enrichProductsBatch(body.products)

    // Optionally save all to database
    if (body.save !== false) {
      await Promise.all(
        enrichedProducts.map(p => realtimeDynamicGenerator.saveProduct(p))
      )
    }

    logger.info(`✅ Batch enrichment complete: ${enrichedProducts.length} products`)

    return NextResponse.json({
      success: true,
      products: enrichedProducts,
      metadata: {
        totalProducts: enrichedProducts.length,
        totalParameters: 96,
        method: 'AI Generation (Claude)'
      }
    })

  } catch (error) {
    logger.error('❌ Batch enrichment error', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Batch enrichment failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
