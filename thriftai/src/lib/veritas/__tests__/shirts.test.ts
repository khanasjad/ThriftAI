/** @jest-environment node */
import { normaliseCategory, silhouetteFromTitle } from '../ingest/contract'
import { parseIntent } from '../match/intent'
import { returnBenchmark, STRUCTURED_RULES } from '../evidence/structured'
import { makeBundle } from '../__fixtures__/bundle'

describe('button-up shirts', () => {
  it('ingest tells t-shirts, shirts and jeans apart', () => {
    expect(normaliseCategory('Men > Tops > T-Shirts', 'Black Crew Tee')).toEqual({ category: 'TOPS', subcategory: 'tee' })
    expect(normaliseCategory('Shirts', 'Oxford Button-Down')).toEqual({ category: 'TOPS', subcategory: 'shirt' })
    expect(normaliseCategory('Tops', 'Brushed Flannel Shirt')).toEqual({ category: 'TOPS', subcategory: 'shirt' })
    expect(normaliseCategory('Bottoms', 'Straight Jeans')).toEqual({ category: 'BOTTOMS', subcategory: 'jeans' })
    expect(normaliseCategory('Dresses', 'Floral Maxi Dress')).toBeNull()
    expect(silhouetteFromTitle('Relaxed Linen Shirt', 'shirt')).toBe('linen-shirt')
    expect(silhouetteFromTitle('Short-Sleeve Camp Shirt', 'shirt')).toBe('short-sleeve-shirt')
  })

  it('"shirt" means a button-up; "t-shirt" means a tee', () => {
    expect(parseIntent('blue flowered shirt').kind).toBe('shirt')
    expect(parseIntent('white t-shirt').kind).toBe('tee')
    expect(parseIntent('oxford for work').kind).toBe('shirt')
    expect(parseIntent('black jeans')).toMatchObject({ kind: 'jeans', category: 'BOTTOMS' })
  })

  it('uses shirt-specific benchmarks and fabric weights', () => {
    expect(returnBenchmark('TOPS', 'shirt').fit).toBe(0.1)
    expect(returnBenchmark('TOPS', 'tee').fit).toBe(0.08)
    expect(returnBenchmark('BOTTOMS', 'jeans').fit).toBe(0.14)
    const shirt = (gsm: number) => STRUCTURED_RULES.fabricWeight(makeBundle({ product: { category: 'TOPS', subcategory: 'shirt', fabricWeightGsm: gsm } }))
    expect(shirt(85)[0].signal).toBe('thin_fabric')
    expect(shirt(120)).toEqual([])
    expect(shirt(160)[0].signal).toBe('thick_fabric')
  })
})
