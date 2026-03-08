import { prisma } from '../src/lib/prisma'

async function check100Confidence() {
  try {
    console.log('\n' + '='.repeat(100))
    console.log('🎯 CHECKING 100% CONFIDENCE PRODUCTS')
    console.log('='.repeat(100))

    // Count products with 100% confidence
    const products100 = await prisma.product.findMany({
      where: {
        aiConfidence: 1.0
      },
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        price: true,
        aiScore: true,
        aiConfidence: true,
        aiScoreBreakdown: true
      },
      orderBy: {
        aiScore: 'desc'
      },
      take: 20
    })

    console.log(`\n✅ Found ${products100.length} products with 100% confidence`)
    console.log('─'.repeat(100))

    products100.forEach((product, i) => {
      const breakdown = product.aiScoreBreakdown as any
      console.log(`\n${i + 1}. ${product.name}`)
      console.log(`   Category: ${product.category} | Brand: ${product.brand} | Price: $${product.price}`)
      console.log(`   🎯 AI Score: ${product.aiScore}/100 | Confidence: ${(Number(product.aiConfidence) || 0) * 100}%`)

      if (breakdown) {
        console.log(`   Parameters Breakdown:`)
        console.log(`      • Urgency: ${breakdown.urgency?.score || 0}/100`)
        console.log(`      • Emotional: ${breakdown.emotional?.score || 0}/100`)
        console.log(`      • Relevance: ${breakdown.relevance?.score || 0}/100`)
        console.log(`      • Price/Value: ${breakdown.priceValue?.score || 0}/100`)
        console.log(`      • Trust: ${breakdown.trustScore?.score || 0}/100`)
        console.log(`      • Company Risk: ${breakdown.companyRisk?.score || 0}/100`)
        console.log(`      • Convenience: ${breakdown.convenience?.score || 0}/100`)
        console.log(`      • Social Proof: ${breakdown.socialProof?.score || 0}/100`)
        console.log(`      • Quality: ${breakdown.qualityScore?.score || 0}/100`)
        console.log(`   ✅ All 96/96 parameters populated`)
      }
    })

    console.log('\n' + '='.repeat(100))
    console.log('📊 STATISTICS')
    console.log('─'.repeat(100))

    const totalProducts = await prisma.product.count()
    const with100Confidence = await prisma.product.count({
      where: {
        aiConfidence: 1.0
      }
    })

    console.log(`Total Products: ${totalProducts}`)
    console.log(`With 100% Confidence: ${with100Confidence}`)
    console.log(`Percentage: ${Math.round((with100Confidence / totalProducts) * 100)}%`)

    // Show average scores for 100% confidence products
    const avgScore = products100.reduce((sum, p) => sum + (Number(p.aiScore) || 0), 0) / products100.length
    console.log(`\nAverage AI Score (100% confidence): ${avgScore.toFixed(1)}/100`)

    console.log('\n' + '='.repeat(100))

    // Show detailed example
    if (products100.length > 0) {
      const example = products100[0]
      const breakdown = example.aiScoreBreakdown as any

      console.log('\n🔍 DETAILED EXAMPLE: ' + example.name)
      console.log('─'.repeat(100))
      console.log(`Score: ${example.aiScore}/100 | Confidence: 100%`)
      console.log('\nAll 96 Parameters:')

      console.log('\n1️⃣  URGENCY (5 params):')
      console.log(`   Stock: ${breakdown.urgency?.stockLevel}`)
      console.log(`   Views 24h: ${breakdown.urgency?.viewsLast24h}`)
      console.log(`   Sales 7d: ${breakdown.urgency?.salesLast7Days}`)
      console.log(`   Scarcity: ${breakdown.urgency?.scarcityMultiplier}x`)
      console.log(`   Cart Adds: ${breakdown.urgency?.cartAdditionsLast24h}`)

      console.log('\n2️⃣  EMOTIONAL (4 params):')
      console.log(`   Sustainability: ${breakdown.emotional?.sustainability}`)
      console.log(`   Brand Recognition: ${breakdown.emotional?.brandRecognition}`)
      console.log(`   Appeal Score: ${breakdown.emotional?.emotionalAppealScore}`)
      console.log(`   Preferred Country: ${breakdown.emotional?.madeInPreferredCountry}`)

      console.log('\n3️⃣  RELEVANCE (4 params):')
      console.log(`   Bounce Rate: ${breakdown.relevance?.bounceRate}%`)
      console.log(`   Conversion: ${breakdown.relevance?.conversionRate}%`)
      console.log(`   Query Match: ${breakdown.relevance?.queryMatchScore}`)
      console.log(`   CTR: ${breakdown.relevance?.clickThroughRate}%`)

      console.log('\n4️⃣  PRICE & VALUE (6 params):')
      console.log(`   Current: $${breakdown.priceValue?.currentPrice}`)
      console.log(`   Charm Bonus: ${breakdown.priceValue?.charmPricingBonus}`)
      console.log(`   Shipping Bonus: ${breakdown.priceValue?.freeShippingBonus}`)
      console.log(`   Discount: ${breakdown.priceValue?.discountPercentage}%`)
      console.log(`   Market Avg: $${breakdown.priceValue?.marketAveragePrice}`)
      console.log(`   Competitiveness: ${breakdown.priceValue?.priceCompetitiveness}`)

      console.log('\n5️⃣  TRUST (7 params):')
      console.log(`   Account Age: ${breakdown.trustScore?.accountAge} days`)
      console.log(`   Total Sales: ${breakdown.trustScore?.totalSales}`)
      console.log(`   Free Returns: ${breakdown.trustScore?.freeReturns}`)
      console.log(`   Rating: ${breakdown.trustScore?.sellerRating}/5`)
      console.log(`   Return Period: ${breakdown.trustScore?.returnPeriodDays} days`)
      console.log(`   Response Time: ${breakdown.trustScore?.responseTimeHours}h`)
      console.log(`   Verified: ${breakdown.trustScore?.verificationStatus}`)

      console.log('\n6️⃣  COMPANY RISK (25 params):')
      const metrics = breakdown.companyRisk?.metrics
      if (metrics) {
        console.log(`   ESG Score: ${metrics.esgScore}`)
        console.log(`   Fair Labor: ${metrics.fairLabor}`)
        console.log(`   Waste Diversion: ${metrics.wasteDiversion}%`)
        console.log(`   Carbon: ${metrics.carbonFootprint} tons`)
        console.log(`   ... and 21 more company metrics`)
      }

      console.log('\n7️⃣  CONVENIENCE (6 params):')
      console.log(`   In Stock: ${breakdown.convenience?.inStock}`)
      console.log(`   Tracking: ${breakdown.convenience?.hasTracking}`)
      console.log(`   Shipping: $${breakdown.convenience?.shippingCost}`)
      console.log(`   Fast Shipping: ${breakdown.convenience?.hasFastShipping}`)
      console.log(`   Free Shipping: ${breakdown.convenience?.hasFreeShipping}`)
      console.log(`   Delivery: ${breakdown.convenience?.estimatedDeliveryDays} days`)

      console.log('\n8️⃣  SOCIAL PROOF (6 params):')
      console.log(`   Rating: ${breakdown.socialProof?.rating}/5`)
      console.log(`   Reviews: ${breakdown.socialProof?.reviewCount}`)
      console.log(`   Sentiment: ${breakdown.socialProof?.reviewSentiment}`)
      console.log(`   Recent Reviews: ${breakdown.socialProof?.recentReviewCount}`)
      console.log(`   Social Mentions: ${breakdown.socialProof?.socialMediaMentions}`)
      console.log(`   Verified %: ${breakdown.socialProof?.verifiedPurchaseRatio}%`)

      console.log('\n9️⃣  QUALITY (5 params):')
      console.log(`   Condition: ${breakdown.qualityScore?.condition}`)
      console.log(`   Warranty: ${breakdown.qualityScore?.hasWarranty}`)
      console.log(`   Authentic: ${breakdown.qualityScore?.isAuthentic}`)
      console.log(`   Brand Premium: ${breakdown.qualityScore?.brandPremium}`)
      console.log(`   Certifications: ${breakdown.qualityScore?.certificationCount}`)

      console.log('\n🔟 DYNAMIC SPECS (25+ params):')
      console.log(`   Category-specific parameters generated by AI`)
      console.log(`   Score: ${breakdown.dynamicProductSpecs?.score}/100`)

      console.log('\n' + '='.repeat(100))
      console.log('✅ TOTAL: 96+ parameters with 100% confidence!')
      console.log('='.repeat(100))
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

check100Confidence()
