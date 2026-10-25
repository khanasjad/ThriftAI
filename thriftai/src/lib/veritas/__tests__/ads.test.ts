/** @jest-environment node */
import { adEligibility, pickSponsored, priceStatus, scoreTier } from '../ads/rules'
import type { Tag } from '../enrich/tags'

const tag = (key: string): Tag => ({ key, label: key, tone: 'warn', detail: '', group: 'price' })

describe('ad rules', () => {
  it('only well-scored, confident, honestly priced products are eligible', () => {
    expect(adEligibility({ score: 80, label: 'HIGH', tags: [] })).toEqual({ eligible: true, reasons: [] })
    expect(adEligibility({ score: 65, label: 'HIGH', tags: [] }).reasons).toEqual(['score 65 is below 70'])
    expect(adEligibility({ score: 90, label: 'LOW', tags: [] }).eligible).toBe(false)
    expect(adEligibility({ score: 90, label: 'HIGH', tags: [tag('fake_discount')] }).reasons).toEqual(['fake sale price'])
    expect(adEligibility({ score: 90, label: 'HIGH', tags: [tag('often_cheaper')] }).eligible).toBe(true)
    expect(adEligibility({ score: null, label: null, tags: [] }).reasons).toEqual(['not rated yet'])
  })

  it('maps tiers and price status', () => {
    expect([90, 78, 71, 60, 30, null].map(scoreTier)).toEqual(['veritas_top', 'veritas_great', 'veritas_good', 'veritas_fair', 'veritas_low', 'veritas_unrated'])
    expect(priceStatus([tag('often_cheaper')])).toBe('often_cheaper')
    expect(priceStatus([])).toBe('fair_price')
  })

  it('sponsored slots: sponsor’s eligible products only, never one of the organic top 3', () => {
    const p = (slug: string, brandSlug: string, score: number) => ({ slug, brandSlug, score, label: 'HIGH' as const, tags: [] })
    const pool = [p('a', 'sponsor', 90), p('b', 'sponsor', 80), p('c', 'sponsor', 60), p('d', 'other', 95)]
    expect(pickSponsored(pool, ['sponsor'], ['a', 'x', 'y']).map((x) => x.slug)).toEqual(['b'])
    expect(pickSponsored(pool, ['sponsor'], ['a', 'b', 'y'])).toEqual([]) // c is below the bar: empty beats a bad ad
  })
})

describe('ad line checks', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { checkAdLine } = require('../ads/copy') as typeof import('../ads/copy')
  const items = [{ id: 'c1', kind: 'fact' as const, factor: 'fit.true_to_size', text: '9 of 11 owners who wrote about it: true to size (fit.true_to_size).', sentiment: 1 }]
  it('accepts a supported line and rejects hype, urgency, prices, invented numbers and length', () => {
    expect(checkAdLine('True to size for 9 of 11 owners', 40, ['c1'], items)).toBeNull()
    expect(checkAdLine('The perfect tee', 40, ['c1'], items)).toBe('hype')
    expect(checkAdLine('Buy now, true to size', 40, ['c1'], items)).toBe('urgency or exclamation')
    expect(checkAdLine('True to size, 20% off', 40, ['c1'], items)).toBe('price or discount claim')
    expect(checkAdLine('True to size for 95% of owners', 40, ['c1'], items)).toMatch(/numbers not in the cited evidence/)
    expect(checkAdLine('x'.repeat(41), 40, ['c1'], items)).toBe('longer than 40 characters')
  })
})
