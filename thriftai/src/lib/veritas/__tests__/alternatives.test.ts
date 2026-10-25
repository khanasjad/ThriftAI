import { alternativesFor, type AltItem } from '../match/alternatives'

const item = (id: string, over: Partial<AltItem> = {}): AltItem => ({
  id,
  category: 'TOPS',
  gender: 'WOMENS',
  price: 30,
  score: 60,
  pillars: { FIT: 60, QUALITY: 60, STYLE_VALUE: 60, COMFORT: 60 },
  ...over,
})

describe('alternativesFor', () => {
  const target = item('t', { score: 55, pillars: { FIT: 40, QUALITY: 65, STYLE_VALUE: 60, COMFORT: 60 } })

  it('only suggests clearly better items in the same category, for the same shopper, at a similar price', () => {
    const pool = [
      item('better', { score: 65 }),
      item('barely', { score: 57 }),
      item('jeans', { score: 80, category: 'BOTTOMS' }),
      item('mens', { score: 80, gender: 'MENS' }),
      item('unisex', { score: 70, gender: 'UNISEX' }),
      item('pricey', { score: 90, price: 60 }),
      item('unrated', { score: null }),
    ]
    expect(alternativesFor(target, pool).map((a) => a.item.id).sort()).toEqual(['better', 'unisex'])
  })

  it('prefers the one that fixes the weakest pillar and says so', () => {
    const pool = [item('a', { score: 66, pillars: { FIT: 42, QUALITY: 80, STYLE_VALUE: 70, COMFORT: 70 } }), item('b', { score: 64, pillars: { FIT: 72, QUALITY: 60, STYLE_VALUE: 60, COMFORT: 60 } })]
    const [first] = alternativesFor(target, pool)
    expect(first.item.id).toBe('b')
    expect(first.reason).toBe('+9 overall · +32 on fit')
  })

  it('mentions a lower price and handles an unrated target', () => {
    const [cheap] = alternativesFor(target, [item('c', { score: 62, price: 20 })])
    expect(cheap.reason).toContain('$10 cheaper')
    const unrated = alternativesFor(item('u', { score: null }), [item('x', { score: 50 }), item('y', { score: 70 })])
    expect(unrated.map((a) => a.item.id)).toEqual(['y', 'x'])
  })
})
