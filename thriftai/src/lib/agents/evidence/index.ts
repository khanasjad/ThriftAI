/**
 * Evidence Agent - Main Exports
 *
 * This module provides evidence extraction capabilities for clothing reviews
 * based on a 27-factor taxonomy organized into 5 pillars.
 */

// Taxonomy
export {
  FACTOR_TAXONOMY,
  FactorPillar,
  getFactorByKey,
  getFactorsByPillar,
  getPillarTotalPoints,
  validateTaxonomy
} from './factor-taxonomy'

export type {
  Factor,
  FactorSignal
} from './factor-taxonomy'

// Types
export {
  ConfidenceLevel,
  EvidenceSource
} from './evidence-types'

export type {
  ExtractedEvidence,
  EvidenceExtractionInput,
  EvidenceExtractionOutput,
  BatchExtractionResult
} from './evidence-types'

// Agent
export {
  extractEvidence,
  extractEvidenceBatch,
  validateEvidence
} from './evidence-agent'

// Batch Processing
export {
  processBatch,
  processProduct,
  getProcessingStatus
} from './batch-processor'

export type {
  BatchProcessorOptions,
  BatchProcessorStats
} from './batch-processor'
