/** @jest-environment node */
import { CURRENT_WEIGHTS, MAX_SHIFT, calibrate, nearbyWeights, ranks, reweigh, reweighProduct, spearman, type Reference, type ScoredProduct } from '../evals/calibrate'

const prod = (i: number, pillars: Partial<ScoredProduct['pillars']>, over: Partial<ScoredProduct> = {}): ScoredProduct => {
  const p = { FIT: null, QUALITY: null, STYLE_VALUE: null, COMFORT: null, ...pillars }
  return { id: `p${i}`, slug: `p${i}`, name: `P${i}`, category: 'TOPS', overall: Math.round(reweigh(p, CURRENT_WEIGHTS) ?? 0), pillars: p, ...over }
}
const ref = (values: [string, number][], independent = true): Reference => ({ key: 'r', label: 'Ref', independent, note: '', values: new Map(values) })

describe('calibration (scores vs. owners and experts)', () => {
  it('ranks with ties and Spearman correlation', () => {
    expect(ranks([10, 20, 20, 5])).toEqual([2, 3.5, 3.5, 1])
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1)
    expect(spearman([1, 2, 3, 4], [40, 30, 20, 10])).toBeCloseTo(-1)
    expect(spearman([1, 2], [1, 2])).toBeNull()
    expect(spearman([1, 1, 1], [1, 2, 3])).toBeNull()
  })
  it('re-weighs over the pillars that have evidence, with the new-launch blend', () => {
    expect(reweigh({ FIT: 80, QUALITY: 60, STYLE_VALUE: null, COMFORT: null }, CURRENT_WEIGHTS)).toBeCloseTo((80 * 35 + 60 * 30) / 65)
    expect(reweigh({ FIT: null, QUALITY: null, STYLE_VALUE: null, COMFORT: null }, CURRENT_WEIGHTS)).toBeNull()
    const p = prod(1, { FIT: 80, QUALITY: 80, STYLE_VALUE: 80, COMFORT: 80 }, { earlyScore: 50, reviewCount: 10 })
    expect(reweighProduct(p, CURRENT_WEIGHTS)).toBeCloseTo(65) // w = 10 / 20
  })
  it('nearby weights stay within the shift and sum to 100', () => {
    const all = nearbyWeights()
    expect(all.length).toBeGreaterThan(10)
    expect(all).toContainEqual(CURRENT_WEIGHTS)
    for (const w of all) {
      expect(Object.values(w).reduce((s, x) => s + x, 0)).toBe(100)
      for (const k of Object.keys(w) as (keyof typeof w)[]) expect(Math.abs(w[k] - CURRENT_WEIGHTS[k])).toBeLessThanOrEqual(MAX_SHIFT)
    }
  })
  it('finds disagreements and suggests weights only from independent references, never applying them', () => {
    // Experts care only about fit; quality is anti-correlated with fit in this sample.
    const ps = Array.from({ length: 30 }, (_, i) => prod(i, { FIT: 40 + i * 2, QUALITY: 100 - i * 3, STYLE_VALUE: 60, COMFORT: 60 }))
    const experts = ref(ps.map((p, i) => [p.id, i]))
    const r = calibrate(ps, [experts])
    expect(r.references[0].perPillar.FIT).toBeCloseTo(1)
    expect(r.references[0].perPillar.QUALITY).toBeCloseTo(-1)
    // Today's weights rank them backwards; the smallest change that fixes it moves 5 points from quality to fit.
    expect(r.suggestion?.rhoNow).toBeCloseTo(-1)
    expect(r.suggestion?.rhoBest).toBeCloseTo(1)
    expect(r.suggestion?.best).toEqual({ FIT: 40, QUALITY: 25, STYLE_VALUE: 20, COMFORT: 15 })
    expect(r.suggestion?.worthIt).toBe(true)
    expect(r.reweighCheck.maxDiff).toBeLessThanOrEqual(0.5)
    // Owner stars (not independent) are reported but never used to tune weights.
    expect(calibrate(ps, [ref(ps.map((p, i) => [p.id, i]), false)]).suggestion).toBeNull()
  })
  it('too few products: no correlation claimed, no weight change', () => {
    const ps = Array.from({ length: 5 }, (_, i) => prod(i, { FIT: 50 + i }))
    const r = calibrate(ps, [ref(ps.map((p, i) => [p.id, i]))])
    expect(r.references[0].rho).toBeNull()
    expect(r.suggestion?.worthIt).toBe(false)
  })
})
