/**
 * Catalog facets for the shopkeeper agent: what can actually be asked about, with counts, for the products
 * that still match. Chips are built from these, so the agent never offers a colour or cut the catalog lacks.
 */
import type { SearchIntent } from './intent'
import type { Candidate } from './rank'
import { filterCandidates } from './rank'

export type Facets = {
  matching: number
  categories: { value: 'TOPS' | 'BOTTOMS'; label: string; count: number }[]
  genders: { value: 'MENS' | 'WOMENS' | 'UNISEX'; label: string; count: number }[]
  priceBands: { label: string; min: number | null; max: number | null; count: number }[]
  colors: { value: string; count: number }[]
  fits: { value: string; count: number }[]
  cuts: { value: string; count: number }[]
  lengths: { value: string; count: number }[]
  /** Surface patterns read from product photos. */
  patterns: { value: string; count: number }[]
}

const tally = (xs: (string | null)[]) => {
  const m = new Map<string, number>()
  for (const x of xs) if (x) m.set(x, (m.get(x) ?? 0) + 1)
  return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

const roundTo = (x: number) => (x < 50 ? Math.round(x / 5) * 5 : Math.round(x / 10) * 10)

/**
 * Facets for the products matching everything except the facet itself (standard faceted-search behaviour),
 * so a question about colour shows all colours available within the chosen category and budget.
 */
export function buildFacets(cands: Candidate[], intent: SearchIntent): Facets {
  const without = (patch: Partial<SearchIntent>) => filterCandidates(cands, { ...intent, ...patch }, {}).map((x) => x.c)
  const all = filterCandidates(cands, intent, {}).map((x) => x.c)

  const forPrice = without({ minPrice: undefined, maxPrice: undefined })
  const prices = forPrice.map((c) => c.priceMin).sort((a, b) => a - b)
  const q = (p: number) => (prices.length ? roundTo(prices[Math.floor((prices.length - 1) * p)]) : 0)
  const [b1, b2, b3] = [q(0.33), q(0.66), q(0.9)]
  const bands = prices.length
    ? [
        { label: `Under $${b1}`, min: null, max: b1 },
        { label: `$${b1}–$${b2}`, min: b1, max: b2 },
        { label: `$${b2}–$${b3}`, min: b2, max: b3 },
        { label: 'No limit', min: null, max: null },
      ]
        .filter((b, i, arr) => i === 0 || b.max === null || b.max > (arr[i - 1].max ?? 0))
        .map((b) => ({ ...b, count: forPrice.filter((c) => (b.min === null || c.priceMin >= b.min) && (b.max === null || c.priceMin <= b.max)).length }))
    : []

  const forColor = without({ colors: [], excludeColors: [] })
  const forFit = without({ fit: undefined })
  const forCut = without({ cuts: [] })
  const forLength = without({ length: undefined })
  const forCategory = without({ category: undefined })
  const forGender = without({ gender: undefined })
  const forPattern = without({ patterns: [] })

  return {
    matching: all.length,
    categories: (['TOPS', 'BOTTOMS'] as const)
      .map((v) => ({ value: v, label: v === 'TOPS' ? 'Tees' : 'Jeans', count: forCategory.filter((c) => c.category === v).length }))
      .filter((x) => x.count > 0),
    genders: (['WOMENS', 'MENS', 'UNISEX'] as const)
      .map((v) => ({ value: v, label: v === 'MENS' ? 'Men' : v === 'WOMENS' ? 'Women' : 'Unisex', count: forGender.filter((c) => c.gender === v).length }))
      .filter((x) => x.count > 0),
    priceBands: bands,
    colors: tally(forColor.flatMap((c) => c.colors)),
    fits: tally(forFit.map((c) => c.fitType)),
    cuts: tally(forCut.map((c) => c.silhouette)),
    lengths: tally(forLength.map((c) => c.length)),
    patterns: tally(forPattern.map((c) => c.pattern)),
  }
}

/** Compact text for the agent's prompt (volatile per turn, so it goes in the message, not the system prompt). */
export function facetsText(f: Facets) {
  const list = (xs: { value: string; count: number }[]) => (xs.length ? xs.map((x) => `${x.value} (${x.count})`).join(', ') : 'none')
  return [
    `Products matching so far: ${f.matching}`,
    `Categories: ${f.categories.map((c) => `${c.label} (${c.count})`).join(', ')}`,
    `For (gender): ${f.genders.map((g) => `${g.label} (${g.count})`).join(', ')} (unisex items match everyone)`,
    `Price bands: ${f.priceBands.map((b) => `${b.label} (${b.count})`).join(', ') || 'n/a'}`,
    `Colours: ${list(f.colors)}`,
    `Fits: ${list(f.fits)}`,
    `Cuts: ${list(f.cuts)}`,
    `Tee lengths: ${list(f.lengths)}`,
    `Patterns (from product photos): ${list(f.patterns)}`,
  ].join('\n')
}
