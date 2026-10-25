/**
 * Golden set (B6): 15 dev products with expected labels.
 *
 * Labels come from the dataset generator's hidden ground truth (`_truth` in prisma/fixtures/dev-dataset.json),
 * using the SAME thresholds the generator used to write review text, so every label is something the
 * reviews actually say. They are generator labels, not human-written ones; the report says so.
 */

export type Truth = {
  fitOffset: number
  sizeInconsistent: boolean
  lengthIssue: 'none' | 'long' | 'short'
  fabric: number
  construction: number
  washDurability: number
  pillingRisk: number
  softness: number
  photoAccuracy: number
  notes: string[]
}

export type Label =
  | { key: 'fit'; expect: 'runs_small' | 'true_to_size' | 'runs_large' }
  | { key: 'wash'; expect: 'poor' | 'good' }
  | { key: 'pilling'; expect: 'present' }
  | { key: 'fabric'; expect: 'premium' | 'thin' }
  | { key: 'construction'; expect: 'poor' }
  | { key: 'softness'; expect: 'soft' | 'stiff' }
  | { key: 'photo'; expect: 'inaccurate' }
  | { key: 'size_consistency'; expect: 'inconsistent' }
  | { key: 'injection'; expect: 'flagged' }

/** Thresholds mirror scripts/dev/generate-dataset.ts (fitLine, qualityLines, comfortLine, photoLine). */
export function labelsFrom(t: Truth): Label[] {
  const out: Label[] = []
  out.push({ key: 'fit', expect: t.fitOffset < -0.2 ? 'runs_small' : t.fitOffset > 0.2 ? 'runs_large' : 'true_to_size' })
  if (t.washDurability < 0.45) out.push({ key: 'wash', expect: 'poor' })
  else if (t.washDurability > 0.75) out.push({ key: 'wash', expect: 'good' })
  if (t.pillingRisk > 0.6) out.push({ key: 'pilling', expect: 'present' })
  if (t.fabric > 0.8) out.push({ key: 'fabric', expect: 'premium' })
  else if (t.fabric < 0.4) out.push({ key: 'fabric', expect: 'thin' })
  if (t.construction < 0.4) out.push({ key: 'construction', expect: 'poor' })
  if (t.softness > 0.65) out.push({ key: 'softness', expect: 'soft' })
  else if (t.softness < 0.35) out.push({ key: 'softness', expect: 'stiff' })
  if (t.photoAccuracy < 0.55) out.push({ key: 'photo', expect: 'inaccurate' })
  if (t.sizeInconsistent) out.push({ key: 'size_consistency', expect: 'inconsistent' })
  if (t.notes.includes('has_injection_review')) out.push({ key: 'injection', expect: 'flagged' })
  return out
}

/** Strength of a product's signals, used to fill the golden set after the edge cases. */
function signalStrength(t: Truth) {
  return Math.abs(t.fitOffset) + Math.max(0, t.pillingRisk - 0.6) * 2 + Math.max(0, 0.45 - t.washDurability) * 2 + Math.max(0, 0.55 - t.photoAccuracy) * 2 + (t.sizeInconsistent ? 0.3 : 0)
}

export const GOLDEN_SIZE = 15

/** Deterministic pick: every edge case first (injection, non-English, new launch, price tricks), then the strongest signals. */
export function pickGolden(products: { slug: string; truth: Truth }[]): { slug: string; truth: Truth; labels: Label[]; why: string }[] {
  const edge = products.filter((p) => p.truth.notes.length > 0).sort((a, b) => a.slug.localeCompare(b.slug))
  const rest = products
    .filter((p) => p.truth.notes.length === 0)
    .sort((a, b) => signalStrength(b.truth) - signalStrength(a.truth) || a.slug.localeCompare(b.slug))
  return [...edge.map((p) => ({ ...p, why: p.truth.notes.join(', ') })), ...rest.map((p) => ({ ...p, why: 'strong signals' }))]
    .slice(0, GOLDEN_SIZE)
    .map((p) => ({ ...p, labels: labelsFrom(p.truth) }))
}
