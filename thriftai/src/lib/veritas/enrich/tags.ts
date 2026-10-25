/**
 * Enrichment tags (B9): short shopper-facing labels such as "Runs small" or "Holds up in the wash",
 * built by code from stored factor scores and plain counts. Every tag carries the numbers behind it,
 * so it can be shown with its evidence and served through the Score API. No model is involved.
 */
import { RETURN_BENCHMARK } from '../evidence/structured'

export type Tag = {
  key: string
  label: string
  tone: 'good' | 'warn'
  /** The numbers behind the tag, in plain words. */
  detail: string
  group: 'fit' | 'quality' | 'comfort' | 'style' | 'price'
}

export type TagInputs = {
  category: 'TOPS' | 'BOTTOMS' | string
  factors: { factor: string; value: number; evidenceCount: number }[]
  fit: { small: number; large: number; tts: number; total: number }
  returns: { fit: number; quality: number; units: number | null }
  price: { fakeDiscount: boolean; oftenCheaper: boolean }
}

/** Factor score at or above GOOD (or at/below BAD) with at least MIN_EVIDENCE pieces → a tag. */
export const GOOD = 70
export const BAD = 35
export const MIN_EVIDENCE = 3
const MIN_FIT_ANSWERS = 5

const FACTOR_TAGS: { factor: string; group: Tag['group']; good?: string; bad?: string }[] = [
  { factor: 'quality.wash_durability', group: 'quality', good: 'Holds up in the wash', bad: 'Shrinks or fades' },
  { factor: 'quality.wear_resistance', group: 'quality', good: 'Resists pilling', bad: 'Pills or snags' },
  { factor: 'quality.longevity', group: 'quality', good: 'Lasts', bad: 'Wears out fast' },
  { factor: 'quality.construction', group: 'quality', good: 'Well made', bad: 'Weak seams' },
  { factor: 'comfort.softness', group: 'comfort', good: 'Soft', bad: 'Stiff or scratchy' },
  { factor: 'comfort.breathability', group: 'comfort', good: 'Breathable', bad: 'Runs hot' },
  { factor: 'comfort.skin_friendly', group: 'comfort', good: 'Gentle on skin', bad: 'Can itch' },
  { factor: 'comfort.stretch_mobility', group: 'comfort', good: 'Easy to move in', bad: 'Restrictive' },
  { factor: 'style_value.looks_as_pictured', group: 'style', good: 'Looks like the photos', bad: 'Not like the photos' },
  { factor: 'style_value.versatility', group: 'style', good: 'Goes with everything', bad: 'Hard to style' },
  { factor: 'fit.length_proportions', group: 'fit', good: 'Length is right', bad: 'Length is off' },
]

const pct = (x: number) => `${Math.round(x * 100)}%`

export function buildTags(i: TagInputs): Tag[] {
  const out: Tag[] = []

  // Fit, from reviewers' own fit answers.
  const { small, large, tts, total } = i.fit
  if (total >= MIN_FIT_ANSWERS) {
    if (small / total >= 0.4) out.push({ key: 'runs_small', label: 'Runs small', tone: 'warn', group: 'fit', detail: `${small} of ${total} owners say it runs small` })
    else if (large / total >= 0.4) out.push({ key: 'runs_large', label: 'Runs large', tone: 'warn', group: 'fit', detail: `${large} of ${total} owners say it runs large` })
    else if (tts / total >= 0.6) out.push({ key: 'true_to_size', label: 'True to size', tone: 'good', group: 'fit', detail: `${tts} of ${total} owners say true to size` })
  }

  // Return rates vs. the category benchmark.
  const bench = RETURN_BENCHMARK[i.category === 'BOTTOMS' ? 'BOTTOMS' : 'TOPS']
  if (i.returns.units && i.returns.units >= 50) {
    const fit = i.returns.fit / i.returns.units
    const quality = i.returns.quality / i.returns.units
    if (fit >= bench.fit * 1.5) out.push({ key: 'fit_returns_high', label: 'Often returned for fit', tone: 'warn', group: 'fit', detail: `${pct(fit)} of orders sent back for fit (typical ${pct(bench.fit)})` })
    else if (fit <= bench.fit * 0.6) out.push({ key: 'fit_returns_low', label: 'Rarely returned for fit', tone: 'good', group: 'fit', detail: `${pct(fit)} of orders sent back for fit (typical ${pct(bench.fit)})` })
    if (quality >= bench.quality * 1.4) out.push({ key: 'quality_returns_high', label: 'Quality returns', tone: 'warn', group: 'quality', detail: `${pct(quality)} returned for quality or defects (typical ${pct(bench.quality)})` })
  }

  // Factor scores with enough evidence.
  const byFactor = new Map(i.factors.map((f) => [f.factor, f]))
  for (const t of FACTOR_TAGS) {
    const f = byFactor.get(t.factor)
    if (!f || f.evidenceCount < MIN_EVIDENCE) continue
    const detail = `Scores ${Math.round(f.value)}/100 from ${f.evidenceCount} pieces of evidence`
    if (t.good && f.value >= GOOD) out.push({ key: `${t.factor}:good`, label: t.good, tone: 'good', group: t.group, detail })
    else if (t.bad && f.value <= BAD) out.push({ key: `${t.factor}:bad`, label: t.bad, tone: 'warn', group: t.group, detail })
  }

  // Price.
  if (i.price.fakeDiscount) out.push({ key: 'fake_discount', label: 'Fake sale price', tone: 'warn', group: 'price', detail: 'The “was” price was never charged in the last 90 days' })
  else if (i.price.oftenCheaper) out.push({ key: 'often_cheaper', label: 'Often cheaper', tone: 'warn', group: 'price', detail: 'It sold for noticeably less in the last 90 days; consider waiting' })

  return out
}

/** The few tags a card has room for: a fit tag first, then warnings, then strengths. */
export function topTags(tags: Tag[], n = 3): Tag[] {
  const fit = tags.find((t) => t.group === 'fit')
  const rest = tags.filter((t) => t !== fit).sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'warn' ? -1 : 1))
  return [...(fit ? [fit] : []), ...rest].slice(0, n)
}
