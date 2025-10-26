/**
 * Product Image Fetcher Service
 * Fetches real product images from multiple sources with waterfall fallback
 *
 * Data Sources (in priority order):
 * 1. eBay Finding API (real marketplace images)
 * 2. Brand Scrapers (Apple.com, etc.)
 * 3. Unsplash (generic fallback)
 */

import axios from 'axios'

export interface ProductImageResult {
  success: boolean
  images: string[]
  source: 'ebay' | 'apple_scraper' | 'brand_scraper' | 'unsplash'
  cached?: boolean
}

const EBAY_APP_ID = process.env.EBAY_APP_ID || 'demo-key'
const IMAGE_CACHE = new Map<string, ProductImageResult>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

export class ProductImageFetcher {
  /**
   * Fetch real product images with waterfall fallback
   */
  async fetchImages(productName: string, brand?: string, category?: string): Promise<ProductImageResult> {
    // Check cache first
    const cacheKey = `${productName}-${brand}-${category}`
    const cached = IMAGE_CACHE.get(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    // 1. Try eBay API (real marketplace images)
    const ebayImages = await this.fetchFromEbay(productName, brand)
    if (ebayImages.success && ebayImages.images.length > 0) {
      IMAGE_CACHE.set(cacheKey, ebayImages)
      return ebayImages
    }

    console.log(`[ImageFetcher] ⚠️ eBay returned no images for: ${productName}`)

    // 2. Try brand scraper (for Apple products)
    if (brand?.toLowerCase() === 'apple') {
      const appleImages = await this.fetchFromAppleScraper(productName)
      if (appleImages.success && appleImages.images.length > 0) {
        IMAGE_CACHE.set(cacheKey, appleImages)
        return appleImages
      }
      console.log(`[ImageFetcher] ⚠️ Apple scraper returned no images for: ${productName}`)
    }

    // 3. Fallback to Unsplash (generic stock photos)
    console.log(`[ImageFetcher] 🔄 Using Unsplash fallback for: ${productName}`)
    const unsplashImages = this.generateUnsplashUrls(productName, brand, category)
    IMAGE_CACHE.set(cacheKey, unsplashImages)
    return unsplashImages
  }

  /**
   * Fetch images from eBay Finding API
   */
  private async fetchFromEbay(productName: string, brand?: string): Promise<ProductImageResult> {
    try {
      // Build search keywords (brand + product name for better results)
      const keywords = brand ? `${brand} ${productName}` : productName

      const url = 'https://svcs.ebay.com/services/search/FindingService/v1'
      const params = new URLSearchParams({
        'OPERATION-NAME': 'findItemsAdvanced',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': EBAY_APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': keywords,
        'paginationInput.entriesPerPage': '5',
        'sortOrder': 'BestMatch',
        'aspectFilter(0).aspectName': 'Condition',
        'aspectFilter(0).aspectValueName': 'New',
      })

      const response = await axios.get(`${url}?${params.toString()}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'ThriftAI/1.0 (Product Image Fetcher)',
        },
      })

      const items = response.data?.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item || []

      if (items.length === 0) {
        return { success: false, images: [], source: 'ebay' }
      }

      // Extract image URLs from eBay items
      const images: string[] = []
      for (const item of items.slice(0, 3)) { // Get images from top 3 results
        const imageUrl = item.galleryURL?.[0] || item.pictureURLLarge?.[0]
        if (imageUrl && !images.includes(imageUrl)) {
          // Convert to higher resolution if possible
          const highResUrl = imageUrl.replace('s-l140.jpg', 's-l500.jpg').replace('s-l225.jpg', 's-l500.jpg')
          images.push(highResUrl)
        }
      }

      if (images.length > 0) {
        console.log(`[ImageFetcher] ✅ Got ${images.length} images from eBay for: ${productName}`)
        return { success: true, images, source: 'ebay' }
      }

      return { success: false, images: [], source: 'ebay' }

    } catch (error) {
      console.log(`[ImageFetcher] ❌ eBay error:`, error instanceof Error ? error.message : String(error))
      return { success: false, images: [], source: 'ebay' }
    }
  }

  /**
   * Fetch images from Apple product pages
   */
  private async fetchFromAppleScraper(productName: string): Promise<ProductImageResult> {
    try {
      // This would integrate with the Apple scraper we created
      // For now, use known Apple product image patterns

      const images: string[] = []

      // Extract product type and model from name
      const nameLC = productName.toLowerCase()

      if (nameLC.includes('iphone 15 pro max')) {
        // Official Apple iPhone 15 Pro Max product images
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-naturaltitanium-select?wid=470&hei=556&fmt=png-alpha&.v=1693414122666',
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-naturaltitanium-select-202309?wid=470&hei=556&fmt=png-alpha&.v=1693414122666',
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-finish-select-202309-6-7inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845699229'
        )
      } else if (nameLC.includes('iphone 15 pro')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845702654'
        )
      } else if (nameLC.includes('iphone 14')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1661027381265'
        )
      } else if (nameLC.includes('iphone 13')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-finish-select-202207?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1654893619853'
        )
      } else if (nameLC.includes('macbook pro 14')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697230830200'
        )
      } else if (nameLC.includes('macbook pro 16')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697230830361'
        )
      } else if (nameLC.includes('macbook air 13')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202402?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1708367688034'
        )
      } else if (nameLC.includes('macbook air 15')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-midnight-select-202306?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1684518479433'
        )
      } else if (nameLC.includes('ipad pro 12.9')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-12-select-wifi-spacegray-202104?wid=470&hei=556&fmt=png-alpha&.v=1617059009000'
        )
      } else if (nameLC.includes('ipad pro 11')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-11-select-wifi-spacegray-202104?wid=470&hei=556&fmt=png-alpha&.v=1617059009000'
        )
      } else if (nameLC.includes('ipad air')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-select-wifi-blue-202203?wid=470&hei=556&fmt=png-alpha&.v=1645065732688'
        )
      } else if (nameLC.includes('airpods pro')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1660803972361'
        )
      } else if (nameLC.includes('apple watch ultra')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-ultra-2-select-202309?wid=470&hei=556&fmt=png-alpha&.v=1693859916109'
        )
      } else if (nameLC.includes('apple watch series 9')) {
        images.push(
          'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-s9-select-202309?wid=470&hei=556&fmt=png-alpha&.v=1693858708860'
        )
      }

      if (images.length > 0) {
        console.log(`[ImageFetcher] ✅ Got ${images.length} images from Apple scraper for: ${productName}`)
        return { success: true, images, source: 'apple_scraper' }
      }

      return { success: false, images: [], source: 'apple_scraper' }

    } catch (error) {
      console.log(`[ImageFetcher] ❌ Apple scraper error:`, error instanceof Error ? error.message : String(error))
      return { success: false, images: [], source: 'apple_scraper' }
    }
  }

  /**
   * Generate Unsplash URLs as fallback
   */
  private generateUnsplashUrls(productName: string, brand?: string, category?: string): ProductImageResult {
    // Build search query from product details
    const parts = [brand, productName, category]
      .filter(Boolean)
      .join(',')
      .toLowerCase()
      .replace(/[^\w\s,]/g, '') // Remove special chars

    const baseUrl = 'https://source.unsplash.com/800x800/'
    const seed = productName.length * 100

    const images = [
      `${baseUrl}?${parts}&sig=${seed}`,
      `${baseUrl}?${parts}&sig=${seed + 100}`,
      `${baseUrl}?${parts}&sig=${seed + 200}`,
    ]

    return { success: true, images, source: 'unsplash' }
  }

  /**
   * Clear image cache
   */
  clearCache() {
    IMAGE_CACHE.clear()
    console.log('[ImageFetcher] Cache cleared')
  }
}

// Export singleton instance
export const productImageFetcher = new ProductImageFetcher()
