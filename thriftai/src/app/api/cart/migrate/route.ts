import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * POST /api/cart/migrate
 * Migrates guest cart items to logged-in user's cart
 * Called after successful authentication
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'User must be authenticated' },
        { status: 401 }
      )
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const buyerId = session.user.id

    logger.info('🔄 Starting cart migration', {
      sessionId,
      buyerId
    })

    // Find all guest cart items for this session
    const guestCartItems = await prisma.cartItem.findMany({
      where: {
        sessionId,
        buyerId: null
      },
      include: {
        product: true
      }
    })

    if (guestCartItems.length === 0) {
      logger.info('✅ No guest cart items to migrate', { sessionId })
      return NextResponse.json({
        success: true,
        migrated: 0,
        message: 'No items to migrate'
      })
    }

    logger.info(`📦 Found ${guestCartItems.length} guest cart items to migrate`)

    let migratedCount = 0
    let mergedCount = 0
    let skippedCount = 0

    // Process each guest cart item
    for (const guestItem of guestCartItems) {
      try {
        // Check if user already has this product in their cart
        const existingUserItem = await prisma.cartItem.findFirst({
          where: {
            productId: guestItem.productId,
            buyerId
          }
        })

        if (existingUserItem) {
          // Merge quantities: add guest quantity to existing user item
          await prisma.cartItem.update({
            where: { id: existingUserItem.id },
            data: {
              quantity: existingUserItem.quantity + guestItem.quantity,
              priceAtTime: guestItem.product.price // Update to current price
            }
          })

          // Delete the guest cart item
          await prisma.cartItem.delete({
            where: { id: guestItem.id }
          })

          mergedCount++
          logger.info('🔀 Merged cart item', {
            productId: guestItem.productId,
            guestQuantity: guestItem.quantity,
            existingQuantity: existingUserItem.quantity,
            newQuantity: existingUserItem.quantity + guestItem.quantity
          })
        } else {
          // No conflict - simply transfer ownership to the logged-in user
          await prisma.cartItem.update({
            where: { id: guestItem.id },
            data: {
              buyerId,
              sessionId: null // Clear sessionId
            }
          })

          migratedCount++
          logger.info('✅ Migrated cart item', {
            productId: guestItem.productId,
            quantity: guestItem.quantity
          })
        }
      } catch (itemError) {
        logger.error('❌ Failed to migrate individual cart item', itemError, {
          cartItemId: guestItem.id,
          productId: guestItem.productId
        })
        skippedCount++
      }
    }

    const totalProcessed = migratedCount + mergedCount

    logger.info('✅ Cart migration completed', {
      sessionId,
      buyerId,
      totalItems: guestCartItems.length,
      migrated: migratedCount,
      merged: mergedCount,
      skipped: skippedCount,
      totalProcessed
    })

    return NextResponse.json({
      success: true,
      migrated: migratedCount,
      merged: mergedCount,
      skipped: skippedCount,
      total: totalProcessed,
      message: `Successfully migrated ${totalProcessed} cart items`
    })
  } catch (error) {
    logger.error('❌ Cart migration error', error)
    return NextResponse.json(
      {
        error: 'Failed to migrate cart',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
