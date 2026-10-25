/**
 * Ads rules (B11, decided 2026-10-25): the score picks which products may be advertised; money never changes a score.
 * Pure code, unit-tested.
 */
import type { Tag } from '../enrich/tags'

export const AD_MIN_SCORE = 70
export const HEADLINE_MAX = 40
export const BODY_MAX = 125

export type AdInput = { score: number | null; label: 'HIGH' | 'MEDIUM' | 'LOW' | 'NEW_LAUNCH' | null; tags: Tag[] }

/**
 * Eligible = rated well on enough evidence, no fake sale price, and not a frequent return. Reasons say why not.
 * "Often cheaper" is not disqualifying (the price is honest, just not the lowest lately): it's custom_label_2 in the
 * feed, so a campaign can hold those back during full-price periods if it wants.
 */
export function adEligibility(p: AdInput): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = []
  if (p.score === null) reasons.push('not rated yet')
  else if (p.score < AD_MIN_SCORE) reasons.push(`score ${Math.round(p.score)} is below ${AD_MIN_SCORE}`)
  if (p.label === 'LOW' || p.label === 'NEW_LAUNCH') reasons.push(p.label === 'LOW' ? 'low confidence (thin or mixed evidence)' : 'new launch (early score only)')
  for (const t of p.tags) {
    if (t.key === 'fake_discount') reasons.push('fake sale price')
    if (t.key === 'fit_returns_high') reasons.push('often returned for fit')
    if (t.key === 'quality_returns_high') reasons.push('high quality returns')
  }
  return { eligible: reasons.length === 0, reasons }
}

/** Score tier for ad-feed custom labels: lets an ad tool target "top" products without knowing our maths. */
export function scoreTier(score: number | null): string {
  if (score === null) return 'veritas_unrated'
  return score >= 85 ? 'veritas_top' : score >= 75 ? 'veritas_great' : score >= AD_MIN_SCORE ? 'veritas_good' : score >= 55 ? 'veritas_fair' : 'veritas_low'
}

export function priceStatus(tags: Tag[]): string {
  return tags.some((t) => t.key === 'fake_discount') ? 'fake_discount' : tags.some((t) => t.key === 'often_cheaper') ? 'often_cheaper' : 'fair_price'
}

/**
 * On-site sponsored slots: a sponsor's products can be shown only if eligible, never inside the organic
 * top 3, and are always labelled "Sponsored". Highest score first among the sponsor's eligible products.
 */
export function pickSponsored<T extends AdInput & { slug: string; brandSlug: string }>(pool: T[], sponsorBrands: string[], organicTop: string[], n = 1): T[] {
  return pool
    .filter((p) => sponsorBrands.includes(p.brandSlug) && !organicTop.slice(0, 3).includes(p.slug) && adEligibility(p).eligible)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.slug.localeCompare(b.slug))
    .slice(0, n)
}
