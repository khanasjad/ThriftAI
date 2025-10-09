/**
 * Claude-Powered Semantic Search API Endpoint
 *
 * 3-Layer Intelligent Search:
 * 1. Claude Intent Layer: Understands natural language, fixes typos, extracts filters (Haiku 3.5)
 * 2. Semantic Search Layer: Finds products using vector similarity + database filters (OpenAI)
 * 3. Claude Explanation Layer: Analyzes and explains why products match user intent (Haiku 3.5)
 *
 * POST /api/claude-search
 * Body: { query: string, limit?: number }
 *
 * Returns: ClaudeSearchResponse with products, insights, and metadata
 *
 * Cost: ~$0.0005 per search (~2000 searches per dollar) using Claude Haiku 3.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { claudeSemanticSearch } from '@/lib/services/claudeSemanticSearchService'
import { simpleSemanticSearch } from '@/lib/services/simpleSemanticSearch'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/claude-search
 *
 * Request Body:
 * {
 *   "query": "looking for a vintage designer handbag under $500",
 *   "limit": 20
 * }
 *
 * Response:
 * {
 *   "query": {
 *     "original": "...",
 *     "normalized": "...",
 *     "intent": "...",
 *     "confidence": 0.95
 *   },
 *   "results": [
 *     {
 *       "id": "...",
 *       "name": "...",
 *       "price": 399,
 *       "matchScore": 92,
 *       "claudeReasoning": "This vintage Gucci handbag matches your request because..."
 *     }
 *   ],
 *   "insights": {
 *     "overallAnalysis": "...",
 *     "topRecommendation": "...",
 *     "priceInsight": "...",
 *     "qualityInsight": "..."
 *   },
 *   "metadata": {
 *     "totalResults": 15,
 *     "processingTime": 2345,
 *     "intentConfidence": 0.95,
 *     "searchMethod": "semantic"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { query, limit = 20 } = body

    // Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Query parameter is required and must be a string',
          example: { query: 'vintage designer handbag under $500', limit: 20 }
        },
        { status: 400 }
      )
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Empty query', message: 'Query cannot be empty' },
        { status: 400 }
      )
    }

    logger.info('Claude search request received', { query, limit })

    // Check if embeddings exist
    const stats = await simpleSemanticSearch.getStatistics()
    if (stats.withEmbeddings === 0) {
      logger.warn('No embeddings found, returning guidance message')
      return NextResponse.json({
        error: 'Embeddings not generated',
        message: 'Semantic search requires embeddings to be generated first',
        guidance: {
          step1: 'Generate embeddings by running: npx tsx scripts/generate-embeddings-simple.ts',
          step2: 'Or call POST /api/semantic-search with body: { limit: 100 }',
          step3: 'Requires OPENAI_API_KEY environment variable',
          currentStats: {
            totalProducts: stats.totalProducts,
            withEmbeddings: stats.withEmbeddings,
            progress: `${stats.percentageComplete.toFixed(1)}%`
          }
        }
      }, { status: 503 })
    }

    // Perform Claude-powered semantic search
    const response = await claudeSemanticSearch.search(query, Math.min(limit, 100))

    const processingTime = Date.now() - startTime

    logger.info('Claude search completed successfully', {
      query,
      resultsFound: response.results.length,
      processingTime,
      intentConfidence: response.metadata.intentConfidence
    })

    return NextResponse.json({
      ...response,
      metadata: {
        ...response.metadata,
        processingTime
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime

    logger.error('Claude search failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTime
    })

    // Check for specific error types
    if (error instanceof Error) {
      // Claude API error
      if (error.message.includes('ANTHROPIC_API_KEY') || error.message.includes('API key')) {
        return NextResponse.json({
          error: 'Claude API key not configured',
          message: 'ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable is required',
          fallback: 'You can use /api/semantic-search instead for basic semantic search without Claude insights'
        }, { status: 503 })
      }

      // OpenAI API error
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json({
          error: 'OpenAI API key not configured',
          message: 'OPENAI_API_KEY environment variable is required for embeddings',
          guidance: 'Set your OpenAI API key in .env file: OPENAI_API_KEY=sk-...'
        }, { status: 503 })
      }

      // Rate limiting
      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again in a moment.',
          retryAfter: 60
        }, { status: 429 })
      }
    }

    // Generic error response
    return NextResponse.json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      fallback: 'Try using /api/semantic-search or /api/buyers/chat-search instead',
      debug: process.env.NODE_ENV === 'development' ? {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    }, { status: 500 })
  }
}

/**
 * GET /api/claude-search/status
 *
 * Check if Claude search is ready to use
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await simpleSemanticSearch.getStatistics()

    const hasClaudeKey = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasEmbeddings = stats.withEmbeddings > 0

    const isReady = hasClaudeKey && hasOpenAIKey && hasEmbeddings

    return NextResponse.json({
      status: isReady ? 'ready' : 'not_ready',
      requirements: {
        claudeApiKey: hasClaudeKey ? 'configured' : 'missing',
        openaiApiKey: hasOpenAIKey ? 'configured' : 'missing',
        embeddings: hasEmbeddings ? 'available' : 'not_generated'
      },
      embeddingStats: {
        totalProducts: stats.totalProducts,
        withEmbeddings: stats.withEmbeddings,
        withoutEmbeddings: stats.withoutEmbeddings,
        percentageComplete: Math.round(stats.percentageComplete)
      },
      capabilities: {
        intentExtraction: hasClaudeKey,
        semanticSearch: hasOpenAIKey && hasEmbeddings,
        resultExplanation: hasClaudeKey
      },
      nextSteps: !isReady ? [
        !hasClaudeKey && 'Set ANTHROPIC_API_KEY or CLAUDE_API_KEY in .env',
        !hasOpenAIKey && 'Set OPENAI_API_KEY in .env',
        !hasEmbeddings && 'Generate embeddings: npx tsx scripts/generate-embeddings-simple.ts'
      ].filter(Boolean) : []
    })
  } catch (error) {
    logger.error('Status check failed', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json({
      status: 'error',
      error: 'Failed to check status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
