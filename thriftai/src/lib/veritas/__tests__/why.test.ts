import { explainScore } from '../insights/why'

describe('explainScore', () => {
  const peers = [60, 70, 80].map((v) => ({ overall: v, factors: [{ factor: 'fit.true_to_size', value: v }, { factor: 'quality.fabric', value: 50 }] }))

  it('converts factor gaps to overall points with the scoring weights', () => {
    // Only FIT and QUALITY present → shares 35/65 and 30/65; one factor in each pillar.
    const why = explainScore({ overall: 50, factors: [{ factor: 'fit.true_to_size', value: 40, evidenceCount: 10 }, { factor: 'quality.fabric', value: 80, evidenceCount: 4 }], peers })
    expect(why.categoryMedian).toBe(70)
    expect(why.losses).toHaveLength(1)
    expect(why.losses[0]).toMatchObject({ factor: 'fit.true_to_size', median: 70, points: -16.2 })
    expect(why.losses[0].fix).toMatch(/size chart/)
    expect(why.strengths[0]).toMatchObject({ factor: 'quality.fabric', points: 13.8 })
  })

  it('lists missing core factors, heaviest first, and attaches issues', () => {
    const why = explainScore({ overall: 50, factors: [{ factor: 'fit.true_to_size', value: 40, evidenceCount: 10 }], peers, issues: { 'fit.true_to_size': { signal: 'runs_small', count: 7 } } })
    expect(why.missing[0].weight).toBe(8)
    expect(why.missing.some((m) => m.factor === 'fit.true_to_size')).toBe(false)
    expect(why.losses[0].topIssue).toEqual({ signal: 'runs_small', count: 7 })
  })
})
