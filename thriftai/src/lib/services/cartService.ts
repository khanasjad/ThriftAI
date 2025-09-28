import { prisma } from '../prisma'
import { v4 as uuidv4 } from 'uuid'

export interface CartItem {
  id: string
  productId: string
  quantity: number
  priceAtTime: number
  product: {
    id: string
    name: string
    price: number
    originalPrice: number
    imageUrl?: string
    category: string
    brand?: string
    condition?: string
    isAvailable: boolean
    seller?: {
      businessName: string
      rating: number
    }
  }
}

export interface CartSummary {
  items: CartItem[]
  subtotal: number
  total: number
  itemCount: number
  savings: number
}

export class CartService {
  /**
   * Get cart items for a user or session
   */
  static async getCart(buyerId?: string, sessionId?: string): Promise<CartSummary> {
    if (!buyerId && !sessionId) {
      throw new Error('Buyer ID or Session ID required')
    }

    const cartItems = await prisma.cartItem.findMany({
      where: buyerId ? { buyerId } : { sessionId },
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

    const items: CartItem[] = cartItems.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime || item.product.price,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        originalPrice: item.product.originalPrice,
        imageUrl: item.product.imageUrl || undefined,
        category: item.product.category,
        brand: item.product.brand || undefined,
        condition: item.product.condition || undefined,
        isAvailable: item.product.isAvailable,
        seller: item.product.seller ? {
          businessName: item.product.seller.businessName,
          rating: item.product.seller.rating
        } : undefined
      }
    }))

    const subtotal = items.reduce((sum, item) => {
      return sum + item.priceAtTime * item.quantity
    }, 0)

    const totalOriginalPrice = items.reduce((sum, item) => {
      return sum + (item.product.originalPrice || item.product.price) * item.quantity
    }, 0)

    const savings = totalOriginalPrice - subtotal

    return {
      items,
      subtotal: Number(subtotal.toFixed(2)),
      total: Number(subtotal.toFixed(2)), // Same as subtotal for cart view
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      savings: Number(savings.toFixed(2))
    }
  }

  /**
   * Add item to cart
   */
  static async addToCart(
    productId: string,
    quantity = 1,
    buyerId?: string,
    sessionId?: string
  ): Promise<CartItem> {
    if (!buyerId && !sessionId) {
      throw new Error('Buyer ID or Session ID required')
    }

    // Verify product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            businessName: true,
            rating: true
          }
        }
      }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    if (!product.isAvailable) {
      throw new Error('Product is not available')
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
          priceAtTime: product.price // Update to current price
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

    return {
      id: cartItem.id,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      priceAtTime: cartItem.priceAtTime || cartItem.product.price,
      product: {
        id: cartItem.product.id,
        name: cartItem.product.name,
        price: cartItem.product.price,
        originalPrice: cartItem.product.originalPrice,
        imageUrl: cartItem.product.imageUrl || undefined,
        category: cartItem.product.category,
        brand: cartItem.product.brand || undefined,
        condition: cartItem.product.condition || undefined,
        isAvailable: cartItem.product.isAvailable,
        seller: cartItem.product.seller ? {
          businessName: cartItem.product.seller.businessName,
          rating: cartItem.product.seller.rating
        } : undefined
      }
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(cartItemId: string, quantity: number): Promise<CartItem> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
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

    return {
      id: cartItem.id,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      priceAtTime: cartItem.priceAtTime || cartItem.product.price,
      product: {
        id: cartItem.product.id,
        name: cartItem.product.name,
        price: cartItem.product.price,
        originalPrice: cartItem.product.originalPrice,
        imageUrl: cartItem.product.imageUrl || undefined,
        category: cartItem.product.category,
        brand: cartItem.product.brand || undefined,
        condition: cartItem.product.condition || undefined,
        isAvailable: cartItem.product.isAvailable,
        seller: cartItem.product.seller ? {
          businessName: cartItem.product.seller.businessName,
          rating: cartItem.product.seller.rating
        } : undefined
      }
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(cartItemId: string): Promise<void> {
    await prisma.cartItem.delete({
      where: { id: cartItemId }
    })
  }

  /**
   * Clear entire cart
   */
  static async clearCart(buyerId?: string, sessionId?: string): Promise<void> {
    if (!buyerId && !sessionId) {
      throw new Error('Buyer ID or Session ID required')
    }

    await prisma.cartItem.deleteMany({
      where: buyerId ? { buyerId } : { sessionId }
    })
  }

  /**
   * Transfer anonymous cart to logged-in user
   */
  static async transferCart(sessionId: string, buyerId: string): Promise<void> {
    // Get existing buyer cart items
    const existingBuyerItems = await prisma.cartItem.findMany({
      where: { buyerId },
      select: { productId: true, quantity: true }
    })

    const existingProductIds = new Set(existingBuyerItems.map(item => item.productId))

    // Get session cart items
    const sessionItems = await prisma.cartItem.findMany({
      where: { sessionId }
    })

    // Transfer items
    await prisma.$transaction(async (tx) => {
      for (const sessionItem of sessionItems) {
        if (existingProductIds.has(sessionItem.productId)) {
          // If product already exists in buyer cart, merge quantities
          await tx.cartItem.updateMany({
            where: {
              buyerId,
              productId: sessionItem.productId
            },
            data: {
              quantity: {
                increment: sessionItem.quantity
              }
            }
          })
        } else {
          // Transfer the item to buyer cart
          await tx.cartItem.update({
            where: { id: sessionItem.id },
            data: {
              buyerId,
              sessionId: null
            }
          })
        }
      }

      // Delete any remaining session items (those that were merged)
      await tx.cartItem.deleteMany({
        where: {
          sessionId,
          buyerId: null
        }
      })
    })
  }

  /**
   * Validate cart items (check availability, prices)
   */
  static async validateCart(buyerId?: string, sessionId?: string): Promise<{
    isValid: boolean
    issues: Array<{
      itemId: string
      productName: string
      issue: string
      suggestion: string
    }>
  }> {
    const cart = await this.getCart(buyerId, sessionId)
    const issues: Array<{
      itemId: string
      productName: string
      issue: string
      suggestion: string
    }> = []

    for (const item of cart.items) {
      // Check availability
      if (!item.product.isAvailable) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: 'Product is no longer available',
          suggestion: 'Remove from cart or find similar items'
        })
      }

      // Check price changes
      if (item.priceAtTime !== item.product.price) {
        const change = item.product.price - item.priceAtTime
        const changePercent = (change / item.priceAtTime) * 100

        if (Math.abs(changePercent) > 5) { // 5% threshold
          issues.push({
            itemId: item.id,
            productName: item.product.name,
            issue: change > 0
              ? `Price increased by $${change.toFixed(2)} (${changePercent.toFixed(1)}%)`
              : `Price decreased by $${Math.abs(change).toFixed(2)} (${Math.abs(changePercent).toFixed(1)}%)`,
            suggestion: change > 0
              ? 'Consider if you still want this item at the new price'
              : 'Great news! You\'ll save even more'
          })
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * Get cart recommendations (similar or complementary items)
   */
  static async getCartRecommendations(buyerId?: string, sessionId?: string, limit = 5) {
    const cart = await this.getCart(buyerId, sessionId)

    if (cart.items.length === 0) {
      return []
    }

    // Get categories and brands from current cart
    const categories = [...new Set(cart.items.map(item => item.product.category))]
    const brands = [...new Set(cart.items.map(item => item.product.brand).filter(Boolean))]
    const currentProductIds = cart.items.map(item => item.productId)

    // Find similar products
    const recommendations = await prisma.product.findMany({
      where: {
        isAvailable: true,
        id: { notIn: currentProductIds },
        OR: [
          { category: { in: categories } },
          { brand: { in: brands } }
        ]
      },
      include: {
        seller: {
          select: {
            businessName: true,
            rating: true
          }
        }
      },
      take: limit,
      orderBy: [
        { price: 'asc' }, // Show cheaper items first
        { createdAt: 'desc' }
      ]
    })

    return recommendations.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      imageUrl: product.imageUrl,
      category: product.category,
      brand: product.brand,
      condition: product.condition,
      seller: product.seller ? {
        businessName: product.seller.businessName,
        rating: product.seller.rating
      } : undefined,
      savings: product.originalPrice > 0
        ? `${(((product.originalPrice - product.price) / product.originalPrice) * 100).toFixed(0)}%`
        : '0%',
      reason: categories.includes(product.category)
        ? `Similar to items in your cart (${product.category})`
        : `You might also like this ${product.brand} item`
    }))
  }

  /**
   * Save cart for later (wishlist functionality)
   */
  static async saveForLater(cartItemId: string): Promise<void> {
    // This would move item to a wishlist/saved items table
    // For now, we'll just remove from cart
    await this.removeFromCart(cartItemId)
  }

  /**
   * Get cart statistics
   */
  static async getCartStats(buyerId?: string, sessionId?: string) {
    const cart = await this.getCart(buyerId, sessionId)

    if (cart.items.length === 0) {
      return {
        totalItems: 0,
        totalValue: 0,
        totalSavings: 0,
        avgItemPrice: 0,
        categoriesCount: 0,
        brandsCount: 0
      }
    }

    const categories = new Set(cart.items.map(item => item.product.category))
    const brands = new Set(cart.items.map(item => item.product.brand).filter(Boolean))

    return {
      totalItems: cart.itemCount,
      totalValue: cart.subtotal,
      totalSavings: cart.savings,
      avgItemPrice: Number((cart.subtotal / cart.itemCount).toFixed(2)),
      categoriesCount: categories.size,
      brandsCount: brands.size
    }
  }
}