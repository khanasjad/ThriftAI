/**
 * Web Scrapers - Index
 * Central export point for all web scraping modules
 */

// Types
export * from './types'

// Base Scraper
export { BaseScraper } from './BaseScraper'

// Scrapers
export { CamelCamelCamelScraper, getAmazonPriceHistory, getAmazonPriceStats } from './CamelCamelCamelScraper'
export { WalmartScraper, searchWalmartProducts, getWalmartProduct } from './WalmartScraper'
export { TargetScraper, searchTargetProducts, getTargetProduct } from './TargetScraper'

// Testing & Examples
export * from './test-scrapers'
export * from './examples'

/**
 * Scraper Registry
 * All available scrapers for the revolutionary algorithm
 */
export const SCRAPER_REGISTRY = {
  camelcamelcamel: 'CamelCamelCamelScraper',
  walmart: 'WalmartScraper',
  target: 'TargetScraper',
  // Future scrapers will be added here as the infrastructure scales to 1000+ sites
} as const

/**
 * Scraper Statistics
 */
export const SCRAPER_STATS = {
  totalScrapers: 3,
  targetScrapers: 1000, // Goal: 1000+ data sources
  progress: '0.3%',
  categories: {
    priceTracking: 1, // CamelCamelCamel
    marketplaces: 2, // Walmart, Target
    // Future categories: reviews (200+), brands (300+), sustainability (100+), etc.
  },
}
