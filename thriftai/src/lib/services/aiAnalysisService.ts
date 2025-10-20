// ThriftAI - AI Analysis Service
// Deep product analysis and personalized recommendations using Claude AI

import Anthropic from '@anthropic-ai/sdk'
import type {
  MockAmazonProduct,
  AIProductAnalysis,
  AlternativeProduct,
  UserProfile,
  ContextHints
} from '../types/scoring'

interface ClaudeAnalysis {
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string
  sustainabilityInsights: string
  comparativeAnalysis: string
  riskAssessment: string
  alternatives: string[]
}

export class AIAnalysisService {
  private anthropic: Anthropic
  private readonly MAX_RETRIES = 3
  private readonly TIMEOUT_MS = 15000

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey
    })
  }

  async analyzeProduct(
    product: MockAmazonProduct,
    userContext?: UserProfile,
    contextHints?: ContextHints
  ): Promise<AIProductAnalysis> {
    try {
      // Get Claude's comprehensive analysis
      const claudeAnalysis = await this.analyzeWithClaude(product, userContext, contextHints)

      // Process Claude's response into structured analysis
      const analysis = await this.generateStructuredAnalysis(product, claudeAnalysis, userContext)

      return analysis

    } catch (error) {
      console.error('Error analyzing product with AI:', error)

      // Return fallback analysis
      return this.getFallbackAnalysis(product)
    }
  }

  private async analyzeWithClaude(
    product: MockAmazonProduct,
    userContext?: UserProfile,
    contextHints?: ContextHints
  ): Promise<ClaudeAnalysis> {
    const prompt = this.buildAnalysisPrompt(product, userContext, contextHints)

    const message = await this.anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1500,
      temperature: 0.4, // Balanced creativity and consistency
      messages: [{
        role: "user",
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    return this.parseClaudeAnalysis(responseText)
  }

  private buildAnalysisPrompt(
    product: MockAmazonProduct,
    userContext?: UserProfile,
    contextHints?: ContextHints
  ): string {
    let prompt = `You are an expert product analyst and sustainability consultant for ThriftAI, a premium thrift shopping platform. Analyze this second-hand product comprehensively.

**Product Details:**
- Title: ${product.title}
- Brand: ${product.brand}
- Category: ${product.category}
- Price: $${product.price.current} (Original: $${product.price.original})
- Condition: Based on ${product.reviews.rating}/5 rating from ${product.reviews.count} reviews
- Description: ${product.description}
- Materials: ${product.specifications.material || 'Not specified'}
- Size: ${product.specifications.size || 'Not specified'}
- Color: ${product.specifications.color || 'Not specified'}
- Year: ${product.specifications.year || 'Not specified'}
- Seller Rating: ${product.seller.rating}/5 (${product.seller.totalSales} sales)
- Shipping: ${product.availability.shippingDays} days, $${product.availability.shippingCost}
- Sustainability: Eco-friendly: ${product.sustainability.ecoFriendly}, Recyclable: ${product.sustainability.recyclable}
- Certifications: ${product.sustainability.certifications.join(', ') || 'None'}
`

    if (userContext) {
      prompt += `
**User Profile:**
- Preferred categories: ${userContext.preferences.categories.join(', ')}
- Preferred brands: ${userContext.preferences.brands.join(', ')}
- Price range: $${userContext.preferences.priceRange.min} - $${userContext.preferences.priceRange.max}
- Sustainability focus: ${userContext.preferences.sustainability}
- Quality preference: ${userContext.preferences.quality}
- Style preferences: ${userContext.preferences.styles.join(', ')}
- Recent purchases: ${userContext.history.purchases.slice(0, 3).map(p => `${p.category} - $${p.price}`).join(', ')}
`
    }

    if (contextHints) {
      prompt += `
**Shopping Context:**
- Season: ${contextHints.season || 'Not specified'}
- Occasion: ${contextHints.occasion || 'Not specified'}
- Gift for: ${contextHints.giftRecipient || 'Self'}
- Replacing item: ${contextHints.replacementItem ? 'Yes' : 'No'}
- Specific need: ${contextHints.specificNeed || 'General shopping'}
`
    }

    prompt += `
**Analysis Requirements:**
Provide a comprehensive analysis in the following JSON format:

{
  "summary": "2-3 sentence overall assessment of this product",
  "strengths": ["List 3-5 key strengths and advantages"],
  "weaknesses": ["List 2-4 potential concerns or limitations"],
  "recommendations": "Detailed buying advice considering the thrift context",
  "sustainabilityInsights": "Environmental impact and sustainability benefits analysis",
  "comparativeAnalysis": "How this compares to similar products and market positioning",
  "riskAssessment": "Potential risks and how to mitigate them",
  "alternatives": ["List 2-3 similar product suggestions if this isn't ideal"]
}

**Analysis Guidelines:**
1. **Thrift Shopping Context**: Remember this is a second-hand item - adjust expectations accordingly
2. **Value Assessment**: Consider the discount vs. original price and overall value proposition
3. **Quality Indicators**: Use rating, reviews, brand reputation, and seller reliability
4. **Sustainability Focus**: Emphasize environmental benefits of buying second-hand
5. **Practical Advice**: Include sizing, care instructions, longevity expectations
6. **Risk Mitigation**: Address common concerns with second-hand purchases
7. **Personalization**: Tailor advice to user's preferences and shopping context
8. **Honest Assessment**: Be balanced - highlight both positives and concerns

**Tone**: Professional yet approachable, sustainability-conscious, helpful, and honest.

Respond with only the JSON object, no additional text.`

    return prompt
  }

  private parseClaudeAnalysis(responseText: string): ClaudeAnalysis {
    try {
      // Clean and extract JSON
      const cleanedResponse = responseText.trim()
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate required fields
      const required = ['summary', 'strengths', 'weaknesses', 'recommendations', 'sustainabilityInsights']
      for (const field of required) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`)
        }
      }

      return {
        summary: parsed.summary,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [parsed.strengths],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [parsed.weaknesses],
        recommendations: parsed.recommendations,
        sustainabilityInsights: parsed.sustainabilityInsights,
        comparativeAnalysis: parsed.comparativeAnalysis || 'No comparative analysis available',
        riskAssessment: parsed.riskAssessment || 'Standard thrift shopping considerations apply',
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : []
      }

    } catch (error) {
      console.error('Error parsing Claude analysis:', error)
      console.log('Raw response:', responseText)

      // Return fallback analysis structure
      return {
        summary: 'Product analysis completed with basic assessment.',
        strengths: ['Second-hand item reduces environmental impact', 'Potential cost savings'],
        weaknesses: ['Limited warranty or return options', 'Condition assessment required'],
        recommendations: 'Consider condition, seller reputation, and return policy before purchasing.',
        sustainabilityInsights: 'Buying second-hand significantly reduces environmental impact.',
        comparativeAnalysis: 'Pricing appears competitive for the thrift market.',
        riskAssessment: 'Standard second-hand purchase risks apply.',
        alternatives: []
      }
    }
  }

  private async generateStructuredAnalysis(
    product: MockAmazonProduct,
    claudeAnalysis: ClaudeAnalysis,
    userContext?: UserProfile
  ): Promise<AIProductAnalysis> {
    // Deep insights from Claude's analysis
    const deepInsights = {
      productSummary: claudeAnalysis.summary,
      strengths: claudeAnalysis.strengths,
      weaknesses: claudeAnalysis.weaknesses,
      bestUseCase: this.extractBestUseCase(claudeAnalysis.recommendations, product),
      targetAudience: this.extractTargetAudience(product, userContext),
      valueProposition: this.extractValueProposition(product, claudeAnalysis)
    }

    // Comparative analysis
    const comparativeAnalysis = {
      similarProducts: this.generateSimilarProductList(product),
      competitiveAdvantages: this.extractCompetitiveAdvantages(claudeAnalysis, product),
      pricePositioning: this.assessPricePositioning(product),
      uniqueFeatures: this.extractUniqueFeatures(product),
      marketPosition: this.determineMarketPosition(product)
    }

    // Recommendations
    const recommendations = {
      buyingAdvice: claudeAnalysis.recommendations,
      sizingGuidance: this.generateSizingGuidance(product),
      styleAdvice: this.generateStyleAdvice(product, userContext),
      careInstructions: this.generateCareInstructions(product),
      usageRecommendations: this.generateUsageRecommendations(product),
      alternatives: await this.generateAlternativeProducts(product, claudeAnalysis.alternatives)
    }

    // Sustainability insights
    const sustainabilityInsights = {
      environmentalImpact: claudeAnalysis.sustainabilityInsights,
      ethicalProduction: this.assessEthicalProduction(product),
      longevityAssessment: this.assessLongevity(product),
      recyclingOptions: this.generateRecyclingOptions(product),
      improvementSuggestions: this.generateImprovementSuggestions(product)
    }

    // Risk assessment
    const riskAssessment = {
      purchaseRisks: this.extractPurchaseRisks(claudeAnalysis.riskAssessment, product),
      riskLevel: this.assessRiskLevel(product),
      mitigationAdvice: this.generateMitigationAdvice(product)
    }

    return {
      deepInsights,
      comparativeAnalysis,
      recommendations,
      sustainabilityInsights,
      riskAssessment
    }
  }

  // Helper methods for analysis generation
  private extractBestUseCase(recommendations: string, product: MockAmazonProduct): string {
    const category = product.category.toLowerCase()
    const title = product.title.toLowerCase()

    if (category.includes('clothing')) {
      if (title.includes('formal') || title.includes('dress')) return 'Formal occasions and professional settings'
      if (title.includes('casual') || title.includes('everyday')) return 'Casual daily wear and weekend activities'
      if (title.includes('athletic') || title.includes('sport')) return 'Athletic activities and fitness'
      return 'Versatile everyday wear'
    }

    if (category.includes('shoes')) {
      if (title.includes('running') || title.includes('athletic')) return 'Athletic activities and exercise'
      if (title.includes('dress') || title.includes('formal')) return 'Professional and formal occasions'
      return 'Daily wear and casual activities'
    }

    if (category.includes('electronics')) {
      return 'Personal use and productivity tasks'
    }

    return 'General everyday use'
  }

  private extractTargetAudience(product: MockAmazonProduct, userContext?: UserProfile): string[] {
    const audience: string[] = []

    // Based on category
    const category = product.category.toLowerCase()
    if (category.includes('clothing')) {
      audience.push('Fashion-conscious individuals')
      audience.push('Sustainable shoppers')
    }

    // Based on price point
    if (product.price.current < 50) {
      audience.push('Budget-conscious shoppers')
      audience.push('Students')
    } else if (product.price.current > 200) {
      audience.push('Premium buyers')
      audience.push('Brand enthusiasts')
    }

    // Based on sustainability
    if (product.sustainability.ecoFriendly) {
      audience.push('Eco-conscious consumers')
    }

    // Based on brand
    const premiumBrands = ['nike', 'adidas', 'apple', 'gucci', 'prada']
    if (premiumBrands.includes(product.brand.toLowerCase())) {
      audience.push('Brand loyalists')
    }

    return audience.length > 0 ? audience : ['General consumers']
  }

  private extractValueProposition(product: MockAmazonProduct, claudeAnalysis: ClaudeAnalysis): string {
    const discountPercent = product.price.discountPercentage || 0
    const sustainability = product.sustainability.ecoFriendly ? 'sustainable ' : ''
    const brand = product.brand

    if (discountPercent > 50) {
      return `Exceptional ${sustainability}value with ${discountPercent}% savings on ${brand} quality`
    } else if (discountPercent > 30) {
      return `Great ${sustainability}deal with significant savings on authentic ${brand} product`
    } else {
      return `Quality ${sustainability}second-hand ${brand} item with environmental benefits`
    }
  }

  private generateSimilarProductList(product: MockAmazonProduct): string[] {
    const category = product.category.toLowerCase()
    const brand = product.brand.toLowerCase()

    const similarProducts: string[] = []

    // Category-based suggestions
    if (category.includes('clothing')) {
      similarProducts.push('Similar style clothing from comparable brands')
      similarProducts.push('Alternative cuts and fits in same category')
    } else if (category.includes('shoes')) {
      similarProducts.push('Footwear from competing athletic brands')
      similarProducts.push('Similar style shoes in different colorways')
    } else if (category.includes('electronics')) {
      similarProducts.push('Comparable models from other manufacturers')
      similarProducts.push('Different generations of same product line')
    }

    // Add brand alternatives
    const brandAlternatives: { [key: string]: string[] } = {
      'nike': ['Adidas', 'Under Armour', 'Puma'],
      'adidas': ['Nike', 'Reebok', 'New Balance'],
      'apple': ['Samsung', 'Google', 'OnePlus'],
      'samsung': ['Apple', 'Google', 'Sony']
    }

    const alternatives = brandAlternatives[brand]
    if (alternatives) {
      similarProducts.push(`Similar products from ${alternatives.join(', ')}`)
    }

    return similarProducts
  }

  private extractCompetitiveAdvantages(claudeAnalysis: ClaudeAnalysis, product: MockAmazonProduct): string[] {
    const advantages: string[] = []

    // Extract from strengths
    claudeAnalysis.strengths.forEach(strength => {
      if (strength.toLowerCase().includes('price') || strength.toLowerCase().includes('value')) {
        advantages.push('Competitive pricing advantage')
      }
      if (strength.toLowerCase().includes('quality') || strength.toLowerCase().includes('brand')) {
        advantages.push('Strong brand and quality reputation')
      }
      if (strength.toLowerCase().includes('sustainable') || strength.toLowerCase().includes('eco')) {
        advantages.push('Environmental sustainability benefits')
      }
    })

    // Product-specific advantages
    if (product.reviews.rating >= 4.5) {
      advantages.push('Exceptional customer satisfaction ratings')
    }

    if (product.availability.shippingCost === 0) {
      advantages.push('Free shipping included')
    }

    if (product.seller.verified) {
      advantages.push('Verified seller with proven track record')
    }

    return advantages.length > 0 ? advantages : ['Standard product benefits']
  }

  private assessPricePositioning(product: MockAmazonProduct): string {
    const discount = product.price.discountPercentage || 0
    const price = product.price.current

    if (price < 25) return 'Budget-friendly entry point'
    if (price < 100 && discount > 40) return 'Mid-range with excellent value'
    if (price < 200) return 'Premium quality at reasonable price'
    if (price >= 200) return 'High-end positioning with luxury appeal'

    return 'Competitively positioned'
  }

  private extractUniqueFeatures(product: MockAmazonProduct): string[] {
    const features: string[] = []

    // Sustainability features
    if (product.sustainability.ecoFriendly) {
      features.push('Eco-friendly materials and production')
    }

    if (product.sustainability.certifications.length > 0) {
      features.push(`Certified: ${product.sustainability.certifications.join(', ')}`)
    }

    // Product-specific features
    if (product.specifications.material) {
      features.push(`Premium ${product.specifications.material} construction`)
    }

    if (product.authenticity.authenticityGuarantee) {
      features.push('Authenticity guarantee included')
    }

    if (product.seller.fulfillment === 'Amazon') {
      features.push('Amazon fulfillment for reliable delivery')
    }

    return features.length > 0 ? features : ['Standard product features']
  }

  private determineMarketPosition(product: MockAmazonProduct): 'budget' | 'mid-range' | 'premium' | 'luxury' {
    const price = product.price.current
    const brandReputation = this.getBrandReputation(product.brand)

    if (price > 500 || brandReputation > 95) return 'luxury'
    if (price > 200 || brandReputation > 85) return 'premium'
    if (price > 50 || brandReputation > 70) return 'mid-range'
    return 'budget'
  }

  private getBrandReputation(brand: string): number {
    const brandScores: { [key: string]: number } = {
      'nike': 95, 'adidas': 92, 'apple': 98, 'samsung': 90,
      'gucci': 95, 'prada': 94, 'coach': 87, 'levi\'s': 88
    }
    return brandScores[brand.toLowerCase()] || 70
  }

  private generateSizingGuidance(product: MockAmazonProduct): string {
    const category = product.category.toLowerCase()
    const size = product.specifications.size

    if (!size) {
      return 'No specific size information available. Check product details carefully.'
    }

    if (category.includes('clothing')) {
      return `Size ${size} - Consider brand-specific sizing charts and fit preferences. Thrift items may have different fit than current production.`
    }

    if (category.includes('shoes')) {
      return `Size ${size} - Verify sizing system (US/UK/EU) and consider trying similar styles for fit reference.`
    }

    return `Product size: ${size}. Verify compatibility with your requirements.`
  }

  private generateStyleAdvice(product: MockAmazonProduct, userContext?: UserProfile): string {
    const category = product.category.toLowerCase()
    const color = product.specifications.color || 'the available color'

    let advice = `This ${product.brand} ${category} in ${color} offers versatile styling options. `

    if (category.includes('clothing')) {
      advice += 'Consider pairing with neutral colors for maximum versatility. '
    }

    if (userContext?.preferences.styles.includes('vintage')) {
      advice += 'Perfect for vintage-inspired looks and sustainable fashion choices.'
    } else if (userContext?.preferences.styles.includes('casual')) {
      advice += 'Great for casual everyday wear and relaxed styling.'
    } else {
      advice += 'Suitable for various styling approaches based on your personal preference.'
    }

    return advice
  }

  private generateCareInstructions(product: MockAmazonProduct): string {
    const category = product.category.toLowerCase()
    const material = product.specifications.material?.toLowerCase() || ''

    if (category.includes('clothing')) {
      if (material.includes('leather')) {
        return 'Clean with leather conditioner. Avoid water exposure. Store in breathable bag.'
      }
      if (material.includes('wool') || material.includes('cashmere')) {
        return 'Dry clean recommended. If hand washing, use cold water and wool detergent.'
      }
      if (material.includes('cotton')) {
        return 'Machine wash cold. Tumble dry low or air dry to prevent shrinkage.'
      }
      return 'Follow care label instructions. When in doubt, dry clean or hand wash gently.'
    }

    if (category.includes('shoes')) {
      return 'Clean regularly with appropriate cleaner. Use shoe trees to maintain shape. Condition leather if applicable.'
    }

    if (category.includes('electronics')) {
      return 'Keep clean and dry. Follow manufacturer guidelines for battery care and software updates.'
    }

    return 'Handle with care and follow manufacturer recommendations for best longevity.'
  }

  private generateUsageRecommendations(product: MockAmazonProduct): string[] {
    const category = product.category.toLowerCase()
    const recommendations: string[] = []

    if (category.includes('clothing')) {
      recommendations.push('Inspect for any wear or damage before first use')
      recommendations.push('Consider professional cleaning before wearing')
      recommendations.push('Rotate with other items to extend lifespan')
    } else if (category.includes('shoes')) {
      recommendations.push('Allow to air out between wears')
      recommendations.push('Use appropriate socks/hosiery for comfort')
      recommendations.push('Break in gradually for best fit')
    } else if (category.includes('electronics')) {
      recommendations.push('Test all functions upon receipt')
      recommendations.push('Update software/firmware if possible')
      recommendations.push('Consider protective accessories')
    }

    recommendations.push('Enjoy the sustainable choice of second-hand shopping')

    return recommendations
  }

  private async generateAlternativeProducts(product: MockAmazonProduct, alternatives: string[]): Promise<AlternativeProduct[]> {
    // This would typically query for actual alternative products
    // For now, we'll generate based on the suggestions from Claude
    const alternativeProducts: AlternativeProduct[] = []

    alternatives.slice(0, 3).forEach((alt, index) => {
      alternativeProducts.push({
        asin: `ALT${product.asin}${index}`,
        title: alt,
        price: product.price.current * (0.8 + Math.random() * 0.4), // Price variation
        reason: 'Similar style and quality profile',
        advantages: ['Different price point', 'Alternative styling options'],
        overallScore: 75 + Math.random() * 20
      })
    })

    return alternativeProducts
  }

  private assessEthicalProduction(product: MockAmazonProduct): string {
    if (product.sustainability.ethicalProduction) {
      return 'Product shows evidence of ethical production practices and fair labor standards.'
    }

    const ethicalBrands = ['patagonia', 'everlane', 'eileen fisher']
    if (ethicalBrands.includes(product.brand.toLowerCase())) {
      return 'Brand is known for commitment to ethical production and fair labor practices.'
    }

    return 'Ethical production information not explicitly available. Consider researching brand practices.'
  }

  private assessLongevity(product: MockAmazonProduct): string {
    const rating = product.reviews.rating
    const brandReputation = this.getBrandReputation(product.brand)

    if (rating >= 4.5 && brandReputation >= 85) {
      return 'Excellent longevity expected based on brand reputation and user satisfaction.'
    } else if (rating >= 4.0 && brandReputation >= 75) {
      return 'Good longevity expected with proper care and maintenance.'
    } else {
      return 'Moderate longevity expected. Consider usage patterns and care requirements.'
    }
  }

  private generateRecyclingOptions(product: MockAmazonProduct): string {
    const category = product.category.toLowerCase()

    if (category.includes('electronics')) {
      return 'Electronics recycling programs available through manufacturers and retailers. Check local e-waste facilities.'
    }

    if (category.includes('clothing')) {
      return 'Textile recycling available through clothing brands and municipal programs. Consider donation when no longer needed.'
    }

    if (product.sustainability.recyclable) {
      return 'Product is designed for recyclability. Check local recycling guidelines for proper disposal.'
    }

    return 'Consider resale, donation, or material-specific recycling when product reaches end of life.'
  }

  private generateImprovementSuggestions(product: MockAmazonProduct): string[] {
    const suggestions: string[] = []

    if (!product.sustainability.ecoFriendly) {
      suggestions.push('Look for eco-friendly alternatives in future purchases')
    }

    if (!product.sustainability.sustainableMaterials) {
      suggestions.push('Consider products with sustainable material certifications')
    }

    if (product.reviews.rating < 4.0) {
      suggestions.push('Research user reviews more thoroughly for quality assurance')
    }

    if (!product.seller.verified) {
      suggestions.push('Prefer verified sellers for better purchase protection')
    }

    return suggestions.length > 0 ? suggestions : ['Continue choosing second-hand for environmental benefits']
  }

  private extractPurchaseRisks(riskAssessment: string, product: MockAmazonProduct): string[] {
    const risks: string[] = []

    // Extract from risk assessment text
    if (riskAssessment.toLowerCase().includes('condition')) {
      risks.push('Product condition may vary from description')
    }

    if (riskAssessment.toLowerCase().includes('return')) {
      risks.push('Limited return options for second-hand items')
    }

    // Product-specific risks
    if (product.reviews.rating < 3.5) {
      risks.push('Below average customer satisfaction ratings')
    }

    if (!product.seller.verified) {
      risks.push('Unverified seller may have limited buyer protection')
    }

    if (product.availability.shippingDays > 7) {
      risks.push('Extended shipping time may delay receipt')
    }

    return risks.length > 0 ? risks : ['Standard second-hand purchase considerations']
  }

  private assessRiskLevel(product: MockAmazonProduct): 'low' | 'medium' | 'high' {
    let riskScore = 0

    // Negative factors
    if (product.reviews.rating < 3.5) riskScore += 2
    if (!product.seller.verified) riskScore += 1
    if (!product.authenticity.verified) riskScore += 1
    if (product.seller.rating < 4.0) riskScore += 1

    // Positive factors
    if (product.seller.verified) riskScore -= 1
    if (product.authenticity.authenticityGuarantee) riskScore -= 1
    if (product.seller.fulfillment === 'Amazon') riskScore -= 1

    if (riskScore <= 0) return 'low'
    if (riskScore <= 2) return 'medium'
    return 'high'
  }

  private generateMitigationAdvice(product: MockAmazonProduct): string[] {
    const advice: string[] = []

    advice.push('Read all product descriptions and seller policies carefully')
    advice.push('Check return and refund policies before purchasing')
    advice.push('Contact seller with questions about condition or authenticity')

    if (product.reviews.count > 0) {
      advice.push('Review customer feedback for insights into product quality')
    }

    if (!product.seller.verified) {
      advice.push('Consider purchasing from verified sellers for added protection')
    }

    advice.push('Use secure payment methods that offer buyer protection')

    return advice
  }

  private getFallbackAnalysis(product: MockAmazonProduct): AIProductAnalysis {
    return {
      deepInsights: {
        productSummary: `${product.brand} ${product.category.toLowerCase()} in good condition with ${product.reviews.rating}/5 rating.`,
        strengths: ['Sustainable second-hand choice', 'Cost savings vs new', 'Established brand quality'],
        weaknesses: ['Limited warranty coverage', 'Potential wear from previous use'],
        bestUseCase: 'General everyday use',
        targetAudience: ['Sustainable shoppers', 'Budget-conscious buyers'],
        valueProposition: 'Good value second-hand option with environmental benefits'
      },
      comparativeAnalysis: {
        similarProducts: ['Comparable items in same category', 'Alternative brands with similar features'],
        competitiveAdvantages: ['Pre-owned pricing advantage', 'Immediate availability'],
        pricePositioning: 'Competitively priced for second-hand market',
        uniqueFeatures: ['Authentic pre-owned condition', 'Sustainable shopping choice'],
        marketPosition: this.determineMarketPosition(product)
      },
      recommendations: {
        buyingAdvice: 'Consider condition, seller reputation, and return policy before purchasing.',
        sizingGuidance: this.generateSizingGuidance(product),
        styleAdvice: 'Versatile piece suitable for various styling approaches.',
        careInstructions: this.generateCareInstructions(product),
        usageRecommendations: ['Inspect upon receipt', 'Follow care instructions', 'Enjoy sustainable choice'],
        alternatives: []
      },
      sustainabilityInsights: {
        environmentalImpact: 'Choosing second-hand significantly reduces environmental impact compared to new purchases.',
        ethicalProduction: this.assessEthicalProduction(product),
        longevityAssessment: this.assessLongevity(product),
        recyclingOptions: this.generateRecyclingOptions(product),
        improvementSuggestions: ['Continue choosing second-hand options', 'Research sustainable brands']
      },
      riskAssessment: {
        purchaseRisks: ['Standard second-hand considerations', 'Condition assessment required'],
        riskLevel: this.assessRiskLevel(product),
        mitigationAdvice: this.generateMitigationAdvice(product)
      }
    }
  }

  // Utility methods
  async analyzeBatch(products: MockAmazonProduct[], userContext?: UserProfile): Promise<AIProductAnalysis[]> {
    const analyses = await Promise.all(
      products.map(product => this.analyzeProduct(product, userContext))
    )

    return analyses
  }

  async isServiceHealthy(): Promise<boolean> {
    try {
      const testProduct: Partial<MockAmazonProduct> = {
        title: 'Test Product',
        brand: 'Test Brand',
        category: 'CLOTHING',
        price: { current: 50, original: 100, currency: 'USD' },
        description: 'Test description',
        reviews: { rating: 4.0, count: 10, verified: true }
      }

      const analysis = await this.analyzeProduct(testProduct as MockAmazonProduct)
      return analysis.deepInsights.productSummary.length > 0
    } catch (error) {
      console.error('AI Analysis Service health check failed:', error)
      return false
    }
  }

  getAnalysisMetrics(analyses: AIProductAnalysis[]) {
    if (analyses.length === 0) return null

    const totalRisks = analyses.reduce((sum, analysis) =>
      sum + analysis.riskAssessment.purchaseRisks.length, 0
    )

    const avgRiskLevel = analyses.filter(a => a.riskAssessment.riskLevel === 'low').length / analyses.length

    return {
      totalAnalyses: analyses.length,
      averageRisksPerProduct: Math.round(totalRisks / analyses.length),
      lowRiskPercentage: Math.round(avgRiskLevel * 100),
      avgStrengthsIdentified: Math.round(
        analyses.reduce((sum, a) => sum + a.deepInsights.strengths.length, 0) / analyses.length
      )
    }
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService()
export default AIAnalysisService