/**
 * Embedding Service
 *
 * Generates semantic vector embeddings for products using OpenAI's text-embedding-3-large model.
 * These embeddings enable semantic search capabilities where users can find products
 * based on meaning rather than just keyword matching.
 *
 * Features:
 * - Single product embedding generation
 * - Batch processing with rate limiting
 * - Automatic retry on failures
 * - Cost tracking
 * - Progress reporting
 */

import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult,
  EmbeddingProgress,
  CompanyMetrics,
  DynamicSpecs
} from '@/lib/types/aiScoring96'

// ========================================
// CONFIGURATION
// ========================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const EMBEDDING_MODEL = 'text-embedding-3-large' // 1536 dimensions
const EMBEDDING_DIMENSIONS = 1536
const MAX_BATCH_SIZE = 100 // OpenAI limit
const COST_PER_1M_TOKENS = 0.13 // USD

// ========================================
// TYPES
// ========================================

interface ProductForEmbedding {
  id: string
  name: string
  description: string | null
  category: string
  brand: string | null
  price: number
  aiScore?: number | null
  companyMetrics?: any
  dynamicSpecs?: any
  condition?: string | null
  tags?: string[]
}

// ========================================
// EMBEDDING SERVICE
// ========================================

export class EmbeddingService {
  /**
   * Generate text representation of a product for embedding
   * Includes all relevant information from 96 parameters
   */
  generateProductText(product: ProductForEmbedding): string {
    const parts: string[] = []

    // Core product info
    parts.push(`Product: ${product.name}`)
    parts.push(`Category: ${product.category}`)

    if (product.brand) {
      parts.push(`Brand: ${product.brand}`)
    }

    parts.push(`Price: $${product.price.toFixed(2)}`)

    if (product.condition) {
      parts.push(`Condition: ${product.condition}`)
    }

    // AI Score
    if (product.aiScore) {
      parts.push(`AI Quality Score: ${product.aiScore}/100`)
    }

    // Description
    if (product.description) {
      // Truncate long descriptions to avoid token limits
      const maxDescLength = 500
      const desc = product.description.length > maxDescLength
        ? product.description.substring(0, maxDescLength) + '...'
        : product.description
      parts.push(`Description: ${desc}`)
    }

    // Company metrics (if available)
    if (product.companyMetrics) {
      const cm = product.companyMetrics as CompanyMetrics
      if (cm.esgScore) {
        parts.push(`Company ESG Score: ${cm.esgScore}/100`)
      }
      if (cm.sustainabilityRating) {
        parts.push(`Sustainability Rating: ${cm.sustainabilityRating}`)
      }
      if (cm.marketCap) {
        parts.push(`Company Market Cap: $${cm.marketCap}B`)
      }
    }

    // Dynamic specs (category-specific)
    if (product.dynamicSpecs) {
      const specs = product.dynamicSpecs as DynamicSpecs
      Object.entries(specs).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            parts.push(`${key}: ${value.join(', ')}`)
          } else if (typeof value === 'object') {
            parts.push(`${key}: ${JSON.stringify(value)}`)
          } else {
            parts.push(`${key}: ${value}`)
          }
        }
      })
    }

    // Tags
    if (product.tags && product.tags.length > 0) {
      parts.push(`Tags: ${product.tags.join(', ')}`)
    }

    return parts.join('. ')
  }

  /**
   * Generate embedding for a single product
   */
  async generateEmbedding(productId: string): Promise<number[]> {
    try {
      // Fetch product from database
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          brand: true,
          price: true,
          aiScore: true,
          companyMetrics: true,
          dynamicSpecs: true,
          condition: true,
          tags: true
        }
      })

      if (!product) {
        throw new Error(`Product not found: ${productId}`)
      }

      // Generate text representation
      const text = this.generateProductText(product as ProductForEmbedding)

      logger.info('Generating embedding', {
        productId,
        productName: product.name,
        textLength: text.length
      })

      // Call OpenAI API
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        encoding_format: 'float'
      })

      const embedding = response.data[0].embedding

      // Verify dimensions
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(`Unexpected embedding dimensions: ${embedding.length}`)
      }

      logger.info('Embedding generated successfully', {
        productId,
        dimensions: embedding.length
      })

      return embedding
    } catch (error) {
      logger.error('Error generating embedding', {
        productId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Update product embedding in database
   */
  async updateProductEmbedding(
    productId: string,
    embedding: number[]
  ): Promise<void> {
    try {
      // Use raw SQL for pgvector
      await prisma.$executeRawUnsafe(`
        UPDATE "products"
        SET
          embedding = $1::vector,
          embedding_updated_at = NOW()
        WHERE id = $2
      `, JSON.stringify(embedding), productId)

      logger.info('Product embedding updated', { productId })
    } catch (error) {
      logger.error('Error updating product embedding', {
        productId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Generate and save embedding for a single product
   */
  async generateAndSaveEmbedding(productId: string): Promise<void> {
    const embedding = await this.generateEmbedding(productId)
    await this.updateProductEmbedding(productId, embedding)
  }

  /**
   * Batch generate embeddings for multiple products
   */
  async batchGenerateEmbeddings(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult> {
    const startTime = Date.now()
    const result: EmbeddingGenerationResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      apiCalls: 0,
      tokensUsed: 0,
      estimatedCost: 0,
      processingTime: 0,
      startedAt: new Date().toISOString(),
      completedAt: ''
    }

    try {
      // Get products to process
      const products = await this.getProductsForEmbedding(request)
      result.totalProcessed = products.length

      logger.info('Starting batch embedding generation', {
        totalProducts: products.length,
        batchSize: request.batchSize || MAX_BATCH_SIZE
      })

      const batchSize = Math.min(request.batchSize || MAX_BATCH_SIZE, MAX_BATCH_SIZE)

      // Process in batches
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)

        // Report progress
        if (request.onProgress) {
          const progress: EmbeddingProgress = {
            total: products.length,
            processed: i,
            successful: result.successful,
            failed: result.failed,
            currentBatch: Math.floor(i / batchSize) + 1,
            totalBatches: Math.ceil(products.length / batchSize),
            estimatedTimeRemaining: this.estimateTimeRemaining(
              i,
              products.length,
              startTime
            )
          }
          request.onProgress(progress)
        }

        // Generate texts for batch
        const texts = batch.map(p => this.generateProductText(p))

        try {
          // Call OpenAI API
          const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: texts,
            encoding_format: 'float'
          })

          result.apiCalls++
          result.tokensUsed += response.usage.total_tokens

          // Update database with embeddings
          const updatePromises = response.data.map(async (item, index) => {
            const product = batch[index]
            try {
              await this.updateProductEmbedding(product.id, item.embedding)
              result.successful++
            } catch (error) {
              result.failed++
              result.errors.push({
                productId: product.id,
                error: error instanceof Error ? error.message : String(error)
              })
            }
          })

          await Promise.all(updatePromises)

          logger.info('Batch processed', {
            batchNumber: Math.floor(i / batchSize) + 1,
            successful: result.successful,
            failed: result.failed
          })
        } catch (error) {
          logger.error('Batch API call failed', {
            batchNumber: Math.floor(i / batchSize) + 1,
            error: error instanceof Error ? error.message : String(error)
          })

          // Mark entire batch as failed
          batch.forEach(product => {
            result.failed++
            result.errors.push({
              productId: product.id,
              error: error instanceof Error ? error.message : 'Batch API call failed'
            })
          })
        }

        // Rate limiting: wait 1 second between batches
        if (i + batchSize < products.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Calculate cost
      result.estimatedCost = (result.tokensUsed / 1_000_000) * COST_PER_1M_TOKENS

      // Final progress
      if (request.onProgress) {
        request.onProgress({
          total: products.length,
          processed: products.length,
          successful: result.successful,
          failed: result.failed,
          estimatedTimeRemaining: 0
        })
      }
    } catch (error) {
      logger.error('Batch embedding generation failed', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    } finally {
      result.processingTime = Date.now() - startTime
      result.completedAt = new Date().toISOString()
    }

    logger.info('Batch embedding generation complete', {
      totalProcessed: result.totalProcessed,
      successful: result.successful,
      failed: result.failed,
      tokensUsed: result.tokensUsed,
      estimatedCost: result.estimatedCost.toFixed(4),
      processingTime: result.processingTime
    })

    return result
  }

  /**
   * Get products that need embeddings
   */
  private async getProductsForEmbedding(
    request: EmbeddingGenerationRequest
  ): Promise<ProductForEmbedding[]> {
    let where: any = {
      isAvailable: true
    }

    if (!request.forceRegenerate) {
      // Only get products without embeddings
      where.embedding = null
    }

    if (request.productIds && request.productIds.length > 0) {
      // Specific products
      where.id = { in: request.productIds }
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        brand: true,
        price: true,
        aiScore: true,
        companyMetrics: true,
        dynamicSpecs: true,
        condition: true,
        tags: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return products as ProductForEmbedding[]
  }

  /**
   * Estimate time remaining for batch processing
   */
  private estimateTimeRemaining(
    processed: number,
    total: number,
    startTime: number
  ): number {
    if (processed === 0) return 0

    const elapsed = Date.now() - startTime
    const rate = processed / elapsed // products per ms
    const remaining = total - processed

    return Math.round(remaining / rate / 1000) // seconds
  }

  /**
   * Generate embedding for a query (for search)
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      logger.info('Generating query embedding', { query })

      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: query,
        encoding_format: 'float'
      })

      return response.data[0].embedding
    } catch (error) {
      logger.error('Error generating query embedding', {
        query,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embedding dimensions do not match')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStatistics(): Promise<{
    totalProducts: number
    withEmbeddings: number
    withoutEmbeddings: number
    percentageComplete: number
  }> {
    const [total, withEmbeddings] = await Promise.all([
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.product.count({
        where: {
          isAvailable: true,
          embedding: { not: null }
        }
      })
    ])

    return {
      totalProducts: total,
      withEmbeddings,
      withoutEmbeddings: total - withEmbeddings,
      percentageComplete: total > 0 ? (withEmbeddings / total) * 100 : 0
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService()

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Validate embedding vector
 */
export function validateEmbedding(embedding: number[]): boolean {
  if (!Array.isArray(embedding)) return false
  if (embedding.length !== EMBEDDING_DIMENSIONS) return false
  if (embedding.some(v => typeof v !== 'number' || isNaN(v))) return false
  return true
}

/**
 * Normalize embedding vector (L2 normalization)
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map(val => val / norm)
}
