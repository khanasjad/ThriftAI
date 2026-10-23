/**
 * Batch Evidence Processor
 *
 * Loads reviews from the database and extracts evidence in batches.
 */

import { PrismaClient } from '@prisma/client'
import {
  extractEvidence,
  extractEvidenceBatch,
  validateEvidence
} from './evidence-agent'
import { EvidenceExtractionInput } from './evidence-types'
import { FactorPillar } from './factor-taxonomy'

const prisma = new PrismaClient()

export interface BatchProcessorOptions {
  productId?: string          // Process specific product
  limit?: number              // Limit number of reviews
  concurrency?: number        // Parallel processing (default: 5)
  saveToDatabase?: boolean    // Save to EvidenceTag table (default: true)
  skipProcessed?: boolean     // Skip reviews already processed (default: true)
}

export interface BatchProcessorStats {
  totalReviews: number
  processedReviews: number
  skippedReviews: number
  totalEvidence: number
  evidenceByPillar: Record<FactorPillar, number>
  evidenceByFactor: Record<string, number>
  averageConfidence: number
  averageProcessingTime: number
  validationErrors: number
}

/**
 * Process reviews in batches and extract evidence
 */
export async function processBatch(
  options: BatchProcessorOptions = {}
): Promise<BatchProcessorStats> {
  const {
    productId,
    limit,
    concurrency = 5,
    saveToDatabase = true,
    skipProcessed = true
  } = options

  console.log('🚀 Starting batch evidence extraction...')
  console.log(`   Product ID: ${productId || 'ALL'}`)
  console.log(`   Limit: ${limit || 'NONE'}`)
  console.log(`   Concurrency: ${concurrency}`)
  console.log(`   Save to DB: ${saveToDatabase}`)
  console.log(`   Skip processed: ${skipProcessed}\n`)

  // Load reviews from database
  const whereClause: any = {}
  if (productId) {
    whereClause.productId = productId
  }
  if (skipProcessed) {
    whereClause.evidenceTags = {
      none: {} // Only get reviews with no evidence tags
    }
  }

  const reviews = await prisma.clothingReview.findMany({
    where: whereClause,
    take: limit,
    include: {
      product: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log(`📊 Found ${reviews.length} reviews to process\n`)

  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      processedReviews: 0,
      skippedReviews: 0,
      totalEvidence: 0,
      evidenceByPillar: {} as Record<FactorPillar, number>,
      evidenceByFactor: {},
      averageConfidence: 0,
      averageProcessingTime: 0,
      validationErrors: 0
    }
  }

  // Convert reviews to extraction inputs
  const inputs: EvidenceExtractionInput[] = reviews.map(review => {
    // Convert heightCm to display format (e.g., "5'6\"")
    const heightDisplay = review.heightCm
      ? `${Math.floor(review.heightCm / 30.48)}'${Math.round((review.heightCm % 30.48) / 2.54)}"`
      : undefined

    // Convert weightKg to lbs (e.g., "140 lbs")
    const weightDisplay = review.weightKg
      ? `${Math.round(review.weightKg * 2.205)} lbs`
      : undefined

    return {
      reviewText: review.content || '',
      reviewId: review.id,
      productId: review.productId,
      metadata: {
        sizePurchased: review.sizePurchased || undefined,
        height: heightDisplay,
        weight: weightDisplay,
        bodyType: review.bodyType || undefined
      }
    }
  })

  // Process in batches
  const startTime = Date.now()
  let processedCount = 0

  const results = await extractEvidenceBatch(inputs, {
    concurrency,
    onProgress: (completed, total) => {
      console.log(`⏳ Progress: ${completed}/${total} reviews processed`)
    }
  })

  const totalTime = Date.now() - startTime
  console.log(`\n✓ Extraction complete in ${(totalTime / 1000).toFixed(2)}s\n`)

  // Aggregate stats
  const stats: BatchProcessorStats = {
    totalReviews: reviews.length,
    processedReviews: results.length,
    skippedReviews: reviews.length - results.length,
    totalEvidence: 0,
    evidenceByPillar: {
      [FactorPillar.FIT]: 0,
      [FactorPillar.QUALITY]: 0,
      [FactorPillar.STYLE_VALUE]: 0,
      [FactorPillar.COMFORT]: 0,
      [FactorPillar.SUSTAINABILITY]: 0
    },
    evidenceByFactor: {},
    averageConfidence: 0,
    averageProcessingTime: totalTime / results.length,
    validationErrors: 0
  }

  let totalConfidence = 0

  // Save evidence to database
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const input = inputs[i]

    for (const evidence of result.evidence) {
      // Validate evidence
      const validation = validateEvidence(evidence)
      if (!validation.valid) {
        console.warn(`⚠️  Validation failed for evidence:`, validation.errors)
        stats.validationErrors++
        continue
      }

      // Update stats
      stats.totalEvidence++
      stats.evidenceByPillar[evidence.pillar]++
      stats.evidenceByFactor[evidence.factor] = (stats.evidenceByFactor[evidence.factor] || 0) + 1
      totalConfidence += evidence.confidence

      // Save to database
      if (saveToDatabase && input.productId && input.reviewId) {
        try {
          await prisma.evidenceTag.create({
            data: {
              productId: input.productId,
              reviewId: input.reviewId,
              sourceType: 'REVIEW',
              factor: evidence.factor,
              pillar: evidence.pillar,
              signal: evidence.signal,
              sentiment: evidence.sentiment,
              confidence: evidence.confidence,
              quote: evidence.quote,
              extractedBy: 'evidence_agent_v1'
            }
          })
        } catch (error) {
          console.error(`❌ Failed to save evidence to database:`, error)
        }
      }
    }
  }

  stats.averageConfidence = stats.totalEvidence > 0
    ? totalConfidence / stats.totalEvidence
    : 0

  // Print summary
  console.log('📈 Summary:')
  console.log(`   Reviews processed: ${stats.processedReviews}`)
  console.log(`   Total evidence: ${stats.totalEvidence}`)
  console.log(`   Avg evidence/review: ${(stats.totalEvidence / stats.processedReviews).toFixed(1)}`)
  console.log(`   Avg confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`)
  console.log(`   Validation errors: ${stats.validationErrors}`)
  console.log(`\n📊 Evidence by Pillar:`)
  Object.entries(stats.evidenceByPillar).forEach(([pillar, count]) => {
    console.log(`   ${pillar}: ${count}`)
  })
  console.log(`\n🎯 Top Factors:`)
  const topFactors = Object.entries(stats.evidenceByFactor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  topFactors.forEach(([factor, count]) => {
    console.log(`   ${factor}: ${count}`)
  })

  return stats
}

/**
 * Process a single product's reviews
 */
export async function processProduct(
  productId: string,
  options: Omit<BatchProcessorOptions, 'productId'> = {}
): Promise<BatchProcessorStats> {
  return processBatch({
    ...options,
    productId
  })
}

/**
 * Get processing status for a product
 */
export async function getProcessingStatus(productId: string) {
  const product = await prisma.clothingProduct.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          reviews: true,
          evidenceTags: true
        }
      }
    }
  })

  if (!product) {
    throw new Error(`Product not found: ${productId}`)
  }

  const evidenceByPillar = await prisma.evidenceTag.groupBy({
    by: ['pillar'],
    where: { productId },
    _count: {
      pillar: true
    }
  })

  const evidenceByFactor = await prisma.evidenceTag.groupBy({
    by: ['factor'],
    where: { productId },
    _count: {
      factor: true
    }
  })

  const avgConfidence = await prisma.evidenceTag.aggregate({
    where: { productId },
    _avg: {
      confidence: true
    }
  })

  return {
    product: {
      id: product.id,
      name: product.name,
      totalReviews: product._count.reviews,
      totalEvidence: product._count.evidenceTags
    },
    evidenceByPillar: evidenceByPillar.reduce((acc, { pillar, _count }) => {
      acc[pillar as FactorPillar] = _count.pillar
      return acc
    }, {} as Record<FactorPillar, number>),
    evidenceByFactor: evidenceByFactor.reduce((acc, { factor, _count }) => {
      acc[factor] = _count.factor
      return acc
    }, {} as Record<string, number>),
    averageConfidence: avgConfidence._avg.confidence || 0
  }
}
