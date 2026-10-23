/**
 * Qdrant Configuration
 *
 * Centralized configuration for Qdrant vector database
 */

import { QdrantConfig, CollectionConfig } from './types';

// Environment-based configuration
export const QDRANT_CONFIG: QdrantConfig = {
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 30000 // 30 seconds
};

// Veritas product collection configuration
export const PRODUCTS_COLLECTION_CONFIG: CollectionConfig = {
  name: process.env.QDRANT_COLLECTION_NAME || 'veritas_products_2026',
  vectorSize: 1536, // OpenAI text-embedding-3-large
  distance: 'Cosine',

  // HNSW Index configuration (optimized for 100K-1M products)
  hnswConfig: {
    m: 16,                    // Connections per layer (16 is good balance)
    efConstruct: 100,         // Build quality (higher = better but slower)
    fullScanThreshold: 10000, // Use HNSW after 10K vectors
    maxIndexingThreads: 0     // 0 = auto-detect CPU cores
  },

  // Optimizer configuration
  optimizersConfig: {
    indexingThreshold: 20000,  // Start HNSW indexing after 20K
    memmapThreshold: 50000     // Memory-map segments after 50K
  },

  // Enable sparse vectors for hybrid search (BM25-like)
  enableSparseVectors: true
};

// Chunks collection configuration (for RAG)
export const CHUNKS_COLLECTION_CONFIG: CollectionConfig = {
  name: 'veritas_chunks_2026',
  vectorSize: 1536,
  distance: 'Cosine',

  hnswConfig: {
    m: 16,
    efConstruct: 100,
    fullScanThreshold: 20000,
    maxIndexingThreads: 0
  },

  optimizersConfig: {
    indexingThreshold: 40000,
    memmapThreshold: 100000
  },

  enableSparseVectors: true
};

// User profiles collection (for personalization)
export const USER_PROFILES_COLLECTION_CONFIG: CollectionConfig = {
  name: 'veritas_user_profiles_2026',
  vectorSize: 1536,
  distance: 'Cosine',

  hnswConfig: {
    m: 8,              // Fewer connections for smaller dataset
    efConstruct: 50,
    fullScanThreshold: 5000,
    maxIndexingThreads: 0
  },

  optimizersConfig: {
    indexingThreshold: 10000,
    memmapThreshold: 20000
  },

  enableSparseVectors: false // User profiles don't need BM25
};

// Search performance tuning
export const SEARCH_DEFAULTS = {
  limit: 50,
  offset: 0,
  scoreThreshold: 0.5,  // Minimum similarity score
  withPayload: true,
  withVector: false,     // Don't return vectors by default (save bandwidth)
  efSearch: 128         // Search quality parameter for HNSW
};

// Hybrid search defaults
export const HYBRID_SEARCH_DEFAULTS = {
  ...SEARCH_DEFAULTS,
  alpha: 0.7,           // 70% dense, 30% sparse
  fusion: 'RRF' as const // Reciprocal Rank Fusion
};

// Batch operation defaults
export const BATCH_DEFAULTS = {
  upsertBatchSize: 100,
  deleteBatchSize: 100,
  waitForIndexing: true,
  ordering: 'weak' as const
};

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  maxSearchLatencyMs: 100,      // Alert if search > 100ms
  maxUpsertLatencyMs: 500,      // Alert if upsert > 500ms
  minAvailableMemoryMB: 512,    // Alert if < 512MB free
  maxCollectionSizeGB: 50       // Alert if collection > 50GB
};

// Feature flags
export const QDRANT_FEATURES = {
  enableHybridSearch: process.env.ENABLE_HYBRID_SEARCH !== 'false',
  enableSparseVectors: process.env.ENABLE_SPARSE_VECTORS !== 'false',
  enableQueryExpansion: process.env.ENABLE_QUERY_EXPANSION === 'true',
  enableReranking: process.env.ENABLE_RERANKING !== 'false',
  enableCaching: process.env.ENABLE_QDRANT_CACHE !== 'false'
};

// Cache configuration (Redis)
export const CACHE_CONFIG = {
  ttlSeconds: 3600,           // 1 hour
  maxCacheSize: 1000,          // Max 1000 cached queries
  cacheKeyPrefix: 'qdrant:',
  enableCacheWarming: true
};
