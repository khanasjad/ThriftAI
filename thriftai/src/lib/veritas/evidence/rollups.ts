/**
 * Cross-product evidence (B4 "Trend & Brand" + "Price & Value", as code):
 *  - brand reputation from the brand's other published scores
 *  - value for money: fit + quality vs. price among published peers in the same subcategory
 *  - the new-launch early score
 *
 * Rule: roll-ups that read other products' scores use PUBLISHED scores only, so thin evidence never compounds.
 */
import type { EvidenceDraft } from './types'

export type PeerStat = {
  productId: string
  brandId: string
  category: string
  subcategory: string | null
  /** Null when the source has no price: such products never count in price comparisons. */
  price: number | null
  /** Private (tenant) products only compare with public products and their own tenant's. */
  isPrivate: boolean
  tenantId: string | null
  /** Published pillar scores (null when the product has no published score). */
  fit: number | null
  quality: number | null
  overall: number | null
  /** Reviewers' fit answers. */
  fitAnswers: { small: number; tts: number; large: number }
}

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
const sameGroup = (a: PeerStat, b: PeerStat) => a.category === b.category && (a.subcategory ?? '') === (b.subcategory ?? '')
const published = (p: PeerStat) => p.overall !== null && p.fit !== null && p.quality !== null
const fq = (p: PeerStat) => (p.fit! + p.quality!) / 2

/** Fit direction: +1 = everyone says runs small, −1 = everyone says runs large. Needs ≥ 5 answers. */
export function fitDirection(a: PeerStat['fitAnswers']) {
  const n = a.small + a.tts + a.large
  return n >= 5 ? (a.small - a.large) / n : null
}

export const SIZE_SPREAD_INCONSISTENT = 0.6
export const SIZE_SPREAD_CONSISTENT = 0.25

/** Brand-level: do this brand's products agree on how they fit? Needs ≥ 3 products with ≥ 5 fit answers. */
export function sizeConsistency(target: PeerStat, peers: PeerStat[]): EvidenceDraft[] {
  const dirs = peers.filter((p) => p.brandId === target.brandId).map((p) => fitDirection(p.fitAnswers)).filter((d): d is number => d !== null)
  if (dirs.length < 3) return []
  const spread = Math.max(...dirs) - Math.min(...dirs)
  const ev = (signal: string): EvidenceDraft => ({ sourceType: 'BRAND', factor: 'fit.size_consistency', signal, confidence: 0.6, quote: null, origin: 'code:brand_size_spread' })
  if (spread >= SIZE_SPREAD_INCONSISTENT) return [ev('inconsistent_sizing')]
  if (spread <= SIZE_SPREAD_CONSISTENT) return [ev('consistent_sizing')]
  return []
}

export const BRAND_GAP = 8

/** Brand reputation: the brand's other published products (≥ 2) vs. all published products, on fit + quality. */
export function brandReputation(target: PeerStat, peers: PeerStat[]): EvidenceDraft[] {
  const pub = peers.filter(published)
  const own = pub.filter((p) => p.brandId === target.brandId && p.productId !== target.productId)
  if (own.length < 2 || pub.length < 6) return []
  const gap = mean(own.map(fq)) - mean(pub.map(fq))
  const ev = (signal: string): EvidenceDraft => ({ sourceType: 'BRAND', factor: 'style_value.brand_reputation', signal, confidence: 0.6, quote: null, origin: 'code:brand_rollup' })
  if (gap >= BRAND_GAP) return [ev('trusted_brand')]
  if (gap <= -BRAND_GAP) return [ev('poor_reputation')]
  return []
}

function percentile(x: number, xs: number[]) {
  const below = xs.filter((v) => v < x).length
  const equal = xs.filter((v) => v === x).length
  return (below + equal / 2) / xs.length
}

/**
 * Value for money: where the product ranks on fit + quality vs. where it ranks on price, among published
 * peers in the same subcategory (≥ 4). Needs the target's own published fit + quality.
 */
export function valueForMoney(target: PeerStat, peers: PeerStat[]): EvidenceDraft[] {
  if (!published(target) || target.price === null) return []
  const group = peers.filter((p) => published(p) && sameGroup(p, target) && p.price !== null)
  if (group.length < 4) return []
  const qualityRank = percentile(fq(target), group.map(fq))
  const priceRank = percentile(target.price, group.map((p) => p.price!))
  const diff = qualityRank - priceRank
  const ev = (signal: string, confidence: number): EvidenceDraft => ({ sourceType: 'PRICE', factor: 'style_value.value_for_money', signal, confidence, quote: null, origin: 'code:value_vs_peers' })
  if (diff >= 0.25) return [ev('great_value', 0.6)]
  if (diff <= -0.25) return [ev('overpriced', 0.6)]
  if (Math.abs(diff) < 0.1) return [ev('fair_price', 0.5)]
  return []
}

export type EarlyScore = { score: number; components: { brandSimilar: number; spec: number | null; priceVsPeers: number | null }; basis: string }

/**
 * New-launch early score (product plan, "Special cases"): the brand's record on similar items, the spec, and price vs. peers.
 * Needs the brand's record: ≥ 1 published product in the same subcategory, or ≥ 2 in the category. Otherwise null.
 */
export function earlyScore(target: PeerStat, peers: PeerStat[], specValues: number[]): EarlyScore | null {
  const own = peers.filter((p) => p.brandId === target.brandId && p.productId !== target.productId && p.overall !== null)
  const similar = own.filter((p) => sameGroup(p, target))
  const inCategory = own.filter((p) => p.category === target.category)
  const basisSet = similar.length >= 1 ? similar : inCategory.length >= 2 ? inCategory : null
  if (!basisSet) return null
  const brandSimilar = mean(basisSet.map((p) => p.overall!))

  const spec = specValues.length ? mean(specValues) : null
  const priced = peers.filter((p) => p.overall !== null && sameGroup(p, target) && p.productId !== target.productId && p.price !== null).map((p) => p.price!)
  let priceVsPeers: number | null = null
  if (priced.length >= 3 && target.price !== null) {
    const median = [...priced].sort((a, b) => a - b)[Math.floor(priced.length / 2)]
    priceVsPeers = Math.max(0, Math.min(100, 50 + (50 * (median - target.price)) / median))
  }

  // Weights: brand record 60%, spec 25%, price 15%; missing parts are dropped and the rest re-weighted.
  const parts: [number, number][] = [[brandSimilar, 0.6]]
  if (spec !== null) parts.push([spec, 0.25])
  if (priceVsPeers !== null) parts.push([priceVsPeers, 0.15])
  const w = parts.reduce((s, [, x]) => s + x, 0)
  const score = Math.round(parts.reduce((s, [v, x]) => s + v * x, 0) / w)
  return {
    score,
    components: { brandSimilar: Math.round(brandSimilar), spec: spec === null ? null : Math.round(spec), priceVsPeers: priceVsPeers === null ? null : Math.round(priceVsPeers) },
    basis: similar.length >= 1 ? `${similar.length} similar product(s) from the brand` : `${inCategory.length} products from the brand in this category`,
  }
}

/**
 * Size consistency is NOT included: the B6 eval (2026-10-25) showed the cross-product spread rule flags the wrong
 * brand (7 true positives, 6 false positives on the golden truth; one outlier product dominates the spread).
 * Inconsistent sizing comes from what owners write ("fits differently than my other pair"), read by the evidence agent.
 * `sizeConsistency` stays exported for experiments and tests.
 */
export function rollupEvidence(target: PeerStat, peers: PeerStat[]): EvidenceDraft[] {
  return [...brandReputation(target, peers), ...valueForMoney(target, peers)]
}
