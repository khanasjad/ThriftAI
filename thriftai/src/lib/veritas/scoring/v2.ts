/**
 * Scoring v2 (backend plan §6). Pure functions: evidence in, scores out. Never calls an LLM.
 *
 *   factor  = confidence-weighted mean sentiment → 0–100, shrunk toward the category mean
 *   pillar  = point-weighted mean of the factors that have evidence (missing factors are excluded, not guessed)
 *   overall = 35/30/20/15 weighted over the pillars that have evidence; sustainability is an optional +5%
 */
import { FACTOR_TAXONOMY, type Factor } from '../taxonomy/factor-taxonomy'

export const SCORE_VERSION = 'v2.0'

export type PillarKey = 'FIT' | 'QUALITY' | 'STYLE_VALUE' | 'COMFORT' | 'SUSTAINABILITY'
export const CORE_PILLARS: { key: Exclude<PillarKey, 'SUSTAINABILITY'>; weight: number }[] = [
  { key: 'FIT', weight: 35 },
  { key: 'QUALITY', weight: 30 },
  { key: 'STYLE_VALUE', weight: 20 },
  { key: 'COMFORT', weight: 15 },
]
const SUSTAINABILITY_SHARE = 0.05

/** One piece of evidence as scoring sees it. */
export type ScoringEvidence = {
  factor: string
  sentiment: number // −1 … +1
  confidence: number // 0 … 1, already reduced for flagged sources
}

export type Baseline = { mean: number; k: number }
export const DEFAULT_BASELINE: Baseline = { mean: 50, k: 8 }

export type FactorResult = {
  factor: string
  pillar: PillarKey
  weight: number
  raw: number // 0–100 before shrinkage
  value: number // 0–100 after shrinkage
  evidenceCount: number
  effectiveN: number // sum of evidence weights
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const round1 = (x: number) => Math.round(x * 10) / 10

/** Shrinkage: (n·raw + k·mean) / (n + k). n is the effective evidence weight. */
export function shrink(raw: number, n: number, b: Baseline) {
  return (n * raw + b.k * b.mean) / (n + b.k)
}

export function scoreFactor(factor: Factor, evidence: ScoringEvidence[], baseline: Baseline = DEFAULT_BASELINE): FactorResult | null {
  const ev = evidence.filter((e) => e.factor === factor.key && e.confidence > 0)
  if (ev.length === 0) return null
  const n = ev.reduce((s, e) => s + e.confidence, 0)
  const mean = ev.reduce((s, e) => s + clamp(e.sentiment, -1, 1) * e.confidence, 0) / n
  const raw = ((mean + 1) / 2) * 100
  return {
    factor: factor.key,
    pillar: factor.pillar as PillarKey,
    weight: factor.weight,
    raw: round1(raw),
    value: round1(shrink(raw, n, baseline)),
    evidenceCount: ev.length,
    effectiveN: round1(n),
    confidence: n >= 8 ? 'HIGH' : n >= 3 ? 'MEDIUM' : 'LOW',
  }
}

export type PillarResult = { pillar: PillarKey; value: number | null; coverage: number }

export function scorePillars(factors: FactorResult[]): Record<PillarKey, PillarResult> {
  const out = {} as Record<PillarKey, PillarResult>
  for (const pillar of ['FIT', 'QUALITY', 'STYLE_VALUE', 'COMFORT', 'SUSTAINABILITY'] as PillarKey[]) {
    const all = FACTOR_TAXONOMY.filter((f) => f.pillar === pillar)
    const total = all.reduce((s, f) => s + f.weight, 0)
    const have = factors.filter((f) => f.pillar === pillar)
    const w = have.reduce((s, f) => s + f.weight, 0)
    out[pillar] = {
      pillar,
      value: w > 0 ? round1(have.reduce((s, f) => s + f.value * f.weight, 0) / w) : null,
      coverage: total ? w / total : 0,
    }
  }
  return out
}

/** Share of the 95 core points (fit + quality + style/value + comfort) that has evidence. */
export function coreCoverage(factors: FactorResult[]) {
  const core = FACTOR_TAXONOMY.filter((f) => f.pillar !== 'SUSTAINABILITY')
  const total = core.reduce((s, f) => s + f.weight, 0)
  return factors.filter((f) => f.pillar !== 'SUSTAINABILITY').reduce((s, f) => s + f.weight, 0) / total
}

export function overallFrom(pillars: Record<PillarKey, PillarResult>) {
  const have = CORE_PILLARS.filter((p) => pillars[p.key].value !== null)
  if (have.length === 0) return { overall: null, withSustainability: null }
  const w = have.reduce((s, p) => s + p.weight, 0)
  const overall = have.reduce((s, p) => s + pillars[p.key].value! * p.weight, 0) / w
  const sus = pillars.SUSTAINABILITY.value
  // With sustainability on, the core pillars scale down proportionally so sustainability is 5% of the total.
  const withSustainability = sus === null ? null : overall * (1 - SUSTAINABILITY_SHARE) + sus * SUSTAINABILITY_SHARE
  return { overall, withSustainability }
}

export type Label = 'HIGH' | 'MEDIUM' | 'LOW' | 'NEW_LAUNCH'

/**
 * Confidence label (plan §6 rule 4). Thresholds are a starting point, tuned with evals in B6:
 * NEW_LAUNCH: < 10 reviews or launched < 30 days ago.
 * HIGH: ≥ 60% core coverage, ≥ 30 reviews, ≥ 40 evidence items. MEDIUM: ≥ 40% coverage, ≥ 15 reviews. Else LOW.
 */
export function confidenceLabel(input: { reviewCount: number; launchDate: Date | null; coverage: number; evidenceCount: number; now?: Date }): Label {
  const now = input.now ?? new Date()
  const ageDays = input.launchDate ? (now.getTime() - input.launchDate.getTime()) / 864e5 : Infinity
  if (input.reviewCount < 10 || ageDays < 30) return 'NEW_LAUNCH'
  if (input.coverage >= 0.6 && input.reviewCount >= 30 && input.evidenceCount >= 40) return 'HIGH'
  if (input.coverage >= 0.4 && input.reviewCount >= 15) return 'MEDIUM'
  return 'LOW'
}

/** New-launch blend (plan §6 rule 5): w = n / (n + 10), n = review count. */
export function blendEarly(evidenceScore: number | null, earlyScore: number | null, reviewCount: number) {
  if (earlyScore === null) return evidenceScore
  if (evidenceScore === null) return earlyScore
  const w = reviewCount / (reviewCount + 10)
  return w * evidenceScore + (1 - w) * earlyScore
}

export function grade(score: number) {
  return score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'
}

/**
 * Publishing rule: below this, factor scores are stored but no overall number is shown ("not enough evidence").
 * Code-only evidence (fit answers, spec, price, trend) reaches ~20–28% coverage, so a published score always
 * needs evidence read from review text as well. Decided 2026-10-24.
 */
export const MIN_CORE_COVERAGE = 0.35
export const MIN_CORE_PILLARS = 3

export type ProductScoreResult = {
  version: string
  factors: FactorResult[]
  pillars: Record<PillarKey, PillarResult>
  coverage: number
  overall: number | null
  overallWithSustainability: number | null
  publishable: boolean
  label: Label
  grade: string | null
  evidenceCount: number
  factorsIncluded: string[]
  factorsMissing: string[]
}

export function scoreProduct(input: {
  evidence: ScoringEvidence[]
  baselines?: Record<string, Baseline>
  reviewCount: number
  launchDate: Date | null
  earlyScore?: number | null
  /** True when some evidence was read from review or return text (the evidence agent). */
  hasTextEvidence?: boolean
  now?: Date
}): ProductScoreResult {
  const factors = FACTOR_TAXONOMY.map((f) => scoreFactor(f, input.evidence, input.baselines?.[f.key] ?? DEFAULT_BASELINE)).filter(
    (x): x is FactorResult => x !== null,
  )
  const pillars = scorePillars(factors)
  const coverage = coreCoverage(factors)
  const { overall, withSustainability } = overallFrom(pillars)
  const corePillars = CORE_PILLARS.filter((p) => pillars[p.key].value !== null).length
  const evidenceCount = factors.reduce((s, f) => s + f.evidenceCount, 0)
  const label = confidenceLabel({ reviewCount: input.reviewCount, launchDate: input.launchDate, coverage, evidenceCount, now: input.now })

  const blended = blendEarly(overall, input.earlyScore ?? null, input.reviewCount)
  // A published number needs broad evidence that includes what owners wrote, or a new-launch early score.
  const enoughEvidence = coverage >= MIN_CORE_COVERAGE && corePillars >= MIN_CORE_PILLARS && input.hasTextEvidence !== false
  const publishable = blended !== null && (enoughEvidence || input.earlyScore != null)
  const final = publishable && blended !== null ? Math.round(clamp(blended, 0, 100)) : null
  const included = new Set(factors.map((f) => f.factor))

  return {
    version: SCORE_VERSION,
    factors,
    pillars,
    coverage: Math.round(coverage * 1000) / 1000,
    overall: final,
    overallWithSustainability: final !== null && withSustainability !== null ? Math.round(clamp(blendEarly(withSustainability, input.earlyScore ?? null, input.reviewCount)!, 0, 100)) : null,
    publishable,
    label,
    grade: final === null ? null : grade(final),
    evidenceCount,
    factorsIncluded: [...included],
    factorsMissing: FACTOR_TAXONOMY.map((f) => f.key).filter((k) => !included.has(k)),
  }
}

/** Category means from pooled raw factor values, for shrinkage. Needs ≥ 3 products with evidence for a factor. */
export function computeBaselines(rawByProduct: { factor: string; raw: number }[][], k = DEFAULT_BASELINE.k): Record<string, Baseline> {
  const acc = new Map<string, number[]>()
  for (const product of rawByProduct) for (const f of product) acc.set(f.factor, [...(acc.get(f.factor) ?? []), f.raw])
  const out: Record<string, Baseline> = {}
  for (const [factor, xs] of acc) if (xs.length >= 3) out[factor] = { mean: round1(xs.reduce((s, x) => s + x, 0) / xs.length), k }
  return out
}
