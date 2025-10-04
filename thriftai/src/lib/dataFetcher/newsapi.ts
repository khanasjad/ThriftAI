/**
 * NewsAPI Integration
 * Official NewsAPI - FREE tier (500 requests/day for development)
 * Provides brand sentiment analysis and company news
 *
 * API Documentation: https://newsapi.org/docs
 * Developer Portal: https://newsapi.org/
 *
 * Data Retrieved:
 * - Recent news articles about brands/companies
 * - Sentiment analysis from news coverage
 * - Product recalls and safety alerts
 * - Company announcements and press releases
 * - Industry trends and market news
 *
 * Note: Free tier is for development only. Upgrade required for production.
 */

import { DataSourceResult, CACHE_TTL } from './types'
import { getCachedOrFetch, generateCacheKey } from './cache'
import { withRateLimit } from './rateLimiter'
import { logger } from '@/lib/logger'
import { EXTERNAL_API_URLS } from '@/config/constants'

const NEWSAPI_BASE = EXTERNAL_API_URLS.NEWSAPI

/**
 * NewsAPI Article
 */
export interface NewsArticle {
  source: {
    id: string | null
    name: string
  }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

/**
 * Brand Sentiment Analysis Result
 */
export interface BrandSentiment {
  brand: string
  overallScore: number // -100 to +100 (negative to positive)
  confidence: number // 0 to 1
  totalArticles: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  recentArticles: NewsArticle[]
  keywords: string[]
  lastUpdated: Date
}

/**
 * NewsAPI Search Result
 */
export interface NewsSearchResult {
  status: string
  totalResults: number
  articles: NewsArticle[]
}

/**
 * Get brand sentiment analysis from news coverage
 */
export async function getBrandSentiment(
  brand: string,
  options?: {
    daysBack?: number
    language?: string
    maxArticles?: number
  }
): Promise<DataSourceResult<BrandSentiment>> {
  const source = 'NEWSAPI_SENTIMENT'
  const cacheKey = generateCacheKey(source, brand, options?.daysBack?.toString() || '7')

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.BRAND_SENTIMENT,
      async () => {
        return await withRateLimit('NEWSAPI', async () => {
          return await fetchBrandSentiment(brand, options)
        })
      }
    )

    return {
      success: true,
      data,
      source,
      timestamp: new Date(),
      cached,
    }
  } catch (error) {
    logger.error('NewsAPI sentiment analysis failed', {
      component: 'NewsAPIFetcher',
      metadata: { brand, error: error instanceof Error ? error.message : 'Unknown error' },
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source,
      timestamp: new Date(),
      cached: false,
    }
  }
}

/**
 * Search news articles
 */
export async function searchNews(
  query: string,
  options?: {
    from?: string
    to?: string
    language?: string
    sortBy?: 'relevancy' | 'popularity' | 'publishedAt'
    pageSize?: number
  }
): Promise<DataSourceResult<NewsSearchResult>> {
  const source = 'NEWSAPI_SEARCH'
  const cacheKey = generateCacheKey(source, query, options?.from || 'recent')

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.BRAND_SENTIMENT,
      async () => {
        return await withRateLimit('NEWSAPI', async () => {
          return await fetchNewsSearch(query, options)
        })
      }
    )

    return {
      success: true,
      data,
      source,
      timestamp: new Date(),
      cached,
    }
  } catch (error) {
    logger.error('NewsAPI search failed', {
      component: 'NewsAPIFetcher',
      metadata: { query, error: error instanceof Error ? error.message : 'Unknown error' },
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source,
      timestamp: new Date(),
      cached: false,
    }
  }
}

/**
 * Check for product recalls and safety issues
 */
export async function checkProductRecalls(
  brand: string,
  productName?: string
): Promise<DataSourceResult<NewsArticle[]>> {
  const source = 'NEWSAPI_RECALLS'
  const recallKeywords = ['recall', 'safety alert', 'defect', 'hazard']
  const query = productName
    ? `${brand} ${productName} ${recallKeywords.join(' OR ')}`
    : `${brand} ${recallKeywords.join(' OR ')}`

  const cacheKey = generateCacheKey(source, brand, productName || 'all')

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.BRAND_SENTIMENT,
      async () => {
        return await withRateLimit('NEWSAPI', async () => {
          const result = await fetchNewsSearch(query, {
            sortBy: 'publishedAt',
            pageSize: 20,
          })
          return result.articles
        })
      }
    )

    return {
      success: true,
      data,
      source,
      timestamp: new Date(),
      cached,
    }
  } catch (error) {
    logger.error('NewsAPI recalls check failed', {
      component: 'NewsAPIFetcher',
      metadata: { brand, productName, error: error instanceof Error ? error.message : 'Unknown' },
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source,
      timestamp: new Date(),
      cached: false,
    }
  }
}

/**
 * Internal: Fetch brand sentiment
 */
async function fetchBrandSentiment(
  brand: string,
  options?: {
    daysBack?: number
    language?: string
    maxArticles?: number
  }
): Promise<BrandSentiment> {
  const daysBack = options?.daysBack || 7
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - daysBack)

  const result = await fetchNewsSearch(brand, {
    from: fromDate.toISOString().split('T')[0],
    language: options?.language || 'en',
    sortBy: 'publishedAt',
    pageSize: Math.min(options?.maxArticles || 50, 100),
  })

  // Analyze sentiment from article titles and descriptions
  const sentimentAnalysis = analyzeSentiment(result.articles, brand)

  return {
    brand,
    overallScore: sentimentAnalysis.score,
    confidence: sentimentAnalysis.confidence,
    totalArticles: result.totalResults,
    positiveCount: sentimentAnalysis.positive,
    negativeCount: sentimentAnalysis.negative,
    neutralCount: sentimentAnalysis.neutral,
    recentArticles: result.articles.slice(0, 10),
    keywords: extractKeywords(result.articles),
    lastUpdated: new Date(),
  }
}

/**
 * Internal: Fetch news search results
 */
async function fetchNewsSearch(
  query: string,
  options?: {
    from?: string
    to?: string
    language?: string
    sortBy?: 'relevancy' | 'popularity' | 'publishedAt'
    pageSize?: number
  }
): Promise<NewsSearchResult> {
  const apiKey = process.env.NEWSAPI_API_KEY

  if (!apiKey) {
    logger.warn('NEWSAPI_API_KEY not configured', {
      component: 'NewsAPIFetcher',
    })
    throw new Error('NewsAPI key not configured')
  }

  const params = new URLSearchParams({
    q: query,
    apiKey,
    language: options?.language || 'en',
    sortBy: options?.sortBy || 'publishedAt',
    pageSize: (options?.pageSize || 20).toString(),
  })

  if (options?.from) {
    params.append('from', options.from)
  }

  if (options?.to) {
    params.append('to', options.to)
  }

  const url = `${NEWSAPI_BASE}/everything?${params.toString()}`

  logger.info('Fetching news articles', {
    component: 'NewsAPIFetcher',
    metadata: { query, from: options?.from, pageSize: options?.pageSize },
  })

  const response = await fetch(url)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `NewsAPI error: ${response.status} - ${errorData.message || response.statusText}`
    )
  }

  const result = await response.json()

  if (result.status !== 'ok') {
    throw new Error(`NewsAPI error: ${result.code || 'Unknown'} - ${result.message || 'Unknown'}`)
  }

  return result
}

/**
 * Analyze sentiment from news articles
 * Simple keyword-based sentiment analysis
 */
function analyzeSentiment(
  articles: NewsArticle[],
  brand: string
): {
  score: number
  confidence: number
  positive: number
  negative: number
  neutral: number
} {
  const positiveKeywords = [
    'success',
    'award',
    'innovative',
    'best',
    'excellent',
    'leading',
    'top',
    'growth',
    'profit',
    'breakthrough',
    'achievement',
    'praised',
    'quality',
    'revolutionary',
  ]

  const negativeKeywords = [
    'recall',
    'lawsuit',
    'scandal',
    'fraud',
    'defect',
    'problem',
    'issue',
    'complaint',
    'failure',
    'crisis',
    'controversy',
    'warning',
    'hazard',
    'investigation',
  ]

  let positive = 0
  let negative = 0
  let neutral = 0

  articles.forEach((article) => {
    const text = `${article.title} ${article.description || ''}`.toLowerCase()

    const positiveCount = positiveKeywords.filter((kw) => text.includes(kw)).length
    const negativeCount = negativeKeywords.filter((kw) => text.includes(kw)).length

    if (positiveCount > negativeCount) {
      positive++
    } else if (negativeCount > positiveCount) {
      negative++
    } else {
      neutral++
    }
  })

  const total = articles.length
  if (total === 0) {
    return { score: 0, confidence: 0, positive: 0, negative: 0, neutral: 0 }
  }

  // Calculate score from -100 (all negative) to +100 (all positive)
  const score = ((positive - negative) / total) * 100

  // Confidence based on article count
  const confidence = Math.min(total / 50, 1.0)

  return { score, confidence, positive, negative, neutral }
}

/**
 * Extract common keywords from articles
 */
function extractKeywords(articles: NewsArticle[]): string[] {
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'is',
    'was',
    'are',
    'been',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
  ])

  const wordCounts: Record<string, number> = {}

  articles.forEach((article) => {
    const text = `${article.title} ${article.description || ''}`
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')

    const words = text.split(/\s+/).filter((word) => word.length > 3 && !stopWords.has(word))

    words.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    })
  })

  // Return top 10 keywords
  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

/**
 * Helper: Get company reputation score (0-100)
 */
export async function getCompanyReputationScore(brand: string): Promise<number> {
  try {
    const result = await getBrandSentiment(brand, { daysBack: 30, maxArticles: 100 })

    if (!result.success || !result.data) {
      return 50 // Neutral default
    }

    // Convert -100 to +100 scale to 0-100 scale
    const score = (result.data.overallScore + 100) / 2

    // Weight by confidence
    return Math.round(score * result.data.confidence + 50 * (1 - result.data.confidence))
  } catch (error) {
    logger.error('Failed to get reputation score', {
      component: 'NewsAPIFetcher',
      metadata: { brand, error: error instanceof Error ? error.message : 'Unknown' },
    })
    return 50 // Neutral default
  }
}
