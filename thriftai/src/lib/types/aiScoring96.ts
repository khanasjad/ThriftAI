/**
 * 96-Parameter AI Scoring System - Type Definitions
 *
 * This file contains all type definitions for the advanced AI scoring system
 * that evaluates products based on 96 parameters:
 * - 46 existing parameters (product, seller, reviews, etc.)
 * - 25 company-level parameters (financial, ESG, growth)
 * - 25 dynamic product-specific parameters (category-dependent)
 */

// ========================================
// COMPANY METRICS (25 Parameters)
// ========================================

export interface CompanyMetrics {
  // Financial Health (8 parameters)
  stockPrice?: number                // Current stock price (USD)
  stockPerformance30d?: number       // 30-day price change (%)
  stockPerformance1y?: number        // 1-year price change (%)
  marketCap?: number                 // Market capitalization (billions USD)
  revenueGrowth?: number             // Year-over-year revenue growth (%)
  profitMargin?: number              // Net profit margin (%)
  debtToEquity?: number              // Debt-to-equity ratio
  creditRating?: string              // Credit rating (AAA, AA, A, BBB, etc.)

  // Growth & Innovation (5 parameters)
  rdInvestment?: number              // R&D as % of revenue
  newProductLaunchRate?: number      // New products per year
  patentCount?: number               // Active patents held
  marketShare?: number               // Market share in category (%)
  industryAwards?: number            // Major awards won (last 2 years)

  // Sustainability & ESG (7 parameters)
  esgScore?: number                  // Overall ESG score (0-100)
  carbonFootprint?: number           // Total GHG emissions (million tons CO2e)
  renewableEnergy?: number           // Renewable energy usage (%)
  wasteDiversion?: number            // Waste diverted from landfills (%)
  waterEfficiency?: number           // Water usage per $ revenue (liters)
  supplierSustainability?: number    // Supplier sustainability score (0-100)
  circularEconomy?: number           // Circular economy programs count

  // Social Responsibility (3 parameters)
  fairLabor?: number                 // Fair labor practices score (0-100)
  diversityInclusion?: number        // Diversity & inclusion score (0-100)
  communityInvestment?: number       // Community investment (% of profit)

  // Risk & Compliance (2 parameters)
  legalViolations?: number           // Major violations (last 5 years)
  productRecallRate?: number         // Product recall rate (%)

  // Metadata
  lastUpdated?: string               // ISO timestamp of last update
  dataSource?: string                // Source of data (Bloomberg, Yahoo, etc.)
}

// ========================================
// DYNAMIC PRODUCT SPECS (25 Parameters)
// ========================================

// Electronics Specs (10 parameters)
export interface ElectronicsSpecs {
  cpu?: string                       // Processor name/model
  cpuBenchmark?: number              // Performance benchmark score
  ram?: number                       // RAM capacity (GB)
  storage?: string                   // Storage capacity and type (e.g., "512GB SSD")
  screen?: string                    // Screen size and resolution
  screenType?: string                // OLED, LCD, IPS, etc.
  battery?: string                   // Battery capacity and life
  camera?: string                    // Camera specifications
  connectivity?: string[]            // 5G, WiFi 6E, Bluetooth, etc.
  os?: string                        // Operating system and version
  waterproof?: string                // IP rating (IP68, etc.)
  gpu?: string                       // Graphics card (for laptops/desktops)
}

// Clothing Specs (4 parameters)
export interface ClothingSpecs {
  fabric?: string                    // Material composition
  fabricComposition?: Array<{        // Detailed breakdown
    material: string
    percentage: number
  }>
  sizeAccuracy?: string              // Fit accuracy (true to size, runs small, etc.)
  sizeAccuracyScore?: number         // % of reviewers agreeing (0-100)
  careInstructions?: string          // Washing/care requirements
  colorFastness?: number             // Color durability rating (1-5)
}

// Shoes Specs (4 parameters)
export interface ShoesSpecs {
  soleMaterial?: string              // Sole material and type
  gripRating?: number                // Grip/traction rating (1-5)
  cushioning?: string                // Cushioning technology
  weight?: number                    // Weight per shoe (grams)
  breathability?: number             // Breathability rating (1-5)
}

// Home & Kitchen Specs (4 parameters)
export interface HomeKitchenSpecs {
  materialSafety?: string[]          // Safety certifications (BPA-free, FDA, etc.)
  capacity?: string                  // Volume/capacity (ml, L, oz)
  insulation?: string                // Insulation performance
  dishwasherSafe?: boolean           // Dishwasher compatibility
}

// Sports & Fitness Specs (2 parameters)
export interface SportsSpecs {
  durability?: number                // Durability rating (1-5)
  weatherResistance?: string         // Weather resistance specs
}

// Universal Specs (1 parameter)
export interface UniversalSpecs {
  aiDetectedFeatures?: string[]      // AI-extracted unique features
}

// Combined Dynamic Specs Type
export type DynamicSpecs =
  | ElectronicsSpecs
  | ClothingSpecs
  | ShoesSpecs
  | HomeKitchenSpecs
  | SportsSpecs
  | (ElectronicsSpecs & UniversalSpecs)
  | (ClothingSpecs & UniversalSpecs)
  | (ShoesSpecs & UniversalSpecs)
  | (HomeKitchenSpecs & UniversalSpecs)
  | (SportsSpecs & UniversalSpecs)
  | UniversalSpecs

// ========================================
// AI SCORE BREAKDOWN (96 Parameters Combined)
// ========================================

export interface AIScoreBreakdown {
  // ===== EXISTING 46 PARAMETERS =====

  // Price & Value (8 params)
  priceValue: {
    score: number                    // 0-100
    currentPrice: number
    originalPrice?: number
    discountPercentage?: number
    marketAveragePrice?: number
    priceCompetitiveness: number     // vs market
    freeShippingBonus: number
    charmPricingBonus: number        // .99 pricing psychology
  }

  // Seller Trust & Reputation (7 params)
  trustScore: {
    score: number                    // 0-100
    sellerRating: number             // 0-5
    totalSales: number
    responseTimeHours: number
    returnPeriodDays: number
    freeReturns: boolean
    verificationStatus: boolean
    accountAge: number               // days
  }

  // Product Quality (6 params)
  qualityScore: {
    score: number                    // 0-100
    condition: string                // new, like-new, excellent, etc.
    hasWarranty: boolean
    warrantyMonths?: number
    isAuthentic: boolean
    certificationCount: number
    brandPremium: number             // Brand reputation score
  }

  // Social Proof & Reviews (7 params)
  socialProof: {
    score: number                    // 0-100
    rating: number                   // 0-5
    reviewCount: number
    recentReviewCount: number        // last 30 days
    verifiedPurchaseRatio: number    // 0-1
    ratingDistribution?: number[]    // [1star, 2star, 3star, 4star, 5star]
    socialMediaMentions: number
    reviewSentiment: number          // -1 to 1
  }

  // Shipping & Delivery (6 params)
  convenience: {
    score: number                    // 0-100
    estimatedDeliveryDays: number
    hasFreeShipping: boolean
    hasFastShipping: boolean
    hasTracking: boolean
    shippingCost: number
    inStock: boolean
  }

  // Availability & Urgency (5 params)
  urgency: {
    score: number                    // 0-100
    stockLevel: number
    viewsLast24h: number
    salesLast7Days: number
    cartAdditionsLast24h: number
    scarcityMultiplier: number       // Urgency boost
  }

  // Search Relevance (4 params)
  relevance: {
    score: number                    // 0-100
    clickThroughRate: number         // 0-1
    conversionRate: number           // 0-1
    bounceRate: number               // 0-1
    queryMatchScore: number          // How well it matches search query
  }

  // Emotional & Brand (3 params)
  emotional: {
    score: number                    // 0-100
    brandRecognition: number
    sustainability: boolean
    madeInPreferredCountry: boolean
    emotionalAppealScore: number
  }

  // ===== COMPANY PARAMETERS (25) =====

  companyFinancialHealth: {
    score: number                    // 0-100
    metrics: Partial<CompanyMetrics> // Financial metrics
  }

  companyGrowth: {
    score: number                    // 0-100
    metrics: Partial<CompanyMetrics> // Growth metrics
  }

  companySustainability: {
    score: number                    // 0-100
    metrics: Partial<CompanyMetrics> // ESG metrics
  }

  companySocialResponsibility: {
    score: number                    // 0-100
    metrics: Partial<CompanyMetrics> // Social metrics
  }

  companyRisk: {
    score: number                    // 0-100 (higher = lower risk)
    metrics: Partial<CompanyMetrics> // Risk metrics
  }

  // ===== DYNAMIC PARAMETERS (25) =====

  dynamicProductSpecs: {
    score: number                    // 0-100
    category: string                 // Product category
    specs: DynamicSpecs              // Category-specific specs
    specScores: Record<string, number> // Individual spec scores
  }

  // ===== METADATA =====

  totalParameters: number            // Should be 96
  parametersUsed: number             // Actual params available
  missingParameters: string[]        // List of missing params
}

// ========================================
// AI SCORING RESULT
// ========================================

export interface AIScoreResult {
  // Overall score
  aiScore: number                    // 0-100 weighted average
  confidence: number                 // 0-1 based on data completeness

  // Detailed breakdown
  breakdown: AIScoreBreakdown

  // Recommendation
  recommendation: 'strong-buy' | 'buy' | 'consider' | 'wait' | 'avoid'

  // Human-readable insights
  insights: string[]                 // Top insights for users

  // Strengths and weaknesses
  strengths: string[]
  weaknesses: string[]

  // Metadata
  scoringVersion: string             // Algorithm version
  scoredAt: string                   // ISO timestamp
  processingTimeMs: number           // Time taken to score
}

// ========================================
// LEADERBOARD TYPES
// ========================================

export interface LeaderboardProduct {
  id: string
  name: string
  category: string
  brand?: string
  price: number
  originalPrice?: number
  imageUrl?: string

  // Rankings
  globalRank?: number
  categoryRank?: number
  priceTierRank?: number

  // Scores
  aiScore: number
  aiConfidence?: number

  // Badges
  badges: string[]                   // ['Best Value', 'Eco-Friendly', etc.]

  // Timestamps
  createdAt: string
  lastScoredAt?: string
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardProduct[]
  metadata: {
    type: 'global' | 'category' | 'price_tier'
    category?: string
    priceTier?: 'budget' | 'mid' | 'premium' | 'luxury'
    limit: number
    offset: number
    totalCount: number
    generatedAt: string
    nextRefresh?: string
  }
}

// ========================================
// VECTOR SEARCH TYPES
// ========================================

export interface VectorSearchOptions {
  query: string
  limit?: number
  offset?: number
  categoryFilter?: string[]
  priceRange?: { min: number; max: number }
  minAiScore?: number
  similarityThreshold?: number       // 0-1, minimum cosine similarity
}

export interface VectorSearchResult {
  id: string
  name: string
  category: string
  brand?: string
  price: number
  aiScore: number
  similarity: number                 // 0-1, cosine similarity to query
  thumbnail?: string
}

export interface VectorSearchResponse {
  query: {
    original: string
    processed: string
    embedding?: number[]             // Query embedding (optional)
  }
  results: VectorSearchResult[]
  metadata: {
    totalFound: number
    processingTime: number           // ms
    searchMethod: 'vector' | 'hybrid' | 'keyword'
    filters?: {
      categories?: string[]
      priceRange?: { min: number; max: number }
      minAiScore?: number
    }
  }
}

// ========================================
// PRICE INTENT DETECTION
// ========================================

export interface PriceIntent {
  detected: boolean
  targetPrice: number
  range: { min: number; max: number }
  flexibility: 'strict' | 'moderate' | 'flexible'
  confidence: number                 // 0-1
}

export interface SmartSearchQuery {
  originalQuery: string
  productQuery: string               // Query with price terms removed
  priceIntent: PriceIntent
  categoryIntent?: string
  brandIntent?: string[]
}

// ========================================
// BATCH SCORING TYPES
// ========================================

export interface BatchScoringRequest {
  productIds?: string[]              // Specific products, or null for all
  forceRefresh?: boolean             // Skip cache
  concurrency?: number               // Parallel processing
  onProgress?: (progress: BatchScoringProgress) => void
}

export interface BatchScoringProgress {
  total: number
  processed: number
  successful: number
  failed: number
  currentProduct?: string
  estimatedTimeRemaining?: number    // seconds
}

export interface BatchScoringResult {
  totalProcessed: number
  successful: number
  failed: number
  errors: Array<{
    productId: string
    error: string
  }>
  averageScore: number
  processingTime: number             // ms
  startedAt: string
  completedAt: string
}

// ========================================
// EMBEDDING GENERATION TYPES
// ========================================

export interface EmbeddingGenerationRequest {
  productIds?: string[]              // Specific products, or null for all
  forceRegenerate?: boolean          // Regenerate existing embeddings
  batchSize?: number                 // Products per API call (max 100)
  onProgress?: (progress: EmbeddingProgress) => void
}

export interface EmbeddingProgress {
  total: number
  processed: number
  successful: number
  failed: number
  currentBatch?: number
  totalBatches?: number
  estimatedTimeRemaining?: number    // seconds
}

export interface EmbeddingGenerationResult {
  totalProcessed: number
  successful: number
  failed: number
  errors: Array<{
    productId: string
    error: string
  }>
  apiCalls: number
  tokensUsed: number
  estimatedCost: number              // USD
  processingTime: number             // ms
  startedAt: string
  completedAt: string
}

// ========================================
// SCORING WEIGHTS BY CATEGORY
// ========================================

export interface ScoringWeights {
  priceValue: number                 // 0-1
  trustScore: number
  qualityScore: number
  socialProof: number
  convenience: number
  urgency: number
  relevance: number
  emotional: number
  companyFinancialHealth: number
  companyGrowth: number
  companySustainability: number
  companySocialResponsibility: number
  companyRisk: number
  dynamicProductSpecs: number
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  priceValue: 0.20,                  // 20%
  trustScore: 0.15,                  // 15%
  qualityScore: 0.12,                // 12%
  socialProof: 0.12,                 // 12%
  convenience: 0.08,                 // 8%
  urgency: 0.03,                     // 3%
  relevance: 0.08,                   // 8%
  emotional: 0.04,                   // 4%
  companyFinancialHealth: 0.05,      // 5%
  companyGrowth: 0.03,               // 3%
  companySustainability: 0.04,       // 4%
  companySocialResponsibility: 0.03, // 3%
  companyRisk: 0.02,                 // 2%
  dynamicProductSpecs: 0.01          // 1%
}

// Category-specific weight adjustments
export const CATEGORY_WEIGHT_MULTIPLIERS: Record<string, Partial<ScoringWeights>> = {
  ELECTRONICS: {
    trustScore: 1.3,                 // Trust more important for expensive items
    qualityScore: 1.2,
    dynamicProductSpecs: 2.0,        // Specs very important
    priceValue: 0.9                  // Less price-sensitive
  },
  CLOTHING: {
    socialProof: 1.4,                // Reviews crucial for fit
    priceValue: 1.3,                 // Very price-sensitive
    dynamicProductSpecs: 1.5         // Material matters
  },
  SHOES: {
    socialProof: 1.5,                // Sizing info critical
    qualityScore: 1.3,               // Durability matters
    dynamicProductSpecs: 1.3
  },
  ACCESSORIES: {
    priceValue: 1.2,                 // Price-sensitive category
    emotional: 1.2                   // Brand appeal matters
  },
  HOME: {
    qualityScore: 1.3,               // Quality critical for home goods
    dynamicProductSpecs: 1.4         // Material safety important
  }
}

// ========================================
// STATISTICS & ANALYTICS
// ========================================

export interface AIScoringStatistics {
  totalProducts: number
  scoredProducts: number
  embeddedProducts: number
  avgAiScore: number
  minAiScore: number
  maxAiScore: number
  stdDevAiScore: number
  productsWithCompanyMetrics: number
  productsWithDynamicSpecs: number
  lastScoringRun?: string
  scoreDistribution: {
    excellent: number                // 80-100
    good: number                     // 65-79
    fair: number                     // 50-64
    poor: number                     // 35-49
    veryPoor: number                 // 0-34
  }
}

export interface CategoryStatistics {
  category: string
  productCount: number
  scoredCount: number
  avgScore: number
  minScore: number
  maxScore: number
  avgConfidence: number
  embeddedCount: number
  topProducts: LeaderboardProduct[]  // Top 3
}

// ========================================
// ERROR TYPES
// ========================================

export class ScoringError extends Error {
  constructor(
    message: string,
    public productId?: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ScoringError'
  }
}

export class EmbeddingError extends Error {
  constructor(
    message: string,
    public productId?: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'EmbeddingError'
  }
}

export class CompanyMetricsError extends Error {
  constructor(
    message: string,
    public companyName?: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'CompanyMetricsError'
  }
}

// ========================================
// UTILITY TYPES
// ========================================

export type ProductCategory =
  | 'ELECTRONICS'
  | 'CLOTHING'
  | 'SHOES'
  | 'ACCESSORIES'
  | 'HOME'
  | 'SPORTS'
  | 'BOOKS'
  | 'TOYS'
  | 'BEAUTY'
  | 'OTHER'

export type PriceTier = 'budget' | 'mid' | 'premium' | 'luxury'

export type LeaderboardBadge =
  | 'Best Value'
  | 'Eco-Friendly'
  | 'Top Seller'
  | 'Rising Star'
  | 'Premium Quality'
  | 'Fast Shipping'
  | 'Highly Rated'
  | 'Trending'

// ========================================
// EXPORT ALL TYPES
// ========================================

export type {
  CompanyMetrics,
  DynamicSpecs,
  ElectronicsSpecs,
  ClothingSpecs,
  ShoesSpecs,
  HomeKitchenSpecs,
  SportsSpecs,
  UniversalSpecs,
  AIScoreBreakdown,
  AIScoreResult,
  LeaderboardProduct,
  LeaderboardResponse,
  VectorSearchOptions,
  VectorSearchResult,
  VectorSearchResponse,
  PriceIntent,
  SmartSearchQuery,
  BatchScoringRequest,
  BatchScoringProgress,
  BatchScoringResult,
  EmbeddingGenerationRequest,
  EmbeddingProgress,
  EmbeddingGenerationResult,
  ScoringWeights,
  AIScoringStatistics,
  CategoryStatistics,
  ProductCategory,
  PriceTier,
  LeaderboardBadge
}
