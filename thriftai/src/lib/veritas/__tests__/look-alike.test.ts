/** @jest-environment node */
import { LOOK_LIFT, LOOK_MIN, cosine, lookAlike, lookPhrase, visualWords } from '../visual/look-alike'
import { filterCandidates, styleMatch, type Candidate } from '../match/rank'

const cand = (over: Partial<Candidate>): Candidate =>
  ({ id: 'x', slug: 'x', name: 'Tee', brandSlug: 'b', brandName: 'B', category: 'TOPS', subcategory: 'tee', gender: 'UNISEX', text: 'tee', fitType: 'regular', silhouette: 'crew-tee', colors: ['Navy'], pattern: null, visualColors: [], colorFamilies: [], styleTags: [], length: 'regular', gsm: null, elastanePct: null, breathability: null, trendTag: null, launchDate: null, priceMin: 30, priceMax: 30, sellerCount: 1, score: 70, scoreWithSustainability: null, label: 'HIGH', earlyScore: null, pillars: {}, text_verified: null, fitAnswers: [], ...over }) as Candidate

/** A pool of 20 similarities around `base`, plus the given standouts. */
const pool = (base: number, standouts: Record<string, number> = {}) => new Map<string, number>([...Array.from({ length: 20 }, (_, i) => [`n${i}`, base + (i % 5) * 0.004] as [string, number]), ...Object.entries(standouts)])

describe('"looks like" matching from photo fingerprints (B18)', () => {
  it('matches items that stand out from the pool, best first (calibrated on dev images)', () => {
    // "t-shirt with automobile": the 3 car tees at 0.137–0.146, the rest ≤ 0.051.
    expect(lookAlike(pool(0.025, { carA: 0.137, carB: 0.146, carC: 0.142 }))).toEqual(['carB', 'carC', 'carA'])
  })
  it('never returns a closest guess: words no photo shows match nothing', () => {
    // "t-shirt with guitar": top 0.047.
    expect(lookAlike(pool(0.026, { a: 0.047 }))).toEqual([])
    // "shirt with car" over button-ups: everything 0.05–0.06.
    expect(lookAlike(pool(0.053, { a: 0.06 }))).toEqual([])
  })
  it('ignores words that lift every item ("soft", "summer", "stretch")', () => {
    // High absolute similarity, but less than LOOK_LIFT above the median.
    expect(lookAlike(pool(0.085, { a: 0.093 }))).toEqual([])
    // If more than half the pool "matches", the words aren't specific.
    const broad = new Map(Array.from({ length: 10 }, (_, i) => [`x${i}`, i < 6 ? 0.2 : 0.01] as [string, number]))
    expect(lookAlike(broad)).toEqual([])
  })
  it('needs both the floor and the lift', () => {
    expect(lookAlike(pool(0.0, { a: LOOK_MIN - 0.001 }))).toEqual([])
    expect(lookAlike(pool(LOOK_MIN, { a: LOOK_MIN + LOOK_LIFT - 0.01 }))).toEqual([])
    expect(lookAlike(pool(0.02, { a: 0.1 }))).toEqual(['a'])
  })
  it('small pools use a stricter absolute floor', () => {
    expect(lookAlike(new Map([['a', 0.12], ['b', 0.05]]))).toEqual(['a'])
    expect(lookAlike(new Map([['a', 0.09]]))).toEqual([])
    expect(lookAlike(new Map())).toEqual([])
  })
  it('builds the phrase and picks which words to try visually', () => {
    expect(lookPhrase('tee', ['automobile'])).toBe('t-shirt with automobile')
    expect(lookPhrase(undefined, ['palm', 'tree'])).toBe('clothing with palm tree')
    const inText = (t: string) => ['soft', 'organic'].includes(t)
    // Label matches stay; words product text knows stay text matches; unknown words go visual; short words skipped.
    expect(visualWords(['car', 'soft', 'automobile', 'xl'], ['car'], inText)).toEqual(['car', 'automobile'])
    expect(cosine([1, 0], [0.6, 0.8])).toBeCloseTo(0.6)
  })
})

describe('search with photo fingerprints (B18)', () => {
  const carLabel = cand({ id: 'car1', look: 't-shirt · red race car' })
  const carUnlabelled = cand({ id: 'car2', look: 't-shirt · vehicle illustration' })
  const plain = cand({ id: 'plain', look: 't-shirt' })
  const intent = { category: 'TOPS' as const, kind: 'tee' as const, priorities: {}, terms: ['car'] }

  it('a fingerprint match counts even when the photo label lacks the word', () => {
    expect(filterCandidates([carLabel, carUnlabelled, plain], intent, {}).map((x) => x.c.id)).toEqual(['car1'])
    const withAlike = { ...intent, lookAlike: { words: ['car'], ids: ['car2', 'car1'] } }
    expect(filterCandidates([carLabel, carUnlabelled, plain], withAlike, {}).map((x) => x.c.id)).toEqual(['car1', 'car2'])
  })
  it('words no label has ("automobile") filter by fingerprint alone', () => {
    const i = { ...intent, terms: ['automobile'], lookAlike: { words: ['automobile'], ids: ['car2'] } }
    expect(filterCandidates([carLabel, carUnlabelled, plain], i, {}).map((x) => x.c.id)).toEqual(['car2'])
    expect(styleMatch(carUnlabelled, i)).toEqual({ value: 100, matched: ['automobile'], missed: [] })
    expect(styleMatch(plain, i)?.missed).toEqual(['automobile'])
  })
  it('no fingerprint match: same behaviour as before (no look filter)', () => {
    const i = { ...intent, terms: ['vintage'] }
    expect(filterCandidates([carLabel, plain], i, {}).map((x) => x.c.id)).toEqual(['car1', 'plain'])
    expect(styleMatch(plain, i)).toBeNull()
  })
})
