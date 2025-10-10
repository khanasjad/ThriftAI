/**
 * Carbon Footprint Calculator
 * FREE - Pure calculations, no API required
 *
 * Calculates environmental impact savings from buying used products:
 * - Carbon footprint reduction (kg CO2)
 * - E-waste prevention
 * - Resource conservation score
 * - Environmental impact percentage
 *
 * Coverage: +5 parameters for Sustainability category
 */

import { logger } from '@/lib/logger'

export interface CarbonFootprintData {
  productCategory: string
  condition: string
  baselineCarbonKg: number // New product carbon footprint
  carbonSavedKg: number // Carbon saved by buying used
  reductionPercent: number // Percentage reduction
  eWastePrevented: boolean
  resourceConservationScore: number // 0-100
  equivalentTrees: number // Trees needed to offset
  equivalentMiles: number // Car miles equivalent
}

// Baseline carbon footprints for new products (kg CO2)
// Sources: EPA, Carbon Trust, academic studies
const BASELINE_CARBON_FOOTPRINTS: Record<string, number> = {
  // Electronics
  'ELECTRONICS': 300,
  'Smartphone': 85,
  'Laptop': 300,
  'Desktop': 480,
  'Tablet': 130,
  'TV': 500,
  'Monitor': 230,
  'Camera': 50,
  'Headphones': 15,
  'Smartwatch': 25,
  'Gaming Console': 100,

  // Fashion
  'FASHION': 20,
  'Jeans': 33,
  'T-Shirt': 7,
  'Jacket': 50,
  'Shoes': 14,
  'Dress': 20,
  'Sweater': 25,

  // Accessories
  'ACCESSORIES': 15,
  'Handbag': 35,
  'Backpack': 20,
  'Watch': 40,
  'Sunglasses': 8,

  // Furniture
  'FURNITURE': 100,
  'Chair': 75,
  'Table': 150,
  'Sofa': 250,
  'Bed': 200,
  'Desk': 120,

  // Collectibles
  'COLLECTIBLES': 10,

  // Sports
  'SPORTS': 30,
  'Bicycle': 240,
  'Skateboard': 25,
  'Tennis Racket': 12,

  // Books
  'BOOKS': 2,

  // Default
  'DEFAULT': 50
}

// Condition multipliers (how much carbon is saved)
const CONDITION_MULTIPLIERS: Record<string, number> = {
  'New': 0.0,           // No savings, it's a new product
  'Like New': 0.95,     // 95% carbon savings
  'Excellent': 0.90,    // 90% carbon savings
  'Good': 0.85,         // 85% carbon savings
  'Fair': 0.75,         // 75% carbon savings
  'Poor': 0.60,         // 60% carbon savings (still saves resources)
  'Acceptable': 0.70    // 70% carbon savings
}

/**
 * Calculate carbon footprint for a product
 */
export function calculateCarbonFootprint(
  productName: string,
  category: string,
  condition: string
): CarbonFootprintData {
  try {
    logger.info('🌱 Calculating carbon footprint', {
      component: 'CarbonCalculator',
      metadata: {
        product: productName,
        category,
        condition
      }
    })

    // Get baseline carbon footprint
    let baselineCarbonKg = BASELINE_CARBON_FOOTPRINTS[category]
      || BASELINE_CARBON_FOOTPRINTS[category.toUpperCase()]
      || BASELINE_CARBON_FOOTPRINTS['DEFAULT']

    // Try to match product name for more accurate baseline
    for (const [key, value] of Object.entries(BASELINE_CARBON_FOOTPRINTS)) {
      if (productName.toLowerCase().includes(key.toLowerCase())) {
        baselineCarbonKg = value
        break
      }
    }

    // Get condition multiplier
    const conditionMultiplier = CONDITION_MULTIPLIERS[condition] || 0.75

    // Calculate carbon saved
    const carbonSavedKg = baselineCarbonKg * conditionMultiplier
    const reductionPercent = conditionMultiplier * 100

    // E-waste prevention (buying used prevents new production)
    const eWastePrevented = condition !== 'New'

    // Resource conservation score
    const resourceConservationScore = Math.round(
      (conditionMultiplier * 60) + // Base conservation from buying used
      (eWastePrevented ? 40 : 0)    // Bonus for e-waste prevention
    )

    // Convert to relatable equivalents
    // 1 tree absorbs ~21 kg CO2 per year
    const equivalentTrees = Math.round((carbonSavedKg / 21) * 10) / 10

    // Average car emits 404g CO2 per mile
    const equivalentMiles = Math.round((carbonSavedKg / 0.404) * 10) / 10

    const result: CarbonFootprintData = {
      productCategory: category,
      condition,
      baselineCarbonKg: Math.round(baselineCarbonKg * 10) / 10,
      carbonSavedKg: Math.round(carbonSavedKg * 10) / 10,
      reductionPercent: Math.round(reductionPercent),
      eWastePrevented,
      resourceConservationScore,
      equivalentTrees,
      equivalentMiles
    }

    logger.info('✅ Carbon footprint calculated', {
      component: 'CarbonCalculator',
      metadata: {
        carbonSavedKg: result.carbonSavedKg,
        reductionPercent: result.reductionPercent
      }
    })

    return result

  } catch (error) {
    logger.error('❌ Carbon calculation failed', {
      component: 'CarbonCalculator',
      error: error instanceof Error ? error.message : String(error)
    })

    // Return safe defaults
    return {
      productCategory: category,
      condition,
      baselineCarbonKg: 50,
      carbonSavedKg: 37.5,
      reductionPercent: 75,
      eWastePrevented: true,
      resourceConservationScore: 75,
      equivalentTrees: 1.8,
      equivalentMiles: 92.8
    }
  }
}

/**
 * Calculate environmental impact score (0-100)
 */
export function calculateEnvironmentalImpactScore(data: CarbonFootprintData): number {
  let score = 0

  // Carbon reduction score (0-40 points)
  score += (data.reductionPercent / 100) * 40

  // E-waste prevention (0-30 points)
  score += data.eWastePrevented ? 30 : 0

  // Resource conservation (0-30 points)
  score += (data.resourceConservationScore / 100) * 30

  return Math.round(score)
}

/**
 * Get human-readable carbon savings message
 */
export function getCarbonSavingsMessage(data: CarbonFootprintData): string {
  if (data.condition === 'New') {
    return 'This is a new product with full environmental impact.'
  }

  const messages: string[] = []

  messages.push(`Saves ${data.carbonSavedKg}kg of CO2 emissions`)

  if (data.equivalentTrees >= 1) {
    messages.push(`equivalent to planting ${data.equivalentTrees} ${data.equivalentTrees === 1 ? 'tree' : 'trees'}`)
  }

  if (data.equivalentMiles >= 100) {
    messages.push(`or not driving ${Math.round(data.equivalentMiles)} miles`)
  }

  if (data.eWastePrevented) {
    messages.push('and prevents electronic waste')
  }

  return messages.join(', ') + '.'
}

/**
 * Calculate circular economy metrics
 */
export interface CircularEconomyMetrics {
  reuseFactor: number // 0-100, lifespan extension
  recyclingPotential: number // 0-100, material recyclability
  secondLifePotential: number // 0-100, future resale value
}

export function calculateCircularEconomy(
  category: string,
  condition: string,
  brand: string
): CircularEconomyMetrics {
  // Reuse factor based on condition
  const conditionReuse: Record<string, number> = {
    'New': 100,
    'Like New': 95,
    'Excellent': 90,
    'Good': 80,
    'Fair': 65,
    'Poor': 45,
    'Acceptable': 70
  }

  const reuseFactor = conditionReuse[condition] || 70

  // Recycling potential based on category
  const categoryRecyclability: Record<string, number> = {
    'ELECTRONICS': 85,  // High metal content
    'FASHION': 60,      // Moderate textile recycling
    'FURNITURE': 70,    // Wood can be recycled
    'ACCESSORIES': 75,  // Leather/metal recyclable
    'COLLECTIBLES': 50  // Often not recyclable
  }

  const recyclingPotential = categoryRecyclability[category.toUpperCase()] || 60

  // Brand quality affects second life potential
  const premiumBrands = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Dell', 'HP']
  const brandBonus = premiumBrands.includes(brand) ? 15 : 0

  const secondLifePotential = Math.min(100, reuseFactor + brandBonus)

  return {
    reuseFactor,
    recyclingPotential,
    secondLifePotential
  }
}
