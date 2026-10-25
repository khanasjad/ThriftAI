/** @jest-environment node */
import { makeShopkeeperAgent, MAX_SHOPKEEPER_QUESTIONS } from '../agents/shopkeeper'
import { MockClient, mockMessage, mockToolUse } from '../harness/llm'
import { runAgent } from '../harness/loop'
import { MemorySink } from '../harness/telemetry'
import { buildFacets } from '../match/facets'
import { filterCandidates, type Candidate } from '../match/rank'
import { checkReply } from '../text/check'

jest.mock('server-only', () => ({}))
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { filtersToIntent } = require('../graph/answer-search') as typeof import('../graph/answer-search')

process.env.VERITAS_MODEL_ROUTER = 'claude-haiku-5-5'

let n = 0
const cand = (over: Partial<Candidate> = {}): Candidate => ({
  id: `c${++n}`,
  slug: `c${n}`,
  name: `Product ${n}`,
  brandSlug: 'b',
  brandName: 'B',
  category: 'BOTTOMS',
  subcategory: 'jeans',
  text: '',
  fitType: 'regular',
  silhouette: 'straight',
  colors: ['Black'],
  pattern: null,
  visualColors: [],
  colorFamilies: [],
  styleTags: [],
  gender: 'UNISEX',
  length: null,
  gsm: 350,
  elastanePct: 1,
  breathability: null,
  trendTag: null,
  launchDate: null,
  priceMin: 60,
  priceMax: 60,
  sellerCount: 1,
  score: 70,
  scoreWithSustainability: 70,
  label: 'MEDIUM',
  earlyScore: null,
  pillars: {},
  text_verified: null,
  fitAnswers: [],
  ...over,
})

const base = { priorities: {}, terms: [] }

describe('new filters', () => {
  const cs = [cand({ colors: ['Black'] }), cand({ colors: ['Black', 'Ecru'] }), cand({ colors: ['Heather Grey'], silhouette: 'wide-leg', priceMin: 120, priceMax: 130 })]
  it('include colours by name containment', () => {
    expect(filterCandidates(cs, { ...base, colors: ['grey'] }, {}).map((x) => x.c.id)).toEqual([cs[2].id])
  })
  it('exclude a colour only when it is the product’s only colour', () => {
    expect(filterCandidates(cs, { ...base, excludeColors: ['Black'] }, {}).map((x) => x.c.id)).toEqual([cs[1].id, cs[2].id])
  })
  it('filter by cut and price range', () => {
    expect(filterCandidates(cs, { ...base, cuts: ['wide-leg'] }, {}).map((x) => x.c.id)).toEqual([cs[2].id])
    expect(filterCandidates(cs, { ...base, minPrice: 100 }, {}).map((x) => x.c.id)).toEqual([cs[2].id])
  })
  it('filter by gender, keeping unisex items for everyone', () => {
    const g = [cand({ gender: 'MENS' }), cand({ gender: 'WOMENS' }), cand({ gender: 'UNISEX' })]
    expect(filterCandidates(g, { ...base, gender: 'WOMENS' }, {}).map((x) => x.c.id)).toEqual([g[1].id, g[2].id])
  })
  it('filter tee length but ignore it for jeans', () => {
    const tees = [cand({ category: 'TOPS', length: 'cropped' }), cand({ category: 'TOPS', length: 'longline' }), cand({ length: null })]
    expect(filterCandidates(tees, { ...base, length: 'longline' }, {}).map((x) => x.c.id)).toEqual([tees[1].id, tees[2].id])
  })
})

describe('facets', () => {
  it('count what is actually available, ignoring the facet’s own filter', () => {
    const cs = [cand({ colors: ['Black'], fitType: 'slim' }), cand({ colors: ['Ecru'], fitType: 'relaxed' }), cand({ category: 'TOPS', colors: ['White'] })]
    const f = buildFacets(cs, { ...base, category: 'BOTTOMS', colors: ['Black'] })
    expect(f.matching).toBe(1)
    expect(f.colors.map((c) => c.value)).toEqual(['Black', 'Ecru']) // other jeans colours still offered
    expect(f.fits.map((x) => x.value)).toEqual(['slim']) // fit options within the chosen colour
    expect(f.categories.map((c) => c.label)).toEqual(['Jeans']) // the only tee is White, not Black
    expect(f.priceBands.at(-1)!.label).toBe('No limit')
  })
})

describe('agent output is validated by code', () => {
  const facets = buildFacets([cand({ colors: ['Heather Grey'], silhouette: 'wide-leg' }), cand({ colors: ['Black'], silhouette: 'bootcut' })], base)
  it('maps colours and cuts to real catalog values and drops unknown ones', () => {
    const i = filtersToIntent(
      {
        category: 'BOTTOMS',
        gender: 'WOMENS',
        min_price: null,
        max_price: 80,
        colors: ['grey', 'Neon Pink'],
        exclude_colors: ['Black'],
        fit: 'relaxed',
        cuts: ['Wide-leg', 'flare'],
        patterns: [],
        length: null,
        climate: null,
        occasion: 'weekend',
        priorities: ['COMFORT'],
        sustainability: false,
      },
      facets,
    )
    expect(i).toMatchObject({ category: 'BOTTOMS', maxPrice: 80, colors: ['Heather Grey'], cuts: ['wide-leg'], excludeColors: ['Black'], priorities: { COMFORT: 1.5 } })
  })
  it('replies with product names or hype are replaced', () => {
    expect(checkReply('Got it, under $40. What colour do you like?', ['Curved-Hem Longline Tee'])).toBe('Got it, under $40. What colour do you like?')
    expect(checkReply('Try the Curved-Hem Longline Tee, it is lovely.', ['Curved-Hem Longline Tee'])).toBeNull()
    expect(checkReply('This one is perfect for you!', [])).toBeNull()
  })
  it('the shopkeeper runs through the harness with a strict schema', async () => {
    const turn = {
      reply: 'Jeans it is. What cut do you like?',
      filters: { category: 'BOTTOMS', gender: null, min_price: null, max_price: null, colors: [], exclude_colors: [], fit: null, cuts: [], patterns: [], length: null, climate: null, occasion: null, priorities: [], sustainability: false },
      next_question: { slot: 'cut', question: 'What cut do you like?', chips: ['wide-leg', 'bootcut'] },
      ready: false,
      off_topic: false,
    }
    const llm = new MockClient(() => mockMessage([mockToolUse('finish', turn)], 'tool_use'))
    const r = await runAgent(makeShopkeeperAgent(), 'Shopper: jeans', { llm, sink: new MemorySink(), envName: 'test', spendCapUsd: 15 })
    expect(r.status).toBe('OK')
    expect(r.finish?.next_question?.slot).toBe('cut')
    expect(MAX_SHOPKEEPER_QUESTIONS).toBe(4)
  })
})
