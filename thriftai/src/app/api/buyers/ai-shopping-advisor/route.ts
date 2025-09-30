import { NextRequest, NextResponse } from 'next/server'
import { claudeShoppingAdvisor } from '@/lib/services/claudeShoppingAdvisor'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory = [], searchContext } = body

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: 'conversationHistory must be an array' },
        { status: 400 }
      )
    }

    logger.info('AI Shopping Advisor request', {
      messageLength: message.length,
      historyLength: conversationHistory.length,
      hasSearchContext: !!searchContext
    })

    // Call Claude shopping advisor
    const response = await claudeShoppingAdvisor.chat({
      message,
      conversationHistory,
      searchContext
    })

    logger.info('AI Shopping Advisor response generated', {
      messageLength: response.message.length,
      productCount: response.products.length,
      claudeAvailable: claudeShoppingAdvisor.isAvailable()
    })

    return NextResponse.json({
      message: response.message,
      products: response.products,
      intent: response.intent,
      claudeAvailable: claudeShoppingAdvisor.isAvailable(),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('AI Shopping Advisor API error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        claudeAvailable: claudeShoppingAdvisor.isAvailable()
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    claudeAvailable: claudeShoppingAdvisor.isAvailable(),
    timestamp: new Date().toISOString()
  })
}