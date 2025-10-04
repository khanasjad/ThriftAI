/**
 * Data Fetcher - FREE Data Sources Integration
 * Central export point for all data fetching modules
 */

import { logger } from '@/lib/logger'

// Types
export * from './types'

// Utilities
export * from './cache'
export * from './rateLimiter'

// Data Sources - FREE APIs (9 total)
export * from './appleWarranty'
export * from './dellWarranty'
export * from './gsmarena'
export * from './ifixit'
export * from './ebay'
export * from './energyStar'
export * from './alphaVantage'
export * from './bestbuy'
export * from './newsapi'

// Web Scrapers (3 total - Phase 3B)
export * from '../scrapers'

// Helper function to fetch all available data for a product
import { checkAppleWarranty, validateAppleSerial } from './appleWarranty'
import { checkDellWarranty, validateDellServiceTag } from './dellWarranty'
import { getPhoneSpecs } from './gsmarena'
import { getRepairability } from './ifixit'
import { getAmazonPriceHistory, searchWalmartProducts, searchTargetProducts } from '../scrapers'
import type { DataSourceResult } from './types'

export interface ProductDataSources {
  warranty?: DataSourceResult<any>
  specifications?: DataSourceResult<any>
  repairability?: DataSourceResult<any>
  priceHistory?: DataSourceResult<any>
  marketComparison?: {
    walmart?: DataSourceResult<any>
    target?: DataSourceResult<any>
  }
}

/**
 * Fetch all available FREE data sources for a product
 */
export async function fetchAllProductData(product: {
  name: string
  brand?: string
  serialNumber?: string
  serviceTag?: string
  category: string
  asin?: string
}): Promise<ProductDataSources> {
  const results: ProductDataSources = {}

  // Determine product type
  const isPhone = product.category.toLowerCase().includes('phone') ||
                  product.category.toLowerCase().includes('mobile')

  const isLaptop = product.category.toLowerCase().includes('laptop') ||
                   product.category.toLowerCase().includes('computer')

  // Fetch warranty information
  if (product.serialNumber) {
    // Check if Apple serial
    if (product.brand?.toLowerCase() === 'apple' || validateAppleSerial(product.serialNumber)) {
      try {
        results.warranty = await checkAppleWarranty(product.serialNumber)
      } catch (error) {
        logger.error('Apple warranty check failed', error, {
          component: 'ProductData',
          metadata: { serialNumber: product.serialNumber }
        })
      }
    }
  }

  if (product.serviceTag && isLaptop) {
    // Check if Dell service tag
    if (product.brand?.toLowerCase() === 'dell' || validateDellServiceTag(product.serviceTag)) {
      try {
        results.warranty = await checkDellWarranty(product.serviceTag)
      } catch (error) {
        logger.error('Dell warranty check failed', error, {
          component: 'ProductData',
          metadata: { serviceTag: product.serviceTag }
        })
      }
    }
  }

  // Fetch specifications
  if (isPhone) {
    try {
      results.specifications = await getPhoneSpecs(product.name)
    } catch (error) {
      logger.error('Phone specs fetch failed', error, {
        component: 'ProductData',
        metadata: { productName: product.name }
      })
    }
  }

  // Fetch repairability
  try {
    results.repairability = await getRepairability(product.name)
  } catch (error) {
    logger.error('Repairability fetch failed', error, {
      component: 'ProductData',
      metadata: { productName: product.name }
    })
  }

  // Fetch price history from CamelCamelCamel (if ASIN provided)
  if (product.asin) {
    try {
      results.priceHistory = await getAmazonPriceHistory(product.asin)
    } catch (error) {
      logger.error('Amazon price history fetch failed', error, {
        component: 'ProductData',
        metadata: { asin: product.asin }
      })
    }
  }

  // Fetch market comparison from Walmart & Target
  try {
    const [walmartResult, targetResult] = await Promise.all([
      searchWalmartProducts(product.name).catch(err => {
        logger.error('Walmart search failed', err, {
          component: 'ProductData',
          metadata: { productName: product.name }
        })
        return null
      }),
      searchTargetProducts(product.name).catch(err => {
        logger.error('Target search failed', err, {
          component: 'ProductData',
          metadata: { productName: product.name }
        })
        return null
      })
    ])

    results.marketComparison = {
      walmart: walmartResult || undefined,
      target: targetResult || undefined
    }
  } catch (error) {
    logger.error('Market comparison fetch failed', error, {
      component: 'ProductData',
      metadata: { productName: product.name }
    })
  }

  return results
}

/**
 * Get data availability summary
 */
export function getDataAvailability(data: ProductDataSources): {
  total: number
  available: number
  percentage: number
  sources: string[]
} {
  const sources: string[] = []
  let available = 0
  const total = 6 // warranty, specs, repairability, priceHistory, walmart, target

  if (data.warranty?.success) {
    available++
    sources.push(data.warranty.source)
  }

  if (data.specifications?.success) {
    available++
    sources.push(data.specifications.source)
  }

  if (data.repairability?.success) {
    available++
    sources.push(data.repairability.source)
  }

  if (data.priceHistory?.success) {
    available++
    sources.push(data.priceHistory.source)
  }

  if (data.marketComparison?.walmart?.success) {
    available++
    sources.push(data.marketComparison.walmart.source)
  }

  if (data.marketComparison?.target?.success) {
    available++
    sources.push(data.marketComparison.target.source)
  }

  return {
    total,
    available,
    percentage: (available / total) * 100,
    sources,
  }
}
