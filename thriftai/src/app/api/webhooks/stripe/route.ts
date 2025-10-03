import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('✅ Checkout session completed:', session.id)

        // Get order ID from metadata
        const orderId = session.metadata?.orderId || session.client_reference_id

        if (!orderId) {
          console.error('❌ No order ID in session metadata')
          break
        }

        // Get the order
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            buyer: true
          }
        })

        if (!order) {
          console.error('❌ Order not found:', orderId)
          break
        }

        // Update order status
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'COMPLETED',
            paymentMethod: 'card',
            paymentTransactionId: session.payment_intent as string,
            billingName: session.customer_details?.name || null,
            billingAddress: session.customer_details?.address?.line1 || null,
            billingCity: session.customer_details?.address?.city || null,
            billingState: session.customer_details?.address?.state || null,
            billingZip: session.customer_details?.address?.postal_code || null,
            billingCountry: session.customer_details?.address?.country || null,
            shippingName: session.shipping_details?.name || null,
            shippingAddress: session.shipping_details?.address?.line1 || null,
            shippingCity: session.shipping_details?.address?.city || null,
            shippingState: session.shipping_details?.address?.state || null,
            shippingZip: session.shipping_details?.address?.postal_code || null,
            shippingPhone: session.customer_details?.phone || null
          }
        })

        // Update buyer stats
        await prisma.buyer.update({
          where: { id: order.buyerId },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: order.total },
            averageOrderValue: {
              set: ((order.buyer.totalSpent + order.total) / (order.buyer.totalOrders + 1))
            },
            lastOrderAt: new Date()
          }
        })

        // Update product stats
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              purchaseCount: { increment: item.quantity },
              stockQuantity: { decrement: item.quantity },
              lastPurchasedAt: new Date()
            }
          })
        }

        // Clear cart items for this buyer
        await prisma.cartItem.deleteMany({
          where: {
            buyerId: order.buyerId
          }
        })

        console.log('✅ Order completed successfully:', orderId)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.orderId || session.client_reference_id

        if (orderId) {
          // Mark order as cancelled
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'CANCELLED',
              paymentStatus: 'CANCELLED'
            }
          })

          console.log('⚠️ Checkout session expired, order cancelled:', orderId)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Find order by payment transaction ID
        const order = await prisma.order.findFirst({
          where: {
            paymentTransactionId: paymentIntent.id
          }
        })

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              paymentStatus: 'FAILED'
            }
          })

          console.log('❌ Payment failed for order:', order.id)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Disable body parsing for webhooks
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
