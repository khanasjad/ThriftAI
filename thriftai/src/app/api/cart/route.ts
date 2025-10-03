import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const buyerId = searchParams.get('buyerId')
    const session = await getServerSession(authOptions)

    if (!sessionId && !buyerId) {
      return NextResponse.json(
        { error: 'Session ID or Buyer ID required' },
        { status: 400 }
      )
    }

    // Prioritize logged-in user's cart
    const where: any = {}
    if (session?.user?.id) {
      where.buyerId = session.user.id
    } else if (buyerId) {
      where.buyerId = buyerId
    } else {
      where.sessionId = sessionId
      where.buyerId = null
    }

    const cartItems = await prisma.cartItem.findMany({
      where,
      include: {
        product: {
          include: {
            seller: {
              select: {
                businessName: true,
                rating: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.priceAtTime || item.product.price) * item.quantity
    }, 0)

    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    logger.info('📦 Cart fetched', {
      sessionId,
      buyerId: session?.user?.id || buyerId,
      itemCount: cartItems.length,
      totalQuantity: count,
      subtotal
    })

    return NextResponse.json({
      cart: cartItems,
      items: cartItems, // backward compatibility
      count,
      subtotal,
      total: subtotal
    })
  } catch (error) {
    logger.error('❌ Cart fetch error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity = 1, sessionId, buyerId } = body
    const session = await getServerSession(authOptions)

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (!sessionId && !buyerId) {
      return NextResponse.json(
        { error: 'Session ID or Buyer ID required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!product.isAvailable) {
      return NextResponse.json(
        { error: 'Product is not available' },
        { status: 400 }
      )
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        productId,
        ...(session?.user?.id ? { buyerId: session.user.id } :
            buyerId ? { buyerId } : { sessionId, buyerId: null })
      }
    })

    let cartItem

    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          priceAtTime: product.price
        },
        include: {
          product: {
            include: {
              seller: {
                select: {
                  businessName: true,
                  rating: true
                }
              }
            }
          }
        }
      })

      logger.info('🔄 Cart item updated', {
        cartItemId: cartItem.id,
        productId,
        newQuantity: cartItem.quantity
      })
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          id: uuidv4(),
          productId,
          quantity,
          sessionId: sessionId || uuidv4(),
          buyerId: session?.user?.id || buyerId || null,
          priceAtTime: product.price
        },
        include: {
          product: {
            include: {
              seller: {
                select: {
                  businessName: true,
                  rating: true
                }
              }
            }
          }
        }
      })

      logger.info('➕ Cart item added', {
        cartItemId: cartItem.id,
        productId,
        quantity
      })
    }

    // Update product analytics
    await prisma.product.update({
      where: { id: productId },
      data: {
        cartAdditionCount: { increment: 1 },
        lastCartAddedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      cartItem,
      message: existingItem ? 'Cart updated' : 'Added to cart'
    }, { status: 201 })
  } catch (error) {
    logger.error('❌ Add to cart error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart?id=xxx - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Cart item ID is required' },
        { status: 400 }
      )
    }

    await prisma.cartItem.delete({
      where: { id }
    })

    logger.info('🗑️ Cart item removed', { cartItemId: id })

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart'
    })
  } catch (error) {
    logger.error('❌ Remove cart item error', error)
    return NextResponse.json(
      { error: 'Failed to remove item' },
      { status: 500 }
    )
  }
}

// PATCH /api/cart - Update cart item quantity
export async function PATCH(request: NextRequest) {
  try {
    const { id, quantity } = await request.json()

    if (!id || quantity === undefined) {
      return NextResponse.json(
        { error: 'Cart item ID and quantity are required' },
        { status: 400 }
      )
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    const cartItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true }
    })

    logger.info('📝 Cart item quantity updated', {
      cartItemId: id,
      newQuantity: quantity
    })

    return NextResponse.json({
      success: true,
      cartItem,
      message: 'Quantity updated'
    })
  } catch (error) {
    logger.error('❌ Update cart item error', error)
    return NextResponse.json(
      { error: 'Failed to update quantity' },
      { status: 500 }
    )
  }
}