import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      buyerId,
      sessionId,
      billingAddress,
      shippingAddress,
      paymentMethod,
      orderNotes
    } = body

    if (!buyerId && !sessionId) {
      return NextResponse.json(
        { error: 'Buyer ID or Session ID required' },
        { status: 400 }
      )
    }

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: buyerId ? { buyerId } : { sessionId },
      include: {
        product: {
          include: {
            seller: true
          }
        }
      }
    })

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.priceAtTime || item.product.price) * item.quantity
    }, 0)

    const tax = subtotal * 0.08 // 8% tax rate
    const shipping = subtotal > 50 ? 0 : 9.99 // Free shipping over $50
    const total = subtotal + tax + shipping

    // Create order
    const order = await prisma.order.create({
      data: {
        id: uuidv4(),
        buyerId: buyerId || null,
        sessionId: sessionId || null,
        subtotal,
        tax,
        shipping,
        total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod,

        // Billing address
        billingName: billingAddress?.name,
        billingAddress: billingAddress?.address,
        billingCity: billingAddress?.city,
        billingState: billingAddress?.state,
        billingZip: billingAddress?.zip,
        billingCountry: billingAddress?.country || 'US',

        // Shipping address
        shippingName: shippingAddress?.name || billingAddress?.name,
        shippingAddress: shippingAddress?.address || billingAddress?.address,
        shippingCity: shippingAddress?.city || billingAddress?.city,
        shippingState: shippingAddress?.state || billingAddress?.state,
        shippingZip: shippingAddress?.zip || billingAddress?.zip,
        shippingPhone: shippingAddress?.phone,

        orderNotes,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now

        items: {
          create: cartItems.map(item => ({
            id: uuidv4(),
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.priceAtTime || item.product.price,
            totalPrice: (item.priceAtTime || item.product.price) * item.quantity,

            // Product snapshot
            productName: item.product.name,
            productCategory: item.product.category,
            productBrand: item.product.brand,
            productCondition: item.product.condition,
            productSize: item.product.size,
            productImageUrl: item.product.imageUrl,
            sellerId: item.product.sellerId
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Clear cart after order creation
    await prisma.cartItem.deleteMany({
      where: buyerId ? { buyerId } : { sessionId }
    })

    // Update buyer stats if buyer exists
    if (buyerId) {
      await prisma.buyer.update({
        where: { id: buyerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
          lastOrderAt: new Date()
        }
      })
    }

    return NextResponse.json({
      order,
      message: 'Order created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}