import { FACTOR_TAXONOMY } from '../taxonomy/factor-taxonomy'
import type { SellerSeries } from '../price/facts'

/** Everything the rating pipeline reads about one product. Loaded once per rating (graph/data.ts). */
export type ProductBundle = {
  product: {
    id: string
    slug: string
    name: string
    category: string
    subcategory: string | null
    description: string | null
    sizes: string[]
    hasPetite: boolean
    hasTall: boolean
    hasPlus: boolean
    materials: Record<string, number>
    fabricWeightGsm: number | null
    elastanePct: number | null
    fitType: string | null
    silhouette: string | null
    careInstructions: string | null
    certifications: string[]
    recycledContent: number | null
    launchDate: Date | null
    updatedAt: Date
  }
  brand: { id: string; name: string; publishesSuppliers: boolean; hasRepairProgram: boolean; hasTakeBack: boolean }
  reviews: {
    id: string
    title: string | null
    content: string
    rating: number
    language: string
    fitsAs: string | null
    sizePurchased: string | null
    heightCm: number | null
    bodyType: string | null
    wearDuration: string | null
    verified: boolean
    helpfulVotes: number
    date: Date
  }[]
  returns: { id: string; returnReason: string; detailedReason: string | null }[]
  prices: SellerSeries[]
  /** Latest trend phase for the product's silhouette, if tracked. */
  trendPhase: 'EMERGING' | 'PEAK' | 'DECLINING' | 'CLASSIC' | null
}

export type EvidenceSourceType = 'REVIEW' | 'RETURN' | 'SPEC' | 'PRICE' | 'TREND' | 'BRAND'

/**
 * A proposed piece of evidence. Sentiment is NOT chosen by whoever proposes it:
 * it comes from the taxonomy signal (agents propose, code decides).
 */
export type EvidenceDraft = {
  sourceType: EvidenceSourceType
  reviewId?: string
  returnId?: string
  factor: string
  signal: string
  /** How clearly the source supports the signal, 0–1 (before any injection penalty). */
  confidence: number
  quote: string | null
  /** Who proposed it: 'code:<rule>' or 'agent:evidence'. */
  origin: string
}

const SIGNALS = new Map(FACTOR_TAXONOMY.map((f) => [f.key, new Map(f.signals.map((s) => [s.signal, s.sentiment]))]))
const PILLAR = new Map(FACTOR_TAXONOMY.map((f) => [f.key, f.pillar]))

export function signalSentiment(factor: string, signal: string): number | null {
  return SIGNALS.get(factor)?.get(signal) ?? null
}
export function pillarOf(factor: string) {
  return PILLAR.get(factor) ?? null
}
export function signalsFor(factor: string) {
  return [...(SIGNALS.get(factor)?.keys() ?? [])]
}
export const FACTOR_KEYS = FACTOR_TAXONOMY.map((f) => f.key) as [string, ...string[]]
