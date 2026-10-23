#!/usr/bin/env tsx
/**
 * Check Qdrant Status and Statistics
 *
 * Displays the current status of the Qdrant vector database and
 * indexing statistics for the B2B platform.
 *
 * Usage:
 *   npx tsx scripts/b2b/check-qdrant-status.ts
 */

import { qdrantClient } from '../../src/lib/vector/qdrant/QdrantClient'
import { b2bVectorSearchService } from '../../src/lib/services/b2bVectorSearch'
import { PRODUCTS_COLLECTION_CONFIG } from '../../src/lib/vector/qdrant/config'

async function main() {
  console.log('\n🔍 Checking Qdrant Status for Veritas B2B Platform...\n')
  console.log('━'.repeat(60))

  try {
    // Step 1: Health check
    console.log('\n📊 QDRANT HEALTH')
    console.log('━'.repeat(60))

    const health = await qdrantClient.healthCheck()

    if (health.status === 'ok') {
      console.log('\n✅ Status: Healthy')
      console.log(`   Version: ${health.version}`)
      console.log(`   Total collections: ${health.collections}`)
    } else {
      console.log('\n❌ Status: Unhealthy')
      console.log('   Please check Qdrant connection settings')
    }

    // Step 2: Collection info
    console.log('\n\n📦 COLLECTION INFORMATION')
    console.log('━'.repeat(60))

    const collectionName = PRODUCTS_COLLECTION_CONFIG.name

    try {
      const info = await qdrantClient.getCollectionInfo(collectionName)

      console.log(`\n   Name: ${info.name}`)
      console.log(`   Status: ${getStatusEmoji(info.status)} ${info.status}`)
      console.log(`   Total vectors: ${info.vectorCount.toLocaleString()}`)
      console.log(`   Indexed vectors: ${info.indexedVectorCount.toLocaleString()}`)
      console.log(`   Points: ${info.pointsCount.toLocaleString()}`)
      console.log(`   Segments: ${info.segmentsCount}`)
      console.log(`   Vector size: ${info.config.params.vectorSize}`)
      console.log(`   Distance metric: ${info.config.params.distance}`)

      // Calculate indexing progress
      const progress = info.vectorCount > 0
        ? ((info.indexedVectorCount / info.vectorCount) * 100).toFixed(1)
        : '0.0'

      console.log(`\n   Indexing progress: ${progress}%`)

      if (info.indexedVectorCount < info.vectorCount) {
        console.log(`   ⚠️  ${(info.vectorCount - info.indexedVectorCount).toLocaleString()} vectors pending indexing`)
      } else {
        console.log('   ✅ All vectors indexed')
      }

    } catch (error) {
      console.log('\n   ⚠️  Collection not found')
      console.log('   Run: npx tsx scripts/b2b/init-qdrant.ts')
    }

    // Step 3: Service statistics
    console.log('\n\n📈 SERVICE STATISTICS')
    console.log('━'.repeat(60))

    try {
      const stats = await b2bVectorSearchService.getStatistics()

      console.log(`\n   Vector count: ${stats.vectorCount.toLocaleString()}`)
      console.log(`   Indexed count: ${stats.indexedVectorCount.toLocaleString()}`)
      console.log(`   Service status: ${stats.status}`)

    } catch (error) {
      console.log('\n   ⚠️  Unable to fetch service statistics')
    }

    // Step 4: Connection info
    console.log('\n\n🔗 CONNECTION INFORMATION')
    console.log('━'.repeat(60))

    console.log(`\n   URL: ${process.env.QDRANT_URL || 'http://localhost:6333'}`)
    console.log(`   API Key: ${process.env.QDRANT_API_KEY ? '✅ Configured' : '⚠️  Not configured'}`)
    console.log(`   Collection: ${collectionName}`)

    console.log('\n━'.repeat(60))
    console.log('\n✨ Status check complete!\n')

  } catch (error) {
    console.error('\n❌ Status check failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    process.exit(1)
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'green':
      return '🟢'
    case 'yellow':
      return '🟡'
    case 'red':
      return '🔴'
    default:
      return '⚪'
  }
}

main()
