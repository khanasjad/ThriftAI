/**
 * "Better-scoring alternatives" (B9 recommendations). Pure code over stored scores:
 * same category, works for the same shopper (gender), scores clearly higher, at a similar or lower price.
 * Preference goes to items that fix the target's weakest pillar. The reason shown is a fact, not prose.
 */
export type AltPillars = { FIT: number | null; QUALITY: number | null; STYLE_VALUE: number | null; COMFORT: number | null }
export type AltItem = {
  id: string
  category: string
  gender: string
  price: number
  score: number | null
  pillars: AltPillars
}
export type Alternative<T extends AltItem> = { item: T; gain: number; reason: string }

export const MIN_GAIN = 4
export const MAX_PRICE_RATIO = 1.25

const PILLAR_NAME: Record<keyof AltPillars, string> = { FIT: 'fit', QUALITY: 'quality', STYLE_VALUE: 'style & value', COMFORT: 'comfort' }

function weakest(p: AltPillars): keyof AltPillars | null {
  const have = (Object.keys(p) as (keyof AltPillars)[]).filter((k) => p[k] !== null)
  return have.length ? have.reduce((a, b) => (p[b]! < p[a]! ? b : a)) : null
}

const genderOk = (a: string, b: string) => a === 'UNISEX' || b === 'UNISEX' || a === b

export function alternativesFor<T extends AltItem>(target: AltItem, pool: T[], n = 3): Alternative<T>[] {
  const weak = target.score === null ? null : weakest(target.pillars)
  const out = pool
    .filter((c) => c.id !== target.id && c.category === target.category && genderOk(c.gender, target.gender) && c.score !== null)
    .filter((c) => target.score === null || c.score! >= target.score + MIN_GAIN)
    .filter((c) => c.price <= target.price * MAX_PRICE_RATIO)
    .map((c) => {
      const gain = target.score === null ? 0 : c.score! - target.score
      const fix = weak && c.pillars[weak] !== null && target.pillars[weak] !== null ? c.pillars[weak]! - target.pillars[weak]! : 0
      const cheaper = c.price < target.price * 0.95
      // Score gain, plus credit for fixing the weak spot, minus a little for costing more.
      const rank = (target.score === null ? c.score! : gain) + Math.max(0, fix) * 0.5 - Math.max(0, (c.price - target.price) / target.price) * 20
      const parts = [
        target.score === null ? `Scores ${Math.round(c.score!)}` : `+${Math.round(gain)} overall`,
        weak && fix >= 5 ? `+${Math.round(fix)} on ${PILLAR_NAME[weak]}` : null,
        cheaper ? `$${Math.round(target.price - c.price)} cheaper` : null,
      ].filter(Boolean)
      return { item: c, gain, reason: parts.join(' · '), rank }
    })
    .sort((a, b) => b.rank - a.rank || a.item.id.localeCompare(b.item.id))
  return out.slice(0, n).map(({ item, gain, reason }) => ({ item, gain, reason }))
}
