/**
 * Deterministic checks (B6, $0): does what Veritas stored for a product agree with the golden labels?
 * Each label maps to a factor value (0–100) or a fact. A missing factor is "no_evidence", never a fail:
 * coverage and agreement are reported separately so thin evidence can't look like accuracy.
 */
import type { Label } from './golden'

export type ProductState = {
  factors: Record<string, number> // factor key → raw evidence value (0–100, before shrinkage)
  fitAnswers: { small: number; tts: number; large: number }
  /** Evidence rows taken from reviews that the injection scan flags. */
  injectionEvidence: { total: number; flagged: number } | null
  hasInjectionReview: boolean
}

export type CheckResult = { key: Label['key']; expect: string; got: string; status: 'pass' | 'fail' | 'no_evidence' }

const LOW = 45
const HIGH = 55

function band(v: number | undefined, lowLabel: string, highLabel: string): string | null {
  if (v === undefined) return null
  return v < LOW ? lowLabel : v > HIGH ? highLabel : 'neutral'
}

export function checkLabel(l: Label, s: ProductState): CheckResult {
  const r = (got: string | null, pass: (g: string) => boolean): CheckResult =>
    got === null ? { key: l.key, expect: l.expect, got: '—', status: 'no_evidence' } : { key: l.key, expect: l.expect, got, status: pass(got) ? 'pass' : 'fail' }

  switch (l.key) {
    case 'fit': {
      // Majority of reviewers' fit answers (≥ 5), cross-checked with the true-to-size factor.
      const { small, tts, large } = s.fitAnswers
      const n = small + tts + large
      if (n < 5) return r(null, () => false)
      const got = small > tts && small > large ? 'runs_small' : large > tts && large > small ? 'runs_large' : 'true_to_size'
      return r(got, (g) => g === l.expect)
    }
    case 'wash':
      return r(band(s.factors['quality.wash_durability'], 'poor', 'good'), (g) => g === l.expect)
    case 'pilling':
      return r(band(s.factors['quality.wear_resistance'], 'present', 'absent'), (g) => g === 'present')
    case 'fabric':
      return r(band(s.factors['quality.fabric'], 'thin', 'premium'), (g) => g === l.expect)
    case 'construction':
      return r(band(s.factors['quality.construction'], 'poor', 'solid'), (g) => g === 'poor')
    case 'softness':
      return r(band(s.factors['comfort.softness'], 'stiff', 'soft'), (g) => g === l.expect)
    case 'photo':
      return r(band(s.factors['style_value.looks_as_pictured'], 'inaccurate', 'accurate'), (g) => g === 'inaccurate')
    case 'size_consistency':
      return r(band(s.factors['fit.size_consistency'], 'inconsistent', 'consistent'), (g) => g === 'inconsistent')
    case 'injection': {
      // Pass when the product's injection review contributed no full-weight evidence.
      if (!s.hasInjectionReview || !s.injectionEvidence) return r(null, () => false)
      const { total, flagged } = s.injectionEvidence
      return r(total === 0 ? 'no evidence used' : `${flagged}/${total} flagged`, () => total === flagged)
    }
  }
}

export function summarise(results: CheckResult[]) {
  const pass = results.filter((r) => r.status === 'pass').length
  const fail = results.filter((r) => r.status === 'fail').length
  const judged = pass + fail
  return {
    total: results.length,
    pass,
    fail,
    noEvidence: results.length - judged,
    agreement: judged ? pass / judged : null,
    coverage: results.length ? judged / results.length : 0,
  }
}
