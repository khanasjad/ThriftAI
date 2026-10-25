/**
 * Dev only: the known pattern of each fictional product, decided from its slug (stable, no randomness).
 * The dev images are drawn with this pattern, so the vision agent's reading can be checked against it.
 */
export const PATTERNS = ['solid', 'striped', 'floral', 'polka-dot', 'plaid', 'graphic'] as const
export type Pattern = (typeof PATTERNS)[number]

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

/** Tees: 40% solid, 18% striped, 22% floral, 8% polka-dot, 4% plaid, 8% graphic. Jeans: solid denim. */
export function devPatternFor(slug: string, category: string): Pattern {
  if (category === 'BOTTOMS') return 'solid'
  // Salt v20 chosen so the fictional catalog has every pattern and a couple of navy florals for the demo search.
  const x = hash(`pattern:v20:${slug}`)
  return x < 0.4 ? 'solid' : x < 0.58 ? 'striped' : x < 0.8 ? 'floral' : x < 0.88 ? 'polka-dot' : x < 0.92 ? 'plaid' : 'graphic'
}
