#!/usr/bin/env tsx
/**
 * Test Image Fetcher on Sample Products
 * Verifies waterfall logic: eBay API → Brand Scraper → Unsplash
 */
import { PrismaClient } from '@prisma/client'
import { productImageFetcher } from '../src/lib/services/productImageFetcher'

const prisma = new PrismaClient()

async function testImageFetcher() {
  console.log('🧪 Testing Image Fetcher Waterfall Logic\n')
  console.log('=' .repeat(80) + '\n')

  try {
    // Get a diverse sample of products
    const products = await prisma.product.findMany({
      where: {
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        imageUrl: true,
      },
      take: 10,
      orderBy: {
        id: 'asc',
      },
    })

    console.log(`📦 Testing ${products.length} sample products:\n`)

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      console.log(`\n${'─'.repeat(80)}`)
      console.log(`[${i + 1}/${products.length}] ${product.name}`)
      console.log(`Brand: ${product.brand || 'N/A'} | Category: ${product.category}`)
      console.log('─'.repeat(80))

      // Show current images
      console.log('\n📷 Current Images:')
      if (Array.isArray(product.imageUrl)) {
        product.imageUrl.forEach((url, idx) => {
          const urlPreview = url.length > 100 ? url.substring(0, 100) + '...' : url
          console.log(`   ${idx + 1}. ${urlPreview}`)
        })
      } else {
        console.log('   No images')
      }

      // Fetch new images
      console.log('\n🔄 Fetching new images...')
      const startTime = Date.now()

      const result = await productImageFetcher.fetchImages(
        product.name,
        product.brand || undefined,
        product.category || undefined
      )

      const duration = Date.now() - startTime

      // Show results
      if (result.success) {
        const sourceEmoji =
          result.source === 'ebay' ? '🏪' :
          result.source === 'apple_scraper' ? '🍎' :
          result.source === 'brand_scraper' ? '🔧' :
          '📷'

        console.log(`\n✅ Success! Got ${result.images.length} images from ${sourceEmoji} ${result.source} (${duration}ms)`)
        console.log(result.cached ? '   💾 From cache' : '   🌐 Fresh fetch')

        console.log('\n📸 New Images:')
        result.images.forEach((url, idx) => {
          const urlPreview = url.length > 100 ? url.substring(0, 100) + '...' : url
          console.log(`   ${idx + 1}. ${urlPreview}`)
        })

        // Determine if it's an improvement
        const isImprovement =
          result.source === 'ebay' ||
          result.source === 'apple_scraper' ||
          result.source === 'brand_scraper'

        if (isImprovement) {
          console.log('\n🎯 IMPROVEMENT: Real product images vs generic stock photos!')
        } else {
          console.log('\n⚠️  Still using Unsplash fallback')
        }

      } else {
        console.log(`\n❌ Failed to fetch images (${duration}ms)`)
      }

      // Small delay between requests
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Test Complete!\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testImageFetcher().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
