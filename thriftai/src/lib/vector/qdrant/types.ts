/**
 * Qdrant Vector Database Types
 *
 * Type definitions for Qdrant integration in Veritas
 */

export interface QdrantConfig {
  url: string;
  apiKey?: string;
  timeout?: number;
}

export interface CollectionConfig {
  name: string;
  vectorSize: number;
  distance: 'Cosine' | 'Euclid' | 'Dot';
  hnswConfig?: HNSWConfig;
  optimizersConfig?: OptimizersConfig;
  enableSparseVectors?: boolean;
}

export interface HNSWConfig {
  m?: number;              // Number of edges per node (default: 16)
  efConstruct?: number;    // Construction search quality (default: 100)
  fullScanThreshold?: number; // Switch to HNSW after N vectors (default: 10000)
  maxIndexingThreads?: number;
}

export interface OptimizersConfig {
  indexingThreshold?: number;  // Start HNSW after N vectors (default: 20000)
  memmapThreshold?: number;    // Memory-map after N vectors (default: 50000)
}

export interface VectorPoint {
  id: string | number;
  vector: number[] | { dense: number[]; sparse?: Record<string, number> };
  payload?: Record<string, any>;
}

export interface SearchParams {
  query: string | number[];
  filter?: QdrantFilter;
  limit?: number;
  offset?: number;
  withPayload?: boolean;
  withVector?: boolean;
  scoreThreshold?: number;
}

export interface QdrantFilter {
  must?: FilterCondition[];
  should?: FilterCondition[];
  mustNot?: FilterCondition[];
}

export interface FilterCondition {
  key: string;
  match?: { value: any } | { any: any[] };
  range?: { gte?: number; lte?: number; gt?: number; lt?: number };
}

export interface SearchResult {
  id: string | number;
  score: number;
  payload?: Record<string, any>;
  vector?: number[];
}

export interface HybridSearchParams extends SearchParams {
  sparseVector?: Record<string, number>;
  fusion?: 'RRF' | 'WeightedSum';
  alpha?: number; // Weight for dense vector (0-1), 1-alpha for sparse
}

// Product-specific types
export interface ProductVector {
  productId: string;
  denseEmbedding: number[];
  sparseEmbedding?: Record<string, number>;
  metadata: ProductMetadata;
}

export interface ProductMetadata {
  name: string;
  category: string;
  brand?: string;
  price: number;
  veritasScore?: number;
  condition?: string;
  tags?: string[];
  inStock: boolean;
  sellerId?: string;
  createdAt: string;
}

export interface ProductSearchResult extends SearchResult {
  payload: ProductMetadata;
}

// Batch operation types
export interface BatchUpsertOptions {
  batchSize?: number;
  waitForIndexing?: boolean;
  ordering?: 'weak' | 'medium' | 'strong';
}

export interface BatchDeleteOptions {
  batchSize?: number;
}

// Health check
export interface HealthStatus {
  status: 'ok' | 'error';
  version?: string;
  collections?: number;
  uptime?: number;
}

// Collection info
export interface CollectionInfo {
  name: string;
  vectorCount: number;
  indexedVectorCount: number;
  pointsCount: number;
  segmentsCount: number;
  config: {
    params: {
      vectorSize: number;
      distance: string;
    };
  };
  status: 'green' | 'yellow' | 'red';
}
