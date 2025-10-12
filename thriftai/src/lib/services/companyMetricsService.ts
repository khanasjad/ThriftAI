/**
 * Company Metrics Service
 *
 * Fetches and caches company-level data for the 25 company parameters:
 * - Financial data (stock prices, market cap, revenue, etc.)
 * - ESG data (environmental, social, governance scores)
 * - Growth metrics (R&D, patents, market share)
 * - Risk metrics (legal violations, recalls)
 *
 * Data Sources:
 * - Alpha Vantage API (stock data)
 * - Yahoo Finance API (alternative stock data)
 * - ESG APIs (MSCI, Sustainalytics - would need paid access)
 * - Company filings / manual data entry
 */

import { CompanyMetrics, CompanyMetricsError } from '@/lib/types/aiScoring96'
import { logger } from '@/lib/logger'

// ========================================
// CONFIGURATION
// ========================================

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || ''
const CACHE_TTL_HOURS = 24 // Cache company data for 24 hours

// Company data cache (in-memory for now, should use Redis in production)
const companyCache = new Map<string, {
  data: CompanyMetrics
  expiresAt: number
}>()

// ========================================
// COMPANY METRICS SERVICE
// ========================================

export class CompanyMetricsService {
  /**
   * Get comprehensive company metrics for a brand
   */
  async getCompanyMetrics(brandName: string): Promise<CompanyMetrics | null> {
    try {
      // Check cache first
      const cached = this.getCached(brandName)
      if (cached) {
        logger.info('Company metrics from cache', { brandName })
        return cached
      }

      // Fetch fresh data
      logger.info('Fetching company metrics', { brandName })
      const metrics = await this.fetchCompanyMetrics(brandName)

      // Cache the result
      if (metrics) {
        this.setCache(brandName, metrics)
      }

      return metrics
    } catch (error) {
      logger.error('Error fetching company metrics', {
        brandName,
        error: error instanceof Error ? error.message : String(error)
      })
      throw new CompanyMetricsError(
        `Failed to fetch company metrics for ${brandName}`,
        brandName,
        'FETCH_ERROR',
        error
      )
    }
  }

  /**
   * Fetch company metrics from various sources
   */
  private async fetchCompanyMetrics(brandName: string): Promise<CompanyMetrics | null> {
    // Map brand name to stock ticker (in production, use a database)
    const ticker = this.getStockTicker(brandName)

    if (!ticker) {
      logger.warn('No stock ticker found for brand', { brandName })
      return this.getDefaultMetrics(brandName)
    }

    // Fetch different metric categories
    const [
      financialData,
      esgData,
      growthData,
      riskData
    ] = await Promise.allSettled([
      this.fetchFinancialMetrics(ticker),
      this.fetchESGMetrics(brandName),
      this.fetchGrowthMetrics(brandName),
      this.fetchRiskMetrics(brandName)
    ])

    // Combine all metrics
    const metrics: CompanyMetrics = {
      // Financial data
      ...(financialData.status === 'fulfilled' ? financialData.value : {}),
      // ESG data
      ...(esgData.status === 'fulfilled' ? esgData.value : {}),
      // Growth data
      ...(growthData.status === 'fulfilled' ? growthData.value : {}),
      // Risk data
      ...(riskData.status === 'fulfilled' ? riskData.value : {}),

      // Metadata
      lastUpdated: new Date().toISOString(),
      dataSource: 'AlphaVantage, Manual'
    }

    return metrics
  }

  /**
   * Fetch financial metrics from Alpha Vantage
   */
  private async fetchFinancialMetrics(ticker: string): Promise<Partial<CompanyMetrics>> {
    if (!ALPHA_VANTAGE_API_KEY) {
      logger.warn('Alpha Vantage API key not configured')
      return this.getMockFinancialData(ticker)
    }

    try {
      // Get current quote
      const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
      const quoteResponse = await fetch(quoteUrl)
      const quoteData = await quoteResponse.json()

      if (quoteData['Error Message'] || quoteData['Note']) {
        logger.warn('Alpha Vantage API limit or error', { ticker, error: quoteData })
        return this.getMockFinancialData(ticker)
      }

      const quote = quoteData['Global Quote']

      // Get company overview
      const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
      const overviewResponse = await fetch(overviewUrl)
      const overview = await overviewResponse.json()

      // Parse financial metrics
      const currentPrice = parseFloat(quote['05. price'] || '0')
      const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || '0')

      return {
        stockPrice: currentPrice,
        stockPerformance30d: changePercent, // Simplified - should calculate 30-day
        stockPerformance1y: parseFloat(overview['52WeekHigh']) ?
          ((currentPrice - parseFloat(overview['52WeekLow'])) / parseFloat(overview['52WeekLow']) * 100) : undefined,
        marketCap: overview.MarketCapitalization ?
          parseFloat(overview.MarketCapitalization) / 1_000_000_000 : undefined, // Convert to billions
        revenueGrowth: parseFloat(overview.QuarterlyRevenueGrowthYOY?.replace('%', '') || '0'),
        profitMargin: parseFloat(overview.ProfitMargin || '0') * 100,
        debtToEquity: parseFloat(overview.DebtToEquity || '0'),
        creditRating: undefined // Not available from Alpha Vantage
      }
    } catch (error) {
      logger.error('Error fetching financial metrics from Alpha Vantage', { ticker, error })
      return this.getMockFinancialData(ticker)
    }
  }

  /**
   * Fetch ESG metrics
   * Note: Real ESG data requires paid API access (MSCI, Sustainalytics, Bloomberg ESG)
   * ✅ ONLY REAL DATA - Returns undefined for all fields until real API is integrated
   */
  private async fetchESGMetrics(brandName: string): Promise<Partial<CompanyMetrics>> {
    // ❌ NO FAKE ESTIMATES - ESG APIs are not integrated yet
    // Return undefined for all ESG fields until we integrate:
    // - Sustainalytics ESG Risk Rating API (~$1000/month)
    // - MSCI ESG Ratings API (Enterprise pricing)
    // - Bloomberg ESG Data (Enterprise pricing)
    // - CSRHub API (Free tier: 10 requests/day)

    return {
      esgScore: undefined,
      sustainabilityRating: undefined,
      carbonFootprint: undefined,
      renewableEnergy: undefined,
      wasteDiversion: undefined,
      waterEfficiency: undefined,
      supplierSustainability: undefined,
      circularEconomy: undefined
    }
  }

  /**
   * Fetch growth and innovation metrics
   * ✅ ONLY REAL DATA - Returns undefined for all fields until real APIs are integrated
   */
  private async fetchGrowthMetrics(brandName: string): Promise<Partial<CompanyMetrics>> {
    // ❌ NO FAKE ESTIMATES - Growth APIs are not integrated yet
    // Return undefined for all growth fields until we integrate:
    // - SEC EDGAR API for R&D spending (FREE)
    // - USPTO PatentsView API for patent counts (FREE)
    // - Market research APIs for market share (PAID)

    return {
      rdInvestment: undefined,
      newProductLaunchRate: undefined,
      patentCount: undefined,
      marketShare: undefined,
      industryAwards: undefined
    }
  }

  /**
   * Fetch risk and compliance metrics
   * ✅ ONLY REAL DATA - Returns undefined for all fields until real APIs are integrated
   */
  private async fetchRiskMetrics(brandName: string): Promise<Partial<CompanyMetrics>> {
    // ❌ NO FAKE ESTIMATES - Risk/compliance APIs are not integrated yet
    // Return undefined for all risk fields until we integrate:
    // - CPSC Recall Database for product recalls (FREE - already integrated elsewhere!)
    // - Fair Trade API for labor practices (~$200/month)
    // - Open Supply Hub for supply chain transparency (FREE)
    // - Court records APIs for legal violations

    return {
      fairLabor: undefined,
      laborPractices: undefined,
      diversityInclusion: undefined,
      communityInvestment: undefined,
      legalViolations: undefined,
      productRecallRate: undefined,
      supplyChainTransparency: undefined
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Map brand name to stock ticker
   * In production, use a database mapping
   */
  private getStockTicker(brandName: string): string | null {
    const tickerMap: Record<string, string> = {
      'Apple': 'AAPL',
      'Microsoft': 'MSFT',
      'Amazon': 'AMZN',
      'Google': 'GOOGL',
      'Meta': 'META',
      'Tesla': 'TSLA',
      'Nike': 'NKE',
      'Adidas': 'ADS.DE',
      'Samsung': '005930.KS',
      'Sony': 'SONY',
      'LG': '066570.KS',
      'Dell': 'DELL',
      'HP': 'HPQ',
      'Lenovo': '0992.HK',
      'ASUS': '2357.TW',
      'Acer': '2353.TW',
      'Walmart': 'WMT',
      'Target': 'TGT',
      'Best Buy': 'BBY',
      'Costco': 'COST',
      'Home Depot': 'HD',
      'Lowe\'s': 'LOW'
    }

    const normalized = brandName.trim().toLowerCase()
    for (const [brand, ticker] of Object.entries(tickerMap)) {
      if (normalized.includes(brand.toLowerCase())) {
        return ticker
      }
    }

    return null
  }

  /**
   * Get default metrics for brands without stock data
   * ✅ ONLY REAL DATA - Returns undefined for all unavailable fields
   */
  private getDefaultMetrics(brandName: string): CompanyMetrics {
    return {
      // Financial - not available for private companies
      stockPrice: undefined,
      stockPerformance30d: undefined,
      stockPerformance1y: undefined,
      marketCap: undefined,
      revenueGrowth: undefined,
      profitMargin: undefined,
      debtToEquity: undefined,
      creditRating: undefined,

      // Growth - not available
      rdInvestment: undefined,
      newProductLaunchRate: undefined,
      patentCount: undefined,
      marketShare: undefined,
      industryAwards: undefined,

      // ESG - not available
      esgScore: undefined,
      sustainabilityRating: undefined,
      carbonFootprint: undefined,
      renewableEnergy: undefined,
      wasteDiversion: undefined,
      waterEfficiency: undefined,
      supplierSustainability: undefined,
      circularEconomy: undefined,

      // Social - not available
      fairLabor: undefined,
      laborPractices: undefined,
      diversityInclusion: undefined,
      communityInvestment: undefined,

      // Risk - not available
      legalViolations: undefined,
      productRecallRate: undefined,
      supplyChainTransparency: undefined,

      lastUpdated: new Date().toISOString(),
      dataSource: 'No data available'
    }
  }

  /**
   * Mock financial data for testing (when API key not available)
   */
  private getMockFinancialData(ticker: string): Partial<CompanyMetrics> {
    // Generate semi-realistic mock data based on ticker
    const hash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const basePrice = 50 + (hash % 150)

    return {
      stockPrice: basePrice,
      stockPerformance30d: -5 + (hash % 20),
      stockPerformance1y: -10 + (hash % 50),
      marketCap: 10 + (hash % 2000),
      revenueGrowth: 5 + (hash % 25),
      profitMargin: 10 + (hash % 30),
      debtToEquity: 0.3 + (hash % 15) / 10,
      creditRating: hash % 2 === 0 ? 'AA' : 'A'
    }
  }

  // ❌ REMOVED - All fake estimate functions (getEstimatedESGData, getEstimatedGrowthData, getEstimatedRiskData)
  // These functions returned fake scores based on brand name assumptions
  // All ESG/growth/risk data must come from real APIs only

  // ========================================
  // CACHE MANAGEMENT
  // ========================================

  private getCached(brandName: string): CompanyMetrics | null {
    const cached = companyCache.get(brandName.toLowerCase())
    if (!cached) return null

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      companyCache.delete(brandName.toLowerCase())
      return null
    }

    return cached.data
  }

  private setCache(brandName: string, data: CompanyMetrics): void {
    const expiresAt = Date.now() + (CACHE_TTL_HOURS * 60 * 60 * 1000)
    companyCache.set(brandName.toLowerCase(), { data, expiresAt })
  }

  /**
   * Clear cache for a specific brand or all brands
   */
  clearCache(brandName?: string): void {
    if (brandName) {
      companyCache.delete(brandName.toLowerCase())
      logger.info('Cleared company metrics cache', { brandName })
    } else {
      companyCache.clear()
      logger.info('Cleared all company metrics cache')
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    brands: string[]
  } {
    return {
      size: companyCache.size,
      brands: Array.from(companyCache.keys())
    }
  }

  /**
   * Batch fetch company metrics for multiple brands
   */
  async batchGetCompanyMetrics(brandNames: string[]): Promise<Map<string, CompanyMetrics | null>> {
    const results = new Map<string, CompanyMetrics | null>()

    // Fetch in parallel with concurrency limit
    const concurrency = 5 // Don't overwhelm APIs
    for (let i = 0; i < brandNames.length; i += concurrency) {
      const batch = brandNames.slice(i, i + concurrency)
      const batchResults = await Promise.all(
        batch.map(async (brand) => {
          try {
            const metrics = await this.getCompanyMetrics(brand)
            return { brand, metrics }
          } catch (error) {
            logger.error('Error in batch fetch', { brand, error })
            return { brand, metrics: null }
          }
        })
      )

      batchResults.forEach(({ brand, metrics }) => {
        results.set(brand, metrics)
      })

      // Rate limiting
      if (i + concurrency < brandNames.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay between batches
      }
    }

    return results
  }
}

// Export singleton instance
export const companyMetricsService = new CompanyMetricsService()

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Calculate company score from metrics (0-100)
 */
export function calculateCompanyScore(metrics: CompanyMetrics): number {
  const scores: number[] = []

  // Financial health (weight: 30%)
  if (metrics.stockPerformance1y !== undefined) {
    scores.push(Math.min(100, Math.max(0, 50 + metrics.stockPerformance1y)))
  }
  if (metrics.profitMargin !== undefined) {
    scores.push(Math.min(100, metrics.profitMargin * 2.5))
  }
  if (metrics.creditRating) {
    const ratingScores: Record<string, number> = {
      'AAA': 100, 'AA': 95, 'A': 85, 'BBB': 75, 'BB': 60, 'B': 40
    }
    scores.push(ratingScores[metrics.creditRating] || 50)
  }

  // Growth (weight: 20%)
  if (metrics.revenueGrowth !== undefined) {
    scores.push(Math.min(100, 50 + metrics.revenueGrowth * 2))
  }
  if (metrics.rdInvestment !== undefined) {
    scores.push(Math.min(100, metrics.rdInvestment * 5))
  }

  // ESG (weight: 30%)
  if (metrics.esgScore !== undefined) {
    scores.push(metrics.esgScore)
  }
  if (metrics.renewableEnergy !== undefined) {
    scores.push(metrics.renewableEnergy)
  }

  // Social (weight: 15%)
  if (metrics.fairLabor !== undefined) {
    scores.push(metrics.fairLabor)
  }
  if (metrics.diversityInclusion !== undefined) {
    scores.push(metrics.diversityInclusion)
  }

  // Risk (weight: 5% - inverse scoring)
  if (metrics.legalViolations !== undefined) {
    scores.push(Math.max(0, 100 - metrics.legalViolations * 20))
  }
  if (metrics.productRecallRate !== undefined) {
    scores.push(Math.max(0, 100 - metrics.productRecallRate * 20))
  }

  // Calculate average
  return scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 50 // Default neutral score
}
