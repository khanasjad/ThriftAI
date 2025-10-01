/**
 * Dynamic Parameter Extractor
 *
 * Uses AI (Claude/OpenAI) to extract category-specific product specifications
 * from product titles, descriptions, and other metadata.
 *
 * Handles 25 dynamic parameters that vary by product category:
 * - Electronics: CPU, RAM, storage, screen, battery, camera, etc.
 * - Clothing: Fabric, size accuracy, care instructions, color fastness
 * - Shoes: Sole material, cushioning, weight, breathability
 * - Home & Kitchen: Material safety, capacity, insulation
 * - Sports & Fitness: Durability, weather resistance
 * - Universal: AI-detected unique features
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  DynamicSpecs,
  ElectronicsSpecs,
  ClothingSpecs,
  ShoesSpecs,
  HomeKitchenSpecs,
  SportsSpecs,
  UniversalSpecs,
  ProductCategory
} from '@/lib/types/aiScoring96'
import { logger } from '@/lib/logger'

// ========================================
// CONFIGURATION
// ========================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || ''
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// ========================================
// DYNAMIC PARAMETER EXTRACTOR SERVICE
// ========================================

export class DynamicParameterExtractor {
  /**
   * Extract dynamic specifications for a product
   */
  async extractSpecs(
    productName: string,
    description: string | null,
    category: ProductCategory,
    additionalData?: {
      brand?: string
      price?: number
      condition?: string
      images?: string[]
    }
  ): Promise<DynamicSpecs> {
    try {
      logger.info('Extracting dynamic specs', {
        productName,
        category,
        hasDescription: !!description
      })

      // Build extraction prompt based on category
      const prompt = this.buildExtractionPrompt(
        productName,
        description,
        category,
        additionalData
      )

      // Call Claude API
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      // Parse response
      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      const specs = this.parseSpecsResponse(content.text, category)

      logger.info('Successfully extracted specs', {
        productName,
        category,
        specsCount: Object.keys(specs).length
      })

      return specs
    } catch (error) {
      logger.error('Error extracting dynamic specs', {
        productName,
        category,
        error: error instanceof Error ? error.message : String(error)
      })

      // Return empty specs on error
      return this.getDefaultSpecs(category)
    }
  }

  /**
   * Build extraction prompt based on product category
   */
  private buildExtractionPrompt(
    productName: string,
    description: string | null,
    category: ProductCategory,
    additionalData?: any
  ): string {
    const basePrompt = `You are a product specification extractor. Extract structured product specifications from the following product information.

Product Name: ${productName}
Category: ${category}
${additionalData?.brand ? `Brand: ${additionalData.brand}` : ''}
${additionalData?.price ? `Price: $${additionalData.price}` : ''}
${additionalData?.condition ? `Condition: ${additionalData.condition}` : ''}

Description:
${description || 'No description provided'}

`

    // Category-specific extraction instructions
    const categoryInstructions = this.getCategoryInstructions(category)

    const formatInstructions = `
OUTPUT FORMAT:
Return ONLY a valid JSON object with the extracted specifications. Do not include any explanation or markdown formatting.

Example format:
${this.getExampleFormat(category)}

IMPORTANT:
- Only include fields where you found actual information
- If a specification is not mentioned, omit that field entirely
- Use null only if the specification is explicitly stated as "not available" or "none"
- For arrays, always use bracket notation
- For numbers, do not include units in the value (put units in a separate field if needed)
`

    return basePrompt + categoryInstructions + formatInstructions
  }

  /**
   * Get category-specific extraction instructions
   */
  private getCategoryInstructions(category: ProductCategory): string {
    const instructions: Record<ProductCategory, string> = {
      ELECTRONICS: `
Extract these specifications (if mentioned):
- cpu: Processor name/model (e.g., "Intel Core i7-12700K", "Apple A17 Pro")
- cpuBenchmark: Performance score if available
- ram: RAM capacity in GB (just the number)
- storage: Storage description (e.g., "512GB SSD", "1TB NVMe")
- screen: Screen description (e.g., "15.6 inch, 4K OLED")
- screenType: Display technology (OLED, LCD, IPS, Retina, etc.)
- battery: Battery description (e.g., "5000mAh, 18 hours", "100Wh")
- camera: Camera specifications (e.g., "48MP + 12MP, Night Mode")
- connectivity: Array of connectivity options (e.g., ["5G", "WiFi 6E", "Bluetooth 5.3"])
- os: Operating system and version (e.g., "iOS 17", "Windows 11")
- waterproof: IP rating (e.g., "IP68", "IPX7")
- gpu: Graphics card (e.g., "NVIDIA RTX 4090", "Integrated")
`,
      CLOTHING: `
Extract these specifications (if mentioned):
- fabric: Main material description (e.g., "100% Organic Cotton", "Polyester blend")
- fabricComposition: Detailed array like [{"material": "Cotton", "percentage": 60}, {"material": "Polyester", "percentage": 40}]
- sizeAccuracy: Fit description (e.g., "True to size", "Runs small", "Runs large")
- sizeAccuracyScore: Percentage 0-100 if mentioned in reviews
- careInstructions: Care requirements (e.g., "Machine washable", "Dry clean only", "Hand wash cold")
- colorFastness: Color durability rating 1-5 if mentioned
`,
      SHOES: `
Extract these specifications (if mentioned):
- soleMaterial: Sole material and type (e.g., "Rubber outsole with multi-directional tread", "Vibram")
- gripRating: Traction/grip rating 1-5 if mentioned
- cushioning: Cushioning technology (e.g., "Nike Air", "Adidas Boost", "Memory Foam")
- weight: Weight per shoe in grams (just the number)
- breathability: Breathability rating 1-5 if mentioned
`,
      HOME: `
Extract these specifications (if mentioned):
- materialSafety: Array of safety certifications (e.g., ["BPA-free", "FDA approved", "Food-grade stainless steel"])
- capacity: Volume or capacity (e.g., "500ml", "32oz", "2.5L")
- insulation: Insulation performance (e.g., "Keeps hot for 12 hours, cold for 24 hours")
- dishwasherSafe: Boolean true/false if mentioned
`,
      SPORTS: `
Extract these specifications (if mentioned):
- durability: Durability rating 1-5 if mentioned
- weatherResistance: Weather resistance specs (e.g., "Waterproof 10,000mm, -20°C rated")
`,
      ACCESSORIES: `
Extract these specifications (if mentioned):
- material: Primary material
- dimensions: Size/dimensions if mentioned
- weight: Weight if mentioned
`,
      BOOKS: `
Extract these specifications (if mentioned):
- pages: Number of pages
- publisher: Publisher name
- isbn: ISBN number
- language: Language of the book
`,
      TOYS: `
Extract these specifications (if mentioned):
- ageRange: Recommended age range
- material: Primary material
- safetyStandards: Array of safety standards
`,
      BEAUTY: `
Extract these specifications (if mentioned):
- ingredients: Key ingredients
- volume: Product volume
- skinType: Recommended skin type
`,
      OTHER: `
Extract any relevant specifications you can identify from the product information.
`
    }

    return instructions[category] || instructions.OTHER
  }

  /**
   * Get example format for category
   */
  private getExampleFormat(category: ProductCategory): string {
    const examples: Record<ProductCategory, string> = {
      ELECTRONICS: `{
  "cpu": "Intel Core i7-12700K",
  "ram": 16,
  "storage": "512GB NVMe SSD",
  "screen": "15.6 inch, 1920x1080 IPS",
  "battery": "86Wh, up to 10 hours",
  "connectivity": ["WiFi 6", "Bluetooth 5.2"],
  "os": "Windows 11 Pro"
}`,
      CLOTHING: `{
  "fabric": "100% Organic Cotton",
  "fabricComposition": [{"material": "Cotton", "percentage": 100}],
  "sizeAccuracy": "True to size",
  "careInstructions": "Machine washable cold"
}`,
      SHOES: `{
  "soleMaterial": "Rubber outsole",
  "cushioning": "EVA foam",
  "weight": 280,
  "breathability": 4
}`,
      HOME: `{
  "materialSafety": ["BPA-free", "Food-grade"],
  "capacity": "500ml",
  "dishwasherSafe": true
}`,
      SPORTS: `{
  "durability": 5,
  "weatherResistance": "Waterproof, wind-resistant"
}`,
      ACCESSORIES: `{
  "material": "Leather",
  "dimensions": "20x15x5 cm"
}`,
      BOOKS: `{
  "pages": 320,
  "publisher": "Penguin Books",
  "isbn": "978-0-14-103614-4"
}`,
      TOYS: `{
  "ageRange": "3-8 years",
  "material": "BPA-free plastic",
  "safetyStandards": ["ASTM", "CPSIA"]
}`,
      BEAUTY: `{
  "ingredients": ["Hyaluronic Acid", "Vitamin C"],
  "volume": "30ml",
  "skinType": "All skin types"
}`,
      OTHER: `{
  "key1": "value1",
  "key2": "value2"
}`
    }

    return examples[category] || examples.OTHER
  }

  /**
   * Parse AI response into structured specs
   */
  private parseSpecsResponse(responseText: string, category: ProductCategory): DynamicSpecs {
    try {
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        logger.warn('No JSON found in AI response', { responseText })
        return this.getDefaultSpecs(category)
      }

      const specs = JSON.parse(jsonMatch[0])

      // Add universal AI-detected features
      const aiFeatures = this.extractUniqueFeatures(responseText)
      if (aiFeatures.length > 0) {
        specs.aiDetectedFeatures = aiFeatures
      }

      return specs
    } catch (error) {
      logger.error('Error parsing specs response', {
        category,
        error: error instanceof Error ? error.message : String(error),
        responseText
      })
      return this.getDefaultSpecs(category)
    }
  }

  /**
   * Extract unique features from AI response
   */
  private extractUniqueFeatures(responseText: string): string[] {
    // Look for bullet points, "features:", or other feature indicators
    const features: string[] = []

    const featurePatterns = [
      /(?:unique features?|highlights?|key benefits?):\s*([^\n]+)/gi,
      /[-•]\s*([^\n]+)/g
    ]

    featurePatterns.forEach(pattern => {
      const matches = responseText.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 5) {
          features.push(match[1].trim())
        }
      }
    })

    return features.slice(0, 10) // Limit to 10 features
  }

  /**
   * Get default empty specs for category
   */
  private getDefaultSpecs(category: ProductCategory): DynamicSpecs {
    return {
      aiDetectedFeatures: []
    }
  }

  /**
   * Batch extract specs for multiple products
   */
  async batchExtractSpecs(
    products: Array<{
      id: string
      name: string
      description: string | null
      category: ProductCategory
      brand?: string
      price?: number
    }>,
    concurrency: number = 3
  ): Promise<Map<string, DynamicSpecs>> {
    const results = new Map<string, DynamicSpecs>()

    logger.info('Starting batch spec extraction', {
      totalProducts: products.length,
      concurrency
    })

    // Process in batches to respect API rate limits
    for (let i = 0; i < products.length; i += concurrency) {
      const batch = products.slice(i, i + concurrency)

      const batchResults = await Promise.allSettled(
        batch.map(async (product) => {
          const specs = await this.extractSpecs(
            product.name,
            product.description,
            product.category,
            {
              brand: product.brand,
              price: product.price
            }
          )
          return { id: product.id, specs }
        })
      )

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.set(result.value.id, result.value.specs)
        } else {
          const product = batch[index]
          logger.error('Failed to extract specs', {
            productId: product.id,
            error: result.reason
          })
          results.set(product.id, this.getDefaultSpecs(product.category))
        }
      })

      // Rate limiting: wait 1 second between batches
      if (i + concurrency < products.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      logger.info('Batch progress', {
        processed: Math.min(i + concurrency, products.length),
        total: products.length
      })
    }

    logger.info('Batch spec extraction complete', {
      totalProducts: products.length,
      successful: results.size
    })

    return results
  }

  /**
   * Score dynamic specs (0-100)
   * Higher scores for more complete and premium specs
   */
  scoreSpecs(specs: DynamicSpecs, category: ProductCategory): number {
    let score = 50 // Base score

    // Count available specifications
    const specCount = Object.keys(specs).filter(key => specs[key as keyof DynamicSpecs] !== undefined).length
    score += Math.min(20, specCount * 3) // +3 per spec, max +20

    // Category-specific scoring
    if (category === 'ELECTRONICS') {
      const elSpecs = specs as ElectronicsSpecs
      if (elSpecs.ram && elSpecs.ram >= 16) score += 10
      if (elSpecs.storage?.includes('SSD')) score += 10
      if (elSpecs.screen?.includes('4K') || elSpecs.screen?.includes('OLED')) score += 10
      if (elSpecs.waterproof) score += 5
    } else if (category === 'CLOTHING') {
      const clSpecs = specs as ClothingSpecs
      if (clSpecs.fabric?.toLowerCase().includes('organic') || clSpecs.fabric?.toLowerCase().includes('sustainable')) score += 15
      if (clSpecs.careInstructions?.toLowerCase().includes('machine washable')) score += 10
    } else if (category === 'SHOES') {
      const shSpecs = specs as ShoesSpecs
      if (shSpecs.cushioning) score += 10
      if (shSpecs.breathability && shSpecs.breathability >= 4) score += 10
    } else if (category === 'HOME') {
      const hmSpecs = specs as HomeKitchenSpecs
      if (hmSpecs.materialSafety && hmSpecs.materialSafety.length > 0) score += 15
      if (hmSpecs.dishwasherSafe) score += 10
    }

    // Universal features bonus
    const uniSpecs = specs as UniversalSpecs
    if (uniSpecs.aiDetectedFeatures && uniSpecs.aiDetectedFeatures.length > 0) {
      score += Math.min(15, uniSpecs.aiDetectedFeatures.length * 2)
    }

    return Math.min(100, Math.max(0, score))
  }
}

// Export singleton instance
export const dynamicParameterExtractor = new DynamicParameterExtractor()

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Validate specs against schema
 */
export function validateSpecs(specs: DynamicSpecs, category: ProductCategory): boolean {
  try {
    // Basic validation - ensure it's an object
    if (typeof specs !== 'object' || specs === null) {
      return false
    }

    // Category-specific validation
    if (category === 'ELECTRONICS') {
      const elSpecs = specs as ElectronicsSpecs
      if (elSpecs.ram !== undefined && (typeof elSpecs.ram !== 'number' || elSpecs.ram <= 0)) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Merge specs (for updates)
 */
export function mergeSpecs(existing: DynamicSpecs, newSpecs: DynamicSpecs): DynamicSpecs {
  return {
    ...existing,
    ...newSpecs,
    // Merge arrays specially
    aiDetectedFeatures: [
      ...(existing as any).aiDetectedFeatures || [],
      ...(newSpecs as any).aiDetectedFeatures || []
    ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
  }
}
