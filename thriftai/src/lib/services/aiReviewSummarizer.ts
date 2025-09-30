import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export interface ReviewSummary {
  pros: string[]
  cons: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  aiScore: number // 0-100
  confidence: number // 0-1
  reviewCount: number
  avgRating: number
}

const REVIEW_SUMMARY_PROMPT = `You are an expert product review analyzer. Analyze customer reviews and extract key insights.

Your task:
1. Identify the TOP 2-3 PROS (what customers love)
2. Identify the TOP 2-3 CONS (what customers dislike - leave empty if overwhelmingly positive)
3. Determine overall SENTIMENT (positive/neutral/negative)
4. Calculate an AI QUALITY SCORE (0-100) based on:
   - Product quality mentions
   - Customer satisfaction
   - Value for money
   - Reliability
5. Your CONFIDENCE level (0-1) in this analysis

Return ONLY valid JSON in this exact format:
{
  "pros": ["First positive aspect", "Second positive aspect"],
  "cons": ["First negative aspect"],
  "sentiment": "positive",
  "aiScore": 87,
  "confidence": 0.92
}

Guidelines:
- Be concise (max 15 words per pro/con)
- Focus on actionable insights
- Sentiment: positive (mostly happy), neutral (mixed), negative (mostly unhappy)
- aiScore: Consider quality, value, reliability, satisfaction
- confidence: How certain you are based on review quality and quantity`

export class AIReviewSummarizer {
  private anthropic: Anthropic | null = null
  private isAvailable: boolean = false

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

    if (apiKey && !apiKey.includes('demo')) {
      try {
        this.anthropic = new Anthropic({ apiKey })
        this.isAvailable = true
        logger.info('✅ AI Review Summarizer initialized')
      } catch (error) {
        logger.error('❌ Failed to initialize AI Review Summarizer', { error })
        this.isAvailable = false
      }
    } else {
      logger.warn('⚠️ Claude API not configured - using fallback summaries')
      this.isAvailable = false
    }
  }

  /**
   * Get or generate AI summary for a product
   * Uses caching for performance (7-day cache)
   */
  async getSummary(productId: string): Promise<ReviewSummary> {
    try {
      // Check cache first (7 days)
      const cached = await prisma.productAISummary.findUnique({
        where: { productId }
      })

      const cacheAge = cached
        ? Date.now() - cached.updatedAt.getTime()
        : Infinity
      const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

      if (cached && cacheAge < CACHE_DURATION) {
        logger.info('✅ Using cached AI summary', { productId, ageHours: Math.round(cacheAge / 3600000) })
        return cached.summary as ReviewSummary
      }

      // Generate new summary
      logger.info('🤖 Generating new AI summary', { productId })
      const summary = await this.generateSummary(productId)

      // Cache the result
      await prisma.productAISummary.upsert({
        where: { productId },
        update: {
          summary: summary as any,
          reviewCount: summary.reviewCount,
          avgRating: summary.avgRating,
          updatedAt: new Date()
        },
        create: {
          productId,
          summary: summary as any,
          reviewCount: summary.reviewCount,
          avgRating: summary.avgRating
        }
      })

      return summary
    } catch (error) {
      logger.error('❌ Failed to get AI summary', { productId, error })
      return this.defaultSummary()
    }
  }

  /**
   * Generate fresh AI summary from reviews
   */
  private async generateSummary(productId: string): Promise<ReviewSummary> {
    // Fetch reviews from database
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status: 'APPROVED' // Only use approved reviews
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Analyze up to 100 most recent reviews
      select: {
        rating: true,
        title: true,
        content: true,
        conditionRating: true,
        valueRating: true,
        isVerifiedPurchase: true
      }
    })

    if (reviews.length === 0) {
      return this.defaultSummary()
    }

    // Calculate average rating
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

    // Use fallback if Claude not available
    if (!this.isAvailable || !this.anthropic) {
      return this.fallbackSummary(reviews, avgRating)
    }

    // Generate with Claude AI
    try {
      const summary = await this.generateWithClaude(reviews)
      return {
        ...summary,
        reviewCount: reviews.length,
        avgRating
      }
    } catch (error) {
      logger.error('❌ Claude API failed, using fallback', { error })
      return this.fallbackSummary(reviews, avgRating)
    }
  }

  /**
   * Generate summary using Claude AI
   */
  private async generateWithClaude(
    reviews: Array<{
      rating: number
      title: string
      content: string | null
      conditionRating: number | null
      valueRating: number | null
      isVerifiedPurchase: boolean
    }>
  ): Promise<Omit<ReviewSummary, 'reviewCount' | 'avgRating'>> {
    // Format reviews for Claude
    const reviewText = reviews
      .slice(0, 50) // Use top 50 for token efficiency
      .map((r, i) => {
        const verified = r.isVerifiedPurchase ? '✓ Verified' : ''
        const title = r.title ? `"${r.title}"` : ''
        const content = r.content || 'No detailed review'
        return `${i + 1}. [${r.rating}/5 ${verified}] ${title}\n   ${content}`
      })
      .join('\n\n')

    const response = await this.anthropic!.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      temperature: 0.2, // Low temperature for consistent analysis
      system: REVIEW_SUMMARY_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze these ${reviews.length} customer reviews:\n\n${reviewText}\n\nReturn ONLY valid JSON.`
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate and return
    return {
      pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 3) : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 3) : [],
      sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral',
      aiScore: Math.min(100, Math.max(0, parsed.aiScore || 70)),
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5))
    }
  }

  /**
   * Fallback summary using simple heuristics
   */
  private fallbackSummary(
    reviews: Array<{
      rating: number
      content: string | null
      conditionRating: number | null
      valueRating: number | null
    }>,
    avgRating: number
  ): ReviewSummary {
    // Simple sentiment based on average rating
    let sentiment: 'positive' | 'neutral' | 'negative'
    if (avgRating >= 4) sentiment = 'positive'
    else if (avgRating >= 3) sentiment = 'neutral'
    else sentiment = 'negative'

    // Generate generic insights
    const pros: string[] = []
    const cons: string[] = []

    if (avgRating >= 4) {
      pros.push('Highly rated by customers')
      pros.push('Good value for money based on reviews')
    } else if (avgRating >= 3) {
      pros.push('Generally positive feedback from buyers')
    }

    // Check condition ratings
    const avgCondition = reviews
      .filter(r => r.conditionRating)
      .reduce((sum, r) => sum + (r.conditionRating || 0), 0) / reviews.filter(r => r.conditionRating).length

    if (avgCondition && avgCondition >= 4) {
      pros.push('Excellent condition according to reviews')
    } else if (avgCondition && avgCondition < 3) {
      cons.push('Some concerns about product condition')
    }

    // Check value ratings
    const avgValue = reviews
      .filter(r => r.valueRating)
      .reduce((sum, r) => sum + (r.valueRating || 0), 0) / reviews.filter(r => r.valueRating).length

    if (avgValue && avgValue < 3) {
      cons.push('Mixed opinions on value for money')
    }

    return {
      pros: pros.length > 0 ? pros : ['Customer reviews available'],
      cons,
      sentiment,
      aiScore: Math.round(avgRating * 20), // Convert 1-5 to 0-100
      confidence: reviews.length >= 10 ? 0.7 : 0.5,
      reviewCount: reviews.length,
      avgRating
    }
  }

  /**
   * Default summary for products without reviews
   */
  private defaultSummary(): ReviewSummary {
    return {
      pros: ['New listing - be the first to review!'],
      cons: [],
      sentiment: 'neutral',
      aiScore: 70,
      confidence: 0.3,
      reviewCount: 0,
      avgRating: 0
    }
  }

  /**
   * Batch generate summaries for multiple products (for preloading)
   */
  async batchGenerateSummaries(productIds: string[]): Promise<Map<string, ReviewSummary>> {
    const results = new Map<string, ReviewSummary>()

    // Process in parallel (but limit concurrency to avoid rate limits)
    const BATCH_SIZE = 5
    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      const batch = productIds.slice(i, i + BATCH_SIZE)
      const summaries = await Promise.all(
        batch.map(async (id) => {
          try {
            const summary = await this.getSummary(id)
            return { id, summary }
          } catch (error) {
            logger.error('Failed to generate summary in batch', { productId: id, error })
            return { id, summary: this.defaultSummary() }
          }
        })
      )

      summaries.forEach(({ id, summary }) => results.set(id, summary))

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < productIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    logger.info('✅ Batch summary generation complete', {
      total: productIds.length,
      successful: results.size
    })

    return results
  }
}

// Singleton instance
export const aiReviewSummarizer = new AIReviewSummarizer()
