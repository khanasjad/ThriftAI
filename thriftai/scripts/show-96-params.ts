import { prisma } from '../src/lib/prisma'

async function show96ParameterBreakdown() {
  console.log('\n' + '='.repeat(80))
  console.log('🎯 96-PARAMETER AI SCORING SYSTEM - COMPLETE BREAKDOWN')
  console.log('='.repeat(80) + '\n')

  // Get a product with full details
  const product = await prisma.product.findFirst({
    where: {
      aiScoreBreakdown: { not: null },
      aiScore: { gte: 85 }
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
      stockQuantity: true,
      shippingCost: true,
      hasFreeShipping: true,
      estimatedDeliveryDays: true,
      hasFreeReturns: true,
      companyMetrics: true,
      dynamicSpecs: true
    }
  })

  if (!product) {
    console.log('No product found')
    return
  }

  const breakdown = product.aiScoreBreakdown as any
  const companyMetrics = product.companyMetrics as any

  console.log('📦 PRODUCT DETAILS')
  console.log('-'.repeat(80))
  console.log(`Name: ${product.name}`)
  console.log(`Brand: ${product.brand}`)
  console.log(`Category: ${product.category}`)
  console.log(`Price: $${product.price} (Original: $${product.originalPrice})`)
  console.log(`Condition: ${product.condition}`)
  console.log(`Discount: ${(((product.originalPrice - product.price) / product.originalPrice) * 100).toFixed(1)}%`)
  console.log('')

  console.log('🤖 AI SCORING (96 Parameters)')
  console.log('-'.repeat(80))
  console.log(`Total Score: ${product.aiScore}/100`)
  console.log(`Confidence: ${(product.aiConfidence * 100).toFixed(1)}%`)
  console.log(`Recommendation: ${breakdown.recommendation?.toUpperCase() || 'N/A'}`)
  console.log('')

  console.log('📊 8 CORE COMPONENTS (80 points total):')
  console.log('-'.repeat(80))
  if (breakdown.components) {
    console.log(`1. Relevance Score:        ${breakdown.components.relevance || 0}/10`)
    console.log(`2. Price Value Score:      ${breakdown.components.priceValue || 0}/10`)
    console.log(`3. Trust Score:            ${breakdown.components.trustScore || 0}/10`)
    console.log(`4. Quality Score:          ${breakdown.components.qualityScore || 0}/10`)
    console.log(`5. Social Proof Score:     ${breakdown.components.socialProof || 0}/10`)
    console.log(`6. Convenience Score:      ${breakdown.components.convenience || 0}/10`)
    console.log(`7. Urgency Score:          ${breakdown.components.urgency || 0}/10`)
    console.log(`8. Emotional Appeal Score: ${breakdown.components.emotional || 0}/10`)
  }
  console.log('')

  console.log('📦 SHIPPING & LOGISTICS:')
  console.log('-'.repeat(80))
  console.log(`Stock Quantity: ${product.stockQuantity}`)
  console.log(`Shipping Cost: $${product.shippingCost}`)
  console.log(`Free Shipping: ${product.hasFreeShipping ? 'Yes ✅' : 'No ❌'}`)
  console.log(`Delivery Time: ${product.estimatedDeliveryDays} days`)
  console.log(`Free Returns: ${product.hasFreeReturns ? 'Yes ✅' : 'No ❌'}`)
  console.log('')

  if (companyMetrics) {
    console.log('🌍 COMPANY ESG METRICS (25 parameters):')
    console.log('-'.repeat(80))
    console.log(`ESG Score: ${companyMetrics.esgScore?.toFixed(1) || 'N/A'}/100`)
    console.log(`Carbon Footprint: ${companyMetrics.carbonFootprint?.toFixed(1) || 'N/A'}`)
    console.log(`Sustainability Rating: ${companyMetrics.sustainabilityRating?.toFixed(1) || 'N/A'}/5`)
    console.log(`Labor Practices: ${companyMetrics.laborPractices?.toFixed(1) || 'N/A'}/100`)
    console.log(`Supply Chain Transparency: ${companyMetrics.supplyChainTransparency?.toFixed(1) || 'N/A'}/100`)
    console.log('')
  }

  if (breakdown.insights && breakdown.insights.length > 0) {
    console.log('💡 AI INSIGHTS:')
    console.log('-'.repeat(80))
    breakdown.insights.forEach((insight: string, i: number) => {
      console.log(`${i + 1}. ${insight}`)
    })
    console.log('')
  }

  console.log('='.repeat(80))
  console.log('📋 PARAMETER CATEGORIES BREAKDOWN (96 Total Parameters)')
  console.log('='.repeat(80))
  console.log(`
1️⃣  SEARCH RELEVANCE (8 params)
   • Search query matching
   • Category relevance
   • Title/description matching
   • Click-through rate
   • Conversion rate
   • Bounce rate
   • Search result position
   • Keyword density

2️⃣  PRICE & VALUE (12 params)
   • Current price
   • Original price
   • Discount percentage
   • Price vs market average
   • Price tier
   • Value for money score
   • Price trend
   • Competitor pricing
   • Bundle deals
   • Volume discounts
   • Payment options
   • Price stability

3️⃣  SELLER TRUST (8 params)
   • Seller rating
   • Total sales
   • Response time
   • Verification status
   • Years in business
   • Return rate
   • Dispute resolution
   • Seller badges

4️⃣  PRODUCT QUALITY (10 params)
   • Product condition
   • Warranty status
   • Authenticity verification
   • Certifications
   • Quality grade
   • Defect rate
   • Manufacturing date
   • Brand reputation
   • Material quality
   • Durability rating

5️⃣  SOCIAL PROOF (9 params)
   • Overall rating
   • Review count
   • Recent reviews
   • Verified purchases ratio
   • Review sentiment
   • Photo reviews
   • Video reviews
   • Expert reviews
   • Influencer mentions

6️⃣  SHIPPING & LOGISTICS (10 params)
   • Shipping cost
   • Delivery time
   • Free shipping
   • Fast shipping
   • Tracking available
   • Return period
   • Free returns
   • Packaging quality
   • International shipping
   • Delivery success rate

7️⃣  AVAILABILITY & URGENCY (8 params)
   • In stock status
   • Stock level
   • Views last 24h
   • Sales last 7 days
   • Cart additions
   • Low stock indicator
   • Restock frequency
   • Seasonal availability

8️⃣  EMOTIONAL & PSYCHOLOGY (6 params)
   • Visual appeal
   • Brand desirability
   • Trending status
   • Exclusivity
   • Scarcity signals
   • FOMO triggers

9️⃣  COMPANY ESG (25 params)
   • ESG score
   • Carbon footprint
   • Sustainability rating
   • Labor practices
   • Supply chain transparency
   • Renewable energy
   • Waste reduction
   • Recycling program
   • Fair trade certification
   • Community investment
   • Diversity metrics
   • Ethical sourcing
   • Water conservation
   • Emissions reduction
   • Green certifications
   • Circular economy
   • Social responsibility
   • Governance score
   • Compliance record
   • Transparency index
   • Stakeholder engagement
   • Impact measurement
   • UN SDG alignment
   • B-Corp status
   • Carbon neutrality
`)

  console.log('='.repeat(80))
  console.log('✅ TOTAL: 96 Parameters Used in AI Scoring')
  console.log('='.repeat(80) + '\n')

  await prisma.$disconnect()
}

show96ParameterBreakdown().catch(console.error)
