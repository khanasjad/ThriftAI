/**
 * GSMArena Phone Specifications Scraper
 * Public data - FREE, Respectful scraping with rate limiting
 */

import * as cheerio from 'cheerio'
import { PhoneSpecifications, DataSourceResult, CACHE_TTL } from './types'
import { getCachedOrFetch, generateCacheKey } from './cache'
import { withRateLimit } from './rateLimiter'

const GSMARENA_BASE = 'https://www.gsmarena.com'

/**
 * Get phone specifications from GSMArena
 */
export async function getPhoneSpecs(
  phoneName: string
): Promise<DataSourceResult<PhoneSpecifications>> {
  const source = 'GSMARENA'
  const cacheKey = generateCacheKey(source, phoneName)

  try {
    const { data, cached } = await getCachedOrFetch(
      cacheKey,
      CACHE_TTL.PRODUCT_SPECS,
      async () => {
        return await withRateLimit('GSMARENA', async () => {
          return await scrapePhoneSpecs(phoneName)
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
    console.error('[GSMArena] Error:', error)
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
 * Scrape phone specifications
 */
async function scrapePhoneSpecs(phoneName: string): Promise<PhoneSpecifications> {
  // Step 1: Search for the phone
  const searchUrl = `${GSMARENA_BASE}/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(phoneName)}`

  const searchResponse = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ThriftAI-VeritasScore/1.0; +https://thriftai.com)',
      'Accept': 'text/html',
    },
  })

  if (!searchResponse.ok) {
    throw new Error(`GSMArena search failed: ${searchResponse.status}`)
  }

  const searchHtml = await searchResponse.text()
  const $search = cheerio.load(searchHtml)

  // Get first result link
  const phoneLink = $search('.makers ul li a').first().attr('href')

  if (!phoneLink) {
    throw new Error(`Phone not found: ${phoneName}`)
  }

  // Rate limiting before next request
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Step 2: Get phone details page
  const phoneUrl = phoneLink.startsWith('http') ? phoneLink : `${GSMARENA_BASE}/${phoneLink}`

  const phoneResponse = await fetch(phoneUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ThriftAI-VeritasScore/1.0; +https://thriftai.com)',
      'Accept': 'text/html',
    },
  })

  if (!phoneResponse.ok) {
    throw new Error(`GSMArena page load failed: ${phoneResponse.status}`)
  }

  const phoneHtml = await phoneResponse.text()
  const $ = cheerio.load(phoneHtml)

  // Extract specifications
  const specs: PhoneSpecifications = {
    deviceName: $('.specs-phone-name-title').text().trim() || phoneName,
  }

  // Extract brand
  const brandMatch = specs.deviceName.match(/^([A-Za-z]+)/)
  if (brandMatch) {
    specs.brand = brandMatch[1]
  }

  // Helper function to get spec value
  const getSpec = (label: string): string | undefined => {
    const element = $(`.ttl:contains("${label}")`).parent().find('.nfo').first()
    const value = element.text().trim()
    return value || undefined
  }

  // Display
  specs.displaySize = getSpec('Size')
  specs.displayResolution = getSpec('Resolution')
  specs.displayType = getSpec('Type')

  // Performance
  specs.processor = getSpec('CPU')
  specs.chipset = getSpec('Chipset')
  specs.gpu = getSpec('GPU')
  specs.ram = getSpec('Internal') // RAM is part of internal memory
  specs.storage = getSpec('Internal')

  // Camera
  specs.mainCamera = getSpec('Main Camera') || getSpec('Single') || getSpec('Dual') || getSpec('Triple') || getSpec('Quad')
  specs.selfieCamera = getSpec('Selfie camera')
  specs.videoRecording = getSpec('Video')

  // Battery
  specs.batteryCapacity = getSpec('Battery')
  specs.batteryType = getSpec('Type')
  specs.charging = getSpec('Charging')

  // Connectivity
  specs.network = getSpec('Network')
  specs.wifi = getSpec('WLAN')
  specs.bluetooth = getSpec('Bluetooth')
  const nfcText = getSpec('NFC')
  specs.nfc = nfcText ? nfcText.toLowerCase().includes('yes') : undefined

  // Physical
  specs.dimensions = getSpec('Dimensions')
  specs.weight = getSpec('Weight')
  specs.build = getSpec('Build')
  specs.sim = getSpec('SIM')

  // Software
  specs.os = getSpec('OS')

  // Release
  const announced = getSpec('Announced')
  if (announced) {
    specs.releaseDate = announced
    const yearMatch = announced.match(/20\d{2}/)
    if (yearMatch) {
      specs.releaseYear = parseInt(yearMatch[0])
    }
  }

  // Price
  specs.priceRange = getSpec('Price')

  return specs
}

/**
 * Search for phones and return list of matches
 */
export async function searchPhones(query: string): Promise<Array<{name: string, link: string, image?: string}>> {
  await withRateLimit('GSMARENA', async () => {})

  const searchUrl = `${GSMARENA_BASE}/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(query)}`

  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ThriftAI-VeritasScore/1.0; +https://thriftai.com)',
      'Accept': 'text/html',
    },
  })

  if (!response.ok) {
    throw new Error(`GSMArena search failed: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  const results: Array<{name: string, link: string, image?: string}> = []

  $('.makers ul li').each((_, element) => {
    const $el = $(element)
    const $link = $el.find('a')
    const name = $link.find('strong span').text().trim()
    const link = $link.attr('href')
    const image = $link.find('img').attr('src')

    if (name && link) {
      results.push({
        name,
        link: link.startsWith('http') ? link : `${GSMARENA_BASE}/${link}`,
        image: image ? (image.startsWith('http') ? image : `${GSMARENA_BASE}/${image}`) : undefined,
      })
    }
  })

  return results
}
