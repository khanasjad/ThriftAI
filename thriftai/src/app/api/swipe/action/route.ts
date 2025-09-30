import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      productId,
      action, // 'LIKE' | 'SKIP' | 'VIEW_DETAILS'
      cardPosition,
      timeSpent,
      swipeDirection,
      swipeVelocity,
      viewedDetails,
      scrollDepth
    } = body

    if (!sessionId || !productId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Record the swipe action
    const swipeAction = await prisma.swipeAction.create({
      data: {
        sessionId,
        productId,
        action,
        cardPosition: cardPosition || null,
        timeSpent: timeSpent || null,
        swipeDirection: swipeDirection || null,
        swipeVelocity: swipeVelocity || null,
        viewedDetails: viewedDetails || false,
        scrollDepth: scrollDepth || null
      }
    })

    // Update session metrics
    await prisma.swipeSession.update({
      where: { id: sessionId },
      data: {
        totalSwipes: { increment: 1 },
        totalLikes: action === 'LIKE' ? { increment: 1 } : undefined,
        totalSkips: action === 'SKIP' ? { increment: 1 } : undefined,
        totalViewDetails: action === 'VIEW_DETAILS' ? { increment: 1 } : undefined
      }
    })

    // If liked, optionally add to cart
    let cartItemId: string | undefined

    if (action === 'LIKE') {
      // You can add cart logic here if needed
      logger.info('👍 Product liked', { sessionId, productId })
    }

    logger.info('📊 Swipe action recorded', {
      sessionId,
      productId,
      action
    })

    return NextResponse.json({
      success: true,
      actionId: swipeAction.id,
      cartItemId
    })

  } catch (error) {
    logger.error('❌ Failed to record swipe action', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        error: 'Failed to record action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
