/**
 * B2B Vector Search Service
 *
 * Multi-tenant semantic search service using Qdrant vector database.
 * Integrates with the B2B SaaS platform to provide:
 * - Tenant-isolated vector search
 * - Hybrid search (dense + sparse vectors with RRF)
 * - Product embedding generation and indexing
 * - Search analytics and monitoring
 *
 * @version 1.0.0
 * @author Veritas B2B Team
 */

import { qdrantClient } from '@/lib/vector/qdrant/QdrantClient'
import { embeddingService } from '@/lib/services/embeddingService'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { PRODUCTS_COLLECTION_CONFIG } from '@/lib/vector/qdrant/config'
import {
  VectorPoint,
  SearchResult,
  HybridSearchParams,
  ProductMetadata
} from '@/lib/vector/qdrant/types'

// ========================================
// TYPES
// ========================================

export interface B2BSearchRequest {
  query: string
  tenantId: string
  limit?: number
  offset?: number
  filters?: {
    category?: string
    brand?: string
    priceRange?: { min: number; max: number }
    condition?: string
    minVeritasScore?: number
  }
  searchMode?: 'vector' | 'keyword' | 'hybrid'
}

export interface B2BSearchResult {
  id: string
  name: string
  category: string
  brand?: string
  price: number
  veritasScore?: number
  matchScore: number
  vectorScore?: number
  keywordScore?: number
  imageUrl?: string
  description?: string
  condition?: string
}

export interface B2BSearchResponse {
  query: {
    original: string
    processed: string
  }
  results: B2BSearchResult[]
  metadata: {
    total: number
    limit: number
    offset: number
    processingTime: number
    searchMethod: 'vector' | 'keyword' | 'hybrid'
    avgVeritasScore?: number
    qdrantLatency?: number
  }
}

export interface ProductIndexRequest {
  productId: string
  tenantId: string
}

export interface BatchIndexRequest {
  tenantId: string
  productIds?: string[]
  forceReindex?: boolean
}

// ========================================
// B2B VECTOR SEARCH SERVICE
// ========================================

export class B2BVectorSearchService {
  private collectionName: string

  constructor() {
    this.collectionName = PRODUCTS_COLLECTION_CONFIG.name
  }

  /**
   * Initialize Qdrant collection (should be run once on deployment)
   */
  async initializeCollection(): Promise<void> {
    try {
      logger.info('Initializing B2B vector search collection')
      await qdrantClient.initializeCollection(PRODUCTS_COLLECTION_CONFIG)
      logger.info('B2B vector search collection initialized')
    } catch (error) {
      logger.error('Failed to initialize collection', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Index a single product in Qdrant
   */
  async indexProduct(request: ProductIndexRequest): Promise<void> {
    const { productId, tenantId } = request

    try {
      logger.info('Indexing product in Qdrant', { productId, tenantId })

      // Fetch product from database
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          veritasScore: true
        }
      })

      if (!product) {
        throw new Error(`Product not found: ${productId}`)
      }

      // Verify tenant ownership
      if (product.tenantId !== tenantId) {
        throw new Error(`Product ${productId} does not belong to tenant ${tenantId}`)
      }

      // Generate embedding
      const embedding = await embeddingService.generateEmbedding(productId)

      // Prepare metadata
      const metadata: ProductMetadata = {
        name: product.name,
        category: product.category,
        brand: product.brand || undefined,
        price: Number(product.price),
        veritasScore: product.veritasScore?.overallScore
          ? Number(product.veritasScore.overallScore)
          : undefined,
        condition: product.condition || undefined,
        tags: product.tags || [],
        inStock: product.isAvailable,
        sellerId: product.tenantId || undefined,
        createdAt: product.createdAt.toISOString()
      }

      // Create vector point
      const point: VectorPoint = {
        id: productId,
        vector: embedding,
        payload: {
          ...metadata,
          tenantId: tenantId, // Critical for tenant isolation
          description: product.description,
          imageUrl: product.imageUrl
        }
      }

      // Upsert to Qdrant
      await qdrantClient.upsert(this.collectionName, point)

      logger.info('Product indexed successfully', { productId, tenantId })
    } catch (error) {
      logger.error('Failed to index product', {
        productId,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Batch index products for a tenant
   */
  async batchIndexProducts(request: BatchIndexRequest): Promise<{
    total: number
    successful: number
    failed: number
    errors: Array<{ productId: string; error: string }>
  }> {
    const { tenantId, productIds, forceReindex = false } = request

    try {
      logger.info('Starting batch indexing', { tenantId, forceReindex })

      // Get products to index
      const where: any = {
        tenantId,
        isAvailable: true
      }

      if (productIds && productIds.length > 0) {
        where.id = { in: productIds }
      }

      if (!forceReindex) {
        // Only index products without embeddings
        where.embedding = null
      }

      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          category: true,
          brand: true,
          price: true,
          description: true,
          condition: true,
          tags: true,
          imageUrl: true,
          isAvailable: true,
          tenantId: true,
          createdAt: true,
          veritasScore: {
            select: {
              overallScore: true
            }
          }
        }
      })

      logger.info('Products to index', { count: products.length })

      const result = {
        total: products.length,
        successful: 0,
        failed: 0,
        errors: [] as Array<{ productId: string; error: string }>
      }

      // Generate all embeddings in batch
      const productTexts = products.map(p =>
        embeddingService.generateProductText(p as any)
      )

      // Call OpenAI in batches of 100
      const BATCH_SIZE = 100
      const points: VectorPoint[] = []

      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE)
        const batchTexts = productTexts.slice(i, i + BATCH_SIZE)

        try {
          // Generate embeddings for batch
          const embeddings = await this.generateBatchEmbeddings(batchTexts)

          // Create vector points
          batch.forEach((product, idx) => {
            const metadata: ProductMetadata = {
              name: product.name,
              category: product.category,
              brand: product.brand || undefined,
              price: Number(product.price),
              veritasScore: product.veritasScore?.overallScore
                ? Number(product.veritasScore.overallScore)
                : undefined,
              condition: product.condition || undefined,
              tags: product.tags || [],
              inStock: product.isAvailable,
              sellerId: product.tenantId || undefined,
              createdAt: product.createdAt.toISOString()
            }

            points.push({
              id: product.id,
              vector: embeddings[idx],
              payload: {
                ...metadata,
                tenantId: product.tenantId,
                description: product.description,
                imageUrl: product.imageUrl
              }
            })
          })

          result.successful += batch.length
        } catch (error) {
          result.failed += batch.length
          batch.forEach(product => {
            result.errors.push({
              productId: product.id,
              error: error instanceof Error ? error.message : 'Batch embedding failed'
            })
          })
        }
      }

      // Batch upsert to Qdrant
      if (points.length > 0) {
        const upsertResult = await qdrantClient.batchUpsert(this.collectionName, points)
        logger.info('Batch upsert completed', upsertResult)
      }

      logger.info('Batch indexing completed', result)

      return result
    } catch (error) {
      logger.error('Batch indexing failed', {
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Vector search with tenant isolation
   */
  async search(request: B2BSearchRequest): Promise<B2BSearchResponse> {
    const startTime = Date.now()
    const {
      query,
      tenantId,
      limit = 20,
      offset = 0,
      filters = {},
      searchMode = 'keyword'
    } = request

    try {
      logger.info('B2B vector search', { query, tenantId, searchMode })

      let results: B2BSearchResult[] = []

      if (searchMode === 'vector') {
        results = await this.performVectorSearch(request)
      } else if (searchMode === 'keyword') {
        results = await this.performKeywordSearch(request)
      } else if (searchMode === 'hybrid') {
        results = await this.performHybridSearch(request)
      }

      const processingTime = Date.now() - startTime

      const avgVeritasScore =
        results.length > 0
          ? results
              .filter(r => r.veritasScore)
              .reduce((sum, r) => sum + (r.veritasScore || 0), 0) / results.length
          : 0

      return {
        query: {
          original: query,
          processed: query
        },
        results: results.slice(offset, offset + limit),
        metadata: {
          total: results.length,
          limit,
          offset,
          processingTime,
          searchMethod: searchMode,
          avgVeritasScore: Math.round(avgVeritasScore * 100) / 100
        }
      }
    } catch (error) {
      logger.error('B2B search failed', {
        query,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Perform vector similarity search in Qdrant
   */
  private async performVectorSearch(
    request: B2BSearchRequest
  ): Promise<B2BSearchResult[]> {
    const { query, tenantId, filters = {}, limit = 50 } = request

    // Generate query embedding
    const queryEmbedding = await embeddingService.generateQueryEmbedding(query)

    // Build Qdrant filter for tenant isolation
    const qdrantFilter: any = {
      must: [
        { key: 'tenantId', match: { value: tenantId } }, // Tenant isolation
        { key: 'inStock', match: { value: true } }
      ]
    }

    if (filters.category) {
      qdrantFilter.must.push({
        key: 'category',
        match: { value: filters.category }
      })
    }

    if (filters.brand) {
      qdrantFilter.must.push({
        key: 'brand',
        match: { value: filters.brand }
      })
    }

    if (filters.condition) {
      qdrantFilter.must.push({
        key: 'condition',
        match: { value: filters.condition }
      })
    }

    if (filters.priceRange) {
      qdrantFilter.must.push({
        key: 'price',
        range: {
          gte: filters.priceRange.min,
          lte: filters.priceRange.max
        }
      })
    }

    if (filters.minVeritasScore) {
      qdrantFilter.must.push({
        key: 'veritasScore',
        range: {
          gte: filters.minVeritasScore
        }
      })
    }

    // Search Qdrant
    const searchResults = await qdrantClient.search(this.collectionName, {
      query: queryEmbedding,
      filter: qdrantFilter,
      limit,
      withPayload: true,
      scoreThreshold: 0.5
    })

    // Transform results
    return searchResults.map(r => ({
      id: String(r.id),
      name: r.payload?.name || '',
      category: r.payload?.category || '',
      brand: r.payload?.brand,
      price: r.payload?.price || 0,
      veritasScore: r.payload?.veritasScore,
      matchScore: Math.round(r.score * 100),
      vectorScore: r.score,
      imageUrl: r.payload?.imageUrl,
      description: r.payload?.description,
      condition: r.payload?.condition
    }))
  }

  /**
   * Perform hybrid search using RRF (Reciprocal Rank Fusion)
   * Combines vector and keyword search results
   */
  private async performHybridSearch(
    request: B2BSearchRequest
  ): Promise<B2BSearchResult[]> {
    const { query, tenantId, filters = {}, limit = 50 } = request

    // Run vector and keyword searches in parallel
    const [vectorResults, keywordResults] = await Promise.all([
      this.performVectorSearch({ ...request, limit: limit * 2 }),
      this.performKeywordSearch({ ...request, limit: limit * 2 })
    ])

    // Apply Reciprocal Rank Fusion (RRF)
    const k = 60 // RRF constant (standard value)
    const scoreMap = new Map<string, {
      product: B2BSearchResult
      rrfScore: number
      vectorRank?: number
      keywordRank?: number
    }>()

    // Add vector search results with RRF scoring
    vectorResults.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1)
      scoreMap.set(result.id, {
        product: result,
        rrfScore,
        vectorRank: index + 1
      })
    })

    // Add keyword search results with RRF scoring
    keywordResults.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1)
      const existing = scoreMap.get(result.id)

      if (existing) {
        // Product appears in both results - boost score
        existing.rrfScore += rrfScore
        existing.keywordRank = index + 1
      } else {
        scoreMap.set(result.id, {
          product: result,
          rrfScore,
          keywordRank: index + 1
        })
      }
    })

    // Sort by RRF score and calculate final match scores
    const fusedResults = Array.from(scoreMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .map(item => {
        // Normalize RRF score to 0-100 range
        const normalizedScore = Math.min(100, item.rrfScore * 1000)

        // Boost if product appears in both searches
        const boost = (item.vectorRank && item.keywordRank) ? 10 : 0

        return {
          ...item.product,
          matchScore: Math.round(normalizedScore + boost)
        }
      })

    return fusedResults.slice(0, limit)
  }

  /**
   * Perform keyword search (fallback)
   */
  private async performKeywordSearch(
    request: B2BSearchRequest
  ): Promise<B2BSearchResult[]> {
    const { query, tenantId, filters = {}, limit = 20 } = request

    const where: any = {
      tenantId,
      isAvailable: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } }
      ]
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.brand) {
      where.brand = { contains: filters.brand, mode: 'insensitive' }
    }

    if (filters.condition) {
      where.condition = filters.condition
    }

    if (filters.priceRange) {
      where.price = {
        gte: filters.priceRange.min,
        lte: filters.priceRange.max
      }
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        price: true,
        imageUrl: true,
        description: true,
        condition: true,
        veritasScore: {
          select: {
            overallScore: true
          }
        }
      },
      take: limit,
      orderBy: [{ aiScore: 'desc' }]
    })

    return products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      brand: p.brand || undefined,
      price: Number(p.price),
      veritasScore: p.veritasScore?.overallScore
        ? Number(p.veritasScore.overallScore)
        : undefined,
      matchScore: 50, // Base score for keyword matches
      imageUrl: p.imageUrl || undefined,
      description: p.description || undefined,
      condition: p.condition || undefined
    }))
  }

  /**
   * Generate embeddings for a batch of texts
   */
  private async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const openai = (embeddingService as any).openai

    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: texts,
      encoding_format: 'float'
    })

    return response.data.map(item => item.embedding)
  }

  /**
   * Delete product from Qdrant index
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await qdrantClient.delete(this.collectionName, productId)
      logger.info('Product deleted from Qdrant', { productId })
    } catch (error) {
      logger.error('Failed to delete product from Qdrant', {
        productId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Get collection statistics
   */
  async getStatistics(): Promise<{
    vectorCount: number
    indexedVectorCount: number
    status: string
  }> {
    try {
      const info = await qdrantClient.getCollectionInfo(this.collectionName)

      return {
        vectorCount: info.vectorCount,
        indexedVectorCount: info.indexedVectorCount,
        status: info.status
      }
    } catch (error) {
      logger.error('Failed to get statistics', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}

// Export singleton instance
export const b2bVectorSearchService = new B2BVectorSearchService()
