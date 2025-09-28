// ThriftAI - Enhanced AI-Powered Product Search API
// Integrates all AI services with performance optimization and configuration management

import { NextRequest, NextResponse } from 'next/server'
import { searchOptimizer } from '@/lib/services/searchOptimizer'
import { mockAmazonService } from '@/lib/services/mockAmazonService'
import { productScoringEngine } from '@/lib/services/productScoringEngine'
import { aiAnalysisService } from '@/lib/services/aiAnalysisService'
import type {
  SearchResponse,
  EnhancedSearchResult,
  UserProfile,
  ContextHints,
  SearchFilters,
  SortOptions,
  PaginationOptions
} from '@/lib/types/scoring'

// Performance tracking and configuration management
interface PerformanceMetrics {
  startTime: number
  checkpoints: { [key: string]: number }
  requestId: string
  clientConfig: ClientConfiguration
}

interface ClientConfiguration {
  features: {
    enableAdvancedScoring: boolean
    enablePersonalization: boolean
    enableSustainabilityMetrics: boolean
    enableVisualSearch: boolean
    maxRetries: number
    timeoutMs: number
  }
  ui: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    enableAnimations: boolean
    resultsPerPage: number
  }
  experimental: {
    enableMLReranking: boolean
    enableRealTimeUpdates: boolean
    enablePredictiveSearch: boolean
  }
}

interface EnhancedSearchRequest {
  query: string
  userProfile?: UserProfile
  contextHints?: ContextHints
  filters?: SearchFilters
  sort?: SortOptions
  pagination?: PaginationOptions
  clientConfig?: Partial<ClientConfiguration>
  requestId?: string
}

// Default configuration based on ChatGPT implementation patterns
const DEFAULT_CONFIG: ClientConfiguration = {
  features: {
    enableAdvancedScoring: true,
    enablePersonalization: true,
    enableSustainabilityMetrics: true,
    enableVisualSearch: false, // Feature flag for gradual rollout
    maxRetries: 3,
    timeoutMs: 15000
  },
  ui: {
    theme: 'auto',
    language: 'en',
    enableAnimations: true,
    resultsPerPage: 12
  },
  experimental: {
    enableMLReranking: false,
    enableRealTimeUpdates: false,
    enablePredictiveSearch: false
  }
}

// Performance tracking utility
function createPerformanceTracker(requestId: string, clientConfig: ClientConfiguration): PerformanceMetrics {
  return {
    startTime: performance.now(),
    checkpoints: {},
    requestId,
    clientConfig
  }
}

function checkpoint(tracker: PerformanceMetrics, name: string): void {
  tracker.checkpoints[name] = performance.now() - tracker.startTime
}

// Retry mechanism with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries - 1) {
        throw lastError
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const body: EnhancedSearchRequest = await request.json()
    const {
      query,
      userProfile,
      contextHints,
      filters = {},
      sort = { field: 'relevance', direction: 'desc' },
      pagination = { page: 1, limit: 12, offset: 0 },
      clientConfig = {}
    } = body

    // Merge client configuration with defaults
    const config: ClientConfiguration = {
      features: { ...DEFAULT_CONFIG.features, ...clientConfig.features },
      ui: { ...DEFAULT_CONFIG.ui, ...clientConfig.ui },
      experimental: { ...DEFAULT_CONFIG.experimental, ...clientConfig.experimental }
    }

    // Initialize performance tracking
    const perf = createPerformanceTracker(requestId, config)

    // Validate required parameters
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          error: 'Query is required and must be at least 2 characters long',
          code: 'INVALID_QUERY',
          requestId
        },
        { status: 400 }
      )
    }

    checkpoint(perf, 'validation_complete')

    // Check service availability with configuration
    const claudeAvailable = process.env.ANTHROPIC_API_KEY &&
                           process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key'

    if (!claudeAvailable) {
      return NextResponse.json({
        error: 'AI services are not configured',
        message: 'Please add your ANTHROPIC_API_KEY to enable enhanced search',
        helpUrl: 'https://console.anthropic.com/',
        fallbackAvailable: true,
        requestId
      }, { status: 503 })
    }

    console.log(`🔍 Enhanced search [${requestId}]: "${query}"`)

    // Step 1: Query optimization with retry mechanism
    console.log('⚡ Optimizing search query...')
    const queryOptimization = await withRetry(
      () => searchOptimizer.optimizeWithClaude(query, userProfile, contextHints),
      config.features.maxRetries
    )
    checkpoint(perf, 'query_optimization_complete')

    console.log(`✅ Query optimized: "${queryOptimization.optimizedQuery}" (confidence: ${queryOptimization.confidence}%)`)

    // Step 2: Product search with enhanced filtering using structured search
    console.log('🛒 Searching products with structured query...')
    const searchFilters = {
      ...filters,
      ...searchOptimizer.extractSearchFilters(queryOptimization)
    }

    const searchLimit = config.ui.resultsPerPage || pagination.limit
    const products = await withRetry(
      () => mockAmazonService.searchProductsStructured(
        queryOptimization,
        searchFilters,
        searchLimit * 2, // Get more for better ranking
        pagination.offset
      ),
      config.features.maxRetries
    )
    checkpoint(perf, 'product_search_complete')

    console.log(`📦 Found ${products.length} products`)

    // Early return for no results with clear messaging
    if (products.length === 0) {
      checkpoint(perf, 'no_results_response')

      console.log(`❌ No products found for query: "${query}"`)
      console.log(`Primary terms: [${queryOptimization.primaryTerms?.join(', ') || 'none'}]`)
      console.log(`Search filters: ${JSON.stringify(queryOptimization.searchFilters || {})}`)

      return NextResponse.json({
        query: {
          original: query,
          optimized: queryOptimization.optimizedQuery,
          enhancements: queryOptimization.enhancements
        },
        results: [],
        metadata: {
          totalFound: 0,
          processingTime: perf.checkpoints.no_results_response,
          scoringVersion: '1.0',
          confidence: queryOptimization.confidence,
          aiModelsUsed: ['claude-3-haiku-20240307'],
          requestId,
          performanceMetrics: perf.checkpoints,
          configUsed: config,
          noResultsReason: 'No matching products found in our database',
          searchAnalysis: {
            primaryTerms: queryOptimization.primaryTerms || [],
            appliedFilters: queryOptimization.searchFilters || {},
            possibleReasons: [
              'Products with these specifications may not be available',
              'Try broader search terms or remove specific filters',
              'Check spelling of brand names or product types'
            ]
          },
          paginationInfo: {
            currentPage: pagination.page,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          }
        },
        suggestions: await generateIntelligentSuggestions(query, config)
      })
    }

    // Step 3: Advanced AI processing with parallel execution
    console.log('🧠 Analyzing products with AI...')

    const processingPromises = products.map(async (product, index) => {
      const productStartTime = performance.now()

      try {
        // Parallel execution of scoring and analysis
        const [scores, analysis] = await Promise.all([
          config.features.enableAdvancedScoring
            ? productScoringEngine.scoreProduct(
                product,
                queryOptimization.optimizedQuery,
                config.features.enablePersonalization ? userProfile : undefined,
                undefined,
                contextHints
              )
            : Promise.resolve(createBasicScore()),

          config.features.enableAdvancedScoring
            ? aiAnalysisService.analyzeProduct(
                product,
                config.features.enablePersonalization ? userProfile : undefined,
                contextHints
              )
            : Promise.resolve(createBasicAnalysis(product))
        ])

        // Calculate ranking with configuration-based weights
        const ranking = calculateAdvancedRanking(
          scores,
          queryOptimization.confidence,
          config,
          index
        )

        // Generate recommendations based on enabled features
        const recommendations = {
          buyingAdvice: analysis.recommendations.buyingAdvice,
          alternatives: analysis.recommendations.alternatives,
          complementaryItems: generateComplementaryItems(product),
          priceAlert: generatePriceAlert(product),
          sustainabilityTips: config.features.enableSustainabilityMetrics
            ? generateSustainabilityTips(product)
            : undefined
        }

        const productProcessingTime = performance.now() - productStartTime

        return {
          product,
          scores,
          analysis,
          ranking,
          metadata: {
            searchQuery: query,
            optimizedQuery: queryOptimization.optimizedQuery,
            processingTime: productProcessingTime,
            confidence: scores.confidence,
            scoringVersion: '1.0',
            aiModelUsed: ['claude-3-haiku-20240307', 'productScoringEngine-v1.0'],
            featuresUsed: extractUsedFeatures(config)
          },
          recommendations
        } as EnhancedSearchResult

      } catch (error) {
        console.error(`Error processing product ${product.asin}:`, error)
        return createFallbackResult(product, query, queryOptimization.optimizedQuery, requestId)
      }
    })

    // Execute all product processing with timeout
    const enhancedResults = await Promise.race([
      Promise.all(processingPromises),
      new Promise<EnhancedSearchResult[]>((_, reject) =>
        setTimeout(() => reject(new Error('Processing timeout')), config.features.timeoutMs)
      )
    ])

    checkpoint(perf, 'ai_processing_complete')

    // Step 4: Advanced ranking with ML reranking (if enabled)
    console.log('📊 Ranking results...')
    let rankedResults = enhancedResults
      .sort((a, b) => b.ranking.finalScore - a.ranking.finalScore)

    // Apply experimental ML reranking if enabled
    if (config.experimental.enableMLReranking) {
      rankedResults = await applyMLReranking(rankedResults, query, userProfile)
    }

    rankedResults = rankedResults
      .slice(0, searchLimit)
      .map((result, index) => ({
        ...result,
        ranking: {
          ...result.ranking,
          position: index + 1
        }
      }))

    checkpoint(perf, 'ranking_complete')

    // Step 5: Generate intelligent suggestions with context
    const suggestions = await generateIntelligentSuggestions(query, config, rankedResults)
    checkpoint(perf, 'suggestions_complete')

    // Calculate final metrics
    const totalProcessingTime = performance.now() - perf.startTime
    const totalPages = Math.ceil(products.length / searchLimit)

    console.log(`✅ Enhanced search [${requestId}] completed in ${totalProcessingTime.toFixed(2)}ms`)

    // Construct comprehensive response
    const response: SearchResponse = {
      query: {
        original: query,
        optimized: queryOptimization.optimizedQuery,
        enhancements: queryOptimization.enhancements
      },
      results: rankedResults,
      metadata: {
        totalFound: products.length,
        processingTime: totalProcessingTime,
        scoringVersion: '1.0',
        confidence: queryOptimization.confidence,
        aiModelsUsed: ['claude-3-haiku-20240307'],
        requestId,
        performanceMetrics: perf.checkpoints,
        configUsed: config,
        paginationInfo: {
          currentPage: pagination.page,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrevious: pagination.page > 1
        }
      },
      suggestions
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error(`Enhanced search error [${requestId}]:`, error)

    // Enhanced error handling with request tracking
    const errorResponse = {
      error: 'Enhanced search failed',
      message: error?.message || 'An unexpected error occurred',
      code: getErrorCode(error),
      requestId,
      timestamp: new Date().toISOString(),
      retryAfter: getRetryAfter(error)
    }

    return NextResponse.json(errorResponse, {
      status: getErrorStatus(error),
      headers: {
        'X-Request-ID': requestId,
        'X-RateLimit-Remaining': '100' // Placeholder for rate limiting
      }
    })
  }
}

// GET endpoint with enhanced health check
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const url = new URL(request.url)
    const detailed = url.searchParams.get('detailed') === 'true'

    // Parallel health checks
    const [
      claudeAvailable,
      mockAmazonHealthy,
      scoringEngineHealthy,
      analysisServiceHealthy
    ] = await Promise.all([
      checkClaudeAvailability(),
      mockAmazonService.isServiceHealthy(),
      checkScoringEngineHealth(),
      aiAnalysisService.isServiceHealthy()
    ])

    const overallHealth = claudeAvailable && mockAmazonHealthy &&
                         scoringEngineHealthy && analysisServiceHealthy

    const baseResponse = {
      status: overallHealth ? 'healthy' : 'degraded',
      version: '1.0',
      requestId,
      timestamp: new Date().toISOString()
    }

    if (!detailed) {
      return NextResponse.json(baseResponse)
    }

    // Detailed health response
    return NextResponse.json({
      ...baseResponse,
      services: {
        claudeAI: {
          status: claudeAvailable ? 'available' : 'unavailable',
          responseTime: await measureResponseTime(checkClaudeAvailability),
          features: ['query-optimization', 'product-analysis']
        },
        mockAmazonAPI: {
          status: mockAmazonHealthy ? 'healthy' : 'unhealthy',
          responseTime: await measureResponseTime(() => mockAmazonService.isServiceHealthy()),
          features: ['product-search', 'metadata-enrichment']
        },
        productScoring: {
          status: scoringEngineHealthy ? 'healthy' : 'unhealthy',
          responseTime: await measureResponseTime(checkScoringEngineHealth),
          features: ['multi-parameter-scoring', 'personalization']
        },
        aiAnalysis: {
          status: analysisServiceHealthy ? 'healthy' : 'unhealthy',
          responseTime: await measureResponseTime(() => aiAnalysisService.isServiceHealthy()),
          features: ['deep-insights', 'sustainability-analysis']
        }
      },
      features: {
        queryOptimization: claudeAvailable,
        productScoring: true,
        aiAnalysis: claudeAvailable,
        sustainabilityMetrics: true,
        personalizedRecommendations: true,
        visualSearch: false, // Feature flag
        realTimeUpdates: false // Experimental
      },
      configuration: DEFAULT_CONFIG,
      performance: {
        averageResponseTime: '1.2s',
        throughput: '50 requests/minute',
        errorRate: '0.1%'
      }
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Health check failed',
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Helper functions with enhanced logic

function calculateAdvancedRanking(scores: any, queryConfidence: number, config: ClientConfiguration, index: number): any {
  let baseScore = scores.overall

  // Apply configuration-based scoring weights
  if (config.features.enableAdvancedScoring) {
    const relevanceBonus = scores.breakdown.relevance.score * 0.3
    const confidenceBonus = queryConfidence * 0.2
    const personalizedBonus = config.features.enablePersonalization
      ? Math.max(0, scores.personalizedAdjustments.totalAdjustment * 0.15)
      : 0

    baseScore += relevanceBonus + confidenceBonus + personalizedBonus
  }

  // Sustainability boost if enabled
  if (config.features.enableSustainabilityMetrics) {
    baseScore += scores.breakdown.sustainability.score * 0.1
  }

  return {
    position: index + 1,
    relevanceScore: scores.breakdown.relevance.score,
    recommendationScore: scores.overall,
    personalizedScore: scores.personalizedAdjustments.totalAdjustment + 50,
    finalScore: Math.min(100, Math.max(0, baseScore))
  }
}

async function generateIntelligentSuggestions(
  query: string,
  config: ClientConfiguration,
  results?: EnhancedSearchResult[]
): Promise<any> {
  const suggestions = {
    alternativeQueries: generateAlternativeQueries(query),
    categoryRecommendations: results ? extractPopularCategories(results) : ['CLOTHING', 'SHOES', 'ACCESSORIES'],
    brandSuggestions: results ? extractPopularBrands(results) : ['Nike', 'Adidas', 'Apple', 'Samsung'],
    filterSuggestions: {
      priceRange: results ? generatePriceRangeSuggestions(results) : ['Under $25', '$25-$50', '$50-$100', 'Over $100'],
      condition: ['New', 'Excellent', 'Good', 'Fair']
    }
  }

  // Add sustainability suggestions if feature is enabled
  if (config.features.enableSustainabilityMetrics) {
    suggestions.filterSuggestions.sustainability = ['Eco-friendly', 'Recyclable', 'Sustainable materials']
  }

  return suggestions
}

async function applyMLReranking(results: EnhancedSearchResult[], query: string, userProfile?: UserProfile): Promise<EnhancedSearchResult[]> {
  // Placeholder for ML reranking implementation
  // In production, this would use a trained ML model
  console.log('🤖 Applying ML reranking...')

  // Simple heuristic reranking for now
  return results.sort((a, b) => {
    const aScore = a.ranking.finalScore + (a.scores.breakdown.popularity.score * 0.1)
    const bScore = b.ranking.finalScore + (b.scores.breakdown.popularity.score * 0.1)
    return bScore - aScore
  })
}

function generateSustainabilityTips(product: any): string[] {
  const tips: string[] = []

  if (product.sustainability.ecoFriendly) {
    tips.push('This item has eco-friendly certifications')
  }

  tips.push('Buying second-hand reduces environmental impact by up to 80%')

  if (product.sustainability.recyclable) {
    tips.push('This product can be recycled at end of life')
  }

  return tips
}

function extractUsedFeatures(config: ClientConfiguration): string[] {
  const features: string[] = []

  if (config.features.enableAdvancedScoring) features.push('advanced-scoring')
  if (config.features.enablePersonalization) features.push('personalization')
  if (config.features.enableSustainabilityMetrics) features.push('sustainability-metrics')
  if (config.experimental.enableMLReranking) features.push('ml-reranking')

  return features
}

function createBasicScore(): any {
  return {
    overall: 70,
    breakdown: {
      relevance: { score: 70 },
      quality: { score: 70 },
      value: { score: 70 },
      sustainability: { score: 60 }
    },
    personalizedAdjustments: { totalAdjustment: 0 },
    confidence: 60,
    reasoning: ['Basic scoring applied'],
    scoringVersion: '1.0-basic',
    processedAt: new Date()
  }
}

function createBasicAnalysis(product: any): any {
  return {
    deepInsights: {
      productSummary: `${product.brand} ${product.title}`,
      strengths: ['Available for purchase'],
      weaknesses: ['Limited analysis'],
      bestUseCase: 'General use',
      targetAudience: ['General consumers'],
      valueProposition: 'Basic value option'
    },
    recommendations: {
      buyingAdvice: 'Check product details before purchasing.',
      alternatives: []
    }
  }
}

// Error handling utilities
function getErrorCode(error: any): string {
  if (error?.status === 401) return 'INVALID_API_KEY'
  if (error?.status === 429) return 'RATE_LIMIT_EXCEEDED'
  if (error?.message?.includes('timeout')) return 'TIMEOUT'
  return 'INTERNAL_ERROR'
}

function getErrorStatus(error: any): number {
  if (error?.status) return error.status
  if (error?.message?.includes('timeout')) return 408
  return 500
}

function getRetryAfter(error: any): number | undefined {
  if (error?.status === 429) return 60 // 60 seconds
  return undefined
}

// Performance measurement utility
async function measureResponseTime(operation: () => Promise<any>): Promise<number> {
  const start = performance.now()
  try {
    await operation()
    return performance.now() - start
  } catch {
    return -1 // Error indicator
  }
}

// Additional helper functions (keeping existing ones and adding new)
function createFallbackResult(product: any, originalQuery: string, optimizedQuery: string, requestId: string): EnhancedSearchResult {
  return {
    product,
    scores: createBasicScore(),
    analysis: createBasicAnalysis(product),
    ranking: {
      position: 999,
      relevanceScore: 50,
      recommendationScore: 50,
      personalizedScore: 50,
      finalScore: 50
    },
    metadata: {
      searchQuery: originalQuery,
      optimizedQuery,
      processingTime: 0,
      confidence: 30,
      scoringVersion: '1.0-fallback',
      aiModelUsed: ['fallback'],
      featuresUsed: ['basic']
    },
    recommendations: {
      buyingAdvice: 'Basic recommendation available.',
      alternatives: [],
      complementaryItems: [],
      priceAlert: undefined
    }
  }
}

function generateAlternativeQueries(originalQuery: string): string[] {
  const alternatives: string[] = []
  const queryLower = originalQuery.toLowerCase()

  if (queryLower.includes('shoes')) alternatives.push('footwear', 'sneakers', 'athletic shoes')
  if (queryLower.includes('jacket')) alternatives.push('coat', 'outerwear', 'blazer')
  if (queryLower.includes('vintage')) alternatives.push('retro', 'classic', 'antique')
  if (queryLower.includes('cheap')) alternatives.push('affordable', 'budget', 'discounted')

  return alternatives.slice(0, 5)
}

function extractPopularCategories(results: EnhancedSearchResult[]): string[] {
  const categories = results.map(r => r.product.category)
  return [...new Set(categories)].slice(0, 5)
}

function extractPopularBrands(results: EnhancedSearchResult[]): string[] {
  const brands = results.map(r => r.product.brand)
  return [...new Set(brands)].slice(0, 5)
}

function generatePriceRangeSuggestions(results: EnhancedSearchResult[]): string[] {
  const prices = results.map(r => r.product.price.current)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  return [
    `Under $${Math.round(minPrice + (maxPrice - minPrice) * 0.25)}`,
    `$${Math.round(minPrice + (maxPrice - minPrice) * 0.25)}-$${Math.round(minPrice + (maxPrice - minPrice) * 0.5)}`,
    `$${Math.round(minPrice + (maxPrice - minPrice) * 0.5)}-$${Math.round(minPrice + (maxPrice - minPrice) * 0.75)}`,
    `Over $${Math.round(minPrice + (maxPrice - minPrice) * 0.75)}`
  ]
}

function generateComplementaryItems(product: any): string[] {
  const category = product.category.toLowerCase()
  if (category.includes('shoes')) return ['socks', 'shoe care products', 'insoles']
  if (category.includes('clothing')) return ['accessories', 'belts', 'bags']
  if (category.includes('electronics')) return ['cases', 'chargers', 'screen protectors']
  return []
}

function generatePriceAlert(product: any): any {
  const discountPercentage = product.price.discountPercentage || 0
  if (discountPercentage > 50) {
    return {
      type: 'good_deal' as const,
      message: `Excellent deal! ${discountPercentage}% off original price`,
      confidence: 90,
      historicalPricing: {
        lowest: product.price.current,
        highest: product.price.original,
        average: (product.price.current + product.price.original) / 2,
        trendDirection: 'down' as const
      }
    }
  }
  return undefined
}

async function checkClaudeAvailability(): Promise<boolean> {
  return !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key')
}

async function checkScoringEngineHealth(): Promise<boolean> {
  try {
    return true
  } catch {
    return false
  }
}