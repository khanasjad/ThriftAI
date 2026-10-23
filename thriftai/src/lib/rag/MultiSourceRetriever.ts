/**
 * Multi-Source Retriever
 *
 * Orchestrates retrieval from multiple sources (vector, SQL, APIs)
 * and fuses results using Reciprocal Rank Fusion.
 *
 * This is the heart of a production RAG system in 2026.
 *
 * Sources:
 * 1. Vector (Qdrant) - Semantic similarity
 * 2. SQL (Prisma) - Structured queries
 * 3. API (Optional) - Real-time marketplace data
 *
 * @author Veritas AI Team
 * @version 2.0.0
 */

import { logger } from '@/lib/logger';
import {
  Document,
  BaseRetriever,
  SourceConfig,
  FusionResult,
  RetrievalOptions
} from './types';
import { ReciprocalRankFusion, RRFResult, toDocuments } from './fusion/ReciprocalRankFusion';
import { VectorRetriever } from './retrievers/VectorRetriever';
import { SQLRetriever } from './retrievers/SQLRetriever';
import { qdrantClient } from '@/lib/vector/qdrant/QdrantClient';

export interface MultiSourceRetrieverConfig {
  sources: SourceConfig[];
  fusionK?: number;
  defaultLimit?: number;
  enableParallelRetrieval?: boolean;
}

export class MultiSourceRetriever {
  private config: Required<MultiSourceRetrieverConfig>;
  private rrf: ReciprocalRankFusion;

  constructor(config?: Partial<MultiSourceRetrieverConfig>) {
    // Initialize default sources
    const defaultSources: SourceConfig[] = [
      {
        name: 'vector',
        type: 'vector',
        retriever: new VectorRetriever(qdrantClient),
        weight: 0.4,
        enabled: true
      },
      {
        name: 'sql',
        type: 'sql',
        retriever: new SQLRetriever(),
        weight: 0.25,
        enabled: true
      }
    ];

    this.config = {
      sources: defaultSources,
      fusionK: 60,
      defaultLimit: 50,
      enableParallelRetrieval: true,
      ...config
    };

    this.rrf = new ReciprocalRankFusion({ k: this.config.fusionK });

    logger.info('MultiSourceRetriever initialized', {
      sources: this.config.sources.map(s => s.name),
      fusionK: this.config.fusionK
    });
  }

  /**
   * Retrieve and fuse results from all enabled sources
   */
  async retrieve(options: RetrievalOptions): Promise<FusionResult> {
    const startTime = Date.now();
    const { query, limit = this.config.defaultLimit } = options;

    try {
      // Get enabled sources
      const enabledSources = this.config.sources.filter(s => s.enabled);

      if (enabledSources.length === 0) {
        throw new Error('No retrieval sources enabled');
      }

      logger.info('Starting multi-source retrieval', {
        query,
        sources: enabledSources.map(s => s.name),
        limit
      });

      // Retrieve from all sources (parallel or sequential)
      const results = this.config.enableParallelRetrieval
        ? await this.retrieveParallel(enabledSources, query, limit)
        : await this.retrieveSequential(enabledSources, query, limit);

      // Extract result sets and weights
      const resultSets = results.map(r => r.documents);
      const weights = results.map(r => r.weight);

      // Fuse using RRF
      const rrfResults = this.rrf.fuse(resultSets, weights);

      // Convert to documents
      const fusedDocuments = toDocuments(rrfResults);

      const processingTime = Date.now() - startTime;

      logger.info('Multi-source retrieval completed', {
        query,
        totalResults: fusedDocuments.length,
        sources: enabledSources.map(s => s.name),
        processingTime
      });

      return {
        documents: fusedDocuments.slice(0, limit),
        fusionMethod: 'RRF',
        totalSources: enabledSources.length,
        processingTime
      };
    } catch (error) {
      logger.error('Multi-source retrieval failed', {
        query,
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  /**
   * Retrieve from all sources in parallel (faster)
   */
  private async retrieveParallel(
    sources: SourceConfig[],
    query: string,
    limit: number
  ): Promise<Array<{ documents: Document[]; weight: number }>> {
    const promises = sources.map(async source => {
      try {
        const documents = await source.retriever.retrieve(query, limit);
        return { documents, weight: source.weight };
      } catch (error) {
        logger.error(`${source.name} retrieval failed`, {
          error: error instanceof Error ? error.message : String(error)
        });
        return { documents: [], weight: source.weight };
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Retrieve from all sources sequentially (safer, for debugging)
   */
  private async retrieveSequential(
    sources: SourceConfig[],
    query: string,
    limit: number
  ): Promise<Array<{ documents: Document[]; weight: number }>> {
    const results: Array<{ documents: Document[]; weight: number }> = [];

    for (const source of sources) {
      try {
        const documents = await source.retriever.retrieve(query, limit);
        results.push({ documents, weight: source.weight });
      } catch (error) {
        logger.error(`${source.name} retrieval failed`, {
          error: error instanceof Error ? error.message : String(error)
        });
        results.push({ documents: [], weight: source.weight });
      }
    }

    return results;
  }

  /**
   * Add a custom retrieval source
   */
  addSource(config: SourceConfig): void {
    this.config.sources.push(config);
    logger.info('Source added', { name: config.name, type: config.type });
  }

  /**
   * Remove a source by name
   */
  removeSource(name: string): void {
    this.config.sources = this.config.sources.filter(s => s.name !== name);
    logger.info('Source removed', { name });
  }

  /**
   * Enable/disable a source
   */
  toggleSource(name: string, enabled: boolean): void {
    const source = this.config.sources.find(s => s.name === name);
    if (source) {
      source.enabled = enabled;
      logger.info('Source toggled', { name, enabled });
    }
  }

  /**
   * Update source weight
   */
  updateSourceWeight(name: string, weight: number): void {
    const source = this.config.sources.find(s => s.name === name);
    if (source) {
      source.weight = weight;
      logger.info('Source weight updated', { name, weight });
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<MultiSourceRetrieverConfig> {
    return { ...this.config };
  }

  /**
   * Get RRF instance for advanced usage
   */
  getRRF(): ReciprocalRankFusion {
    return this.rrf;
  }
}

// Export singleton with default configuration
export const multiSourceRetriever = new MultiSourceRetriever();
