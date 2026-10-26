/** @jest-environment node */
import { parseIntent } from '../match/intent'
import { colorHit, filterCandidates, styleMatch, type Candidate } from '../match/rank'
import { imageSource, isPrivateAddress, normaliseVisual } from '../graph/describe-image'
import { devPatternFor } from '../dev/patterns'

const cand = (over: Partial<Candidate>): Candidate =>
  ({ id: 'x', slug: 'x', name: 'Tee', brandSlug: 'b', brandName: 'B', category: 'TOPS', subcategory: 'tee', gender: 'UNISEX', text: '', fitType: 'regular', silhouette: 'crew-tee', colors: ['Navy'], pattern: null, visualColors: [], colorFamilies: [], styleTags: [], length: 'regular', gsm: null, elastanePct: null, breathability: null, trendTag: null, launchDate: null, priceMin: 30, priceMax: 30, sellerCount: 1, score: 70, scoreWithSustainability: null, label: 'HIGH', earlyScore: null, pillars: {}, text_verified: null, fitAnswers: [], ...over }) as Candidate

describe('style from photos', () => {
  it('reads patterns and colours from shopper words', () => {
    const i = parseIntent('blue flowered shirt under $40')
    expect(i).toMatchObject({ category: 'TOPS', maxPrice: 40, colors: ['blue'], patterns: ['floral'] })
    expect(parseIntent('plain grey tee').patterns).toEqual(['solid'])
    expect(parseIntent('checked jeans').patterns).toEqual(['plaid'])
  })

  it('"blue" finds navy by catalog name or photo colour family', () => {
    expect(colorHit(cand({ colors: ['Navy'] }), 'blue')).toBe(true)
    expect(colorHit(cand({ colors: ['Sage'], colorFamilies: ['green'] }), 'blue')).toBe(false)
    expect(colorHit(cand({ colors: ['Ecru'], visualColors: ['dusty blue'], colorFamilies: ['blue'] }), 'blue')).toBe(true)
  })

  it('pattern filter needs a photo reading; style match lists what matched', () => {
    const floral = cand({ id: 'f', pattern: 'floral' })
    const striped = cand({ id: 's', pattern: 'striped' })
    const unread = cand({ id: 'u', pattern: null })
    const intent = { ...parseIntent('blue flowered tee'), terms: [] }
    expect(filterCandidates([floral, striped, unread], intent, {}).map((x) => x.c.id)).toEqual(['f'])
    expect(styleMatch(floral, intent)).toEqual({ value: 100, matched: ['blue', 'floral'], missed: [] })
    expect(styleMatch(striped, intent)).toEqual({ value: 50, matched: ['blue'], missed: ['floral'] })
    expect(styleMatch(floral, { priorities: {}, terms: [] })).toBeNull()
  })

  it('cleans agent output and only reads local images from public/dev-images', () => {
    const n = normaliseVisual({
      is_clothing: true, garment: 't-shirt', colors: [{ name: ' Navy ', family: 'blue' }, { name: 'navy', family: 'blue' }], pattern: 'floral', pattern_detail: 'small pink flowers',
      neckline: 'v-neck', sleeve: 'short', shape: 'regular', motifs: [{ label: ' Roses ', kind: 'flower', placement: 'all-over' }, { label: 'roses', kind: 'flower', placement: 'all-over' }], print_text: '', style_tags: ['Summer', 'summer', 'Casual!', 'a-very-long-tag-name-that-goes-on'], description: 'A navy tee.', confidence: 'high',
    })
    expect(n.colors).toEqual([{ name: 'navy', family: 'blue' }])
    expect(n.style_tags).toEqual(['summer', 'casual'])
    expect(n.motifs).toEqual([{ label: 'roses', kind: 'flower', placement: 'all-over' }])
    return Promise.all([imageSource('/dev-images/../../.env.local'), imageSource('http://insecure.example/a.png')]).then(([a, b]) => {
      expect(a).toBeNull()
      expect(b).toBeNull()
      expect(isPrivateAddress('127.0.0.1')).toBe(true)
      expect(isPrivateAddress('10.1.2.3')).toBe(true)
      expect(isPrivateAddress('192.168.0.5')).toBe(true)
      expect(isPrivateAddress('169.254.169.254')).toBe(true) // cloud metadata endpoint
      expect(isPrivateAddress('::1')).toBe(true)
      expect(isPrivateAddress('93.184.216.34')).toBe(false)
    })
  })

  it('dev patterns are stable and jeans stay solid', () => {
    expect(devPatternFor('saltmarsh-co-soft-v-neck-tee', 'TOPS')).toBe('floral')
    expect(devPatternFor('anything', 'BOTTOMS')).toBe('solid')
  })
})
