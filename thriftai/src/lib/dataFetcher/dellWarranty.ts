/**
 * Dell Warranty Check API Integration
 * Official Dell API - FREE, No authentication required
 */

import { DellWarrantyResult, DataSourceResult, CACHE_TTL } from './types'
import { getCachedOrFetch, generateCacheKey } from './cache'
import { withRateLimit } from './rateLimiter'

const DELL_API_BASE = 'https://apigtwb2c.us.dell.com/PROD/sbil/eapi/v5'

/**
 * Check Dell warranty status by service tag
 */
export async function checkDellWarranty(
  serviceTag: string
): Promise<DataSourceResult<DellWarrantyResult>> {
  const source = 'DELL_WARRANTY'
  const cacheKey = generateCacheKey(source, serviceTag)

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.WARRANTY_STATUS,
      async () => {
        return await withRateLimit('DELL', async () => {
          return await fetchDellWarranty(serviceTag)
        })
      }
    )

    return {
      success: true,
      data,
      source,
      timestamp: new Date(),
      cached,
    }
  } catch (error) {
    console.error('[Dell Warranty] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source,
      timestamp: new Date(),
      cached: false,
    }
  }
}

/**
 * Fetch warranty data from Dell
 */
async function fetchDellWarranty(serviceTag: string): Promise<DellWarrantyResult> {
  const url = `${DELL_API_BASE}/asset-entitlements?serviceTags=${serviceTag}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ThriftAI-VeritasScore/1.0',
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return {
        isValid: false,
        serviceTag,
        warrantyStatus: 'Unknown',
      }
    }
    throw new Error(`Dell API error: ${response.status}`)
  }

  const data = await response.json()

  return parseDellResponse(data, serviceTag)
}

/**
 * Parse Dell API response
 */
function parseDellResponse(data: any, serviceTag: string): DellWarrantyResult {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      serviceTag,
      warrantyStatus: 'Unknown',
    }
  }

  const asset = data[0]

  if (!asset || asset.invalid) {
    return {
      isValid: false,
      serviceTag,
      warrantyStatus: 'Unknown',
    }
  }

  const now = new Date()
  let warrantyStatus: 'Active' | 'Expired' | 'Unknown' = 'Unknown'
  let warrantyEndDate: Date | undefined
  let shipDate: Date | undefined

  // Parse ship date
  if (asset.shipDate) {
    shipDate = new Date(asset.shipDate)
  }

  // Find active warranty entitlements
  const entitlements = asset.entitlements || []
  const activeEntitlements = entitlements.filter((e: any) => {
    if (!e.endDate) return false
    const endDate = new Date(e.endDate)
    return endDate > now
  })

  if (activeEntitlements.length > 0) {
    warrantyStatus = 'Active'
    // Get the latest warranty end date
    const endDates = activeEntitlements.map((e: any) => new Date(e.endDate))
    warrantyEndDate = new Date(Math.max(...endDates.map(d => d.getTime())))
  } else if (entitlements.length > 0) {
    warrantyStatus = 'Expired'
    // Get the latest (expired) warranty end date
    const endDates = entitlements
      .filter((e: any) => e.endDate)
      .map((e: any) => new Date(e.endDate))
    if (endDates.length > 0) {
      warrantyEndDate = new Date(Math.max(...endDates.map(d => d.getTime())))
    }
  }

  return {
    isValid: true,
    serviceTag,
    warrantyStatus,
    warrantyEndDate,
    shipDate,
    model: asset.productLineDescription || asset.productCode,
    productFamily: asset.productFamily,
    description: asset.productDescription,
  }
}

/**
 * Validate Dell service tag format
 */
export function validateDellServiceTag(serviceTag: string): boolean {
  if (!serviceTag) return false

  // Remove whitespace and convert to uppercase
  const tag = serviceTag.trim().toUpperCase()

  // Dell service tags are typically 7 characters (alphanumeric)
  // Format: XXXXXXX (7 chars)
  if (tag.length !== 7) {
    return false
  }

  // Check if alphanumeric
  const alphanumeric = /^[A-Z0-9]+$/
  return alphanumeric.test(tag)
}

/**
 * Batch check multiple Dell service tags
 */
export async function checkDellWarrantyBatch(
  serviceTags: string[]
): Promise<DataSourceResult<DellWarrantyResult>[]> {
  // Dell API supports batch queries (comma-separated)
  // Max 100 service tags per request

  const results: DataSourceResult<DellWarrantyResult>[] = []

  // Split into batches of 100
  const batchSize = 100
  for (let i = 0; i < serviceTags.length; i += batchSize) {
    const batch = serviceTags.slice(i, i + batchSize)

    try {
      const batchResults = await Promise.all(
        batch.map(tag => checkDellWarranty(tag))
      )
      results.push(...batchResults)
    } catch (error) {
      console.error('[Dell Warranty Batch] Error:', error)
      // Add error results for failed batch
      batch.forEach(tag => {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'DELL_WARRANTY',
          timestamp: new Date(),
          cached: false,
        })
      })
    }
  }

  return results
}
