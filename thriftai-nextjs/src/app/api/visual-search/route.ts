// ThriftAI - Visual Search API
// AI-powered image-to-product search using Claude Vision capabilities

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { searchOptimizer } from '@/lib/services/searchOptimizer'
import { mockAmazonService } from '@/lib/services/mockAmazonService'
import { productScoringEngine } from '@/lib/services/productScoringEngine'
import type {
  SearchResponse,
  EnhancedSearchResult,
  UserProfile,
  ContextHints
} from '@/lib/types/scoring'

interface VisualSearchRequest {
  imageData: string // Base64 encoded image
  imageFormat: 'jpeg' | 'png' | 'webp' | 'gif'
  userProfile?: UserProfile
  contextHints?: ContextHints
  additionalText?: string // Optional text to accompany the image
  maxResults?: number
}

interface ImageAnalysisResult {
  detectedItems: string[]
  style: string
  colors: string[]
  category: string
  brand?: string
  condition?: string
  materials?: string[]
  searchQuery: string
  confidence: number
  reasoning: string[]
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif']

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    // Check if Claude AI is available
    const claudeAvailable = process.env.ANTHROPIC_API_KEY &&
                           process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key'

    if (!claudeAvailable) {
      return NextResponse.json({
        error: 'Visual search requires Claude AI',
        message: 'Please configure ANTHROPIC_API_KEY to enable visual search',
        code: 'AI_SERVICE_UNAVAILABLE',
        requestId
      }, { status: 503 })
    }

    const body: VisualSearchRequest = await request.json()
    const {
      imageData,
      imageFormat,
      userProfile,
      contextHints,
      additionalText = '',
      maxResults = 12
    } = body

    // Validate input
    if (!imageData) {
      return NextResponse.json({
        error: 'Image data is required',
        code: 'MISSING_IMAGE',
        requestId
      }, { status: 400 })
    }

    if (!SUPPORTED_FORMATS.includes(imageFormat.toLowerCase())) {
      return NextResponse.json({
        error: `Unsupported image format: ${imageFormat}`,
        supportedFormats: SUPPORTED_FORMATS,
        code: 'UNSUPPORTED_FORMAT',
        requestId
      }, { status: 400 })
    }

    // Validate image size (rough estimate from base64)
    const imageSizeBytes = (imageData.length * 3) / 4
    if (imageSizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'Image too large',
        maxSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        code: 'IMAGE_TOO_LARGE',
        requestId
      }, { status: 413 })
    }

    console.log(`🖼️ Visual search request [${requestId}]: ${imageFormat} image (${Math.round(imageSizeBytes / 1024)}KB)`)

    // Step 1: Analyze image with Claude Vision
    console.log('🔍 Analyzing image with Claude Vision...')
    const imageAnalysis = await analyzeImageWithClaude(imageData, imageFormat, additionalText)
    console.log(`✅ Image analysis complete: ${imageAnalysis.searchQuery} (confidence: ${imageAnalysis.confidence}%)`)

    // Step 2: Optimize the generated search query
    console.log('⚡ Optimizing visual search query...')
    const queryOptimization = await searchOptimizer.optimizeWithClaude(
      imageAnalysis.searchQuery,
      userProfile,
      {
        ...contextHints,
        specificNeed: `Visual search for ${imageAnalysis.category.toLowerCase()}`
      }
    )

    // Step 3: Search for products using the visual analysis
    console.log('🛒 Searching for visually similar products...')
    const searchFilters = {
      categories: imageAnalysis.category ? [imageAnalysis.category] : undefined,
      colors: imageAnalysis.colors.length > 0 ? imageAnalysis.colors : undefined,
      brands: imageAnalysis.brand ? [imageAnalysis.brand] : undefined,
      ...searchOptimizer.extractSearchFilters(queryOptimization)
    }

    const products = await mockAmazonService.searchProducts(
      queryOptimization.optimizedQuery,
      searchFilters,
      maxResults * 2, // Get more for better filtering
      0
    )

    console.log(`📦 Found ${products.length} visually similar products`)

    if (products.length === 0) {
      return NextResponse.json({
        query: {
          original: imageAnalysis.searchQuery,
          optimized: queryOptimization.optimizedQuery,
          enhancements: queryOptimization.enhancements
        },
        imageAnalysis,
        results: [],
        metadata: {
          totalFound: 0,
          processingTime: Date.now() - startTime,
          confidence: imageAnalysis.confidence,
          requestId,
          searchType: 'visual',
          aiModelsUsed: ['claude-3-haiku-20240307-vision', 'claude-3-haiku-20240307']
        },
        suggestions: {
          alternativeQueries: generateVisualSearchSuggestions(imageAnalysis),
          refinements: generateVisualRefinements(imageAnalysis)
        }
      })
    }

    // Step 4: Score products with visual similarity boost
    console.log('🧠 Scoring products with visual similarity...')
    const enhancedResults: EnhancedSearchResult[] = await Promise.all(
      products.slice(0, maxResults).map(async (product, index) => {
        try {
          // Score the product
          const scores = await productScoringEngine.scoreProduct(
            product,
            queryOptimization.optimizedQuery,
            userProfile,
            undefined,
            contextHints
          )

          // Apply visual similarity boost
          const visualSimilarityScore = calculateVisualSimilarity(product, imageAnalysis)
          const adjustedScore = Math.min(100, scores.overall + visualSimilarityScore)

          const ranking = {
            position: index + 1,
            relevanceScore: scores.breakdown.relevance.score,
            recommendationScore: adjustedScore,
            visualSimilarityScore,
            personalizedScore: scores.personalizedAdjustments.totalAdjustment + 50,
            finalScore: adjustedScore
          }

          // Generate visual search recommendations
          const recommendations = {
            buyingAdvice: generateVisualBuyingAdvice(product, imageAnalysis),
            visualMatches: identifyVisualMatches(product, imageAnalysis),
            styleAdvice: generateStyleAdvice(product, imageAnalysis),
            alternatives: [],
            complementaryItems: []
          }

          return {
            product,
            scores: {
              ...scores,
              overall: adjustedScore,
              reasoning: [
                ...scores.reasoning,
                `Visual similarity boost: +${visualSimilarityScore} points`
              ]
            },
            analysis: {
              deepInsights: {
                productSummary: `${product.brand} ${product.title}`,
                strengths: identifyVisualStrengths(product, imageAnalysis),
                weaknesses: [],
                bestUseCase: imageAnalysis.style,
                targetAudience: ['Style-conscious shoppers'],
                valueProposition: 'Visually similar sustainable option'
              },
              comparativeAnalysis: {
                similarProducts: [],
                competitiveAdvantages: [],
                pricePositioning: 'Market competitive',
                uniqueFeatures: [],
                marketPosition: 'mid-range' as const
              },
              recommendations: {
                buyingAdvice: recommendations.buyingAdvice,
                sizingGuidance: 'Check size chart carefully',
                styleAdvice: recommendations.styleAdvice,
                careInstructions: 'Follow care label instructions',
                usageRecommendations: [],
                alternatives: []
              },
              sustainabilityInsights: {
                environmentalImpact: 'Reduced by choosing second-hand',
                ethicalProduction: 'Sustainable shopping choice',
                longevityAssessment: 'Good expected lifespan',
                recyclingOptions: 'Standard recycling available',
                improvementSuggestions: []
              },
              riskAssessment: {
                purchaseRisks: ['Standard online purchase risks'],
                riskLevel: 'low' as const,
                mitigationAdvice: ['Check seller ratings', 'Review return policy']
              }
            },
            ranking,
            metadata: {
              searchQuery: imageAnalysis.searchQuery,
              optimizedQuery: queryOptimization.optimizedQuery,
              processingTime: 0,
              confidence: Math.round((scores.confidence + imageAnalysis.confidence) / 2),
              scoringVersion: '1.0-visual',
              aiModelUsed: ['claude-3-haiku-20240307-vision', 'productScoringEngine-v1.0'],
              featuresUsed: ['visual-search', 'image-analysis']
            },
            recommendations
          } as EnhancedSearchResult

        } catch (error) {
          console.error(`Error processing product ${product.asin}:`, error)
          return createVisualFallbackResult(product, imageAnalysis, requestId)
        }
      })
    )

    // Step 5: Re-rank by visual similarity and overall score
    const rankedResults = enhancedResults
      .sort((a, b) => b.ranking.finalScore - a.ranking.finalScore)
      .map((result, index) => ({
        ...result,
        ranking: {
          ...result.ranking,
          position: index + 1
        }
      }))

    const totalProcessingTime = Date.now() - startTime
    console.log(`✅ Visual search [${requestId}] completed in ${totalProcessingTime}ms`)

    const response: SearchResponse & { imageAnalysis: ImageAnalysisResult } = {
      query: {
        original: imageAnalysis.searchQuery,
        optimized: queryOptimization.optimizedQuery,
        enhancements: queryOptimization.enhancements
      },
      imageAnalysis,
      results: rankedResults,
      metadata: {
        totalFound: products.length,
        processingTime: totalProcessingTime,
        scoringVersion: '1.0-visual',
        confidence: imageAnalysis.confidence,
        aiModelsUsed: ['claude-3-haiku-20240307-vision', 'claude-3-haiku-20240307'],
        requestId,
        searchType: 'visual',
        paginationInfo: {
          currentPage: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false
        }
      },
      suggestions: {
        alternativeQueries: generateVisualSearchSuggestions(imageAnalysis),
        refinements: generateVisualRefinements(imageAnalysis),
        categoryRecommendations: [imageAnalysis.category],
        brandSuggestions: imageAnalysis.brand ? [imageAnalysis.brand] : [],
        filterSuggestions: {
          colors: imageAnalysis.colors,
          styles: [imageAnalysis.style],
          categories: [imageAnalysis.category]
        }
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error(`Visual search error [${requestId}]:`, error)

    return NextResponse.json({
      error: 'Visual search failed',
      message: error?.message || 'An unexpected error occurred during visual search',
      code: 'VISUAL_SEARCH_ERROR',
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Helper function to analyze image with Claude Vision
async function analyzeImageWithClaude(
  imageData: string,
  imageFormat: string,
  additionalText: string
): Promise<ImageAnalysisResult> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!
  })

  const prompt = `You are an expert fashion and product analyst. Analyze this image and extract detailed information for product search.

${additionalText ? `Additional context: ${additionalText}` : ''}

Analyze the image and provide a JSON response with the following structure:

{
  "detectedItems": ["list of specific items you see"],
  "style": "overall style (e.g., vintage, modern, casual, formal, sporty, bohemian)",
  "colors": ["dominant colors in the image"],
  "category": "main product category (CLOTHING, SHOES, ACCESSORIES, ELECTRONICS, etc.)",
  "brand": "brand name if visible or null",
  "condition": "apparent condition (new, excellent, good, fair) or null",
  "materials": ["materials you can identify"],
  "searchQuery": "optimized search query to find similar products",
  "confidence": 85,
  "reasoning": ["explanation of your analysis"]
}

Focus on creating a search query that would find similar or related products in a thrift/second-hand marketplace. Be specific about style, color, and type but flexible enough to find good matches.

Examples of good search queries:
- "vintage blue denim jacket women oversized"
- "black leather ankle boots pointed toe"
- "red floral vintage dress midi length"
- "white canvas sneakers retro style"

Respond with only the JSON object, no additional text.`

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: `image/${imageFormat}` as any,
              data: imageData
            }
          },
          {
            type: "text",
            text: prompt
          }
        ]
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response')
    }

    const analysis: ImageAnalysisResult = JSON.parse(jsonMatch[0])

    // Validate required fields
    if (!analysis.searchQuery || !analysis.category) {
      throw new Error('Invalid analysis structure')
    }

    return analysis

  } catch (error) {
    console.error('Error analyzing image with Claude:', error)

    // Fallback analysis
    return {
      detectedItems: ['unknown item'],
      style: 'general',
      colors: ['multiple'],
      category: 'CLOTHING',
      brand: null,
      condition: null,
      materials: [],
      searchQuery: additionalText || 'general search',
      confidence: 30,
      reasoning: ['Fallback analysis due to processing error']
    }
  }
}

// Helper functions for visual search
function calculateVisualSimilarity(product: any, imageAnalysis: ImageAnalysisResult): number {
  let similarity = 0

  // Category match
  if (product.category === imageAnalysis.category) {
    similarity += 15
  }

  // Color match
  const productColors = [product.specifications.color?.toLowerCase()].filter(Boolean)
  const analysisColors = imageAnalysis.colors.map(c => c.toLowerCase())
  const colorMatches = productColors.filter(color =>
    analysisColors.some(analysisColor =>
      color.includes(analysisColor) || analysisColor.includes(color)
    )
  )
  similarity += colorMatches.length * 10

  // Brand match
  if (imageAnalysis.brand && product.brand.toLowerCase().includes(imageAnalysis.brand.toLowerCase())) {
    similarity += 20
  }

  // Style/keyword match
  const productText = `${product.title} ${product.description}`.toLowerCase()
  const styleMatches = imageAnalysis.detectedItems.filter(item =>
    productText.includes(item.toLowerCase())
  )
  similarity += styleMatches.length * 5

  return Math.min(30, similarity) // Cap at 30 points boost
}

function generateVisualBuyingAdvice(product: any, imageAnalysis: ImageAnalysisResult): string {
  const similarities = []

  if (product.category === imageAnalysis.category) {
    similarities.push('matches the category')
  }

  if (imageAnalysis.colors.some(color =>
    product.specifications.color?.toLowerCase().includes(color.toLowerCase())
  )) {
    similarities.push('has similar colors')
  }

  if (similarities.length === 0) {
    return 'This item has some visual similarities to your uploaded image. Check the details to ensure it matches your needs.'
  }

  return `This item ${similarities.join(' and ')} from your uploaded image. It could be a good match for your style preferences.`
}

function identifyVisualMatches(product: any, imageAnalysis: ImageAnalysisResult): string[] {
  const matches: string[] = []

  if (product.category === imageAnalysis.category) {
    matches.push(`Same category (${imageAnalysis.category})`)
  }

  imageAnalysis.colors.forEach(color => {
    if (product.specifications.color?.toLowerCase().includes(color.toLowerCase())) {
      matches.push(`Color: ${color}`)
    }
  })

  if (imageAnalysis.brand && product.brand.toLowerCase().includes(imageAnalysis.brand.toLowerCase())) {
    matches.push(`Brand: ${imageAnalysis.brand}`)
  }

  return matches
}

function identifyVisualStrengths(product: any, imageAnalysis: ImageAnalysisResult): string[] {
  const strengths: string[] = []

  if (product.category === imageAnalysis.category) {
    strengths.push('Perfect category match')
  }

  if (imageAnalysis.colors.some(color =>
    product.specifications.color?.toLowerCase().includes(color.toLowerCase())
  )) {
    strengths.push('Color coordination')
  }

  if (product.reviews.rating >= 4.0) {
    strengths.push('Highly rated by customers')
  }

  if (product.sustainability.ecoFriendly) {
    strengths.push('Environmentally friendly choice')
  }

  return strengths
}

function generateStyleAdvice(product: any, imageAnalysis: ImageAnalysisResult): string {
  const style = imageAnalysis.style.toLowerCase()

  if (style.includes('vintage')) {
    return 'Perfect for creating authentic vintage looks. Pair with classic accessories.'
  }

  if (style.includes('casual')) {
    return 'Great for everyday wear. Easy to style with other casual pieces.'
  }

  if (style.includes('formal')) {
    return 'Ideal for professional or formal occasions. Consider quality accessories.'
  }

  return 'Versatile piece that can be styled for various occasions.'
}

function generateVisualSearchSuggestions(imageAnalysis: ImageAnalysisResult): string[] {
  const suggestions = [imageAnalysis.searchQuery]

  // Add variations
  if (imageAnalysis.style !== 'general') {
    suggestions.push(`${imageAnalysis.style} ${imageAnalysis.category.toLowerCase()}`)
  }

  imageAnalysis.colors.forEach(color => {
    suggestions.push(`${color} ${imageAnalysis.category.toLowerCase()}`)
  })

  if (imageAnalysis.brand) {
    suggestions.push(`${imageAnalysis.brand} ${imageAnalysis.category.toLowerCase()}`)
  }

  return [...new Set(suggestions)].slice(0, 5)
}

function generateVisualRefinements(imageAnalysis: ImageAnalysisResult): any {
  return {
    colors: imageAnalysis.colors,
    styles: [imageAnalysis.style],
    categories: [imageAnalysis.category],
    materials: imageAnalysis.materials,
    brands: imageAnalysis.brand ? [imageAnalysis.brand] : []
  }
}

function createVisualFallbackResult(product: any, imageAnalysis: ImageAnalysisResult, requestId: string): EnhancedSearchResult {
  return {
    product,
    scores: {
      overall: 60,
      breakdown: {} as any,
      personalizedAdjustments: {} as any,
      confidence: 40,
      reasoning: ['Visual search fallback result'],
      scoringVersion: '1.0-visual-fallback',
      processedAt: new Date()
    },
    analysis: {} as any,
    ranking: {
      position: 999,
      relevanceScore: 50,
      recommendationScore: 60,
      visualSimilarityScore: 10,
      personalizedScore: 50,
      finalScore: 60
    },
    metadata: {
      searchQuery: imageAnalysis.searchQuery,
      optimizedQuery: imageAnalysis.searchQuery,
      processingTime: 0,
      confidence: 40,
      scoringVersion: '1.0-visual-fallback',
      aiModelUsed: ['fallback'],
      featuresUsed: ['visual-search-basic']
    },
    recommendations: {
      buyingAdvice: 'Visual match analysis limited. Check product details.',
      alternatives: [],
      complementaryItems: []
    }
  }
}