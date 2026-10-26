/**
 * Conversation API
 *
 * POST /api/v1/conversation - Start new conversation
 * POST /api/v1/conversation/:id - Send message to existing conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { conversationManager } from '@/lib/agents/conversation'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { ClothingCategory } from '@/lib/agents/query/query-types'

// Start conversation request schema
const startConversationSchema = z.object({
  userId: z.string().optional(),
  userPreferences: z.object({
    favoriteCategories: z.array(z.nativeEnum(ClothingCategory)).optional(),
    favoriteBrands: z.array(z.string()).optional(),
    budgetRange: z.object({
      min: z.number(),
      max: z.number()
    }).optional(),
    sustainabilityPreference: z.enum(['required', 'preferred', 'neutral']).optional()
  }).optional()
})

// Send message request schema
const sendMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string(),
  userPreferences: z.object({
    favoriteCategories: z.array(z.nativeEnum(ClothingCategory)).optional(),
    favoriteBrands: z.array(z.string()).optional(),
    budgetRange: z.object({
      min: z.number(),
      max: z.number()
    }).optional(),
    sustainabilityPreference: z.enum(['required', 'preferred', 'neutral']).optional()
  }).optional()
})

/**
 * POST /api/v1/conversation
 * Start a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a new conversation or a message to existing one
    if (body.conversationId) {
      // Send message to existing conversation
      return await handleSendMessage(body)
    } else {
      // Start new conversation
      return await handleStartConversation(body)
    }

  } catch (error) {
    logger.error('Conversation API error', {
      error: error instanceof Error ? error.message : String(error)
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Handle starting a new conversation
 */
async function handleStartConversation(body: any) {
  const validatedData = startConversationSchema.parse(body)

  const conversationId = conversationManager.startConversation(validatedData.userId)

  logger.info('Conversation started', {
    conversationId,
    userId: validatedData.userId
  })

  return NextResponse.json({
    success: true,
    conversationId,
    message: 'Conversation started. How can I help you find the perfect clothing?',
    suggestions: [
      'Show me sustainable jeans',
      'I need a durable jacket',
      'Find me a dress for a wedding'
    ]
  }, { status: 201 })
}

/**
 * Handle sending a message to existing conversation
 */
async function handleSendMessage(body: any) {
  const validatedData = sendMessageSchema.parse(body)

  const { conversationId, message, userPreferences } = validatedData

  // Check if conversation exists
  const conversation = conversationManager.getConversation(conversationId)
  if (!conversation) {
    return NextResponse.json(
      {
        success: false,
        error: 'Conversation not found',
        message: 'The conversation ID is invalid or has expired'
      },
      { status: 404 }
    )
  }

  logger.info('Processing message', {
    conversationId,
    messageLength: message.length
  })

  // Process the message
  const response = await conversationManager.processMessage(
    conversationId,
    message,
    { userPreferences }
  )

  logger.info('Message processed', {
    conversationId,
    intent: response.intent,
    hasData: !!response.data
  })

  return NextResponse.json({
    success: true,
    conversationId,
    response: {
      message: response.message,
      intent: response.intent,
      data: response.data,
      suggestions: response.suggestions,
      followUpQuestions: response.followUpQuestions
    }
  }, { status: 200 })
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
