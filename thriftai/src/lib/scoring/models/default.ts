/**
 * Default Scoring Model
 * Phase 2.6: Category-Specific Scoring
 *
 * Universal scoring model that works for all product categories
 * Uses default weights when category-specific models aren't available
 */

import { CategoryScoringModel, ProductForScoring, ProductCategory, VeritasWeights } from '../category-models'

export class DefaultScoringModel extends CategoryScoringModel {
  constructor(weights: VeritasWeights) {
    super(ProductCategory.DEFAULT, weights)
  }

  protected async scoreProductQuality(product: ProductForScoring): Promise<number> {
    let score = 50

    // Condition scoring
    const conditionScores: Record<string, number> = {
      'NEW': 30,
      'LIKE_NEW': 25,
      'REFURBISHED': 20,
      'USED': 15,
      'FOR_PARTS': 5
    }
    if (product.condition && conditionScores[product.condition]) {
      score += conditionScores[product.condition]
    }

    // Brand presence
    if (product.brand) score += 10

    // Warranty
    if (product.hasWarranty || product.warrantyPeriod) score += 10

    return Math.max(0, Math.min(100, score))
  }

  protected async scoreProductSpecification(product: ProductForScoring): Promise<number> {
    let specCount = 0

    // Count direct columns
    if (product.color) specCount++
    if (product.material) specCount++
    if (product.productSize) specCount++
    if (product.gender) specCount++
    if (product.productStyle) specCount++
    if (product.warrantyPeriod) specCount++
    if (product.durabilityRating) specCount++

    // Count EAV attributes
    if (product.attributes) specCount += product.attributes.length

    // Score based on completeness
    if (specCount >= 10) return 100
    if (specCount >= 7) return 75
    if (specCount >= 4) return 50
    if (specCount >= 1) return 25
    return 0
  }

  protected async scoreSustainability(product: ProductForScoring): Promise<number> {
    let score = 50

    // Condition-based (used/refurb = better for environment)
    const sustainabilityScores: Record<string, number> = {
      'USED': 25,
      'REFURBISHED': 30,
      'LIKE_NEW': 15,
      'NEW': 0,
      'FOR_PARTS': 20
    }
    if (product.condition && sustainabilityScores[product.condition]) {
      score += sustainabilityScores[product.condition]
    }

    // Certifications
    if (product.certifications && product.certifications.length > 0) {
      score += Math.min(product.certifications.length * 5, 25)
    }

    return Math.max(0, Math.min(100, score))
  }
}

// Export other category models with sensible defaults
export class ClothingScoringModel extends DefaultScoringModel {
  constructor(weights: VeritasWeights) {
    super(weights)
    this.category = ProductCategory.CLOTHING
  }

  protected async scoreSustainability(product: ProductForScoring): Promise<number> {
    // Clothing has higher sustainability weight (10%)
    const base = await super.scoreSustainability(product)

    // Bonus for sustainable materials
    if (product.material) {
      const sustainableMaterials = ['organic', 'recycled', 'sustainable', 'eco', 'bamboo', 'hemp']
      if (sustainableMaterials.some(m => product.material!.toLowerCase().includes(m))) {
        return Math.min(base + 20, 100)
      }
    }

    return base
  }
}

export class ShoesScoringModel extends DefaultScoringModel {
  constructor(weights: VeritasWeights) {
    super(weights)
    this.category = ProductCategory.SHOES
  }

  protected async scoreProductQuality(product: ProductForScoring): Promise<number> {
    // Shoes prioritize quality (45%)
    let score = await super.scoreProductQuality(product)

    // Bonus for durability rating
    if (product.durabilityRating) {
      const durabilityBonus: Record<string, number> = {
        'EXCELLENT': 15,
        'GOOD': 10,
        'FAIR': 5,
        'POOR': 0
      }
      score += durabilityBonus[product.durabilityRating.toUpperCase()] || 0
    }

    return Math.min(score, 100)
  }
}

export class AccessoriesScoringModel extends DefaultScoringModel {
  constructor(weights: VeritasWeights) {
    super(weights)
    this.category = ProductCategory.ACCESSORIES
  }

  protected async scoreMarketValue(product: ProductForScoring): Promise<number> {
    // Accessories have balanced quality/price (35% each)
    const base = await super.scoreMarketValue(product)

    // Accessories are often impulse purchases, so lower price = higher score
    const price = Number(product.price)
    if (price < 50) {
      return Math.min(base + 15, 100)
    }

    return base
  }
}

export class HomeScoringModel extends DefaultScoringModel {
  constructor(weights: VeritasWeights) {
    super(weights)
    this.category = ProductCategory.HOME
  }

  protected async scoreSustainability(product: ProductForScoring): Promise<number> {
    // Home goods have HIGH sustainability focus (20%)
    const base = await super.scoreSustainability(product)

    // Bonus for eco-friendly materials
    if (product.material) {
      const ecoMaterials = ['recycled', 'sustainable', 'eco-friendly', 'natural', 'organic', 'biodegradable']
      if (ecoMaterials.some(m => product.material!.toLowerCase().includes(m))) {
        return Math.min(base + 25, 100)
      }
    }

    return base
  }

  protected async scoreProductQuality(product: ProductForScoring): Promise<number> {
    // Home goods prioritize durability (40%)
    let score = await super.scoreProductQuality(product)

    // Significant bonus for durability
    if (product.durabilityRating) {
      const durabilityBonus: Record<string, number> = {
        'EXCELLENT': 20,
        'GOOD': 15,
        'FAIR': 8,
        'POOR': 0
      }
      score += durabilityBonus[product.durabilityRating.toUpperCase()] || 0
    }

    return Math.min(score, 100)
  }
}
