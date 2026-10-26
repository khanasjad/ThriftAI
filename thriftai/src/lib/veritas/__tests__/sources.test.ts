import { FACTOR_TAXONOMY } from '../taxonomy/factor-taxonomy'
import { FACTOR_SOURCES } from '../taxonomy/sources'

describe('factor register', () => {
  it('has exactly one source entry per taxonomy factor', () => {
    expect(Object.keys(FACTOR_SOURCES).sort()).toEqual(FACTOR_TAXONOMY.map((f) => f.key).sort())
  })
  it('core factors cover most of the score from the standard feeds', () => {
    const core = FACTOR_TAXONOMY.filter((f) => f.pillar !== 'SUSTAINABILITY')
    const total = core.reduce((s, f) => s + f.weight, 0)
    const fromCore = core.filter((f) => FACTOR_SOURCES[f.key].availability === 'core').reduce((s, f) => s + f.weight, 0)
    expect(fromCore / total).toBeGreaterThan(0.85)
  })
})
