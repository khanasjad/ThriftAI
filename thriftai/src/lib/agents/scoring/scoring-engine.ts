/**
 * Scoring Engine
 *
 * Main orchestrator that loads evidence from database, calculates scores,
 * and saves results to FactorScore and ProductScore tables.
 */

import { PrismaClient } from '@prisma/client'
import { calculateProductScore, formatProductScore } from './product-scorer'
import { calculateAllFactorScores } from './factor-scorer'
import type { EvidenceData } from './factor-scorer'
import { ProductScore, ScoringConfig, DEFAULT_SCORING_CONFIG } from './scoring-types'

const prisma = new PrismaClient()

export interface ScoringEngineOptions {
  productId?: string           // Score specific product
  saveToDatabase?: boolean     // Save scores to DB (default: true)
  config?: ScoringConfig       // Custom scoring config
}

export interface ScoringEngineResult {
  productId: string
  productScore: ProductScore
  saved: boolean
  error?: string
}

/**
 * Score a single product
 */
export async function scoreProduct(
  productId: string,
  options: Omit<ScoringEngineOptions, 'productId'> = {}
): Promise<ScoringEngineResult> {
  const {
    saveToDatabase = true,
    config = DEFAULT_SCORING_CONFIG
  } = options

  try {
    // Load evidence from database
    const evidence = await prisma.evidenceTag.findMany({
      where: { productId },
      select: {
        factor: true,
        signal: true,
        sentiment: true,
        confidence: true,
        quote: true
      }
    })

    // Get review count
    const reviewCount = await prisma.clothingReview.count({
      where: { productId }
    })

    // Convert Prisma Decimal to number
    const evidenceData: EvidenceData[] = evidence.map(e => ({
      factor: e.factor,
      signal: e.signal,
      sentiment: Number(e.sentiment),
      confidence: Number(e.confidence),
      quote: e.quote || undefined
    }))

    // Calculate product score
    const productScore = calculateProductScore(productId, evidenceData, reviewCount, config)

    // Save to database
    let saved = false
    if (saveToDatabase) {
      await saveProductScore(productScore)
      saved = true
    }

    return {
      productId,
      productScore,
      saved
    }
  } catch (error) {
    return {
      productId,
      productScore: null as any,
      saved: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Score all products with evidence
 */
export async function scoreAllProducts(
  options: ScoringEngineOptions = {}
): Promise<ScoringEngineResult[]> {
  const {
    saveToDatabase = true,
    config = DEFAULT_SCORING_CONFIG
  } = options

  // Get all products with evidence
  const productsWithEvidence = await prisma.evidenceTag.groupBy({
    by: ['productId'],
    _count: {
      productId: true
    }
  })

  console.log(`Found ${productsWithEvidence.length} products with evidence`)

  const results: ScoringEngineResult[] = []

  for (const { productId } of productsWithEvidence) {
    const result = await scoreProduct(productId, { saveToDatabase, config })
    results.push(result)

    if (result.error) {
      console.error(`Failed to score product ${productId}:`, result.error)
    } else {
      console.log(`✓ Scored ${productId}: ${result.productScore.overall}/100 (${result.productScore.grade})`)
    }
  }

  return results
}

/**
 * Save product score to database
 */
async function saveProductScore(productScore: ProductScore): Promise<void> {
  const { productId, overall, grade, confidence, pillars, summary } = productScore

  // Save or update ProductScore
  await prisma.productScore.upsert({
    where: { productId },
    create: {
      productId,
      overall: Math.round(overall),
      grade,
      confidence,
      fit: pillars.fit?.percentage,
      quality: pillars.quality?.percentage,
      styleValue: pillars.styleValue?.percentage,
      comfort: pillars.comfort?.percentage,
      sustainability: pillars.sustainability?.percentage,
      factorsIncluded: summary.factorsCovered.toString(),
      factorsMissing: [],
      isNewLaunch: summary.isNewLaunch
    },
    update: {
      overall: Math.round(overall),
      grade,
      confidence,
      fit: pillars.fit?.percentage,
      quality: pillars.quality?.percentage,
      styleValue: pillars.styleValue?.percentage,
      comfort: pillars.comfort?.percentage,
      sustainability: pillars.sustainability?.percentage,
      factorsIncluded: summary.factorsCovered.toString(),
      factorsMissing: [],
      isNewLaunch: summary.isNewLaunch,
      updatedAt: new Date()
    }
  })

  // Save individual factor scores
  const factorScores = calculateAllFactorScores(
    [], // Will be loaded from evidence
    productScore.version === 'v1.0' ? DEFAULT_SCORING_CONFIG : DEFAULT_SCORING_CONFIG
  )

  // Load evidence for factor scores
  const evidence = await prisma.evidenceTag.findMany({
    where: { productId },
    select: {
      factor: true,
      signal: true,
      sentiment: true,
      confidence: true
    }
  })

  const evidenceData: EvidenceData[] = evidence.map(e => ({
    factor: e.factor,
    signal: e.signal,
    sentiment: Number(e.sentiment),
    confidence: Number(e.confidence)
  }))

  const calculatedFactorScores = calculateAllFactorScores(evidenceData, DEFAULT_SCORING_CONFIG)

  // Save each factor score
  for (const factorScore of calculatedFactorScores) {
    if (factorScore.evidenceCount > 0) {
      await prisma.factorScore.upsert({
        where: {
          productId_factor_version: {
            productId,
            factor: factorScore.factor,
            version: productScore.version
          }
        },
        create: {
          productId,
          factor: factorScore.factor,
          pillar: factorScore.pillar,
          value: factorScore.percentage,
          weight: factorScore.maxPoints,
          evidenceCount: factorScore.evidenceCount,
          confidence: factorScore.confidence,
          version: productScore.version
        },
        update: {
          value: factorScore.percentage,
          weight: factorScore.maxPoints,
          evidenceCount: factorScore.evidenceCount,
          confidence: factorScore.confidence,
          updatedAt: new Date()
        }
      })
    }
  }
}

/**
 * Get product score from database
 */
export async function getProductScore(productId: string): Promise<ProductScore | null> {
  const score = await prisma.productScore.findUnique({
    where: { productId },
    include: {
      product: {
        select: {
          name: true,
          _count: {
            select: {
              reviews: true,
              evidenceTags: true
            }
          }
        }
      }
    }
  })

  if (!score) {
    return null
  }

  // Reconstruct ProductScore from database
  return {
    productId: score.productId,
    overall: score.overall,
    grade: score.grade as any,
    confidence: score.confidence as any,
    pillars: {
      fit: score.fit ? {
        pillar: 'FIT' as any,
        maxPoints: 35,
        earnedPoints: (score.fit / 100) * 35,
        percentage: score.fit,
        factorCount: 6,
        factorsCovered: 0,
        confidence: score.confidence as any,
        factors: []
      } : undefined,
      quality: score.quality ? {
        pillar: 'QUALITY' as any,
        maxPoints: 30,
        earnedPoints: (score.quality / 100) * 30,
        percentage: score.quality,
        factorCount: 6,
        factorsCovered: 0,
        confidence: score.confidence as any,
        factors: []
      } : undefined,
      styleValue: score.styleValue ? {
        pillar: 'STYLE_VALUE' as any,
        maxPoints: 20,
        earnedPoints: (score.styleValue / 100) * 20,
        percentage: score.styleValue,
        factorCount: 7,
        factorsCovered: 0,
        confidence: score.confidence as any,
        factors: []
      } : undefined,
      comfort: score.comfort ? {
        pillar: 'COMFORT' as any,
        maxPoints: 15,
        earnedPoints: (score.comfort / 100) * 15,
        percentage: score.comfort,
        factorCount: 5,
        factorsCovered: 0,
        confidence: score.confidence as any,
        factors: []
      } : undefined,
      sustainability: score.sustainability ? {
        pillar: 'SUSTAINABILITY' as any,
        maxPoints: 5,
        earnedPoints: (score.sustainability / 100) * 5,
        percentage: score.sustainability,
        factorCount: 3,
        factorsCovered: 0,
        confidence: score.confidence as any,
        factors: []
      } : undefined
    },
    summary: {
      totalEvidence: score.product._count.evidenceTags,
      factorsCovered: parseInt(score.factorsIncluded || '0'),
      factorsMissing: 27 - parseInt(score.factorsIncluded || '0'),
      averageConfidence: 0.8, // TODO: Calculate from factor scores
      isNewLaunch: score.isNewLaunch
    },
    calculatedAt: score.updatedAt,
    version: 'v1.0'
  }
}
