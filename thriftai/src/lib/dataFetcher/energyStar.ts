/**
 * Energy Star API Integration
 * Official US Government API - FREE, No authentication required
 * Provides environmental certifications
 */

import { EnergyStarInfo, DataSourceResult, CACHE_TTL } from './types'
import { getCachedOrFetch, generateCacheKey } from './cache'

const ENERGY_STAR_API = 'https://data.energystar.gov/resource/7jv8-t6ux.json'

/**
 * Check Energy Star certification
 */
export async function checkEnergyStar(
  modelNumber: string,
  brand?: string
): Promise<DataSourceResult<EnergyStarInfo>> {
  const source = 'ENERGY_STAR'
  const cacheKey = generateCacheKey(source, modelNumber, brand || '')

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.ENERGY_STAR,
      async () => {
        return await fetchEnergyStar(modelNumber, brand)
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
    console.error('[Energy Star] Error:', error)
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
 * Fetch Energy Star data
 */
async function fetchEnergyStar(
  modelNumber: string,
  brand?: string
): Promise<EnergyStarInfo> {
  // Build query
  const params = new URLSearchParams({
    '$limit': '10',
    '$where': `UPPER(model_number) LIKE '%${modelNumber.toUpperCase()}%'`,
  })

  if (brand) {
    params.set('$where',
      `UPPER(model_number) LIKE '%${modelNumber.toUpperCase()}%' AND UPPER(brand_name) LIKE '%${brand.toUpperCase()}%'`
    )
  }

  const url = `${ENERGY_STAR_API}?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ThriftAI-VeritasScore/1.0',
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Energy Star API error: ${response.status}`)
  }

  const data = await response.json()

  if (!Array.isArray(data) || data.length === 0) {
    // Not certified
    return {
      modelNumber,
      brand: brand || '',
      certified: false,
    }
  }

  // Take first match
  const product = data[0]

  return {
    modelNumber: product.model_number || modelNumber,
    brand: product.brand_name || brand || '',
    certified: true,
    certificationDate: product.date_available_on_market ? new Date(product.date_available_on_market) : undefined,
    energyEfficiency: product.markets || undefined,
    annualEnergyCost: product.annual_energy_cost ? parseFloat(product.annual_energy_cost) : undefined,
  }
}

/**
 * Calculate sustainability score from Energy Star data
 */
export function calculateEnergyStarScore(info: EnergyStarInfo): number {
  if (!info.certified) {
    return 50 // Neutral score for non-certified
  }

  let score = 80 // Base score for Energy Star certification

  // Bonus for recent certification (within last 2 years)
  if (info.certificationDate) {
    const age = Date.now() - info.certificationDate.getTime()
    const yearsOld = age / (1000 * 60 * 60 * 24 * 365)

    if (yearsOld < 2) {
      score += 10
    } else if (yearsOld < 5) {
      score += 5
    }
  }

  // Bonus for low annual energy cost
  if (info.annualEnergyCost !== undefined) {
    if (info.annualEnergyCost < 50) {
      score += 10
    } else if (info.annualEnergyCost < 100) {
      score += 5
    }
  }

  return Math.min(100, score)
}
