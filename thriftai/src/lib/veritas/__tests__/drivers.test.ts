import { computeDrivers } from '../scoring/drivers'

describe('three drivers', () => {
  it('weights quality pillars, averages price factors and the brand', () => {
    const d = computeDrivers({
      pillars: { FIT: 60, QUALITY: 80, COMFORT: 70 },
      factors: { 'style_value.price_fairness': 90, 'style_value.value_for_money': 45 },
      reviewCount: 12,
      brandScores: [70, 60, 65],
    })
    expect(d.quality.value).toBe(Math.round((60 * 35 + 80 * 30 + 70 * 15) / 80))
    expect(d.price.value).toBe(65)
    expect(d.brand).toEqual({ value: 65, basis: 'Average of the brand’s 3 other rated products' })
  })
  it('says honestly when a driver has no data', () => {
    const d = computeDrivers({ pillars: {}, factors: {}, reviewCount: 0, brandScores: [70] })
    expect(d.quality.value).toBeNull()
    expect(d.price.basis).toBe('Not enough price history yet')
    expect(d.brand.value).toBeNull()
  })

  it('says where value comes from when the source has no price (open review data)', () => {
    const d = computeDrivers({ pillars: { FIT: 60, QUALITY: 70, COMFORT: 80 }, factors: { 'style_value.value_for_money': 40 }, reviewCount: 50, brandScores: [], priceKnown: false })
    expect(d.price).toEqual({ value: 40, basis: 'What reviewers say about value (no price in the source)' })
  })
})
