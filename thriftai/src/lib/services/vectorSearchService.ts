/**
 * Vector Search Service
 *
 * Provides semantic search capabilities using pgvector and OpenAI embeddings.
 * Supports:
 * - Pure vector similarity search
 * - Hybrid search (vector + keyword + AI score)
 * - Filtered search (category, price, etc.)
 * - Similar product recommendations
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { embeddingService } from './embeddingService'
import { logger } from '@/lib/logger'
import {
  VectorSearchOptions,
  VectorSearchResult,
  VectorSearchResponse
} from '@/lib/types/aiScoring96'

// ========================================
// VECTOR SEARCH SERVICE
// ========================================

export class VectorSearchService {
  /**
   * Semantic search using vector similarity
   */
  async search(options: VectorSearchOptions): Promise<VectorSearchResponse> {
    const startTime = Date.now()

    try {
      const {
        query,
        limit = 50,
        offset = 0,
        categoryFilter,
        priceRange,
        minAiScore,
        similarityThreshold = 0.5
      } = options

      logger.info('Vector search started', { query, options })

      // Generate query embedding
      const queryEmbedding = await embeddingService.generateQueryEmbedding(query)

      // Build SQL filters
      const conditions: string[] = ['p.embedding IS NOT NULL', 'p.is_available = true']

      if (categoryFilter && categoryFilter.length > 0) {
        conditions.push(`p.category = ANY($2)`)
      }

      if (priceRange) {
        conditions.push(`p.price BETWEEN $3 AND $4`)
      }

      if (minAiScore) {
        conditions.push(`p.ai_score >= $5`)
      }

      // Add similarity threshold
      conditions.push(`(1 - (p.embedding <=> $1::vector)) >= $6`)

      const whereClause = conditions.join(' AND ')

      // Build parameter array
      const params: any[] = [JSON.stringify(queryEmbedding)]

      if (categoryFilter && categoryFilter.length > 0) {
        params.push(categoryFilter)
      }
      if (priceRange) {
        params.push(priceRange.min, priceRange.max)
      }
      if (minAiScore) {
        params.push(minAiScore)
      }
      params.push(similarityThreshold)
      params.push(limit)
      params.push(offset)

      // Execute vector similarity search
      const results = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.id,
          p.name,
          p.category,
          p.brand,
          p.price,
          p.ai_score,
          p.image_url,
          1 - (p.embedding <=> $1::vector) as similarity
        FROM products p
        WHERE ${whereClause}
        ORDER BY p.embedding <=> $1::vector
        LIMIT $${params.length - 1}
        OFFSET $${params.length}
      `, ...params)

      // Transform results
      const searchResults: VectorSearchResult[] = results.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        brand: r.brand || undefined,
        price: parseFloat(r.price),
        aiScore: r.ai_score ? parseFloat(r.ai_score) : 0,
        similarity: parseFloat(r.similarity),
        thumbnail: r.image_url || undefined
      }))

      const processingTime = Date.now() - startTime

      logger.info('Vector search completed', {
        query,
        resultsFound: searchResults.length,
        processingTime
      })

      return {
        query: {
          original: query,
          processed: query
        },
        results: searchResults,
        metadata: {
          totalFound: searchResults.length,
          processingTime,
          searchMethod: 'vector',
          filters: {
            categories: categoryFilter,
            priceRange,
            minAiScore
          }
        }
      }
    } catch (error) {
      logger.error('Vector search failed', {
        query: options.query,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Find similar products based on product ID
   */
  async findSimilar(
    productId: string,
    limit: number = 10,
    minSimilarity: number = 0.7
  ): Promise<VectorSearchResult[]> {
    try {
      logger.info('Finding similar products', { productId, limit })

      const results = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p2.id,
          p2.name,
          p2.category,
          p2.brand,
          p2.price,
          p2.ai_score,
          p2.image_url,
          1 - (p1.embedding <=> p2.embedding) as similarity
        FROM products p1
        CROSS JOIN products p2
        WHERE
          p1.id = $1
          AND p2.id != $1
          AND p1.embedding IS NOT NULL
          AND p2.embedding IS NOT NULL
          AND p2.is_available = true
          AND 1 - (p1.embedding <=> p2.embedding) >= $2
        ORDER BY p1.embedding <=> p2.embedding
        LIMIT $3
      `, productId, minSimilarity, limit)

      return results.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        brand: r.brand || undefined,
        price: parseFloat(r.price),
        aiScore: r.ai_score ? parseFloat(r.ai_score) : 0,
        similarity: parseFloat(r.similarity),
        thumbnail: r.image_url || undefined
      }))
    } catch (error) {
      logger.error('Find similar products failed', {
        productId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Hybrid search: Combines vector similarity, keyword matching, and AI scores
   */
  async hybridSearch(
    options: VectorSearchOptions & {
      weights?: {
        vector: number    // Semantic similarity weight
        keyword: number   // Text match weight
        aiScore: number   // Quality score weight
      }
    }
  ): Promise<VectorSearchResponse> {
    const startTime = Date.now()

    try {
      const {
        query,
        limit = 50,
        weights = { vector: 0.5, keyword: 0.3, aiScore: 0.2 }
      } = options

      logger.info('Hybrid search started', { query, weights })

      // Normalize weights
      const totalWeight = weights.vector + weights.keyword + weights.aiScore
      const normalizedWeights = {
        vector: weights.vector / totalWeight,
        keyword: weights.keyword / totalWeight,
        aiScore: weights.aiScore / totalWeight
      }

      // Get vector search results
      const vectorResults = await this.search({
        ...options,
        limit: limit * 2 // Get more for combining
      })

      // Get keyword search results
      const keywordResults = await this.keywordSearch(query, limit * 2, options)

      // Combine and re-rank
      const combinedResults = this.combineResults(
        vectorResults.results,
        keywordResults,
        normalizedWeights
      )

      // Sort by final score and limit
      combinedResults.sort((a, b) => (b as any).finalScore - (a as any).finalScore)
      const finalResults = combinedResults.slice(0, limit)

      const processingTime = Date.now() - startTime

      logger.info('Hybrid search completed', {
        query,
        resultsFound: finalResults.length,
        processingTime
      })

      return {
        query: {
          original: query,
          processed: query
        },
        results: finalResults,
        metadata: {
          totalFound: finalResults.length,
          processingTime,
          searchMethod: 'hybrid'
        }
      }
    } catch (error) {
      logger.error('Hybrid search failed', {
        query: options.query,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Traditional keyword search
   */
  private async keywordSearch(
    query: string,
    limit: number,
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    const where: any = {
      isAvailable: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } }
      ]
    }

    if (options.categoryFilter && options.categoryFilter.length > 0) {
      where.category = { in: options.categoryFilter }
    }

    if (options.priceRange) {
      where.price = {
        gte: options.priceRange.min,
        lte: options.priceRange.max
      }
    }

    if (options.minAiScore) {
      where.aiScore = { gte: options.minAiScore }
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        price: true,
        aiScore: true,
        imageUrl: true
      },
      take: limit,
      orderBy: [
        { aiScore: 'desc' },
        { viewCount: 'desc' }
      ]
    })

    return products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      brand: p.brand || undefined,
      price: p.price,
      aiScore: p.aiScore || 0,
      similarity: 0, // No similarity for keyword search
      thumbnail: p.imageUrl || undefined
    }))
  }

  /**
   * Combine results from vector and keyword search with weighted scoring
   */
  private combineResults(
    vectorResults: VectorSearchResult[],
    keywordResults: VectorSearchResult[],
    weights: { vector: number; keyword: number; aiScore: number }
  ): VectorSearchResult[] {
    const scoreMap = new Map<string, {
      product: VectorSearchResult
      scores: { vector: number; keyword: number; ai: number }
    }>()

    // Add vector search scores
    vectorResults.forEach((result, index) => {
      const vectorScore = result.similarity * weights.vector
      scoreMap.set(result.id, {
        product: result,
        scores: { vector: vectorScore, keyword: 0, ai: 0 }
      })
    })

    // Add keyword search scores
    keywordResults.forEach((result, index) => {
      const keywordScore = (1 - index / keywordResults.length) * weights.keyword
      const existing = scoreMap.get(result.id)

      if (existing) {
        existing.scores.keyword = keywordScore
      } else {
        scoreMap.set(result.id, {
          product: result,
          scores: { vector: 0, keyword: keywordScore, ai: 0 }
        })
      }
    })

    // Add AI score weight
    scoreMap.forEach((value) => {
      value.scores.ai = (value.product.aiScore / 100) * weights.aiScore
    })

    // Calculate final scores and return sorted results
    const rankedResults = Array.from(scoreMap.values())
      .map(({ product, scores }) => ({
        ...product,
        finalScore: scores.vector + scores.keyword + scores.ai,
        scoreBreakdown: scores
      }))

    return rankedResults
  }

  /**
   * Search within a specific category
   */
  async searchByCategory(
    query: string,
    category: string,
    limit: number = 50
  ): Promise<VectorSearchResponse> {
    return this.search({
      query,
      limit,
      categoryFilter: [category]
    })
  }

  /**
   * Search within a price range
   */
  async searchByPriceRange(
    query: string,
    minPrice: number,
    maxPrice: number,
    limit: number = 50
  ): Promise<VectorSearchResponse> {
    return this.search({
      query,
      limit,
      priceRange: { min: minPrice, max: maxPrice }
    })
  }

  /**
   * Get recommendations based on user's search history or preferences
   */
  async getRecommendations(
    userQueries: string[],
    limit: number = 20
  ): Promise<VectorSearchResult[]> {
    try {
      // Combine user queries into a single profile
      const userProfile = userQueries.join('. ')

      // Generate embedding for user profile
      const profileEmbedding = await embeddingService.generateQueryEmbedding(userProfile)

      // Find products similar to user profile
      const results = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.id,
          p.name,
          p.category,
          p.brand,
          p.price,
          p.ai_score,
          p.image_url,
          1 - (p.embedding <=> $1::vector) as similarity
        FROM products p
        WHERE
          p.embedding IS NOT NULL
          AND p.is_available = true
        ORDER BY p.embedding <=> $1::vector
        LIMIT $2
      `, JSON.stringify(profileEmbedding), limit)

      return results.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        brand: r.brand || undefined,
        price: parseFloat(r.price),
        aiScore: r.ai_score ? parseFloat(r.ai_score) : 0,
        similarity: parseFloat(r.similarity),
        thumbnail: r.image_url || undefined
      }))
    } catch (error) {
      logger.error('Get recommendations failed', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Get search statistics
   */
  async getSearchStatistics(): Promise<{
    totalSearchableProducts: number
    avgSimilarityScore: number
    topCategories: Array<{ category: string; count: number }>
  }> {
    const [totalCount, topCategories] = await Promise.all([
      prisma.product.count({
        where: {
          isAvailable: true,
          embedding: { not: null }
        }
      }),
      prisma.product.groupBy({
        by: ['category'],
        where: {
          isAvailable: true,
          embedding: { not: null }
        },
        _count: true,
        orderBy: {
          _count: {
            category: 'desc'
          }
        },
        take: 10
      })
    ])

    return {
      totalSearchableProducts: totalCount,
      avgSimilarityScore: 0.75, // Placeholder - would need actual calculation
      topCategories: topCategories.map(tc => ({
        category: tc.category,
        count: tc._count
      }))
    }
  }
}

// Export singleton instance
export const vectorSearchService = new VectorSearchService()

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Calculate search relevance score
 */
export function calculateRelevanceScore(
  similarity: number,
  aiScore: number,
  popularityScore: number
): number {
  return (
    similarity * 0.6 +
    (aiScore / 100) * 0.3 +
    (popularityScore / 100) * 0.1
  )
}

/**
 * Boost scores based on user preferences
 */
export function applyUserPreferenceBoost(
  results: VectorSearchResult[],
  userPreferences: {
    favoriteCategories?: string[]
    favoriteBrands?: string[]
    priceRange?: { min: number; max: number }
  }
): VectorSearchResult[] {
  return results.map(result => {
    let boost = 0

    // Category boost
    if (userPreferences.favoriteCategories?.includes(result.category)) {
      boost += 0.1
    }

    // Brand boost
    if (result.brand && userPreferences.favoriteBrands?.includes(result.brand)) {
      boost += 0.15
    }

    // Price range boost
    if (userPreferences.priceRange) {
      const { min, max } = userPreferences.priceRange
      if (result.price >= min && result.price <= max) {
        boost += 0.1
      }
    }

    return {
      ...result,
      similarity: Math.min(1.0, result.similarity + boost)
    }
  })
}
