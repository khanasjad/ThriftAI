import { prisma } from '../src/lib/prisma'

async function checkScoringProgress() {
  console.log('\n📊 Scoring Progress Report')
  console.log('=' .repeat(50))
  console.log()

  // Get total products
  const totalProducts = await prisma.product.count({
    where: { isAvailable: true }
  })

  // Get scored products
  const scoredProducts = await prisma.product.count({
    where: {
      isAvailable: true,
      aiScore: { not: null },
      lastScoredAt: { not: null }
    }
  })

  // Get recently scored (last 10 minutes)
  const recentlyScored = await prisma.product.count({
    where: {
      isAvailable: true,
      lastScoredAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000)
      }
    }
  })

  // Get products with new specs
  const withSpecs = await prisma.product.count({
    where: {
      isAvailable: true,
      dynamicSpecs: { not: null }
    }
  })

  // Get average score
  const avgScore = await prisma.product.aggregate({
    where: {
      isAvailable: true,
      aiScore: { not: null }
    },
    _avg: {
      aiScore: true
    }
  })

  // Get score distribution
  const excellent = await prisma.product.count({
    where: { isAvailable: true, aiScore: { gte: 80 } }
  })

  const good = await prisma.product.count({
    where: { isAvailable: true, aiScore: { gte: 65, lt: 80 } }
  })

  const fair = await prisma.product.count({
    where: { isAvailable: true, aiScore: { gte: 50, lt: 65 } }
  })

  const poor = await prisma.product.count({
    where: { isAvailable: true, aiScore: { lt: 50, gte: 35 } }
  })

  const veryPoor = await prisma.product.count({
    where: { isAvailable: true, aiScore: { lt: 35 } }
  })

  // Calculate progress
  const progress = ((scoredProducts / totalProducts) * 100).toFixed(2)
  const remaining = totalProducts - scoredProducts

  console.log(`📦 Total Products:        ${totalProducts.toLocaleString()}`)
  console.log(`✅ Scored Products:       ${scoredProducts.toLocaleString()}`)
  console.log(`⏳ Remaining:             ${remaining.toLocaleString()}`)
  console.log(`📈 Progress:              ${progress}%`)
  console.log()
  console.log(`🆕 Recently Scored (10m): ${recentlyScored.toLocaleString()}`)
  console.log(`📋 Products with Specs:   ${withSpecs.toLocaleString()}`)
  console.log()
  console.log(`📊 Average AI Score:      ${avgScore._avg.aiScore?.toFixed(2) || 'N/A'}/100`)
  console.log()
  console.log('🎯 Score Distribution:')
  console.log(`   🌟 Excellent (80-100): ${excellent.toLocaleString()} products`)
  console.log(`   👍 Good (65-79):       ${good.toLocaleString()} products`)
  console.log(`   😐 Fair (50-64):       ${fair.toLocaleString()} products`)
  console.log(`   👎 Poor (35-49):       ${poor.toLocaleString()} products`)
  console.log(`   ❌ Very Poor (0-34):   ${veryPoor.toLocaleString()} products`)
  console.log()

  // Estimate completion time based on recent scoring rate
  if (recentlyScored > 0 && remaining > 0) {
    const scoringRate = recentlyScored / 10 // products per minute
    const minutesRemaining = remaining / scoringRate
    const hoursRemaining = (minutesRemaining / 60).toFixed(1)

    console.log(`⏱️  Estimated Time Remaining: ${hoursRemaining} hours`)
    console.log(`   (Based on current rate: ${scoringRate.toFixed(1)} products/min)`)
    console.log()
  }

  // Get sample of recently scored products
  const recentProducts = await prisma.product.findMany({
    where: {
      isAvailable: true,
      lastScoredAt: { not: null }
    },
    select: {
      name: true,
      category: true,
      aiScore: true,
      lastScoredAt: true
    },
    orderBy: {
      lastScoredAt: 'desc'
    },
    take: 5
  })

  if (recentProducts.length > 0) {
    console.log('🔄 Recently Scored Products:')
    recentProducts.forEach((p, i) => {
      const timeAgo = p.lastScoredAt
        ? Math.round((Date.now() - p.lastScoredAt.getTime()) / 1000 / 60)
        : 0
      console.log(`   ${i + 1}. ${p.name.substring(0, 40)} - ${p.aiScore?.toFixed(2)}/100 (${timeAgo}m ago)`)
    })
    console.log()
  }

  await prisma.$disconnect()
}

checkScoringProgress().catch(console.error)
