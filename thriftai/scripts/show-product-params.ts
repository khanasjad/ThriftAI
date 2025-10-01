import { prisma } from '../src/lib/prisma'

async function showProductParameters() {
  try {
    // Find the Puma Elite product
    const product = await prisma.product.findFirst({
      where: {
        name: { contains: 'Puma Elite', mode: 'insensitive' },
        category: 'BASKETBALL_SHOES'
      },
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        price: true,
        originalPrice: true,
        condition: true,
        aiScore: true,
        aiConfidence: true,
        aiScoreBreakdown: true,
        globalRank: true,
        categoryRank: true,
        dynamicSpecs: true,
        companyMetrics: true,
        isAvailable: true,
        hasFreeShipping: true,
        stockQuantity: true
      }
    })

    if (!product) {
      console.log('Product not found!')
      return
    }

    console.log('\n' + '='.repeat(80))
    console.log('PRODUCT DETAILS')
    console.log('='.repeat(80))
    console.log(`Name: ${product.name}`)
    console.log(`Brand: ${product.brand}`)
    console.log(`Category: ${product.category}`)
    console.log(`Condition: ${product.condition}`)
    console.log(`Price: $${product.price} (Original: $${product.originalPrice})`)
    console.log(`AI Score: ${product.aiScore}/100 (${(product.aiConfidence || 0) * 100}% confidence)`)
    console.log(`Global Rank: ${product.globalRank || 'N/A'}`)
    console.log(`Category Rank: ${product.categoryRank || 'N/A'}`)
    console.log(`Available: ${product.isAvailable ? 'Yes' : 'No'}`)
    console.log(`Free Shipping: ${product.hasFreeShipping ? 'Yes' : 'No'}`)
    console.log(`Stock: ${product.stockQuantity}`)

    console.log('\n' + '='.repeat(80))
    console.log('96-PARAMETER AI SCORING BREAKDOWN')
    console.log('='.repeat(80))

    if (!product.aiScoreBreakdown) {
      console.log('No AI score breakdown available')
      return
    }

    const breakdown = product.aiScoreBreakdown as any

    // Category 1: Urgency (10 parameters)
    console.log('\n📊 CATEGORY 1: URGENCY (Weight: 15%)')
    console.log('─'.repeat(80))
    console.log(`Overall Score: ${breakdown.urgency?.score || 0}/100`)
    console.log('\nParameters:')
    console.log(`  1. Stock Level: ${breakdown.urgency?.stockLevel || 0}`)
    console.log(`  2. Views (Last 24h): ${breakdown.urgency?.viewsLast24h || 0}`)
    console.log(`  3. Sales (Last 7 Days): ${breakdown.urgency?.salesLast7Days || 0}`)
    console.log(`  4. Scarcity Multiplier: ${breakdown.urgency?.scarcityMultiplier || 0}`)
    console.log(`  5. Cart Additions (Last 24h): ${breakdown.urgency?.cartAdditionsLast24h || 0}`)

    // Category 2: Emotional Appeal (5 parameters)
    console.log('\n💝 CATEGORY 2: EMOTIONAL APPEAL (Weight: 10%)')
    console.log('─'.repeat(80))
    console.log(`Overall Score: ${breakdown.emotional?.score || 0}/100`)
    console.log('\nParameters:')
    console.log(`  6. Sustainability: ${breakdown.emotional?.sustainability || false}`)
    console.log(`  7. Brand Recognition: ${breakdown.emotional?.brandRecognition || 0}`)
    console.log(`  8. Emotional Appeal Score: ${breakdown.emotional?.emotionalAppealScore || 0}`)
    console.log(`  9. Made in Preferred Country: ${breakdown.emotional?.madeInPreferredCountry || false}`)

    // Category 3: Relevance (5 parameters)
    console.log('\n🎯 CATEGORY 3: RELEVANCE (Weight: 12%)')
    console.log('─'.repeat(80))
    console.log(`Overall Score: ${breakdown.relevance?.score || 0}/100`)
    console.log('\nParameters:')
    console.log(`  10. Bounce Rate: ${breakdown.relevance?.bounceRate || 0}`)
    console.log(`  11. Conversion Rate: ${breakdown.relevance?.conversionRate || 0}`)
    console.log(`  12. Query Match Score: ${breakdown.relevance?.queryMatchScore || 0}`)
    console.log(`  13. Click-Through Rate: ${breakdown.relevance?.clickThroughRate || 0}`)

    // Category 4: Price & Value (8 parameters)
    console.log('\n💰 CATEGORY 4: PRICE & VALUE (Weight: 18%)')
    console.log('─'.repeat(80))
    console.log(`Overall Score: ${breakdown.priceValue?.score || 0}/100`)
    console.log('\nParameters:')
    console.log(`  14. Current Price: $${breakdown.priceValue?.currentPrice || 0}`)
    console.log(`  15. Charm Pricing Bonus: ${breakdown.priceValue?.charmPricingBonus || 0}`)
    console.log(`  16. Free Shipping Bonus: ${breakdown.priceValue?.freeShippingBonus || 0}`)
    console.log(`  17. Discount Percentage: ${breakdown.priceValue?.discountPercentage || 0}%`)
    console.log(`  18. Market Average Price: $${breakdown.priceValue?.marketAveragePrice || 0}`)
    console.log(`  19. Price Competitiveness: ${breakdown.priceValue?.priceCompetitiveness || 0}`)

    // Category 5: Trust Score (8 parameters)
    console.log('\n🛡️ CATEGORY 5: TRUST SCORE (Weight: 15%)')
    console.log('─'.repeat(80))
    console.log(`Overall Score: ${breakdown.trustScore?.score || 0}/100`)
    console.log('\nParameters:')
    console.log(`  20. Account Age: ${breakdown.trustScore?.accountAge || 0} days`)
    console.log(`  21. Total Sales: ${breakdown.trustScore?.totalSales || 0}`)
    console.log(`  22. Free Returns: ${breakdown.trustScore?.freeReturns || false}`)
    console.log(`  23. Seller Rating: ${breakdown.trustScore?.sellerRating || 0}/5`)
    console.log(`  24. Return Period Days: ${breakdown.trustScore?.returnPeriodDays || 0}`)
    console.log(`  25. Response Time (Hours): ${breakdown.trustScore?.responseTimeHours || 0}`)
    console.log(`  26. Verification Status: ${breakdown.trustScore?.verificationStatus || false}`)

    // Category 6: Company Risk (25 parameters from companyMetrics)
    console.log('\n⚠️ CATEGORY 6: COMPANY RISK (Weight: 5%)')
    console.log('─'.repeat(80))
    console.log(`Overall Score: ${breakdown.companyRisk?.score || 0}/100`)
    if (breakdown.companyRisk?.metrics || product.companyMetrics) {
      const metrics = breakdown.companyRisk?.metrics || product.companyMetrics as any
      console.log('\nCompany Metrics (25 parameters):')
      console.log(`  27. ESG Score: ${metrics.esgScore || 0}`)
      console.log(`  28. Fair Labor: ${metrics.fairLabor || 0}`)
      console.log(`  29. Waste Diversion: ${metrics.wasteDiversion || 0}%`)
      console.log(`  30. Carbon Footprint: ${metrics.carbonFootprint || 0} tons`)
      console.log(`  31. Circular Economy: ${metrics.circularEconomy || 0}`)
      console.log(`  32. Legal Violations: ${metrics.legalViolations || 0}`)
      console.log(`  33. Renewable Energy: ${metrics.renewableEnergy || 0}%`)
      console.log(`  34. Water Efficiency: ${metrics.waterEfficiency || 0}`)
      console.log(`  35. Product Recall Rate: ${metrics.productRecallRate || 0}%`)
      console.log(`  36. Diversity & Inclusion: ${metrics.diversityInclusion || 0}`)
      console.log(`  37. Community Investment: ${metrics.communityInvestment || 0}%`)
      console.log(`  38. Supplier Sustainability: ${metrics.supplierSustainability || 0}`)
      console.log(`  39-51. [Other company risk metrics...]`)
    }

    // Category 7: Convenience (6 parameters)
    console.log('\n🚚 CATEGORY 7: CONVENIENCE (Weight: 10%)')
    console.log('─'.repeat(80))
    console.log(`Overall Score: ${breakdown.convenience?.score || 0}/100`)
    console.log('\nParameters:')
    console.log(`  52. In Stock: ${breakdown.convenience?.inStock || false}`)
    console.log(`  53. Has Tracking: ${breakdown.convenience?.hasTracking || false}`)
    console.log(`  54. Shipping Cost: $${breakdown.convenience?.shippingCost || 0}`)
    console.log(`  55. Has Fast Shipping: ${breakdown.convenience?.hasFastShipping || false}`)
    console.log(`  56. Has Free Shipping: ${breakdown.convenience?.hasFreeShipping || false}`)
    console.log(`  57. Estimated Delivery Days: ${breakdown.convenience?.estimatedDeliveryDays || 0}`)

    // Category 8: Social Proof (7 parameters)
    console.log('\n⭐ CATEGORY 8: SOCIAL PROOF (Weight: 8%)')
    console.log('─'.repeat(80))
    console.log(`Overall Score: ${breakdown.socialProof?.score || 0}/100`)
    console.log('\nParameters:')
    console.log(`  58. Rating: ${breakdown.socialProof?.rating || 0}/5`)
    console.log(`  59. Review Count: ${breakdown.socialProof?.reviewCount || 0}`)
    console.log(`  60. Review Sentiment: ${breakdown.socialProof?.reviewSentiment || 0}`)
    console.log(`  61. Recent Review Count: ${breakdown.socialProof?.recentReviewCount || 0}`)
    console.log(`  62. Social Media Mentions: ${breakdown.socialProof?.socialMediaMentions || 0}`)
    console.log(`  63. Verified Purchase Ratio: ${breakdown.socialProof?.verifiedPurchaseRatio || 0}%`)

    // Category 9: Quality Score (5 parameters)
    console.log('\n✨ CATEGORY 9: QUALITY SCORE (Weight: 7%)')
    console.log('─'.repeat(80))
    console.log(`Overall Score: ${breakdown.qualityScore?.score || 0}/100`)
    console.log('\nParameters:')
    console.log(`  64. Condition: ${breakdown.qualityScore?.condition || product.condition}`)
    console.log(`  65. Has Warranty: ${breakdown.qualityScore?.hasWarranty || false}`)
    console.log(`  66. Is Authentic: ${breakdown.qualityScore?.isAuthentic || false}`)
    console.log(`  67. Brand Premium: ${breakdown.qualityScore?.brandPremium || 0}`)
    console.log(`  68. Certification Count: ${breakdown.qualityScore?.certificationCount || 0}`)

    // Category 10: Dynamic Product Specs (25 parameters - product-specific)
    console.log('\n🔧 CATEGORY 10: DYNAMIC PRODUCT SPECS (Weight: Variable)')
    console.log('─'.repeat(80))
    console.log(`Overall Score: ${breakdown.dynamicProductSpecs?.score || 0}/100`)
    if (breakdown.dynamicProductSpecs?.specs || product.dynamicSpecs) {
      const specs = breakdown.dynamicProductSpecs?.specs || product.dynamicSpecs as any
      console.log('\nProduct-Specific Specs (Up to 25 parameters):')
      let paramNum = 69
      for (const [key, value] of Object.entries(specs)) {
        console.log(`  ${paramNum}. ${key}: ${value}`)
        paramNum++
      }
    }

    // Additional AI Scoring Categories
    console.log('\n' + '='.repeat(80))
    console.log('SUMMARY OF ALL 96 PARAMETERS')
    console.log('='.repeat(80))
    console.log('\n1. Urgency & Scarcity (5 params): Stock level, views, sales, scarcity, cart adds')
    console.log('2. Emotional Appeal (4 params): Sustainability, brand, appeal, origin')
    console.log('3. Relevance (4 params): Bounce rate, conversion, query match, CTR')
    console.log('4. Price & Value (6 params): Price, charm pricing, shipping, discount, market avg, competitiveness')
    console.log('5. Trust Score (7 params): Account age, sales, returns, rating, return period, response time, verification')
    console.log('6. Company Risk (25 params): ESG, labor, waste, carbon, circular economy, violations, energy, water, recalls, diversity, investment, sustainability, etc.')
    console.log('7. Convenience (6 params): Stock, tracking, shipping cost, fast shipping, free shipping, delivery time')
    console.log('8. Social Proof (6 params): Rating, reviews, sentiment, recent reviews, social mentions, verified ratio')
    console.log('9. Quality Score (5 params): Condition, warranty, authenticity, brand premium, certifications')
    console.log('10. Dynamic Specs (25+ params): Product-specific attributes like size, color, material, performance metrics')
    console.log('11. Company Growth (3 params): Revenue growth, market share, innovation')
    console.log('12. Company Sustainability (3 params): Environmental initiatives, social responsibility')
    console.log('13. Company Financial Health (3 params): Profitability, debt ratio, cash flow')
    console.log('14. Company Social Responsibility (3 params): Community programs, ethical sourcing, employee welfare')

    console.log('\n' + '='.repeat(80))
    console.log(`TOTAL PARAMETERS USED: ${breakdown.parametersUsed || 0}/96`)
    console.log(`MISSING PARAMETERS: ${breakdown.missingParameters?.length || 0}`)
    console.log('='.repeat(80))

    if (breakdown.missingParameters && breakdown.missingParameters.length > 0) {
      console.log('\nMissing Parameters (data not available):')
      breakdown.missingParameters.forEach((param: string, i: number) => {
        console.log(`  ${i + 1}. ${param}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showProductParameters()
