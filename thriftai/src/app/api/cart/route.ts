import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET - Get cart items for current session
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('sessionId')?.value || uuidv4()

    const cartItems = await prisma.cartItem.findMany({
      where: {
        sessionId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            price: true,
            imageUrl: true,
            condition: true,
            isAvailable: true,
            stockQuantity: true,
            shippingCost: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.priceAtTime || item.product.price) * item.quantity
    }, 0)

    const shipping = cartItems.reduce((sum, item) => {
      return sum + (item.product.shippingCost || 0)
    }, 0)

    const total = subtotal + shipping

    const response = NextResponse.json({
      items: cartItems,
      summary: {
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: Math.round(subtotal * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100
      }
    })

    // Set session cookie if new
    if (!request.cookies.get('sessionId')) {
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }

    return response
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Verify product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        price: true,
        isAvailable: true,
        stockQuantity: true
      }
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

    if (product.stockQuantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    let sessionId = request.cookies.get('sessionId')?.value
    if (!sessionId) {
      sessionId = uuidv4()
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        sessionId,
        productId
      }
    })

    let cartItem

    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              brand: true,
              price: true,
              imageUrl: true,
              condition: true
            }
          }
        }
      })
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          sessionId,
          productId,
          quantity,
          priceAtTime: product.price
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              brand: true,
              price: true,
              imageUrl: true,
              condition: true
            }
          }
        }
      })
    }

    const response = NextResponse.json({
      message: 'Item added to cart',
      item: cartItem
    })

    // Set session cookie if new
    if (!request.cookies.get('sessionId')) {
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }

    return response
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from cart or clear cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const sessionId = request.cookies.get('sessionId')?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No cart session found' },
        { status: 400 }
      )
    }

    if (itemId) {
      // Delete specific item
      await prisma.cartItem.delete({
        where: {
          id: itemId,
          sessionId // Ensure user can only delete their own items
        }
      })

      return NextResponse.json({
        message: 'Item removed from cart'
      })
    } else {
      // Clear entire cart
      await prisma.cartItem.deleteMany({
        where: {
          sessionId
        }
      })

      return NextResponse.json({
        message: 'Cart cleared'
      })
    }
  } catch (error) {
    console.error('Delete cart item error:', error)
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    )
  }
}

// PATCH - Update cart item quantity
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, quantity } = body
    const sessionId = request.cookies.get('sessionId')?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No cart session found' },
        { status: 400 }
      )
    }

    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Item ID and quantity are required' },
        { status: 400 }
      )
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Update quantity
    const cartItem = await prisma.cartItem.update({
      where: {
        id: itemId,
        sessionId // Ensure user can only update their own items
      },
      data: {
        quantity
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            price: true,
            imageUrl: true,
            condition: true,
            stockQuantity: true
          }
        }
      }
    })

    // Check stock availability
    if (cartItem.product.stockQuantity < quantity) {
      return NextResponse.json(
        {
          error: 'Insufficient stock',
          availableStock: cartItem.product.stockQuantity
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Cart item updated',
      item: cartItem
    })
  } catch (error) {
    console.error('Update cart item error:', error)
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}
