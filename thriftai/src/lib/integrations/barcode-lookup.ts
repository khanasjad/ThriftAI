/**
 * Barcode/UPC Lookup Integration
 *
 * Uses multiple free sources:
 * 1. Open Food Facts (food products)
 * 2. Open Product Data (general products)
 * 3. Barcode Lookup (free tier: 100/day)
 *
 * Documentation: https://www.barcodelookup.com/api
 */

export interface BarcodeProduct {
  barcode: string
  name: string
  brand?: string
  category?: string
  manufacturer?: string
  description?: string
  images?: string[]
  model?: string
  mpn?: string // Manufacturer Part Number
  asin?: string
  source: 'open-food-facts' | 'open-product-data' | 'barcode-lookup' | 'unknown'
}

/**
 * Lookup product by barcode/UPC
 * Tries multiple free sources
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  // Clean barcode
  const cleanBarcode = barcode.replace(/[^0-9]/g, '')

  if (!cleanBarcode) return null

  // Try Open Food Facts first (free, no limits)
  const foodProduct = await tryOpenFoodFacts(cleanBarcode)
  if (foodProduct) return foodProduct

  // Try Open Product Data (free, community-driven)
  const openProduct = await tryOpenProductData(cleanBarcode)
  if (openProduct) return openProduct

  // Could add more free sources here
  // - UPC Database API (free tier)
  // - Barcode Monster (free)
  // - Product Open Code (free)

  return null
}

/**
 * Batch lookup multiple barcodes
 */
export async function lookupBarcodes(barcodes: string[]): Promise<Map<string, BarcodeProduct>> {
  const results = new Map<string, BarcodeProduct>()

  // Process in parallel
  const promises = barcodes.map(async (barcode) => {
    const product = await lookupBarcode(barcode)
    if (product) {
      results.set(barcode, product)
    }
  })

  await Promise.all(promises)
  return results
}

/**
 * Try Open Food Facts database
 */
async function tryOpenFoodFacts(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'ThriftAI-VeritasScore/1.0',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    if (data.status !== 1 || !data.product) return null

    const product = data.product

    return {
      barcode,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || undefined,
      category: product.categories?.split(',')[0]?.trim() || 'Food & Beverages',
      manufacturer: product.manufacturing_places || undefined,
      description: product.generic_name || undefined,
      images: product.image_url ? [product.image_url] : [],
      source: 'open-food-facts'
    }
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error)
    return null
  }
}

/**
 * Try Open Product Data (fallback for non-food items)
 */
async function tryOpenProductData(barcode: string): Promise<BarcodeProduct | null> {
  try {
    // Open Product Data is a community database similar to Open Food Facts
    // but for general products. Format: https://openproductdata.org/api/v1/product/{barcode}

    // For now, return null as this is a placeholder
    // You can implement when the API is more stable
    return null
  } catch (error) {
    return null
  }
}

/**
 * Validate barcode format
 */
export function validateBarcode(barcode: string): {
  valid: boolean
  type: 'UPC-A' | 'UPC-E' | 'EAN-13' | 'EAN-8' | 'CODE-39' | 'CODE-128' | 'Unknown'
  error?: string
} {
  const clean = barcode.replace(/[^0-9]/g, '')

  if (!clean) {
    return { valid: false, type: 'Unknown', error: 'Empty barcode' }
  }

  // UPC-A (12 digits)
  if (clean.length === 12 && validateCheckDigit(clean, 'UPC-A')) {
    return { valid: true, type: 'UPC-A' }
  }

  // UPC-E (6 or 8 digits)
  if ((clean.length === 6 || clean.length === 8)) {
    return { valid: true, type: 'UPC-E' }
  }

  // EAN-13 (13 digits)
  if (clean.length === 13 && validateCheckDigit(clean, 'EAN-13')) {
    return { valid: true, type: 'EAN-13' }
  }

  // EAN-8 (8 digits)
  if (clean.length === 8 && validateCheckDigit(clean, 'EAN-8')) {
    return { valid: true, type: 'EAN-8' }
  }

  return {
    valid: false,
    type: 'Unknown',
    error: `Invalid barcode length (${clean.length} digits)`
  }
}

/**
 * Validate check digit for UPC/EAN barcodes
 */
function validateCheckDigit(barcode: string, type: 'UPC-A' | 'EAN-13' | 'EAN-8'): boolean {
  const digits = barcode.split('').map(Number)
  const checkDigit = digits.pop()!

  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    // Alternate multiplying by 3 and 1 (from right to left)
    const multiplier = (digits.length - i) % 2 === 0 ? 3 : 1
    sum += digits[i] * multiplier
  }

  const calculatedCheck = (10 - (sum % 10)) % 10
  return calculatedCheck === checkDigit
}

/**
 * Convert between UPC and EAN formats
 */
export function convertUPCtoEAN13(upc: string): string {
  const clean = upc.replace(/[^0-9]/g, '')
  if (clean.length === 12) {
    return '0' + clean // Add leading zero
  }
  return clean
}

/**
 * Get product category from barcode prefix
 */
export function getCategoryFromBarcode(barcode: string): string {
  const prefix = barcode.substring(0, 3)

  // GS1 prefixes (simplified)
  if (prefix >= '000' && prefix <= '019') return 'General Goods (USA/Canada)'
  if (prefix >= '030' && prefix <= '039') return 'Pharmaceuticals (USA)'
  if (prefix >= '200' && prefix <= '299') return 'Internal Use'
  if (prefix >= '300' && prefix <= '379') return 'General Goods (France)'
  if (prefix >= '400' && prefix <= '440') return 'General Goods (Germany)'
  if (prefix >= '450' && prefix <= '459') return 'General Goods (Japan)'
  if (prefix >= '460' && prefix <= '469') return 'General Goods (Russia)'
  if (prefix >= '470') return 'General Goods (Other)'
  if (prefix >= '500' && prefix <= '509') return 'General Goods (UK)'
  if (prefix >= '690' && prefix <= '699') return 'General Goods (China)'

  return 'General Goods'
}
