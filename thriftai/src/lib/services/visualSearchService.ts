/**
 * Visual Search Service
 * Uses Claude Vision API to analyze images and generate search queries
 */

import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export interface VisualSearchResult {
  success: boolean
  data?: {
    searchQuery: string
    detectedAttributes: {
      category?: string
      brand?: string
      color?: string
      style?: string
      material?: string
      pattern?: string
      condition?: string
    }
    confidence: number
    description: string
    suggestedFilters: {
      category?: string[]
      priceRange?: { min: number; max: number }
      condition?: string[]
    }
  }
  error?: string
}

/**
 * Analyze an image and generate search query + attributes
 */
export async function analyzeImageForSearch(
  imageData: string | Buffer
): Promise<VisualSearchResult> {

  try {
    logger.info('🖼️  Starting visual search analysis', {
      component: 'VisualSearch'
    })

    // Convert image to base64 if it's a Buffer
    const base64Image = Buffer.isBuffer(imageData)
      ? imageData.toString('base64')
      : imageData

    // Determine media type
    const mediaType = detectMediaType(base64Image)

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image
            }
          },
          {
            type: 'text',
            text: `Analyze this product image and extract the following information in JSON format:

{
  "searchQuery": "concise search query (2-4 words)",
  "category": "ELECTRONICS | FASHION | ACCESSORIES | FURNITURE | COLLECTIBLES | SPORTS | BOOKS",
  "brand": "brand name if visible",
  "color": "primary color",
  "style": "style description",
  "material": "material type",
  "pattern": "pattern if any",
  "condition": "New | Like New | Excellent | Good | Fair",
  "description": "detailed 2-sentence description",
  "priceRange": { "min": estimated_min_price, "max": estimated_max_price },
  "confidence": confidence_score_0_to_100
}

Focus on identifying key visual attributes that would help search for similar products in a thrift/resale marketplace.`
          }
        ]
      }]
    })

    // Parse Claude's response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response')
    }

    const analysis = JSON.parse(jsonMatch[0])

    logger.info('✅ Visual search analysis complete', {
      component: 'VisualSearch',
      metadata: {
        searchQuery: analysis.searchQuery,
        category: analysis.category,
        confidence: analysis.confidence
      }
    })

    return {
      success: true,
      data: {
        searchQuery: analysis.searchQuery,
        detectedAttributes: {
          category: analysis.category,
          brand: analysis.brand,
          color: analysis.color,
          style: analysis.style,
          material: analysis.material,
          pattern: analysis.pattern,
          condition: analysis.condition
        },
        confidence: analysis.confidence,
        description: analysis.description,
        suggestedFilters: {
          category: analysis.category ? [analysis.category] : undefined,
          priceRange: analysis.priceRange,
          condition: analysis.condition ? [analysis.condition] : undefined
        }
      }
    }

  } catch (error) {
    logger.error('❌ Visual search analysis failed', {
      component: 'VisualSearch',
      error: error instanceof Error ? error.message : String(error)
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Perform visual search - analyze image and search products
 */
export async function visualSearch(imageData: string | Buffer) {
  // Step 1: Analyze image
  const analysis = await analyzeImageForSearch(imageData)

  if (!analysis.success || !analysis.data) {
    return {
      success: false,
      error: analysis.error || 'Analysis failed',
      products: []
    }
  }

  // Step 2: Search products using generated query
  const { searchQuery, detectedAttributes, suggestedFilters } = analysis.data

  logger.info('🔍 Searching products with visual query', {
    component: 'VisualSearch',
    metadata: { searchQuery, category: detectedAttributes.category }
  })

  // Build search query
  const whereClause: any = {
    isAvailable: true,
    AND: []
  }

  // Add text search
  if (searchQuery) {
    whereClause.AND.push({
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { brand: { contains: searchQuery, mode: 'insensitive' } }
      ]
    })
  }

  // Add category filter
  if (detectedAttributes.category) {
    whereClause.AND.push({
      category: detectedAttributes.category
    })
  }

  // Add brand filter
  if (detectedAttributes.brand) {
    whereClause.AND.push({
      brand: { contains: detectedAttributes.brand, mode: 'insensitive' }
    })
  }

  // Add condition filter
  if (suggestedFilters.condition && suggestedFilters.condition.length > 0) {
    whereClause.AND.push({
      condition: { in: suggestedFilters.condition }
    })
  }

  // Add price range
  if (suggestedFilters.priceRange) {
    whereClause.AND.push({
      price: {
        gte: suggestedFilters.priceRange.min,
        lte: suggestedFilters.priceRange.max
      }
    })
  }

  try {
    // Execute search
    const products = await prisma.product.findMany({
      where: whereClause,
      take: 20,
      orderBy: [
        { aiScore: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        seller: {
          select: {
            businessName: true,
            rating: true
          }
        }
      }
    })

    logger.info('✅ Visual search complete', {
      component: 'VisualSearch',
      metadata: {
        productsFound: products.length,
        searchQuery
      }
    })

    return {
      success: true,
      analysis: analysis.data,
      products,
      totalResults: products.length
    }

  } catch (error) {
    logger.error('❌ Visual search query failed', {
      component: 'VisualSearch',
      error: error instanceof Error ? error.message : String(error)
    })

    return {
      success: false,
      error: 'Search failed',
      analysis: analysis.data,
      products: []
    }
  }
}

/**
 * Detect media type from base64 string
 */
function detectMediaType(base64: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png'
  if (base64.startsWith('R0lGOD')) return 'image/gif'
  if (base64.startsWith('UklGR')) return 'image/webp'
  return 'image/jpeg' // default
}

/**
 * Convert uploaded file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
