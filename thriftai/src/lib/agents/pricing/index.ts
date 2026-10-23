/**
 * Price & Value Agent - Main Exports
 *
 * This module provides price tracking, comparison, and fairness analysis
 * to generate evidence for Factor 14 (Price Fairness).
 */

// Types
export {
  Retailer,
  DEFAULT_PRICING_CONFIG
} from './pricing-types'

export type {
  PricePoint,
  PriceComparison,
  PriceHistory,
  PriceSnapshot,
  PriceFairnessEvidence,
  PricingConfig
} from './pricing-types'

// Price Comparison
export {
  comparePrices,
  generateMockPrices,
  formatPriceComparison
} from './price-comparison'

// Evidence Generation
export {
  generatePriceFairnessEvidence,
  generateBatchPriceFairnessEvidence,
  formatPriceEvidence
} from './price-evidence-generator'

// Pricing Engine (Database Integration)
export {
  analyzeProductPricing,
  analyzeAllProductPricing,
  getPriceHistory,
  getLatestPriceComparison
} from './pricing-engine'

export type {
  PricingEngineOptions,
  PricingEngineResult
} from './pricing-engine'
