// ThriftAI - AI-Enhanced Product Scoring System
// Comprehensive type definitions for advanced product analysis and scoring

// ===== Core Scoring Types =====

export interface ProductScores {
  overall: number // 0-100 overall recommendation score
  breakdown: {
    quality: QualityScore
    value: ValueScore
    design: DesignScore
    relevance: RelevanceScore
    sustainability: SustainabilityScore
    popularity: PopularityScore
    authenticity: AuthenticityScore
    availability: AvailabilityScore
  }
  personalizedAdjustments: PersonalizationFactors
  confidence: number // 0-100 confidence in the scoring
  reasoning: string[] // Array of explanatory reasons for the score
  scoringVersion: string // Version of scoring algorithm used
  processedAt: Date
}

// ===== Individual Score Categories =====

export interface QualityScore {
  score: number // 0-100
  factors: {
    materialQuality: number // Based on product description and brand reputation
    craftsmanship: number // Construction quality indicators
    durability: number // Expected lifespan assessment
    brandReputation: number // Brand quality standing
    warrantySupport: number // Warranty and support availability
    conditionAssessment: number // Current condition vs. original
  }
  confidence: number
  reasoning: string[]
}

export interface ValueScore {
  score: number // 0-100
  factors: {
    priceComparison: number // vs. similar products
    qualityToPrice: number // Quality-to-price ratio
    marketValue: number // Current market positioning
    discountValue: number // Savings vs. retail
    totalCostOfOwnership: number // Including maintenance, etc.
    investmentPotential: number // Potential value retention/appreciation
  }
  confidence: number
  reasoning: string[]
  priceAnalysis: {
    currentPrice: number
    estimatedRetailPrice: number
    marketAveragePrice: number
    pricePerformanceRatio: number
  }
}

export interface DesignScore {
  score: number // 0-100
  factors: {
    aestheticAppeal: number // Visual design quality
    functionalDesign: number // How well design serves purpose
    timelessness: number // Classic vs. trendy design
    versatility: number // How well it works with different styles
    uniqueness: number // Distinctive design elements
    brandStyling: number // Consistency with brand aesthetic
  }
  confidence: number
  reasoning: string[]
  styleMetrics: {
    colorHarmony: number
    proportionBalance: number
    detailQuality: number
    overallCohesion: number
  }
}

export interface RelevanceScore {
  score: number // 0-100
  factors: {
    queryMatch: number // How well it matches search query
    semanticSimilarity: number // Conceptual match to intent
    categoryAlignment: number // Category relevance
    attributeMatch: number // Specific attribute matching
    intentFulfillment: number // How well it serves user intent
    contextualRelevance: number // Situational appropriateness
  }
  confidence: number
  reasoning: string[]
  matchDetails: {
    exactMatches: string[]
    synonymMatches: string[]
    conceptualMatches: string[]
    missingAttributes: string[]
  }
}

export interface SustainabilityScore {
  score: number // 0-100
  factors: {
    environmentalImpact: number // Carbon footprint, resource usage
    materialSustainability: number // Eco-friendly materials
    productionEthics: number // Ethical manufacturing practices
    longevity: number // Expected product lifespan
    recyclability: number // End-of-life disposal options
    circularity: number // Contribution to circular economy
  }
  confidence: number
  reasoning: string[]
  impactMetrics: {
    carbonFootprintReduction: number // kg CO2 saved vs. new
    waterSaved: number // liters saved in production
    wasteReduction: number // kg waste diverted from landfills
    energySaved: number // kWh saved in manufacturing
  }
  certifications: string[] // Eco certifications held
}

export interface PopularityScore {
  score: number // 0-100
  factors: {
    salesVolume: number // Historical sales performance
    reviewCount: number // Number of user reviews
    ratingDistribution: number // Quality of rating spread
    socialMentions: number // Social media presence
    trendingStatus: number // Current trend relevance
    marketDemand: number // Current market demand level
  }
  confidence: number
  reasoning: string[]
  popularityMetrics: {
    averageRating: number
    totalReviews: number
    recentSalesVelocity: number
    socialEngagement: number
  }
}

export interface AuthenticityScore {
  score: number // 0-100
  factors: {
    sellerVerification: number // Seller trust level
    productAuthentication: number // Product authenticity indicators
    descriptionAccuracy: number // Description vs. actual product
    imageAuthenticity: number // Real vs. stock photos
    brandVerification: number // Official brand verification
    documentationProvided: number // Receipts, certificates, etc.
  }
  confidence: number
  reasoning: string[]
  verificationStatus: {
    sellerTrustLevel: 'high' | 'medium' | 'low'
    productVerified: boolean
    imageVerified: boolean
    documentationLevel: 'complete' | 'partial' | 'none'
  }
}

export interface AvailabilityScore {
  score: number // 0-100
  factors: {
    stockStatus: number // Current availability
    shippingSpeed: number // Delivery timeframe
    locationProximity: number // Distance to buyer
    sellerResponsiveness: number // Seller communication speed
    fulfillmentReliability: number // Seller fulfillment track record
    seasonalAvailability: number // Seasonal consideration
  }
  confidence: number
  reasoning: string[]
  availabilityDetails: {
    inStock: boolean
    estimatedShippingDays: number
    shippingCost: number
    pickupAvailable: boolean
    lastUpdated: Date
  }
}

// ===== Personalization and Context =====

export interface PersonalizationFactors {
  userPreferenceMatch: number // How well it matches user's stated preferences
  purchaseHistoryAlignment: number // Similar to past purchases
  sizeCompatibility: number // Size match to user profile
  styleCompatibility: number // Style preference alignment
  budgetAlignment: number // Price vs. user's typical spending
  brandAffinityBonus: number // User's preference for this brand
  contextualBonus: number // Seasonal, event, or need-based relevance
  totalAdjustment: number // Combined personalization adjustment
}

export interface UserProfile {
  id: string
  preferences: {
    brands: string[]
    priceRange: { min: number; max: number }
    styles: string[]
    colors: string[]
    sizes: string[]
    sustainability: 'low' | 'medium' | 'high'
    quality: 'budget' | 'mid-range' | 'premium'
    categories: string[]
  }
  history: {
    purchases: PurchaseHistory[]
    searches: SearchHistory[]
    ratings: ProductRating[]
    wishlist: WishlistItem[]
  }
  demographics: {
    ageRange: string
    location: string
    interests: string[]
    lifestyle: string[]
  }
  behaviorPatterns: {
    shoppingFrequency: 'low' | 'medium' | 'high'
    pricesensitivity: 'low' | 'medium' | 'high'
    brandLoyalty: 'low' | 'medium' | 'high'
    sustainabilityFocus: 'low' | 'medium' | 'high'
  }
}

export interface PurchaseHistory {
  productId: string
  category: string
  brand: string
  price: number
  purchaseDate: Date
  rating: number
  sustainability: boolean
}

export interface SearchHistory {
  query: string
  category?: string
  filters: Record<string, any>
  timestamp: Date
  clickedProducts: string[]
  purchased: string[]
}

export interface ProductRating {
  productId: string
  rating: number
  review?: string
  date: Date
  verifiedPurchase: boolean
}

export interface WishlistItem {
  productId: string
  addedDate: Date
  priceWhenAdded: number
  currentPrice: number
  stillAvailable: boolean
}

// ===== Search and Query Optimization =====

export interface SearchContext {
  query: string
  user?: UserProfile
  filters: SearchFilters
  sort: SortOptions
  pagination: PaginationOptions
  searchIntent: SearchIntent
  contextHints?: ContextHints
}

export interface SearchFilters {
  categories?: string[]
  brands?: string[]
  priceRange?: { min: number; max: number }
  condition?: string[]
  sizes?: string[]
  colors?: string[]
  location?: string
  sustainability?: boolean
  inStock?: boolean
  freeShipping?: boolean
}

export interface SortOptions {
  field: 'relevance' | 'price' | 'rating' | 'date' | 'popularity' | 'sustainability'
  direction: 'asc' | 'desc'
  secondarySort?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

export interface PaginationOptions {
  page: number
  limit: number
  offset: number
}

export interface SearchIntent {
  type: 'browse' | 'buy' | 'compare' | 'research' | 'gift' | 'replace'
  urgency: 'low' | 'medium' | 'high'
  budgetFlexibility: 'strict' | 'flexible' | 'unlimited'
  qualityExpectation: 'basic' | 'good' | 'premium'
  sustainabilityImportance: 'low' | 'medium' | 'high'
}

export interface ContextHints {
  season?: 'spring' | 'summer' | 'fall' | 'winter'
  occasion?: string
  giftRecipient?: 'self' | 'partner' | 'friend' | 'family' | 'colleague'
  replacementItem?: boolean
  specificNeed?: string
}

export interface QueryOptimization {
  originalQuery: string
  optimizedQuery: string
  enhancements: {
    synonyms: string[]
    brandNormalization: string[]
    sizeExtraction: string[]
    colorExtraction: string[]
    intentClassification: SearchIntent['type']
    budgetInference: number | null
    styleInference: string[]
    categoryInference: string[]
  }
  confidence: number
  reasoning: string
  processingTime: number
}

// ===== Product and Market Data =====

export interface MockAmazonProduct {
  asin: string
  title: string
  brand: string
  category: string
  price: {
    current: number
    original: number
    currency: 'USD'
    discountPercentage?: number
  }
  availability: {
    inStock: boolean
    quantity: number
    shippingDays: number
    shippingCost: number
    expeditedShipping?: boolean
  }
  specifications: {
    category: string
    subcategory?: string
    size?: string
    color?: string
    material?: string
    weight?: string
    dimensions?: string
    model?: string
    year?: number
  }
  reviews: {
    rating: number // 1-5 stars
    count: number
    verified: boolean
    recentRating?: number // Last 30 days
    ratingDistribution?: { [key: number]: number }
  }
  images: string[]
  description: string
  features?: string[]
  seller: {
    name: string
    rating: number
    totalSales: number
    fulfillment: 'Amazon' | 'Merchant'
    location?: string
    verified: boolean
  }
  sustainability: {
    ecoFriendly: boolean
    recyclable: boolean
    sustainableMaterials: boolean
    certifications: string[]
    carbonFootprint?: number
    ethicalProduction?: boolean
  }
  authenticity: {
    verified: boolean
    authenticityGuarantee: boolean
    returnPolicy: string
    warranty?: string
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    lastPriceUpdate: Date
    popularityRank?: number
    salesRank?: number
  }
}

export interface MarketData {
  averagePrice: number
  priceRange: { min: number; max: number }
  competitorPrices: number[]
  marketTrend: 'rising' | 'stable' | 'falling'
  seasonalFactors: number
  demandLevel: 'low' | 'medium' | 'high'
  supplyLevel: 'low' | 'medium' | 'high'
}

// ===== Enhanced Search Results =====

export interface EnhancedSearchResult {
  product: MockAmazonProduct
  scores: ProductScores
  analysis: AIProductAnalysis
  ranking: {
    position: number
    relevanceScore: number
    recommendationScore: number
    personalizedScore: number
    finalScore: number
  }
  metadata: {
    searchQuery: string
    optimizedQuery: string
    processingTime: number
    confidence: number
    scoringVersion: string
    aiModelUsed: string[]
  }
  recommendations: {
    buyingAdvice: string
    alternatives: AlternativeProduct[]
    complementaryItems: string[]
    priceAlert?: PriceAlert
  }
}

export interface AIProductAnalysis {
  deepInsights: {
    productSummary: string
    strengths: string[]
    weaknesses: string[]
    bestUseCase: string
    targetAudience: string[]
    valueProposition: string
  }
  comparativeAnalysis: {
    similarProducts: string[]
    competitiveAdvantages: string[]
    pricePositioning: string
    uniqueFeatures: string[]
    marketPosition: 'budget' | 'mid-range' | 'premium' | 'luxury'
  }
  recommendations: {
    buyingAdvice: string
    sizingGuidance: string
    styleAdvice: string
    careInstructions: string
    usageRecommendations: string[]
    alternatives: AlternativeProduct[]
  }
  sustainabilityInsights: {
    environmentalImpact: string
    ethicalProduction: string
    longevityAssessment: string
    recyclingOptions: string
    improvementSuggestions: string[]
  }
  riskAssessment: {
    purchaseRisks: string[]
    riskLevel: 'low' | 'medium' | 'high'
    mitigationAdvice: string[]
  }
}

export interface AlternativeProduct {
  asin: string
  title: string
  price: number
  reason: string
  advantages: string[]
  overallScore: number
}

export interface PriceAlert {
  type: 'good_deal' | 'price_drop' | 'trending_up' | 'overpriced'
  message: string
  confidence: number
  historicalPricing?: {
    lowest: number
    highest: number
    average: number
    trendDirection: 'up' | 'down' | 'stable'
  }
}

// ===== API Response Types =====

export interface SearchResponse {
  query: {
    original: string
    optimized: string
    enhancements: QueryOptimization['enhancements']
  }
  results: EnhancedSearchResult[]
  metadata: {
    totalFound: number
    processingTime: number
    scoringVersion: string
    confidence: number
    aiModelsUsed: string[]
    paginationInfo: {
      currentPage: number
      totalPages: number
      hasNext: boolean
      hasPrevious: boolean
    }
  }
  suggestions?: {
    alternativeQueries: string[]
    categoryRecommendations: string[]
    brandSuggestions: string[]
    filterSuggestions: Record<string, string[]>
  }
}

export interface ScoringRequest {
  product: MockAmazonProduct
  userQuery: string
  userProfile?: UserProfile
  marketData?: MarketData
  contextHints?: ContextHints
}

export interface ScoringResponse {
  success: boolean
  scores?: ProductScores
  analysis?: AIProductAnalysis
  error?: string
  processingTime: number
  modelUsed: string
}

// ===== Analytics and Performance =====

export interface SearchAnalytics {
  id: string
  queryOriginal: string
  queryOptimized: string
  userId?: string
  resultsCount: number
  processingTimeMs: number
  claudeConfidence: number
  clickedProducts: string[]
  purchasedProducts: string[]
  conversionRate: number
  userSatisfaction?: number
  createdAt: Date
}

export interface PerformanceMetrics {
  avgProcessingTime: number
  avgConfidenceScore: number
  successRate: number
  userSatisfactionScore: number
  conversionRate: number
  popularQueries: { query: string; count: number }[]
  topPerformingProducts: string[]
}

// ===== Error Handling =====

export interface ScoringError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
  requestId: string
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

// ===== Utility Types =====

export type ScoreCategory = keyof ProductScores['breakdown']
export type UserPreferenceKey = keyof UserProfile['preferences']
export type ProductCondition = 'new' | 'excellent' | 'good' | 'fair' | 'poor'
export type PriceRange = { min: number; max: number }
export type ConfidenceLevel = 'low' | 'medium' | 'high'

// Type guards and utilities
export const isValidScore = (score: number): boolean => score >= 0 && score <= 100
export const isValidConfidence = (confidence: number): boolean => confidence >= 0 && confidence <= 100
export const isValidPrice = (price: number): boolean => price >= 0

// Default values
export const DEFAULT_SCORE: ProductScores = {
  overall: 0,
  breakdown: {
    quality: { score: 0, factors: { materialQuality: 0, craftsmanship: 0, durability: 0, brandReputation: 0, warrantySupport: 0, conditionAssessment: 0 }, confidence: 0, reasoning: [] },
    value: { score: 0, factors: { priceComparison: 0, qualityToPrice: 0, marketValue: 0, discountValue: 0, totalCostOfOwnership: 0, investmentPotential: 0 }, confidence: 0, reasoning: [], priceAnalysis: { currentPrice: 0, estimatedRetailPrice: 0, marketAveragePrice: 0, pricePerformanceRatio: 0 } },
    design: { score: 0, factors: { aestheticAppeal: 0, functionalDesign: 0, timelessness: 0, versatility: 0, uniqueness: 0, brandStyling: 0 }, confidence: 0, reasoning: [], styleMetrics: { colorHarmony: 0, proportionBalance: 0, detailQuality: 0, overallCohesion: 0 } },
    relevance: { score: 0, factors: { queryMatch: 0, semanticSimilarity: 0, categoryAlignment: 0, attributeMatch: 0, intentFulfillment: 0, contextualRelevance: 0 }, confidence: 0, reasoning: [], matchDetails: { exactMatches: [], synonymMatches: [], conceptualMatches: [], missingAttributes: [] } },
    sustainability: { score: 0, factors: { environmentalImpact: 0, materialSustainability: 0, productionEthics: 0, longevity: 0, recyclability: 0, circularity: 0 }, confidence: 0, reasoning: [], impactMetrics: { carbonFootprintReduction: 0, waterSaved: 0, wasteReduction: 0, energySaved: 0 }, certifications: [] },
    popularity: { score: 0, factors: { salesVolume: 0, reviewCount: 0, ratingDistribution: 0, socialMentions: 0, trendingStatus: 0, marketDemand: 0 }, confidence: 0, reasoning: [], popularityMetrics: { averageRating: 0, totalReviews: 0, recentSalesVelocity: 0, socialEngagement: 0 } },
    authenticity: { score: 0, factors: { sellerVerification: 0, productAuthentication: 0, descriptionAccuracy: 0, imageAuthenticity: 0, brandVerification: 0, documentationProvided: 0 }, confidence: 0, reasoning: [], verificationStatus: { sellerTrustLevel: 'low', productVerified: false, imageVerified: false, documentationLevel: 'none' } },
    availability: { score: 0, factors: { stockStatus: 0, shippingSpeed: 0, locationProximity: 0, sellerResponsiveness: 0, fulfillmentReliability: 0, seasonalAvailability: 0 }, confidence: 0, reasoning: [], availabilityDetails: { inStock: false, estimatedShippingDays: 0, shippingCost: 0, pickupAvailable: false, lastUpdated: new Date() } }
  },
  personalizedAdjustments: {
    userPreferenceMatch: 0,
    purchaseHistoryAlignment: 0,
    sizeCompatibility: 0,
    styleCompatibility: 0,
    budgetAlignment: 0,
    brandAffinityBonus: 0,
    contextualBonus: 0,
    totalAdjustment: 0
  },
  confidence: 0,
  reasoning: [],
  scoringVersion: '1.0',
  processedAt: new Date()
}