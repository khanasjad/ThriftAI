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

/** Tees: 40% solid, 18% striped, 22% floral, 8% polka-dot, 4% plaid, 8% graphic. Shirts: 35% solid, 25% striped, 20% plaid, 20% floral. Jeans: solid denim. */
export function devPatternFor(slug: string, category: string, subcategory?: string | null): Pattern {
  if (category === 'BOTTOMS') return 'solid'
  if (subcategory === 'shirt') {
    const y = hash(`shirt-pattern:v1:${slug}`)
    return y < 0.35 ? 'solid' : y < 0.6 ? 'striped' : y < 0.8 ? 'plaid' : 'floral'
  }
  // Salt v20 chosen so the fictional catalog has every pattern and a couple of navy florals for the demo search.
  const x = hash(`pattern:v20:${slug}`)
  // A third of plain tees get a chest print (B17), so print search ("car t-shirt") has something to find.
  if (x < 0.4) return hash(`print:${slug}`) < 0.35 ? 'graphic' : 'solid'
  return x < 0.4 ? 'solid' : x < 0.58 ? 'striped' : x < 0.8 ? 'floral' : x < 0.88 ? 'polka-dot' : x < 0.92 ? 'plaid' : 'graphic'
}

/** Dev only: the chest print drawn on a fictional graphic item. The football crest is made up ("FC"), not a real club. */
export const DEV_PRINTS = ['car', 'palm-tree', 'guitar', 'sun-mountains', 'football-crest'] as const
export type DevPrint = (typeof DEV_PRINTS)[number]
export function devPrintFor(slug: string, category: string, subcategory?: string | null): DevPrint | null {
  if (devPatternFor(slug, category, subcategory) !== 'graphic') return null
  // Salt v10 chosen so the six printed tees include cars, a palm tree and the crest (demo searches).
  return DEV_PRINTS[Math.floor(hash(`print-kind:v10:${slug}`) * DEV_PRINTS.length)]
}

/** Picks the drawing for a print from what the photo agent read ("red race car" → car). */
export function printFromMotifs(labels: string[]): DevPrint | null {
  const t = labels.join(' ').toLowerCase()
  if (/\bcar|vehicle|truck/.test(t)) return 'car'
  if (/palm/.test(t)) return 'palm-tree'
  if (/guitar/.test(t)) return 'guitar'
  if (/crest|shield|badge|club/.test(t)) return 'football-crest'
  if (/mountain|sun/.test(t)) return 'sun-mountains'
  return null
}

