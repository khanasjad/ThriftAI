/**
 * Personal Match, ranking and the 3 picks (backend plan §6 "Personal Match", product plan "Shopper experience").
 * Pure functions. Every reason shown to the shopper is built from a fact in the data, never generated.
 *
 *   final = 0.6 × Product Score + 0.4 × Personal Match, then a diversity rule
 *   picks = Best overall · Best value (score per dollar) · Wildcard (trending, sustainable or promising new launch)
 */
import type { PillarKey } from '../scoring/v2'
import type { Climate, Fit, SearchIntent, ShopperContext } from './intent'

export type Candidate = {
  id: string
  slug: string
  name: string
  brandSlug: string
  brandName: string
  category: string
  subcategory: string | null
  gender: string
  text: string
  fitType: string | null
  silhouette: string | null
  colors: string[]
  /** From the product photo (vision agent): pattern, colour names and families, style words. Null/empty until read. */
  pattern: string | null
  visualColors: string[]
  colorFamilies: string[]
  styleTags: string[]
  /** Tees: cropped / regular / longline (from name and silhouette). Null for other categories. */
  length: 'cropped' | 'regular' | 'longline' | null
  gsm: number | null
  elastanePct: number | null
  breathability: number | null
  trendTag: 'TRENDING' | 'CLASSIC' | 'FADING' | null
  launchDate: Date | null
  priceMin: number
  priceMax: number
  sellerCount: number
  score: number | null
  scoreWithSustainability: number | null
  label: 'HIGH' | 'MEDIUM' | 'LOW' | 'NEW_LAUNCH' | null
  earlyScore: number | null
  pillars: Partial<Record<PillarKey, number | null>>
  text_verified: { summary: string | null; sizeAdvice: string | null; downside: string | null } | null
  fitAnswers: { fitsAs: string; heightCm: number | null; bodyType: string | null }[]
}

export type MatchPart = { key: 'fit' | 'style' | 'climate' | 'budget' | 'priorities'; value: number; weight: number; reason?: string }
export type MatchResult = { score: number | null; parts: MatchPart[]; reasons: string[]; weight: number }

const clamp = (x: number) => Math.max(0, Math.min(100, x))
/** Plan: final = 0.6 × Product + 0.4 × Match, at full strength once enough is known about the shopper. */
const MATCH_WEIGHT = 0.4
/** Match part weight (of 100) at which the match gets its full 0.4; below it the match counts proportionally less. */
const FULL_MATCH_AT = 60
/** Below this much match evidence no match number is shown (one weak signal must not look like a verdict). */
export const SHOW_MATCH_AT = 35

// --- Personal Match components ------------------------------------------------

/** Fit answers from reviewers with a similar build (±7 cm and/or same body type). Needs ≥ 3 such answers. */
export function similarFit(c: Candidate, who: ShopperContext): MatchPart | null {
  if (!who.heightCm && !who.bodyType) return null
  const similar = c.fitAnswers.filter((a) => {
    const h = who.heightCm && a.heightCm ? Math.abs(a.heightCm - who.heightCm) <= 7 : null
    const b = who.bodyType && a.bodyType ? a.bodyType === who.bodyType : null
    return h === true || b === true ? h !== false && b !== false : false
  })
  if (similar.length < 3) return null
  const tts = similar.filter((a) => a.fitsAs === 'true_to_size').length
  const small = similar.filter((a) => a.fitsAs === 'runs_small').length
  const large = similar.filter((a) => a.fitsAs === 'runs_large').length
  const who_ = [who.heightCm && `around ${who.heightCm} cm`, who.bodyType && `with a ${who.bodyType} build`].filter(Boolean).join(' ')
  const top = tts >= small && tts >= large ? `true to size (${tts} of ${similar.length})` : small >= large ? `it runs small (${small} of ${similar.length})` : `it runs large (${large} of ${similar.length})`
  return { key: 'fit', value: clamp((tts / similar.length) * 100), weight: 35, reason: `Owners ${who_} say ${top}` }
}

const FIT_ORDER: Fit[] = ['slim', 'regular', 'relaxed', 'oversized']
function fitOf(c: Candidate): Fit | null {
  const t = `${c.fitType ?? ''} ${c.silhouette ?? ''}`.toLowerCase()
  if (/oversized|boxy/.test(t)) return 'oversized'
  if (/relaxed|wide|loose|bootcut/.test(t)) return 'relaxed'
  if (/slim|skinny|taper/.test(t)) return 'slim'
  if (/regular|straight|crew|classic|longline|v-neck/.test(t)) return 'regular'
  return null
}

export function styleFit(c: Candidate, want: Fit | null | undefined): MatchPart | null {
  if (!want) return null
  const have = fitOf(c)
  if (!have) return null
  const d = Math.abs(FIT_ORDER.indexOf(have) - FIT_ORDER.indexOf(want))
  const value = d === 0 ? 100 : d === 1 ? 60 : 20
  return { key: 'style', value, weight: 20, reason: d === 0 ? `${have[0].toUpperCase() + have.slice(1)} fit, as you asked` : undefined }
}

/** Climate: lighter fabric for hot weather, heavier for cold. Uses fabric weight vs. the item's typical range. */
export function climateFit(c: Candidate, climate: Climate | null | undefined): MatchPart | null {
  if (!climate || climate === 'mild' || !c.gsm) return null
  const bottoms = c.category === 'BOTTOMS'
  const [light, heavy] = bottoms ? [300, 380] : [150, 190]
  const lightness = clamp(((heavy - c.gsm) / (heavy - light)) * 100)
  const value = climate === 'hot' ? lightness : 100 - lightness
  const reason =
    climate === 'hot' && value >= 60 ? `Lighter ${c.gsm} gsm fabric suits hot weather` : climate === 'cold' && value >= 60 ? `Heavier ${c.gsm} gsm fabric suits cold weather` : undefined
  return { key: 'climate', value, weight: 15, reason }
}

export function budgetFit(c: Candidate, budget: number | null | undefined): MatchPart | null {
  if (!budget) return null
  const ratio = c.priceMin / budget
  // ≤ 70% of budget scores 100, at budget 70; over budget is filtered out before matching.
  const value = ratio <= 0.7 ? 100 : clamp(100 - ((ratio - 0.7) / 0.3) * 30)
  const reason = c.priceMin <= budget ? `$${Math.round(c.priceMin)}, within your $${budget} budget` : `$${Math.round(c.priceMin)}, a little over your $${budget} budget`
  return { key: 'budget', value, weight: 20, reason }
}

/** Pillar priorities: the product's pillars re-weighted by what the shopper cares about. Needs a published score. */
export function priorityFit(c: Candidate, priorities: Partial<Record<PillarKey, number>> | null | undefined): MatchPart | null {
  const entries = Object.entries(priorities ?? {}).filter(([, w]) => (w ?? 1) > 1) as [PillarKey, number][]
  if (!entries.length || c.score === null) return null
  const vals = entries.map(([k]) => c.pillars[k]).filter((v): v is number => typeof v === 'number')
  if (!vals.length) return null
  const value = vals.reduce((s, v) => s + v, 0) / vals.length
  const names: Record<PillarKey, string> = { FIT: 'fit', QUALITY: 'quality', STYLE_VALUE: 'value', COMFORT: 'comfort', SUSTAINABILITY: 'sustainability' }
  const best = entries.map(([k]) => [k, c.pillars[k]] as const).filter(([, v]) => typeof v === 'number').sort((a, b) => (b[1] as number) - (a[1] as number))[0]
  return { key: 'priorities', value, weight: 10, reason: best && (best[1] as number) >= 70 ? `Scores ${Math.round(best[1] as number)} on ${names[best[0]]}, which you care about` : undefined }
}

export function personalMatch(c: Candidate, intent: SearchIntent, who: ShopperContext): MatchResult {
  const priorities = { ...(who.priorities ?? {}), ...intent.priorities }
  const parts = [
    similarFit(c, who),
    styleFit(c, intent.fit ?? who.preferredFit),
    climateFit(c, intent.climate ?? who.climate),
    budgetFit(c, intent.maxPrice ?? who.budgetMax),
    priorityFit(c, priorities),
  ].filter((p): p is MatchPart => p !== null)
  if (!parts.length) return { score: null, parts, reasons: [], weight: 0 }
  const w = parts.reduce((s, p) => s + p.weight, 0)
  const score = Math.round(parts.reduce((s, p) => s + p.value * p.weight, 0) / w)
  const reasons = parts
    .filter((p) => p.reason && p.value >= 60)
    .sort((a, b) => b.value * b.weight - a.value * a.weight)
    .map((p) => p.reason!)
  return { score, parts, reasons, weight: w }
}

// --- Filtering, ranking, picks --------------------------------------------------

export type Ranked = Candidate & { productScore: number; match: number | null; final: number; reasons: string[]; relevance: number }

/** Up to this much over budget may fill picks when fewer than 3 products fit (always labelled). */
export const BUDGET_STRETCH = 1.25

/** Hard filters: category, budget, brand lists. Relevance from query terms (0 when there are none). */
const norm = (x: string) => x.toLowerCase().trim()
/** Colour names match by containment: "grey" matches "Heather Grey". */
const colorMatch = (productColor: string, wanted: string) => norm(productColor).includes(norm(wanted)) || norm(wanted).includes(norm(productColor))
/** Catalog colour names → families, so "blue" finds navy and indigo. Photo colour families add to these. */
const CATALOG_FAMILY: Record<string, string> = { black: 'black', white: 'white', ecru: 'beige', oatmeal: 'beige', cream: 'beige', 'heather grey': 'grey', grey: 'grey', navy: 'blue', sage: 'green', 'washed red': 'red', 'light vintage': 'blue', 'mid wash': 'blue', 'indigo rinse': 'blue' }
export function colorHit(c: Pick<Candidate, 'colors' | 'visualColors' | 'colorFamilies'>, wanted: string) {
  const w = norm(wanted)
  return c.colors.some((pc) => colorMatch(pc, w) || CATALOG_FAMILY[norm(pc)] === w) || c.visualColors.some((vc) => colorMatch(vc, w)) || c.colorFamilies.includes(w)
}

export function filterCandidates(cands: Candidate[], intent: SearchIntent, who: ShopperContext, budgetFactor = 1) {
  const budget = intent.maxPrice ?? who.budgetMax ?? undefined
  const colors = intent.colors ?? []
  const exclude = intent.excludeColors ?? []
  const cuts = (intent.cuts ?? []).map(norm)
  return cands
    .filter((c) => !intent.category || c.category === intent.category)
    .filter((c) => !intent.gender || c.gender === intent.gender || c.gender === 'UNISEX')
    .filter((c) => !budget || c.priceMin <= budget * budgetFactor)
    .filter((c) => !intent.minPrice || c.priceMax >= intent.minPrice)
    .filter((c) => !colors.length || colors.some((w) => colorHit(c, w)))
    .filter((c) => !intent.patterns?.length || (c.pattern !== null && intent.patterns.includes(c.pattern)))
    // Excluding a colour removes a product only when every colour it comes in is excluded.
    .filter((c) => !exclude.length || !c.colors.length || c.colors.some((pc) => !exclude.some((w) => colorMatch(pc, w))))
    .filter((c) => !cuts.length || cuts.some((k) => norm(c.silhouette ?? '').includes(k) || norm(c.name).includes(k.replace(/-/g, ' '))))
    .filter((c) => !intent.length || c.length === null || c.length === intent.length)
    .filter((c) => !(who.brandDeny ?? []).includes(c.brandSlug))
    .filter((c) => !(who.brandAllow ?? []).length || who.brandAllow!.includes(c.brandSlug))
    .map((c) => ({ c, relevance: intent.terms.filter((t) => c.text.includes(t)).length }))
    .filter((x) => intent.terms.length === 0 || x.relevance > 0 || intent.category !== undefined)
}

/**
 * Style match (4th parameter, per search): how many of the looks the shopper asked for this item has
 * (colour, pattern, fit, cut, length), from catalog data and the product photo. Null when nothing was asked.
 */
export function styleMatch(c: Candidate, intent: SearchIntent): { value: number; matched: string[]; missed: string[] } | null {
  const checks: [string, boolean][] = []
  if (intent.colors?.length) checks.push([intent.colors.join(' or '), intent.colors.some((w) => colorHit(c, w))])
  if (intent.patterns?.length) checks.push([intent.patterns.join(' or '), c.pattern !== null && intent.patterns.includes(c.pattern)])
  if (intent.fit) checks.push([`${intent.fit} fit`, fitOf(c) === intent.fit])
  if (intent.cuts?.length) checks.push([intent.cuts.join(' or ').replace(/-/g, ' '), intent.cuts.some((k) => norm(c.silhouette ?? '').includes(norm(k)))])
  if (intent.length) checks.push([`${intent.length} length`, c.length === intent.length])
  if (!checks.length) return null
  const matched = checks.filter(([, ok]) => ok).map(([k]) => k)
  return { value: Math.round((100 * matched.length) / checks.length), matched, missed: checks.filter(([, ok]) => !ok).map(([k]) => k) }
}

export function rank(cands: Candidate[], intent: SearchIntent, who: ShopperContext): { ranked: Ranked[]; unrated: number; stretch: Ranked[] } {
  const filtered = filterCandidates(cands, intent, who)
  const rated = filtered.filter(({ c }) => c.score !== null)
  const ranked = score(rated, intent, who)
  // Products a little over budget, used only to fill picks when fewer than 3 fit.
  const budget = intent.maxPrice ?? who.budgetMax ?? undefined
  const stretch = budget
    ? score(
        filterCandidates(cands, intent, who, BUDGET_STRETCH).filter(({ c }) => c.score !== null && c.priceMin > budget),
        intent,
        who,
      ).sort((a, b) => a.priceMin - b.priceMin || b.final - a.final)
    : []
  return { ranked, unrated: filtered.length - rated.length, stretch }
}

function score(items: { c: Candidate; relevance: number }[], intent: SearchIntent, who: ShopperContext): Ranked[] {
  const sustain = intent.sustainability ?? who.sustainabilityOn ?? false
  return items
    .map(({ c, relevance }) => {
      const productScore = (sustain && c.scoreWithSustainability !== null ? c.scoreWithSustainability : c.score)!
      const m = personalMatch(c, intent, who)
      // The match's share grows with how much we know: one weak signal (e.g. climate alone) can't outrank the score.
      const w = m.score === null ? 0 : MATCH_WEIGHT * Math.min(1, m.weight / FULL_MATCH_AT)
      const final = (1 - w) * productScore + w * (m.score ?? 0)
      const shown = m.weight >= SHOW_MATCH_AT ? m.score : null
      return { ...c, productScore, match: shown, final: Math.round(final * 10) / 10, reasons: m.reasons, relevance }
    })
    .sort((a, b) => b.relevance - a.relevance || b.final - a.final || a.slug.localeCompare(b.slug))
}

export type PickRole = 'best_overall' | 'best_value' | 'wildcard'
export type PickResult = Ranked & { role: PickRole; wildcardReason?: string; overBudget?: boolean }

/** Diversity: two picks may not share both brand and silhouette (near-duplicates). */
const tooSimilar = (a: Candidate, b: Candidate) => a.brandSlug === b.brandSlug && (a.silhouette ?? '') === (b.silhouette ?? '')

export function pickThree(ranked: Ranked[], stretch: Ranked[] = []): PickResult[] {
  if (!ranked.length) return fillFromStretch([], stretch)
  const picks: PickResult[] = []
  const ok = (c: Ranked) => !picks.some((p) => p.id === c.id || tooSimilar(p, c))

  // Best overall: highest final (ranked is already sorted by relevance, then final).
  picks.push({ ...ranked[0], role: 'best_overall' })

  // Best value: most score per dollar, among products scoring at least 85% of the best overall.
  const floor = picks[0].final * 0.85
  const value = ranked.filter((c) => ok(c) && c.final >= floor).sort((a, b) => b.productScore / b.priceMin - a.productScore / a.priceMin)[0]
  if (value) picks.push({ ...value, role: 'best_value' })

  // Wildcard: trending, strong on sustainability, or a promising new launch; else the next best.
  const special = (c: Ranked): string | undefined =>
    c.trendTag === 'TRENDING'
      ? 'Wildcard: on trend right now'
      : (c.pillars.SUSTAINABILITY ?? 0) >= 75
        ? 'Wildcard: strong on sustainability'
        : c.label === 'NEW_LAUNCH' && (c.earlyScore ?? 0) >= 65
          ? 'Wildcard: a new launch worth trying'
          : undefined
  const rest = ranked.filter(ok)
  const wild = rest.find((c) => special(c)) ?? rest[0]
  if (wild) picks.push({ ...wild, role: 'wildcard', wildcardReason: special(wild) ?? 'Wildcard: a different take' })
  return fillFromStretch(picks, stretch)
}

const ROLES: PickRole[] = ['best_overall', 'best_value', 'wildcard']

/** Fewer than 3 within budget: fill with the cheapest products a little over it, labelled as such. */
function fillFromStretch(picks: PickResult[], stretch: Ranked[]): PickResult[] {
  for (const c of stretch) {
    if (picks.length >= 3) break
    if (picks.some((p) => p.id === c.id || tooSimilar(p, c))) continue
    const role = ROLES.find((r) => !picks.some((p) => p.role === r))!
    picks.push({ ...c, role, overBudget: true, wildcardReason: role === 'wildcard' ? 'Wildcard: a little over budget' : undefined })
  }
  return picks.sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role))
}

// --- Clarifying question --------------------------------------------------------

export type Question = { slot: 'fit' | 'maxPrice' | 'climate'; question: string; chips: { label: string; value: string }[] }

const QUESTIONS: Question[] = [
  {
    slot: 'fit',
    question: 'How do you like it to fit?',
    chips: [
      { label: 'Slim', value: 'slim' },
      { label: 'Regular', value: 'regular' },
      { label: 'Relaxed', value: 'relaxed' },
      { label: 'Oversized', value: 'oversized' },
    ],
  },
  {
    slot: 'maxPrice',
    question: 'What’s your budget?',
    chips: [
      { label: 'Under $30', value: '30' },
      { label: 'Under $60', value: '60' },
      { label: 'Under $100', value: '100' },
      { label: 'No limit', value: 'any' },
    ],
  },
  {
    slot: 'climate',
    question: 'What weather will you wear it in?',
    chips: [
      { label: 'Hot', value: 'hot' },
      { label: 'Mild', value: 'mild' },
      { label: 'Cold', value: 'cold' },
    ],
  },
]

/**
 * Ask at most one question, and only if its answer would change the best pick (product plan).
 * Slots already known from the query, answers or profile are never asked.
 */
export function chooseQuestion(cands: Candidate[], intent: SearchIntent, who: ShopperContext, asked: string[]): Question | null {
  const known = {
    fit: intent.fit ?? who.preferredFit,
    maxPrice: intent.maxPrice ?? who.budgetMax,
    climate: intent.climate ?? who.climate,
  }
  for (const q of QUESTIONS) {
    if (known[q.slot] || asked.includes(q.slot)) continue
    const tops = new Set(
      q.chips.map((chip) => {
        const v = chip.value
        const variant: SearchIntent = { ...intent, ...(q.slot === 'fit' ? { fit: v as Fit } : q.slot === 'climate' ? { climate: v as Climate } : { maxPrice: v === 'any' ? undefined : Number(v) }) }
        const r = rank(cands, variant, who)
        return pickThree(r.ranked, r.stretch)[0]?.id ?? 'none'
      }),
    )
    if (tops.size > 1) return q
  }
  return null
}

export const MAX_QUESTIONS_PER_SEARCH = 2
