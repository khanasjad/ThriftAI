/**
 * Conversational AI Chat API v2
 *
 * Multi-turn conversation endpoint with product recommendations.
 * Uses conversation memory and semantic context retrieval.
 *
 * @route POST /api/v2/chat
 * @author Veritas AI Team
 * @version 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { ragPipeline } from '@/lib/rag/RAGPipeline';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequestBody {
  message: string;
  userId: string;
  conversationId?: string;
  includeProducts?: boolean;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: ChatRequestBody = await request.json();
    const { message, userId, conversationId, includeProducts = true, options } = body;

    // Validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message parameter' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid userId parameter' },
        { status: 400 }
      );
    }

    if (message.length < 1) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (maximum 2000 characters)' },
        { status: 400 }
      );
    }

    // Log request
    logger.info('Chat API called', {
      userId,
      conversationId,
      messageLength: message.length,
      includeProducts
    });

    // Execute chat pipeline
    const result = await ragPipeline.chat({
      message,
      userId,
      conversationId,
      includeProducts,
      options: {
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 500
      }
    });

    const processingTime = Date.now() - startTime;

    logger.info('Chat completed', {
      userId,
      conversationId: result.conversationId,
      hasProducts: !!result.products,
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

    logger.error('Chat API error', {
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
