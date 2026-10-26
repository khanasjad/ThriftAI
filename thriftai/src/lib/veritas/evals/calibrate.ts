/**
 * Calibration (product plan "Next 30 days": compare scores with expert picks and owner sentiment; adjust weights).
 * Pure code. Compares our stored scores with reference signals by rank (Spearman), finds the biggest disagreements,
 * and searches nearby pillar weights that would agree better. It never changes weights: a person reads the report
 * and decides (weights live in scoring/v2.ts CORE_PILLARS).
 */
import { CORE_PILLARS, blendEarly } from '../scoring/v2'

export type PillarValues = { FIT: number | null; QUALITY: number | null; STYLE_VALUE: number | null; COMFORT: number | null }
export type ScoredProduct = { id: string; slug: string; name: string; category: string; overall: number; pillars: PillarValues; /** New-launch blend inputs (scoring v2 rule 5). */ earlyScore?: number | null; reviewCount?: number }
/** A reference value per product: higher = better (return rate is passed already inverted). */
export type Reference = { key: string; label: string; independent: boolean; note: string; values: Map<string, number> }
export type Weights = Record<keyof PillarValues, number>

export const CURRENT_WEIGHTS: Weights = Object.fromEntries(CORE_PILLARS.map((p) => [p.key, p.weight])) as Weights
/** Below this many products per category, a correlation says little. */
export const MIN_N = 8
/** Weight search stays within ±this many points of today's weights (avoids over-fitting a small sample). */
export const MAX_SHIFT = 10
/** A weight change is only worth considering if it gains at least this much correlation. */
export const MIN_GAIN = 0.05

/** Ranks with ties averaged (1 = smallest). */
export function ranks(xs: number[]): number[] {
  const order = xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0])
  const out = new Array<number>(xs.length)
  for (let i = 0; i < order.length; ) {
    let j = i
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++
    for (let k = i; k <= j; k++) out[order[k][1]] = (i + j) / 2 + 1
    i = j + 1
  }
  return out
}

/** Spearman rank correlation (Pearson on ranks). Null with fewer than 3 pairs or no spread. */
export function spearman(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 3) return null
  const ra = ranks(a)
  const rb = ranks(b)
  const mean = (r: number[]) => r.reduce((s, x) => s + x, 0) / r.length
  const ma = mean(ra)
  const mb = mean(rb)
  let num = 0
  let da = 0
  let db = 0
  for (let i = 0; i < ra.length; i++) {
    num += (ra[i] - ma) * (rb[i] - mb)
    da += (ra[i] - ma) ** 2
    db += (rb[i] - mb) ** 2
  }
  return da && db ? num / Math.sqrt(da * db) : null
}

/** Overall from pillar values with given weights, over the pillars that have a value (same rule as scoring v2). */
export function reweigh(p: PillarValues, w: Weights): number | null {
  const have = (Object.keys(w) as (keyof PillarValues)[]).filter((k) => p[k] !== null)
  const total = have.reduce((s, k) => s + w[k], 0)
  return total ? have.reduce((s, k) => s + p[k]! * w[k], 0) / total : null
}

/** A product's overall under other weights, with the same new-launch blend as scoring v2. */
export function reweighProduct(p: ScoredProduct, w: Weights): number | null {
  return blendEarly(reweigh(p.pillars, w), p.earlyScore ?? null, p.reviewCount ?? 0)
}

/** Correlation per category (scores are compared within a category), combined as an n-weighted mean. */
function byCategory(products: ScoredProduct[], ref: Map<string, number>, value: (p: ScoredProduct) => number | null) {
  const cats = new Map<string, { a: number[]; b: number[] }>()
  for (const p of products) {
    const r = ref.get(p.id)
    const v = value(p)
    if (r === undefined || v === null) continue
    const c = cats.get(p.category) ?? { a: [], b: [] }
    c.a.push(v)
    c.b.push(r)
    cats.set(p.category, c)
  }
  const per = [...cats].map(([category, { a, b }]) => ({ category, n: a.length, rho: a.length >= MIN_N ? spearman(a, b) : null }))
  const used = per.filter((x) => x.rho !== null)
  const n = used.reduce((s, x) => s + x.n, 0)
  return { per, rho: n ? used.reduce((s, x) => s + x.rho! * x.n, 0) / n : null, n }
}

/** Every weight set within ±MAX_SHIFT of today's, in 5-point steps, summing to 100. */
export function nearbyWeights(base: Weights = CURRENT_WEIGHTS, step = 5): Weights[] {
  const keys = Object.keys(base) as (keyof Weights)[]
  const opts = (k: keyof Weights) => {
    const out: number[] = []
    for (let w = Math.max(5, base[k] - MAX_SHIFT); w <= base[k] + MAX_SHIFT; w += step) out.push(w)
    return out
  }
  const all: Weights[] = []
  for (const a of opts(keys[0])) for (const b of opts(keys[1])) for (const c of opts(keys[2])) {
    const d = 100 - a - b - c
    if (opts(keys[3]).includes(d)) all.push({ [keys[0]]: a, [keys[1]]: b, [keys[2]]: c, [keys[3]]: d } as Weights)
  }
  return all
}

export type ReferenceReport = {
  key: string
  label: string
  independent: boolean
  note: string
  n: number
  rho: number | null
  perCategory: { category: string; n: number; rho: number | null }[]
  perPillar: Record<keyof PillarValues, number | null>
  topAgreement: { k: number; shared: number } | null
  disagreements: { slug: string; name: string; category: string; ourRank: number; refRank: number; overall: number; pillars: PillarValues }[]
}

export type CalibrationReport = {
  references: ReferenceReport[]
  /** Recomputing today's weights from stored pillars vs. the stored overall (sanity check). */
  reweighCheck: { maxDiff: number; n: number }
  suggestion: { basis: string; current: Weights; best: Weights; rhoNow: number | null; rhoBest: number | null; gain: number; worthIt: boolean; reason: string } | null
}

export function calibrate(products: ScoredProduct[], refs: Reference[]): CalibrationReport {
  const references = refs.map((ref): ReferenceReport => {
    const overall = byCategory(products, ref.values, (p) => p.overall)
    const perPillar = Object.fromEntries(
      (Object.keys(CURRENT_WEIGHTS) as (keyof PillarValues)[]).map((k) => [k, byCategory(products, ref.values, (p) => p.pillars[k]).rho]),
    ) as Record<keyof PillarValues, number | null>
    // Top-k agreement and biggest disagreements, within each category.
    let shared = 0
    let k = 0
    const disagreements: ReferenceReport['disagreements'] = []
    for (const cat of new Set(products.map((p) => p.category))) {
      const ps = products.filter((p) => p.category === cat && ref.values.has(p.id))
      if (ps.length < MIN_N) continue
      const ours = [...ps].sort((a, b) => b.overall - a.overall)
      const theirs = [...ps].sort((a, b) => ref.values.get(b.id)! - ref.values.get(a.id)!)
      const kk = Math.max(3, Math.round(ps.length / 4))
      k += kk
      const top = new Set(theirs.slice(0, kk).map((p) => p.id))
      shared += ours.slice(0, kk).filter((p) => top.has(p.id)).length
      for (const p of ps) disagreements.push({ slug: p.slug, name: p.name, category: cat, ourRank: ours.indexOf(p) + 1, refRank: theirs.indexOf(p) + 1, overall: p.overall, pillars: p.pillars })
    }
    disagreements.sort((a, b) => Math.abs(b.ourRank - b.refRank) - Math.abs(a.ourRank - a.refRank))
    return { key: ref.key, label: ref.label, independent: ref.independent, note: ref.note, n: overall.n, rho: overall.rho, perCategory: overall.per, perPillar, topAgreement: k ? { k, shared } : null, disagreements: disagreements.slice(0, 5) }
  })

  let maxDiff = 0
  let checked = 0
  for (const p of products) {
    const r = reweighProduct(p, CURRENT_WEIGHTS)
    if (r === null) continue
    checked++
    maxDiff = Math.max(maxDiff, Math.abs(r - p.overall))
  }

  // Weights are tuned on independent references only (owner stars feed the score, so tuning on them is circular).
  const basis = refs.filter((r) => r.independent)
  let suggestion: CalibrationReport['suggestion'] = null
  if (basis.length) {
    const fitness = (w: Weights) => {
      const rs = basis.map((ref) => byCategory(products, ref.values, (p) => reweighProduct(p, w)))
      const n = rs.reduce((s, r) => s + (r.rho !== null ? r.n : 0), 0)
      return n ? rs.reduce((s, r) => s + (r.rho ?? 0) * (r.rho !== null ? r.n : 0), 0) / n : null
    }
    const rhoNow = fitness(CURRENT_WEIGHTS)
    let best = CURRENT_WEIGHTS
    let rhoBest = rhoNow
    // Ties go to the smallest change from today's weights.
    const shift = (w: Weights) => (Object.keys(w) as (keyof Weights)[]).reduce((s, k) => s + Math.abs(w[k] - CURRENT_WEIGHTS[k]), 0)
    for (const w of nearbyWeights()) {
      const f = fitness(w)
      if (f !== null && (rhoBest === null || f > rhoBest + 1e-9 || (Math.abs(f - rhoBest) <= 1e-9 && shift(w) < shift(best)))) {
        best = w
        rhoBest = f
      }
    }
    const n = Math.min(...basis.map((r) => byCategory(products, r.values, (p) => p.overall).n))
    const gain = rhoNow !== null && rhoBest !== null ? rhoBest - rhoNow : 0
    const worthIt = gain >= MIN_GAIN && n >= 3 * MIN_N
    suggestion = {
      basis: basis.map((r) => r.label).join(' + '),
      current: CURRENT_WEIGHTS,
      best,
      rhoNow,
      rhoBest,
      gain,
      worthIt,
      reason: worthIt
        ? `Agreement would rise by ${gain.toFixed(3)} on ${n} products. A person decides; change CORE_PILLARS in scoring/v2.ts and note it in the plan.`
        : n < 3 * MIN_N
          ? `Only ${n} products with an independent reference; need at least ${3 * MIN_N} before changing weights.`
          : `Best nearby weights gain only ${gain.toFixed(3)} (needs ≥ ${MIN_GAIN}): keep today's weights.`,
    }
  }
  return { references, reweighCheck: { maxDiff: Math.round(maxDiff * 10) / 10, n: checked }, suggestion }
}
