/**
 * Evidence that code can read directly from structured data, with no LLM:
 * reviewers' fit answers, the spec, the care label, certifications, brand programmes,
 * price history and trend phase. Each rule is small, documented and unit-tested.
 * Free-text reading (fabric feel, construction, wash problems…) is the evidence agent's job.
 *
 * Return rates and resale value are turned into a fixed number of weighted "votes" (see `votes`), so the
 * factor score equals the computed share and its weight is capped: one big number can't swamp the reviews.
 *
 * Not derived here, on purpose:
 * - Value for money and brand reputation need other products' scores (B4 roll-ups).
 */
import { computePriceFacts } from '../price/facts'
import type { EvidenceDraft, ProductBundle } from './types'

const FITS_AS_SIGNAL: Record<string, string> = { runs_small: 'runs_small', true_to_size: 'true_to_size', runs_large: 'runs_large' }

function fitAnswers(b: ProductBundle): EvidenceDraft[] {
  return b.reviews
    .filter((r) => r.fitsAs && FITS_AS_SIGNAL[r.fitsAs])
    .map((r) => ({
      sourceType: 'REVIEW' as const,
      reviewId: r.id,
      factor: 'fit.true_to_size',
      signal: FITS_AS_SIGNAL[r.fitsAs!],
      confidence: 0.9, // the reviewer answered the fit question directly
      quote: null,
      origin: 'code:fits_as',
    }))
}

function sizeRange(b: ProductBundle): EvidenceDraft[] {
  const p = b.product
  const extended = [p.hasPetite, p.hasTall, p.hasPlus].filter(Boolean).length
  const spec = (signal: string, confidence: number): EvidenceDraft => ({ sourceType: 'SPEC', factor: 'fit.size_range', signal, confidence, quote: null, origin: 'code:size_range' })
  if (p.sizes.length >= 7 || extended >= 2) return [spec('inclusive_sizing', 0.8)]
  if (p.sizes.length > 0 && p.sizes.length <= 4) return [spec('limited_sizes', 0.8)]
  if (!p.hasPlus) return [spec('no_plus_sizes', 0.5)]
  return []
}

/** Fabric weight vs. what's typical for the item (tees ~140–180 gsm, jeans ~300–380 gsm). */
function fabricWeight(b: ProductBundle): EvidenceDraft[] {
  const g = b.product.fabricWeightGsm
  if (!g) return []
  const sub = (b.product.subcategory ?? '').toLowerCase()
  const [thin, thick] = sub.includes('jean') || b.product.category === 'BOTTOMS' ? [300, 380] : sub === 'shirt' ? [95, 150] : sub.includes('tee') || b.product.category === 'TOPS' ? [140, 180] : [0, Infinity]
  const spec = (signal: string): EvidenceDraft => ({ sourceType: 'SPEC', factor: 'quality.fabric', signal, confidence: 0.5, quote: null, origin: 'code:fabric_weight' })
  if (g < thin) return [spec('thin_fabric')]
  if (g >= thick) return [spec('thick_fabric')]
  return []
}

/** Elastane only matters for bottoms here; rigid denim is a valid choice, so the signal is weak. */
function stretch(b: ProductBundle): EvidenceDraft[] {
  if (b.product.category !== 'BOTTOMS' || b.product.elastanePct === null) return []
  const e = b.product.elastanePct
  const spec = (signal: string, confidence: number): EvidenceDraft => ({ sourceType: 'SPEC', factor: 'comfort.stretch_mobility', signal, confidence, quote: null, origin: 'code:elastane' })
  if (e === 0) return [spec('no_stretch', 0.4)]
  if (e <= 3) return [spec('great_stretch', 0.6)]
  return [spec('too_stretchy', 0.4)]
}

function careLabel(b: ProductBundle): EvidenceDraft[] {
  const c = b.product.careInstructions
  if (!c) return []
  const spec = (signal: string): EvidenceDraft => ({ sourceType: 'SPEC', factor: 'comfort.easy_care', signal, confidence: 0.8, quote: c, origin: 'code:care_label' })
  if (/dry\s*clean/i.test(c)) return [spec('dry_clean_only')]
  if (/machine\s*wash/i.test(c)) return [spec('machine_washable')]
  return []
}

function sustainability(b: ProductBundle): EvidenceDraft[] {
  const p = b.product
  const out: EvidenceDraft[] = []
  const spec = (factor: string, signal: string, confidence: number, quote: string | null, origin: string, sourceType: 'SPEC' | 'BRAND' = 'SPEC'): EvidenceDraft => ({
    sourceType,
    factor,
    signal,
    confidence,
    quote,
    origin,
  })
  const certs = p.certifications.join(', ')
  if (p.certifications.some((c) => /gots/i.test(c))) out.push(spec('sustainability.material_certs', 'gots_certified', 0.9, certs, 'code:certifications'))
  if (Object.keys(p.materials).some((m) => /organic/i.test(m))) out.push(spec('sustainability.material_certs', 'organic_cotton', 0.8, null, 'code:materials'))
  if ((p.recycledContent ?? 0) >= 20 || Object.keys(p.materials).some((m) => /recycled/i.test(m)) || p.certifications.some((c) => /recycled/i.test(c)))
    out.push(spec('sustainability.material_certs', 'recycled_materials', 0.8, null, 'code:recycled'))
  if (b.brand.publishesSuppliers) out.push(spec('sustainability.ethical_production', 'transparent', 0.7, null, 'code:brand_suppliers', 'BRAND'))
  if (b.brand.hasRepairProgram) out.push(spec('sustainability.repair_takeback', 'repair_program', 0.8, null, 'code:brand_repair', 'BRAND'))
  if (b.brand.hasTakeBack) out.push(spec('sustainability.repair_takeback', 'takeback_program', 0.8, null, 'code:brand_takeback', 'BRAND'))
  return out
}

function priceFairness(b: ProductBundle): EvidenceDraft[] {
  const f = computePriceFacts(b.prices)
  const ev = (signal: string, confidence: number): EvidenceDraft => ({ sourceType: 'PRICE', factor: 'style_value.price_fairness', signal, confidence, quote: null, origin: 'code:price_facts' })
  if (f.days < 28) return [] // not enough history to judge
  const out: EvidenceDraft[] = []
  if (f.fakeDiscount) out.push(ev('fake_discount', 0.9))
  if (f.oftenCheaper) out.push(ev('better_price_elsewhere', 0.6))
  if (out.length === 0) out.push(ev('fair_price', 0.6))
  return out
}

/**
 * Turns a 0–1 share into VOTES drafts: round(share·VOTES) with the good signal, the rest with the bad one.
 * With ±1 sentiments the factor's raw score is then ≈ share·100, and the total weight is VOTES·confidence.
 */
const VOTES = 10
function votes(share: number, good: EvidenceDraft, bad: EvidenceDraft): EvidenceDraft[] {
  const n = Math.round(Math.max(0, Math.min(1, share)) * VOTES)
  return [...Array.from({ length: n }, () => ({ ...good })), ...Array.from({ length: VOTES - n }, () => ({ ...bad }))]
}

/** Typical return rates for the category (dev benchmark, to be replaced by real platform data). */
export const RETURN_BENCHMARK = { tee: { fit: 0.08, quality: 0.03 }, shirt: { fit: 0.1, quality: 0.03 }, jeans: { fit: 0.14, quality: 0.03 } } as const
/** Benchmark by product type (dev values until real platform data replaces them). */
export function returnBenchmark(category: string, subcategory?: string | null) {
  const s = (subcategory ?? '').toLowerCase()
  return category === 'BOTTOMS' || s.includes('jean') ? RETURN_BENCHMARK.jeans : s === 'shirt' ? RETURN_BENCHMARK.shirt : RETURN_BENCHMARK.tee
}
export const MIN_UNITS_FOR_RATE = 50
const FIT_REASONS = { TOO_SMALL: 'returned_too_small', TOO_LARGE: 'returned_too_large', POOR_FIT: 'returned_poor_fit' } as const
const QUALITY_REASONS = { POOR_QUALITY: 'returned_poor_quality', DAMAGE_DEFECT: 'returned_defect' } as const

/**
 * Fit and quality return *rates* (returns ÷ units sold), compared with the category benchmark:
 * 0% → 100, at the benchmark → 50, twice the benchmark or worse → 0. The bad signal is the most common reason.
 */
function returnRates(b: ProductBundle): EvidenceDraft[] {
  const units = b.product.unitsSold ?? 0
  if (units < MIN_UNITS_FOR_RATE) return []
  const bench = returnBenchmark(b.product.category, b.product.subcategory)
  const out: EvidenceDraft[] = []
  const rate = (reasons: Record<string, string>, factor: string, good: string, benchmark: number) => {
    const hits = b.returns.filter((r) => r.returnReason in reasons)
    const counts = new Map<string, number>()
    for (const r of hits) counts.set(r.returnReason, (counts.get(r.returnReason) ?? 0) + 1)
    const top = [...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0]
    const bad = top ? reasons[top] : Object.values(reasons)[0]
    const share = 1 - hits.length / units / (2 * benchmark)
    const draft = (signal: string): EvidenceDraft => ({ sourceType: 'RETURN', factor, signal, confidence: 0.6, quote: null, origin: 'code:return_rate' })
    out.push(...votes(share, draft(good), draft(bad)))
  }
  rate(FIT_REASONS, 'fit.return_rate_fit', 'kept_good_fit', bench.fit)
  rate(QUALITY_REASONS, 'quality.return_rate_quality', 'kept_good_quality', bench.quality)
  return out
}

/** Resale value: median resale price as % of retail. 10% or less → 0, 50% or more → 100. Weaker weight. */
function resale(b: ProductBundle): EvidenceDraft[] {
  const pct = b.product.resaleRetainedPct
  if (pct == null) return []
  const draft = (signal: string): EvidenceDraft => ({ sourceType: 'PRICE', factor: 'style_value.resale_value', signal, confidence: 0.4, quote: null, origin: 'code:resale' })
  return votes((pct - 10) / 40, draft('holds_value'), draft('no_resale_value'))
}

const TREND_SIGNAL = { EMERGING: 'on_trend', PEAK: 'on_trend', CLASSIC: 'timeless', DECLINING: 'dated' } as const

function trend(b: ProductBundle): EvidenceDraft[] {
  if (!b.trendPhase) return []
  return [{ sourceType: 'TREND', factor: 'style_value.trend_relevance', signal: TREND_SIGNAL[b.trendPhase], confidence: 0.7, quote: null, origin: 'code:trend_phase' }]
}

/** Trend tag shown separately from the score (product plan: Trending / Classic / Fading). */
export function trendTagFor(phase: ProductBundle['trendPhase']): 'TRENDING' | 'CLASSIC' | 'FADING' | null {
  if (!phase) return null
  return phase === 'CLASSIC' ? 'CLASSIC' : phase === 'DECLINING' ? 'FADING' : 'TRENDING'
}

export const STRUCTURED_RULES = { fitAnswers, sizeRange, fabricWeight, stretch, careLabel, sustainability, priceFairness, returnRates, resale, trend }

export function extractStructuredEvidence(b: ProductBundle): EvidenceDraft[] {
  return Object.values(STRUCTURED_RULES).flatMap((rule) => rule(b))
}
