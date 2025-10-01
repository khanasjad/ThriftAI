import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

export interface DynamicParameter {
  name: string
  value: string | number
  category: string
  importance: 'critical' | 'high' | 'medium' | 'low'
  description: string
}

export interface DynamicParameterResult {
  parameters: DynamicParameter[]
  totalParameters: number
  categorySpecificCount: number
  qualityScore: number
}

/**
 * AI-Powered Dynamic Parameter Generator
 * Uses Claude AI to generate category-specific product parameters
 * For shoes: sole quality, cushioning, materials, support, etc.
 * For electronics: specs, battery, performance, etc.
 * For clothing: fabric, fit, comfort, etc.
 */
export class DynamicParameterGenerator {
  private anthropic: Anthropic | null = null

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey })
    }
  }

  /**
   * Generate category-specific parameters using AI
   */
  async generateParameters(product: {
    name: string
    brand: string
    category: string
    condition: string
    price: number
    description?: string
    existingSpecs?: any
  }): Promise<DynamicParameterResult> {
    try {
      if (!this.anthropic) {
        logger.warn('No Claude API key - using basic parameters')
        return this.generateBasicParameters(product)
      }

      logger.info('🤖 Generating AI-powered dynamic parameters', {
        product: product.name,
        category: product.category
      })

      const prompt = this.buildPrompt(product)

      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const parameters = this.parseAIResponse(responseText, product.category)

      logger.info('✅ AI parameters generated', {
        count: parameters.length,
        category: product.category
      })

      return {
        parameters,
        totalParameters: parameters.length,
        categorySpecificCount: parameters.filter(p => p.importance === 'critical' || p.importance === 'high').length,
        qualityScore: this.calculateQualityScore(parameters)
      }

    } catch (error) {
      logger.error('Error generating AI parameters', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      console.error('Full error:', error)
      return this.generateBasicParameters(product)
    }
  }

  /**
   * Build AI prompt for parameter generation
   */
  private buildPrompt(product: any): string {
    const categoryGuides: Record<string, string> = {
      'BASKETBALL_SHOES': `For BASKETBALL SHOES, analyze and generate detailed parameters about:
- SOLE: Material (rubber type), traction pattern, durability rating, grip level, wear resistance
- CUSHIONING: Technology (Air, Foam, Gel, Boost), responsiveness, impact protection, energy return
- SUPPORT: Ankle support level, stability features, lateral support, lockdown system
- UPPER MATERIAL: Type (leather/mesh/synthetic), breathability, flexibility, durability
- FIT & COMFORT: Sizing accuracy, break-in period, toe box space, arch support, heel fit
- PERFORMANCE: Court grip, pivot ability, jump enhancement, lightweight rating
- BUILD QUALITY: Stitching quality, construction method, reinforcement areas`,

      'SNEAKERS': `For SNEAKERS, analyze:
- SOLE: Outsole material, tread pattern, flexibility, durability
- CUSHIONING: Midsole technology, comfort level, shock absorption
- UPPER: Material quality, breathability, water resistance
- FIT: True to size, width options, arch support
- STYLE: Versatility, colorway quality, design elements
- DURABILITY: Expected lifespan, weak points, material strength`,

      'MENS_BOOTS': `For BOOTS, analyze:
- SOLE: Material type, tread depth, slip resistance, durability
- CONSTRUCTION: Welted/cemented, stitching quality, waterproofing
- LEATHER: Quality grade, thickness, finish, break-in
- SUPPORT: Ankle support, shank stiffness, arch support
- COMFORT: Insole quality, break-in period, all-day wearability`,

      'LAPTOPS': `For LAPTOPS, analyze:
- PROCESSOR: Speed, cores, generation, performance tier
- RAM: Capacity, type (DDR4/DDR5), expandability
- STORAGE: Type (SSD/HDD), capacity, speed
- DISPLAY: Resolution, refresh rate, brightness, color accuracy
- BATTERY: Capacity, estimated runtime, charging speed
- BUILD: Material quality, durability, thermal management
- PORTS: Type and quantity, connectivity options`,

      'SMARTPHONES': `For SMARTPHONES, analyze:
- DISPLAY: Technology, resolution, refresh rate, brightness
- CAMERA: Megapixels, sensor quality, low-light performance
- PROCESSOR: Chipset, performance tier, efficiency
- BATTERY: Capacity, charging speed, wireless charging
- BUILD: Material, water resistance, durability
- SOFTWARE: OS version, update support, features`,

      'MENS_JEANS': `For JEANS, analyze:
- FABRIC: Denim weight, stretch %, cotton quality, softness
- FIT: Cut style, rise, leg opening, sizing accuracy
- CONSTRUCTION: Stitch quality, reinforced areas, finishing
- COMFORT: Break-in required, breathability, flexibility
- DURABILITY: Expected lifespan, fade resistance, reinforcement`,

      'FURNITURE': `For FURNITURE, analyze:
- MATERIAL: Wood type/grade, finish quality, construction
- BUILD: Joint type, stability, weight capacity
- COMFORT: Cushioning, ergonomics, support
- DURABILITY: Expected lifespan, wear resistance
- ASSEMBLY: Difficulty, hardware quality, instructions`
    }

    const categoryGuide = categoryGuides[product.category] || `For ${product.category}, analyze relevant quality and specification parameters.`

    return `You are a product quality analyst. Generate detailed, specific parameters for this product.

PRODUCT DETAILS:
- Name: ${product.name}
- Brand: ${product.brand}
- Category: ${product.category}
- Condition: ${product.condition}
- Price: $${product.price}
${product.description ? `- Description: ${product.description}` : ''}

${categoryGuide}

INSTRUCTIONS:
1. Generate 15-25 category-specific parameters
2. For each parameter, provide:
   - name: Short parameter name (e.g., "sole_material", "cushioning_tech")
   - value: Specific value (e.g., "Premium Rubber", "Air Cushioning", "Excellent")
   - category: Group it belongs to (e.g., "sole", "cushioning", "materials")
   - importance: critical/high/medium/low
   - description: Brief explanation

3. Base ratings on:
   - Brand reputation (${product.brand})
   - Product condition (${product.condition})
   - Price point ($${product.price})
   - Typical quality for this category

4. Use quality tiers: Poor, Fair, Good, Very Good, Excellent, Premium, Professional
5. Be specific and realistic - not everything can be "Excellent"

OUTPUT FORMAT (JSON):
{
  "parameters": [
    {
      "name": "sole_material",
      "value": "Premium Rubber",
      "category": "sole",
      "importance": "critical",
      "description": "High-quality rubber compound for durability"
    }
  ]
}

Generate comprehensive parameters NOW:`
  }

  /**
   * Parse AI response into parameters
   */
  private parseAIResponse(response: string, category: string): DynamicParameter[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      return parsed.parameters || []
    } catch (error) {
      logger.error('Error parsing AI response', { error, response })
      return []
    }
  }

  /**
   * Calculate quality score from parameters
   */
  private calculateQualityScore(parameters: DynamicParameter[]): number {
    if (parameters.length === 0) return 50

    const qualityMap: Record<string, number> = {
      'poor': 20,
      'fair': 40,
      'good': 60,
      'very good': 75,
      'excellent': 90,
      'premium': 95,
      'professional': 100,
      'basic': 40,
      'standard': 50,
      'advanced': 80,
      'superior': 85
    }

    let totalScore = 0
    let scoredParams = 0

    parameters.forEach(param => {
      const value = param.value.toString().toLowerCase()

      // Check if value matches any quality tier
      for (const [tier, score] of Object.entries(qualityMap)) {
        if (value.includes(tier)) {
          // Weight by importance
          const weight = param.importance === 'critical' ? 1.5 :
                        param.importance === 'high' ? 1.2 :
                        param.importance === 'medium' ? 1.0 : 0.8

          totalScore += score * weight
          scoredParams += weight
          break
        }
      }
    })

    return scoredParams > 0 ? Math.round(totalScore / scoredParams) : 50
  }

  /**
   * Fallback: Generate basic parameters without AI
   */
  private generateBasicParameters(product: any): DynamicParameterResult {
    const parameters: DynamicParameter[] = []

    // Basic quality assessment based on condition
    const conditionScore = {
      'New': 95,
      'Like New': 85,
      'Excellent': 75,
      'Very Good': 65,
      'Good': 55,
      'Fair': 45
    }[product.condition] || 50

    parameters.push({
      name: 'overall_condition',
      value: product.condition,
      category: 'quality',
      importance: 'critical',
      description: 'Overall product condition'
    })

    parameters.push({
      name: 'brand_tier',
      value: 'Standard',
      category: 'brand',
      importance: 'high',
      description: 'Brand quality tier'
    })

    parameters.push({
      name: 'value_rating',
      value: 'Good',
      category: 'value',
      importance: 'medium',
      description: 'Price-to-quality ratio'
    })

    return {
      parameters,
      totalParameters: parameters.length,
      categorySpecificCount: 2,
      qualityScore: conditionScore
    }
  }
}

// Singleton instance
export const dynamicParameterGenerator = new DynamicParameterGenerator()
