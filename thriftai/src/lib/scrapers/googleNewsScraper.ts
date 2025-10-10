/**
 * Google News Sentiment Scraper
 * FREE - RSS feeds + Claude AI analysis
 *
 * Tracks brand reputation and news sentiment:
 * - Recent news articles about brand
 * - Sentiment analysis (positive/negative/neutral)
 * - Reputation score (0-100)
 * - Controversy detection
 * - Public perception trends
 *
 * Coverage: +6 parameters for Company Performance & News Sentiment
 */

import Parser from 'rss-parser'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

export interface NewsSentimentData {
  brand: string
  articleCount: number
  sentimentScore: number // -100 to +100 (negative to positive)
  sentimentLabel: 'Very Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Very Negative'
  reputationScore: number // 0-100
  hasControversy: boolean
  controversyLevel: 'None' | 'Minor' | 'Moderate' | 'Major'
  topHeadlines: string[]
  keyThemes: string[]
  publicPerceptionTrend: 'Improving' | 'Stable' | 'Declining'
  lastAnalyzed: Date
}

export interface NewsScraperOptions {
  brand: string
  maxArticles?: number // Default 10
}

const rssParser = new Parser()

/**
 * Scrape Google News and analyze sentiment
 */
export async function analyzeNewsSentiment(
  options: NewsScraperOptions
): Promise<{ success: boolean; data?: NewsSentimentData; cached: boolean; error?: string }> {

  const cacheKey = `news-sentiment:${options.brand}`

  try {
    logger.info('📰 Scraping Google News for brand sentiment', {
      component: 'NewsScraper',
      metadata: {
        brand: options.brand
      }
    })

    // Fetch news from Google News RSS
    const newsArticles = await fetchGoogleNews(options.brand, options.maxArticles || 10)

    if (newsArticles.length === 0) {
      // No news found - assume neutral reputation
      return {
        success: true,
        data: createDefaultSentiment(options.brand),
        cached: false
      }
    }

    // Analyze sentiment using Claude AI
    const sentimentAnalysis = await analyzeSentimentWithClaude(
      options.brand,
      newsArticles
    )

    logger.info('✅ News sentiment analyzed', {
      component: 'NewsScraper',
      metadata: {
        brand: options.brand,
        articleCount: newsArticles.length,
        sentimentScore: sentimentAnalysis.sentimentScore
      }
    })

    return {
      success: true,
      data: {
        ...sentimentAnalysis,
        brand: options.brand,
        articleCount: newsArticles.length,
        lastAnalyzed: new Date()
      },
      cached: false
    }

  } catch (error) {
    logger.error('❌ News sentiment analysis failed', {
      component: 'NewsScraper',
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        brand: options.brand
      }
    })

    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Fetch news articles from Google News RSS
 */
async function fetchGoogleNews(brand: string, maxArticles: number): Promise<Array<{
  title: string
  description: string
  link: string
  pubDate: Date
}>> {
  try {
    // Google News RSS feed URL
    const searchQuery = encodeURIComponent(brand)
    const rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`

    const feed = await rssParser.parseURL(rssUrl)

    const articles = feed.items.slice(0, maxArticles).map(item => ({
      title: item.title || '',
      description: item.contentSnippet || item.content || '',
      link: item.link || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date()
    }))

    return articles

  } catch (error) {
    logger.warn('⚠️  Failed to fetch Google News RSS', {
      component: 'NewsScraper',
      error: error instanceof Error ? error.message : String(error)
    })
    return []
  }
}

/**
 * Analyze sentiment using Claude AI
 */
async function analyzeSentimentWithClaude(
  brand: string,
  articles: Array<{ title: string; description: string }>
): Promise<Omit<NewsSentimentData, 'brand' | 'articleCount' | 'lastAnalyzed'>> {

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    logger.warn('⚠️  ANTHROPIC_API_KEY not set, using basic sentiment analysis')
    return analyzeBasicSentiment(brand, articles)
  }

  try {
    const anthropic = new Anthropic({ apiKey })

    // Prepare article summaries
    const articleText = articles
      .map((a, i) => `${i + 1}. ${a.title}\n   ${a.description}`)
      .join('\n\n')

    const prompt = `Analyze the sentiment and reputation of "${brand}" based on these recent news headlines:

${articleText}

Provide a JSON response with:
{
  "sentimentScore": number (-100 to +100, where -100 is very negative, 0 is neutral, +100 is very positive),
  "sentimentLabel": "Very Positive" | "Positive" | "Neutral" | "Negative" | "Very Negative",
  "reputationScore": number (0-100, overall brand reputation),
  "hasControversy": boolean,
  "controversyLevel": "None" | "Minor" | "Moderate" | "Major",
  "topHeadlines": array of 3 most significant headlines,
  "keyThemes": array of 3-5 main themes from the news,
  "publicPerceptionTrend": "Improving" | "Stable" | "Declining"
}

Focus on:
- Product quality issues
- Legal/ethical problems
- Innovation announcements
- Customer satisfaction
- Financial performance
- Leadership changes

Only return the JSON, no other text.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    // Extract JSON from response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response')
    }

    const analysis = JSON.parse(jsonMatch[0])

    return analysis

  } catch (error) {
    logger.warn('⚠️  Claude AI analysis failed, using basic sentiment', {
      component: 'NewsScraper',
      error: error instanceof Error ? error.message : String(error)
    })

    return analyzeBasicSentiment(brand, articles)
  }
}

/**
 * Basic sentiment analysis (fallback if Claude unavailable)
 */
function analyzeBasicSentiment(
  brand: string,
  articles: Array<{ title: string; description: string }>
): Omit<NewsSentimentData, 'brand' | 'articleCount' | 'lastAnalyzed'> {

  // Positive and negative keywords
  const positiveWords = [
    'innovation', 'success', 'award', 'best', 'excellent', 'breakthrough',
    'growth', 'profit', 'leading', 'launch', 'wins', 'partnership',
    'expansion', 'revolutionary', 'achievement', 'acclaimed'
  ]

  const negativeWords = [
    'lawsuit', 'recall', 'controversy', 'scandal', 'failure', 'loss',
    'bankruptcy', 'fraud', 'violation', 'fine', 'investigation', 'complaint',
    'defect', 'problem', 'issue', 'crisis', 'decline', 'criticism'
  ]

  let positiveCount = 0
  let negativeCount = 0
  const topHeadlines: string[] = []
  const themes = new Set<string>()

  for (const article of articles) {
    const text = `${article.title} ${article.description}`.toLowerCase()

    // Count sentiment words
    for (const word of positiveWords) {
      if (text.includes(word)) positiveCount++
    }

    for (const word of negativeWords) {
      if (text.includes(word)) negativeCount++
    }

    // Collect headlines
    if (topHeadlines.length < 3) {
      topHeadlines.push(article.title)
    }

    // Extract themes (simple keyword extraction)
    const words = article.title.toLowerCase().split(/\s+/)
    for (const word of words) {
      if (word.length > 5 && !['about', 'their', 'which', 'would'].includes(word)) {
        themes.add(word)
      }
    }
  }

  // Calculate sentiment score
  const totalWords = positiveCount + negativeCount
  const sentimentScore = totalWords > 0
    ? Math.round(((positiveCount - negativeCount) / totalWords) * 100)
    : 0

  // Determine sentiment label
  let sentimentLabel: NewsSentimentData['sentimentLabel']
  if (sentimentScore > 50) sentimentLabel = 'Very Positive'
  else if (sentimentScore > 20) sentimentLabel = 'Positive'
  else if (sentimentScore > -20) sentimentLabel = 'Neutral'
  else if (sentimentScore > -50) sentimentLabel = 'Negative'
  else sentimentLabel = 'Very Negative'

  // Reputation score (50-100 for positive, 0-50 for negative)
  const reputationScore = Math.max(0, Math.min(100, 50 + sentimentScore / 2))

  // Controversy detection
  const hasControversy = negativeCount > positiveCount && negativeCount > 2
  let controversyLevel: NewsSentimentData['controversyLevel']
  if (negativeCount >= 5) controversyLevel = 'Major'
  else if (negativeCount >= 3) controversyLevel = 'Moderate'
  else if (negativeCount >= 1) controversyLevel = 'Minor'
  else controversyLevel = 'None'

  // Public perception trend
  let publicPerceptionTrend: NewsSentimentData['publicPerceptionTrend']
  if (sentimentScore > 30) publicPerceptionTrend = 'Improving'
  else if (sentimentScore < -30) publicPerceptionTrend = 'Declining'
  else publicPerceptionTrend = 'Stable'

  return {
    sentimentScore,
    sentimentLabel,
    reputationScore: Math.round(reputationScore),
    hasControversy,
    controversyLevel,
    topHeadlines,
    keyThemes: Array.from(themes).slice(0, 5),
    publicPerceptionTrend
  }
}

/**
 * Create default sentiment data (no news found)
 */
function createDefaultSentiment(brand: string): NewsSentimentData {
  return {
    brand,
    articleCount: 0,
    sentimentScore: 0,
    sentimentLabel: 'Neutral',
    reputationScore: 70, // Assume neutral/good reputation if no news
    hasControversy: false,
    controversyLevel: 'None',
    topHeadlines: [],
    keyThemes: [],
    publicPerceptionTrend: 'Stable',
    lastAnalyzed: new Date()
  }
}

/**
 * Get fallback sentiment data
 */
export function getFallbackSentiment(brand: string): NewsSentimentData {
  // Assume good reputation for well-known brands
  const wellKnownBrands = [
    'Apple', 'Samsung', 'Sony', 'Microsoft', 'Nike', 'Adidas',
    'Dell', 'HP', 'Lenovo', 'Canon', 'Nikon', 'LG'
  ]

  const isWellKnown = wellKnownBrands.includes(brand)

  return {
    brand,
    articleCount: 0,
    sentimentScore: isWellKnown ? 30 : 0,
    sentimentLabel: isWellKnown ? 'Positive' : 'Neutral',
    reputationScore: isWellKnown ? 80 : 70,
    hasControversy: false,
    controversyLevel: 'None',
    topHeadlines: [],
    keyThemes: [],
    publicPerceptionTrend: 'Stable',
    lastAnalyzed: new Date()
  }
}

/**
 * Calculate brand trust score based on news sentiment
 */
export function calculateBrandTrustScore(data: NewsSentimentData): number {
  let score = data.reputationScore

  // Penalize for controversy
  if (data.hasControversy) {
    if (data.controversyLevel === 'Major') score -= 30
    else if (data.controversyLevel === 'Moderate') score -= 15
    else if (data.controversyLevel === 'Minor') score -= 5
  }

  // Adjust for trend
  if (data.publicPerceptionTrend === 'Improving') score += 10
  else if (data.publicPerceptionTrend === 'Declining') score -= 10

  return Math.max(0, Math.min(100, score))
}
