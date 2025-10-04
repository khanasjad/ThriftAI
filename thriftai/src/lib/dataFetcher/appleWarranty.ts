/**
 * Apple Warranty Check API Integration
 * Official Apple API - FREE, No authentication required
 */

import { AppleWarrantyResult, DataSourceResult, CACHE_TTL } from './types'
import { getCachedOrFetch, generateCacheKey } from './cache'
import { withRateLimit } from './rateLimiter'

const APPLE_API_BASE = 'https://km.support.apple.com/kb/index'

/**
 * Check Apple warranty status by serial number
 */
export async function checkAppleWarranty(
  serialNumber: string
): Promise<DataSourceResult<AppleWarrantyResult>> {
  const source = 'APPLE_WARRANTY'
  const cacheKey = generateCacheKey(source, serialNumber)

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.WARRANTY_STATUS,
      async () => {
        return await withRateLimit('APPLE', async () => {
          return await fetchAppleWarranty(serialNumber)
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
    console.error('[Apple Warranty] Error:', error)
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
 * Fetch warranty data from Apple
 */
async function fetchAppleWarranty(serialNumber: string): Promise<AppleWarrantyResult> {
  // Apple's coverage check page
  const url = `${APPLE_API_BASE}?page=cpuspec&serialnumber=${serialNumber}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ThriftAI-VeritasScore/1.0',
      'Accept': 'application/json, text/html',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return {
        isValid: false,
        warrantyStatus: 'Unknown',
      }
    }
    throw new Error(`Apple API error: ${response.status}`)
  }

  const html = await response.text()

  // Try alternate API endpoint (JSON)
  const jsonUrl = `https://km.support.apple.com/kb/index?page=matchmanual_product_info&serialnumber=${serialNumber}`

  try {
    const jsonResponse = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'ThriftAI-VeritasScore/1.0',
        'Accept': 'application/json',
      },
    })

    if (jsonResponse.ok) {
      const data = await jsonResponse.json()

      return parseAppleResponse(data, serialNumber)
    }
  } catch (jsonError) {
    console.warn('[Apple Warranty] JSON endpoint failed, falling back to HTML parsing')
  }

  // Fallback: Parse HTML response
  return parseAppleHTML(html, serialNumber)
}

/**
 * Parse JSON response from Apple
 */
function parseAppleResponse(data: any, serialNumber: string): AppleWarrantyResult {
  if (!data || !data.product) {
    return {
      isValid: false,
      warrantyStatus: 'Unknown',
    }
  }

  // Extract warranty information
  const warranty = data.warranty || {}
  const product = data.product || {}

  const now = new Date()
  let warrantyStatus: 'Active' | 'Expired' | 'Unknown' = 'Unknown'
  let expirationDate: Date | undefined
  let purchaseDate: Date | undefined

  if (warranty.expirationDate) {
    expirationDate = new Date(warranty.expirationDate)
    warrantyStatus = expirationDate > now ? 'Active' : 'Expired'
  }

  if (warranty.purchaseDate) {
    purchaseDate = new Date(warranty.purchaseDate)
  }

  return {
    isValid: true,
    warrantyStatus,
    expirationDate,
    manufacturingDate: product.manufactureDate ? new Date(product.manufactureDate) : undefined,
    model: product.name || product.model,
    coverage: warranty.type || 'Limited Warranty',
    purchaseDate,
  }
}

/**
 * Parse HTML response (fallback)
 */
function parseAppleHTML(html: string, serialNumber: string): AppleWarrantyResult {
  // Simple HTML parsing for warranty info
  // This is a fallback when JSON API is not available

  const isValid = html.includes(serialNumber) && !html.includes('not valid')

  if (!isValid) {
    return {
      isValid: false,
      warrantyStatus: 'Unknown',
    }
  }

  // Try to extract model name
  const modelMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  const model = modelMatch ? modelMatch[1].trim() : undefined

  // Check for warranty status keywords
  let warrantyStatus: 'Active' | 'Expired' | 'Unknown' = 'Unknown'

  if (html.includes('Active') || html.includes('active') || html.includes('Valid')) {
    warrantyStatus = 'Active'
  } else if (html.includes('Expired') || html.includes('expired')) {
    warrantyStatus = 'Expired'
  }

  return {
    isValid: true,
    warrantyStatus,
    model,
  }
}

/**
 * Decode manufacturing date from serial number
 * Apple serial numbers encode manufacturing date
 */
export function decodeAppleSerialDate(serialNumber: string): Date | null {
  if (!serialNumber || serialNumber.length < 8) {
    return null
  }

  try {
    // For 12-character serial numbers (2010+)
    if (serialNumber.length === 12) {
      const yearCode = serialNumber[3]
      const weekCode = serialNumber[4]

      // Year codes: C=2010, D=2011, F=2012, G=2013, H=2014, J=2015, K=2016, L=2017, M=2018, N=2019, P=2020, Q=2021, R=2022, S=2023, T=2024, V=2025
      const yearMap: Record<string, number> = {
        'C': 2010, 'D': 2011, 'F': 2012, 'G': 2013, 'H': 2014,
        'J': 2015, 'K': 2016, 'L': 2017, 'M': 2018, 'N': 2019,
        'P': 2020, 'Q': 2021, 'R': 2022, 'S': 2023, 'T': 2024, 'V': 2025
      }

      // Week codes: 1-9 then C-Y (skipping vowels)
      const weekMap: Record<string, number> = {
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        'C': 10, 'D': 11, 'F': 12, 'G': 13, 'H': 14, 'J': 15, 'K': 16, 'L': 17,
        'M': 18, 'N': 19, 'P': 20, 'Q': 21, 'R': 22, 'T': 23, 'V': 24, 'W': 25,
        'X': 26, 'Y': 27
      }

      const year = yearMap[yearCode]
      const week = weekMap[weekCode]

      if (year && week) {
        // Calculate approximate date (week 1 starts around Jan 1)
        const date = new Date(year, 0, 1)
        date.setDate(date.getDate() + (week - 1) * 7)
        return date
      }
    }

    return null
  } catch (error) {
    console.error('[Apple Serial] Decode error:', error)
    return null
  }
}

/**
 * Validate Apple serial number format
 */
export function validateAppleSerial(serialNumber: string): boolean {
  if (!serialNumber) return false

  // Remove whitespace
  const serial = serialNumber.trim().toUpperCase()

  // Modern Apple serials are 12 characters (2010+)
  // Older serials are 11 characters
  if (serial.length !== 11 && serial.length !== 12) {
    return false
  }

  // Check if alphanumeric
  const alphanumeric = /^[A-Z0-9]+$/
  if (!alphanumeric.test(serial)) {
    return false
  }

  // Check for commonly excluded characters (Apple doesn't use 0, O, or I in certain positions)
  // This is a simplified check
  return true
}
