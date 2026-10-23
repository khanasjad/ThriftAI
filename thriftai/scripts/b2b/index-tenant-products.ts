#!/usr/bin/env tsx
/**
 * Index Tenant Products in Qdrant
 *
 * Generates embeddings and indexes existing products for a B2B tenant.
 * Useful for backfilling existing catalogs or re-indexing after schema changes.
 *
 * Usage:
 *   npx tsx scripts/b2b/index-tenant-products.ts <tenantId> [limit]
 *
 * Examples:
 *   # Index all products for a tenant
 *   npx tsx scripts/b2b/index-tenant-products.ts cm3abc123
 *
 *   # Index first 100 products for testing
 *   npx tsx scripts/b2b/index-tenant-products.ts cm3abc123 100
 */

import { PrismaClient } from '@prisma/client'
import { b2bVectorSearchService } from '../../src/lib/services/b2bVectorSearch'

const prisma = new PrismaClient()

async function main() {
  // Parse arguments
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/b2b/index-tenant-products.ts <tenantId> [limit]')
    console.error('\nExamples:')
    console.error('  npx tsx scripts/b2b/index-tenant-products.ts cm3abc123')
    console.error('  npx tsx scripts/b2b/index-tenant-products.ts cm3abc123 100')
    console.error('\nFind tenant IDs:')
    console.error('  npx tsx scripts/b2b/list-tenants.ts')
    process.exit(1)
  }

  const [tenantId, limitStr] = args
  const limit = limitStr ? parseInt(limitStr, 10) : undefined

  try {
    // Step 1: Verify tenant exists
    console.log(`\n🔍 Looking up tenant: ${tenantId}...\n`)

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!tenant) {
      console.error(`❌ Tenant not found: ${tenantId}`)
      console.log('\nList available tenants:')
      console.log('  npx tsx scripts/b2b/list-tenants.ts')
      process.exit(1)
    }

    console.log(`✅ Found tenant: ${tenant.name}`)
    console.log(`   Total products: ${tenant._count.products.toLocaleString()}`)
    console.log(`   Plan: ${tenant.plan}`)
    console.log('')

    // Step 2: Get products to index
    const productsToIndex = await prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        isAvailable: true
      },
      select: {
        id: true
      },
      ...(limit ? { take: limit } : {})
    })

    const productCount = productsToIndex.length

    if (productCount === 0) {
      console.log('⚠️  No products found to index')
      process.exit(0)
    }

    console.log(`📦 Found ${productCount.toLocaleString()} products to index`)
    console.log('━'.repeat(60))
    console.log('')

    // Confirm with user
    if (!process.env.SKIP_CONFIRMATION) {
      console.log('⚠️  This will:')
      console.log(`  1. Generate OpenAI embeddings for ${productCount.toLocaleString()} products`)
      console.log(`  2. Store vectors in Qdrant`)
      console.log(`  3. Cost approximately $${(productCount * 0.13 / 1000000 * 500).toFixed(4)} USD`)
      console.log('')
      console.log('Press Ctrl+C to cancel, or set SKIP_CONFIRMATION=true to skip this prompt')
      console.log('')

      // Wait 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    // Step 3: Index products
    console.log('🚀 Starting product indexing...\n')

    const startTime = Date.now()

    const result = await b2bVectorSearchService.batchIndexProducts({
      tenantId: tenant.id,
      productIds: productsToIndex.map(p => p.id),
      forceReindex: true
    })

    const duration = Date.now() - startTime

    // Step 4: Display results
    console.log('\n━'.repeat(60))
    console.log('📊 INDEXING RESULTS')
    console.log('━'.repeat(60))
    console.log('')
    console.log(`✅ Successfully indexed: ${result.successful.toLocaleString()}`)
    console.log(`❌ Failed: ${result.failed.toLocaleString()}`)
    console.log(`⏱️  Processing time: ${(duration / 1000).toFixed(2)}s`)
    console.log(`🚀 Average: ${(duration / result.total).toFixed(0)}ms per product`)
    console.log('')

    if (result.failed > 0 && result.errors.length > 0) {
      console.log('⚠️  Errors (showing first 5):')
      result.errors.slice(0, 5).forEach(error => {
        console.log(`   ${error.productId}: ${error.error}`)
      })
      console.log('')
    }

    // Step 5: Verify indexing
    console.log('🔍 Verifying Qdrant collection...\n')

    const stats = await b2bVectorSearchService.getStatistics()

    console.log('📈 Collection Statistics:')
    console.log(`   Total vectors: ${stats.vectorCount.toLocaleString()}`)
    console.log(`   Indexed vectors: ${stats.indexedVectorCount.toLocaleString()}`)
    console.log(`   Status: ${stats.status}`)
    console.log('')

    console.log('✨ Indexing complete!\n')

    if (result.successful > 0) {
      console.log('Next steps:')
      console.log('  1. Test vector search:')
      console.log(`     curl -X POST http://localhost:3000/api/v1/search \\`)
      console.log(`       -H "x-api-key: ${tenant.apiKey}" \\`)
      console.log(`       -H "Content-Type: application/json" \\`)
      console.log(`       -d '{"query": "test", "searchMode": "vector", "limit": 10}'`)
      console.log('')
    }

  } catch (error) {
    console.error('\n❌ Indexing failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
