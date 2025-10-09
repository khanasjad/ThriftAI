/**
 * Product Enrichment Service
 * Fetches detailed specifications and images from external sources
 * Updates existing products with rich data from multiple APIs
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { fetchAllProductData } from '@/lib/dataFetcher'
import { searchEbayListings } from '@/lib/dataFetcher/ebay'
import axios from 'axios'

export interface EnrichmentResult {
  productId: string
  productName: string
  success: boolean
  enrichedFields: string[]
  imagesFetched: number
  dataSources: string[]
  error?: string
}

export interface EnrichmentOptions {
  fetchImages?: boolean // Fetch product images
  fetchSpecs?: boolean // Fetch specifications
  fetchMarketData?: boolean // Fetch market comparison data
  overwriteExisting?: boolean // Overwrite existing data
}

export class ProductEnrichmentService {
  private defaultOptions: EnrichmentOptions = {
    fetchImages: true,
    fetchSpecs: true,
    fetchMarketData: true,
    overwriteExisting: false,
  }

  /**
   * Enrich a single product with external data
   */
  async enrichProduct(
    productId: string,
    options?: EnrichmentOptions
  ): Promise<EnrichmentResult> {
    const opts = { ...this.defaultOptions, ...options }

    try {
      // Fetch product from database
      const product = await prisma.product.findUnique({
        where: { id: productId },
      })

      if (!product) {
        return {
          productId,
          productName: 'Unknown',
          success: false,
          enrichedFields: [],
          imagesFetched: 0,
          dataSources: [],
          error: 'Product not found',
        }
      }

      logger.info('Enriching product', {
        component: 'ProductEnrichment',
        metadata: { productId, productName: product.name },
      })

      const enrichedFields: string[] = []
      const dataSources: string[] = []
      let imagesFetched = 0

      // 1. Fetch product images from eBay
      if (opts.fetchImages && (!product.imageUrl || opts.overwriteExisting)) {
        const images = await this.fetchProductImages(product.name, product.brand || undefined)
        if (images.length > 0) {
          await prisma.product.update({
            where: { id: productId },
            data: { imageUrl: images[0] }, // Product model only has imageUrl, not images array
          })
          imagesFetched = images.length
          enrichedFields.push('imageUrl')
          dataSources.push('eBay Images')
        }
      }

      // 2. Fetch specifications from external APIs
      if (opts.fetchSpecs) {
        const externalData = await fetchAllProductData({
          name: product.name,
          brand: product.brand || undefined,
          category: product.category,
          // asin field doesn't exist on Product model
        })

        const updateData: any = {}

        // Specifications from GSMArena (for phones) - store in dynamicSpecs JSON field
        if (externalData.specifications?.success && externalData.specifications.data) {
          const specs = externalData.specifications.data
          updateData.dynamicSpecs = specs
          enrichedFields.push('dynamicSpecs')
          dataSources.push(externalData.specifications.source)
        }

        // Repairability from iFixit - store in dynamicSpecs
        if (externalData.repairability?.success && externalData.repairability.data) {
          const repairData = externalData.repairability.data
          const currentSpecs = (updateData.dynamicSpecs || product.dynamicSpecs || {}) as any
          currentSpecs.repairabilityScore = repairData.score
          updateData.dynamicSpecs = currentSpecs
          enrichedFields.push('dynamicSpecs.repairabilityScore')
          dataSources.push(externalData.repairability.source)
        }

        // Warranty information
        if (externalData.warranty?.success && externalData.warranty.data) {
          const warrantyData = externalData.warranty.data
          if (warrantyData.covered) {
            updateData.warrantyMonths = warrantyData.monthsRemaining || 0
            updateData.hasWarranty = true
            enrichedFields.push('warrantyMonths', 'hasWarranty')
            dataSources.push(externalData.warranty.source)
          }
        }

        // Price history from CamelCamelCamel - store in dynamicSpecs
        if (externalData.priceHistory?.success && externalData.priceHistory.data) {
          const priceData = externalData.priceHistory.data
          if (priceData.averagePrice) {
            const currentSpecs = (updateData.dynamicSpecs || product.dynamicSpecs || {}) as any
            currentSpecs.marketAveragePrice = priceData.averagePrice
            updateData.dynamicSpecs = currentSpecs
            enrichedFields.push('dynamicSpecs.marketAveragePrice')
            dataSources.push(externalData.priceHistory.source)
          }
        }

        // Update product with enriched data
        if (Object.keys(updateData).length > 0) {
          await prisma.product.update({
            where: { id: productId },
            data: updateData,
          })
        }
      }

      // 3. Fetch market comparison data
      if (opts.fetchMarketData) {
        const ebayListings = await searchEbayListings(product.name, {
          maxResults: 5,
          sortOrder: 'BestMatch',
        })

        if (ebayListings.success && ebayListings.data && ebayListings.data.length > 0) {
          // Calculate market statistics
          const prices = ebayListings.data.map(l => l.currentPrice).filter(p => p > 0)
          if (prices.length > 0) {
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
            const minPrice = Math.min(...prices)
            const maxPrice = Math.max(...prices)

            // Store market data in dynamicSpecs JSON field
            const currentSpecs = (product.dynamicSpecs || {}) as any
            currentSpecs.marketAveragePrice = avgPrice
            currentSpecs.competitorCount = ebayListings.data.length
            currentSpecs.marketMinPrice = minPrice
            currentSpecs.marketMaxPrice = maxPrice

            await prisma.product.update({
              where: { id: productId },
              data: {
                dynamicSpecs: currentSpecs,
              },
            })

            enrichedFields.push('dynamicSpecs.marketData')
            dataSources.push('eBay Market Data')

            logger.info('Market data enriched', {
              component: 'ProductEnrichment',
              metadata: {
                productId,
                avgPrice,
                minPrice,
                maxPrice,
                competitors: ebayListings.data.length,
              },
            })
          }
        }
      }

      logger.info('Product enrichment completed', {
        component: 'ProductEnrichment',
        metadata: {
          productId,
          enrichedFields,
          dataSources,
          imagesFetched,
        },
      })

      return {
        productId,
        productName: product.name,
        success: true,
        enrichedFields,
        imagesFetched,
        dataSources,
      }
    } catch (error) {
      logger.error('Product enrichment failed', {
        component: 'ProductEnrichment',
        metadata: {
          productId,
          error: error instanceof Error ? error.message : String(error),
        },
      })

      return {
        productId,
        productName: 'Unknown',
        success: false,
        enrichedFields: [],
        imagesFetched: 0,
        dataSources: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Fetch product images from eBay API
   */
  private async fetchProductImages(
    productName: string,
    brand?: string
  ): Promise<string[]> {
    try {
      const searchQuery = brand ? `${brand} ${productName}` : productName

      const ebayListings = await searchEbayListings(searchQuery, {
        maxResults: 5,
        sortOrder: 'BestMatch',
      })

      if (ebayListings.success && ebayListings.data && ebayListings.data.length > 0) {
        const images: string[] = []
        for (const listing of ebayListings.data) {
          if (listing.imageUrl) {
            images.push(listing.imageUrl)
          }
        }

        logger.info('Fetched product images', {
          component: 'ProductEnrichment',
          metadata: {
            productName,
            imageCount: images.length,
          },
        })

        return images
      }

      return []
    } catch (error) {
      logger.error('Image fetching failed', {
        component: 'ProductEnrichment',
        metadata: {
          productName,
          error: error instanceof Error ? error.message : String(error),
        },
      })
      return []
    }
  }

  /**
   * Enrich multiple products in batch
   */
  async enrichProducts(
    productIds: string[],
    options?: EnrichmentOptions
  ): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = []

    logger.info('Starting batch enrichment', {
      component: 'ProductEnrichment',
      metadata: { productCount: productIds.length },
    })

    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i]

      logger.info(`Enriching product ${i + 1}/${productIds.length}`, {
        component: 'ProductEnrichment',
        metadata: { productId },
      })

      const result = await this.enrichProduct(productId, options)
      results.push(result)

      // Rate limiting: Wait 1 second between enrichments
      if (i < productIds.length - 1) {
        await this.delay(1000)
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    logger.info('Batch enrichment completed', {
      component: 'ProductEnrichment',
      metadata: {
        total: productIds.length,
        successful,
        failed,
        successRate: `${((successful / productIds.length) * 100).toFixed(1)}%`,
      },
    })

    return results
  }

  /**
   * Enrich all products in the database
   */
  async enrichAllProducts(
    options?: EnrichmentOptions & {
      limit?: number
      category?: string
      onlyMissingData?: boolean
    }
  ): Promise<EnrichmentResult[]> {
    const opts = { ...this.defaultOptions, ...options }

    // Build query filters
    const where: any = {
      isAvailable: true,
    }

    if (opts.category) {
      where.category = opts.category
    }

    if (opts.onlyMissingData) {
      // Only enrich products missing images or specifications
      where.OR = [{ imageUrl: null }, { dynamicSpecs: null }]
    }

    // Fetch products
    const products = await prisma.product.findMany({
      where,
      take: opts.limit || 100,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    logger.info('Enriching all products', {
      component: 'ProductEnrichment',
      metadata: {
        productCount: products.length,
        category: opts.category,
        onlyMissingData: opts.onlyMissingData,
      },
    })

    const productIds = products.map(p => p.id)
    return await this.enrichProducts(productIds, opts)
  }

  /**
   * Get enrichment statistics
   */
  async getEnrichmentStats(): Promise<{
    total: number
    withImages: number
    withSpecs: number
    withMarketData: number
    percentageComplete: number
  }> {
    const [total, withImages, withSpecs] = await Promise.all([
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.product.count({
        where: { isAvailable: true, imageUrl: { not: null } },
      }),
      prisma.product.count({
        where: { isAvailable: true, dynamicSpecs: { not: null } },
      }),
    ])

    // Count products with market data in dynamicSpecs
    // (This is approximate since we can't query nested JSON fields easily)
    const withMarketData = withSpecs

    const enrichedCount = Math.max(withImages, withSpecs, withMarketData)
    const percentageComplete = total > 0 ? (enrichedCount / total) * 100 : 0

    return {
      total,
      withImages,
      withSpecs,
      withMarketData,
      percentageComplete,
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const productEnrichmentService = new ProductEnrichmentService()
