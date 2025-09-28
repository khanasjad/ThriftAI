import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const buyerId = searchParams.get('buyerId')

    if (!sessionId && !buyerId) {
      return NextResponse.json(
        { error: 'Session ID or Buyer ID required' },
        { status: 400 }
      )
    }

    const where: any = {}
    if (buyerId) {
      where.buyerId = buyerId
    } else {
      where.sessionId = sessionId
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

    const total = cartItems.reduce((sum, item) => {
      return sum + (item.priceAtTime || item.product.price) * item.quantity
    }, 0)

    return NextResponse.json({
      items: cartItems,
      total,
      count: cartItems.length
    })
  } catch (error) {
    console.error('Cart fetch error:', error)
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
        ...(buyerId ? { buyerId } : { sessionId })
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
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          id: uuidv4(),
          productId,
          quantity,
          sessionId: sessionId || uuidv4(),
          buyerId,
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
    }

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}