/**
 * Evidence that code can read directly from structured data, with no LLM:
 * reviewers' fit answers, the spec, the care label, certifications, brand programmes,
 * price history and trend phase. Each rule is small, documented and unit-tested.
 * Free-text reading (fabric feel, construction, wash problems…) is the evidence agent's job.
 *
 * Not derived here, on purpose:
 * - Fit / quality return *rates* need order volumes; return events alone only show the mix of reasons.
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
  const [thin, thick] = sub.includes('jean') || b.product.category === 'BOTTOMS' ? [300, 380] : sub.includes('tee') || b.product.category === 'TOPS' ? [140, 180] : [0, Infinity]
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

export const STRUCTURED_RULES = { fitAnswers, sizeRange, fabricWeight, stretch, careLabel, sustainability, priceFairness, trend }

export function extractStructuredEvidence(b: ProductBundle): EvidenceDraft[] {
  return Object.values(STRUCTURED_RULES).flatMap((rule) => rule(b))
}
