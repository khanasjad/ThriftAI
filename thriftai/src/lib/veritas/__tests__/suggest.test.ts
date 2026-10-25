import { buildVocabulary, prefixMatch, suggest, type SuggestProduct } from '../match/suggest'

const p = (slug: string, over: Partial<SuggestProduct> = {}): SuggestProduct => ({
  slug, name: 'Everyday Crew Tee', brand: 'Lumen Basics', category: 'TOPS', subcategory: 'tee', silhouette: 'crew-tee', fitType: 'regular', colors: ['White'], price: 20, score: 60, ...over,
})

describe('autosuggest', () => {
  const products = [
    p('a', { score: 70 }),
    p('b', { colors: ['White', 'Black'], score: 80, brand: 'Velo Thread' }),
    p('c', { category: 'BOTTOMS', name: 'Wide Leg Jean', silhouette: 'wide-leg', fitType: 'relaxed', colors: ['Mid Wash'], score: null }),
  ]
  const collections = [{ slug: 'tees-that-hold-up', title: 'Tees that hold up in the wash' }]

  it('matches word prefixes', () => {
    expect(prefixMatch('whi te', 'white tee')).toBe(true)
    expect(prefixMatch('wide j', 'wide leg jeans')).toBe(true)
    expect(prefixMatch('black', 'white tee')).toBe(false)
  })

  it('builds phrases from catalog values with counts', () => {
    const v = buildVocabulary(products)
    expect(v.get('white tee')).toBe(2)
    expect(v.get('wide leg jeans')).toBe(1)
    expect(v.get('relaxed jeans')).toBe(1)
  })

  it('returns completions, score-ordered products and collections', () => {
    const s = suggest('whi', products, collections)
    expect(s.queries[0]).toBe('white tee')
    expect(s.products.map((x) => x.slug)).toEqual(['b', 'a'])
    expect(suggest('tees th', products, collections).collections).toHaveLength(1)
    expect(suggest('w', products, collections).queries).toEqual([])
  })
})
