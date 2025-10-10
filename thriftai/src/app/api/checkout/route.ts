import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const buyerId = session.user.id
    const { sessionId } = await request.json()

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: {
        OR: [
          { buyerId },
          { sessionId, buyerId: null }
        ]
      },
      include: {
        product: {
          include: {
            seller: {
              select: {
                businessName: true,
                id: true
              }
            }
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
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.priceAtTime || item.product.price) * item.quantity,
      0
    )
    const tax = subtotal * 0.08 // 8% tax (adjust as needed)
    const shipping = 0 // Free shipping for now
    const total = subtotal + tax + shipping

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          description: item.product.description || undefined,
          images: item.product.imageUrl ? [item.product.imageUrl] : undefined,
          metadata: {
            productId: item.product.id,
            sellerId: item.product.sellerId || 'thriftai',
            brand: item.product.brand || '',
            condition: item.product.condition || 'new'
          }
        },
        unit_amount: Math.round((item.priceAtTime || item.product.price) * 100) // Convert to cents
      },
      quantity: item.quantity
    }))

    // Add tax as a separate line item
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
            description: 'Sales tax'
          },
          unit_amount: Math.round(tax * 100)
        },
        quantity: 1
      })
    }

    // Create order in database with PENDING status
    const order = await prisma.order.create({
      data: {
        buyerId,
        sessionId: sessionId || null,
        subtotal,
        tax,
        shipping,
        total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.priceAtTime || item.product.price,
            totalPrice: (item.priceAtTime || item.product.price) * item.quantity,
            productName: item.product.name,
            productCategory: item.product.category,
            productBrand: item.product.brand,
            productCondition: item.product.condition,
            productSize: item.product.size,
            productImageUrl: item.product.imageUrl,
            sellerId: item.product.sellerId
          }))
        }
      }
    })

    // Get the app URL from environment or default to localhost
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Create Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      customer_email: session.user.email || undefined,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        buyerId
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'] // Adjust as needed
      },
      allow_promotion_codes: true
    })

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentTransactionId: stripeSession.id,
        paymentStatus: 'PROCESSING'
      }
    })

    return NextResponse.json({
      sessionId: stripeSession.id,
      url: stripeSession.url,
      orderId: order.id
    })
  } catch (error: any) {
    console.error('❌ Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
