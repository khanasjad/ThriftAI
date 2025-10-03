/**
 * Affiliate Product Tracking Utility
 *
 * This module helps identify affiliate products and manage the checkout flow.
 * Products can be:
 * 1. Internal products (sold by ThriftAI sellers) -> Use Stripe checkout
 * 2. Affiliate products (from Amazon, eBay, etc.) -> Redirect to affiliate URL
 */

import { prisma } from '@/lib/prisma'

export interface AffiliateSource {
  name: string
  domain: string
  icon?: string
}

export const AFFILIATE_SOURCES: Record<string, AffiliateSource> = {
  AMAZON: {
    name: 'Amazon',
    domain: 'amazon.com',
    icon: '/icons/amazon.svg'
  },
  EBAY: {
    name: 'eBay',
    domain: 'ebay.com',
    icon: '/icons/ebay.svg'
  },
  WALMART: {
    name: 'Walmart',
    domain: 'walmart.com',
    icon: '/icons/walmart.svg'
  },
  TARGET: {
    name: 'Target',
    domain: 'target.com',
    icon: '/icons/target.svg'
  }
}

/**
 * Check if a product is an affiliate product
 * Affiliate products have a storeId that doesn't match our internal sellers
 */
export function isAffiliateProduct(product: { storeId?: string | null; sellerId?: string | null }): boolean {
  // If product has a storeId (external store) and no sellerId (internal seller), it's affiliate
  return !!(product.storeId && !product.sellerId)
}

/**
 * Get affiliate source from storeId
 */
export function getAffiliateSource(storeId: string): AffiliateSource | null {
  const upperStoreId = storeId.toUpperCase()

  for (const [key, source] of Object.entries(AFFILIATE_SOURCES)) {
    if (upperStoreId.includes(key)) {
      return source
    }
  }

  return null
}

/**
 * Generate affiliate tracking URL with our referral code
 */
export function generateAffiliateUrl(productUrl: string, source: string): string {
  const url = new URL(productUrl)

  switch (source.toUpperCase()) {
    case 'AMAZON':
      // Add Amazon Associate tag
      url.searchParams.set('tag', process.env.AMAZON_PARTNER_TAG || 'thriftai-20')
      break

    case 'EBAY':
      // Add eBay campaign ID
      url.searchParams.set('campid', process.env.EBAY_CAMPAIGN_ID || '5338892896')
      break

    case 'WALMART':
      // Add Walmart affiliate parameters
      url.searchParams.set('affcamid', process.env.WALMART_CAMPAIGN_ID || '')
      url.searchParams.set('affcid', process.env.WALMART_AFFILIATE_ID || '')
      break

    default:
      // Generic tracking parameter
      url.searchParams.set('ref', 'thriftai')
      break
  }

  return url.toString()
}

/**
 * Track affiliate click in database
 */
export async function trackAffiliateClick(params: {
  userId?: string
  sessionId: string
  productId: string
  affiliateUrl: string
  source: string
  estimatedPrice: number
}) {
  try {
    await prisma.affiliateClick.create({
      data: {
        userId: params.userId,
        sessionId: params.sessionId,
        source: params.source as any, // Cast to enum
        externalProductId: params.productId,
        productTitle: '', // Will be updated by the calling function
        affiliateUrl: params.affiliateUrl,
        referralCode: params.source,
        estimatedPrice: params.estimatedPrice,
        clicked: true,
        clickedAt: new Date()
      }
    })

    console.log('✅ Affiliate click tracked:', {
      productId: params.productId,
      source: params.source
    })
  } catch (error) {
    console.error('❌ Failed to track affiliate click:', error)
  }
}

/**
 * Separate cart items into internal and affiliate products
 */
export function separateCartItems(cartItems: Array<{
  id: string
  product: {
    id: string
    name: string
    price: number
    storeId?: string | null
    sellerId?: string | null
    imageUrl?: string | null
  }
  quantity: number
  priceAtTime: number | null
}>) {
  const internalItems: typeof cartItems = []
  const affiliateItems: typeof cartItems = []

  for (const item of cartItems) {
    if (isAffiliateProduct(item.product)) {
      affiliateItems.push(item)
    } else {
      internalItems.push(item)
    }
  }

  return {
    internalItems,
    affiliateItems,
    hasInternal: internalItems.length > 0,
    hasAffiliate: affiliateItems.length > 0,
    hasMixed: internalItems.length > 0 && affiliateItems.length > 0
  }
}

/**
 * Check if cart has only affiliate products
 */
export function isAffiliateOnlyCart(cartItems: Array<{
  product: {
    storeId?: string | null
    sellerId?: string | null
  }
}>) {
  if (cartItems.length === 0) return false
  return cartItems.every(item => isAffiliateProduct(item.product))
}

/**
 * Check if cart has mixed products (both internal and affiliate)
 */
export function hasMixedCart(cartItems: Array<{
  product: {
    storeId?: string | null
    sellerId?: string | null
  }
}>) {
  const { hasMixed } = separateCartItems(cartItems as any)
  return hasMixed
}
