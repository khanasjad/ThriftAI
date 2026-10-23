/**
 * Pricing Engine
 *
 * Main orchestrator for price tracking, comparison, and evidence generation
 */

import { PrismaClient } from '@prisma/client'
import {
  PriceComparison,
  PriceFairnessEvidence,
  PricingConfig,
  DEFAULT_PRICING_CONFIG,
  Retailer
} from './pricing-types'
import { comparePrices, generateMockPrices } from './price-comparison'
import { generatePriceFairnessEvidence } from './price-evidence-generator'

const prisma = new PrismaClient()

export interface PricingEngineOptions {
  productId?: string           // Price specific product
  saveToDatabase?: boolean     // Save to DB (default: true)
  saveEvidence?: boolean       // Save evidence to EvidenceTag (default: true)
  config?: PricingConfig       // Custom config
}

export interface PricingEngineResult {
  productId: string
  comparison: PriceComparison
  evidence: PriceFairnessEvidence
  saved: boolean
  evidenceSaved: boolean
  error?: string
}

/**
 * Analyze pricing for a single product
 */
export async function analyzeProductPricing(
  productId: string,
  brandPrice: number,
  options: Omit<PricingEngineOptions, 'productId'> = {}
): Promise<PricingEngineResult> {
  const {
    saveToDatabase = true,
    saveEvidence = true,
    config = DEFAULT_PRICING_CONFIG
  } = options

  try {
    // Step 1: Gather competitor prices
    // For demo purposes, use mock data
    // In production, this would call real scraping/API logic
    const competitorPrices = config.useMockData
      ? generateMockPrices(brandPrice, 4)
      : []  // TODO: Implement real scraping

    // Step 2: Compare prices
    const comparison = comparePrices(productId, brandPrice, competitorPrices)

    // Step 3: Generate evidence
    const evidence = generatePriceFairnessEvidence(comparison)

    // Step 4: Save to database
    let saved = false
    let evidenceSaved = false

    if (saveToDatabase) {
      await savePriceSnapshot(productId, brandPrice, competitorPrices)
      saved = true
    }

    if (saveEvidence) {
      await savePriceEvidence(evidence)
      evidenceSaved = true
    }

    return {
      productId,
      comparison,
      evidence,
      saved,
      evidenceSaved
    }
  } catch (error) {
    return {
      productId,
      comparison: null as any,
      evidence: null as any,
      saved: false,
      evidenceSaved: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Analyze pricing for all products
 */
export async function analyzeAllProductPricing(
  options: PricingEngineOptions = {}
): Promise<PricingEngineResult[]> {
  const {
    saveToDatabase = true,
    saveEvidence = true,
    config = DEFAULT_PRICING_CONFIG
  } = options

  // Get all clothing products with prices
  const products = await prisma.clothingProduct.findMany({
    where: {
      basePrice: {
        not: null
      }
    },
    select: {
      id: true,
      name: true,
      basePrice: true
    },
    take: 50  // Limit for demo
  })

  console.log(`Found ${products.length} products with prices`)

  const results: PricingEngineResult[] = []

  for (const product of products) {
    if (!product.basePrice) continue

    const result = await analyzeProductPricing(
      product.id,
      Number(product.basePrice),
      { saveToDatabase, saveEvidence, config }
    )

    results.push(result)

    if (result.error) {
      console.error(`Failed to analyze ${product.id}:`, result.error)
    } else {
      console.log(`✓ Analyzed ${product.name}: ${result.comparison.fairnessRating} (${result.comparison.fairnessScore}/100)`)
    }
  }

  return results
}

/**
 * Save price snapshot to database
 */
async function savePriceSnapshot(
  productId: string,
  brandPrice: number,
  competitorPrices: any[]
): Promise<void> {
  // Save brand's direct price
  await prisma.priceSnapshot.create({
    data: {
      productId,
      retailer: Retailer.BRAND_DIRECT,
      price: brandPrice,
      currency: 'USD',
      isOnSale: false
    }
  })

  // Save competitor prices
  for (const cp of competitorPrices) {
    await prisma.priceSnapshot.create({
      data: {
        productId,
        retailer: cp.retailer,
        price: cp.price,
        currency: cp.currency,
        isOnSale: cp.isOnSale,
        salePrice: cp.isOnSale ? cp.price : null,
        availability: cp.availability,
        sourceUrl: cp.url || null
      }
    })
  }
}

/**
 * Save price evidence to EvidenceTag table
 */
async function savePriceEvidence(evidence: PriceFairnessEvidence): Promise<void> {
  await prisma.evidenceTag.create({
    data: {
      productId: evidence.productId,
      sourceType: 'MANUAL',  // Price agent generates this
      factor: evidence.factor,
      pillar: 'STYLE_VALUE',
      signal: evidence.signal,
      sentiment: evidence.sentiment,
      confidence: evidence.confidence,
      quote: evidence.quote,
      extractedBy: 'pricing_agent_v1'
    }
  })
}

/**
 * Get price history for a product
 */
export async function getPriceHistory(
  productId: string,
  days: number = 90
): Promise<any[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return prisma.priceSnapshot.findMany({
    where: {
      productId,
      createdAt: {
        gte: since
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

/**
 * Get latest price comparison for a product
 */
export async function getLatestPriceComparison(
  productId: string
): Promise<any> {
  const snapshots = await prisma.priceSnapshot.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  if (snapshots.length === 0) {
    return null
  }

  const brandSnapshot = snapshots.find(s => s.retailer === Retailer.BRAND_DIRECT)
  if (!brandSnapshot) {
    return null
  }

  const competitorSnapshots = snapshots.filter(s => s.retailer !== Retailer.BRAND_DIRECT)

  return {
    brandPrice: Number(brandSnapshot.price),
    competitorPrices: competitorSnapshots.map(s => ({
      retailer: s.retailer,
      price: Number(s.price),
      isOnSale: s.isOnSale,
      availability: s.availability,
      scrapedAt: s.createdAt
    })),
    lastUpdated: brandSnapshot.createdAt
  }
}
