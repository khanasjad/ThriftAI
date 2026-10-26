/**
 * The three drivers buyers and shoppers see (B2B plan §4, decided 2026-10-25). Pure code over stored results;
 * the 27-factor engine underneath is unchanged.
 *   Product quality = fit, quality and comfort pillars (what owners report in reviews and returns), by pillar weight
 *   Price           = price fairness and value for money factors
 *   Brand           = average published score of the brand's other rated products
 */
export type Driver = { value: number | null; basis: string }
export type Drivers = { quality: Driver; price: Driver; brand: Driver }

const QUALITY_PILLARS = [
  ['FIT', 35],
  ['QUALITY', 30],
  ['COMFORT', 15],
] as const
const PRICE_FACTORS = [
  ['style_value.price_fairness', 4],
  ['style_value.value_for_money', 5],
] as const

export function computeDrivers(input: {
  pillars: Partial<Record<'FIT' | 'QUALITY' | 'COMFORT', number | null>>
  factors: Record<string, number>
  reviewCount: number
  /** Published scores of the brand's other products (same pool), for brand reputation. */
  brandScores: number[]
  /** False when the source has no price (open review data): value then comes only from what reviewers say. */
  priceKnown?: boolean
}): Drivers {
  const q = QUALITY_PILLARS.filter(([k]) => typeof input.pillars[k] === 'number')
  const qw = q.reduce((s, [, w]) => s + w, 0)
  const quality: Driver = qw
    ? { value: Math.round(q.reduce((s, [k, w]) => s + input.pillars[k]! * w, 0) / qw), basis: `Fit, quality and comfort from ${input.reviewCount} reviews${q.length < 3 ? ' (some pillars still missing)' : ''}` }
    : { value: null, basis: 'Not enough reviews yet' }

  const p = PRICE_FACTORS.filter(([k]) => typeof input.factors[k] === 'number')
  const pw = p.reduce((s, [, w]) => s + w, 0)
  const price: Driver = pw
    ? {
        value: Math.round(p.reduce((s, [k, w]) => s + input.factors[k] * w, 0) / pw),
        basis:
          input.priceKnown === false
            ? 'What reviewers say about value (no price in the source)'
            : p.length === 2
              ? 'Price history (real discounts) and value vs. similar items'
              : p[0][0] === 'style_value.price_fairness'
                ? 'Price history (real discounts)'
                : 'Value vs. similar items',
      }
    : { value: null, basis: 'Not enough price history yet' }

  const n = input.brandScores.length
  const brand: Driver =
    n >= 2
      ? { value: Math.round(input.brandScores.reduce((s, x) => s + x, 0) / n), basis: `Average of the brand’s ${n} other rated products` }
      : { value: null, basis: 'Too few rated products from this brand yet' }

  return { quality, price, brand }
}
