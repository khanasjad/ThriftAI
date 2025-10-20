/**
 * Electronics Category Scoring Model
 * Phase 2.6: Category-Specific Scoring
 *
 * Research Base (PMC 2024, Consumer Reports 2025):
 * - Electronics buyers prioritize specifications (35%) and quality (30%)
 * - Technical specs are PRIMARY decision factor (CPU, RAM, storage, etc.)
 * - Brand reputation more important than general company metrics
 * - Lower sustainability focus compared to other categories
 *
 * Category Weights:
 * - Product Quality: 30% (functionality, defect rate, warranty)
 * - Product Specification: 30% (technical specs completeness)
 * - Market Value: 25% (price comparison critical for high-value items)
 * - Seller Trust: 10% (brands carry more weight)
 * - Sustainability: 3% (lower priority)
 * - Company Performance: 2% (brand > company)
 */

import { CategoryScoringModel, ProductForScoring, ProductCategory, VeritasWeights } from '../category-models'

export class ElectronicsScoringModel extends CategoryScoringModel {
  constructor(weights: VeritasWeights) {
    super(ProductCategory.ELECTRONICS, weights)
  }

  protected async scoreProductQuality(product: ProductForScoring): Promise<number> {
    let score = 50 // Base score

    // Condition (0-30 points)
    const conditionScores: Record<string, number> = {
      'NEW': 30,
      'LIKE_NEW': 25,
      'REFURBISHED': 20,
      'USED': 10,
      'FOR_PARTS': 0
    }
    if (product.condition && conditionScores[product.condition]) {
      score += conditionScores[product.condition]
    }

    // Brand reputation for electronics (0-25 points)
    const premiumBrands = ['APPLE', 'SAMSUNG', 'SONY', 'LG', 'DELL', 'HP', 'LENOVO', 'ASUS', 'MICROSOFT']
    if (product.brand && premiumBrands.includes(product.brand.toUpperCase())) {
      score += 25
    } else if (product.brand) {
      score += 10 // Generic brand
    }

    // Warranty (0-20 points) - CRITICAL for electronics
    if (product.hasWarranty || product.warrantyPeriod) {
      const warrantyYears = this.parseWarrantyYears(product.warrantyPeriod)
      score += Math.min(warrantyYears * 10, 20)
    }

    // Certifications (0-15 points) - FCC, CE, UL, etc.
    if (product.certifications && product.certifications.length > 0) {
      score += Math.min(product.certifications.length * 5, 15)
    }

    // Durability rating (0-10 points)
    if (product.durabilityRating) {
      const durabilityScores: Record<string, number> = {
        'EXCELLENT': 10,
        'GOOD': 7,
        'FAIR': 4,
        'POOR': 0
      }
      score += durabilityScores[product.durabilityRating.toUpperCase()] || 0
    }

    return Math.max(0, Math.min(100, score))
  }

  protected async scoreProductSpecification(product: ProductForScoring): Promise<number> {
    let score = 0

    // For electronics, specifications are CRITICAL
    // Count meaningful technical specs

    const technicalSpecs = [
      'cpu', 'processor', 'ram', 'memory', 'storage', 'ssd', 'hdd',
      'gpu', 'graphics', 'display', 'screen', 'resolution',
      'battery', 'connectivity', 'ports', 'os', 'operating system',
      'camera', 'sensor', 'chipset', 'frequency', 'bandwidth'
    ]

    let specCount = 0

    // Check direct columns (Phase 2.2)
    if (product.material) specCount++
    if (product.color) specCount++

    // Check EAV attributes (Phase 2.2)
    if (product.attributes) {
      for (const attr of product.attributes) {
        const keyLower = attr.attributeKey.toLowerCase()
        if (technicalSpecs.some(spec => keyLower.includes(spec))) {
          specCount++
        }
      }
    }

    // Check dynamicSpecs (legacy JSON)
    if (product.dynamicSpecs && typeof product.dynamicSpecs === 'object') {
      const specs = product.dynamicSpecs as Record<string, any>
      for (const key of Object.keys(specs)) {
        const keyLower = key.toLowerCase()
        if (technicalSpecs.some(spec => keyLower.includes(spec))) {
          specCount++
        }
      }
    }

    // Scoring based on spec count
    // 0-2 specs = 25, 3-5 specs = 50, 6-10 specs = 75, 11+ specs = 100
    if (specCount >= 11) {
      score = 100
    } else if (specCount >= 6) {
      score = 75
    } else if (specCount >= 3) {
      score = 50
    } else if (specCount > 0) {
      score = 25
    } else {
      score = 0
    }

    return score
  }

  protected async scoreSustainability(product: ProductForScoring): Promise<number> {
    let score = 50 // Neutral base

    // For electronics, sustainability mainly comes from:
    // 1. Refurbished/Used (extends lifecycle)
    // 2. Energy efficiency certifications
    // 3. Recyclable materials

    // Condition-based sustainability (refurb/used = better for environment)
    const sustainabilityByCondition: Record<string, number> = {
      'REFURBISHED': 30,   // High score: professional restoration
      'USED': 25,          // Good score: reuse
      'LIKE_NEW': 15,      // Moderate: reduced packaging
      'NEW': 0,            // No bonus
      'FOR_PARTS': 20      // Recycling components
    }
    if (product.condition && sustainabilityByCondition[product.condition]) {
      score += sustainabilityByCondition[product.condition]
    }

    // Energy efficiency certifications (Energy Star, EPEAT, etc.)
    if (product.certifications) {
      const ecoCerts = ['ENERGY STAR', 'EPEAT', 'RoHS', 'WEEE', 'TCO']
      const hasEcoCert = product.certifications.some(cert =>
        ecoCerts.some(eco => cert.toUpperCase().includes(eco))
      )
      if (hasEcoCert) score += 20
    }

    // Recyclable attributes
    const recyclableKeys = ['recyclable', 'eco-friendly', 'sustainable']
    if (product.attributes) {
      const hasRecyclable = product.attributes.some(attr =>
        recyclableKeys.some(key => attr.attributeKey.toLowerCase().includes(key))
      )
      if (hasRecyclable) score += 5
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Helper: Parse warranty period into years
   */
  private parseWarrantyYears(warrantyPeriod?: string | null): number {
    if (!warrantyPeriod) return 0

    const match = warrantyPeriod.match(/(\d+)\s*(year|yr|y)/i)
    if (match) {
      return parseInt(match[1], 10)
    }

    const monthMatch = warrantyPeriod.match(/(\d+)\s*(month|mo|m)/i)
    if (monthMatch) {
      return parseInt(monthMatch[1], 10) / 12
    }

    return 1 // Default 1 year if warranty exists but format unclear
  }
}
