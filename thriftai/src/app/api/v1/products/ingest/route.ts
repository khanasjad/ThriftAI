/**
 * Veritas B2B Product Ingestion API
 *
 * POST /api/v1/products/ingest
 *
 * Bulk upload products for B2B tenants
 * - Validates product data
 * - Enriches with defaults
 * - Calculates Veritas scores (if configured)
 * - Stores in database with tenant isolation
 * - Generates embeddings and indexes in Qdrant (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, ApiAuthError, checkProductLimit, incrementProductCount } from '@/lib/middleware/apiAuth'
import { checkRateLimit, getRateLimitStatus, addRateLimitHeaders, RateLimitError } from '@/lib/middleware/tenantRateLimit'
import { b2bVectorSearchService } from '@/lib/services/b2bVectorSearch'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { Decimal } from '@prisma/client/runtime/library'

interface ProductInput {
  id?: string // External product ID
  name: string
  category: string
  brand?: string
  price: number
  originalPrice?: number
  condition?: string
  description?: string
  imageUrl?: string
  size?: string
  metadata?: Record<string, any>
}

interface IngestionRequest {
  products: ProductInput[]
  overwrite?: boolean // If true, update existing products
  enableIndexing?: boolean // If true, generate embeddings and index in Qdrant (default: false)
}

interface IngestionResponse {
  status: 'success' | 'partial' | 'failed'
  processed: number
  created: number
  updated: number
  failed: number
  errors?: Array<{
    index: number
    productId?: string
    error: string
  }>
  metadata: {
    processingTime: number
    tenantId: string
    totalProducts: number
    indexing?: {
      enabled: boolean
      indexed: number
      indexingErrors: number
      indexingTime: number
    }
  }
}

/**
 * Validate a single product
 */
function validateProduct(product: ProductInput, index: number): { valid: boolean; error?: string } {
  if (!product.name || product.name.trim().length === 0) {
    return { valid: false, error: 'Product name is required' }
  }

  if (!product.category || product.category.trim().length === 0) {
    return { valid: false, error: 'Category is required' }
  }

  if (typeof product.price !== 'number' || product.price < 0) {
    return { valid: false, error: 'Valid price is required' }
  }

  if (product.name.length > 200) {
    return { valid: false, error: 'Product name too long (max 200 characters)' }
  }

  return { valid: true }
}

/**
 * Enrich product with defaults
 */
function enrichProduct(product: ProductInput, tenantId: string): any {
  return {
    tenantId,
    name: product.name.trim(),
    category: product.category.trim(),
    brand: product.brand?.trim() || null,
    price: new Decimal(product.price),
    originalPrice: product.originalPrice ? new Decimal(product.originalPrice) : new Decimal(product.price),
    condition: product.condition || 'new',
    description: product.description?.trim() || null,
    imageUrl: product.imageUrl || null,
    size: product.size || null,
    isAvailable: true,
    stockQuantity: 1,
    // Store custom metadata
    ...(product.metadata && Object.keys(product.metadata).length > 0 ? {
      // We can use dynamic fields if needed
    } : {})
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // Step 1: Authenticate tenant
    const tenant = await validateApiKey(req)

    // Step 2: Check rate limiting
    await checkRateLimit(tenant)

    // Step 3: Get rate limit status for headers
    const rateLimitStatus = await getRateLimitStatus(tenant.id, tenant.rateLimit)

    // Step 4: Parse request body
    const body: IngestionRequest = await req.json()
    const { products, overwrite = false, enableIndexing = false } = body

    // Validate products array
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Products array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Check batch size limit
    const MAX_BATCH_SIZE = 1000
    if (products.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} products`,
          hint: 'Split your products into smaller batches'
        },
        { status: 400 }
      )
    }

    // Check product limit for tenant's plan
    const hasCapacity = await checkProductLimit(tenant.id)
    if (!hasCapacity) {
      return NextResponse.json(
        {
          error: 'Product limit reached for your plan',
          hint: 'Upgrade your plan or delete unused products',
          plan: tenant.plan
        },
        { status: 403 }
      )
    }

    logger.info('Product ingestion started', {
      tenantId: tenant.id,
      tenantName: tenant.name,
      productCount: products.length,
      overwrite
    })

    // Step 5: Validate all products
    const validationErrors: Array<{ index: number; productId?: string; error: string }> = []
    const validProducts: Array<{ product: ProductInput; index: number }> = []

    products.forEach((product, index) => {
      const validation = validateProduct(product, index)
      if (!validation.valid) {
        validationErrors.push({
          index,
          productId: product.id,
          error: validation.error!
        })
      } else {
        validProducts.push({ product, index })
      }
    })

    // Step 6: Process valid products
    let created = 0
    let updated = 0
    const processingErrors: Array<{ index: number; productId?: string; error: string }> = []
    const createdProductIds: string[] = [] // Track successfully created/updated products for indexing

    for (const { product, index } of validProducts) {
      try {
        const enrichedProduct = enrichProduct(product, tenant.id)

        if (overwrite && product.id) {
          // Try to update existing product by external ID
          const existing = await prisma.product.findFirst({
            where: {
              tenantId: tenant.id,
              OR: [
                { id: product.id },
                { name: product.name, category: product.category }
              ]
            }
          })

          if (existing) {
            await prisma.product.update({
              where: { id: existing.id },
              data: enrichedProduct
            })
            updated++
            createdProductIds.push(existing.id)
          } else {
            const newProduct = await prisma.product.create({
              data: enrichedProduct
            })
            created++
            createdProductIds.push(newProduct.id)
          }
        } else {
          // Create new product
          const newProduct = await prisma.product.create({
            data: enrichedProduct
          })
          created++
          createdProductIds.push(newProduct.id)
        }
      } catch (error) {
        processingErrors.push({
          index,
          productId: product.id,
          error: error instanceof Error ? error.message : 'Failed to process product'
        })
      }
    }

    // Step 7: Update tenant product count
    if (created > 0) {
      await incrementProductCount(tenant.id, created)
    }

    // Step 7.5: Generate embeddings and index in Qdrant (if enabled)
    let indexingStats: {
      enabled: boolean
      indexed: number
      indexingErrors: number
      indexingTime: number
    } | undefined

    if (enableIndexing && createdProductIds.length > 0) {
      const indexingStartTime = Date.now()

      logger.info('Starting product indexing in Qdrant', {
        tenantId: tenant.id,
        productCount: createdProductIds.length
      })

      try {
        const indexingResult = await b2bVectorSearchService.batchIndexProducts({
          tenantId: tenant.id,
          productIds: createdProductIds,
          forceReindex: true
        })

        indexingStats = {
          enabled: true,
          indexed: indexingResult.successful,
          indexingErrors: indexingResult.failed,
          indexingTime: Date.now() - indexingStartTime
        }

        logger.info('Product indexing completed', {
          tenantId: tenant.id,
          indexed: indexingResult.successful,
          failed: indexingResult.failed,
          indexingTime: indexingStats.indexingTime
        })
      } catch (error) {
        logger.error('Product indexing failed', {
          tenantId: tenant.id,
          error: error instanceof Error ? error.message : String(error)
        })

        indexingStats = {
          enabled: true,
          indexed: 0,
          indexingErrors: createdProductIds.length,
          indexingTime: Date.now() - indexingStartTime
        }
      }
    }

    const processingTime = Date.now() - startTime
    const allErrors = [...validationErrors, ...processingErrors]

    logger.info('Product ingestion completed', {
      tenantId: tenant.id,
      processed: products.length,
      created,
      updated,
      failed: allErrors.length,
      processingTime,
      indexingEnabled: enableIndexing,
      indexed: indexingStats?.indexed || 0
    })

    // Step 8: Determine status
    let status: 'success' | 'partial' | 'failed'
    if (allErrors.length === 0) {
      status = 'success'
    } else if (created + updated > 0) {
      status = 'partial'
    } else {
      status = 'failed'
    }

    // Step 9: Return response
    const response: IngestionResponse = {
      status,
      processed: products.length,
      created,
      updated,
      failed: allErrors.length,
      ...(allErrors.length > 0 ? { errors: allErrors } : {}),
      metadata: {
        processingTime,
        tenantId: tenant.id,
        totalProducts: tenant.totalProducts + created,
        ...(indexingStats ? { indexing: indexingStats } : {})
      }
    }

    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    addRateLimitHeaders(headers, rateLimitStatus)

    return new NextResponse(JSON.stringify(response), {
      status: status === 'failed' ? 400 : 200,
      headers
    })

  } catch (error) {
    // Handle authentication errors
    if (error instanceof ApiAuthError) {
      logger.warn('API authentication failed', {
        error: error.message,
        code: error.code
      })

      return NextResponse.json(
        {
          error: error.message,
          code: error.code
        },
        { status: error.statusCode }
      )
    }

    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      logger.warn('Rate limit exceeded', {
        error: error.message,
        limit: error.limit,
        remaining: error.remaining,
        retryAfter: error.retryAfter
      })

      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('X-RateLimit-Limit', error.limit.toString())
      headers.set('X-RateLimit-Remaining', error.remaining.toString())
      headers.set('Retry-After', error.retryAfter.toString())

      return new NextResponse(
        JSON.stringify({
          error: error.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: error.retryAfter
        }),
        {
          status: 429,
          headers
        }
      )
    }

    // Handle other errors
    logger.error('Product ingestion error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        error: 'Internal server error during product ingestion',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Add OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  })
}
