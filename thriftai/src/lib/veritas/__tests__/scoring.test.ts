/** @jest-environment node */
import { FACTOR_TAXONOMY } from '../taxonomy/factor-taxonomy'
import { blendEarly, computeBaselines, confidenceLabel, grade, scoreFactor, scoreProduct, shrink, type ScoringEvidence } from '../scoring/v2'

const factor = (key: string) => FACTOR_TAXONOMY.find((f) => f.key === key)!
const ev = (f: string, sentiment: number, confidence = 1, n = 1): ScoringEvidence[] => Array.from({ length: n }, () => ({ factor: f, sentiment, confidence }))

/** Evidence that covers every core factor with the given sentiment. */
const everyCoreFactor = (sentiment: number, n = 10) =>
  FACTOR_TAXONOMY.filter((f) => f.pillar !== 'SUSTAINABILITY').flatMap((f) => ev(f.key, sentiment, 1, n))

describe('factor scores', () => {
  it('maps sentiment to 0–100 and shrinks toward the category mean', () => {
    // 2 pieces of +1 evidence: raw 100, shrunk = (2·100 + 8·50) / 10 = 60
    const r = scoreFactor(factor('fit.true_to_size'), ev('fit.true_to_size', 1, 1, 2))!
    expect(r.raw).toBe(100)
    expect(r.value).toBe(60)
    expect(r.confidence).toBe('LOW')
  })

  it('lets plenty of evidence beat a few glowing items', () => {
    const few = scoreFactor(factor('fit.true_to_size'), ev('fit.true_to_size', 1, 1, 6))!
    const many = scoreFactor(factor('fit.true_to_size'), ev('fit.true_to_size', 0.8, 1, 600))!
    expect(many.value).toBeGreaterThan(few.value)
  })

  it('weights evidence by confidence (flagged reviews count less)', () => {
    const r = scoreFactor(factor('fit.true_to_size'), [...ev('fit.true_to_size', 1, 0.3), ...ev('fit.true_to_size', -1, 1)])!
    expect(r.raw).toBeLessThan(50)
    expect(r.effectiveN).toBeCloseTo(1.3)
  })

  it('excludes factors with no evidence instead of scoring them 0', () => {
    expect(scoreFactor(factor('quality.longevity'), [])).toBeNull()
  })

  it('uses the given baseline', () => {
    expect(shrink(80, 8, { mean: 40, k: 8 })).toBe(60)
  })
})

describe('product score', () => {
  it('weights pillars 35/30/20/15 and ignores sustainability unless asked', () => {
    const r = scoreProduct({ evidence: everyCoreFactor(1, 200), reviewCount: 200, launchDate: new Date('2024-01-01') })
    expect(r.overall).toBeGreaterThanOrEqual(98)
    expect(r.overallWithSustainability).toBeNull()
    expect(r.label).toBe('HIGH')
    expect(r.grade).toBe('A')
    expect(r.factorsMissing).toEqual(FACTOR_TAXONOMY.filter((f) => f.pillar === 'SUSTAINABILITY').map((f) => f.key))
  })

  it('rescales with sustainability at 5%', () => {
    const r = scoreProduct({
      evidence: [...everyCoreFactor(1, 200), ...ev('sustainability.material_certs', -1, 1, 200)],
      reviewCount: 200,
      launchDate: null,
    })
    expect(r.overall).toBeGreaterThan(95)
    // 0.95 × ~99 + 0.05 × ~1 ≈ 94
    expect(r.overallWithSustainability!).toBeLessThan(r.overall!)
    expect(r.overallWithSustainability!).toBeGreaterThan(90)
  })

  it('does not publish a number when evidence covers too little of the score', () => {
    const r = scoreProduct({ evidence: ev('fit.true_to_size', 1, 1, 50), reviewCount: 50, launchDate: null })
    expect(r.publishable).toBe(false)
    expect(r.overall).toBeNull()
    expect(r.factors).toHaveLength(1) // factor scores are still kept
  })

  it('computes a pillar only from the factors that have evidence', () => {
    const r = scoreProduct({ evidence: [...ev('fit.true_to_size', 1, 1, 50), ...ev('fit.size_range', -1, 1, 50)], reviewCount: 50, launchDate: null })
    // (8·~93 + 3·~7) / 11
    expect(r.pillars.FIT.value!).toBeGreaterThan(65)
    expect(r.pillars.FIT.value!).toBeLessThan(75)
    expect(r.pillars.QUALITY.value).toBeNull()
  })
})

describe('labels, blend, grade, baselines', () => {
  const now = new Date('2026-10-24')
  it('labels new launches by review count or age', () => {
    expect(confidenceLabel({ reviewCount: 9, launchDate: null, coverage: 1, evidenceCount: 100, now })).toBe('NEW_LAUNCH')
    expect(confidenceLabel({ reviewCount: 50, launchDate: new Date('2026-10-10'), coverage: 1, evidenceCount: 100, now })).toBe('NEW_LAUNCH')
    expect(confidenceLabel({ reviewCount: 50, launchDate: null, coverage: 0.7, evidenceCount: 60, now })).toBe('HIGH')
    expect(confidenceLabel({ reviewCount: 20, launchDate: null, coverage: 0.45, evidenceCount: 20, now })).toBe('MEDIUM')
    expect(confidenceLabel({ reviewCount: 20, launchDate: null, coverage: 0.2, evidenceCount: 20, now })).toBe('LOW')
  })

  it('blends the early score with weight n / (n + 10)', () => {
    expect(blendEarly(80, 60, 10)).toBe(70)
    expect(blendEarly(null, 60, 0)).toBe(60)
    expect(blendEarly(80, null, 3)).toBe(80)
  })

  it('grades by band', () => {
    expect([90, 75, 60, 45, 10].map(grade)).toEqual(['A', 'B', 'C', 'D', 'F'])
  })

  it('computes category baselines only with enough products', () => {
    const b = computeBaselines([[{ factor: 'a', raw: 40 }, { factor: 'b', raw: 90 }], [{ factor: 'a', raw: 60 }], [{ factor: 'a', raw: 80 }]])
    expect(b.a).toEqual({ mean: 60, k: 8 })
    expect(b.b).toBeUndefined()
  })
})
