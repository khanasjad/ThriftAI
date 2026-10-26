/**
 * Autosuggest (B9). Pure: builds query completions from what's actually in the catalog
 * (colour + item, fit + item, cut + item, brand) and matches products and collections by word prefix.
 * Products are ordered by Veritas Score, never by anything paid.
 */
export type SuggestProduct = {
  slug: string
  name: string
  brand: string
  category: string
  subcategory: string | null
  silhouette: string | null
  fitType: string | null
  colors: string[]
  price: number
  score: number | null
}
export type SuggestCollection = { slug: string; title: string }
export type Suggestions = { queries: string[]; products: SuggestProduct[]; collections: SuggestCollection[] }

const ITEM = (p: SuggestProduct) => (p.category === 'BOTTOMS' ? 'jeans' : p.subcategory === 'shirt' ? 'shirt' : 'tee')
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9$ ]+/g, ' ').replace(/\s+/g, ' ').trim()

/** Phrases a shopper might type, with how many products each would find. */
export function buildVocabulary(products: SuggestProduct[]): Map<string, number> {
  const v = new Map<string, number>()
  const add = (phrase: string) => {
    const k = norm(phrase)
    if (k) v.set(k, (v.get(k) ?? 0) + 1)
  }
  for (const p of products) {
    const item = ITEM(p)
    add(item === 'tee' ? 't-shirt' : item)
    for (const c of p.colors) add(`${c} ${item}`)
    if (p.fitType) add(`${p.fitType} ${item}`)
    if (p.silhouette) add(p.silhouette.includes('tee') || p.silhouette.includes('shirt') ? p.silhouette.replace(/-/g, ' ') : `${p.silhouette.replace(/-/g, ' ')} jeans`)
    add(p.brand)
  }
  return v
}

/** Every query word must be a prefix of some word in the text ("whi te" → "white tee"). */
export function prefixMatch(query: string, text: string) {
  const words = norm(text).split(' ')
  return norm(query)
    .split(' ')
    .filter(Boolean)
    .every((q) => words.some((w) => w.startsWith(q)))
}

export function suggest(q: string, products: SuggestProduct[], collections: SuggestCollection[], vocab = buildVocabulary(products)): Suggestions {
  const query = norm(q)
  if (query.length < 2) return { queries: [], products: [], collections: [] }
  const queries = [...vocab.entries()]
    .filter(([phrase]) => prefixMatch(query, phrase) && phrase !== query)
    .sort((a, b) => Number(b[0].startsWith(query)) - Number(a[0].startsWith(query)) || b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([phrase]) => phrase)
  const prods = products
    .filter((p) => prefixMatch(query, `${p.brand} ${p.name} ${p.colors.join(' ')} ${p.fitType ?? ''} ${ITEM(p)} ${p.category === 'BOTTOMS' ? 'denim' : p.subcategory === 'shirt' ? 'shirt button-up top' : 't-shirt top'}`))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.slug.localeCompare(b.slug))
    .slice(0, 4)
  const cols = collections.filter((c) => prefixMatch(query, c.title)).slice(0, 2)
  return { queries, products: prods, collections: cols }
}
