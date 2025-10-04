/**
 * iFixit Repairability API Integration
 * Official iFixit API - FREE, No authentication required
 */

import { RepairabilityInfo, DataSourceResult, CACHE_TTL } from './types'
import { getCachedOrFetch, generateCacheKey } from './cache'
import { withRateLimit } from './rateLimiter'

const IFIXIT_API_BASE = 'https://www.ifixit.com/api/2.0'

/**
 * Get repairability information from iFixit
 */
export async function getRepairability(
  deviceName: string
): Promise<DataSourceResult<RepairabilityInfo>> {
  const source = 'IFIXIT'
  const cacheKey = generateCacheKey(source, deviceName)

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.REPAIRABILITY,
      async () => {
        return await withRateLimit('IFIXIT', async () => {
          return await fetchRepairability(deviceName)
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
    console.error('[iFixit] Error:', error)
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
 * Fetch repairability data from iFixit
 */
async function fetchRepairability(deviceName: string): Promise<RepairabilityInfo> {
  // Try to search for the device first
  const searchUrl = `${IFIXIT_API_BASE}/search/${encodeURIComponent(deviceName)}?filter=device`

  const searchResponse = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'ThriftAI-VeritasScore/1.0',
      'Accept': 'application/json',
    },
  })

  if (!searchResponse.ok) {
    throw new Error(`iFixit search failed: ${searchResponse.status}`)
  }

  const searchData = await searchResponse.json()

  // Get first result
  if (!searchData.results || searchData.results.length === 0) {
    throw new Error(`Device not found on iFixit: ${deviceName}`)
  }

  const device = searchData.results[0]

  // Get device details
  const deviceUrl = device.url || device.wiki_url

  if (!deviceUrl) {
    throw new Error(`No URL found for device: ${deviceName}`)
  }

  // Fetch device page
  const deviceResponse = await fetch(deviceUrl, {
    headers: {
      'User-Agent': 'ThriftAI-VeritasScore/1.0',
      'Accept': 'application/json',
    },
  })

  if (!deviceResponse.ok) {
    throw new Error(`iFixit device fetch failed: ${deviceResponse.status}`)
  }

  const deviceData = await deviceResponse.json()

  // Parse repairability information
  return parseIFixitData(deviceData, deviceName)
}

/**
 * Parse iFixit device data
 */
function parseIFixitData(data: any, deviceName: string): RepairabilityInfo {
  const info: RepairabilityInfo = {
    deviceName,
    repairabilityScore: 0,
    difficulty: 'Moderate',
    partsAvailable: false,
  }

  // Extract repairability score
  if (data.repairability_score !== undefined) {
    info.repairabilityScore = data.repairability_score
  } else if (data.difficulty) {
    // Map difficulty to score
    const difficultyScores: Record<string, number> = {
      'Very Easy': 9,
      'Easy': 7,
      'Moderate': 5,
      'Difficult': 3,
      'Very Difficult': 1,
    }
    info.repairabilityScore = difficultyScores[data.difficulty] || 5
  }

  // Extract difficulty
  if (data.difficulty) {
    info.difficulty = data.difficulty
  } else {
    // Infer from score
    if (info.repairabilityScore >= 8) info.difficulty = 'Very Easy'
    else if (info.repairabilityScore >= 6) info.difficulty = 'Easy'
    else if (info.repairabilityScore >= 4) info.difficulty = 'Moderate'
    else if (info.repairabilityScore >= 2) info.difficulty = 'Difficult'
    else info.difficulty = 'Very Difficult'
  }

  // Check parts availability
  if (data.parts || data.tools) {
    info.partsAvailable = true
  }

  // Teardown URL
  if (data.teardown_url) {
    info.teardownUrl = data.teardown_url
  } else if (data.url && data.url.includes('Teardown')) {
    info.teardownUrl = data.url
  }

  // Repair guides count
  if (data.guides) {
    info.repairGuides = Array.isArray(data.guides) ? data.guides.length : data.guides
  }

  return info
}

/**
 * Get repairability score interpretation
 */
export function interpretRepairabilityScore(score: number): {
  rating: string
  description: string
  color: string
} {
  if (score >= 8) {
    return {
      rating: 'Excellent',
      description: 'Very easy to repair. Parts readily available.',
      color: '#10b981', // green
    }
  } else if (score >= 6) {
    return {
      rating: 'Good',
      description: 'Fairly easy to repair with common tools.',
      color: '#3b82f6', // blue
    }
  } else if (score >= 4) {
    return {
      rating: 'Fair',
      description: 'Moderate difficulty. Some specialized tools may be needed.',
      color: '#f59e0b', // amber
    }
  } else if (score >= 2) {
    return {
      rating: 'Poor',
      description: 'Difficult to repair. May require professional help.',
      color: '#f97316', // orange
    }
  } else {
    return {
      rating: 'Very Poor',
      description: 'Very difficult or impossible to repair.',
      color: '#ef4444', // red
    }
  }
}
