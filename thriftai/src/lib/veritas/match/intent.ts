/**
 * Search intent: what the shopper asked for, from their words (this file) and/or the intent agent.
 * The deterministic parser always runs; the agent (when enabled) can fill gaps for messy phrasing.
 */
import type { PillarKey } from '../scoring/v2'

export type Fit = 'slim' | 'regular' | 'relaxed' | 'oversized'
export type Climate = 'hot' | 'mild' | 'cold'

export type SearchIntent = {
  category?: 'TOPS' | 'BOTTOMS'
  maxPrice?: number
  fit?: Fit
  climate?: Climate
  /** Pillar weight boosts, e.g. { COMFORT: 1.5 } for "soft and comfy". */
  priorities: Partial<Record<PillarKey, number>>
  sustainability?: boolean
  occasion?: string
  /** Remaining words, matched against product text. */
  terms: string[]
  offTopic?: boolean
}

/** What we know about the shopper (saved profile), merged with intent for matching. */
export type ShopperContext = {
  heightCm?: number | null
  bodyType?: string | null
  preferredFit?: Fit | null
  climate?: Climate | null
  budgetMax?: number | null
  priorities?: Partial<Record<PillarKey, number>> | null
  brandAllow?: string[]
  brandDeny?: string[]
  sustainabilityOn?: boolean
}

const STOP = new Set(
  'a an and the for with that dont don’t doesnt wont won’t will not under over below less than me my i want need looking something some to of in on is it its are be by from or very really good nice best great one ones which who what out up get go goes am im i’m please find show'.split(' '),
)
const CATEGORY: Record<string, 'TOPS' | 'BOTTOMS'> = {
  tee: 'TOPS', tees: 'TOPS', 't-shirt': 'TOPS', tshirt: 'TOPS', 'tshirts': 'TOPS', shirt: 'TOPS', top: 'TOPS', tops: 'TOPS',
  jeans: 'BOTTOMS', jean: 'BOTTOMS', denim: 'BOTTOMS', pants: 'BOTTOMS', trousers: 'BOTTOMS',
}
const FIT: Record<string, Fit> = { slim: 'slim', skinny: 'slim', fitted: 'slim', tapered: 'slim', regular: 'regular', classic: 'regular', straight: 'regular', relaxed: 'relaxed', loose: 'relaxed', baggy: 'relaxed', wide: 'relaxed', oversized: 'oversized', boxy: 'oversized' }
const CLIMATE: Record<string, Climate> = { hot: 'hot', summer: 'hot', humid: 'hot', warm: 'hot', heat: 'hot', breathable: 'hot', cold: 'cold', winter: 'cold', chilly: 'cold', freezing: 'cold' }
const PRIORITY: Record<string, PillarKey> = {
  comfy: 'COMFORT', comfortable: 'COMFORT', comfort: 'COMFORT', soft: 'COMFORT', stretchy: 'COMFORT', stretch: 'COMFORT',
  durable: 'QUALITY', last: 'QUALITY', lasts: 'QUALITY', lasting: 'QUALITY', quality: 'QUALITY', sturdy: 'QUALITY', heavyweight: 'QUALITY',
  fit: 'FIT', fits: 'FIT', sizing: 'FIT',
  cheap: 'STYLE_VALUE', value: 'STYLE_VALUE', affordable: 'STYLE_VALUE', budget: 'STYLE_VALUE',
  sustainable: 'SUSTAINABILITY', eco: 'SUSTAINABILITY', organic: 'SUSTAINABILITY', ethical: 'SUSTAINABILITY', recycled: 'SUSTAINABILITY',
}
const OCCASION = ['office', 'work', 'interview', 'wedding', 'gym', 'travel', 'weekend', 'campus', 'date', 'party', 'hiking']

export function parseIntent(q: string): SearchIntent {
  let text = q.toLowerCase().replace(/[’']/g, '')
  const intent: SearchIntent = { priorities: {}, terms: [] }
  const price = text.match(/(?:under|below|less than|max|up to|<)\s*\$?\s*(\d{1,4})/) ?? text.match(/\$\s*(\d{1,4})\b/)
  if (price) {
    intent.maxPrice = Number(price[1])
    text = text.replace(price[0], ' ')
  }
  for (const raw of text.split(/[\s,.;!?]+/)) {
    const w = raw.replace(/[^\p{L}\p{N}-]/gu, '')
    if (w.length < 2 || STOP.has(w)) continue
    if (CATEGORY[w]) intent.category ??= CATEGORY[w]
    else if (FIT[w]) intent.fit ??= FIT[w]
    else if (CLIMATE[w]) intent.climate ??= CLIMATE[w]
    else if (PRIORITY[w]) {
      const p = PRIORITY[w]
      intent.priorities[p] = 1.5
      if (p === 'SUSTAINABILITY') intent.sustainability = true
    } else if (OCCASION.includes(w)) intent.occasion ??= w
    else intent.terms.push(w)
  }
  intent.terms = [...new Set(intent.terms)].slice(0, 6)
  return intent
}

/** Answers to clarifying questions are stored as slot values and override the parsed intent. */
export type Answers = Partial<{ fit: Fit; maxPrice: number | 'any'; climate: Climate }>

export function applyAnswers(intent: SearchIntent, a: Answers): SearchIntent {
  return {
    ...intent,
    ...(a.fit && { fit: a.fit }),
    ...(a.climate && { climate: a.climate }),
    ...(a.maxPrice !== undefined && { maxPrice: a.maxPrice === 'any' ? undefined : a.maxPrice }),
  }
}
