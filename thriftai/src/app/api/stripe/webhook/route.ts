/**
 * Stripe Webhook Handler
 * Processes Stripe events to update order status and clear cart
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    logger.error('❌ Stripe webhook signature verification failed', {
      component: 'StripeWebhook',
      error: err.message
    })
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  logger.info('📨 Stripe webhook event received', {
    component: 'StripeWebhook',
    metadata: {
      type: event.type,
      id: event.id
    }
  })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(paymentIntent)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge)
        break
      }

      default:
        logger.info('ℹ️ Unhandled Stripe event type', {
          component: 'StripeWebhook',
          metadata: { type: event.type }
        })
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error('❌ Stripe webhook processing error', {
      component: 'StripeWebhook',
      error: error.message
    })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId

  if (!orderId) {
    logger.error('❌ No orderId in checkout session metadata', {
      component: 'StripeWebhook',
      metadata: { sessionId: session.id }
    })
    return
  }

  logger.info('✅ Checkout session completed', {
    component: 'StripeWebhook',
    metadata: {
      sessionId: session.id,
      orderId,
      amount: session.amount_total
    }
  })

  // Update order status
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      paymentTransactionId: session.payment_intent as string,
      shippingAddress: session.shipping_details?.address ? {
        name: session.shipping_details.name || '',
        line1: session.shipping_details.address.line1 || '',
        line2: session.shipping_details.address.line2 || null,
        city: session.shipping_details.address.city || '',
        state: session.shipping_details.address.state || '',
        postalCode: session.shipping_details.address.postal_code || '',
        country: session.shipping_details.address.country || 'US'
      } : undefined,
      billingAddress: session.customer_details?.address ? {
        name: session.customer_details.name || '',
        line1: session.customer_details.address.line1 || '',
        line2: session.customer_details.address.line2 || null,
        city: session.customer_details.address.city || '',
        state: session.customer_details.address.state || '',
        postalCode: session.customer_details.address.postal_code || '',
        country: session.customer_details.address.country || 'US'
      } : undefined,
      customerEmail: session.customer_details?.email || null,
      customerPhone: session.customer_details?.phone || null
    },
    include: {
      items: true
    }
  })

  // Clear cart items for this order
  await prisma.cartItem.deleteMany({
    where: {
      OR: [
        { buyerId: order.buyerId },
        { sessionId: order.sessionId || undefined }
      ]
    }
  })

  // Update product quantities
  for (const item of order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        quantity: {
          decrement: item.quantity
        }
      }
    })
  }

  logger.info('✅ Order confirmed and cart cleared', {
    component: 'StripeWebhook',
    metadata: {
      orderId,
      itemCount: order.items.length
    }
  })
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.info('✅ Payment intent succeeded', {
    component: 'StripeWebhook',
    metadata: {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount
    }
  })

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
        paymentStatus: 'COMPLETED',
        status: 'CONFIRMED'
      }
    })
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.error('❌ Payment intent failed', {
    component: 'StripeWebhook',
    metadata: {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message
    }
  })

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
        paymentStatus: 'FAILED',
        status: 'CANCELLED'
      }
    })
  }
}

/**
 * Handle charge refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  logger.info('💰 Charge refunded', {
    component: 'StripeWebhook',
    metadata: {
      chargeId: charge.id,
      amount: charge.amount_refunded
    }
  })

  // Find order by payment transaction ID
  const order = await prisma.order.findFirst({
    where: {
      paymentTransactionId: charge.payment_intent as string
    }
  })

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'REFUNDED'
      }
    })

    // Restore product quantities
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id }
    })

    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: {
            increment: item.quantity
          }
        }
      })
    }
  }
}
