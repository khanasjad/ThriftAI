/**
 * Vector Retriever
 *
 * Retrieves documents using Qdrant vector similarity search.
 * Supports both dense and hybrid (dense + sparse) search.
 */

import { QdrantClient } from '@/lib/vector/qdrant/QdrantClient';
import { embeddingService } from '@/lib/services/embeddingService';
import { logger } from '@/lib/logger';
import { Document, BaseRetriever } from '../types';
import { PRODUCTS_COLLECTION_CONFIG } from '@/lib/vector/qdrant/config';

export interface VectorRetrieverConfig {
  collectionName?: string;
  enableHybridSearch?: boolean;
  scoreThreshold?: number;
  alpha?: number; // Weight for dense vector (0-1)
}

export class VectorRetriever implements BaseRetriever {
  name = 'vector';
  weight = 0.4; // 40% weight in multi-source retrieval

  private qdrant: QdrantClient;
  private config: Required<VectorRetrieverConfig>;

  constructor(
    qdrant: QdrantClient,
    config?: Partial<VectorRetrieverConfig>
  ) {
    this.qdrant = qdrant;
    this.config = {
      collectionName: PRODUCTS_COLLECTION_CONFIG.name,
      enableHybridSearch: true,
      scoreThreshold: 0.5,
      alpha: 0.7, // 70% dense, 30% sparse
      ...config
    };
  }

  /**
   * Retrieve documents using vector similarity
   */
  async retrieve(query: string, limit: number = 50): Promise<Document[]> {
    const startTime = Date.now();

    try {
      // Generate query embedding
      const queryEmbedding = await embeddingService.generateQueryEmbedding(query);

      // Perform search (hybrid if enabled)
      const results = this.config.enableHybridSearch
        ? await this.hybridSearch(query, queryEmbedding, limit)
        : await this.denseSearch(queryEmbedding, limit);

      const processingTime = Date.now() - startTime;

      logger.debug('Vector retrieval completed', {
        query,
        resultsCount: results.length,
        hybridSearch: this.config.enableHybridSearch,
        processingTime
      });

      // Convert to Document format
      return results.map(r => ({
        id: r.id as string,
        content: this.buildContentFromPayload(r.payload),
        score: r.score,
        source: 'vector' as const,
        metadata: {
          ...r.payload,
          vectorScore: r.score,
          retrievalMethod: this.config.enableHybridSearch ? 'hybrid' : 'dense'
        }
      }));
    } catch (error) {
      logger.error('Vector retrieval failed', {
        query,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Dense vector search only
   */
  private async denseSearch(
    queryEmbedding: number[],
    limit: number
  ) {
    return await this.qdrant.search(this.config.collectionName, {
      query: queryEmbedding,
      limit,
      scoreThreshold: this.config.scoreThreshold,
      withPayload: true,
      withVector: false
    });
  }

  /**
   * Hybrid search (dense + sparse with RRF fusion)
   */
  private async hybridSearch(
    query: string,
    queryEmbedding: number[],
    limit: number
  ) {
    // Generate sparse vector (simple BM25-like)
    const sparseVector = this.generateSparseVector(query);

    return await this.qdrant.hybridSearch(this.config.collectionName, {
      query: queryEmbedding,
      sparseVector,
      limit,
      scoreThreshold: this.config.scoreThreshold,
      alpha: this.config.alpha,
      fusion: 'RRF',
      withPayload: true,
      withVector: false
    });
  }

  /**
   * Generate sparse vector for keyword matching (simplified BM25)
   */
  private generateSparseVector(query: string): Record<string, number> {
    const tokens = query.toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 2);

    const freq: Record<string, number> = {};

    tokens.forEach(token => {
      freq[token] = (freq[token] || 0) + 1;
    });

    // Simple TF weighting (in production, use full BM25 or SPLADE)
    const maxFreq = Math.max(...Object.values(freq));
    const normalized: Record<string, number> = {};

    Object.entries(freq).forEach(([token, count]) => {
      normalized[token] = count / maxFreq;
    });

    return normalized;
  }

  /**
   * Build content string from payload for RAG
   */
  private buildContentFromPayload(payload: any): string {
    const parts: string[] = [];

    if (payload.name) parts.push(`Product: ${payload.name}`);
    if (payload.brand) parts.push(`Brand: ${payload.brand}`);
    if (payload.category) parts.push(`Category: ${payload.category}`);
    if (payload.price) parts.push(`Price: $${payload.price}`);
    if (payload.veritasScore) parts.push(`Veritas Score: ${payload.veritasScore}/100`);
    if (payload.condition) parts.push(`Condition: ${payload.condition}`);

    return parts.join('. ');
  }
}
