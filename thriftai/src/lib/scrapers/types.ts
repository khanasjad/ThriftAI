/**
 * Web Scraper Types
 * Common types for all web scraping modules
 */

export interface ScraperConfig {
  name: string
  baseUrl: string
  rateLimit: {
    requestsPerSecond: number
    delayMs: number
    maxConcurrent: number
  }
  retry: {
    maxAttempts: number
    backoffMs: number
  }
  cache: {
    enabled: boolean
    ttlSeconds: number
  }
  antiDetection: {
    randomUserAgent: boolean
    randomDelay: boolean
    headless: boolean
  }
}

export interface ScraperResult<T> {
  success: boolean
  data?: T
  error?: string
  source: string
  timestamp: Date
  cached: boolean
  metadata?: Record<string, any>
}

export interface PriceHistory {
  date: Date
  price: number
  currency: string
  source: string
}

export interface ProductPriceData {
  asin?: string
  productName: string
  currentPrice?: number
  lowestPrice?: number
  highestPrice?: number
  averagePrice?: number
  priceHistory: PriceHistory[]
  lastUpdated: Date
}

export interface MarketplaceProduct {
  id: string
  name: string
  brand?: string
  category?: string
  price: number
  currency: string
  availability: boolean
  rating?: number
  reviewCount?: number
  imageUrl?: string
  productUrl: string
  seller?: string
  condition?: string
  specifications?: Record<string, string>
}

export interface ScrapedData {
  productName: string
  url: string
  timestamp: Date
  data: any
  dataType: 'price' | 'product' | 'review' | 'specs' | 'other'
}
