import 'server-only'
import { searchCatalog, type CatalogItem } from './catalog'
import type { Tag } from '../enrich/tags'

/**
 * Collections (B9): curated pages whose membership is a rule in code over stored scores and tags.
 * Ranked by Veritas Score. Each item shows the fact that got it in. Nobody can pay to be included.
 */
export type CollectionDef = {
  slug: string
  title: string
  blurb: string
  category?: 'TOPS' | 'BOTTOMS'
  /** Returns the qualifying fact, or null if the item doesn't qualify. */
  rule: (item: CatalogItem) => string | null
}

const tag = (item: CatalogItem, ...keys: string[]): Tag | undefined => item.tags.find((t) => keys.includes(t.key))
const noPriceWarning = (item: CatalogItem) => !item.tags.some((t) => t.group === 'price' && t.tone === 'warn')

export const COLLECTIONS: CollectionDef[] = [
  {
    slug: 'tees-that-hold-up',
    title: 'Tees that hold up in the wash',
    blurb: 'Owners report no shrinking, fading or twisting after repeated washes.',
    category: 'TOPS',
    rule: (i) => tag(i, 'quality.wash_durability:good')?.detail ?? null,
  },
  {
    slug: 'true-to-size-jeans',
    title: 'Jeans that fit true to size',
    blurb: 'Order your usual size: most owners say it fits, or few are sent back for fit.',
    category: 'BOTTOMS',
    rule: (i) => (tag(i, 'true_to_size', 'fit_returns_low')?.detail ?? null),
  },
  {
    slug: 'built-to-last',
    title: 'Built to last',
    blurb: 'Pieces owners are still wearing months later, with little pilling or wear.',
    rule: (i) => tag(i, 'quality.longevity:good', 'quality.wear_resistance:good')?.detail ?? null,
  },
  {
    slug: 'soft-and-breathable',
    title: 'Soft and breathable',
    blurb: 'Comfort first: soft on the skin and good in warm weather.',
    rule: (i) => tag(i, 'comfort.softness:good', 'comfort.breathability:good', 'comfort.skin_friendly:good')?.detail ?? null,
  },
  {
    slug: 'best-tees-under-30',
    title: 'Best tees under $30',
    blurb: 'The highest-scoring tees at $30 or less, with no fake sale prices.',
    category: 'TOPS',
    rule: (i) => (i.price <= 30 && noPriceWarning(i) ? `$${i.price.toFixed(2)}, no price warnings` : null),
  },
  {
    slug: 'honest-prices',
    title: 'Honest prices',
    blurb: 'No inflated “was” prices and not regularly cheaper elsewhere: buy now without waiting for a sale.',
    rule: (i) => (noPriceWarning(i) && i.tags.length > 0 ? 'No fake markdown or recent lower price in 90 days of history' : null),
  },
]

export type CollectionResult = { def: CollectionDef; items: { item: CatalogItem; why: string }[] }

export async function loadCollection(def: CollectionDef, limit = 24): Promise<CollectionResult> {
  const { items } = await searchCatalog({ category: def.category, sort: 'score', limit: 100 })
  const out = items
    .filter((i) => i.score !== null)
    .map((item) => ({ item, why: def.rule(item) }))
    .filter((x): x is { item: CatalogItem; why: string } => x.why !== null)
    .slice(0, limit)
  return { def, items: out }
}

export async function loadCollections() {
  return Promise.all(COLLECTIONS.map((d) => loadCollection(d)))
}

export const collectionBySlug = (slug: string) => COLLECTIONS.find((c) => c.slug === slug) ?? null
