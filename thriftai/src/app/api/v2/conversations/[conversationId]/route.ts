/**
 * Conversation History API
 *
 * Retrieve conversation history and metadata.
 *
 * @route GET /api/v2/conversations/:conversationId
 * @route DELETE /api/v2/conversations/:conversationId
 * @author Veritas AI Team
 * @version 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { conversationStore } from '@/lib/memory/ConversationStore';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET conversation history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const startTime = Date.now();
  const { conversationId } = params;

  try {
    // Validate conversationId
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId parameter' },
        { status: 400 }
      );
    }

    logger.info('Fetching conversation', { conversationId });

    // Get conversation
    const conversation = await conversationStore.getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const processingTime = Date.now() - startTime;

    logger.info('Conversation retrieved', {
      conversationId,
      messageCount: conversation.messages.length,
      processingTime
    });

    return NextResponse.json({
      success: true,
      data: conversation,
      meta: {
        version: '2.0.0',
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('Get conversation error', {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
      processingTime
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development'
          ? error instanceof Error ? error.message : String(error)
          : 'An error occurred while fetching the conversation',
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
 * DELETE conversation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const startTime = Date.now();
  const { conversationId } = params;

  try {
    // Validate conversationId
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId parameter' },
        { status: 400 }
      );
    }

    logger.info('Deleting conversation', { conversationId });

    // Delete conversation
    await conversationStore.deleteConversation(conversationId);

    const processingTime = Date.now() - startTime;

    logger.info('Conversation deleted', {
      conversationId,
      processingTime
    });

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        deleted: true
      },
      meta: {
        version: '2.0.0',
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('Delete conversation error', {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
      processingTime
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development'
          ? error instanceof Error ? error.message : String(error)
          : 'An error occurred while deleting the conversation',
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
