/**
 * Open Food Facts API Integration
 *
 * FREE - No authentication required (only User-Agent header)
 * Documentation: https://openfoodfacts.github.io/openfoodfacts-server/api/
 *
 * Provides nutrition, ingredients, allergens, and sustainability data for food products
 */

export interface FoodProduct {
  code: string // Barcode
  product_name: string
  brands: string
  categories: string
  labels: string
  image_url?: string
  image_nutrition_url?: string
  nutriments: Nutriments
  ingredients_text?: string
  allergens?: string
  traces?: string
  nutrition_grades?: string // A to E (Nutri-Score)
  nova_group?: number // 1 to 4 (NOVA food processing level)
  ecoscore_grade?: string // A to E (Eco-Score)
  ecoscore_score?: number
  nutrient_levels?: NutrientLevels
  additives_tags?: string[]
  serving_size?: string
  countries?: string
  manufacturing_places?: string
}

export interface Nutriments {
  energy_value?: number
  energy_unit?: string
  'energy-kcal_value'?: number
  'energy-kcal_unit'?: string
  fat_value?: number
  'saturated-fat_value'?: number
  carbohydrates_value?: number
  sugars_value?: number
  fiber_value?: number
  proteins_value?: number
  salt_value?: number
  sodium_value?: number
  'nutrition-score-fr'?: number // Nutri-Score calculation
}

export interface NutrientLevels {
  fat?: 'low' | 'moderate' | 'high'
  'saturated-fat'?: 'low' | 'moderate' | 'high'
  sugars?: 'low' | 'moderate' | 'high'
  salt?: 'low' | 'moderate' | 'high'
}

export interface FoodParameters {
  // Nutrition Quality (10 parameters)
  nutriScore: string | null // A-E grade
  nutriScoreValue: number | null
  novaGroup: number | null // 1-4 (processing level)
  nutritionQuality: number // 0-100

  // Health & Safety (8 parameters)
  allergens: string[]
  additives: string[]
  traces: string[]
  healthScore: number // 0-100

  // Sustainability (7 parameters)
  ecoScore: string | null // A-E grade
  ecoScoreValue: number | null
  sustainabilityScore: number // 0-100

  // Product Info
  productName: string
  brand: string
  categories: string[]
  labels: string[]
  ingredients: string | null

  // Metadata
  hasNutritionData: boolean
  hasEcoScore: boolean
  dataQuality: 'high' | 'medium' | 'low'
}

const USER_AGENT = 'ThriftAI-VeritasScore/1.0 (https://thriftai.com; contact@thriftai.com)'

/**
 * Search for a food product by name
 */
export async function searchFoodProducts(query: string, page: number = 1): Promise<FoodProduct[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page=${page}&page_size=20&json=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.warn(`Open Food Facts API returned ${response.status}`)
      return []
    }

    const data = await response.json()
    return data.products || []
  } catch (error) {
    console.error('Error searching Open Food Facts:', error)
    return []
  }
}

/**
 * Get product by barcode
 */
export async function getProductByBarcode(barcode: string): Promise<FoodProduct | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.status === 1 ? data.product : null
  } catch (error) {
    console.error('Error fetching product by barcode:', error)
    return null
  }
}

/**
 * Get food parameters for Veritas Score
 */
export async function getFoodParameters(productName: string, barcode?: string): Promise<FoodParameters> {
  try {
    let product: FoodProduct | null = null

    // Try barcode first if available
    if (barcode) {
      product = await getProductByBarcode(barcode)
    }

    // Fall back to search if no barcode or barcode failed
    if (!product) {
      const results = await searchFoodProducts(productName)
      product = results[0] || null
    }

    if (!product) {
      return createEmptyParameters(productName)
    }

    // Calculate scores
    const nutritionQuality = calculateNutritionQuality(product)
    const healthScore = calculateHealthScore(product)
    const sustainabilityScore = calculateSustainabilityScore(product)
    const dataQuality = assessDataQuality(product)

    return {
      // Nutrition
      nutriScore: product.nutrition_grades || null,
      nutriScoreValue: product.nutriments?.['nutrition-score-fr'] || null,
      novaGroup: product.nova_group || null,
      nutritionQuality,

      // Health
      allergens: parseCommaSeparated(product.allergens),
      additives: product.additives_tags || [],
      traces: parseCommaSeparated(product.traces),
      healthScore,

      // Sustainability
      ecoScore: product.ecoscore_grade || null,
      ecoScoreValue: product.ecoscore_score || null,
      sustainabilityScore,

      // Product info
      productName: product.product_name || productName,
      brand: product.brands || '',
      categories: parseCommaSeparated(product.categories),
      labels: parseCommaSeparated(product.labels),
      ingredients: product.ingredients_text || null,

      // Metadata
      hasNutritionData: !!(product.nutriments && Object.keys(product.nutriments).length > 0),
      hasEcoScore: !!product.ecoscore_grade,
      dataQuality
    }
  } catch (error) {
    console.error('Error getting food parameters:', error)
    return createEmptyParameters(productName)
  }
}

// Helper functions

function createEmptyParameters(productName: string): FoodParameters {
  return {
    nutriScore: null,
    nutriScoreValue: null,
    novaGroup: null,
    nutritionQuality: 50,
    allergens: [],
    additives: [],
    traces: [],
    healthScore: 50,
    ecoScore: null,
    ecoScoreValue: null,
    sustainabilityScore: 50,
    productName,
    brand: '',
    categories: [],
    labels: [],
    ingredients: null,
    hasNutritionData: false,
    hasEcoScore: false,
    dataQuality: 'low'
  }
}

function calculateNutritionQuality(product: FoodProduct): number {
  let score = 50 // Base score

  // Nutri-Score (A=100, B=80, C=60, D=40, E=20)
  if (product.nutrition_grades) {
    const gradeScores: Record<string, number> = { a: 100, b: 80, c: 60, d: 40, e: 20 }
    score = gradeScores[product.nutrition_grades.toLowerCase()] || 50
  }

  // NOVA group penalty (1=best, 4=worst)
  if (product.nova_group) {
    score -= (product.nova_group - 1) * 10
  }

  return Math.max(0, Math.min(100, score))
}

function calculateHealthScore(product: FoodProduct): number {
  let score = 80 // Start high, deduct for issues

  // Allergens penalty
  const allergenCount = parseCommaSeparated(product.allergens).length
  score -= allergenCount * 5

  // Additives penalty
  const additiveCount = (product.additives_tags || []).length
  score -= additiveCount * 3

  // Nutrient levels penalty
  if (product.nutrient_levels) {
    const levels = product.nutrient_levels
    if (levels.fat === 'high') score -= 10
    if (levels['saturated-fat'] === 'high') score -= 10
    if (levels.sugars === 'high') score -= 10
    if (levels.salt === 'high') score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

function calculateSustainabilityScore(product: FoodProduct): number {
  let score = 50 // Base score

  // Eco-Score (A=100, B=80, C=60, D=40, E=20)
  if (product.ecoscore_grade) {
    const gradeScores: Record<string, number> = { a: 100, b: 80, c: 60, d: 40, e: 20 }
    score = gradeScores[product.ecoscore_grade.toLowerCase()] || 50
  }

  // Labels bonus (organic, fair trade, etc.)
  const labels = parseCommaSeparated(product.labels)
  const sustainableLabels = labels.filter(l =>
    l.toLowerCase().includes('organic') ||
    l.toLowerCase().includes('fair') ||
    l.toLowerCase().includes('sustainable')
  )
  score += sustainableLabels.length * 5

  return Math.max(0, Math.min(100, score))
}

function assessDataQuality(product: FoodProduct): 'high' | 'medium' | 'low' {
  let dataPoints = 0

  if (product.product_name) dataPoints++
  if (product.brands) dataPoints++
  if (product.nutriments && Object.keys(product.nutriments).length > 5) dataPoints++
  if (product.ingredients_text) dataPoints++
  if (product.nutrition_grades) dataPoints++
  if (product.ecoscore_grade) dataPoints++
  if (product.categories) dataPoints++
  if (product.labels) dataPoints++

  if (dataPoints >= 6) return 'high'
  if (dataPoints >= 3) return 'medium'
  return 'low'
}

function parseCommaSeparated(value: string | undefined): string[] {
  if (!value) return []
  return value.split(',').map(s => s.trim()).filter(Boolean)
}
