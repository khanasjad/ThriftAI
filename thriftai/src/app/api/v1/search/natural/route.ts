/**
 * Natural Language Search API
 *
 * POST /api/v1/search/natural
 *
 * Accepts natural language queries and returns structured search results
 * using our query understanding agent and vector search.
 */

import { NextRequest, NextResponse } from 'next/server'
import { understandQuery } from '@/lib/agents/query'
import { vectorSearchService } from '@/lib/services/vectorSearchService'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Request validation schema
const searchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  context: z.object({
    conversationHistory: z.array(z.any()).optional(),
    userPreferences: z.object({
      favoriteCategories: z.array(z.string()).optional(),
      favoriteBrands: z.array(z.string()).optional(),
      budgetRange: z.object({
        min: z.number(),
        max: z.number()
      }).optional(),
      sustainabilityPreference: z.enum(['required', 'preferred', 'neutral']).optional()
    }).optional()
  }).optional(),
  options: z.object({
    includeExplanation: z.boolean().optional(),
    suggestRefinements: z.boolean().optional(),
    limit: z.number().min(1).max(100).optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = searchRequestSchema.parse(body)

    const { query, context, options } = validatedData

    logger.info('Natural language search request', {
      query,
      hasContext: !!context,
      options
    })

    // Step 1: Understand the query
    const understanding = await understandQuery({
      query,
      context,
      options
    })

    logger.info('Query understood', {
      intent: understanding.intent,
      confidence: understanding.confidence,
      filtersGenerated: Object.keys(understanding.filters).length
    })

    // Step 2: Execute vector search with generated filters
    const searchResults = await vectorSearchService.search({
      query: understanding.semanticQuery,
      limit: options?.limit || understanding.filters.limit || 20,
      categoryFilter: understanding.filters.categories,
      priceRange: understanding.filters.priceMin || understanding.filters.priceMax
        ? {
            min: understanding.filters.priceMin || 0,
            max: understanding.filters.priceMax || 999999
          }
        : undefined,
      minAiScore: understanding.filters.minOverallScore
    })

    // Step 3: Build response
    const response = {
      success: true,
      query: {
        original: query,
        understood: understanding.semanticQuery,
        intent: understanding.intent,
        confidence: understanding.confidence
      },
      filters: understanding.filters,
      results: searchResults.results,
      metadata: {
        ...searchResults.metadata,
        totalResults: searchResults.results.length,
        processingTime: Date.now() - startTime
      },
      suggestions: understanding.suggestedRefinements,
      clarifications: understanding.clarificationNeeded
    }

    logger.info('Natural language search completed', {
      resultsFound: response.results.length,
      processingTime: response.metadata.processingTime
    })

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    logger.error('Natural language search failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
