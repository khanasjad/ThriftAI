/**
 * RAG System Types
 *
 * Type definitions for Retrieval-Augmented Generation components
 */

import { Product } from '@prisma/client';

// ============================================================================
// Chunk Types
// ============================================================================

export type ChunkType = 'core' | 'veritas' | 'seller' | 'specs' | 'reviews';

export interface Chunk {
  id: string;
  productId: string;
  type: ChunkType;
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
  createdAt: Date;
}

export interface ChunkMetadata {
  productId: string;
  productName: string;
  category: string;
  type: ChunkType;
  tokens?: number;
  importance?: number; // 0-1 score
  [key: string]: any;
}

// ============================================================================
// Retrieval Types
// ============================================================================

export type RetrievalSource = 'vector' | 'sql' | 'api' | 'graph';

export interface Document {
  id: string;
  content: string;
  score: number;
  source: RetrievalSource;
  metadata: Record<string, any>;
}

export interface RetrievalOptions {
  query: string;
  limit?: number;
  minScore?: number;
  filters?: Record<string, any>;
}

export interface BaseRetriever {
  retrieve(query: string, limit: number): Promise<Document[]>;
  name: string;
  weight: number;
}

// ============================================================================
// RAG Pipeline Types
// ============================================================================

export interface RAGContext {
  query: string;
  documents: Document[];
  chunks: Chunk[];
  metadata: {
    totalDocuments: number;
    sources: RetrievalSource[];
    processingTime: number;
  };
}

export interface RAGResponse {
  answer: string;
  context: RAGContext;
  confidence: number;
  sources: string[];
}

export interface RAGPipelineOptions {
  retrievalLimit?: number;
  rerankLimit?: number;
  enableReranking?: boolean;
  enableHybridSearch?: boolean;
  contextWindow?: number;
}

// ============================================================================
// Reranking Types
// ============================================================================

export interface RerankOptions {
  query: string;
  documents: Document[];
  topK?: number;
  model?: 'claude-haiku' | 'claude-sonnet' | 'cohere';
}

export interface RerankResult {
  document: Document;
  originalScore: number;
  rerankScore: number;
  finalScore: number;
}

// ============================================================================
// Multi-Source Retrieval Types
// ============================================================================

export interface SourceConfig {
  name: string;
  type: RetrievalSource;
  retriever: BaseRetriever;
  weight: number;
  enabled: boolean;
}

export interface FusionResult {
  documents: Document[];
  fusionMethod: 'RRF' | 'WeightedSum';
  totalSources: number;
  processingTime: number;
}

// ============================================================================
// Product Context Types (for chunking)
// ============================================================================

export interface ProductContext {
  product: Product;
  veritasScore?: any;
  seller?: any;
  reviews?: any[];
  dynamicSpecs?: Record<string, any>;
  companyMetrics?: Record<string, any>;
}

export interface ChunkingStrategy {
  maxTokensPerChunk: number;
  overlapTokens: number;
  preserveSemanticBoundaries: boolean;
  enableMetadataEnrichment: boolean;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchRequest {
  query: string;
  filters?: {
    categories?: string[];
    priceRange?: { min: number; max: number };
    brands?: string[];
    condition?: string[];
    minVeritasScore?: number;
    inStockOnly?: boolean;
  };
  options?: {
    limit?: number;
    offset?: number;
    enableHybridSearch?: boolean;
    enableReranking?: boolean;
    enablePersonalization?: boolean;
  };
  userId?: string;
}

export interface SearchResponse {
  query: SearchRequest;
  results: SearchResult[];
  metadata: SearchMetadata;
}

export interface SearchResult {
  product: Product;
  score: number;
  relevanceBreakdown?: {
    vectorSimilarity: number;
    keywordMatch: number;
    veritasScore: number;
    personalizedBoost: number;
  };
  chunks?: Chunk[];
  explanation?: string;
}

export interface SearchMetadata {
  totalResults: number;
  processingTime: number;
  sources: string[];
  filters: Record<string, any>;
  retrievalMethod: 'vector' | 'hybrid' | 'multi-source';
  rerankingApplied: boolean;
}
