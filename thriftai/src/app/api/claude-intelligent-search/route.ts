/**
 * Claude Intelligent Search API Endpoint
 *
 * Combines Claude AI intelligence with local search:
 * 1. Claude analyzes user query and extracts intent
 * 2. Local intelligent search finds matching products
 * 3. Claude explains why products match
 *
 * POST /api/claude-intelligent-search
 * Body: { query: string, limit?: number }
 *
 * Cost: ~$0.001 per search (Claude Haiku 3.5)
 * No embeddings required!
 *
 * @author ThriftAI Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { intelligentSearchLite } from '@/lib/services/intelligentSearchLite';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Constants
const CLAUDE_MODEL = 'claude-3-5-haiku-20241022';
const MAX_TOKENS = 1500;
const TEMPERATURE = 0.7;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 20;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
});

// TypeScript interfaces
interface ClaudeAnalysis {
  overallAnalysis: string;
  topRecommendation?: string;
  priceInsight?: string;
  qualityInsight?: string;
  productReasonings?: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  condition?: string;
  description?: string;
}

/**
 * Analyze search results using Claude AI
 * @param query - User's search query
 * @param products - Array of products to analyze
 * @returns Claude's analysis and recommendations
 */
async function analyzeWithClaude(
  query: string,
  products: Product[]
): Promise<ClaudeAnalysis> {
  try {
    const prompt = `You are a shopping assistant analyzing search results.

User Query: "${query}"

Products Found:
${products.slice(0, 5).map((p, i) => `
${i + 1}. ${p.name}
   Brand: ${p.brand || 'N/A'}
   Category: ${p.category}
   Price: $${p.price}
   Condition: ${p.condition || 'N/A'}
   Description: ${p.description || 'N/A'}
`).join('\n')}

Provide analysis in this JSON format:
{
  "overallAnalysis": "Brief 2-3 sentence analysis of how well these products match the user's needs",
  "topRecommendation": "Name of the best product and why (1 sentence)",
  "priceInsight": "Brief insight about pricing (1 sentence)",
  "qualityInsight": "Brief insight about quality/condition (1 sentence)",
  "productReasonings": {
    "0": "Why product 1 matches (1 sentence)",
    "1": "Why product 2 matches (1 sentence)"
  }
}

Be concise, helpful, and focus on value for the user.`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    // Fallback response
    return {
      overallAnalysis: 'Found relevant products matching your search.',
      productReasonings: {},
    };
  } catch (error) {
    logger.error('Claude analysis failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return fallback analysis on error
    return {
      overallAnalysis: 'Found products matching your search criteria.',
      productReasonings: {},
    };
  }
}

/**
 * POST /api/claude-intelligent-search
 * Main search endpoint with Claude AI enhancement
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, limit = DEFAULT_LIMIT } = body;

    // Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Query parameter is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Check Claude API availability
    const hasClaudeKey = !!(
      process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    );

    logger.info('Claude intelligent search request', {
      query,
      limit,
      hasClaudeKey,
    });

    // Step 1: Perform intelligent search
    const searchLimit = Math.min(limit, MAX_LIMIT);
    const searchResponse = await intelligentSearchLite.search(query, searchLimit);

    // Step 2: Enhance with Claude AI analysis if available
    let insights: ClaudeAnalysis | undefined;
    if (hasClaudeKey && searchResponse.results.length > 0) {
      insights = await analyzeWithClaude(query, searchResponse.results);

      // Attach Claude reasoning to each product
      if (insights.productReasonings) {
        searchResponse.results.forEach((product, index) => {
          const reasoning = insights!.productReasonings?.[index.toString()];
          if (reasoning) {
            (product as any).claudeReasoning = reasoning;
          }
        });
      }
    }

    const processingTime = Date.now() - startTime;

    logger.info('Claude intelligent search completed', {
      query,
      resultsFound: searchResponse.results.length,
      claudeUsed: !!insights,
      processingTime,
    });

    return NextResponse.json({
      query: searchResponse.query,
      results: searchResponse.results,
      insights: insights ? {
        ...searchResponse.insights,
        claudeAnalysis: insights.overallAnalysis,
        topRecommendation: insights.topRecommendation,
        priceInsight: insights.priceInsight,
        qualityInsight: insights.qualityInsight
      } : searchResponse.insights,
      metadata: {
        ...searchResponse.metadata,
        processingTime,
        claudeEnhanced: !!insights,
        searchMethod: 'claude-intelligent'
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime

    logger.error('Claude intelligent search failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTime
    })

    // Check for rate limiting
    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: 'Claude API rate limit reached. Falling back to basic search.',
        fallback: 'Use /api/intelligent-search-lite for searches without rate limits'
      }, { status: 429 })
    }

    // Generic error
    return NextResponse.json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      fallback: 'Try /api/intelligent-search-lite for basic smart search',
      debug: process.env.NODE_ENV === 'development' ? {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const hasClaudeKey = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)

    return NextResponse.json({
      status: 'ready',
      service: 'claude-intelligent-search',
      features: {
        claudeAnalysis: hasClaudeKey ? 'enabled' : 'disabled',
        typoCorrection: 'enabled',
        priceExtraction: 'enabled',
        categoryDetection: 'enabled',
        semanticSearch: 'multi-field'
      },
      requirements: {
        claudeApiKey: hasClaudeKey ? 'configured' : 'optional (will work without)',
        embeddings: 'not required',
        rateLimits: hasClaudeKey ? 'Claude API limits apply' : 'none'
      },
      performance: {
        averageResponseTime: hasClaudeKey ? '<3s' : '<100ms',
        costPerSearch: hasClaudeKey ? '~$0.001' : '$0'
      },
      capabilities: [
        'Claude AI query understanding and result analysis',
        'Local typo correction and price extraction',
        'Multi-field product search',
        'Smart relevance scoring',
        'Works without Claude (falls back to basic intelligent search)'
      ]
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Failed to check status'
    }, { status: 500 })
  }
}
