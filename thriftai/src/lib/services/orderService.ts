import { prisma } from '../prisma'
import { v4 as uuidv4 } from 'uuid'

export interface CreateOrderRequest {
  buyerId?: string
  sessionId?: string
  billingAddress: Address
  shippingAddress?: Address
  paymentMethod: string
  orderNotes?: string
}

export interface Address {
  name: string
  address: string
  city: string
  state: string
  zip: string
  country?: string
  phone?: string
}

export interface OrderSummary {
  subtotal: number
  tax: number
  shipping: number
  total: number
  estimatedDelivery: Date
}

export class OrderService {
  private static readonly TAX_RATE = 0.08 // 8% tax rate
  private static readonly FREE_SHIPPING_THRESHOLD = 50
  private static readonly STANDARD_SHIPPING = 9.99

  /**
   * Calculate order totals
   */
  static async calculateOrderTotals(buyerId?: string, sessionId?: string): Promise<OrderSummary> {
    if (!buyerId && !sessionId) {
      throw new Error('Buyer ID or Session ID required')
    }

    const cartItems = await prisma.cartItem.findMany({
      where: buyerId ? { buyerId } : { sessionId },
      include: { product: true }
    })

    if (cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.priceAtTime || item.product.price) * item.quantity
    }, 0)

    const tax = subtotal * this.TAX_RATE
    const shipping = subtotal >= this.FREE_SHIPPING_THRESHOLD ? 0 : this.STANDARD_SHIPPING
    const total = subtotal + tax + shipping

    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7) // 7 days from now

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      total: Number(total.toFixed(2)),
      estimatedDelivery
    }
  }

  /**
   * Create a new order
   */
  static async createOrder(request: CreateOrderRequest) {
    const { buyerId, sessionId, billingAddress, shippingAddress, paymentMethod, orderNotes } = request

    if (!buyerId && !sessionId) {
      throw new Error('Buyer ID or Session ID required')
    }

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: buyerId ? { buyerId } : { sessionId },
      include: {
        product: {
          include: { seller: true }
        }
      }
    })

    if (cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    // Calculate totals
    const orderTotals = await this.calculateOrderTotals(buyerId, sessionId)

    // Use shipping address or fallback to billing
    const shipping = shippingAddress || billingAddress

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          id: uuidv4(),
          buyerId: buyerId || null,
          sessionId: sessionId || null,
          subtotal: orderTotals.subtotal,
          tax: orderTotals.tax,
          shipping: orderTotals.shipping,
          total: orderTotals.total,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod,

          // Billing address
          billingName: billingAddress.name,
          billingAddress: billingAddress.address,
          billingCity: billingAddress.city,
          billingState: billingAddress.state,
          billingZip: billingAddress.zip,
          billingCountry: billingAddress.country || 'US',

          // Shipping address
          shippingName: shipping.name,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingState: shipping.state,
          shippingZip: shipping.zip,
          shippingPhone: shipping.phone,

          orderNotes,
          estimatedDelivery: orderTotals.estimatedDelivery,

          items: {
            create: cartItems.map(item => ({
              id: uuidv4(),
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.priceAtTime || item.product.price,
              totalPrice: (item.priceAtTime || item.product.price) * item.quantity,

              // Product snapshot for historical reference
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
            include: { product: true }
          }
        }
      })

      // Clear cart after order creation
      await tx.cartItem.deleteMany({
        where: buyerId ? { buyerId } : { sessionId }
      })

      // Update buyer statistics
      if (buyerId) {
        const buyer = await tx.buyer.findUnique({ where: { id: buyerId } })
        if (buyer) {
          await tx.buyer.update({
            where: { id: buyerId },
            data: {
              totalOrders: buyer.totalOrders + 1,
              totalSpent: buyer.totalSpent + orderTotals.total,
              averageOrderValue: (buyer.totalSpent + orderTotals.total) / (buyer.totalOrders + 1),
              lastOrderAt: new Date()
            }
          })
        }
      }

      return newOrder
    })

    return order
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
    const updateData: any = { status }

    if (status === 'SHIPPED' && trackingNumber) {
      updateData.trackingNumber = trackingNumber
      updateData.shippedAt = new Date()
    }

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }

    return await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: { product: true }
        }
      }
    })
  }

  /**
   * Process payment for order
   */
  static async processPayment(orderId: string, paymentTransactionId: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'COMPLETED',
        paymentTransactionId,
        status: 'CONFIRMED'
      }
    })
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        },
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })
  }

  /**
   * Get orders for a buyer
   */
  static async getBuyerOrders(buyerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId },
        include: {
          items: {
            include: { product: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where: { buyerId } })
    ])

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order) {
      throw new Error('Order not found')
    }

    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      throw new Error('Cannot cancel shipped or delivered orders')
    }

    // Update order status
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        orderNotes: reason ? `${order.orderNotes || ''}\nCancellation reason: ${reason}` : order.orderNotes
      }
    })

    // Revert buyer statistics if applicable
    if (order.buyerId && order.paymentStatus === 'COMPLETED') {
      const buyer = await prisma.buyer.findUnique({ where: { id: order.buyerId } })
      if (buyer) {
        await prisma.buyer.update({
          where: { id: order.buyerId },
          data: {
            totalOrders: Math.max(0, buyer.totalOrders - 1),
            totalSpent: Math.max(0, buyer.totalSpent - order.total),
            averageOrderValue: buyer.totalOrders > 1
              ? (buyer.totalSpent - order.total) / (buyer.totalOrders - 1)
              : 0
          }
        })
      }
    }

    return cancelledOrder
  }

  /**
   * Get order analytics for a buyer
   */
  static async getBuyerOrderAnalytics(buyerId: string) {
    const orders = await prisma.order.findMany({
      where: {
        buyerId,
        status: { not: 'CANCELLED' }
      },
      include: { items: true }
    })

    if (orders.length === 0) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        totalItemsPurchased: 0,
        favoriteCategories: [],
        monthlySavings: 0
      }
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
    const totalItemsPurchased = orders.reduce((sum, order) => sum + order.items.length, 0)

    // Calculate category preferences
    const categoryCount: { [key: string]: number } = {}
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productCategory) {
          categoryCount[item.productCategory] = (categoryCount[item.productCategory] || 0) + 1
        }
      })
    })

    const favoriteCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    // Calculate savings (rough estimate based on original prices)
    const monthlySavings = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        const originalPrice = item.productName ? 100 : 50 // Rough estimate
        return itemSum + Math.max(0, originalPrice - item.unitPrice)
      }, 0)
    }, 0) / 12 // Monthly average

    return {
      totalOrders: orders.length,
      totalSpent: Number(totalSpent.toFixed(2)),
      averageOrderValue: Number((totalSpent / orders.length).toFixed(2)),
      totalItemsPurchased,
      favoriteCategories,
      monthlySavings: Number(monthlySavings.toFixed(2))
    }
  }

  /**
   * Generate order tracking information
   */
  static async getOrderTracking(orderId: string) {
    const order = await this.getOrderById(orderId)

    if (!order) {
      throw new Error('Order not found')
    }

    const trackingSteps = [
      {
        status: 'Order Placed',
        date: order.createdAt,
        completed: true,
        description: 'Your order has been received and is being processed'
      },
      {
        status: 'Confirmed',
        date: order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED'
          ? order.updatedAt : null,
        completed: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
        description: 'Payment confirmed and order is being prepared'
      },
      {
        status: 'Processing',
        date: order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED'
          ? order.updatedAt : null,
        completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
        description: 'Items are being prepared for shipment'
      },
      {
        status: 'Shipped',
        date: order.shippedAt,
        completed: ['SHIPPED', 'DELIVERED'].includes(order.status),
        description: `Package is on its way${order.trackingNumber ? ` (Tracking: ${order.trackingNumber})` : ''}`
      },
      {
        status: 'Delivered',
        date: order.deliveredAt,
        completed: order.status === 'DELIVERED',
        description: 'Package has been delivered'
      }
    ]

    return {
      order,
      trackingSteps,
      estimatedDelivery: order.estimatedDelivery,
      currentStatus: order.status
    }
  }
}