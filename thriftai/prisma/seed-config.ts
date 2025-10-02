/**
 * Configuration System Seed Data
 * Seeds all configuration tables with default values from hardcoded constants
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedScoringConfigurations() {
  console.log('🔧 Seeding scoring configurations...')

  const configs = [
    {
      category: 'ELECTRONICS',
      productQualityWeight: 0.35,
      valuePropositionWeight: 0.25,
      trustAndSafetyWeight: 0.25,
      userExperienceWeight: 0.10,
      sustainabilityWeight: 0.05,
      description: 'Quality and trust critical for expensive electronics'
    },
    {
      category: 'CLOTHING',
      productQualityWeight: 0.20,
      valuePropositionWeight: 0.35,
      trustAndSafetyWeight: 0.15,
      userExperienceWeight: 0.20,
      sustainabilityWeight: 0.10,
      description: 'Price-sensitive category, fit and returns matter'
    },
    {
      category: 'SHOES',
      productQualityWeight: 0.30,
      valuePropositionWeight: 0.25,
      trustAndSafetyWeight: 0.20,
      userExperienceWeight: 0.15,
      sustainabilityWeight: 0.10,
      description: 'Balanced scoring for footwear'
    },
    {
      category: 'ACCESSORIES',
      productQualityWeight: 0.25,
      valuePropositionWeight: 0.30,
      trustAndSafetyWeight: 0.20,
      userExperienceWeight: 0.15,
      sustainabilityWeight: 0.10,
      description: 'Value-focused accessory scoring'
    },
    {
      category: 'HOME',
      productQualityWeight: 0.35,
      valuePropositionWeight: 0.20,
      trustAndSafetyWeight: 0.25,
      userExperienceWeight: 0.10,
      sustainabilityWeight: 0.10,
      description: 'Safety and durability paramount for home goods'
    },
    {
      category: 'SPORTS',
      productQualityWeight: 0.30,
      valuePropositionWeight: 0.25,
      trustAndSafetyWeight: 0.20,
      userExperienceWeight: 0.15,
      sustainabilityWeight: 0.10,
      description: 'Performance-focused sports equipment scoring'
    },
    {
      category: 'DEFAULT',
      productQualityWeight: 0.30,
      valuePropositionWeight: 0.25,
      trustAndSafetyWeight: 0.20,
      userExperienceWeight: 0.15,
      sustainabilityWeight: 0.10,
      description: 'Universal balanced scoring weights'
    }
  ]

  for (const config of configs) {
    await prisma.scoringConfiguration.upsert({
      where: { category: config.category },
      update: config,
      create: config
    })
  }

  console.log(`✅ Seeded ${configs.length} scoring configurations`)
}

async function seedScoreThresholds() {
  console.log('🎨 Seeding score thresholds...')

  const thresholds = [
    {
      name: 'excellent',
      minScore: 80,
      maxScore: 100,
      badgeColor: '#10b981',
      badgeClass: 'bg-green-600',
      label: 'Excellent',
      description: 'Outstanding product quality and value',
      displayOrder: 1
    },
    {
      name: 'good',
      minScore: 70,
      maxScore: 79.99,
      badgeColor: '#3b82f6',
      badgeClass: 'bg-blue-600',
      label: 'Good',
      description: 'Above average quality and value',
      displayOrder: 2
    },
    {
      name: 'fair',
      minScore: 60,
      maxScore: 69.99,
      badgeColor: '#f59e0b',
      badgeClass: 'bg-yellow-600',
      label: 'Fair',
      description: 'Acceptable quality, consider alternatives',
      displayOrder: 3
    },
    {
      name: 'poor',
      minScore: 0,
      maxScore: 59.99,
      badgeColor: '#ef4444',
      badgeClass: 'bg-gray-600',
      label: 'Poor',
      description: 'Below average, not recommended',
      displayOrder: 4
    }
  ]

  for (const threshold of thresholds) {
    await prisma.scoreThreshold.upsert({
      where: { name: threshold.name },
      update: threshold,
      create: threshold
    })
  }

  console.log(`✅ Seeded ${thresholds.length} score thresholds`)
}

async function seedSystemConfigurations() {
  console.log('⚙️  Seeding system configurations...')

  const configs = [
    {
      key: 'batch_size_default',
      value: '50',
      valueType: 'NUMBER' as const,
      category: 'performance',
      description: 'Default batch size for product processing'
    },
    {
      key: 'batch_size_rescore',
      value: '20',
      valueType: 'NUMBER' as const,
      category: 'performance',
      description: 'Batch size for product re-scoring'
    },
    {
      key: 'enrichment_concurrency',
      value: '10',
      valueType: 'NUMBER' as const,
      category: 'performance',
      description: 'Concurrent enrichment operations limit'
    },
    {
      key: 'cache_ttl_company_metrics',
      value: '3600',
      valueType: 'NUMBER' as const,
      category: 'caching',
      description: 'Company metrics cache TTL in seconds (1 hour)'
    },
    {
      key: 'cache_ttl_config',
      value: '300',
      valueType: 'NUMBER' as const,
      category: 'caching',
      description: 'Configuration cache TTL in seconds (5 minutes)'
    }
  ]

  for (const config of configs) {
    await prisma.systemConfiguration.upsert({
      where: { key: config.key },
      update: config,
      create: config
    })
  }

  console.log(`✅ Seeded ${configs.length} system configurations`)
}

async function seedCategoryDefaultSpecs() {
  console.log('📋 Seeding category default specs...')

  // Electronics defaults
  const electronicsSpecs = [
    {
      category: 'ELECTRONICS',
      subcategory: null,
      priority: 0,
      defaultSpecs: {
        cpu: 'Standard Processor',
        cpuBenchmark: 10000,
        ram: 4,
        storage: '128GB',
        screenSize: 6,
        screenResolution: '1920x1080',
        batteryCapacity: 3000,
        batteryLife: 8,
        connectivity: ['WiFi', 'Bluetooth'],
        os: 'Various',
        gpu: 'Integrated'
      }
    },
    {
      category: 'ELECTRONICS',
      subcategory: 'LAPTOP',
      priority: 10,
      defaultSpecs: {
        cpu: 'Intel Core i5 / AMD Ryzen 5',
        cpuBenchmark: 12000,
        ram: 8,
        storage: '256GB SSD',
        screenSize: 14,
        screenResolution: '1920x1080',
        batteryLife: 6,
        gpu: 'Integrated Graphics',
        connectivity: ['WiFi', 'Bluetooth', 'USB-C'],
        os: 'Windows/MacOS/Linux'
      }
    }
  ]

  // Clothing defaults
  const clothingSpecs = [
    {
      category: 'CLOTHING',
      subcategory: null,
      priority: 0,
      defaultSpecs: {
        fabric: 'Cotton Blend',
        fabricQuality: 70,
        sizeAccuracy: 'True to Size',
        careInstructions: 'Machine Wash Cold',
        colorFastness: 80,
        stitchingQuality: 75,
        breathability: 70,
        durability: 75
      }
    }
  ]

  const allSpecs = [...electronicsSpecs, ...clothingSpecs]

  for (const spec of allSpecs) {
    await prisma.categoryDefaultSpec.upsert({
      where: {
        category_subcategory: {
          category: spec.category,
          subcategory: spec.subcategory || ''
        }
      },
      update: spec,
      create: spec
    })
  }

  console.log(`✅ Seeded ${allSpecs.length} category default specs`)
}

async function main() {
  console.log('🌱 Starting configuration seed...\n')

  await seedScoringConfigurations()
  await seedScoreThresholds()
  await seedSystemConfigurations()
  await seedCategoryDefaultSpecs()

  console.log('\n✅ Configuration seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
