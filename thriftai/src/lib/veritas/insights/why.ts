/**
 * "Why this score" for brands (B9). Pure code: for each factor, how many overall points the product gains or
 * loses against the median of its category's published products, using the same weights as scoring v2.
 * Fixes are fixed texts per factor (no model), shown with the evidence counts behind them.
 */
import { FACTOR_TAXONOMY } from '../taxonomy/factor-taxonomy'
import { CORE_PILLARS, type PillarKey } from '../scoring/v2'

export type WhyFactorInput = { factor: string; value: number; evidenceCount: number }
export type WhyRow = {
  factor: string
  name: string
  pillar: PillarKey
  value: number
  median: number | null
  /** Overall points vs. the category median: negative = losing points. */
  points: number
  evidenceCount: number
  topIssue: { signal: string; count: number } | null
  fix: string | null
}
export type Why = {
  overall: number | null
  categoryMedian: number | null
  peers: number
  losses: WhyRow[]
  strengths: WhyRow[]
  missing: { factor: string; name: string; weight: number }[]
}

export const FIXES: Record<string, string> = {
  'fit.true_to_size': 'Correct the size chart or add a clear fit note (for example “runs small, size up”).',
  'fit.size_consistency': 'Check grading across batches and styles so one size fits the same everywhere.',
  'fit.body_shape_match': 'Show the item on more body types, or offer a cut that suits more shapes.',
  'fit.return_rate_fit': 'Add garment measurements and a fit note; fit returns are the most common cost.',
  'fit.length_proportions': 'Offer length options, or state inseam and body length clearly.',
  'fit.size_range': 'Extend the size range (plus, petite, tall).',
  'quality.fabric': 'Use a heavier or better fabric, and state the fabric weight.',
  'quality.construction': 'Reinforce seams and buttons; add a stitching check to QC.',
  'quality.wash_durability': 'Pre-shrink the fabric, test colourfastness and update the care label.',
  'quality.wear_resistance': 'Choose a fabric with better pilling and snag resistance.',
  'quality.longevity': 'Raise durability (fabric and construction), or offer repairs.',
  'quality.return_rate_quality': 'Investigate defects with the factory; inspect before shipping.',
  'style_value.value_for_money': 'Peers offer more for the price: reprice, or upgrade the item.',
  'style_value.price_fairness': 'Drop inflated “was” prices and keep prices steady.',
  'style_value.brand_reputation': 'Brand-wide: fixing the issues above across the range lifts this.',
  'style_value.looks_as_pictured': 'Re-shoot photos in natural light so the colour matches.',
  'style_value.trend_relevance': 'The style is fading; refresh the cut for next season.',
  'style_value.versatility': 'Add neutral colourways and show styling options.',
  'style_value.resale_value': 'Resale follows durability and trust; see the quality fixes.',
  'comfort.softness': 'Use a softer yarn or finish.',
  'comfort.breathability': 'Use a lighter, more breathable fabric for warm-weather lines.',
  'comfort.stretch_mobility': 'Add 1–2% elastane or a roomier cut.',
  'comfort.skin_friendly': 'Replace scratchy tags with printed labels; soften seams.',
  'comfort.easy_care': 'Make it machine washable.',
}

const median = (xs: number[]) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const round1 = (x: number) => Math.round(x * 10) / 10

export function explainScore(input: {
  overall: number | null
  factors: WhyFactorInput[]
  /** Published peers in the same category (the product itself excluded). */
  peers: { overall: number; factors: { factor: string; value: number }[] }[]
  /** Most common negative signal per factor, from the evidence behind the current score. */
  issues?: Record<string, { signal: string; count: number }>
}): Why {
  const byKey = new Map(input.factors.map((f) => [f.factor, f]))
  const core = FACTOR_TAXONOMY.filter((f) => f.pillar !== 'SUSTAINABILITY')

  // Same weighting as scoring v2: pillar share among pillars present × factor weight among factors present.
  const presentPillars = CORE_PILLARS.filter((p) => core.some((f) => f.pillar === p.key && byKey.has(f.key)))
  const pillarTotal = presentPillars.reduce((s, p) => s + p.weight, 0)

  const rows: WhyRow[] = []
  for (const p of presentPillars) {
    const inPillar = core.filter((f) => f.pillar === p.key && byKey.has(f.key))
    const wSum = inPillar.reduce((s, f) => s + f.weight, 0)
    for (const f of inPillar) {
      const own = byKey.get(f.key)!
      const med = median(input.peers.flatMap((x) => x.factors.filter((y) => y.factor === f.key).map((y) => y.value)))
      const delta = med === null ? 0 : own.value - med
      rows.push({
        factor: f.key,
        name: f.name,
        pillar: p.key,
        value: round1(own.value),
        median: med === null ? null : round1(med),
        points: round1((p.weight / pillarTotal) * (f.weight / wSum) * delta),
        evidenceCount: own.evidenceCount,
        topIssue: input.issues?.[f.key] ?? null,
        fix: FIXES[f.key] ?? null,
      })
    }
  }

  return {
    overall: input.overall,
    categoryMedian: median(input.peers.map((p) => p.overall)),
    peers: input.peers.length,
    losses: rows.filter((r) => r.points <= -0.3).sort((a, b) => a.points - b.points).slice(0, 5),
    strengths: rows.filter((r) => r.points >= 0.3).sort((a, b) => b.points - a.points).slice(0, 3),
    missing: core.filter((f) => !byKey.has(f.key)).map((f) => ({ factor: f.key, name: f.name, weight: f.weight })).sort((a, b) => b.weight - a.weight),
  }
}
