// ThriftAI - Product Scoring Engine
// Advanced AI-powered product analysis and scoring system

import type {
  MockAmazonProduct,
  ProductScores,
  QualityScore,
  ValueScore,
  DesignScore,
  RelevanceScore,
  SustainabilityScore,
  PopularityScore,
  AuthenticityScore,
  AvailabilityScore,
  PersonalizationFactors,
  UserProfile,
  MarketData,
  ContextHints,
  DEFAULT_SCORE
} from '../types/scoring'

export class ProductScoringEngine {
  private readonly QUALITY_WEIGHTS = {
    materialQuality: 0.25,
    craftsmanship: 0.20,
    durability: 0.20,
    brandReputation: 0.20,
    warrantySupport: 0.10,
    conditionAssessment: 0.05
  }

  private readonly VALUE_WEIGHTS = {
    priceComparison: 0.25,
    qualityToPrice: 0.25,
    marketValue: 0.20,
    discountValue: 0.15,
    totalCostOfOwnership: 0.10,
    investmentPotential: 0.05
  }

  private readonly DESIGN_WEIGHTS = {
    aestheticAppeal: 0.30,
    functionalDesign: 0.25,
    timelessness: 0.20,
    versatility: 0.15,
    uniqueness: 0.05,
    brandStyling: 0.05
  }

  private readonly OVERALL_CATEGORY_WEIGHTS = {
    relevance: 0.25,
    quality: 0.20,
    value: 0.20,
    sustainability: 0.15,
    design: 0.10,
    popularity: 0.05,
    authenticity: 0.03,
    availability: 0.02
  }

  async scoreProduct(
    product: MockAmazonProduct,
    userQuery: string,
    userProfile?: UserProfile,
    marketData?: MarketData,
    contextHints?: ContextHints
  ): Promise<ProductScores> {
    try {
      // Calculate individual category scores
      const [
        quality,
        value,
        design,
        relevance,
        sustainability,
        popularity,
        authenticity,
        availability
      ] = await Promise.all([
        this.calculateQualityScore(product),
        this.calculateValueScore(product, marketData),
        this.calculateDesignScore(product),
        this.calculateRelevanceScore(product, userQuery, contextHints),
        this.calculateSustainabilityScore(product),
        this.calculatePopularityScore(product),
        this.calculateAuthenticityScore(product),
        this.calculateAvailabilityScore(product)
      ])

      // Calculate personalization adjustments
      const personalizedAdjustments = userProfile
        ? this.calculatePersonalizationFactors(product, userProfile)
        : this.getDefaultPersonalizationFactors()

      // Calculate overall score
      const overall = this.calculateOverallScore({
        quality,
        value,
        design,
        relevance,
        sustainability,
        popularity,
        authenticity,
        availability
      }, personalizedAdjustments)

      // Generate reasoning
      const reasoning = this.generateScoreReasoning(
        product,
        { quality, value, design, relevance, sustainability, popularity, authenticity, availability },
        overall
      )

      // Calculate confidence based on data availability and consistency
      const confidence = this.calculateScoreConfidence(product, {
        quality, value, design, relevance, sustainability, popularity, authenticity, availability
      })

      return {
        overall,
        breakdown: {
          quality,
          value,
          design,
          relevance,
          sustainability,
          popularity,
          authenticity,
          availability
        },
        personalizedAdjustments,
        confidence,
        reasoning,
        scoringVersion: '1.0',
        processedAt: new Date()
      }

    } catch (error) {
      console.error('Error calculating product scores:', error)
      return {
        ...DEFAULT_SCORE,
        reasoning: ['Error occurred during scoring process'],
        confidence: 0
      }
    }
  }

  private async calculateQualityScore(product: MockAmazonProduct): Promise<QualityScore> {
    const factors = {
      materialQuality: this.assessMaterialQuality(product),
      craftsmanship: this.assessCraftsmanship(product),
      durability: this.assessDurability(product),
      brandReputation: this.assessBrandReputation(product.brand),
      warrantySupport: this.assessWarrantySupport(product.authenticity.warranty),
      conditionAssessment: this.assessCondition(product)
    }

    const score = this.calculateWeightedScore(factors, this.QUALITY_WEIGHTS)
    const confidence = this.calculateFactorConfidence(factors)
    const reasoning = this.generateQualityReasoning(factors, product)

    return { score, factors, confidence, reasoning }
  }

  private async calculateValueScore(product: MockAmazonProduct, marketData?: MarketData): Promise<ValueScore> {
    const factors = {
      priceComparison: this.assessPriceComparison(product, marketData),
      qualityToPrice: this.assessQualityToPrice(product),
      marketValue: this.assessMarketValue(product, marketData),
      discountValue: this.assessDiscountValue(product),
      totalCostOfOwnership: this.assessTotalCostOfOwnership(product),
      investmentPotential: this.assessInvestmentPotential(product)
    }

    const priceAnalysis = {
      currentPrice: product.price.current,
      estimatedRetailPrice: product.price.original,
      marketAveragePrice: marketData?.averagePrice || product.price.current,
      pricePerformanceRatio: factors.qualityToPrice / 10 // Convert to ratio
    }

    const score = this.calculateWeightedScore(factors, this.VALUE_WEIGHTS)
    const confidence = this.calculateFactorConfidence(factors)
    const reasoning = this.generateValueReasoning(factors, product, priceAnalysis)

    return { score, factors, confidence, reasoning, priceAnalysis }
  }

  private async calculateDesignScore(product: MockAmazonProduct): Promise<DesignScore> {
    const factors = {
      aestheticAppeal: this.assessAestheticAppeal(product),
      functionalDesign: this.assessFunctionalDesign(product),
      timelessness: this.assessTimelessness(product),
      versatility: this.assessVersatility(product),
      uniqueness: this.assessUniqueness(product),
      brandStyling: this.assessBrandStyling(product)
    }

    const styleMetrics = {
      colorHarmony: this.assessColorHarmony(product),
      proportionBalance: this.assessProportionBalance(product),
      detailQuality: this.assessDetailQuality(product),
      overallCohesion: this.assessOverallCohesion(product)
    }

    const score = this.calculateWeightedScore(factors, this.DESIGN_WEIGHTS)
    const confidence = this.calculateFactorConfidence(factors)
    const reasoning = this.generateDesignReasoning(factors, product)

    return { score, factors, confidence, reasoning, styleMetrics }
  }

  private async calculateRelevanceScore(
    product: MockAmazonProduct,
    userQuery: string,
    contextHints?: ContextHints
  ): Promise<RelevanceScore> {
    const factors = {
      queryMatch: this.assessQueryMatch(product, userQuery),
      semanticSimilarity: this.assessSemanticSimilarity(product, userQuery),
      categoryAlignment: this.assessCategoryAlignment(product, userQuery),
      attributeMatch: this.assessAttributeMatch(product, userQuery),
      intentFulfillment: this.assessIntentFulfillment(product, userQuery, contextHints),
      contextualRelevance: this.assessContextualRelevance(product, contextHints)
    }

    const matchDetails = this.extractMatchDetails(product, userQuery)

    const score = this.calculateWeightedScore(factors, {
      queryMatch: 0.30,
      semanticSimilarity: 0.25,
      categoryAlignment: 0.20,
      attributeMatch: 0.15,
      intentFulfillment: 0.06,
      contextualRelevance: 0.04
    })

    const confidence = this.calculateFactorConfidence(factors)
    const reasoning = this.generateRelevanceReasoning(factors, product, userQuery)

    return { score, factors, confidence, reasoning, matchDetails }
  }

  private async calculateSustainabilityScore(product: MockAmazonProduct): Promise<SustainabilityScore> {
    const factors = {
      environmentalImpact: this.assessEnvironmentalImpact(product),
      materialSustainability: this.assessMaterialSustainability(product),
      productionEthics: this.assessProductionEthics(product),
      longevity: this.assessLongevity(product),
      recyclability: this.assessRecyclability(product),
      circularity: this.assessCircularity(product)
    }

    const impactMetrics = {
      carbonFootprintReduction: this.calculateCarbonFootprintReduction(product),
      waterSaved: this.calculateWaterSaved(product),
      wasteReduction: this.calculateWasteReduction(product),
      energySaved: this.calculateEnergySaved(product)
    }

    const score = this.calculateWeightedScore(factors, {
      environmentalImpact: 0.25,
      materialSustainability: 0.20,
      productionEthics: 0.20,
      longevity: 0.15,
      recyclability: 0.15,
      circularity: 0.05
    })

    const confidence = this.calculateFactorConfidence(factors)
    const reasoning = this.generateSustainabilityReasoning(factors, product)

    return {
      score,
      factors,
      confidence,
      reasoning,
      impactMetrics,
      certifications: product.sustainability.certifications
    }
  }

  private async calculatePopularityScore(product: MockAmazonProduct): Promise<PopularityScore> {
    const factors = {
      salesVolume: this.assessSalesVolume(product),
      reviewCount: this.assessReviewCount(product),
      ratingDistribution: this.assessRatingDistribution(product),
      socialMentions: this.assessSocialMentions(product),
      trendingStatus: this.assessTrendingStatus(product),
      marketDemand: this.assessMarketDemand(product)
    }

    const popularityMetrics = {
      averageRating: product.reviews.rating,
      totalReviews: product.reviews.count,
      recentSalesVelocity: this.estimateSalesVelocity(product),
      socialEngagement: this.estimateSocialEngagement(product)
    }

    const score = this.calculateWeightedScore(factors, {
      salesVolume: 0.25,
      reviewCount: 0.25,
      ratingDistribution: 0.20,
      socialMentions: 0.15,
      trendingStatus: 0.10,
      marketDemand: 0.05
    })

    const confidence = this.calculateFactorConfidence(factors)
    const reasoning = this.generatePopularityReasoning(factors, product)

    return { score, factors, confidence, reasoning, popularityMetrics }
  }

  private async calculateAuthenticityScore(product: MockAmazonProduct): Promise<AuthenticityScore> {
    const factors = {
      sellerVerification: this.assessSellerVerification(product.seller),
      productAuthentication: this.assessProductAuthentication(product),
      descriptionAccuracy: this.assessDescriptionAccuracy(product),
      imageAuthenticity: this.assessImageAuthenticity(product),
      brandVerification: this.assessBrandVerification(product),
      documentationProvided: this.assessDocumentationProvided(product)
    }

    const verificationStatus = {
      sellerTrustLevel: this.determineSellerTrustLevel(product.seller),
      productVerified: product.authenticity.verified,
      imageVerified: this.assessImageVerification(product),
      documentationLevel: this.assessDocumentationLevel(product)
    }

    const score = this.calculateWeightedScore(factors, {
      sellerVerification: 0.25,
      productAuthentication: 0.25,
      descriptionAccuracy: 0.20,
      imageAuthenticity: 0.15,
      brandVerification: 0.10,
      documentationProvided: 0.05
    })

    const confidence = this.calculateFactorConfidence(factors)
    const reasoning = this.generateAuthenticityReasoning(factors, product)

    return { score, factors, confidence, reasoning, verificationStatus }
  }

  private async calculateAvailabilityScore(product: MockAmazonProduct): Promise<AvailabilityScore> {
    const factors = {
      stockStatus: this.assessStockStatus(product.availability),
      shippingSpeed: this.assessShippingSpeed(product.availability),
      locationProximity: this.assessLocationProximity(product.seller),
      sellerResponsiveness: this.assessSellerResponsiveness(product.seller),
      fulfillmentReliability: this.assessFulfillmentReliability(product.seller),
      seasonalAvailability: this.assessSeasonalAvailability(product)
    }

    const availabilityDetails = {
      inStock: product.availability.inStock,
      estimatedShippingDays: product.availability.shippingDays,
      shippingCost: product.availability.shippingCost,
      pickupAvailable: this.assessPickupAvailability(product.seller),
      lastUpdated: new Date()
    }

    const score = this.calculateWeightedScore(factors, {
      stockStatus: 0.30,
      shippingSpeed: 0.25,
      locationProximity: 0.15,
      sellerResponsiveness: 0.15,
      fulfillmentReliability: 0.10,
      seasonalAvailability: 0.05
    })

    const confidence = this.calculateFactorConfidence(factors)
    const reasoning = this.generateAvailabilityReasoning(factors, product)

    return { score, factors, confidence, reasoning, availabilityDetails }
  }

  // Assessment methods for quality factors
  private assessMaterialQuality(product: MockAmazonProduct): number {
    const material = product.specifications.material?.toLowerCase() || ''
    const premiumMaterials = ['silk', 'cashmere', 'wool', 'leather', 'cotton', 'linen']
    const standardMaterials = ['polyester', 'nylon', 'acrylic', 'synthetic']

    if (premiumMaterials.some(mat => material.includes(mat))) return 80 + Math.random() * 20
    if (standardMaterials.some(mat => material.includes(mat))) return 60 + Math.random() * 20
    return 50 + Math.random() * 30
  }

  private assessCraftsmanship(product: MockAmazonProduct): number {
    const brandReputation = this.assessBrandReputation(product.brand)
    const price = product.price.current
    const priceScore = Math.min(100, (price / 100) * 30) // Higher price often indicates better craftsmanship

    return (brandReputation * 0.6) + (priceScore * 0.4)
  }

  private assessDurability(product: MockAmazonProduct): number {
    const category = product.category.toLowerCase()
    const brand = product.brand.toLowerCase()

    let baseScore = 70

    // Category-specific durability expectations
    if (category.includes('electronics')) baseScore = 75
    if (category.includes('shoes')) baseScore = 80
    if (category.includes('accessories')) baseScore = 85

    // Brand-specific adjustments
    const premiumBrands = ['nike', 'adidas', 'apple', 'samsung', 'sony', 'levi\'s']
    if (premiumBrands.includes(brand)) baseScore += 15

    // Price factor
    const priceBonus = Math.min(15, product.price.current / 20)

    return Math.min(100, baseScore + priceBonus + (Math.random() * 10))
  }

  private assessBrandReputation(brand: string): number {
    const brandLower = brand.toLowerCase()
    const brandScores: { [key: string]: number } = {
      'nike': 95,
      'adidas': 92,
      'apple': 98,
      'samsung': 90,
      'sony': 89,
      'levi\'s': 88,
      'gap': 75,
      'h&m': 65,
      'zara': 78,
      'uniqlo': 82,
      'gucci': 95,
      'prada': 94,
      'coach': 87,
      'michael kors': 80
    }

    return brandScores[brandLower] || 70
  }

  private assessWarrantySupport(warranty?: string): number {
    if (!warranty) return 30

    const warrantyLower = warranty.toLowerCase()
    if (warrantyLower.includes('2 year') || warrantyLower.includes('24 month')) return 90
    if (warrantyLower.includes('1 year') || warrantyLower.includes('12 month')) return 80
    if (warrantyLower.includes('6 month')) return 70
    if (warrantyLower.includes('3 month')) return 60
    if (warrantyLower.includes('30 day')) return 40

    return 50
  }

  private assessCondition(product: MockAmazonProduct): number {
    // For thrift items, this would be based on condition description
    // For now, we'll use rating as a proxy
    const rating = product.reviews.rating
    return Math.min(100, rating * 20)
  }

  // Assessment methods for value factors
  private assessPriceComparison(product: MockAmazonProduct, marketData?: MarketData): number {
    if (!marketData?.averagePrice) return 70

    const ratio = product.price.current / marketData.averagePrice
    if (ratio < 0.7) return 100 // Great deal
    if (ratio < 0.85) return 85  // Good deal
    if (ratio < 1.15) return 70  // Fair price
    if (ratio < 1.3) return 50   // Slightly expensive
    return 30 // Overpriced
  }

  private assessQualityToPrice(product: MockAmazonProduct): number {
    const brandReputation = this.assessBrandReputation(product.brand)
    const rating = product.reviews.rating
    const price = product.price.current

    // Quality indicators
    const qualityScore = (brandReputation * 0.6) + (rating * 20 * 0.4)

    // Price efficiency (quality per dollar)
    const efficiency = qualityScore / Math.max(1, price / 10)

    return Math.min(100, efficiency)
  }

  private assessMarketValue(product: MockAmazonProduct, marketData?: MarketData): number {
    const trend = marketData?.marketTrend || 'stable'
    const demand = marketData?.demandLevel || 'medium'

    let score = 70

    if (trend === 'rising') score += 15
    if (trend === 'falling') score -= 15

    if (demand === 'high') score += 10
    if (demand === 'low') score -= 10

    return Math.max(0, Math.min(100, score))
  }

  private assessDiscountValue(product: MockAmazonProduct): number {
    const discount = product.price.discountPercentage || 0
    return Math.min(100, discount * 2) // 50% discount = 100 points
  }

  private assessTotalCostOfOwnership(product: MockAmazonProduct): number {
    let score = 80 // Base score

    // Shipping cost impact
    if (product.availability.shippingCost === 0) score += 10
    else score -= Math.min(20, product.availability.shippingCost * 2)

    // Category-specific maintenance costs
    const category = product.category.toLowerCase()
    if (category.includes('electronics')) score -= 10 // Higher maintenance
    if (category.includes('clothing')) score += 5   // Lower maintenance

    return Math.max(0, Math.min(100, score))
  }

  private assessInvestmentPotential(product: MockAmazonProduct): number {
    const brand = product.brand.toLowerCase()
    const luxuryBrands = ['gucci', 'prada', 'coach', 'louis vuitton', 'chanel']
    const collectibleBrands = ['nike', 'adidas', 'apple', 'rolex']

    if (luxuryBrands.includes(brand)) return 80 + Math.random() * 20
    if (collectibleBrands.includes(brand)) return 60 + Math.random() * 30
    return 30 + Math.random() * 40
  }

  // Assessment methods for design factors
  private assessAestheticAppeal(product: MockAmazonProduct): number {
    const rating = product.reviews.rating
    const brand = this.assessBrandReputation(product.brand)

    // Combine rating and brand reputation for aesthetic appeal
    return (rating * 15) + (brand * 0.3) + (Math.random() * 20)
  }

  private assessFunctionalDesign(product: MockAmazonProduct): number {
    const category = product.category.toLowerCase()
    let score = 70

    // Category-specific functional design expectations
    if (category.includes('shoes')) score = 75
    if (category.includes('electronics')) score = 80
    if (category.includes('accessories')) score = 70

    // Brand factor
    const brandScore = this.assessBrandReputation(product.brand)
    score = (score * 0.7) + (brandScore * 0.3)

    return Math.min(100, score)
  }

  private assessTimelessness(product: MockAmazonProduct): number {
    const brand = product.brand.toLowerCase()
    const timelessBrands = ['levi\'s', 'nike', 'adidas', 'coach', 'apple']

    let score = 60

    if (timelessBrands.includes(brand)) score += 25

    // Year factor - newer items might be less timeless
    const year = product.specifications.year
    if (year && year < 2020) score += 10

    return Math.min(100, score + Math.random() * 15)
  }

  private assessVersatility(product: MockAmazonProduct): number {
    const category = product.category.toLowerCase()
    const color = product.specifications.color?.toLowerCase() || ''

    let score = 60

    // Neutral colors are more versatile
    const neutralColors = ['black', 'white', 'gray', 'navy', 'brown', 'beige']
    if (neutralColors.includes(color)) score += 20

    // Category-specific versatility
    if (category.includes('clothing')) score += 10
    if (category.includes('accessories')) score += 15

    return Math.min(100, score + Math.random() * 10)
  }

  private assessUniqueness(product: MockAmazonProduct): number {
    const brand = this.assessBrandReputation(product.brand)
    const price = product.price.current

    // Higher-end items tend to be more unique
    let score = 50
    if (brand > 85) score += 20
    if (price > 100) score += 15

    return Math.min(100, score + Math.random() * 15)
  }

  private assessBrandStyling(product: MockAmazonProduct): number {
    return this.assessBrandReputation(product.brand) * 0.8 + Math.random() * 20
  }

  // Additional style metrics
  private assessColorHarmony(product: MockAmazonProduct): number {
    return 70 + Math.random() * 30
  }

  private assessProportionBalance(product: MockAmazonProduct): number {
    return 65 + Math.random() * 35
  }

  private assessDetailQuality(product: MockAmazonProduct): number {
    const brandScore = this.assessBrandReputation(product.brand)
    return brandScore * 0.8 + Math.random() * 20
  }

  private assessOverallCohesion(product: MockAmazonProduct): number {
    const brandScore = this.assessBrandReputation(product.brand)
    const ratingScore = product.reviews.rating * 15
    return (brandScore * 0.6) + (ratingScore * 0.4)
  }

  // Relevance assessment methods
  private assessQueryMatch(product: MockAmazonProduct, query: string): number {
    const queryLower = query.toLowerCase()
    const titleLower = product.title.toLowerCase()
    const brandLower = product.brand.toLowerCase()
    const categoryLower = product.category.toLowerCase()

    let score = 0

    // Exact title match
    if (titleLower.includes(queryLower)) score += 40

    // Individual word matches
    const queryWords = queryLower.split(' ')
    queryWords.forEach(word => {
      if (word.length > 2) {
        if (titleLower.includes(word)) score += 15
        if (brandLower.includes(word)) score += 10
        if (categoryLower.includes(word)) score += 5
      }
    })

    return Math.min(100, score)
  }

  private assessSemanticSimilarity(product: MockAmazonProduct, query: string): number {
    // Simplified semantic similarity assessment
    const queryLower = query.toLowerCase()
    const productText = `${product.title} ${product.description} ${product.brand}`.toLowerCase()

    const semanticMappings: { [key: string]: string[] } = {
      'shoes': ['footwear', 'sneakers', 'boots', 'sandals', 'athletic'],
      'clothing': ['apparel', 'wear', 'outfit', 'fashion', 'garment'],
      'jacket': ['coat', 'outerwear', 'blazer', 'hoodie'],
      'vintage': ['retro', 'classic', 'old', 'antique', 'traditional'],
      'designer': ['luxury', 'premium', 'high-end', 'exclusive']
    }

    let score = 0

    Object.entries(semanticMappings).forEach(([concept, synonyms]) => {
      if (queryLower.includes(concept)) {
        synonyms.forEach(synonym => {
          if (productText.includes(synonym)) score += 20
        })
      }
    })

    return Math.min(100, score)
  }

  private assessCategoryAlignment(product: MockAmazonProduct, query: string): number {
    const queryLower = query.toLowerCase()
    const categoryLower = product.category.toLowerCase()

    const categoryKeywords: { [key: string]: string[] } = {
      'clothing': ['shirt', 'pants', 'dress', 'jacket', 'top', 'bottom'],
      'shoes': ['shoes', 'sneakers', 'boots', 'sandals', 'footwear'],
      'accessories': ['bag', 'belt', 'watch', 'jewelry', 'sunglasses'],
      'electronics': ['phone', 'laptop', 'tablet', 'headphones', 'speaker']
    }

    const keywords = categoryKeywords[categoryLower] || []
    let score = 0

    keywords.forEach(keyword => {
      if (queryLower.includes(keyword)) score += 25
    })

    return Math.min(100, score)
  }

  private assessAttributeMatch(product: MockAmazonProduct, query: string): number {
    const queryLower = query.toLowerCase()
    let score = 0

    // Check for size mentions
    if (product.specifications.size && queryLower.includes(product.specifications.size.toLowerCase())) {
      score += 20
    }

    // Check for color mentions
    if (product.specifications.color && queryLower.includes(product.specifications.color.toLowerCase())) {
      score += 20
    }

    // Check for brand mentions
    if (queryLower.includes(product.brand.toLowerCase())) {
      score += 30
    }

    // Check for material mentions
    if (product.specifications.material && queryLower.includes(product.specifications.material.toLowerCase())) {
      score += 15
    }

    return Math.min(100, score)
  }

  private assessIntentFulfillment(product: MockAmazonProduct, query: string, contextHints?: ContextHints): number {
    let score = 70 // Base score

    // Context-based adjustments
    if (contextHints?.occasion) {
      const occasion = contextHints.occasion.toLowerCase()
      if (occasion.includes('formal') && product.category === 'CLOTHING') score += 15
      if (occasion.includes('casual') && product.category === 'CLOTHING') score += 10
      if (occasion.includes('sport') && product.category === 'SHOES') score += 20
    }

    if (contextHints?.season) {
      const season = contextHints.season
      // Simple seasonal matching logic
      if (season === 'winter' && product.title.toLowerCase().includes('winter')) score += 15
      if (season === 'summer' && product.title.toLowerCase().includes('summer')) score += 15
    }

    return Math.min(100, score)
  }

  private assessContextualRelevance(product: MockAmazonProduct, contextHints?: ContextHints): number {
    if (!contextHints) return 70

    let score = 70

    // Gift recipient context
    if (contextHints.giftRecipient && contextHints.giftRecipient !== 'self') {
      score += 5 // Gift items might have different relevance
    }

    // Replacement item context
    if (contextHints.replacementItem) {
      score += 10 // Replacement items often have higher urgency
    }

    return Math.min(100, score)
  }

  private extractMatchDetails(product: MockAmazonProduct, query: string) {
    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(' ')

    const exactMatches: string[] = []
    const synonymMatches: string[] = []
    const conceptualMatches: string[] = []
    const missingAttributes: string[] = []

    const productText = `${product.title} ${product.brand} ${product.category}`.toLowerCase()

    queryWords.forEach(word => {
      if (word.length > 2) {
        if (productText.includes(word)) {
          exactMatches.push(word)
        }
      }
    })

    // Check for missing important attributes
    if (queryWords.includes('size') && !product.specifications.size) {
      missingAttributes.push('size')
    }
    if (queryWords.includes('color') && !product.specifications.color) {
      missingAttributes.push('color')
    }

    return { exactMatches, synonymMatches, conceptualMatches, missingAttributes }
  }

  // Sustainability assessment methods
  private assessEnvironmentalImpact(product: MockAmazonProduct): number {
    let score = 60 // Base score for second-hand items (inherently better than new)

    if (product.sustainability.ecoFriendly) score += 20
    if (product.sustainability.carbonFootprint && product.sustainability.carbonFootprint < 10) score += 15
    if (product.sustainability.ethicalProduction) score += 10

    return Math.min(100, score)
  }

  private assessMaterialSustainability(product: MockAmazonProduct): number {
    let score = 50

    if (product.sustainability.sustainableMaterials) score += 30
    if (product.sustainability.certifications.length > 0) score += 20

    const material = product.specifications.material?.toLowerCase() || ''
    const sustainableMaterials = ['organic cotton', 'bamboo', 'hemp', 'recycled', 'sustainable']

    if (sustainableMaterials.some(mat => material.includes(mat))) score += 25

    return Math.min(100, score)
  }

  private assessProductionEthics(product: MockAmazonProduct): number {
    let score = 60

    if (product.sustainability.ethicalProduction) score += 25
    if (product.sustainability.certifications.includes('Fair Trade')) score += 15

    const ethicalBrands = ['patagonia', 'everlane', 'eileen fisher', 'reformation']
    if (ethicalBrands.includes(product.brand.toLowerCase())) score += 20

    return Math.min(100, score)
  }

  private assessLongevity(product: MockAmazonProduct): number {
    const durability = this.assessDurability(product)
    const quality = this.assessMaterialQuality(product)

    return (durability * 0.6) + (quality * 0.4)
  }

  private assessRecyclability(product: MockAmazonProduct): number {
    let score = 50

    if (product.sustainability.recyclable) score += 30

    const category = product.category.toLowerCase()
    if (category.includes('electronics')) score += 20 // Electronics have recycling programs
    if (category.includes('clothing')) score += 15  // Textile recycling

    return Math.min(100, score)
  }

  private assessCircularity(product: MockAmazonProduct): number {
    // Circular economy contribution
    let score = 70 // Base score for second-hand items

    if (product.sustainability.certifications.includes('Circular Economy')) score += 20
    if (product.sustainability.recyclable) score += 10

    return Math.min(100, score)
  }

  // Sustainability impact calculations
  private calculateCarbonFootprintReduction(product: MockAmazonProduct): number {
    const category = product.category.toLowerCase()
    const baseReduction: { [key: string]: number } = {
      'clothing': 15, // kg CO2
      'shoes': 12,
      'accessories': 5,
      'electronics': 25
    }

    return baseReduction[category] || 10
  }

  private calculateWaterSaved(product: MockAmazonProduct): number {
    const category = product.category.toLowerCase()
    const baseSavings: { [key: string]: number } = {
      'clothing': 2000, // liters
      'shoes': 800,
      'accessories': 300,
      'electronics': 500
    }

    return baseSavings[category] || 500
  }

  private calculateWasteReduction(product: MockAmazonProduct): number {
    const weight = parseFloat(product.specifications.weight?.split(' ')[0] || '1')
    return weight * 0.8 // Estimate waste reduction
  }

  private calculateEnergySaved(product: MockAmazonProduct): number {
    const category = product.category.toLowerCase()
    const baseSavings: { [key: string]: number } = {
      'clothing': 50, // kWh
      'shoes': 30,
      'accessories': 15,
      'electronics': 100
    }

    return baseSavings[category] || 25
  }

  // Popularity assessment methods
  private assessSalesVolume(product: MockAmazonProduct): number {
    const reviewCount = product.reviews.count
    return Math.min(100, reviewCount / 10) // Scale based on review count as proxy
  }

  private assessReviewCount(product: MockAmazonProduct): number {
    const count = product.reviews.count
    if (count > 1000) return 100
    if (count > 500) return 85
    if (count > 100) return 70
    if (count > 50) return 55
    if (count > 10) return 40
    return 25
  }

  private assessRatingDistribution(product: MockAmazonProduct): number {
    const rating = product.reviews.rating
    if (rating >= 4.5) return 95
    if (rating >= 4.0) return 85
    if (rating >= 3.5) return 70
    if (rating >= 3.0) return 55
    return 30
  }

  private assessSocialMentions(product: MockAmazonProduct): number {
    const brandScore = this.assessBrandReputation(product.brand)
    return brandScore * 0.7 + Math.random() * 30
  }

  private assessTrendingStatus(product: MockAmazonProduct): number {
    // Simple trending assessment based on recency and brand
    const daysSinceCreated = Math.floor((Date.now() - product.metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    let score = Math.max(0, 100 - daysSinceCreated * 2) // Newer items trend higher

    const trendyBrands = ['nike', 'adidas', 'apple', 'samsung']
    if (trendyBrands.includes(product.brand.toLowerCase())) score += 20

    return Math.min(100, score)
  }

  private assessMarketDemand(product: MockAmazonProduct): number {
    const category = product.category.toLowerCase()
    const demandScores: { [key: string]: number } = {
      'electronics': 85,
      'shoes': 80,
      'clothing': 75,
      'accessories': 70
    }

    return demandScores[category] || 65
  }

  private estimateSalesVelocity(product: MockAmazonProduct): number {
    return Math.min(100, product.reviews.count / 5)
  }

  private estimateSocialEngagement(product: MockAmazonProduct): number {
    const brandScore = this.assessBrandReputation(product.brand)
    const popularityRank = product.metadata.popularityRank || 100000

    return Math.min(100, brandScore * 0.6 + (100000 / popularityRank) * 0.4)
  }

  // Authenticity assessment methods
  private assessSellerVerification(seller: MockAmazonProduct['seller']): number {
    let score = 50

    if (seller.verified) score += 30
    if (seller.rating >= 4.5) score += 20
    if (seller.totalSales > 1000) score += 15
    if (seller.fulfillment === 'Amazon') score += 10

    return Math.min(100, score)
  }

  private assessProductAuthentication(product: MockAmazonProduct): number {
    let score = 60

    if (product.authenticity.verified) score += 25
    if (product.authenticity.authenticityGuarantee) score += 15

    const brandScore = this.assessBrandReputation(product.brand)
    score += brandScore * 0.2

    return Math.min(100, score)
  }

  private assessDescriptionAccuracy(product: MockAmazonProduct): number {
    // Estimate based on seller rating and verification
    const sellerRating = product.seller.rating
    return Math.min(100, sellerRating * 20 + 10)
  }

  private assessImageAuthenticity(product: MockAmazonProduct): number {
    // Basic assessment - in reality, this would use computer vision
    return 75 + Math.random() * 25
  }

  private assessBrandVerification(product: MockAmazonProduct): number {
    const brandReputation = this.assessBrandReputation(product.brand)
    return brandReputation * 0.8 + 20
  }

  private assessDocumentationProvided(product: MockAmazonProduct): number {
    // Estimate based on product authenticity settings
    if (product.authenticity.authenticityGuarantee) return 85
    if (product.authenticity.verified) return 70
    return 40
  }

  private determineSellerTrustLevel(seller: MockAmazonProduct['seller']): 'high' | 'medium' | 'low' {
    if (seller.verified && seller.rating >= 4.5 && seller.totalSales > 1000) return 'high'
    if (seller.rating >= 3.5 && seller.totalSales > 100) return 'medium'
    return 'low'
  }

  private assessImageVerification(product: MockAmazonProduct): boolean {
    return Math.random() > 0.3 // 70% chance of verified images
  }

  private assessDocumentationLevel(product: MockAmazonProduct): 'complete' | 'partial' | 'none' {
    if (product.authenticity.authenticityGuarantee) return 'complete'
    if (product.authenticity.verified) return 'partial'
    return Math.random() > 0.5 ? 'partial' : 'none'
  }

  // Availability assessment methods
  private assessStockStatus(availability: MockAmazonProduct['availability']): number {
    if (!availability.inStock) return 0
    if (availability.quantity > 10) return 100
    if (availability.quantity > 5) return 80
    if (availability.quantity > 1) return 60
    return 40
  }

  private assessShippingSpeed(availability: MockAmazonProduct['availability']): number {
    const days = availability.shippingDays
    if (days <= 1) return 100
    if (days <= 2) return 90
    if (days <= 3) return 80
    if (days <= 5) return 70
    if (days <= 7) return 60
    return 40
  }

  private assessLocationProximity(seller: MockAmazonProduct['seller']): number {
    // Simplified - in reality, this would calculate actual distance
    return 70 + Math.random() * 30
  }

  private assessSellerResponsiveness(seller: MockAmazonProduct['seller']): number {
    const rating = seller.rating
    return Math.min(100, rating * 20)
  }

  private assessFulfillmentReliability(seller: MockAmazonProduct['seller']): number {
    let score = 70

    if (seller.fulfillment === 'Amazon') score += 20
    if (seller.verified) score += 10

    return Math.min(100, score)
  }

  private assessSeasonalAvailability(product: MockAmazonProduct): number {
    // Simple seasonal assessment
    const month = new Date().getMonth()
    const category = product.category.toLowerCase()

    if (category.includes('clothing')) {
      if ([11, 0, 1].includes(month)) return 85 // Winter clothing in winter
      if ([5, 6, 7].includes(month)) return 85  // Summer clothing in summer
    }

    return 75 // Default availability
  }

  private assessPickupAvailability(seller: MockAmazonProduct['seller']): boolean {
    return Math.random() > 0.7 // 30% chance of pickup availability
  }

  // Personalization methods
  private calculatePersonalizationFactors(product: MockAmazonProduct, userProfile: UserProfile): PersonalizationFactors {
    const userPreferenceMatch = this.assessUserPreferenceMatch(product, userProfile)
    const purchaseHistoryAlignment = this.assessPurchaseHistoryAlignment(product, userProfile)
    const sizeCompatibility = this.assessSizeCompatibility(product, userProfile)
    const styleCompatibility = this.assessStyleCompatibility(product, userProfile)
    const budgetAlignment = this.assessBudgetAlignment(product, userProfile)
    const brandAffinityBonus = this.assessBrandAffinityBonus(product, userProfile)
    const contextualBonus = this.assessContextualBonus(product, userProfile)

    const totalAdjustment = (
      userPreferenceMatch * 0.25 +
      purchaseHistoryAlignment * 0.20 +
      sizeCompatibility * 0.15 +
      styleCompatibility * 0.15 +
      budgetAlignment * 0.10 +
      brandAffinityBonus * 0.10 +
      contextualBonus * 0.05
    ) - 50 // Convert to adjustment (-50 to +50)

    return {
      userPreferenceMatch,
      purchaseHistoryAlignment,
      sizeCompatibility,
      styleCompatibility,
      budgetAlignment,
      brandAffinityBonus,
      contextualBonus,
      totalAdjustment
    }
  }

  private getDefaultPersonalizationFactors(): PersonalizationFactors {
    return {
      userPreferenceMatch: 50,
      purchaseHistoryAlignment: 50,
      sizeCompatibility: 50,
      styleCompatibility: 50,
      budgetAlignment: 50,
      brandAffinityBonus: 50,
      contextualBonus: 50,
      totalAdjustment: 0
    }
  }

  private assessUserPreferenceMatch(product: MockAmazonProduct, userProfile: UserProfile): number {
    let score = 50

    // Check category preferences
    if (userProfile.preferences.categories.includes(product.category)) score += 20

    // Check brand preferences
    if (userProfile.preferences.brands.includes(product.brand)) score += 15

    // Check style preferences
    const productStyle = this.inferProductStyle(product)
    if (userProfile.preferences.styles.includes(productStyle)) score += 10

    // Check color preferences
    if (product.specifications.color && userProfile.preferences.colors.includes(product.specifications.color)) {
      score += 5
    }

    return Math.min(100, score)
  }

  private assessPurchaseHistoryAlignment(product: MockAmazonProduct, userProfile: UserProfile): number {
    let score = 50

    const history = userProfile.history.purchases
    if (history.length === 0) return score

    // Check if user has bought from this category before
    const categoryPurchases = history.filter(p => p.category === product.category)
    if (categoryPurchases.length > 0) score += 15

    // Check if user has bought from this brand before
    const brandPurchases = history.filter(p => p.brand === product.brand)
    if (brandPurchases.length > 0) score += 10

    // Check price range consistency
    const avgPrice = history.reduce((sum, p) => sum + p.price, 0) / history.length
    const priceDiff = Math.abs(product.price.current - avgPrice)
    if (priceDiff < avgPrice * 0.5) score += 5

    return Math.min(100, score)
  }

  private assessSizeCompatibility(product: MockAmazonProduct, userProfile: UserProfile): number {
    if (!product.specifications.size) return 75 // No size info, assume compatible

    const userSizes = userProfile.preferences.sizes
    if (userSizes.includes(product.specifications.size)) return 100

    return 25 // Size mismatch
  }

  private assessStyleCompatibility(product: MockAmazonProduct, userProfile: UserProfile): number {
    const productStyle = this.inferProductStyle(product)
    const userStyles = userProfile.preferences.styles

    if (userStyles.includes(productStyle)) return 90
    if (userStyles.some(style => this.areStylesCompatible(style, productStyle))) return 70

    return 40
  }

  private assessBudgetAlignment(product: MockAmazonProduct, userProfile: UserProfile): number {
    const price = product.price.current
    const budget = userProfile.preferences.priceRange

    if (price >= budget.min && price <= budget.max) return 100
    if (price < budget.min) return 80 // Under budget is good
    if (price <= budget.max * 1.2) return 60 // Slightly over budget

    return 20 // Significantly over budget
  }

  private assessBrandAffinityBonus(product: MockAmazonProduct, userProfile: UserProfile): number {
    const brandLoyalty = userProfile.behaviorPatterns.brandLoyalty
    const preferredBrands = userProfile.preferences.brands

    if (preferredBrands.includes(product.brand)) {
      if (brandLoyalty === 'high') return 90
      if (brandLoyalty === 'medium') return 70
      return 60
    }

    return 50
  }

  private assessContextualBonus(product: MockAmazonProduct, userProfile: UserProfile): number {
    let score = 50

    // Sustainability focus bonus
    if (userProfile.preferences.sustainability === 'high' && product.sustainability.ecoFriendly) {
      score += 20
    }

    // Quality preference alignment
    const productQuality = this.inferProductQuality(product)
    if (productQuality === userProfile.preferences.quality) score += 15

    return Math.min(100, score)
  }

  // Helper methods
  private inferProductStyle(product: MockAmazonProduct): string {
    const title = product.title.toLowerCase()
    const description = product.description.toLowerCase()

    if (title.includes('vintage') || description.includes('vintage')) return 'vintage'
    if (title.includes('casual') || description.includes('casual')) return 'casual'
    if (title.includes('formal') || description.includes('formal')) return 'formal'
    if (title.includes('sporty') || description.includes('sporty')) return 'sporty'
    if (title.includes('classic') || description.includes('classic')) return 'classic'

    return 'casual' // Default
  }

  private areStylesCompatible(style1: string, style2: string): boolean {
    const compatibleStyles: { [key: string]: string[] } = {
      'casual': ['sporty', 'vintage'],
      'formal': ['classic'],
      'vintage': ['classic', 'casual'],
      'sporty': ['casual'],
      'classic': ['formal', 'vintage']
    }

    return compatibleStyles[style1]?.includes(style2) || false
  }

  private inferProductQuality(product: MockAmazonProduct): 'budget' | 'mid-range' | 'premium' {
    const price = product.price.current
    const brandReputation = this.assessBrandReputation(product.brand)

    if (price > 200 || brandReputation > 90) return 'premium'
    if (price > 50 || brandReputation > 75) return 'mid-range'
    return 'budget'
  }

  // Utility methods
  private calculateWeightedScore(factors: { [key: string]: number }, weights: { [key: string]: number }): number {
    let score = 0
    let totalWeight = 0

    Object.entries(factors).forEach(([key, value]) => {
      const weight = weights[key] || 0
      score += value * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? Math.round(score / totalWeight) : 0
  }

  private calculateFactorConfidence(factors: { [key: string]: number }): number {
    const values = Object.values(factors)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length

    // Lower variance = higher confidence
    return Math.max(50, Math.min(100, 100 - (variance / 10)))
  }

  private calculateOverallScore(
    breakdown: { [key: string]: { score: number } },
    personalization: PersonalizationFactors
  ): number {
    let score = 0

    Object.entries(this.OVERALL_CATEGORY_WEIGHTS).forEach(([category, weight]) => {
      if (breakdown[category]) {
        score += breakdown[category].score * weight
      }
    })

    // Apply personalization adjustment
    score += personalization.totalAdjustment

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  private calculateScoreConfidence(
    product: MockAmazonProduct,
    breakdown: { [key: string]: { confidence: number } }
  ): number {
    const confidenceValues = Object.values(breakdown).map(b => b.confidence)
    const avgConfidence = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length

    // Adjust confidence based on data availability
    let dataAvailability = 70

    if (product.reviews.count > 50) dataAvailability += 10
    if (product.reviews.verified) dataAvailability += 5
    if (product.authenticity.verified) dataAvailability += 5
    if (product.specifications.material) dataAvailability += 5
    if (product.seller.verified) dataAvailability += 5

    return Math.round((avgConfidence * 0.7) + (dataAvailability * 0.3))
  }

  // Reasoning generation methods
  private generateScoreReasoning(
    product: MockAmazonProduct,
    breakdown: { [key: string]: { score: number } },
    overallScore: number
  ): string[] {
    const reasoning: string[] = []

    // Overall assessment
    if (overallScore >= 85) {
      reasoning.push('Excellent overall recommendation with strong performance across multiple categories')
    } else if (overallScore >= 70) {
      reasoning.push('Good choice with solid performance in key areas')
    } else if (overallScore >= 55) {
      reasoning.push('Decent option but with some areas for consideration')
    } else {
      reasoning.push('Lower overall score due to concerns in multiple categories')
    }

    // Highlight top performers
    const sortedScores = Object.entries(breakdown)
      .map(([category, data]) => ({ category, score: data.score }))
      .sort((a, b) => b.score - a.score)

    const topCategories = sortedScores.slice(0, 2)
    topCategories.forEach(({ category, score }) => {
      if (score >= 80) {
        reasoning.push(`Strong ${category} score (${score}/100) indicates high quality in this area`)
      }
    })

    // Highlight areas of concern
    const concernCategories = sortedScores.filter(({ score }) => score < 50)
    concernCategories.forEach(({ category, score }) => {
      reasoning.push(`Lower ${category} score (${score}/100) suggests potential limitations`)
    })

    return reasoning
  }

  private generateQualityReasoning(factors: { [key: string]: number }, product: MockAmazonProduct): string[] {
    const reasoning: string[] = []

    if (factors.brandReputation >= 85) {
      reasoning.push(`${product.brand} is a well-regarded brand with strong reputation`)
    }

    if (factors.materialQuality >= 80) {
      reasoning.push(`High-quality materials (${product.specifications.material}) enhance durability`)
    }

    if (factors.craftsmanship >= 80) {
      reasoning.push('Excellent craftsmanship evident in construction and finish')
    }

    if (factors.warrantySupport >= 70) {
      reasoning.push(`Good warranty coverage (${product.authenticity.warranty}) provides peace of mind`)
    }

    return reasoning
  }

  private generateValueReasoning(
    factors: { [key: string]: number },
    product: MockAmazonProduct,
    priceAnalysis: any
  ): string[] {
    const reasoning: string[] = []

    if (factors.discountValue >= 70) {
      reasoning.push(`Significant savings of ${product.price.discountPercentage}% compared to original price`)
    }

    if (factors.qualityToPrice >= 80) {
      reasoning.push('Excellent quality-to-price ratio offers strong value')
    }

    if (factors.priceComparison >= 80) {
      reasoning.push('Competitive pricing compared to similar market options')
    }

    if (product.availability.shippingCost === 0) {
      reasoning.push('Free shipping adds to overall value proposition')
    }

    return reasoning
  }

  private generateDesignReasoning(factors: { [key: string]: number }, product: MockAmazonProduct): string[] {
    const reasoning: string[] = []

    if (factors.aestheticAppeal >= 80) {
      reasoning.push('Strong aesthetic appeal with attractive design elements')
    }

    if (factors.timelessness >= 80) {
      reasoning.push('Timeless design ensures long-term style relevance')
    }

    if (factors.versatility >= 80) {
      reasoning.push('Versatile design works well with multiple styles and occasions')
    }

    return reasoning
  }

  private generateRelevanceReasoning(
    factors: { [key: string]: number },
    product: MockAmazonProduct,
    query: string
  ): string[] {
    const reasoning: string[] = []

    if (factors.queryMatch >= 80) {
      reasoning.push(`Strong match to search query "${query}"`)
    }

    if (factors.categoryAlignment >= 80) {
      reasoning.push(`Well-aligned with ${product.category} category expectations`)
    }

    if (factors.attributeMatch >= 70) {
      reasoning.push('Good match for specific product attributes mentioned')
    }

    return reasoning
  }

  private generateSustainabilityReasoning(factors: { [key: string]: number }, product: MockAmazonProduct): string[] {
    const reasoning: string[] = []

    reasoning.push('Choosing second-hand reduces environmental impact compared to new purchases')

    if (product.sustainability.ecoFriendly) {
      reasoning.push('Product has eco-friendly certifications')
    }

    if (product.sustainability.sustainableMaterials) {
      reasoning.push('Made with sustainable materials')
    }

    if (factors.longevity >= 80) {
      reasoning.push('High durability means longer product lifespan')
    }

    if (product.sustainability.recyclable) {
      reasoning.push('Recyclable materials support circular economy')
    }

    return reasoning
  }

  private generatePopularityReasoning(factors: { [key: string]: number }, product: MockAmazonProduct): string[] {
    const reasoning: string[] = []

    if (product.reviews.count > 100) {
      reasoning.push(`High review count (${product.reviews.count}) indicates proven popularity`)
    }

    if (product.reviews.rating >= 4.0) {
      reasoning.push(`Strong rating (${product.reviews.rating}/5) shows customer satisfaction`)
    }

    if (factors.trendingStatus >= 80) {
      reasoning.push('Currently trending in the market')
    }

    return reasoning
  }

  private generateAuthenticityReasoning(factors: { [key: string]: number }, product: MockAmazonProduct): string[] {
    const reasoning: string[] = []

    if (product.authenticity.verified) {
      reasoning.push('Product authenticity has been verified')
    }

    if (product.seller.verified) {
      reasoning.push('Seller is verified with good reputation')
    }

    if (product.seller.rating >= 4.0) {
      reasoning.push(`Seller has strong rating (${product.seller.rating}/5)`)
    }

    if (product.authenticity.authenticityGuarantee) {
      reasoning.push('Comes with authenticity guarantee')
    }

    return reasoning
  }

  private generateAvailabilityReasoning(factors: { [key: string]: number }, product: MockAmazonProduct): string[] {
    const reasoning: string[] = []

    if (product.availability.inStock) {
      reasoning.push(`In stock with ${product.availability.quantity} units available`)
    }

    if (product.availability.shippingDays <= 2) {
      reasoning.push(`Fast shipping (${product.availability.shippingDays} days)`)
    }

    if (product.availability.shippingCost === 0) {
      reasoning.push('Free shipping available')
    }

    if (product.availability.expeditedShipping) {
      reasoning.push('Expedited shipping options available')
    }

    return reasoning
  }
}

// Export singleton instance
export const productScoringEngine = new ProductScoringEngine()
export default ProductScoringEngine