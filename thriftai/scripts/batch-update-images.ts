#!/usr/bin/env tsx
/**
 * Batch Image Update Script
 * Updates product images using waterfall fetching: eBay API → Brand Scraper → Unsplash
 */
import { PrismaClient } from '@prisma/client'
import { productImageFetcher } from '../src/lib/services/productImageFetcher'

const prisma = new PrismaClient()

interface UpdateStats {
  total: number
  updated: number
  ebay: number
  appleScraper: number
  brandScraper: number
  unsplash: number
  errors: number
}

async function updateProductImages(limit = 100, offset = 0): Promise<UpdateStats> {
  const stats: UpdateStats = {
    total: 0,
    updated: 0,
    ebay: 0,
    appleScraper: 0,
    brandScraper: 0,
    unsplash: 0,
    errors: 0,
  }

  console.log(`\n📸 Fetching ${limit} products starting at offset ${offset}...\n`)

  // Get products
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
    orderBy: {
      id: 'asc',
    },
    skip: offset,
    take: limit,
  })

  stats.total = products.length
  console.log(`Found ${products.length} products\n`)

  // Update each product
  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const progress = `[${i + 1}/${products.length}]`

    try {
      console.log(`${progress} 🔄 Fetching images for: ${product.name}`)

      // Fetch images using waterfall
      const imageResult = await productImageFetcher.fetchImages(
        product.name,
        product.brand || undefined,
        product.category || undefined
      )

      if (imageResult.success && imageResult.images.length > 0) {
        // Update product with new images (convert array to JSON string)
        await prisma.product.update({
          where: { id: product.id },
          data: {
            imageUrl: JSON.stringify(imageResult.images),
          },
        })

        // Track source statistics
        stats.updated++
        if (imageResult.source === 'ebay') stats.ebay++
        else if (imageResult.source === 'apple_scraper') stats.appleScraper++
        else if (imageResult.source === 'brand_scraper') stats.brandScraper++
        else if (imageResult.source === 'unsplash') stats.unsplash++

        const sourceEmoji =
          imageResult.source === 'ebay' ? '🏪' :
          imageResult.source === 'apple_scraper' ? '🍎' :
          imageResult.source === 'brand_scraper' ? '🔧' :
          '📷'

        console.log(`${progress} ✅ Updated with ${imageResult.images.length} images from ${sourceEmoji} ${imageResult.source}`)
      } else {
        console.log(`${progress} ⚠️ No images found, keeping existing`)
      }

    } catch (error) {
      stats.errors++
      console.error(`${progress} ❌ Error updating ${product.name}:`, error instanceof Error ? error.message : String(error))
    }

    // Small delay to avoid rate limiting
    if (i < products.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return stats
}

async function main() {
  console.log('🎨 ThriftAI Image Update Script')
  console.log('=' .repeat(80))
  console.log('Waterfall Strategy: eBay API → Brand Scraper → Unsplash\n')

  try {
    // Get total count
    const totalCount = await prisma.product.count({
      where: { isAvailable: true }
    })

    console.log(`📊 Total products to update: ${totalCount}\n`)

    // Process in batches of 100
    const batchSize = 100
    const batches = Math.ceil(totalCount / batchSize)

    const overallStats: UpdateStats = {
      total: 0,
      updated: 0,
      ebay: 0,
      appleScraper: 0,
      brandScraper: 0,
      unsplash: 0,
      errors: 0,
    }

    for (let batch = 0; batch < batches; batch++) {
      const offset = batch * batchSize
      console.log(`\n${'='.repeat(80)}`)
      console.log(`📦 BATCH ${batch + 1}/${batches}`)
      console.log('='.repeat(80))

      const batchStats = await updateProductImages(batchSize, offset)

      // Aggregate stats
      overallStats.total += batchStats.total
      overallStats.updated += batchStats.updated
      overallStats.ebay += batchStats.ebay
      overallStats.appleScraper += batchStats.appleScraper
      overallStats.brandScraper += batchStats.brandScraper
      overallStats.unsplash += batchStats.unsplash
      overallStats.errors += batchStats.errors

      console.log(`\n✅ Batch ${batch + 1} complete:`)
      console.log(`   Updated: ${batchStats.updated}/${batchStats.total}`)
      console.log(`   eBay: ${batchStats.ebay}, Apple: ${batchStats.appleScraper}, Unsplash: ${batchStats.unsplash}`)
      console.log(`   Errors: ${batchStats.errors}`)

      // Small delay between batches
      if (batch < batches - 1) {
        console.log('\n⏳ Waiting 2 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(80))
    console.log('🎉 IMAGE UPDATE COMPLETE!')
    console.log('='.repeat(80))
    console.log(`\n📊 Final Statistics:`)
    console.log(`   Total Products: ${overallStats.total}`)
    console.log(`   Updated: ${overallStats.updated} (${((overallStats.updated / overallStats.total) * 100).toFixed(1)}%)`)
    console.log(`\n📸 Image Sources:`)
    console.log(`   🏪 eBay API: ${overallStats.ebay} (${((overallStats.ebay / overallStats.updated) * 100).toFixed(1)}%)`)
    console.log(`   🍎 Apple Scraper: ${overallStats.appleScraper} (${((overallStats.appleScraper / overallStats.updated) * 100).toFixed(1)}%)`)
    console.log(`   🔧 Brand Scraper: ${overallStats.brandScraper} (${((overallStats.brandScraper / overallStats.updated) * 100).toFixed(1)}%)`)
    console.log(`   📷 Unsplash: ${overallStats.unsplash} (${((overallStats.unsplash / overallStats.updated) * 100).toFixed(1)}%)`)
    console.log(`\n❌ Errors: ${overallStats.errors}`)

    const realImagePercent = ((overallStats.ebay + overallStats.appleScraper + overallStats.brandScraper) / overallStats.updated) * 100
    console.log(`\n✨ Real product images: ${realImagePercent.toFixed(1)}%`)

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { updateProductImages }
