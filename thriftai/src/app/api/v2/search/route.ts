/**
 * RAG-Powered Search API v2
 *
 * Next-generation search endpoint using complete RAG pipeline:
 * - Multi-source retrieval (vector + SQL + API)
 * - Reciprocal Rank Fusion
 * - Cross-encoder reranking
 * - Conversational responses
 *
 * @route POST /api/v2/search
 * @author Veritas AI Team
 * @version 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { ragPipeline } from '@/lib/rag/RAGPipeline';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SearchRequestBody {
  query: string;
  userId?: string;
  sessionId?: string;
  filters?: {
    priceRange?: { min: number; max: number };
    categories?: string[];
    brands?: string[];
    condition?: string[];
  };
  options?: {
    limit?: number;
    enableReranking?: boolean;
    enableConversation?: boolean;
    temperature?: number;
    complexity?: 'simple' | 'medium' | 'complex' | 'expert';
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: SearchRequestBody = await request.json();
    const { query, userId, sessionId, filters, options } = body;

    // Validation
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query parameter' },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Query too short (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Query too long (maximum 500 characters)' },
        { status: 400 }
      );
    }

    // Log request
    logger.info('RAG search API called', {
      query,
      userId,
      hasFilters: !!filters,
      options
    });

    // Execute RAG pipeline with API key check
    let result;
    const hasAIKeys = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);

    if (!hasAIKeys) {
      // Fallback to SQL-only search when no API keys available
      logger.warn('No AI API keys configured, using SQL-only search');
      const { multiSourceRetriever } = await import('@/lib/rag/MultiSourceRetriever');

      const retrievalResult = await multiSourceRetriever.retrieve({
        query,
        limit: options?.limit || 50,
        filters
      });

      result = {
        query,
        results: retrievalResult.documents.slice(0, options?.limit || 20).map((doc: any) => ({
          id: doc.metadata?.productId || doc.id,
          asin: doc.metadata?.productId || doc.id,
          title: doc.metadata?.name || 'Product',
          name: doc.metadata?.name || 'Product',
          brand: doc.metadata?.brand,
          category: doc.metadata?.category,
          price: {
            current: doc.metadata?.price || 0,
            original: doc.metadata?.price || 0,
            currency: 'USD',
            discountPercentage: 0
          },
          description: doc.content || doc.metadata?.description || '',
          images: doc.metadata?.imageUrl ? [doc.metadata.imageUrl] :
                  doc.metadata?.images ? doc.metadata.images :
                  [`https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=${encodeURIComponent((doc.metadata?.name || 'Product').substring(0, 20))}`],
          score: doc.score,
          aiScore: doc.metadata?.aiScore,
          veritasScore: doc.metadata?.aiScore,
          condition: doc.metadata?.condition || 'Good',
          availability: {
            inStock: doc.metadata?.inStock ?? true,
            quantity: doc.metadata?.stockQuantity || 1,
            shippingDays: 5,
            shippingCost: 0
          },
          reviews: {
            rating: 4.0,
            count: 0,
            verified: true
          },
          seller: {
            name: 'Veritas Marketplace',
            rating: 4.5,
            verified: true
          },
          specifications: {
            category: doc.metadata?.category || 'GENERAL',
            condition: doc.metadata?.condition || 'Good'
          },
          metadata: doc.metadata
        })),
        metadata: {
          totalResults: retrievalResult.documents.length,
          processingTime: retrievalResult.processingTime,
          sources: retrievalResult.totalSources ? ['sql'] : [],
          reranked: false,
          note: 'Using SQL-only search (no AI keys configured)'
        }
      };
    } else {
      // Full RAG pipeline with AI features
      const ragResult = await ragPipeline.search({
        query,
        userId,
        sessionId,
        filters,
        options: {
          limit: options?.limit || 20,
          enableReranking: options?.enableReranking ?? true,
          enableConversation: options?.enableConversation ?? false,
          temperature: options?.temperature,
          complexity: options?.complexity
        }
      });

      // Map results to ensure images array is present
      result = {
        ...ragResult,
        results: ragResult.results.map((item: any) => ({
          ...item,
          images: item.images || (item.imageUrl ? [item.imageUrl] : [
            `https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=${encodeURIComponent((item.name || 'Product').substring(0, 20))}`
          ]),
          // Ensure all expected fields are present
          asin: item.asin || item.id,
          title: item.title || item.name,
          veritasScore: item.aiScore || item.veritasScore || 0, // Map aiScore to veritasScore
          price: typeof item.price === 'number' ? {
            current: item.price,
            original: item.price,
            currency: 'USD',
            discountPercentage: 0
          } : item.price,
          availability: item.availability || {
            inStock: item.inStock ?? true,
            quantity: 1,
            shippingDays: 5,
            shippingCost: 0
          },
          reviews: item.reviews || {
            rating: 4.0,
            count: 0,
            verified: true
          },
          seller: item.seller || {
            name: 'Veritas Marketplace',
            rating: 4.5,
            verified: true
          }
        }))
      };
    }

    const processingTime = Date.now() - startTime;

    logger.info('RAG search completed', {
      query,
      resultsCount: result.results.length,
      processingTime
    });

    // Return response
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        version: '2.0.0',
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('RAG search API error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTime
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development'
          ? error instanceof Error ? error.message : String(error)
          : 'An error occurred while processing your request',
        meta: {
          version: '2.0.0',
          processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET method for simple queries (query string)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 }
    );
  }

  // Convert to POST format and execute
  const body: SearchRequestBody = {
    query,
    userId: searchParams.get('userId') || undefined,
    options: {
      limit: parseInt(searchParams.get('limit') || '20'),
      enableReranking: searchParams.get('rerank') !== 'false',
      enableConversation: searchParams.get('conversation') === 'true'
    }
  };

  // Reuse POST handler logic
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  );
}
