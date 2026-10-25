import { instantAnswers, type InstantInputs } from '../qa/instant'

const base: InstantInputs = {
  category: 'TOPS',
  fit: { small: 7, large: 1, tts: 4, total: 12 },
  mentions: { 'quality.wash_durability': { pos: 5, neg: 2, topPos: 'holds_up_well', topNeg: 'shrinks' } },
  fabricWeightGsm: 130,
  price: { fakeDiscount: false, oftenCheaper: null, days: 84 },
  returns: { fit: 20, quality: 3, units: 200, topReason: 'TOO_SMALL' },
}
const get = (i: InstantInputs, id: string) => instantAnswers(i).find((a) => a.id === id)!

describe('instant answers', () => {
  it('answers fit from counts', () => {
    expect(get(base, 'fit').answer).toBe('It tends to run small: consider a size up. Of 12 owners who answered: 4 true to size, 7 runs small, 1 runs large.')
  })
  it('summarises mentions and says when there is not enough', () => {
    expect(get(base, 'wash').answer).toBe('5 owners say it holds up in the wash; 2 report shrinking, fading or other wash problems (most often: “shrinks”).')
    expect(get(base, 'comfort')).toMatchObject({ enough: false, answer: 'Not enough owners have written about this yet.' })
  })
  it('uses fabric weight, price facts and return rates', () => {
    expect(get(base, 'fabric').answer).toMatch(/^Fabric weight is 130 gsm \(typical for this item: 140–180 gsm\)/)
    expect(get(base, 'price').answer).toMatch(/steady for 84 days/)
    expect(get({ ...base, price: { ...base.price, fakeDiscount: true } }, 'price').answer).toMatch(/never actually charged/)
    expect(get(base, 'returns').answer).toBe('10% of orders are sent back for fit (typical for this item: 8%) and 2% for quality or defects (typical: 3%).')
    expect(get({ ...base, returns: { ...base.returns, units: 10 } }, 'returns').enough).toBe(false)
  })
})
