/**
 * "Looks like" rule (B18), pure code. The fashion model gives every product a similarity to the shopper's
 * words; code decides which products count as a match. Calibrated on the dev images (2026-10-26): the right
 * items sit 0.06–0.08 above the pool's median and ≥ 0.095 absolute; words that aren't about looks ("soft",
 * "summer", "stretch", "shrink") lift every item by ≤ 0.04, and a print no product has ("guitar") by ≤ 0.02.
 */

/** Minimum similarity for a match. */
export const LOOK_MIN = 0.08
/** How far above the pool's median a match must stand (words that lift everything aren't looks). */
export const LOOK_LIFT = 0.05
/** Below this pool size the median says little: use a stricter absolute floor instead. */
export const SMALL_POOL = 6
export const SMALL_POOL_MIN = 0.1
/** If more than this share of the pool "matches", the words aren't specific: no visual filter. */
export const MAX_SHARE = 0.5

export const cosine = (a: number[], b: number[]) => {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

/** Product ids that look like the phrase, best first. Empty = no visual match (never a closest guess). */
export function lookAlike(sims: Map<string, number>): string[] {
  const vals = [...sims.values()].sort((a, b) => a - b)
  if (!vals.length) return []
  const median = vals[Math.floor(vals.length / 2)]
  const small = vals.length < SMALL_POOL
  const hits = [...sims]
    .filter(([, s]) => (small ? s >= SMALL_POOL_MIN : s >= LOOK_MIN && s - median >= LOOK_LIFT))
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
  return !small && hits.length > vals.length * MAX_SHARE ? [] : hits
}

const KIND_PHRASE: Record<string, string> = { tee: 't-shirt', shirt: 'shirt', jeans: 'jeans' }

/** The phrase the model compares photos with, e.g. "t-shirt with automobile". */
export function lookPhrase(kind: string | undefined, words: string[]) {
  return `${(kind && KIND_PHRASE[kind]) || 'clothing'} with ${words.join(' ')}`
}

/**
 * Which query words to try visually: words a photo label already matched, plus words no product's own text
 * or labels contain ("automobile", "tropical"). Words found in product text ("soft", "organic") stay text matches.
 */
export function visualWords(terms: string[], labelMatched: string[], inText: (t: string) => boolean) {
  return terms.filter((t) => t.length >= 3 && (labelMatched.includes(t) || !inText(t)))
}
