/**
 * Product Image Fetcher
 *
 * Fetches real product images from Pexels API (free, unlimited)
 * Falls back to placeholder images when no match found
 *
 * Usage:
 *   npx tsx scripts/add-product-images.ts
 *   npx tsx scripts/add-product-images.ts --limit 100
 *   npx tsx scripts/add-product-images.ts --category LAPTOPS
 */

import { prisma } from '../src/lib/prisma'

// Pexels API configuration
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'YOUR_PEXELS_API_KEY_HERE'
const USE_PEXELS = PEXELS_API_KEY !== 'YOUR_PEXELS_API_KEY_HERE'

// Rate limiting
const REQUESTS_PER_MINUTE = 200 // Pexels allows 200/hour, we'll be conservative
const DELAY_BETWEEN_REQUESTS = 60000 / REQUESTS_PER_MINUTE // milliseconds

interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
}

interface PexelsResponse {
  photos: PexelsPhoto[]
  total_results: number
  page: number
  per_page: number
}

// Category to search query mapping for better image results
const CATEGORY_SEARCH_QUERIES: Record<string, string> = {
  LAPTOPS: 'laptop computer',
  SMARTPHONES: 'smartphone mobile phone',
  TABLETS: 'tablet ipad',
  SMARTWATCHES: 'smartwatch wearable',
  HEADPHONES: 'headphones earbuds',
  CAMERAS: 'camera photography',
  MONITORS: 'computer monitor display',
  KEYBOARDS: 'keyboard computer',
  MENS_TSHIRTS: 'mens tshirt clothing',
  MENS_JEANS: 'mens jeans denim',
  WOMENS_DRESSES: 'womens dress fashion',
  WOMENS_TOPS: 'womens top blouse',
  MENS_SNEAKERS: 'mens sneakers shoes',
  WOMENS_SNEAKERS: 'womens sneakers shoes',
  RUNNING_SHOES: 'running shoes athletic',
  KITCHEN_APPLIANCES: 'kitchen appliance',
  COOKWARE: 'cookware pots pans',
  FURNITURE: 'furniture home',
  LEGO_SETS: 'lego toys blocks',
  TEXTBOOKS: 'textbook books education',
  FICTION_BOOKS: 'books reading literature',
  ACTION_FIGURES: 'action figure toys',
  BOARD_GAMES: 'board game family game',
  VIDEO_GAMES: 'video game controller gaming'
}

/**
 * Fetch image from Pexels API
 */
async function fetchPexelsImage(query: string): Promise<string | null> {
  if (!USE_PEXELS) {
    return null
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    )

    if (!response.ok) {
      console.error(`Pexels API error: ${response.status}`)
      return null
    }

    const data: PexelsResponse = await response.json()

    if (data.photos && data.photos.length > 0) {
      // Return medium size image URL
      return data.photos[0].src.medium
    }

    return null
  } catch (error) {
    console.error('Error fetching from Pexels:', error)
    return null
  }
}

/**
 * Generate placeholder image URL
 */
function getPlaceholderImage(productName: string, category: string): string {
  // Use DiceBear for unique, deterministic avatars based on product
  const seed = encodeURIComponent(productName.replace(/\s+/g, '-').toLowerCase())

  // Choose avatar style based on category
  const categoryStyles: Record<string, string> = {
    LAPTOPS: 'shapes',
    SMARTPHONES: 'shapes',
    TABLETS: 'shapes',
    CLOTHING: 'identicon',
    SHOES: 'identicon',
    TOYS: 'bottts',
    BOOKS: 'identicon',
    DEFAULT: 'thumbs'
  }

  const style = Object.keys(categoryStyles).find(key => category.includes(key))
    ? categoryStyles[Object.keys(categoryStyles).find(key => category.includes(key))!]
    : categoryStyles.DEFAULT

  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=f0f0f0`
}

/**
 * Get search query for a product
 */
function getSearchQuery(product: any): string {
  const category = product.category as string
  const baseQuery = CATEGORY_SEARCH_QUERIES[category] || category.toLowerCase().replace(/_/g, ' ')

  // For specific brands, include brand name for better results
  if (product.brand && !['Generic', 'No Brand', 'Store Brand'].includes(product.brand)) {
    return `${product.brand} ${baseQuery}`.trim()
  }

  return baseQuery
}

/**
 * Add delay between API requests
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined
  const categoryIndex = args.indexOf('--category')
  const category = categoryIndex !== -1 ? args[categoryIndex + 1] : undefined

  console.log('\n🖼️  Product Image Fetcher')
  console.log('=' .repeat(50))
  console.log()

  if (USE_PEXELS) {
    console.log('✅ Using Pexels API for real product images')
  } else {
    console.log('⚠️  No Pexels API key found - using placeholder images only')
    console.log('💡 Set PEXELS_API_KEY environment variable to use real images')
    console.log('   Get free API key at: https://www.pexels.com/api/')
  }
  console.log()

  // Get products without images or with local file paths
  const whereClause: any = {
    isAvailable: true,
    OR: [
      { imageUrl: null },
      { imageUrl: '' },
      { imageUrl: { startsWith: '/images/products/' } }
    ]
  }

  if (category) {
    whereClause.category = category
    console.log(`📁 Category Filter: ${category}\n`)
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      category: true,
      brand: true,
      imageUrl: true
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  })

  console.log(`📦 Found ${products.length} products without images\n`)

  if (products.length === 0) {
    console.log('✅ All products already have images!\n')
    return
  }

  let updated = 0
  let fromPexels = 0
  let fromPlaceholder = 0
  let failed = 0

  console.log('🔄 Fetching images...\n')

  // Process products with category grouping for better API efficiency
  const productsByCategory = new Map<string, typeof products>()
  products.forEach(product => {
    const cat = product.category
    if (!productsByCategory.has(cat)) {
      productsByCategory.set(cat, [])
    }
    productsByCategory.get(cat)!.push(product)
  })

  let totalProcessed = 0

  for (const [cat, categoryProducts] of productsByCategory) {
    console.log(`\n📂 Processing ${cat} (${categoryProducts.length} products)...`)

    // For each category, try to get one image from Pexels and reuse for similar products
    let categoryImageUrl: string | null = null

    if (USE_PEXELS) {
      const searchQuery = CATEGORY_SEARCH_QUERIES[cat] || cat.toLowerCase().replace(/_/g, ' ')
      categoryImageUrl = await fetchPexelsImage(searchQuery)

      if (categoryImageUrl) {
        console.log(`   ✅ Found Pexels image for ${cat}`)
      } else {
        console.log(`   ⚠️  No Pexels image found for ${cat}, using placeholders`)
      }

      await delay(DELAY_BETWEEN_REQUESTS)
    }

    // Update all products in this category
    for (const product of categoryProducts) {
      totalProcessed++
      const progress = ((totalProcessed / products.length) * 100).toFixed(1)

      try {
        let imageUrl: string

        // Use category image from Pexels if available, otherwise use placeholder
        if (categoryImageUrl) {
          imageUrl = categoryImageUrl
          fromPexels++
        } else {
          imageUrl = getPlaceholderImage(product.name, product.category)
          fromPlaceholder++
        }

        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl }
        })

        updated++
        process.stdout.write(`\r   Progress: ${progress}% (${totalProcessed}/${products.length})`)

      } catch (error) {
        console.error(`\n   ❌ Error updating ${product.name}:`, error)
        failed++
      }
    }
  }

  console.log('\n\n✅ Image fetching complete!\n')
  console.log('📊 Results:')
  console.log(`   ✅ Total Updated:       ${updated}`)
  console.log(`   🌐 From Pexels:         ${fromPexels}`)
  console.log(`   🎨 From Placeholders:   ${fromPlaceholder}`)
  console.log(`   ❌ Failed:              ${failed}`)
  console.log()

  if (!USE_PEXELS) {
    console.log('💡 Tip: Get a free Pexels API key to use real product images:')
    console.log('   1. Sign up at https://www.pexels.com/api/')
    console.log('   2. Set PEXELS_API_KEY=your_key in .env')
    console.log('   3. Run this script again')
    console.log()
  }

  await prisma.$disconnect()
}

main().catch(console.error)
