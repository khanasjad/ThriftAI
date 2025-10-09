/**
 * Simple Semantic Search Service
 *
 * Implements semantic search using OpenAI embeddings stored as JSON
 * Works without pgvector extension (for PostgreSQL 14)
 *
 * Flow:
 * 1. Generate embedding for user query using OpenAI
 * 2. Fetch products with embeddings from database
 * 3. Calculate cosine similarity in-memory
 * 4. Return top matches sorted by similarity
 */

import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const EMBEDDING_MODEL = 'text-embedding-3-large'
const EMBEDDING_DIMENSIONS = 1536

interface SimpleSearchOptions {
  query: string
  limit?: number
  categoryFilter?: string
  priceRange?: { min?: number; max?: number }
  minSimilarity?: number
}

interface SearchResult {
  id: string
  name: string
  category: string
  brand?: string
  price: number
  imageUrl?: string
  similarity: number
}

export class SimpleSemanticSearchService {
  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Generate embedding for query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: query,
        encoding_format: 'float'
      })

      return response.data[0].embedding
    } catch (error) {
      logger.error('Failed to generate query embedding', {
        query,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Search products using semantic similarity
   */
  async search(options: SimpleSearchOptions): Promise<SearchResult[]> {
    const startTime = Date.now()
    const {
      query,
      limit = 20,
      categoryFilter,
      priceRange,
      minSimilarity = 0.5
    } = options

    try {
      logger.info('Starting semantic search', { query, options })

      // Step 1: Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query)

      // Step 2: Build database query with filters
      const where: any = {
        isAvailable: true,
        embeddingJson: { not: null }
      }

      if (categoryFilter) {
        where.category = categoryFilter
      }

      if (priceRange) {
        where.price = {}
        if (priceRange.min !== undefined) where.price.gte = priceRange.min
        if (priceRange.max !== undefined) where.price.lte = priceRange.max
      }

      // Step 3: Fetch products with embeddings (get more than needed for filtering)
      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          category: true,
          brand: true,
          price: true,
          imageUrl: true,
          embeddingJson: true
        },
        take: limit * 5, // Get 5x more for better similarity ranking
        orderBy: { createdAt: 'desc' }
      })

      logger.info('Fetched products from database', { count: products.length })

      // Step 4: Calculate similarity scores
      const results: SearchResult[] = []

      for (const product of products) {
        try {
          // Parse embedding from JSON
          const productEmbedding = JSON.parse(product.embeddingJson as string)

          // Calculate similarity
          const similarity = this.cosineSimilarity(queryEmbedding, productEmbedding)

          // Only include if above threshold
          if (similarity >= minSimilarity) {
            results.push({
              id: product.id,
              name: product.name,
              category: product.category,
              brand: product.brand || undefined,
              price: product.price,
              imageUrl: product.imageUrl || undefined,
              similarity
            })
          }
        } catch (error) {
          // Skip products with invalid embeddings
          logger.warn('Skipping product with invalid embedding', {
            productId: product.id,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      // Step 5: Sort by similarity and limit results
      results.sort((a, b) => b.similarity - a.similarity)
      const topResults = results.slice(0, limit)

      const processingTime = Date.now() - startTime

      logger.info('Semantic search completed', {
        query,
        totalCandidates: products.length,
        resultsAboveThreshold: results.length,
        returnedResults: topResults.length,
        topSimilarity: topResults[0]?.similarity,
        processingTime
      })

      return topResults
    } catch (error) {
      logger.error('Semantic search failed', {
        query,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Generate and store embedding for a product
   */
  async generateProductEmbedding(productId: string): Promise<void> {
    try {
      // Fetch product
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          brand: true,
          price: true,
          condition: true,
          tags: true
        }
      })

      if (!product) {
        throw new Error(`Product not found: ${productId}`)
      }

      // Build text representation
      const textParts: string[] = []
      textParts.push(`Product: ${product.name}`)
      textParts.push(`Category: ${product.category}`)
      if (product.brand) textParts.push(`Brand: ${product.brand}`)
      textParts.push(`Price: $${product.price.toFixed(2)}`)
      if (product.condition) textParts.push(`Condition: ${product.condition}`)
      if (product.description) textParts.push(`Description: ${product.description.substring(0, 500)}`)
      if (product.tags && product.tags.length > 0) textParts.push(`Tags: ${product.tags.join(', ')}`)

      const text = textParts.join('. ')

      // Generate embedding
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        encoding_format: 'float'
      })

      const embedding = response.data[0].embedding

      // Store as JSON
      await prisma.product.update({
        where: { id: productId },
        data: {
          embeddingJson: JSON.stringify(embedding),
          embeddingUpdatedAt: new Date()
        }
      })

      logger.info('Generated and stored product embedding', {
        productId,
        productName: product.name,
        dimensions: embedding.length
      })
    } catch (error) {
      logger.error('Failed to generate product embedding', {
        productId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Generate embeddings for multiple products in batch
   */
  async generateBatchEmbeddings(productIds?: string[], limit: number = 100): Promise<{
    successful: number
    failed: number
    errors: string[]
  }> {
    const startTime = Date.now()
    const result = { successful: 0, failed: 0, errors: [] as string[] }

    try {
      // Get products without embeddings
      const where: any = {
        isAvailable: true,
        embeddingJson: null
      }

      if (productIds && productIds.length > 0) {
        where.id = { in: productIds }
      }

      const products = await prisma.product.findMany({
        where,
        select: { id: true, name: true },
        take: limit
      })

      logger.info('Starting batch embedding generation', { count: products.length })

      // Process each product
      for (const product of products) {
        try {
          await this.generateProductEmbedding(product.id)
          result.successful++
          logger.info(`Progress: ${result.successful}/${products.length}`)
        } catch (error) {
          result.failed++
          result.errors.push(`${product.id}: ${error instanceof Error ? error.message : String(error)}`)
        }

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const processingTime = Date.now() - startTime

      logger.info('Batch embedding generation completed', {
        successful: result.successful,
        failed: result.failed,
        processingTime
      })

      return result
    } catch (error) {
      logger.error('Batch embedding generation failed', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Get embedding statistics
   */
  async getStatistics(): Promise<{
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
          embeddingJson: { not: null }
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
export const simpleSemanticSearch = new SimpleSemanticSearchService()
