/**
 * Data Fetcher Types
 * Common types for all FREE data source integrations
 */

import { CACHE_DURATION, RATE_LIMITS } from '@/config/constants'

// ============================================================================
// Common Types
// ============================================================================

export interface DataSourceResult<T> {
  success: boolean
  data?: T
  error?: string
  source: string
  timestamp: Date
  cached: boolean
}

export interface CacheConfig {
  key: string
  ttl: number // seconds
}

// ============================================================================
// Apple Warranty API Types
// ============================================================================

export interface AppleWarrantyResult {
  isValid: boolean
  warrantyStatus: 'Active' | 'Expired' | 'Unknown'
  expirationDate?: Date
  manufacturingDate?: Date
  model?: string
  coverage?: string
  purchaseDate?: Date
}

// ============================================================================
// Dell Warranty API Types
// ============================================================================

export interface DellWarrantyResult {
  isValid: boolean
  serviceTag: string
  warrantyStatus: 'Active' | 'Expired' | 'Unknown'
  warrantyEndDate?: Date
  shipDate?: Date
  model?: string
  productFamily?: string
  description?: string
}

// ============================================================================
// eBay API Types
// ============================================================================

export interface EbaySellerInfo {
  userId: string
  feedbackScore: number
  positiveFeedbackPercent: number
  negativeFeedbackPercent: number
  registrationDate?: Date
  topRatedSeller: boolean
  feedbackPrivate: boolean
  sellerBusinessType?: string
}

export interface EbayListingInfo {
  itemId: string
  title: string
  condition: string
  price: number
  currency: string
  shippingCost?: number
  location: string
  sellerInfo: EbaySellerInfo
  imageUrls: string[]
  listingUrl: string
}

// ============================================================================
// GSMArena Types
// ============================================================================

export interface PhoneSpecifications {
  deviceName: string
  brand?: string

  // Display
  displaySize?: string
  displayResolution?: string
  displayType?: string

  // Performance
  processor?: string
  chipset?: string
  gpu?: string
  ram?: string
  storage?: string

  // Camera
  mainCamera?: string
  selfieCamera?: string
  videoRecording?: string

  // Battery
  batteryCapacity?: string
  batteryType?: string
  charging?: string

  // Connectivity
  network?: string
  wifi?: string
  bluetooth?: string
  nfc?: boolean

  // Physical
  dimensions?: string
  weight?: string
  build?: string
  sim?: string

  // Software
  os?: string

  // Release
  releaseDate?: string
  releaseYear?: number

  // Price
  priceRange?: string
}

// ============================================================================
// iFixit API Types
// ============================================================================

export interface RepairabilityInfo {
  deviceName: string
  repairabilityScore: number // 0-10
  difficulty: 'Very Easy' | 'Easy' | 'Moderate' | 'Difficult' | 'Very Difficult'
  partsAvailable: boolean
  teardownUrl?: string
  repairGuides?: number
}

// ============================================================================
// Energy Star API Types
// ============================================================================

export interface EnergyStarInfo {
  modelNumber: string
  brand: string
  certified: boolean
  certificationDate?: Date
  energyEfficiency?: string
  annualEnergyCost?: number
}

// ============================================================================
// Alpha Vantage Types
// ============================================================================

export interface StockInfo {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume?: number
  marketCap?: number
  lastUpdate: Date
}

// ============================================================================
// Error Types
// ============================================================================

export class DataFetchError extends Error {
  constructor(
    message: string,
    public source: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'DataFetchError'
  }
}

export class RateLimitError extends DataFetchError {
  constructor(source: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${source}`, source, 429)
    this.name = 'RateLimitError'
  }
}

// ============================================================================
// Cache Types
// ============================================================================

// Use centralized cache constants from @/config/constants
export const CACHE_TTL = {
  // Long-term cache (rarely changes)
  PRODUCT_SPECS: CACHE_DURATION.PRODUCT_SPECS,
  REPAIRABILITY: CACHE_DURATION.REPAIRABILITY,
  ENERGY_STAR: CACHE_DURATION.ENERGY_RATING,
  BRAND_INFO: CACHE_DURATION.COMPANY_BRAND,

  // Medium-term cache
  WARRANTY_STATUS: CACHE_DURATION.WARRANTY_STATUS,
  SELLER_INFO: CACHE_DURATION.SELLER_INFO,
  PRODUCT_INFO: CACHE_DURATION.PRODUCT_INFO,       // BestBuy product data
  BRAND_SENTIMENT: CACHE_DURATION.BRAND_SENTIMENT, // NewsAPI sentiment

  // Short-term cache
  PRICE_DATA: CACHE_DURATION.PRICE_DATA,
  PRODUCT_REVIEWS: CACHE_DURATION.PRODUCT_REVIEWS, // BestBuy reviews
  STOCK_DATA: CACHE_DURATION.STOCK_DATA,
  LISTING_DATA: 6 * 60 * 60, // 6 hours (not in centralized config, keep as is)
} as const

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  delayMs?: number // Delay between requests
}

// Use centralized rate limit constants from @/config/constants
// Re-export with same structure for backward compatibility
export const RATE_LIMIT_CONFIG: Record<string, RateLimitConfig> = {
  GSMARENA: {
    maxRequests: RATE_LIMITS.GSMARENA.MAX_REQUESTS,
    windowMs: RATE_LIMITS.GSMARENA.WINDOW_MS,
    delayMs: RATE_LIMITS.GSMARENA.DELAY_MS,
  },
  EBAY: {
    maxRequests: RATE_LIMITS.EBAY.MAX_REQUESTS,
    windowMs: RATE_LIMITS.EBAY.WINDOW_MS,
    delayMs: RATE_LIMITS.EBAY.DELAY_MS,
  },
  ALPHA_VANTAGE: {
    maxRequests: RATE_LIMITS.ALPHA_VANTAGE.MAX_REQUESTS,
    windowMs: RATE_LIMITS.ALPHA_VANTAGE.WINDOW_MS,
    delayMs: RATE_LIMITS.ALPHA_VANTAGE.DELAY_MS,
  },
  APPLE: {
    maxRequests: RATE_LIMITS.APPLE_WARRANTY.MAX_REQUESTS,
    windowMs: RATE_LIMITS.APPLE_WARRANTY.WINDOW_MS,
    delayMs: RATE_LIMITS.APPLE_WARRANTY.DELAY_MS,
  },
  DELL: {
    maxRequests: RATE_LIMITS.DELL_WARRANTY.MAX_REQUESTS,
    windowMs: RATE_LIMITS.DELL_WARRANTY.WINDOW_MS,
    delayMs: RATE_LIMITS.DELL_WARRANTY.DELAY_MS,
  },
  IFIXIT: {
    maxRequests: RATE_LIMITS.IFIXIT.MAX_REQUESTS,
    windowMs: RATE_LIMITS.IFIXIT.WINDOW_MS,
    delayMs: RATE_LIMITS.IFIXIT.DELAY_MS,
  },
  BESTBUY: {
    maxRequests: RATE_LIMITS.BESTBUY.MAX_REQUESTS,
    windowMs: RATE_LIMITS.BESTBUY.WINDOW_MS,
    delayMs: RATE_LIMITS.BESTBUY.DELAY_MS,
  },
  NEWSAPI: {
    maxRequests: RATE_LIMITS.NEWSAPI.MAX_REQUESTS,
    windowMs: RATE_LIMITS.NEWSAPI.WINDOW_MS,
    delayMs: RATE_LIMITS.NEWSAPI.DELAY_MS,
  },
}
