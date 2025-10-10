/**
 * Veritas Score™ - Complete Type Definitions
 * All 121 parameters with full TypeScript safety
 *
 * @version 2.0.0
 * @author ThriftAI Team
 */

// =============================================================================
// CATEGORY 1: PRODUCT QUALITY (30 parameters, 25% weight)
// =============================================================================

export interface PhysicalConditionParams {
  // Sub-category 1.1: Physical Condition (12 params)
  overallCondition: 'New' | 'Like New' | 'Excellent' | 'Good' | 'Fair' | 'Poor'
  visualDefectsCount: number // AI-counted from photos
  visualDefectsDescription: string
  functionalCompleteness: number // 0-100, percentage of features working
  wearTearLevel: number // 1-10 slider
  missingComponents: string[] // Array of missing parts
  materialQuality: number // 0-100, brand-based
  screenCondition?: number // 0-100, for electronics
  bodyCaseCondition?: number // 0-100
  buttonPortFunctionality?: number // 0-100
  cameraQuality?: number // 0-100, for phones
  audioQuality?: number // 0-100
}

export interface AuthenticityParams {
  // Sub-category 1.2: Authenticity & Verification (8 params)
  authenticationStatus: 'Certified' | 'Verified' | 'Unverified' | 'Suspected Counterfeit'
  serialNumberValid: boolean
  serialNumber?: string
  serviceTag?: string
  counterfeitRiskScore: number // 0-100, calculated
  documentationComplete: boolean
  certificationBadges: string[] // ['Apple Certified', 'Dell Certified', etc.]
  hasOriginalPackaging: boolean
  hasOriginalAccessories: boolean
}

export interface FunctionalTestingParams {
  // Sub-category 1.3: Functional Testing (6 params)
  hardwareFunctionality: number // 0-100, comprehensive test
  softwarePerformance: number // 0-100
  batteryHealthPercent?: number // 0-100, from device
  networkConnectivity: number // 0-100
  displayTestResult: number // 0-100, dead pixels test
  sensorFunctionality: number // 0-100
}

export interface AgeHistoryParams {
  // Sub-category 1.4: Age & History (4 params)
  productAgeMonths: number // Calculated or from API
  usageHoursCycles?: number // Battery cycles, screen time
  previousOwnerCount: number
  repairHistory: string
}

export interface ProductQualityScore {
  physicalCondition: PhysicalConditionParams
  authenticity: AuthenticityParams
  functionalTesting: FunctionalTestingParams
  ageHistory: AgeHistoryParams

  // Calculated scores
  categoryScore: number // 0-100
  confidence: number // 0-100
  dataQuality: number // 0-100
}

// =============================================================================
// CATEGORY 2: SELLER TRUST (25 parameters, 20% weight)
// =============================================================================

export interface SellerReputationParams {
  // Sub-category 2.1: Seller Reputation (8 params)
  sellerRating: number // 0-5.0
  transactionCount: number
  positiveFeedbackPercent: number // 0-100
  accountAgeYears: number
  isVerifiedSeller: boolean
  isTopRatedSeller: boolean
  isPowerSeller: boolean
  sellerLocation: string
}

export interface ResponseServiceParams {
  // Sub-category 2.2: Response & Service (6 params)
  responseTimeHours: number
  responseRatePercent: number // 0-100
  customerServiceQuality: number // 0-100, user rating
  communicationClarity: number // 0-100, user rating
  acceptsReturns: boolean
  problemResolution: number // 0-100, user rating
}

export interface TransactionHistoryParams {
  // Sub-category 2.3: Transaction History (6 params)
  disputeRatePercent: number // 0-100
  refundRatePercent: number // 0-100
  chargebackRatePercent: number // 0-100
  cancellationRatePercent: number // 0-100
  lateShipmentRatePercent: number // 0-100
  itemNotAsDescribedPercent: number // 0-100
}

export interface ReliabilityParams {
  // Sub-category 2.4: Reliability Indicators (5 params)
  onTimeShippingPercent: number // 0-100
  descriptionAccuracy: number // 0-100, user rating
  packagingQuality: number // 0-100, user rating
  providesTracking: boolean
  responsiveness: number // 1-10, user rating
}

export interface SellerTrustScore {
  reputation: SellerReputationParams
  responseService: ResponseServiceParams
  transactionHistory: TransactionHistoryParams
  reliability: ReliabilityParams

  categoryScore: number
  confidence: number
  dataQuality: number
}

// =============================================================================
// CATEGORY 3: MARKET VALUE (20 parameters, 15% weight)
// =============================================================================

export interface PricePositioningParams {
  // Sub-category 3.1: Price Positioning (7 params)
  currentPrice: number // USD
  originalMSRP: number // USD
  priceVsMarketAverage: number // Percentage difference
  discountPercentage: number // 0-100
  valueForMoneyIndex: number // Score/Price ratio
  priceTrend30Days: 'Rising' | 'Stable' | 'Falling'
  lowestHistoricalPrice: number // USD
}

export interface CompetitiveAnalysisParams {
  // Sub-category 3.2: Competitive Analysis (6 params)
  priceVsCompetitors: number // Percentage vs average
  competitorCount: number
  isBestPrice: boolean
  priceStabilityScore: number // 0-100, low variance = high
  marketAvailability: number // Number of sellers
  demandLevel: number // 0-100, popularity proxy
}

export interface TotalCostParams {
  // Sub-category 3.3: Total Cost of Ownership (4 params)
  shippingCost: number // USD
  taxAmount: number // USD
  hiddenFees: number // USD
  warrantyValue: number // USD equivalent
}

export interface MarketDynamicsParams {
  // Sub-category 3.4: Market Dynamics (3 params)
  priceTrendDirection: 'Rising' | 'Stable' | 'Falling'
  seasonalPricing: 'Peak' | 'Normal' | 'Off-Season'
  supplyLevel: 'Scarce' | 'Limited' | 'Normal' | 'Abundant'
}

export interface MarketValueScore {
  pricePositioning: PricePositioningParams
  competitiveAnalysis: CompetitiveAnalysisParams
  totalCost: TotalCostParams
  marketDynamics: MarketDynamicsParams

  categoryScore: number
  confidence: number
  dataQuality: number
}

// =============================================================================
// CATEGORY 4: SUSTAINABILITY (15 parameters, 12% weight)
// =============================================================================

export interface EnvironmentalImpactParams {
  // Sub-category 4.1: Environmental Impact (5 params)
  carbonFootprintReduction: number // Percentage vs new
  eWastePrevention: boolean
  resourceConservation: number // 0-100
  isEnergyStarCertified: boolean
  epeatRating?: 'Gold' | 'Silver' | 'Bronze' | null
}

export interface CircularEconomyParams {
  // Sub-category 4.2: Circular Economy (4 params)
  reuseFactor: number // 0-100, lifespan extension
  recyclingPotential: number // 0-100, material recyclability
  refurbishmentQuality: 'Professional' | 'Amateur' | 'None'
  secondHandMarketValue: number // Future resale value estimate
}

export interface ProductLongevityParams {
  // Sub-category 4.3: Product Longevity (4 params)
  expectedRemainingLifeYears: number
  repairabilityScore: number // 0-10, iFixit score
  partsAvailability: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  softwareSupportYears: number
}

export interface SustainabilityCertificationsParams {
  // Sub-category 4.4: Certifications (2 params)
  ecoCertifications: string[] // ['EPEAT Gold', 'Energy Star', etc.]
  hasRefurbCertification: boolean
}

export interface SustainabilityScore {
  environmentalImpact: EnvironmentalImpactParams
  circularEconomy: CircularEconomyParams
  productLongevity: ProductLongevityParams
  certifications: SustainabilityCertificationsParams

  categoryScore: number
  confidence: number
  dataQuality: number
}

// =============================================================================
// CATEGORY 5: SECURITY & SAFETY (8 parameters, 5% weight)
// =============================================================================

export interface PaymentSecurityParams {
  // Sub-category 5.1: Payment Security (2 params)
  paymentMethodSecurity: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  hasFraudProtection: boolean
}

export interface BuyerProtectionParams {
  // Sub-category 5.2: Buyer Protection (2 params)
  buyerProtectionPolicy: 'Full' | 'Partial' | 'None'
  disputeResolutionAvailable: boolean
}

export interface DataSecurityParams {
  // Sub-category 5.3: Data Security (2 params)
  isGDPRCompliant: boolean
  isDeviceFactoryReset: boolean
}

export interface PlatformTrustParams {
  // Sub-category 5.4: Platform Trust (2 params)
  platformReputation: number // 0-100, Trustpilot score
  sslGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface SecuritySafetyScore {
  paymentSecurity: PaymentSecurityParams
  buyerProtection: BuyerProtectionParams
  dataSecurity: DataSecurityParams
  platformTrust: PlatformTrustParams

  categoryScore: number
  confidence: number
  dataQuality: number
}

// =============================================================================
// CATEGORY 6: USER EXPERIENCE (8 parameters, 5% weight)
// =============================================================================

export interface ListingQualityParams {
  // Sub-category 6.1: Listing Quality (3 params)
  productPageQuality: number // 0-100, AI analysis
  descriptionCompleteness: number // 0-100, word count, detail
  transparencyScore: number // 0-100, disclosure quality
}

export interface VisualPresentationParams {
  // Sub-category 6.2: Visual Presentation (2 params)
  imageQualityScore: number // 0-100, AI analysis
  imageCount: number
}

export interface PurchaseExperienceParams {
  // Sub-category 6.3: Purchase Experience (2 params)
  checkoutEase: number // 0-100
  navigationQuality: number // 0-100
}

export interface CustomerSupportParams {
  // Sub-category 6.4: Customer Support (1 param)
  supportAccessibility: number // 0-100
}

export interface UserExperienceScore {
  listingQuality: ListingQualityParams
  visualPresentation: VisualPresentationParams
  purchaseExperience: PurchaseExperienceParams
  customerSupport: CustomerSupportParams

  categoryScore: number
  confidence: number
  dataQuality: number
}

// =============================================================================
// CATEGORY 7: PRODUCT SPECIFICATION (10 parameters, 13% weight)
// =============================================================================

export interface TechnicalSpecsParams {
  // Sub-category 7.1: Technical Specifications (4 params)
  specificationCompleteness: number // 0-100, fields filled
  technicalDetailLevel: number // 0-100, depth of info
  accuracyVerification: number // 0-100, match with official
  isModelNumberVerified: boolean
}

export interface CategoryFeaturesParams {
  // Sub-category 7.2: Category-Specific Features (3 params)
  featureMatchScore: number // 0-100, has expected features
  featureCompleteness: number // 0-100, all features work
  upgradeDowngradeLevel: number // -10 to +10, generation comparison
}

export interface HardwareDetailsParams {
  // Sub-category 7.3: Hardware Details (3 params)
  processorSpec: string
  memoryStorageSpec: string
  displaySpec: string
}

export interface ProductSpecificationScore {
  technicalSpecs: TechnicalSpecsParams
  categoryFeatures: CategoryFeaturesParams
  hardwareDetails: HardwareDetailsParams

  categoryScore: number
  confidence: number
  dataQuality: number
}

// =============================================================================
// CATEGORY 8: COMPANY PERFORMANCE (5 parameters, 5% weight)
// =============================================================================

export interface BrandReputationParams {
  // Sub-category 8.1: Brand Reputation (2 params)
  brandReputationScore: number // 0-100, tier-based
  brandRecognitionPercent: number // 0-100
}

export interface MarketPerformanceParams {
  // Sub-category 8.2: Market Performance (1 param)
  stockPerformanceYoY: number // Percentage change
}

export interface NewsSentimentParams {
  // Sub-category 8.3: News & Sentiment (1 param)
  newsSentimentScore: number // 0-100
}

export interface CustomerSatisfactionParams {
  // Sub-category 8.4: Customer Satisfaction (1 param)
  customerSatisfactionIndex: number // 0-100, ACSI score
}

export interface CompanyPerformanceScore {
  brandReputation: BrandReputationParams
  marketPerformance: MarketPerformanceParams
  newsSentiment: NewsSentimentParams
  customerSatisfaction: CustomerSatisfactionParams

  categoryScore: number
  confidence: number
  dataQuality: number
}

// =============================================================================
// COMPLETE VERITAS SCORE
// =============================================================================

export interface VeritasScoreInput {
  // Product Information (required)
  productName: string
  brand: string
  category: string
  condition: PhysicalConditionParams['overallCondition']

  // Optional identifiers for API lookups
  serialNumber?: string
  serviceTag?: string
  asin?: string
  sku?: string

  // All category inputs
  productQuality: Partial<ProductQualityScore>
  sellerTrust: Partial<SellerTrustScore>
  marketValue: Partial<MarketValueScore>
  sustainability: Partial<SustainabilityScore>
  securitySafety: Partial<SecuritySafetyScore>
  userExperience: Partial<UserExperienceScore>
  productSpecification: Partial<ProductSpecificationScore>
  companyPerformance: Partial<CompanyPerformanceScore>
}

export interface VeritasScoreResult {
  // Overall Score
  overallScore: number // 0-100
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  ssn: string // Score Serial Number: VS-{CAT}-{SCORE}-{CONF}-{DATE}

  // Category Scores
  categories: {
    productQuality: ProductQualityScore & { weightedScore: number }
    sellerTrust: SellerTrustScore & { weightedScore: number }
    marketValue: MarketValueScore & { weightedScore: number }
    sustainability: SustainabilityScore & { weightedScore: number }
    securitySafety: SecuritySafetyScore & { weightedScore: number }
    userExperience: UserExperienceScore & { weightedScore: number }
    productSpecification: ProductSpecificationScore & { weightedScore: number }
    companyPerformance: CompanyPerformanceScore & { weightedScore: number }
  }

  // Meta Information
  metadata: {
    calculatedAt: Date
    processingTimeMs: number
    overallConfidence: number // 0-100
    overallDataQuality: number // 0-100
    parametersUsed: number // Out of 121
    parametersAvailable: number
    dataSources: string[]
    version: string
  }

  // Insights
  insights: {
    strengths: string[]
    weaknesses: string[]
    topRecommendation: string
    valueAssessment: string
    trustAssessment: string
  }

  // Comparison
  comparison?: {
    vsNewProduct?: {
      scoreDifference: number
      priceDifference: number
      recommendation: string
    }
    vsSimilarProducts?: {
      averageScore: number
      pricePercentile: number
      valueRanking: string
    }
  }
}

// Category weights (must sum to 1.0)
export const CATEGORY_WEIGHTS = {
  productQuality: 0.25,      // 25%
  sellerTrust: 0.20,         // 20%
  marketValue: 0.15,         // 15%
  sustainability: 0.12,      // 12%
  securitySafety: 0.05,      // 5%
  userExperience: 0.05,      // 5%
  productSpecification: 0.13, // 13%
  companyPerformance: 0.05,  // 5%
} as const

// Grade thresholds
export const GRADE_THRESHOLDS = {
  S: 95,  // 95-100: Exceptional
  A: 85,  // 85-94: Excellent
  B: 75,  // 75-84: Good
  C: 65,  // 65-74: Fair
  D: 50,  // 50-64: Below Average
  F: 0,   // 0-49: Poor
} as const

// Data source types
export type DataSourceType =
  | 'API'           // Official API
  | 'WEB_SCRAPE'    // Web scraping
  | 'USER_INPUT'    // User-provided
  | 'CALCULATED'    // Algorithmically computed
  | 'DATABASE'      // Internal database

export interface DataSourceMetadata {
  name: string
  type: DataSourceType
  success: boolean
  cached: boolean
  timestamp: Date
  confidence: number
  error?: string
}

// Cache configuration
export const CACHE_TTL = {
  WARRANTY_STATUS: 7 * 24 * 60 * 60,        // 7 days
  PRODUCT_SPECS: 30 * 24 * 60 * 60,         // 30 days
  REPAIRABILITY: 30 * 24 * 60 * 60,         // 30 days
  PRICE_DATA: 24 * 60 * 60,                 // 1 day
  STOCK_DATA: 60 * 60,                      // 1 hour
  SSL_SCORE: 24 * 60 * 60,                  // 1 day
  SELLER_INFO: 7 * 24 * 60 * 60,            // 7 days
  NEWS_SENTIMENT: 6 * 60 * 60,              // 6 hours
} as const

// Export type guard functions
export function isValidGrade(grade: string): grade is VeritasScoreResult['grade'] {
  return ['S', 'A', 'B', 'C', 'D', 'F'].includes(grade)
}

export function calculateGrade(score: number): VeritasScoreResult['grade'] {
  if (score >= GRADE_THRESHOLDS.S) return 'S'
  if (score >= GRADE_THRESHOLDS.A) return 'A'
  if (score >= GRADE_THRESHOLDS.B) return 'B'
  if (score >= GRADE_THRESHOLDS.C) return 'C'
  if (score >= GRADE_THRESHOLDS.D) return 'D'
  return 'F'
}

export function generateSSN(
  category: string,
  score: number,
  confidence: number,
  date: Date = new Date(),
  productId?: string
): string {
  const categoryCode = category.substring(0, 3).toUpperCase()
  const scoreStr = Math.round(score).toString().padStart(3, '0')
  const confidenceStr = Math.round(confidence).toString().padStart(2, '0')
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
  // Use timestamp millis for uniqueness
  const uniqueCode = date.getTime().toString().slice(-6)

  return `VS-${categoryCode}-${scoreStr}-${confidenceStr}-${dateStr}-${uniqueCode}`
}
